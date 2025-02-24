const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" }, // Lưu URL ảnh đại diện
    phone: { type: String, unique: true, sparse: true }, // sparse: cho phép giá trị null mà không gây lỗi unique
    birthday: { type: Date, required: false }, // Lưu ngày sinh
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
