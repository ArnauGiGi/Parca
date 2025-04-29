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
    rooms[code] = {
      host: socket.id,
      players: [{ socketId: socket.id, userId: socket.userId, username: socket.username, ready: false }]
    };
    socket.join(code);
    io.to(code).emit('updatePlayers', rooms[code].players);
  });

  socket.on('joinRoom', ({ code }) => {
    const room = rooms[code];
    if (!room) {
      return socket.emit('errorMessage', 'Sala no existe');
    }
    room.players.push({
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      ready: false
    });
    socket.join(code);
    io.to(code).emit('updatePlayers', room.players);
  });

  socket.on('playerReady', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.map(p =>
      p.socketId === socket.id ? { ...p, ready: !p.ready } : p
    );
    io.to(code).emit('updatePlayers', room.players);
  });

  socket.on('startGame', ({ code }) => {
    const room = rooms[code];
    if (!room) return;
    if (socket.id !== room.host) {
      return socket.emit('errorMessage', 'Solo el creador puede iniciar la partida');
    }
    if (!room.players.every(p => p.ready)) {
      return socket.emit('errorMessage', 'Todos deben estar listos');
    }
    io.to(code).emit('gameStarted');
  });

  // —————————————————————————————
  // Desconexión: limpiar memoria y MongoDB
  // —————————————————————————————
  socket.on('disconnect', async () => {
    console.log(`❌ Desconectado: ${socket.id}`);
  
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx === -1) continue;
  
      const leaver = room.players.splice(idx, 1)[0];
      console.log(`👉 ${leaver.username} salió de la sala ${code}`);
      console.log(room);
      if (room.players.length > 0) {
        console.log("🛡️ Sala no vacía, actualizando estado");
        // Si era el host y quedan usuarios, reasignar host
        if (room.host === socket.id) {
          room.host = room.players[0].socketId;
          const newOwner = room.players[0].username;
          console.log(`🛡️ Nuevo host de ${code}: ${newOwner}`);
          // Avisamos a todos quién es el nuevo host
          io.to(code).emit('newHost', { socketId: room.host, username: newOwner });
        }
        // Emitir la lista actualizada
        io.to(code).emit('updatePlayers', room.players);
      } else {
        // Sala vacía: borramos de memoria y de la DB
        delete rooms[code];
        console.log(`🗑  Sala ${code} vacía, eliminada de memoria`);
        try {
          await Game.deleteOne({ code });
          console.log(`🗄  Game ${code} eliminado de MongoDB`);
        } catch (err) {
          console.error('⚠️ Error borrando Game en DB:', err);
        }
      }
  
      // Además, aseguramos que el leaver quede fuera del documento
      try {
        await Game.findOneAndUpdate(
          { code },
          { $pull: { players: leaver.userId } }
        );
        console.log(`🗄  Game ${code} DB actualizado, usuario eliminado`);
      } catch (err) {
        console.error('⚠️ Error actualizando Game tras disconnect:', err);
      }
    }
  });

  // —————————————————————————————
  // End Game: expulsar y limpiar sala
  // —————————————————————————————
  socket.on('endGame', async ({ code, results }) => {
    io.to(code).emit('gameEnded', results);
    io.in(code).socketsLeave(code);
    if (rooms[code]) delete rooms[code];
    console.log(`🏁 Partida ${code} finalizada y sala eliminada`);
  });

  socket.on('newHost', ({ socketId, username }) => {
    // Actualizar estado isHost, p.ej.:
    setIsHost(username === localStorage.getItem('username'));
    // Mostrar en UI que ahora “username” es el host, si quieres
  });

  // Aquí irían newQuestion, submitAnswer, etc.
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server corriendo en puerto ${PORT}`));