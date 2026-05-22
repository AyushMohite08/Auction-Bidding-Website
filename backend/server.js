import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAllowedOrigin } from "./middleware/securityMiddleware.js";
import { errorHandler, notFoundHandler } from "./utils/http.js";
import { readCookie } from "./utils/cookies.js";
import { verifyAccessToken } from "./utils/jwt.js";
import { startScheduler } from "./services/schedulerService.js";
import * as rdsModel from "./models/rdsModel.js";

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

io.use(async (socket, next) => {
  const token = readCookie(socket.request, env.auth.accessCookieName);
  if (!token) {
    return next(new Error("Authentication is required."));
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded.sub || !decoded.role || decoded.typ !== "access") {
      return next(new Error("Invalid session."));
    }

    const user = await rdsModel.findUserById(decoded.sub);
    const hasRole = user && !user.is_deleted && (await rdsModel.userHasRole(user.id, decoded.role));
    if (!hasRole) {
      return next(new Error("Invalid session."));
    }

    socket.user = { id: user.id, role: decoded.role };
    return next();
  } catch {
    return next(new Error("Invalid session."));
  }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(requireAllowedOrigin);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", auctionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auction backend running");
});

let activeSocketCount = 0;

io.on("connection", (socket) => {
  activeSocketCount += 1;
  if (env.socketDebug) {
    console.log(`Socket connected. Active sockets: ${activeSocketCount}`);
  }

  socket.on("disconnect", () => {
    activeSocketCount = Math.max(0, activeSocketCount - 1);
    if (env.socketDebug) {
      console.log(`Socket disconnected. Active sockets: ${activeSocketCount}`);
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`Server running on port ${env.port}`);
  startScheduler(io);
});
