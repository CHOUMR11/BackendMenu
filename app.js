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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur backend démarré sur le port ${PORT}`));
