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
const db = require("./db/connection");
const cron = require("node-cron");
const fetch = require("node-fetch");

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
    cb(
      /image\/(png|jpe?g|gif|webp)/i.test(file.mimetype)
        ? null
        : new Error("Only image files are allowed"),
      true
    ),
});

// Upload endpoint (expects FormData field: "file")
app.post("/api/upload/profile", upload.single("file"), (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
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
  res
    .status(status)
    .json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Uploads available at http://localhost:${PORT}/uploads/<filename>`
  );

  // Ensure device_tokens table exists (simple per_id -> expo_token mapping)
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        per_id INT PRIMARY KEY,
        expo_token VARCHAR(255) NOT NULL,
        platform VARCHAR(32) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("device_tokens table ensured");
  } catch (e) {
    console.error("Failed ensuring device_tokens table:", e.message);
  }
});

// Register device token endpoint
// Body: { per_id: number, expoToken: string, platform?: string }
app.post("/api/notify/register", async (req, res) => {
  try {
    const { per_id, expoToken, platform } = req.body || {};
    if (!per_id || !expoToken || typeof expoToken !== "string") {
      return res
        .status(400)
        .json({ error: "per_id and expoToken are required" });
    }
    await db.query(
      `INSERT INTO device_tokens (per_id, expo_token, platform)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE expo_token = VALUES(expo_token), platform = VALUES(platform)`,
      [Number(per_id), expoToken, platform || null]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error("/api/notify/register error:", e);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Helper to send Expo push notifications in batches
async function sendExpoPushBatch(messages) {
  if (!messages || messages.length === 0) return [];
  try {
    console.log(`Sending ${messages.length} push notifications to Expo...`);
    console.log("Messages:", JSON.stringify(messages, null, 2));
    const resp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    const json = await resp.json();
    console.log("Expo response:", JSON.stringify(json, null, 2));
    return json?.data || [];
  } catch (e) {
    console.error("Expo push error:", e.message);
    return [];
  }
}

// Cron job: every day at 13:58 local server time (test)
cron.schedule("58 13 * * *", async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Select personnel who checked in today but did not check out yet, and have a device token
    const [rows] = await db.query(
      `
      SELECT dt.per_id, dt.expo_token
      FROM device_tokens dt
      JOIN pdks_entry e
        ON e.personnel_per_id = dt.per_id
       AND DATE(e.pdks_date) = ?
      WHERE e.pdks_checkInTime IS NOT NULL
        AND e.pdks_checkInTime <> '00:00:00'
        AND (e.pdks_checkOutTime IS NULL OR e.pdks_checkOutTime = '' OR e.pdks_checkOutTime = '00:00:00')
        AND NOT EXISTS (
          SELECT 1 FROM leave_request lr
          WHERE lr.personnel_per_id = dt.per_id
            AND (lr.status = 'Approved' OR lr.status = 'Pending')
            AND ? BETWEEN lr.request_start_date AND lr.request_end_date
        )
      `,
      [today, today]
    );

    if (!rows || rows.length === 0) return;

    // Build push messages (chunked by 100)
    const messages = rows
      .filter(
        (r) =>
          typeof r.expo_token === "string" &&
          r.expo_token.startsWith("ExponentPushToken")
      )
      .map((r) => ({
        to: r.expo_token,
        sound: "default",
        title: "Checkout Reminder",
        body: "You haven't checked out yet. Please check out.",
        priority: "high",
      }));

    const chunkSize = 90;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await sendExpoPushBatch(chunk);
    }
    console.log(`Checkout reminder sent to ${messages.length} devices.`);
  } catch (e) {
    console.error("Cron 17:15 notify error:", e.message);
  }
});

// Manual trigger to test notifications immediately
app.post("/api/notify/run-now", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    console.log("Checking for candidates on date:", today);

    const [rows] = await db.query(
      `
      SELECT dt.per_id, dt.expo_token
      FROM device_tokens dt
      JOIN pdks_entry e
        ON e.personnel_per_id = dt.per_id
       AND DATE(e.pdks_date) = ?
      WHERE e.pdks_checkInTime IS NOT NULL
        AND e.pdks_checkInTime <> '00:00:00'
        AND (e.pdks_checkOutTime IS NULL OR e.pdks_checkOutTime = '' OR e.pdks_checkOutTime = '00:00:00')
        AND NOT EXISTS (
          SELECT 1 FROM leave_request lr
          WHERE lr.personnel_per_id = dt.per_id
            AND (lr.status = 'Approved' OR lr.status = 'Pending')
            AND ? BETWEEN lr.request_start_date AND lr.request_end_date
        )
      `,
      [today, today]
    );

    console.log("Raw rows from DB:", rows);

    const messages = (rows || [])
      .filter(
        (r) =>
          typeof r.expo_token === "string" &&
          r.expo_token.startsWith("ExponentPushToken")
      )
      .map((r) => ({
        to: r.expo_token,
        sound: "default",
        title: "Checkout Reminder",
        body: "You haven't checked out yet. Please check out.",
        priority: "high",
      }));

    console.log("Filtered messages:", messages);

    const chunkSize = 90;
    let sent = 0;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await sendExpoPushBatch(chunk);
      sent += chunk.length;
    }
    return res.json({
      success: true,
      candidates: rows?.length || 0,
      pushed: sent,
    });
  } catch (e) {
    console.error("/api/notify/run-now error:", e.message);
    return res.status(500).json({ error: "Run failed" });
  }
});
