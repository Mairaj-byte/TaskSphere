const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Local modules & config
const connectDB = require('./src/config/db');
const setupMiddleware = require('./src/middleware');
const { init: initSocket } = require('./src/utils/socket');
const { startScheduler } = require('./src/utils/reminders');

// Routes
const authRoutes = require('./src/routes/auth');
const groupRoutes = require('./src/routes/groups');
const userRoutes = require('./src/routes/users');
const taskRoutes = require('./src/routes/tasks');
const notificationRoutes = require('./src/routes/notifications');

// Initialize Express App & HTTP Server
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// 1. Setup Global Middleware
setupMiddleware(app);

// 2. Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/groups", groupRoutes);

// 4. Initialize Socket.io
initSocket(server);

// 5. Start Server
const startServer = async () => {
  try {
    await connectDB();

    startScheduler();

    server.listen(PORT, () => {
      console.log(`Server Running On Port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };