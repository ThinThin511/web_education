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
    // Tìm tất cả tin nhắn liên quan đến user
    const allMessages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 }) // sắp xếp để lấy được tin mới nhất mỗi cặp
      .populate("sender", "fullname avatar")
      .populate("receiver", "fullname avatar");

    // Tạo map để lưu unique cặp người dùng với tin nhắn mới nhất
    const conversationMap = new Map();

    for (const msg of allMessages) {
      const otherUser =
        msg.sender._id.toString() === currentUserId ? msg.receiver : msg.sender;

      const key = otherUser._id.toString();

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    // Convert map thành mảng để trả về
    const conversations = Array.from(conversationMap.entries()).map(
      ([userId, data]) => ({
        userId,
        name: data.user.fullname,
        avatar: data.user.avatar,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt,
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Lỗi khi lấy danh sách hội thoại" });
  }
});
module.exports = router;
