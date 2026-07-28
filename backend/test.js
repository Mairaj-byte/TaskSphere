const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const ChatRoom = require("./src/models/ChatRoom");
const Message = require("./src/models/Message");

const MONGO_URI =
  "mongodb+srv://mairajk929_db_user:hMhBYIqj7GclzJ5P@cluster0.8cm49i2.mongodb.net/?appName=Cluster0";

const ADMIN_ID = "6a61cc461aec019462e390c6";
const MEMBER_ID = "6a652818bada8d20e39eada2";

async function seedMessages() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB Connected");

    const room = await ChatRoom.findOne({
      name: "General Team Chat",
    });

    if (!room) {
      console.log("❌ Chat room not found.");
      process.exit(1);
    }

    const existingMessages = await Message.countDocuments({
      chatRoom: room._id,
    });

    if (existingMessages > 0) {
      console.log("⚠ Messages already exist for this room.");
      process.exit(0);
    }

    const messages = await Message.insertMany([
      {
        chatRoom: room._id,
        sender: ADMIN_ID,
        text: "Welcome everyone to the General Team Chat! 🎉",
        attachments: [],
        mentions: [],
        replyTo: null,
        readBy: [
          {
            user: ADMIN_ID,
          },
        ],
      },
      {
        chatRoom: room._id,
        sender: MEMBER_ID,
        text: "Thank you! Happy to be here.",
        attachments: [],
        mentions: [],
        replyTo: null,
        readBy: [
          {
            user: ADMIN_ID,
          },
          {
            user: MEMBER_ID,
          },
        ],
      },
      {
        chatRoom: room._id,
        sender: ADMIN_ID,
        text: "Please use this room for project discussions and updates.",
        attachments: [],
        mentions: [MEMBER_ID],
        replyTo: null,
        readBy: [
          {
            user: ADMIN_ID,
          },
        ],
      },
      {
        chatRoom: room._id,
        sender: MEMBER_ID,
        text: "Sure! I'll share today's progress shortly.",
        attachments: [],
        mentions: [],
        replyTo: null,
        readBy: [],
      },
    ]);

    // Update chat room last message
    room.lastMessage = messages[messages.length - 1]._id;
    await room.save();

    console.log("✅ Dummy messages inserted successfully.");
    console.log(`Inserted ${messages.length} messages.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedMessages();