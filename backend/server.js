// backend/server.js

import dotenv from "dotenv";

// Load environment variables
dotenv.config();


import express from "express";
import http from 'http'; // Import the http module
import { Server } from 'socket.io'; // Import Server from socket.io
import cors from "cors";
import path from 'path'; // Import the path module
import { fileURLToPath } from 'url'; // Import this to handle ES module paths

import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { startScheduler } from "./services/schedulerService.js";
// import dashboardRoutes from "./routes/dashboardRoutes.js";
// import statsRoutes from "./routes/statsRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"], // Your frontend URLs
    methods: ["GET", "POST"]
  }
});

// Middleware to make 'io' accessible in all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Enable CORS for your frontend domain
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

// --- Static file serving for local uploads ---
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api", auctionRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api", dashboardRoutes);
// app.use("/api", statsRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Auction backend running 🚀");
});

// --- Socket.IO connection logic ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Define the port (only once)
const PORT = process.env.PORT || 3000;

// Listen on the http server, not the express app, to allow Socket.IO to work
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  // Start the auction expiry scheduler
  startScheduler();
});