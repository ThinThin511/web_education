const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: { type: Date, default: Date.now },
  files: [String],
  content: String,
  score: Number,
});

const assignmentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: String,
    dueDate: Date,
    maxScore: Number,
    attachments: [String],
    submissions: [submissionSchema],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: Date,
        replies: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: String,
            createdAt: Date,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
