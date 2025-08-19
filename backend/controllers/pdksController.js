const db = require("../db/connection");

// GET records for one person
exports.getRecordsByPersonelId = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT * FROM pdks_entry 
      WHERE personnel_per_id = ?
      ORDER BY pdks_date DESC
    `,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// GET records for one date
exports.getRecordsByDate = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
     SELECT 
  p.per_id,
  p.per_name,
  p.per_lname,
  p.per_department,
  p.per_role,
  p.per_status,
  p.avatar_url,
  e.pdks_date,
  e.pdks_checkInTime,
  e.pdks_checkOutTime
FROM personnel p
LEFT JOIN pdks_entry e 
  ON p.per_id = e.personnel_per_id 
  AND DATE(e.pdks_date) = ?
ORDER BY 
  -- Order first by whether there's a check-in: non-NULL first (0), NULL last (1)
  e.pdks_checkInTime DESC

    `,
      [req.params.date]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

const PRIVATE_KEY = process.env.PDKS_PRIVATE_KEY || "fallbackSecret";

const crypto = require("crypto");

function generateToken(time, secret) {
  const data = `${time}${secret}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 8);
}

function isValidToken(clientToken, secret) {
  const now = new Date();
  const timeFormats = [
    now,
    new Date(now.getTime() - 60000), // 1 min earlier (grace window)
    new Date(now.getTime() + 60000), // 1 min later (optional)
  ];

  return timeFormats.some((time) => {
    const timestamp = time.toISOString().replace(/[-T:]/g, "").slice(0, 12); // YYYYMMDDHHmm
    const expected = generateToken(timestamp, secret);
    return expected === clientToken;
  });
}

// ✅ NEW: Submit QR Scan (check-in / check-out)
exports.submitEntry = async (req, res) => {
  try {
    const { employeeId, token } = req.body;
    const PRIVATE_KEY = process.env.PDKS_PRIVATE_KEY || "fallbackSecret";

    if (!employeeId || !token) {
      return res
        .status(400)
        .json({ error: "Employee ID and token are required" });
    }

    // ✅ Token verification
    if (!isValidToken(token, PRIVATE_KEY)) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Offset in minutes (e.g. UTC+3 = 180 minutes)

    const now = new Date();
    const localTime = new Date(now.getTime());

    // Format date: YYYY-MM-DD
    const dateOnly = localTime.toISOString().slice(0, 10);

    // Format time: HH:MM:SS
    const timeOnly = localTime.toTimeString().slice(0, 8);

    // Combine to full local time string
    const currentTime = `${dateOnly} ${timeOnly}`;
    const midnight = `${dateOnly} 00:00:00`;

    const [rows] = await db.query(
      `SELECT * FROM pdks_entry 
       WHERE personnel_per_id = ? AND DATE(pdks_date) = ?`,
      [employeeId, dateOnly]
    );

    if (rows.length > 0) {
      await db.query(
        `UPDATE pdks_entry 
         SET pdks_checkOutTime = ? 
         WHERE personnel_per_id = ? AND DATE(pdks_date) = ?`,
        [currentTime, employeeId, dateOnly]
      );
      return res.json({
        message: "Checkout time recorded",
        checkOut: currentTime,
      });
    } else {
      await db.query(
        `INSERT INTO pdks_entry (pdks_date, pdks_checkInTime, personnel_per_id)
         VALUES (?, ?, ?)`,
        [midnight, currentTime, employeeId]
      );
      return res
        .status(201)
        .json({ message: "Check-in time recorded", checkIn: currentTime });
    }
  } catch (err) {
    console.error("SubmitEntry error:", err);
    res.status(500).json({ error: "Server error during check-in/out" });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Total personnel
    const [[{ totalPersonnel }]] = await db.query(`
      SELECT COUNT(*) AS totalPersonnel FROM personnel
    `);

    // Total departments
    const [[{ totalDepartments }]] = await db.query(`
      SELECT COUNT(*) AS totalDepartments FROM departments
    `);

    // Today's entries with valid check-in time
    const [todayEntries] = await db.query(
      `
      SELECT personnel_per_id, pdks_date, pdks_checkInTime
      FROM pdks_entry
      WHERE pdks_date = ?
        AND pdks_checkInTime != '00:00:00'
      ORDER BY pdks_checkInTime DESC
    `,
      [today]
    );

    // Get last entry time
    let lastEntryTime = "-";
    if (todayEntries.length > 0) {
      const last = todayEntries[0];
      const combinedDateTime = new Date(
        `${last.pdks_date}T${last.pdks_checkInTime}`
      );
      lastEntryTime = combinedDateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    // All personnel
    const [allPersonnel] = await db.query(`
      SELECT per_id, per_name, per_lname FROM personnel
    `);

    // Build check-in map
    const checkInMap = {};
    todayEntries.forEach((entry) => {
      checkInMap[entry.personnel_per_id] = new Date(
        `${entry.pdks_date}T${entry.pdks_checkInTime}`
      );
    });

    let onTimeToday = 0;
    const absentNames = [];

    allPersonnel.forEach((p) => {
      const checkIn = checkInMap[p.per_id];
      if (!checkIn) {
        absentNames.push(`${p.per_name} ${p.per_lname}`);
      } else {
        const hour = checkIn.getHours();
        const minute = checkIn.getMinutes();
        if (hour < 8 || (hour === 8 && minute < 10)) {
          onTimeToday++;
        }
      }
    });

    res.json({
      totalPersonnel,
      totalDepartments,
      todaysEntries: todayEntries.length,
      lastEntryTime,
      onTimeToday,
      absentToday: absentNames.length,
      absentNames,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
};

// GET average check-in minutes per day in a date range
// Query params: from=YYYY-MM-DD, to=YYYY-MM-DD
exports.getAverageCheckInRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Query params 'from' and 'to' are required (YYYY-MM-DD)",
      });
    }

    const [rows] = await db.query(
      `
      SELECT 
        DATE(pdks_date) AS date,
        ROUND(AVG(TIME_TO_SEC(pdks_checkInTime)/60)) AS avgMinutes
      FROM pdks_entry
      WHERE pdks_checkInTime IS NOT NULL
        AND pdks_checkInTime <> '00:00:00'
        AND DATE(pdks_date) BETWEEN ? AND ?
      GROUP BY DATE(pdks_date)
      ORDER BY DATE(pdks_date)
    `,
      [from, to]
    );

    res.json(rows);
  } catch (err) {
    console.error("getAverageCheckInRange error:", err);
    res.status(500).json({ error: "Failed to get average check-in range" });
  }
};

// GET leaderboard of most on-time personnel within last N days
// Query: days=30, threshold=08:30:00, limit=1
exports.getOnTimeLeaderboard = async (req, res) => {
  try {
    const days = Math.max(
      1,
      Math.min(365, parseInt(req.query.days || "30", 10))
    );
    const threshold =
      (req.query.threshold || "08:30:00").length === 5
        ? `${req.query.threshold}:00`
        : req.query.threshold || "08:30:00";
    const limit = Math.max(
      1,
      Math.min(50, parseInt(req.query.limit || "5", 10))
    );

    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - (days - 1));
    const from = fromDate.toISOString().slice(0, 10);

    const [rows] = await db.query(
      `
      SELECT 
        p.per_id,
        p.per_name,
        p.per_lname,
        p.per_department,
        COUNT(*) AS onTimeDays
      FROM pdks_entry e
      JOIN personnel p ON p.per_id = e.personnel_per_id
      WHERE DATE(e.pdks_date) BETWEEN ? AND ?
        AND e.pdks_checkInTime IS NOT NULL
        AND e.pdks_checkInTime <> '00:00:00'
        AND e.pdks_checkInTime <= ?
      GROUP BY e.personnel_per_id
      ORDER BY onTimeDays DESC, MIN(e.pdks_checkInTime) ASC
      LIMIT ?
    `,
      [from, to, threshold, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error("getOnTimeLeaderboard error:", err);
    res.status(500).json({ error: "Failed to get on-time leaderboard" });
  }
};
