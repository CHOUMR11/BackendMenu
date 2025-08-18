const express = require('express');
const cors = require('cors');
const { Server } = require('ws');
const mongoose = require('mongoose'); // Ajouté explicitement pour éviter des erreurs
require('dotenv').config();

const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.static('dist'));
app.use(express.json()); // Parser les requêtes JSON

// Route de santé
app.get('/', (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});

// Routes API
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

let dbConnected = false;

async function start() {
  try {
    await connectDB();
    dbConnected = true;
    console.log('✅ MongoDB connecté, prêt à répondre');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // WebSocket
      const wss = new Server({ server });

      wss.on('connection', (ws) => {
        console.log('Nouvelle connexion WebSocket');

        // Envoyer les commandes initiales
        const sendOrders = async () => {
          try {
            const orders = await mongoose
              .model('Order')
              .find()
              .populate('items.menuItem', 'name price')
              .sort({ createdAt: -1 });
            // Transformer orders en format bills
            const bills = orders.map(order => ({
              id: order._id.toString(),
              tableNumber: order.tableNumber,
              orders: [{
                id: order._id.toString(),
                date: order.createdAt,
                items: order.items.map(item => ({
                  name: item.menuItem.name,
                  price: item.menuItem.price,
                  quantity: item.quantity
                })),
                totalPrice: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
              }],
              totalBillAmount: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
            }));
            ws.send(JSON.stringify({ type: 'orders', data: bills }));
          } catch (error) {
            console.error('Erreur lors de l\'envoi des commandes via WebSocket:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Erreur lors de la récupération des commandes' }));
          }
        };
        sendOrders();

        ws.on('close', () => console.log('Connexion WebSocket fermée'));
        ws.on('error', (error) => console.error('Erreur WebSocket:', error));
      });

      // Fonction pour diffuser les commandes à tous les clients
      const broadcastOrders = async () => {
        try {
          const orders = await mongoose
            .model('Order')
            .find()
            .populate('items.menuItem', 'name price')
            .sort({ createdAt: -1 });
          // Transformer orders en format bills
          const bills = orders.map(order => ({
            id: order._id.toString(),
            tableNumber: order.tableNumber,
            orders: [{
              id: order._id.toString(),
              date: order.createdAt,
              items: order.items.map(item => ({
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity
              })),
              totalPrice: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
            }],
            totalBillAmount: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
          }));
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'orders', data: bills }));
            }
          });
        } catch (error) {
          console.error('Erreur lors de la diffusion des commandes:', error);
        }
      };

      app.set('broadcastOrders', broadcastOrders);
    });
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}
start();

// Middleware pour vérifier la connexion à la base de données
app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected yet' });
  }
  next();
});
