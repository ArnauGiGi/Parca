// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
mongoose.connect(process.env.MONGO_URI);

async function seedAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('TuPasswordAdmin', salt);
  await User.create({
    username: 'admin',
    email: 'admin@ejemplo.com',
    password: hash,
    role: 'admin'
  });
  console.log('Admin creado');
  process.exit();
}

seedAdmin();
