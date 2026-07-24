const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { init: initSocket } = require('./utils/socket');
const { startScheduler } = require('./utils/reminders');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server
const startServer = async () => {
  await connectDB();

  startScheduler();

  server.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
  });
};

startServer();

module.exports = { app, server };