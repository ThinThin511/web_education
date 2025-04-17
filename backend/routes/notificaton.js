const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// POST /api/notifications
router.post("/", async (req, res) => {
  const { userId, type, message, link } = req.body;
  const notification = await Notification.create({
    userId,
    type,
    message,
    link,
  });
  res.status(201).json(notification);
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  res.json(notification);
});
// GET /api/notifications/:userId
router.get("/:userId", async (req, res) => {
  const notifications = await Notification.find({
    userId: req.params.userId,
  }).sort({ createdAt: -1 });
  res.json(notifications);
});
module.exports = router;
