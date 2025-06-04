const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // plus besoin de passer useNewUrlParser ou useUnifiedTopology
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
