// controllers/orderController.js
const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
};

exports.addOrder = async (req, res) => {
  try {
    const { tableNumber, items } = req.body;
    const order = new Order({ tableNumber, items });
    await order.save();
    const populatedOrder = await Order.findById(order._id).populate(
      'items.menuItem',
      'name price'
    );
    req.app.get('broadcastOrders')?.(); // Diffuser les mises à jour
    res.json(populatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('items.menuItem', 'name price');
    if (!updatedOrder) return res.status(404).json({ error: 'Commande non trouvée' });
    req.app.get('broadcastOrders')?.(); // Diffuser les mises à jour
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Commande non trouvée' });
    req.app.get('broadcastOrders')?.(); // Diffuser les mises à jour
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
  }
};
