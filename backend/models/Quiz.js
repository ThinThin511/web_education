const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  duration: Number, // thời lượng làm bài (tính bằng phút)
  questions: [
    {
      questionText: String,
      options: {
        A: String,
        B: String,
        C: String,
        D: String,
      },
      correctAnswer: String, // "A", "B", "C", "D"
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", quizSchema);
