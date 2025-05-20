const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const Game = require('./models/Game');
const Question = require('./models/Question');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://parca.local',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
    },
    path: '/socket.io'
  });

  io.use((socket, next) => {
    const header = socket.handshake.headers.cookie;
    if (!header) return next(new Error('No cookie'));
    const cookies = cookie.parse(header);
    const token = cookies.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  const rooms = {}; // code → { host, hostUserId, players, pendingRemovals }
  
  io.on('connection', socket => {
  
    socket.on('createRoom', async (payload, ack) => {
      try {
        const { code } = payload;        
        rooms[code] = {
          host: socket.id,
          hostUserId: socket.userId,
          players: [{
            socketId: socket.id,
            userId: socket.userId,
            username: socket.username,
            ready: false
          }],
          pendingRemovals: new Map(),
          messages: [],
          questions: [], 
          currentQ: 0,
          lives: {},
          turnOrder: [],
          turnIndex: 0
        };
  
        await socket.join(code);
        
        if (typeof ack === 'function') {
          ack(rooms[code]);
        }
        
        io.to(code).emit('roomData', rooms[code]);
      } catch (error) {
        console.error('Error al crear sala:', error);
        if (typeof ack === 'function') {
          ack({ error: 'Error al crear sala' });
        }
      }
    });
  
    // Unirse a sala
    socket.on('joinRoom', async (payload, ack) => {
      const { code } = payload;
          
      const room = rooms[code];
      if (!room) {
        return socket.emit('errorMessage', 'La sala no existe');
      }
  
      const existingPlayer = room.players.find(p => p.userId === socket.userId);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
      } else {
        room.players.push({
          socketId: socket.id,
          userId: socket.userId,
          username: socket.username,
          ready: false
        });
      }
  
      await socket.join(code);
      
      if (typeof ack === 'function') {
        ack(room);
      }
      
      io.to(code).emit('roomData', room);
    });
    
    socket.on('playerReady', ({ code }) => {
      const room = rooms[code];
      if (!room) return;
      room.players = room.players.map(p =>
        p.socketId === socket.id ? { ...p, ready: !p.ready } : p
      );
      io.to(code).emit('roomData', room);
    });
  
    // Iniciar Partida
    socket.on('startGame', async ({ code }) => {
      const room = rooms[code];
      if (!room) return;
      if (socket.userId !== room.hostUserId) {
        return socket.emit('errorMessage', 'Solo el creador puede iniciar la partida');
      }
      if (!room.players.every(p => p.ready)) {
        return socket.emit('errorMessage', 'Todos deben estar listos');
      }
  
      //Cargar 1000 preguntas
      const picks = await Question.aggregate([{ $sample: { size: 1000 } }]);
      room.questions = picks;
      room.currentQ  = 0;
      
      //Vidas y turnos
      room.lives     = {};
      room.turnOrder = room.players.map(p => p.userId);
      room.turnIndex = 0;
      room.turnOrder.forEach(id => room.lives[id] = 4);
  
      room.startTime = Date.now(); // Guardamos el timestamp en milisegundos
      
      io.to(code).emit('gameStarted', {
        question: picks[0],
        turnUserId: room.turnOrder[0],
        lives: room.lives
      });
    });
  
    socket.on('sendMessage', ({ code, message }) => {
      const room = rooms[code];
      if (!room) return;
  
      const messageData = {
        userId: socket.userId,
        username: socket.username,
        message,
        timestamp: Date.now()
      };
  
      room.messages.push(messageData);
      // Mantener solo los últimos 50 mensajes
      if (room.messages.length > 50) {
        room.messages.shift();
      }
  
      io.to(code).emit('newMessage', messageData);
    });
  
    socket.on('submitAnswer', ({ code, answer }) => {
      const room = rooms[code];
      if (!room) return;
      const userId = socket.userId;
      // Solo el que tiene el turno puede responder
      if (userId !== room.turnOrder[room.turnIndex]) return;
      
      const q = room.questions[room.currentQ];
      const correct = (answer === q.correctAnswer);
      if (!correct) {
        room.lives[userId]--;
      }
      // Notificar resultado a todos
      io.to(code).emit('answerResult', {
        userId,
        username: socket.username,
        answer,
        correct,
        correctAnswer: q.correctAnswer,
        lives: room.lives
      });
    
      // Eliminar de turno si sin vidas
      if (room.lives[userId] <= 0) {
        io.to(code).emit('playerEliminated', {
          userId,
          username: socket.username
        });
        room.turnOrder = room.turnOrder.filter(id => id !== userId);
        room.turnIndex = room.turnIndex % room.turnOrder.length;
      }
    
      if (room.turnOrder.length === 1) {
        const winner = room.players.find(p => p.userId === room.turnOrder[0]);
        const duration = Math.round((Date.now() - room.startTime) / 1000); // Convertimos a segundos
        
        io.to(code).emit('gameEnded', { 
          winner,
          duration  // Enviamos directamente la duración en segundos
        });
        delete rooms[code];
        return;
      }
    
      // Avanzar turno y pregunta
      room.currentQ++;
      room.turnIndex = (room.turnIndex + 1) % room.turnOrder.length;
      const nextQ = room.questions[room.currentQ];
      const nextUser = room.turnOrder[room.turnIndex];
      io.to(code).emit('nextTurn', {
        question: nextQ,
        turnUserId: nextUser,
        lives: room.lives
      });
    });
  
    socket.on('playerEliminated', ({ userId, username }) => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeEliminated = currentTime - room.startTime;
      setDeathOrder(prev => [...prev, { userId, username, timeEliminated }]);
    });
  
    // Desconexión con grace period
    socket.on('disconnect', () => {
      Object.keys(rooms).forEach(code => {
        const room = rooms[code];
        const idx  = room.players.findIndex(p => p.socketId === socket.id);
        if (idx === -1) return;
  
        const leaver = room.players[idx];
        // Programar-removal
        const timeout = setTimeout(async () => {
          // Quitar de memoria
          room.players = room.players.filter(p => p.userId !== leaver.userId);
  
          // Reasignar host si hacía falta
          if (room.hostUserId === leaver.userId && room.players.length > 0) {
            room.host       = room.players[0].socketId;
            room.hostUserId = room.players[0].userId;
          }
  
          // Broadcast o cleanup completo
          if (room.players.length > 0) {
            io.to(code).emit('roomData', room);
          } else {
            delete rooms[code];
            await Game.deleteOne({ code });
          }
  
          // También limpiar DB persistente
          await Game.findOneAndUpdate(
            { code },
            { $pull: { players: leaver.userId } }
          );
        }, 2500);
        room.pendingRemovals.set(leaver.userId, timeout);
      });
    });
  
    // Salir voluntario
    socket.on('leaveRoom', async ({ code }) => {
      const room = rooms[code];
      if (!room) return;
      room.players = room.players.filter(p => p.userId !== socket.userId);
      if (room.hostUserId === socket.userId && room.players.length > 0) {
        room.host       = room.players[0].socketId;
        room.hostUserId = room.players[0].userId;
      }
      if (room.players.length > 0) {
        io.to(code).emit('roomData', room);
      } else {
        delete rooms[code];
        await Game.deleteOne({ code });
      }
      await Game.findOneAndUpdate(
        { code },
        { $pull: { players: socket.userId } }
      );
    });
  
  });

  return io;
}

module.exports = setupSocket;