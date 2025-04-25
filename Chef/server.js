require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a Mongo
connectDB();

// Rutas REST
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// HTTP server y Socket.IO
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' }
});

// ----------------------
// HANDLERS DE SOCKET.IO
// ----------------------
const rooms = {};

io.on('connection', socket => {
  socket.on('createRoom', ({ code, username }) => {
    rooms[code] = {
      host: socket.id,
      players: [{ socketId: socket.id, username, ready: false }]
    };
    socket.join(code);
    io.to(code).emit('updatePlayers', rooms[code].players);
  });

  socket.on('joinRoom', ({ code, username }) => {
    if (!rooms[code]) {
      socket.emit('errorMessage', 'Sala no existe');
      return;
    }
    rooms[code].players.push({ socketId: socket.id, username, ready: false });
    socket.join(code);
    io.to(code).emit('updatePlayers', rooms[code].players);
  });

 // Cuando un jugador marca ready/unready
  socket.on('playerReady', ({ code, username }) => {
   const room = rooms[code];
   if (!room) return;
   // Toggle ready
   room.players = room.players.map(p =>
     p.username === username ? { ...p, ready: !p.ready } : p
   );
   io.to(code).emit('updatePlayers', room.players);
  });

  socket.on('startGame', ({ code }) => {
   const room = rooms[code];
   if (!room) return;
   // Solo el host puede iniciar
   if (socket.id !== room.host) {
     socket.emit('errorMessage', 'Solo el creador puede iniciar la partida');
     return;
   }
   // Comprobar que todos están ready
   const allReady = room.players.every(p => p.ready);
   if (!allReady) {
     socket.emit('errorMessage', 'Todos los jugadores deben estar preparados');
     return;
   }
    io.to(code).emit('gameStarted');
  });

  // 4) Siguiente pregunta
  socket.on('nextQuestion', ({ code, question }) => {
    io.to(code).emit('newQuestion', question);
  });

  // 5) Envío de respuesta
  socket.on('submitAnswer', ({ code, username, answer }) => {
    // Aquí podrías validar la respuesta y calcular puntos…
    io.to(code).emit('answerSubmitted', { username, answer });
  });

  // 6) Finalizar partida
  socket.on('endGame', ({ code, results }) => {
    io.to(code).emit('gameEnded', results);
    io.in(code).socketsLeave(code); // expulsar a todos de la sala
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.id}`);
  });
});

// Arrancar servidor HTTP
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Okupa en el puerto 🚀 ${PORT}, buenas tardes. :)`));
