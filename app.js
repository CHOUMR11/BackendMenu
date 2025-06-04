// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const path = require('path'); //
const serverless = require('serverless-http');
const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
// We guard `connectDB()` so it only runs once per serverless “cold start.”
let dbConnected = false;
if (!dbConnected) {
  connectDB();
  dbConnected = true;
}

app.use(cors());
app.use(express.json());

// ── (Optional) A simple root route to verify the function is alive ────────────
//app.get('/', (req, res) => {
 // res.send('API is working ✅');
//});//

// ── Mount your API routes ──────────────────────────────────────────────────────
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use(express.static(path.join(__dirname, './client/build'))); // Route pour

app.get('*', (req, res) => { res.sendFile(path.join(__dirname,
'./client/build/index.html')); });

// ── Export as a serverless function ────────────────────────────────────────────
module.exports = serverless(app);
