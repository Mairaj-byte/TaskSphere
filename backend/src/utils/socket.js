const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

let io;

// userId -> socket.id
const onlineUsers = new Map();

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "companysecretkey123"
      );

      socket.userId = decoded.userId;
      socket.role = decoded.role;

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const role = socket.role;

    console.log(`Socket Connected : ${userId}`);

    // Save online user
    onlineUsers.set(userId.toString(), socket.id);

    // Personal room
    socket.join(userId.toString());

    // Admin room
    if (role === "admin") {
      socket.join("admins");
    }

    // Broadcast online
    io.emit("user_online", {
      userId,
    });

    // Join chat room
    socket.on("join_room", async (roomId) => {
      try {
        const room = await ChatRoom.findById(roomId);

        if (!room) return;

        const allowed = room.members.some(
          (member) => member.toString() === userId.toString()
        );

        if (!allowed) return;

        socket.join(roomId);

        socket.emit("joined_room", roomId);
      } catch (err) {
        console.error(err);
      }
    });

    // Leave room
    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    // Typing
    socket.on("typing", ({ roomId, user }) => {
      socket.to(roomId).emit("typing", {
        user,
      });
    });

    // Fixed Stop Typing (Added 'user' to destructuring)
    socket.on("stop_typing", ({ roomId, user }) => {
      socket.to(roomId).emit("typing", {
        userId,
        user,
      });
    });

    // Send message
    socket.on("send_message", async (data) => {
      try {
        const message = await Message.create({
          chatRoom: data.chatRoom,
          sender: userId,
          text: data.text || "",
          attachments: data.attachments || [],
          mentions: data.mentions || [],
          replyTo: data.replyTo || null,
        });

        await message.populate("sender", "name profilePhoto role");
        await message.populate("mentions", "name");
        await message.populate("replyTo");

        await ChatRoom.findByIdAndUpdate(data.chatRoom, {
          lastMessage: message._id,
        });

        io.to(data.chatRoom).emit("receive_message", message);

        // Mention notifications
        if (message.mentions.length) {
          message.mentions.forEach((user) => {
            io.to(user._id.toString()).emit("mentioned", {
              message,
            });
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Read receipt
    socket.on("mark_read", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) return;

        const alreadyRead = message.readBy.some(
          (item) => item.user.toString() === userId.toString()
        );

        if (!alreadyRead) {
          message.readBy.push({
            user: userId,
            readAt: new Date(),
          });

          await message.save();

          io.to(message.chatRoom.toString()).emit("message_read", {
            messageId,
            userId,
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Pin message
    socket.on("pin_message", async ({ messageId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { pinned: true },
          { new: true }
        );

        if (!message) return;

        io.to(message.chatRoom.toString()).emit(
          "message_pinned",
          message
        );
      } catch (err) {
        console.error(err);
      }
    });

    // Delete message
    socket.on("delete_message", async ({ messageId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            deleted: true,
            deletedAt: new Date(),
          },
          { new: true }
        );

        if (!message) return;

        io.to(message.chatRoom.toString()).emit(
          "message_deleted",
          {
            messageId,
          }
        );
      } catch (err) {
        console.error(err);
      }
    });

    // Edit message
    socket.on("edit_message", async ({ messageId, text }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) return;

        if (message.sender.toString() !== userId.toString()) {
          return;
        }

        message.text = text;
        message.edited = true;
        message.editedAt = new Date();

        await message.save();

        io.to(message.chatRoom.toString()).emit(
          "message_updated",
          message
        );
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Socket Disconnected : ${userId}`);

      onlineUsers.delete(userId.toString());

      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
      });

      io.emit("user_offline", {
        userId,
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

// Notification to one user
const sendInAppNotification = (userId, notification) => {
  if (!io) return;

  io.to(userId.toString()).emit(
    "notification",
    notification
  );
};

// Notification to admins
const sendAdminNotification = (notification) => {
  if (!io) return;

  io.to("admins").emit(
    "notification",
    notification
  );
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

const sendTaskUpdate = (userId, taskId) => {
  if (!io) return;

  // Assigned user
  io.to(userId.toString()).emit("taskUpdated", {
    taskId,
  });

  // All admins
  io.to("admins").emit("taskUpdated", {
    taskId,
  });
};

module.exports = {
  init,
  getIo: () => io,
  sendInAppNotification,
  sendAdminNotification,
  getOnlineUsers,
  isUserOnline,
  sendTaskUpdate,
};
