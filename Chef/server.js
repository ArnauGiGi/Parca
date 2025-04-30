//Importacion librerias
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Game = require('./models/Game');

//rutas
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);


//socket
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
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

const rooms = {};  // estado en memoria: code → { host, players: [{ socketId, userId, username, ready }] }

io.on('connection', socket => {
  console.log(`🔌 Conectado: ${socket.id} (userId=${socket.userId})`);

  socket.on('createRoom', ({ code }) => {
    console.log(`🔌 Creando sala ${code}...`);
    rooms[code] = {
      host: socket.id,
      hostUserId: socket.userId,
      players: [{ socketId: socket.id, userId: socket.userId, username: socket.username, ready: false }],
      pendingRemovals: new Map()
    };
    socket.join(code);
    io.to(code).emit('roomData', rooms[code]);
  });

  // Al unirse a la sala
  socket.on('joinRoom', ({ code }) => {
    console.log(`🔌 Uniendo a sala ${code}...`);
    const room = rooms[code];
    if (!room) return socket.emit('errorMessage', 'Sala no existe');

    // Si ya había un pendingRemoval para este userId, cancelarlo
    if (room.pendingRemovals.has(socket.userId)) {

      clearTimeout(room.pendingRemovals.get(socket.userId));
      room.pendingRemovals.delete(socket.userId);
    }

    // Si ya existe en players (reconexión), simplemente actualizamos socketId
    const existing = room.players.find(p => p.userId === socket.userId);
    if (existing) {
      existing.socketId = socket.id;
      existing.username = socket.username; // por si cambió
    } else {
      room.players.push({
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        ready: false
      });
    }

    socket.join(code);
    io.to(code).emit('roomData', rooms[code]);
  });

  socket.on('playerReady', ({ code }) => {
    console.log(`🔌 ${socket.username} (${socket.userId}) está listo`);
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.map(p =>
      p.socketId === socket.id ? { ...p, ready: !p.ready } : p
    );
    io.to(code).emit('roomData', rooms[code]);  
  });

  socket.on('startGame', ({ code }) => {
    console.log(`🔌 ${socket.username} (${socket.userId}) inicia la partida`);
    const room = rooms[code];
    if (!room) return;
    if (!room.players.every(p => p.ready)) {
      return socket.emit('errorMessage', 'Todos deben estar listos');
    }
    io.to(code).emit('gameStarted');
  });

  // —————————————————————————————
  // Desconexión: limpiar memoria y MongoDB
  // —————————————————————————————
  socket.on('disconnect', () => {
    console.log(`🔌 Desconectado: ${socket.id} (userId=${socket.userId})`);
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx === -1) continue;

      const leaver = room.players[idx];
      // Programamos la remoción: si en 1s no se reconecta, lo eliminamos
      const timeout = setTimeout(async () => {
        // Borrar de memoria
        room.players = room.players.filter(p => p.userId !== leaver.userId);

        // Reasignar host si era él
        if (room.hostUserId === socket.userId && room.players.length > 0) {
          room.host = room.players[0].socketId;
          room.hostUserId = room.players[0].userId;
          socket.userId = room.players[0].userId;
          socket.username = room.players[0].username;
          io.to(code).emit('roomData', room);
        }

        // Emitir lista actualizada o destruir sala
        if (room.players.length > 0) {
          io.to(code).emit('roomData', rooms[code]);         
        } else {
          delete rooms[code];
          // Borrar partida en DB
          await Game.deleteOne({ code });
        }

        // Actualizar DB: quitar de players[]
        await Game.findOneAndUpdate(
          { code },
          { $pull: { players: leaver.userId } }
        );
      }, 1000); // 1 segundos de gracia

      // Guardamos el timeout para poder cancelarlo si se reconecta
      room.pendingRemovals.set(leaver.userId, timeout);
    }
  });

  // Final de la partida
  socket.on('endGame', async ({ code, results }) => {
    io.to(code).emit('gameEnded', results);
    console.log(`Partida ${code} terminada. Resultados:`, results);
    io.in(code).socketsLeave(code);
    delete rooms[code];
    await Game.deleteOne({ code });
  });
  // Aquí irían newQuestion, submitAnswer, etc.
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server corriendo en puerto ${PORT}`));