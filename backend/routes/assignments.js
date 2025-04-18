const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Classroom = require("../models/Class");
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

    const classroom = await Classroom.findById(classId).populate(
      "teachers students",
      "fullname"
    );

    const allMembers = [...classroom.teachers, ...classroom.students];
    const recipients = allMembers.filter(
      (member) => String(member._id) !== String(teacherId)
    );

    const author = await User.findById(teacherId); // Lấy tên người đăng bài

    const notifications = recipients.map((user) => ({
      userId: user._id,
      message: `${author.fullname} đã đăng bài tập mới trong lớp ${classroom.name}`,
      link: `/class/${classId}/assignments`,
      name: author.fullname,
      type: author.avatar,
      isRead: false,
      createdAt: new Date(),
    }));

    // Tạo hàng loạt thông báo
    await Notification.insertMany(notifications);

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

// Lấy danh sách bài nộp của một bài tập
// router.get("/:assignmentId/submissions", async (req, res) => {
//   try {
//     const assignment = await Assignment.findById(
//       req.params.assignmentId
//     ).populate("submissions.studentId");
//     res.json(assignment.submissions);
//   } catch (err) {
//     res.status(500).json({ error: "Không thể lấy bài nộp." });
//   }
// });
// Giáo viên chấm điểm bài nộp
router.patch("/:assignmentId/submissions/:submissionId", async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score } = req.body;

    // Sử dụng update operator để cập nhật trường score cho submission có _id tương ứng
    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, "submissions._id": submissionId },
      { $set: { "submissions.$.score": score } },
      { new: true } // trả về document mới sau khi update
    );

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Assignment hoặc submission không tồn tại" });
    }

    return res.json({
      message: "Cập nhật điểm thành công",
      assignment,
    });
  } catch (error) {
    console.error("Lỗi cập nhật điểm:", error);
    res.status(500).json({ message: "Server error" });
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

    if (assignment.teacherId.toString() !== userId) {
      await Notification.create({
        userId: assignment.teacherId,
        message: `💬 ${populatedComment.userId.fullname} đã bình luận vào bài viết của bạn.`,
        link: `/assignment/${assignment._id}`,
        isRead: false,
        name: populatedComment.userId.fullname,
        type: populatedComment.userId?.avatar,
        createdAt: new Date(),
      });
    }

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

    const replier = await User.findById(userId); // Người gửi reply
    const notifications = new Map(); // Dùng Map để tránh trùng ID

    // ✅ Gửi cho chủ bình luận (nếu không phải là người reply)
    if (String(userId) !== String(comment.userId._id)) {
      notifications.set(String(comment.userId._id), {
        userId: comment.userId._id,
        message: `💬 ${replier.fullname} đã trả lời bình luận của bạn`,
      });
    }

    // ✅ Gửi cho những người từng reply vào bình luận này (trừ chính mình)
    comment.replies.forEach((reply) => {
      const replyUserId = String(reply.userId._id || reply.userId);
      if (replyUserId !== String(userId) && !notifications.has(replyUserId)) {
        notifications.set(replyUserId, {
          userId: reply.userId._id || reply.userId,
          message: `💬 ${replier.fullname} cũng đã trả lời vào một bình luận mà bạn tham gia`,
        });
      }
    });

    // ✅ Tạo thông báo
    const notiDocs = Array.from(notifications.values()).map((n) => ({
      userId: n.userId,
      message: n.message,
      link: `/assignment/${assignment._id}`,
      isRead: false,
      name: replier.fullname,
      type: replier.avatar,
      createdAt: new Date(),
    }));

    if (notiDocs.length > 0) {
      await Notification.insertMany(notiDocs);
    }

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
// nộp bài
router.post(
  "/:assignmentId/submit",
  upload.array("files"),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { assignmentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ" });
      }
      if (!userId) {
        return res.status(400).json({ message: "Thiếu userId" });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment)
        return res.status(404).json({ message: "Bài tập không tồn tại" });

      const submissionData = {
        studentId: userId,
        content: "",
        files: req.files.map(
          (file) => `http://localhost:5000/uploads/assignments/${file.filename}`
        ),
        submittedAt: new Date(),
      };

      const existing = assignment.submissions.find(
        (s) => s.studentId?.toString() === userId
      );

      if (existing) {
        existing.files = submissionData.files;
        existing.submittedAt = submissionData.submittedAt;
      } else {
        assignment.submissions.push(submissionData);
      }

      await assignment.save();
      res.status(200).json({ message: "Nộp bài thành công" });
    } catch (err) {
      console.error("❌ Lỗi khi nộp bài:", err);
      res
        .status(500)
        .json({ message: "Lỗi server khi nộp bài", error: err.message });
    }
  }
);

// Hủy nộp bài và xoá file đính kèm
router.delete("/:assignmentId/submission/:studentId", async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Bài tập không tồn tại" });

    const submissionIndex = assignment.submissions.findIndex(
      (s) => s.studentId.toString() === studentId
    );

    if (submissionIndex === -1)
      return res.status(404).json({ message: "Bài nộp không tồn tại" });

    const submission = assignment.submissions[submissionIndex];
    const files = submission.files || [];

    // Xoá từng file vật lý trong thư mục uploads/assignments
    for (const filePath of files) {
      const filename = filePath.split("/uploads/assignments/")[1];
      if (filename) {
        const fullPath = path.join(
          __dirname,
          "../uploads/assignments",
          filename
        );
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`Đã xoá file: ${fullPath}`);
          } catch (err) {
            console.error(`Không thể xoá file ${fullPath}:`, err);
          }
        }
      }
    }

    // Xoá bài nộp khỏi danh sách submissions
    assignment.submissions.splice(submissionIndex, 1);
    await assignment.save();

    res.status(200).json({ message: "Đã hủy nộp bài và xóa file đính kèm" });
  } catch (error) {
    console.error("Lỗi khi hủy nộp bài:", error);
    res.status(500).json({ message: "Lỗi khi hủy nộp bài" });
  }
});

// Lấy bài nộp của một sinh viên
router.get("/:assignmentId/submission/:studentId", async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        message: "Bài tập không tồn tại",
        code: "ASSIGNMENT_NOT_FOUND",
      });
    }

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId
    );
    if (!submission) {
      return res.status(404).json({
        message: "Sinh viên chưa nộp bài",
        code: "SUBMISSION_NOT_FOUND",
      });
    }

    res.status(200).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi lấy bài nộp" });
  }
});
router.get("/:id/submissions", async (req, res) => {
  try {
    const assignmentId = req.params.id;

    // Tìm assignment + populate tên học sinh trong từng submission
    const assignment = await Assignment.findById(assignmentId).populate(
      "submissions.studentId",
      "fullname"
    ); // Chỉ lấy các trường cần

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Chuẩn bị dữ liệu trả về
    const submissions = assignment.submissions.map((submission) => ({
      id: submission._id,
      fullname: submission.studentId?.fullname || "Không rõ",
      studentId: submission?.studentId,
      score: submission.score || null,
      maxScore: assignment.maxScore || 10,
      files: submission.files,
      submittedAt: submission.submittedAt,
    }));

    return res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
