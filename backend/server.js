const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load Environment Variables
dotenv.config();

// Config
const connectDB = require("./src/config/db");
const setupMiddleware = require("./src/middleware");
const { init: initSocket } = require("./src/utils/socket");
const { startScheduler } = require("./src/utils/reminders");

// Routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const taskRoutes = require("./src/routes/tasks");
const announcementRoutes = require("./src/routes/announcements");
const notificationRoutes = require("./src/routes/notifications");
const groupRoutes = require("./src/routes/groups");
const chatRoutes = require("./src/routes/chatRoutes");
const departmentRoutes = require("./src/routes/departments"); // NEW
const settingsRoutes = require("./src/routes/settings"); // NEW

// Express App
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Global Middleware
setupMiddleware(app);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/departments", departmentRoutes); // NEW
app.use("/api/settings", settingsRoutes); // NEW

// Initialize Socket.IO
initSocket(server);

// Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Start Reminder Scheduler
    startScheduler();

    // Bound to "0.0.0.0" to allow network connections from mobile devices
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };