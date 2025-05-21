const Order = require('../models/Order');

const printDailyReport = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await Order.find({
    createdAt: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate('items.menuItem');

  let total = 0;
  let report = `Rapport du ${today.toLocaleDateString()}:\n\n`;

  orders.forEach(order => {
    report += `Table ${order.tableNumber} - Statut: ${order.status}\n`;
    order.items.forEach(({ menuItem, quantity }) => {
      const subTotal = menuItem.price * quantity;
      total += subTotal;
      report += `  - ${menuItem.name} x${quantity} = ${subTotal.toFixed(2)} €\n`;
    });
    report += '\n';
  });

  report += `Total du jour: ${total.toFixed(2)} €`;

  console.log(report);

  // Ici tu peux ajouter un export vers fichier, impression, envoi email, etc.
};

module.exports = printDailyReport;
