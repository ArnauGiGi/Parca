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
io.on('connection', socket => {
  console.log(`🔌 Usuario conectado: ${socket.id}`);

  // 1) Crear sala (host)
  socket.on('createRoom', ({ gameId, code }) => {
    socket.join(code);
    console.log(`Host unido a sala ${code}`);
    io.to(code).emit('roomCreated', { gameId, code });
  });

  // 2) Unirse a sala (jugador)
  socket.on('joinRoom', ({ code, username }) => {
    socket.join(code);
    console.log(`${username} se unió a sala ${code}`);
    io.to(code).emit('playerJoined', { username });
  });

  // 3) Iniciar partida
  socket.on('startGame', ({ code }) => {
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
