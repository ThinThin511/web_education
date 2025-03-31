const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

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
      ? req.files.map((file) => `/uploads/${file.filename}`)
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

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
router.get("/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      "comments.userId",
      "fullname avatar"
    );

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

module.exports = router;
