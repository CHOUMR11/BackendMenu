const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, default: 1 }
    }
  ],
  status: { type: String, enum: ['en cours', 'terminée'], default: 'en cours' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
