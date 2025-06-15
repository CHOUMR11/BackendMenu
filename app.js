// app.js - Serveur Express pour l’API Crêperie

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import connectDB from './config/db.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
(async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('Erreur connexion MongoDB:', err);
    process.exit(1);
  }
})();

// Routes API
app.get('/', (req, res) => {
  res.json({ message: 'API Crêperie OK ✅' });
});
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// En production, servir le frontend Vite build
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../frontend/dist');
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
