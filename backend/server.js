import express from "express";
import cors from "cors";
import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS for your frontend domain
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api", auctionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Auction backend running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
