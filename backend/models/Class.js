const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  classCode: { type: String, unique: true, required: true },
  image: { type: String },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  teacherInviteCodes: [{ type: String }],
});

module.exports = mongoose.model("Class", ClassSchema);
