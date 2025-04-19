const mongoose = require("mongoose");

const quizSubmissionSchema = new mongoose.Schema({
  quizAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizAssignment",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: String, // "A", "B", "C", "D"
    },
  ],
  score: Number,
  attempt: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("QuizSubmission", quizSubmissionSchema);
