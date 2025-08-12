const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Prepare uploads folder
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const userId = (req.body.userId || "anon").toString().replace(/\W+/g, "_");
    cb(null, `user_${userId}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

// Upload avatar
router.post("/:id/avatar", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// Get profile
router.get("/:id", profileController.getUserProfile);

// Update profile
router.put("/:id", profileController.updateUserProfile);

module.exports = router;
