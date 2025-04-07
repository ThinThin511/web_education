const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const multer = require("multer");
const fs = require("fs");
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
      ? req.files.map((file) => `/uploads/assignments/${file.filename}`)
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

module.exports = router;
