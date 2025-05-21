const Order = require('../models/Order');

const printReceipt = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('items.menuItem');
    if (!order) {
      console.log('Commande non trouvée');
      return;
    }

    let total = 0;
    let receipt = `Reçu pour la commande - Table ${order.tableNumber}\n\n`;

    order.items.forEach(({ menuItem, quantity }) => {
      const subTotal = menuItem.price * quantity;
      total += subTotal;
      receipt += `${menuItem.name} x${quantity} = ${subTotal.toFixed(2)} €\n`;
    });

    receipt += `\nTotal: ${total.toFixed(2)} €\n`;
    receipt += `Statut: ${order.status}\n`;
    receipt += `Date: ${order.createdAt.toLocaleString()}\n`;

    console.log(receipt);

    // Tu peux aussi ici générer un PDF, envoyer par email, ou imprimer directement

  } catch (error) {
    console.error('Erreur lors de la génération du reçu:', error.message);
  }
};

module.exports = printReceipt;
