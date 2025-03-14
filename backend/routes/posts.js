const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

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
router.post("/", async (req, res) => {
  const { content, authorId, classId } = req.body;
  if (!content || !authorId || !classId) {
    return res
      .status(400)
      .json({ error: "Thiếu nội dung, tác giả hoặc lớp học" });
  }

  try {
    const newPost = new Post({ content, authorId, classId });
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
