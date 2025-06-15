// app.js - Serveur Express pour l’API Crêperie (CommonJS)

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
connectDB()
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('Erreur connexion MongoDB:', err);
    process.exit(1);
  });

// Routes API
app.get('/', (req, res) => {
  res.json({ message: 'API Crêperie OK ✅' });
});
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// En production, servir le frontend Vite build
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
