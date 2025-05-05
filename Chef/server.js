require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const connectDB  = require('./config/db');
const Game       = require('./models/Game');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const questionRoutes = require('./routes/questionRoutes');

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/questions', questionRoutes);

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// Auth middleware para sockets
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded      = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId      = decoded.id;
    socket.username    = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

const rooms = {}; // code → { host, hostUserId, players: […], pendingRemovals }

io.on('connection', socket => {
  console.log(`🔌 Conectado: ${socket.id} (userId=${socket.userId})`);

  // Crear sala
  socket.on('createRoom', ({ code }, ack) => {
    rooms[code] = {
      host: socket.id,
      hostUserId: socket.userId,
      players: [{
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        ready: false
      }],
      pendingRemovals: new Map()
    };
    socket.join(code);
    // 1) responder al cliente
    ack(rooms[code]);
    // 2) broadcast a todos en la sala
    io.to(code).emit('roomData', rooms[code]);
  });

  // Unirse a sala
  socket.on('joinRoom', ({ code }, ack) => {
    const room = rooms[code];
    if (!room) return socket.emit('errorMessage', 'Sala no existe');

    // Cancelar removal si venimos de refresh
    if (room.pendingRemovals.has(socket.userId)) {
      clearTimeout(room.pendingRemovals.get(socket.userId));
      room.pendingRemovals.delete(socket.userId);
    }

    const existing = room.players.find(p => p.userId === socket.userId);
    if (existing) {
      existing.socketId = socket.id;
    } else {
      room.players.push({
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        ready: false
      });
    }
    socket.join(code);

    ack(room);                 // ack al cliente
    io.to(code).emit('roomData', room); // broadcast
  });

  // Toggle Ready
  socket.on('playerReady', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.map(p =>
      p.socketId === socket.id ? { ...p, ready: !p.ready } : p
    );
    io.to(code).emit('roomData', room);
  });

  // Iniciar Partida
  socket.on('startGame', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    if (socket.userId !== room.hostUserId) {
      return socket.emit('errorMessage', 'Solo el creador puede iniciar la partida');
    }
    if (!room.players.every(p => p.ready)) {
      return socket.emit('errorMessage', 'Todos deben estar listos');
    }
    io.to(code).emit('gameStarted');
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
      }, 10000);

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server corriendo en puerto ${PORT}`));
