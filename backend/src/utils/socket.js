const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Authenticate socket connection
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'companysecretkey123');
        const userId = decoded.userId;
        const role = decoded.role;

        // Join personal user room
        socket.join(userId);

        // Join role room if admin
        if (role === 'admin') {
          socket.join('admins');
        }
      } catch (err) {
        // Silent catch for invalid/expired tokens
      }
    }

    // Manual registration fallback if client emits "register"
    socket.on('register', (data) => {
      if (data && data.userId) {
        socket.join(data.userId);
        if (data.role === 'admin') {
          socket.join('admins');
        }
      }
    });

    socket.on('disconnect', () => {
      // Socket handles room cleanup automatically
    });
  });

  return io;
};

const sendInAppNotification = (userId, notification) => {
  if (!io) return;
  // Send notification to the user's specific room
  io.to(userId.toString()).emit('notification', notification);
};

const sendAdminNotification = (notification) => {
  if (!io) return;
  // Send to all administrators
  io.to('admins').emit('notification', notification);
};

module.exports = {
  init,
  sendInAppNotification,
  sendAdminNotification,
  getIo: () => io
};
