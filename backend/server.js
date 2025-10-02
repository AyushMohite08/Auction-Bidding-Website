import express from "express";
import cors from "cors";
import auctionRoutes from "./routes/auctionRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", auctionRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Auction backend running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
