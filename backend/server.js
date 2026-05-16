import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAllowedOrigin } from "./middleware/securityMiddleware.js";
import { errorHandler, notFoundHandler } from "./utils/http.js";
import { startScheduler } from "./services/schedulerService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: env.frontendOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(requireAllowedOrigin);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/uploads", express.static(path.join(__dirname, env.uploads.dir)));
app.use("/api", auctionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auction backend running");
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`Server running on port ${env.port}`);
  startScheduler();
});
