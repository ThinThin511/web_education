const mongoose = require("mongoose");

const quizAssignmentSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  startTime: Date,
  endTime: Date,
  maxAttempts: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QuizAssignment", quizAssignmentSchema);
