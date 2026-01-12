const express = require("express");
const cors = require("cors");
const { Server, WebSocket } = require("ws");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.static("dist"));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// 503 si DB pas encore OK
let dbConnected = false;
app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: "Database not connected yet – retrying..." });
  }
  next();
});

// Fonction broadcast (factorisée)
const broadcastOrders = async (wss) => {
  try {
    const orders = await mongoose.model("Order")
      .find()
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 });

    const bills = orders.map(order => ({
      id: order._id.toString(),
      tableNumber: order.tableNumber,
      orders: [{
        id: order._id.toString(),
        date: order.createdAt,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
        })),
        totalPrice: order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
      }],
      totalBillAmount: order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
    }));

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "orders", data: bills }));
      }
    });
  } catch (error) {
    console.error("Broadcast orders error:", error.message);
  }
};

async function start() {
  try {
    const safeUri = process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/\/\/.*@/, "//***@")
      : "MONGO_URI manquant !";
    console.log("→ Tentative MongoDB :", safeUri);

    await connectDB();
    dbConnected = true;
    console.log("✅ MongoDB connecté !");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur sur port ${PORT}`);

      const wss = new Server({ server });

      wss.on("connection", ws => {
        console.log("→ Nouvelle connexion WS");
        // Envoi initial
        (async () => {
          try {
            const orders = await mongoose.model("Order")
              .find()
              .populate("items.menuItem", "name price")
              .sort({ createdAt: -1 });

            const bills = orders.map(order => ({
              id: order._id.toString(),
              tableNumber: order.tableNumber,
              orders: [{
                id: order._id.toString(),
                date: order.createdAt,
                items: order.items.map(item => ({
                  name: item.menuItem.name,
                  price: item.menuItem.price,
                  quantity: item.quantity,
                })),
                totalPrice: order.items.reduce((s, i) => s + (i.menuItem.price * i.quantity), 0),
              }],
              totalBillAmount: order.items.reduce((s, i) => s + (i.menuItem.price * i.quantity), 0),
            }));

            ws.send(JSON.stringify({ type: "orders", data: bills }));
          } catch (err) {
            console.error("Erreur envoi initial WS:", err.message);
            ws.send(JSON.stringify({ type: "error", message: "Erreur chargement commandes" }));
          }
        })();

        ws.on("close", () => console.log("← WS fermée"));
        ws.on("error", err => console.error("WS error:", err.message));
      });

      // Pour appeler depuis les routes (ex: après création order)
      app.set("broadcastOrders", () => broadcastOrders(wss));
    });
  } catch (error) {
    console.error("ERREUR FATALE MongoDB :", error.message || error);
    process.exit(1);
  }
}

start();

module.exports = app;
