const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const path = require('path');
const serverless = require('serverless-http');
const app = express();

let dbConnected = false;
if (!dbConnected) {
  connectDB();
  dbConnected = true;
}

app.use(cors());
app.use(express.json());

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use(express.static(path.join(__dirname, './client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './client/build/index.html'));
});

module.exports = serverless(app);