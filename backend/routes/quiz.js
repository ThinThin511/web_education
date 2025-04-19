const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const QuizAssignment = require("../models/QuizAssignment");
const QuizSubmission = require("../models/QuizSubmission");

// 1. Tạo bài kiểm tra (dùng chung)
router.post("/create", async (req, res) => {
  console.log("📥 Dữ liệu nhận được từ client:", req.body);
  try {
    const { title, description, creatorId, duration, questions } = req.body;
    const newQuiz = new Quiz({
      title,
      description,
      creatorId,
      duration,
      questions,
    });
    await newQuiz.save();
    res
      .status(201)
      .json({ message: "Tạo bài kiểm tra thành công", quiz: newQuiz });
  } catch (error) {
    console.error("❌ Lỗi khi tạo quiz:", error.message);
    res.status(500).json({ message: "Lỗi tạo bài kiểm tra", error });
  }
});

// 2. Gán bài kiểm tra vào lớp học (tạo QuizAssignment)
router.post("/assign", async (req, res) => {
  try {
    const { quizId, classId, startTime, endTime, maxAttempts } = req.body;
    const newAssignment = new QuizAssignment({
      quizId,
      classId,
      startTime,
      endTime,
      maxAttempts,
    });
    await newAssignment.save();
    res.status(201).json({
      message: "Gán bài kiểm tra thành công",
      assignment: newAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gán bài kiểm tra", error });
  }
});

// 3. Lấy tất cả bài kiểm tra của người dùng tạo ra
router.get("/by-creator/:creatorId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creatorId: req.params.creatorId });
    res.json(quizzes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách bài kiểm tra", error });
  }
});

// 4. Lấy tất cả bài kiểm tra đã gán vào lớp
router.get("/assigned/:classId", async (req, res) => {
  try {
    const assignments = await QuizAssignment.find({
      classId: req.params.classId,
    }).populate("quizId");
    res.json(assignments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy bài kiểm tra của lớp", error });
  }
});

// 5. Nộp bài kiểm tra (tạo QuizSubmission)
router.post("/submit", async (req, res) => {
  try {
    const { quizAssignmentId, studentId, answers } = req.body;

    const assignment = await QuizAssignment.findById(quizAssignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Không tìm thấy bài kiểm tra" });

    const quiz = await Quiz.findById(assignment.quizId);

    const currentSubmissions = await QuizSubmission.find({
      quizAssignmentId,
      studentId,
    });
    if (currentSubmissions.length >= assignment.maxAttempts) {
      return res.status(400).json({ message: "Đã vượt quá số lần làm bài" });
    }

    // Tính điểm
    let score = 0;
    answers.forEach((ans) => {
      const correct = quiz.questions[ans.questionIndex].correctAnswer;
      if (ans.selectedOption === correct) score++;
    });

    const submission = new QuizSubmission({
      quizAssignmentId,
      studentId,
      answers,
      score,
      attempt: currentSubmissions.length + 1,
    });
    await submission.save();
    res.json({ message: "Nộp bài thành công", submission });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi nộp bài kiểm tra", error });
  }
});

// 6. Lấy danh sách bài làm của học sinh
router.get("/submissions/:assignmentId/:studentId", async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const submissions = await QuizSubmission.find({
      quizAssignmentId: assignmentId,
      studentId,
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy bài làm", error });
  }
});

router.delete("/:id", async (req, res) => {
  const quizId = req.params.id;
  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz không tồn tại." });

    // Xóa các bản ghi assignment của quiz này nếu có
    await QuizAssignment.deleteMany({ quizId });

    // Xoá quiz chính
    await Quiz.findByIdAndDelete(quizId);

    res.json({ message: "Đã xóa bài kiểm tra và các bản ghi liên quan." });
  } catch (err) {
    console.error("Lỗi xóa quiz:", err);
    res.status(500).json({ error: "Lỗi khi xóa bài kiểm tra." });
  }
});
// PUT /api/quizzes/:id

router.put("/:id", async (req, res) => {
  try {
    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedQuiz) {
      return res.status(404).json({ error: "Quiz không tồn tại." });
    }
    res.json({ updatedQuiz });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi cập nhật bài kiểm tra." });
  }
});

module.exports = router;
