const express = require("express");
const router = express.Router();
const multer = require("multer");
const Class = require("../models/Class"); // Model lớp học
const User = require("../models/User");

// Cấu hình multer để lưu ảnh (không bắt buộc)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Lưu vào thư mục uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname); // Tạo tên file duy nhất
  },
});

const upload = multer({ storage });

// API tạo lớp học (chỉ lưu dữ liệu, không random mã lớp)
const mongoose = require("mongoose");

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { name, description, classCode, creatorId } = req.body;

    if (!name || !classCode || !creatorId) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    // Ép kiểu creatorId sang ObjectId
    const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

    // Đường dẫn ảnh (nếu có)
    const imagePath = req.file
      ? `http://localhost:5000/uploads/${req.file.filename}`
      : null;

    const newClass = new Class({
      name,
      description,
      classCode,
      teachers: [creatorObjectId],
      image: imagePath, // Lưu đường dẫn thay vì base64
    });

    console.log("Dữ liệu trước khi lưu:", newClass);

    await newClass.save();
    res.status(201).json({ message: "Lớp học đã được tạo", class: newClass });
  } catch (error) {
    console.error("Lỗi khi tạo lớp:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { classCode, userId } = req.body;

    if (!classCode || !userId) {
      return res.status(400).json({ message: "Thiếu mã lớp học hoặc userId" });
    }

    // Ép kiểu userId sang ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Tìm lớp học theo mã
    const existingClass = await Class.findOne({ classCode });

    if (!existingClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra xem user đã là học sinh của lớp chưa
    if (existingClass.students.includes(userObjectId)) {
      return res.status(200).json({ message: "Bạn đã tham gia lớp này rồi" });
    }

    // Thêm user vào danh sách học sinh
    existingClass.students.push(userObjectId);
    await existingClass.save();

    res.json({ message: "Tham gia lớp học thành công!", class: existingClass });
  } catch (error) {
    console.error("Lỗi khi tham gia lớp:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("📌 API classes được gọi với userId:", userId);

    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const classes = await Class.find({
      $or: [{ teachers: userObjectId }, { students: userObjectId }],
    })
      .populate("teachers", "fullname avatar") // Lấy thông tin giáo viên từ User
      .populate("students", "fullname");

    console.log("📌 Danh sách lớp trả về:", classes);
    res.json({ classes });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách lớp:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
