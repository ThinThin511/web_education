const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/assignments/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Tạo bài tập (giáo viên)
router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    const { classId, teacherId, title, content, dueDate, maxScore } = req.body;
    const attachments = req.files.map(
      (file) => `http://localhost:5000/uploads/assignments/${file.filename}`
    );

    const newAssignment = new Assignment({
      classId,
      teacherId,
      title,
      content,
      dueDate,
      maxScore,
      attachments,
    });

    const saved = await newAssignment.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Tạo bài tập thất bại." });
  }
});

// Lấy tất cả bài tập của lớp
router.get("/class/:classId", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      classId: req.params.classId,
    }).populate("teacherId");
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy bài tập." });
  }
});

// Học sinh nộp bài
router.post(
  "/:assignmentId/submit",
  upload.array("files"),
  async (req, res) => {
    try {
      const { studentId, content } = req.body;
      const files = req.files.map(
        (file) => `/uploads/assignments/${file.filename}`
      );

      const assignment = await Assignment.findById(req.params.assignmentId);
      if (!assignment)
        return res.status(404).json({ error: "Không tìm thấy bài tập." });

      // Thêm hoặc cập nhật bài nộp
      const existing = assignment.submissions.find(
        (s) => s.studentId.toString() === studentId
      );
      if (existing) {
        existing.submittedAt = new Date();
        existing.content = content;
        existing.files = files;
      } else {
        assignment.submissions.push({ studentId, content, files });
      }

      await assignment.save();
      res.json({ message: "Nộp bài thành công." });
    } catch (err) {
      res.status(500).json({ error: "Nộp bài thất bại." });
    }
  }
);

// Lấy danh sách bài nộp của một bài tập
router.get("/:assignmentId/submissions", async (req, res) => {
  try {
    const assignment = await Assignment.findById(
      req.params.assignmentId
    ).populate("submissions.studentId");
    res.json(assignment.submissions);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy bài nộp." });
  }
});
// Giáo viên chấm điểm bài nộp
router.put("/:assignmentId/grade/:studentId", async (req, res) => {
  try {
    const { score } = req.body;

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment)
      return res.status(404).json({ error: "Không tìm thấy bài tập." });

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === req.params.studentId
    );

    if (!submission)
      return res.status(404).json({ error: "Không tìm thấy bài nộp." });

    submission.score = score;
    await assignment.save();

    res.json({ message: "Chấm điểm thành công.", submission });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi chấm điểm." });
  }
});
router.delete("/:assignmentId", async (req, res) => {
  try {
    // Tìm bài tập theo ID
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment)
      return res.status(404).json({ error: "Bài tập không tồn tại" });

    // Xóa file đính kèm nếu có
    if (assignment.attachments && assignment.attachments.length > 0) {
      for (const fileUrl of assignment.attachments) {
        // Lấy phần sau `/uploads/` trong URL
        const fileName = fileUrl.split("/uploads/")[1];
        if (!fileName) continue; // Nếu không có fileName, bỏ qua

        const fullPath = path.resolve("uploads", fileName);
        console.log("File Path:", fullPath);

        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath); // Xóa file
            console.log(`Đã xóa file: ${fullPath}`);
          } catch (err) {
            console.error(`Không thể xóa file ${fullPath}:`, err);
          }
        } else {
          console.warn(`File không tồn tại: ${fullPath}`);
        }
      }
    }

    // Xóa bài tập khỏi MongoDB
    await Assignment.findByIdAndDelete(req.params.assignmentId);

    res.status(200).json({ message: "Đã xóa bài tập và file đính kèm" });
  } catch (error) {
    console.error("Lỗi khi xóa bài tập:", error);
    res.status(500).json({ error: "Lỗi khi xóa bài tập" });
  }
});

router.put("/:assignmentId", upload.array("files"), async (req, res) => {
  try {
    const { title, content, dueDate, maxScore, removedFiles } = req.body;
    const assignmentId = req.params.assignmentId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ error: "Bài tập không tồn tại" });

    // Xóa các file cũ nếu có trong danh sách removedFiles
    if (removedFiles) {
      const filesToRemove = JSON.parse(removedFiles);
      for (const fileUrl of filesToRemove) {
        const fileName = fileUrl.split("/uploads/assignments/")[1];
        if (!fileName) continue;

        const filePath = path.join(
          __dirname,
          "../uploads/assignments",
          fileName
        );
        console.log("Xóa file:", filePath);

        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Không thể xóa file ${filePath}:`, err);
            else console.log(`Đã xóa file: ${filePath}`);
          });
        } else {
          console.warn(`File không tồn tại: ${filePath}`);
        }
      }

      // Cập nhật lại danh sách attachments, loại bỏ các file đã xóa
      assignment.attachments = assignment.attachments.filter(
        (file) => !filesToRemove.includes(file)
      );
    }

    // Lấy các file mới và thêm vào attachments
    const newFiles = req.files
      ? req.files.map(
          (file) => `http://localhost:5000/uploads/assignments/${file.filename}`
        )
      : [];

    // Cập nhật dữ liệu bài tập
    if (title) assignment.title = title;
    if (content) assignment.content = content;
    if (dueDate) assignment.dueDate = dueDate;
    if (maxScore !== undefined) assignment.maxScore = maxScore;
    // Cập nhật attachments (file đính kèm)
    assignment.attachments = [...assignment.attachments, ...newFiles];

    // Lưu lại bài tập đã cập nhật
    await assignment.save();

    res.status(200).json({ message: "Bài tập đã được cập nhật", assignment });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài tập:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài tập" });
  }
});
router.get("/detail/:assignmentId", async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const assignment = await Assignment.findById(assignmentId).populate(
      "teacherId",
      "fullname "
    );

    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Lỗi khi lấy bài tập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Thêm bình luận
// Thêm bình luận vào bài tập
router.post("/:assignmentId/comments", async (req, res) => {
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

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    const newComment = {
      userId: new mongoose.Types.ObjectId(userId),
      text,
      createdAt: new Date(),
    };

    assignment.comments.push(newComment);
    await assignment.save();

    const populatedAssignment = await Assignment.findById(
      req.params.assignmentId
    ).populate("comments.userId", "fullname avatar");

    const populatedComment =
      populatedAssignment.comments[populatedAssignment.comments.length - 1];
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Lấy danh sách bình luận
router.get("/:assignmentId/comments", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate("comments.userId", "fullname avatar")
      .populate("comments.replies.userId", "fullname avatar");

    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    res.json(assignment.comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
});

// Thêm phản hồi cho bình luận
router.post("/:assignmentId/comments/:commentId/replies", async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc userId" });
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    const comment = assignment.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    comment.replies.push({ userId, text, createdAt: new Date() });
    await assignment.save();
    await assignment.populate(
      "comments.userId comments.replies.userId",
      "fullname avatar"
    );

    res.status(201).json(comment.replies);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Xoá bình luận
router.delete("/:assignmentId/comments/:commentId", async (req, res) => {
  try {
    const { assignmentId, commentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    const commentIndex = assignment.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    assignment.comments.splice(commentIndex, 1);
    await assignment.save();

    res.status(200).json({ message: "Bình luận đã được xóa" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa bình luận", error: error.message });
  }
});

// Cập nhật bình luận
router.put("/:assignmentId/comments/:commentId", async (req, res) => {
  try {
    const { assignmentId, commentId } = req.params;
    const { text } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Bài tập không tồn tại" });
    }

    const comment = assignment.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    comment.text = text || comment.text;
    await assignment.save();

    res.status(200).json({ message: "Bình luận đã được cập nhật", comment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật bình luận", error: error.message });
  }
});

// Xoá phản hồi
router.delete(
  "/:assignmentId/comments/:commentId/replies/:replyId",
  async (req, res) => {
    try {
      const { assignmentId, commentId, replyId } = req.params;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      const comment = assignment.comments.id(commentId);
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
      await assignment.save();

      res.status(200).json({ message: "Phản hồi đã được xóa" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi xóa phản hồi", error: error.message });
    }
  }
);

// Cập nhật phản hồi
router.put(
  "/:assignmentId/comments/:commentId/replies/:replyId",
  async (req, res) => {
    try {
      const { assignmentId, commentId, replyId } = req.params;
      const { text } = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      const comment = assignment.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Bình luận không tồn tại" });
      }

      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Phản hồi không tồn tại" });
      }

      reply.text = text || reply.text;
      await assignment.save();

      res.status(200).json({ message: "Phản hồi đã được cập nhật", reply });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật phản hồi", error: error.message });
    }
  }
);
module.exports = router;
