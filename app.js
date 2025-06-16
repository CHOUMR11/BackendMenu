const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

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

    // 👇 Render expects this to expose the port
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
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
