const express = require("express");
const cors = require("cors");
const { Server, WebSocket } = require("ws"); // ← Correction importante : importer WebSocket aussi
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(cors()); // Autorise toutes les origines (OK pour dev, resserre en prod si besoin)
app.use(express.static("dist"));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "API Crêperie Backend OK ✅" });
});
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// Middleware de secours si DB pas connectée
let dbConnected = false;
app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: "Database not connected yet - retry soon" });
  }
  next();
});

// Fonction pour broadcaster les orders (utilisée par WS)
const broadcastOrders = async (wss) => {
  try {
    const orders = await mongoose
      .model("Order")
      .find()
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 });

    const bills = orders.map((order) => ({
      id: order._id.toString(),
      tableNumber: order.tableNumber,
      orders: [
        {
          id: order._id.toString(),
          date: order.createdAt,
          items: order.items.map((item) => ({
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
          })),
          totalPrice: order.items.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          ),
        },
      ],
      totalBillAmount: order.items.reduce(
        (sum, item) => sum + item.menuItem.price * item.quantity,
        0
      ),
    }));

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "orders", data: bills }));
      }
    });
  } catch (error) {
    console.error("Erreur lors de la diffusion des commandes:", error);
  }
};

async function start() {
  try {
    // Log l'URI (sans password) pour debug sur Render
    const safeUri = process.env.MONGO_URI?.replace(/\/\/.*@/, "//<hidden>@") || "MONGO_URI non défini";
    console.log("Tentative de connexion MongoDB avec :", safeUri);

    await connectDB(); // ← doit appeler mongoose.connect(process.env.MONGO_URI, { ... })
    dbConnected = true;
    console.log("✅ MongoDB connecté avec succès");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);

      const wss = new Server({ server });

      wss.on("connection", (ws) => {
        console.log("Nouvelle connexion WebSocket");

        // Envoi immédiat des orders au nouveau client
        const sendInitialOrders = async () => {
          try {
            const orders = await mongoose
              .model("Order")
              .find()
              .populate("items.menuItem", "name price")
              .sort({ createdAt: -1 });

            const bills = orders.map((order) => ({
              id: order._id.toString(),
              tableNumber: order.tableNumber,
              orders: [
                {
                  id: order._id.toString(),
                  date: order.createdAt,
                  items: order.items.map((item) => ({
                    name: item.menuItem.name,
                    price: item.menuItem.price,
                    quantity: item.quantity,
                  })),
                  totalPrice: order.items.reduce(
                    (sum, item) => sum + item.menuItem.price * item.quantity,
                    0
                  ),
                },
              ],
              totalBillAmount: order.items.reduce(
                (sum, item) => sum + item.menuItem.price * item.quantity,
                0
              ),
            }));

            ws.send(JSON.stringify({ type: "orders", data: bills }));
          } catch (err) {
            console.error("Erreur envoi initial orders:", err);
            ws.send(JSON.stringify({ type: "error", message: "Erreur récupération commandes" }));
          }
        };

        sendInitialOrders();

        ws.on("close", () => console.log("Connexion WebSocket fermée"));
        ws.on("error", (error) => console.error("Erreur WebSocket:", error));
      });

      // Optionnel : broadcaster toutes les X secondes (ex: 30s)
      // setInterval(() => broadcastOrders(wss), 30000);

      // Expose la fonction pour l'utiliser ailleurs (ex: après POST order)
      app.set("broadcastOrders", () => broadcastOrders(wss));
    });
  } catch (error) {
    console.error("Erreur fatale connexion MongoDB:", error);
    process.exit(1); // Crash explicite → Render relance
  }
}

start();

module.exports = app; // Optionnel, utile si tu testes localement
