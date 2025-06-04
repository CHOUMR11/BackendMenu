const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Connexion à la base de données
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Route test simple
app.get('/', (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});

// Routes API
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Adaptation pour Vercel
const serverless = require('serverless-http');
module.exports = serverless(app);
