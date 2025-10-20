// backend-server/server.js
"use strict";

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const socketio = require("socket.io");

// ---- DB bootstrap (ใช้คู่กับ database.js เวอร์ชันที่ผมให้ไป) ----
const { initSQLite, connectMongoDB } = require("./config/database");

// ---- Routers: ประกาศ/ใช้ครั้งเดียวเท่านั้น ----
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const agentRoutes = require("./routes/agents");
const messageRoutes = require("./routes/messages");


// ---- Socket handler & error middleware ----
const socketHandler = require("./socket/socketHandler");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// ---------- CORS ----------
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ถ้าไม่ตั้ง CORS_ORIGIN => อนุญาตทุก origin แต่ปิด credentials (ตามกฎของ browser)
const allowAll = corsOrigins.length === 0;
const corsOptions = {
  origin: allowAll ? true : corsOrigins,
  credentials: !allowAll,
};
app.use(cors(corsOptions));

// ---------- Body parsers ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------- Rate limiting ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many login attempts, please try again later.",
  },
});
app.use("/api/auth", authLimiter);
app.use("/api/users", userRoutes);

// ---------- Block Chrome DevTools Probing Requests ----------
app.use("/.well-known", (_req, res) => {
  res.status(404).send("Not supported.");
});

// ---------- Simple request logger (ignore DevTools probe) ----------
app.use((req, _res, next) => {
  if (!req.originalUrl.startsWith("/.well-known")) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/messages", messageRoutes);

// ---------- Health check ----------
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
  });
});

// ---------- 404 & error handler ----------
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});
app.use(errorHandler);

// ---------- Socket.io ----------
const io = socketio(server, { cors: corsOptions });
socketHandler(io);

// ---------- Start server ----------
(async () => {
  try {
    console.log("🚀 Starting Agent Wallboard Backend Server...\n");
    console.log("📊 Initializing databases...");
    global.sqliteDb = await initSQLite();

    if (process.env.ENABLE_MONGO === "true") {
      await connectMongoDB();
    } else {
      console.log(
        "ℹ️  Skipping MongoDB connection (set ENABLE_MONGO=true to enable)."
      );
    }
    console.log("");

    const PORT = Number(process.env.PORT) || 3001;
    server.listen(PORT, () => {
      console.log("✅ Server started successfully!\n");
      console.log(`📡 HTTP Server:  http://localhost:${PORT}`);
      console.log(`⚡ WebSocket:    ws://localhost:${PORT}`);
      console.log(`🏥 Health:       http://localhost:${PORT}/health\n`);
      console.log("📋 Available Routes:");
      console.log("   POST   /api/auth/login");
      console.log("   POST   /api/auth/logout");
      console.log("   GET    /api/agents/team/:teamId");
      console.log("   PUT    /api/agents/:agentCode/status");
      console.log("   GET    /api/agents/:agentCode/history");
      console.log("   POST   /api/messages/send");
      console.log("   GET    /api/messages/agent/:agentCode");
      console.log("   PUT    /api/messages/:messageId/read\n");
      console.log("🛡️  Rate Limiting:");
      console.log("   - API:  100 req / 15 min");
      console.log("   - Auth: 10 req / 15 min\n");
      console.log("Press Ctrl+C to stop");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error?.message || error);
    process.exit(1);
  }
})();

// ---------- Graceful shutdown ----------
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    server.close(() => console.log("✅ HTTP server closed"));
    if (io) io.close();
    if (global.sqliteDb) {
      try {
        global.sqliteDb.close();
        console.log("✅ SQLite connection closed");
      } catch (e) {
        /* ignore */
      }
    }
  } finally {
    process.exit(0);
  }
});

module.exports = { app, io };