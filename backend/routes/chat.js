const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Lấy lịch sử tin nhắn giữa currentUser và receiver
router.get("/messages/:receiverId", async (req, res) => {
  const currentUserId = req.userId || req.headers["x-user-id"];
  const receiverId = req.params.receiverId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: receiverId },
        { sender: receiverId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullname avatar")
      .populate("receiver", "fullname avatar"); // <-- thêm đoạn này

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy tin nhắn" });
  }
});
router.get("/conversations", async (req, res) => {
  const currentUserId = req.userId || req.headers["x-user-id"];

  try {
    const allMessages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "fullname avatar")
      .populate("receiver", "fullname avatar");

    const conversationMap = new Map();
    const unreadCountMap = new Map();

    for (const msg of allMessages) {
      const isSender = msg.sender._id.toString() === currentUserId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
        });
      }

      // Nếu là tin nhắn gửi đến mình và chưa đọc
      if (!isSender && msg.read === false) {
        unreadCountMap.set(
          otherUserId,
          (unreadCountMap.get(otherUserId) || 0) + 1
        );
      }
    }

    const conversations = Array.from(conversationMap.entries()).map(
      ([userId, data]) => ({
        userId,
        name: data.user.fullname,
        avatar: data.user.avatar,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt,
        unreadCount: unreadCountMap.get(userId) || 0, // 👈 gán số tin chưa đọc
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Lỗi khi lấy danh sách hội thoại" });
  }
});
router.get("/unread-count", async (req, res) => {
  const userId = req.query.userId;
  const count = await Message.countDocuments({ receiver: userId, read: false });
  res.json({ count });
});
module.exports = router;
