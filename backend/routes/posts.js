const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Classroom = require("../models/Class");
const { type } = require("os");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// API: Lấy danh sách bài viết theo classId
router.get("/:classId", async (req, res) => {
  try {
    const posts = await Post.find({ classId: req.params.classId })
      .populate("authorId", "fullname email avatar")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy bài viết" });
  }
});

// API: Tạo bài viết mới
router.post("/", upload.array("files", 5), async (req, res) => {
  try {
    console.log("Received body:", req.body);
    console.log("Received files:", req.files);
    const { content, authorId, classId } = req.body;
    const filePaths = req.files
      ? req.files.map(
          (file) => `http://localhost:5000/uploads/${file.filename}`
        )
      : [];

    const newPost = new Post({
      content,
      authorId,
      classId,
      files: filePaths, // Lưu danh sách file vào MongoDB
    });

    await newPost.save();

    const classroom = await Classroom.findById(classId).populate(
      "teachers students",
      "fullname"
    );

    const allMembers = [...classroom.teachers, ...classroom.students];
    const recipients = allMembers.filter(
      (member) => String(member._id) !== String(authorId)
    );

    const author = await User.findById(authorId); // Lấy tên người đăng bài

    const notifications = recipients.map((user) => ({
      userId: user._id,
      message: `${author.fullname} đã đăng thông báo mới trong lớp ${classroom.name}`,
      link: `/class/${classId}/feed`,
      name: author.fullname,
      type: author.avatar,
      isRead: false,
      createdAt: new Date(),
    }));

    // Tạo hàng loạt thông báo
    await Notification.insertMany(notifications);

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi đăng bài" });
  }
});

// API: Xóa bài viết theo postId
router.delete("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Bài viết không tồn tại" });

    // Xóa file nếu có
    if (post.files && post.files.length > 0) {
      for (const fileUrl of post.files) {
        // Lấy phần sau `/uploads/` trong URL
        const fileName = fileUrl.split("/uploads/")[1];
        if (!fileName) continue; // Nếu không có fileName, bỏ qua

        const fullPath = path.resolve("uploads", fileName);
        console.log("File Path:", fullPath);

        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`Đã xóa file: ${fullPath}`);
          } catch (err) {
            console.error(`Không thể xóa file ${fullPath}:`, err);
          }
        } else {
          console.warn(`File không tồn tại: ${fullPath}`);
        }
      }
    }

    // Xóa bài viết khỏi MongoDB
    await Post.findByIdAndDelete(req.params.postId);

    res.status(200).json({ message: "Đã xóa bài viết và file đính kèm" });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    res.status(500).json({ error: "Lỗi khi xóa bài viết" });
  }
});
// API cập nhật bài viết
router.put("/:postId", upload.array("files"), async (req, res) => {
  try {
    const { content, removedFiles } = req.body;
    const postId = req.params.postId;

    // Tìm bài viết cần cập nhật
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Bài viết không tồn tại" });

    // Xóa các file cũ nếu có trong danh sách removedFiles
    if (removedFiles) {
      const filesToRemove = JSON.parse(removedFiles); // Chuyển chuỗi JSON thành mảng
      for (const fileUrl of filesToRemove) {
        // Lấy tên file từ URL
        const fileName = fileUrl.split("/uploads/")[1];
        if (!fileName) continue; // Nếu không có tên file, bỏ qua

        const filePath = path.join(__dirname, "../uploads", fileName);
        console.log("Xóa file:", filePath);

        // Kiểm tra và xóa file
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Không thể xóa file ${filePath}:`, err);
            else console.log(`Đã xóa file: ${filePath}`);
          });
        } else {
          console.warn(`File không tồn tại: ${filePath}`);
        }
      }

      // Cập nhật danh sách file của bài viết (loại bỏ file đã xóa)
      post.files = post.files.filter((file) => !filesToRemove.includes(file));
    }

    // Lấy danh sách file mới nếu có
    const newFiles = req.files
      ? req.files.map(
          (file) => `http://localhost:5000/uploads/${file.filename}`
        )
      : [];

    // Cập nhật bài viết
    post.content = content || post.content;
    post.files = [...post.files, ...newFiles];
    await post.save();

    res.status(200).json({ message: "Bài viết đã được cập nhật", post });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài viết" });
  }
});
router.get("/detail/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).populate(
      "authorId",
      "fullname avatar"
    );

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    res.json(post);
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
router.post("/:postId/comments", async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Bạn cần đăng nhập để bình luận" });
    }

    if (!text || text.trim() === "") {
      return res
        .status(400)
        .json({ message: "Nội dung bình luận không được để trống" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const newComment = {
      userId: new mongoose.Types.ObjectId(userId),
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Populate lại bình luận vừa thêm
    const populatedPost = await Post.findById(req.params.postId).populate(
      "comments.userId",
      "fullname avatar"
    );

    // Lấy bình luận cuối cùng từ post đã populate
    const populatedComment =
      populatedPost.comments[populatedPost.comments.length - 1];

    if (post.authorId.toString() !== userId) {
      await Notification.create({
        userId: post.authorId,
        message: `💬 ${populatedComment.userId.fullname} đã bình luận vào bài viết của bạn.`,
        link: `/post/${post._id}`,
        isRead: false,
        name: populatedComment.userId.fullname,
        type: populatedComment.userId.avatar,
        createdAt: new Date(),
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
router.get("/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("comments.userId", "fullname avatar")
      .populate({
        path: "comments.replies.userId",
        select: "fullname avatar",
      });

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});
router.post("/:postId/comments/:commentId/replies", async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc userId" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    comment.replies.push({
      userId,
      text,
      createdAt: new Date(),
    });

    await post.save();
    await post.populate(
      "comments.userId comments.replies.userId",
      "fullname avatar"
    );

    if (String(userId) !== String(comment.userId)) {
      const replier = await User.findById(userId); // Lấy thông tin người trả lời

      await Notification.create({
        userId: comment.userId, // Người nhận thông báo
        message: `💬 ${replier.fullname} đã trả lời bình luận của bạn`,
        link: `/post/${post._id}`, // Đường dẫn đến bài viết
        isRead: false,
        name: replier.fullname,
        type: replier.avatar,
        createdAt: new Date(),
      });
    }

    res.status(201).json(comment.replies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
// API: Xoá bình luận
router.delete("/:postId/comments/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Xoá bình luận trong bài viết
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({ message: "Bình luận đã được xóa" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa bình luận", error: error.message });
  }
});
// API: Cập nhật bình luận
router.put("/:postId/comments/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Tìm và cập nhật bình luận
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    comment.text = text || comment.text;
    await post.save();

    res.status(200).json({ message: "Bình luận đã được cập nhật", comment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật bình luận", error: error.message });
  }
});
// API: Xoá phản hồi
router.delete(
  "/:postId/comments/:commentId/replies/:replyId",
  async (req, res) => {
    try {
      const { postId, commentId, replyId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      const replyIndex = comment.replies.findIndex(
        (reply) => reply._id.toString() === replyId
      );
      if (replyIndex === -1) {
        return res.status(404).json({ message: "Phản hồi không tồn tại" });
      }

      comment.replies.splice(replyIndex, 1);
      await post.save();

      res.status(200).json({ message: "Phản hồi đã được xóa" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi xóa phản hồi", error: error.message });
    }
  }
);
// API: Cập nhật phản hồi
router.put(
  "/:postId/comments/:commentId/replies/:replyId",
  async (req, res) => {
    try {
      const { postId, commentId, replyId } = req.params;
      const { text } = req.body;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Bài viết không tồn tại" });
      }

      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Phản hồi không tồn tại" });
      }

      reply.text = text || reply.text;
      await post.save();

      res.status(200).json({ message: "Phản hồi đã được cập nhật", reply });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật phản hồi", error: error.message });
    }
  }
);

module.exports = router;
