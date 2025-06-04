const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// ❌ REMOVE app.listen() for Vercel!
module.exports = (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
};
