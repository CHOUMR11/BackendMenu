const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('items.menuItem');
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
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: 'Commande non trouvée' });
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
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande' });
  }
};
