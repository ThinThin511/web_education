const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const multer = require("multer");
const path = require("path");

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
      (file) => `/uploads/assignments/${file.filename}`
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

module.exports = router;
