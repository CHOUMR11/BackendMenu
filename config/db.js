const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = connectDB;