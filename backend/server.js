// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const personnelRoutes = require("./routes/personnelRoutes");
const pdksRoutes = require("./routes/pdksRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reportingRoutes = require("./routes/reportingRoutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads dir exists (public/uploads)
const uploadsDir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Serve uploaded files at /uploads/...
app.use("/uploads", express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const userId = (req.body.userId || "anon").toString().replace(/\W+/g, "_");
    cb(null, `user_${userId}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(/image\/(png|jpe?g|gif|webp)/i.test(file.mimetype) ? null : new Error("Only image files are allowed"), true),
});

// Upload endpoint (expects FormData field: "file")
app.post("/api/upload/profile", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// API routes
app.use("/api/personnel", personnelRoutes);
app.use("/api/pdks", pdksRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reporting", reportingRoutes);


// Error handler
app.use((err, _req, res, _next) => {
  const status = err.name === "MulterError" ? 400 : 500;
  res.status(status).json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads available at http://localhost:${PORT}/uploads/<filename>`);
});
