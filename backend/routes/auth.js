const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const otpCache = require("../ultils/otpCache");
const { sendEmail } = require("../ultils/mailer");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullname, email, password, avatar, phone, birthday } = req.body;
    if (!fullname || !email || !password)
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã được sử dụng" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      avatar,
      phone,
      birthday,
    });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});
// Đăng nhập
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu không đúng" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        birthday: user.birthday,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});
router.put("/update", async (req, res) => {
  try {
    const { id, fullname, phone, birthday, avatar } = req.body;

    if (!id) return res.status(400).json({ message: "Thiếu ID người dùng" });

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...(fullname && { fullname }),
        ...(phone && { phone }),
        ...(birthday && { birthday }),
        ...(avatar && { avatar }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.json({ message: "Cập nhật thành công", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi cập nhật" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Lưu file vào thư mục "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file duy nhất
  },
});

const upload = multer({ storage });

// API nhận file upload
router.post("/upload", upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const userId = req.body.userId; // Nhận userId từ frontend
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Xóa ảnh cũ nếu tồn tại
    if (
      user.avatar &&
      user.avatar.startsWith("http://localhost:5000/uploads/")
    ) {
      const oldImagePath = path.join(
        __dirname,
        "../",
        user.avatar.replace("http://localhost:5000/", "")
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Cập nhật avatar mới vào database
    const newAvatarUrl = `/uploads/${req.file.filename}`;
    user.avatar = newAvatarUrl;
    await user.save();

    res.json({ imageUrl: newAvatarUrl });
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
router.get("/user", async (req, res) => {
  try {
    // Lấy token từ headers
    const token = req.header("Authorization");
    if (!token) {
      return res
        .status(401)
        .json({ message: "Không có token, từ chối truy cập" });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    res.json(user);
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.put("/change-password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Thiếu thông tin" });
  }

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});
// Xác minh OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ valid: false, message: "Thiếu email hoặc mã OTP" });
  }

  const cached = otpCache.get(email);
  if (!cached) {
    return res
      .status(400)
      .json({ valid: false, message: "Không tìm thấy mã OTP" });
  }

  if (Date.now() > cached.expiresAt) {
    otpCache.delete(email);
    return res.status(400).json({ valid: false, message: "Mã OTP đã hết hạn" });
  }

  if (cached.otp !== otp) {
    return res
      .status(400)
      .json({ valid: false, message: "Mã OTP không chính xác" });
  }

  otpCache.delete(email); // OTP đúng thì xóa
  res.json({ valid: true });
});
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Gửi OTP qua email
router.post("/send-otp", async (req, res) => {
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password)
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "Email đã được sử dụng" });

  if (!email) return res.status(400).json({ message: "Thiếu email" });
  console.log("otpCache:", otpCache);
  const otp = generateOTP();
  const expiresAt = Date.now() + 60 * 1000; // 1 phút
  console.log("otp:", otp);
  otpCache.set(email, { otp, expiresAt });

  try {
    await sendEmail({
      to: email,
      subject: "Mã xác thực đăng ký tài khoản",
      html: `<p>Mã OTP của bạn là: ${otp}. Mã sẽ hết hạn sau 1 phút.</p>`,
    });

    res.json({ message: "Gửi mã OTP thành công" });
  } catch (err) {
    console.error("❌ Gửi mail thất bại:", err);
    res.status(500).json({ message: "Không thể gửi mã OTP" });
  }
});

router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

module.exports = router;
