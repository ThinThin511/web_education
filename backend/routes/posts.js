const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const multer = require("multer");

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
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi đăng bài" });
  }
});

// API: Xóa bài viết theo postId
router.delete("/:postId", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: "Đã xóa bài viết" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa bài viết" });
  }
});

module.exports = router;
