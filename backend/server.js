const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const classRoutes = require("./routes/classRoutes");
app.use("/api/classes", classRoutes);

const postRoutes = require("./routes/posts");
app.use("/api/posts", postRoutes);

const assignmentRoutes = require("./routes/assignments");
app.use("/api/assignments", assignmentRoutes);

const notificationRoutes = require("./routes/notificaton");
app.use("/api/notifications", notificationRoutes);

const quizRoutes = require("./routes/quiz");
app.use("/api/quizzes", quizRoutes);

app.get("/", (req, res) => res.send("API is running..."));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
