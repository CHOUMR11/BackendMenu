const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');  // Ton fichier db.js
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

let dbConnected = false;

async function start() {
  try {
    await connectDB();
    dbConnected = true;
    console.log('✅ MongoDB connecté, prêt à répondre');
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}
start();

app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: "Database not connected yet" });
  }
  next();
});

module.exports = serverless(app);
