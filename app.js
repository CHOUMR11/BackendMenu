const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const categorieRouter = require('./routes/categorie.route');
const scategorieRouter = require('./routes/scategorie.route');
const articleRouter = require('./routes/article.route');
const userRouter = require('./routes/user.route.js');
const paymentRouter = require('./routes/payment.route.js');
const locationRouter = require('./routes/location.route.js');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
}));
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', mongoConnected: mongoose.connection.readyState >= 1 });
});

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Connect to MongoDB
connectDB().catch(error => {
  console.error('Failed to connect to MongoDB:', error.message);
});

// Routes
app.use('/api/categories', categorieRouter);
app.use('/api/scategories', scategorieRouter);
app.use('/api/articles', articleRouter);
app.use('/api/users', userRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/locations', locationRouter);

// Serve frontend
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  console.log('Serving frontend:', path.join(__dirname, 'client/build', 'index.html'));
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

module.exports = serverless(app);