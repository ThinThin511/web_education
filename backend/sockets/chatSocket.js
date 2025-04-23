const Message = require("../models/Message");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId); // tham gia vào "phòng" theo userId
    });

    socket.on("send_message", async ({ receiverId, text, senderId }) => {
      const message = new Message({
        text,
        sender: senderId,
        receiver: receiverId,
        read: false,
      });

      await message.save();

      io.to(receiverId).emit("new_message", {
        _id: message._id,
        text: message.text,
        sender: { _id: senderId },
        receiver: receiverId,
        createdAt: message.createdAt,
      });
    });
    socket.on("mark_as_read", async ({ userId, partnerId }) => {
      console.log("Đánh dấu đã đọc:", { userId, partnerId });
      await Message.updateMany(
        { sender: partnerId, receiver: userId, read: false },
        { $set: { read: true } }
      );
    });
  });
};
