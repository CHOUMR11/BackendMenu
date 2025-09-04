const express = require("express");
const cors = require("cors");
const { Server } = require("ws");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Configuration CORS pour autoriser les origines spécifiques
app.use(cors({
  origin: ['http://localhost:5173', 'https://votre-frontend-url.com'], // Remplacer par l'URL de votre frontend
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.static("dist"));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

let dbConnected = false;

async function start() {
  try {
    await connectDB();
    dbConnected = true;
    console.log("✅ MongoDB connecté, prêt à répondre");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      const wss = new Server({ server, path: "/ws" });

      wss.on("connection", (ws, req) => {
        console.log(`Nouvelle connexion WebSocket depuis ${req.headers.origin}`);

        // Envoyer les commandes existantes au nouveau client
        const sendOrders = async () => {
          try {
            const orders = await mongoose
              .model("Order")
              .find()
              .populate("items.menuItem", "name price")
              .sort({ createdAt: -1 });
            const bills = orders.map(order => ({
              id: order._id.toString(),
              tableNumber: order.tableNumber,
              status: order.status,
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
            ws.send(JSON.stringify({ type: "orders", data: bills }));
          } catch (error) {
            console.error("Erreur lors de l'envoi des commandes via WebSocket:", error);
            ws.send(JSON.stringify({ type: "error", message: "Erreur lors de la récupération des commandes" }));
          }
        };
        sendOrders();

        // Gérer les commandes confirmées
        ws.on("message", async (message) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.type === "order") {
              console.log("Commande reçue via WebSocket:", data.data);

              // Trouver ou créer les éléments du menu
              const items = await Promise.all(
                data.data.items.map(async (item) => {
                  let menuItem = await mongoose.model("MenuItem").findOne({ name: item.name });
                  if (!menuItem) {
                    menuItem = new mongoose.model("MenuItem")({
                      name: item.name,
                      price: item.price,
                      category: item.category || "Unknown"
                    });
                    await menuItem.save();
                  }
                  return {
                    menuItem: menuItem._id,
                    quantity: item.quantity
                  };
                })
              );

              // Créer une nouvelle commande
              const newOrder = new mongoose.model("Order")({
                tableNumber: data.data.tableNumber,
                items,
                status: "en cours"
              });
              await newOrder.save();
              console.log("Nouvelle commande enregistrée:", newOrder);

              // Diffuser les commandes mises à jour
              app.get("broadcastOrders")();
            }
          } catch (error) {
            console.error("Erreur lors du traitement de la commande:", error);
            ws.send(JSON.stringify({ type: "error", message: "Erreur lors de l’enregistrement de la commande" }));
          }
        });

        ws.on("close", () => console.log("Connexion WebSocket fermée"));
        ws.on("error", (error) => console.error("Erreur WebSocket:", error));
      });

      wss.on("error", (error) => {
        console.error("Erreur serveur WebSocket:", error);
      });

      // Fonction de diffusion des commandes
      app.set("broadcastOrders", async () => {
        try {
          const orders = await mongoose
            .model("Order")
            .find()
            .populate("items.menuItem", "name price")
            .sort({ createdAt: -1 });
          const bills = orders.map(order => ({
            id: order._id.toString(),
            tableNumber: order.tableNumber,
            status: order.status,
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
              client.send(JSON.stringify({ type: "orders", data: bills }));
            }
          });
        } catch (error) {
          console.error("Erreur lors de la diffusion des commandes:", error);
        }
      });
    });
  } catch (error) {
    console.error("Erreur connexion MongoDB:", error);
    process.exit(1);
  }
}
start();

app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: "Database not connected yet" });
  }
  next();
});
