const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const connectDB    = require('./config/db');

const authRoutes      = require('./routes/authRoutes');
const gameRoutes      = require('./routes/gameRoutes');
const questionRoutes  = require('./routes/questionRoutes');
const userRoutes      = require('./routes/userRoutes');
const emailRoutes     = require('./routes/emailRoutes');

const app = express();

app.use(cors({
  origin: 'http://parca.local',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

module.exports = app;