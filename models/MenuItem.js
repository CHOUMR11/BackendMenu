const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  description: String,
  imageUrl: String,
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
