const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");         // Make sure to import the User model
const Message = require("../models/Message");

const getChatRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await ChatRoom.find({
      members: userId,
      isActive: true,
    })
      .populate("members", "name email profilePhoto role")
      .populate("admins", "name email profilePhoto")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch chat rooms.",
    });
  }
};

// Create new room
const createRoom = async (req, res) => {
  try {
    const { name, description, members, type, group } = req.body;

    console.log(req.user);

    const room = await ChatRoom.create({
      name,
      description,
      type: type || "group",
      group: group || null,
      members,
      admins: [req.user._id],
createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Chat room created successfully.",
      data: room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create chat room.",
    });
  }
};

// Get messages
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({
      chatRoom: roomId,
      deleted: false,
    })
      .populate("sender", "name profilePhoto role")
      .populate("mentions", "name")
      .populate("replyTo")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
    });
  }
};

// Send message (REST API)
const sendMessage = async (req, res) => {
  try {
    const {
      chatRoom,
      text,
      attachments,
      mentions,
      replyTo,
    } = req.body;

    const message = await Message.create({
      chatRoom,
      sender: req.user._id,
      text,
      attachments: attachments || [],
      mentions: mentions || [],
      replyTo: replyTo || null,
    });

    await ChatRoom.findByIdAndUpdate(chatRoom, {
      lastMessage: message._id,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profilePhoto role")
      .populate("mentions", "name")
      .populate("replyTo");

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};



// Add member
const addMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { email } = req.body; // Expecting 'email' now instead of 'userId'

    // 1. Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found.",
      });
    }

    // 2. Add the user's ID to the chat room
    // $addToSet ensures the user isn't added twice if they are already a member
    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        $addToSet: {
          members: user._id,
        },
      },
      {
        new: true,
      }
    ).populate("members", "name email profilePhoto");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member added successfully.",
      data: room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to add member.",
    });
  }
};

// Remove member
const removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        $pull: {
          members: userId,
          admins: userId,
        },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Member removed successfully.",
      data: room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to remove member.",
    });
  }
};

// Read receipt
const markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    const alreadyRead = message.readBy.some(
      (item) => item.user.toString() === req.user._id
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });

      await message.save();
    }

    res.status(200).json({
      success: true,
      message: "Message marked as read.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to mark message as read.",
    });
  }
};

// Edit Message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    // Validate text
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    // Prevent editing deleted messages
    if (message.deleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted messages cannot be edited.",
      });
    }

    // Check ownership
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this message.",
      });
    }

    message.text = text.trim();
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message updated successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Edit Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to edit message.",
    });
  }
};

// Delete Message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    // Check ownership
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this message.",
      });
    }

    // Prevent deleting twice
    if (message.deleted) {
      return res.status(400).json({
        success: false,
        message: "Message is already deleted.",
      });
    }

    message.deleted = true;
    message.deletedAt = new Date();

    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message.",
    });
  }
};

// Pin message
const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: true,
      },
      {
        new: true,
      }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message pinned successfully.",
      data: message,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to pin message.",
    });
  }
};

// Unpin message
const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        pinned: false,
      },
      {
        new: true,
      }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message unpinned successfully.",
      data: message,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to unpin message.",
    });
  }
};

module.exports = {
  getChatRooms,
  createRoom,
  getMessages,
  sendMessage,
  addMember,
  removeMember,
  markMessageRead,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage
};