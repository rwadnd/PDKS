const db = require('../db/connection');

// GET all PDKS records
exports.getAllRecords = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pk.*,
        p.per_name,
        p.per_lname,
        p.per_department,
        p.per_role
      FROM pdks_entry pk
      JOIN personnel p ON pk.personnel_per_id = p.per_id
      ORDER BY pk.pdks_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("PDKS fetch error:", err);
    res.status(500).json({ error: 'Database error' });
  }
};

// GET records for one person
exports.getRecordsByPersonelId = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM pdks_entry 
      WHERE personnel_per_id = ?
      ORDER BY pdks_date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// GET records for one date
exports.getRecordsByDate = async (req, res) => {
  try {
    const [rows] = await db.query(`
     SELECT 
  p.per_id,
  p.per_name,
  p.per_lname,
  p.per_department,
  p.per_role,
  p.per_status,
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

    `, [req.params.date]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};
// POST new record
exports.createRecord = async (req, res) => {
  const { personel_id, tarih, giris_saat, cikis_saat } = req.body;
  try {
    const [result] = await db.query(`
      INSERT INTO pdks_entry (personnel_per_id, pdks_date, pdks_checkInTime, pdks_checkOutTime) 
      VALUES (?, ?, ?, ?)
    `, [personel_id, tarih, giris_saat, cikis_saat]);
    res.status(201).json({ id: result.insertId, personel_id, tarih, giris_saat, cikis_saat });
  } catch (err) {
    res.status(500).json({ error: 'Insert failed' });
  }
};

// PUT update record (optional)
exports.updateRecord = async (req, res) => {
  const { tarih, giris_saat, cikis_saat } = req.body;
  try {
    await db.query(`
      UPDATE pdks_entry 
      SET pdks_date=?, pdks_checkInTime=?, pdks_checkOutTime=? 
      WHERE pdks_id=?
    `, [tarih, giris_saat, cikis_saat, req.params.id]);
    res.json({ message: 'PDKS record updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// DELETE record (optional)
exports.deleteRecord = async (req, res) => {
  try {
    await db.query('DELETE FROM pdks_entry WHERE pdks_id = ?', [req.params.id]);
    res.json({ message: 'PDKS record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
};



const PRIVATE_KEY = process.env.PDKS_PRIVATE_KEY || "fallbackSecret";

const crypto = require('crypto');

function generateToken(time, secret) {
  const data = `${time}${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
}

function isValidToken(clientToken, secret) {
  const now = new Date();
  const timeFormats = [
    now,
    new Date(now.getTime() - 60000), // 1 min earlier (grace window)
    new Date(now.getTime() + 60000), // 1 min later (optional)
  ];

  return timeFormats.some((time) => {
    const timestamp = time
      .toISOString()
      .replace(/[-T:]/g, '')
      .slice(0, 12); // YYYYMMDDHHmm
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
      return res.status(400).json({ error: 'Employee ID and token are required' });
    }

    // ✅ Token verification
    if (!isValidToken(token, PRIVATE_KEY)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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
      return res.json({ message: 'Checkout time recorded', checkOut: currentTime });
    } else {
      await db.query(
        `INSERT INTO pdks_entry (pdks_date, pdks_checkInTime, personnel_per_id)
         VALUES (?, ?, ?)`,
        [midnight, currentTime, employeeId]
      );
      return res.status(201).json({ message: 'Check-in time recorded', checkIn: currentTime });
    }
  } catch (err) {
    console.error("SubmitEntry error:", err);
    res.status(500).json({ error: 'Server error during check-in/out' });
  }

  
};


exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // Get all personnel
    const [allPersonnel] = await db.query(`
      SELECT per_id, per_name, per_lname
      FROM personnel
    `);

    // Get today's entries
    const [todayEntries] = await db.query(`
      SELECT personnel_per_id, pdks_checkInTime
      FROM pdks_entry
      WHERE DATE(pdks_date) = ?
    `, [today]);

    // Build ID -> check-in time map
    const checkInMap = {};
    todayEntries.forEach(entry => {
      checkInMap[entry.personnel_per_id] = new Date(entry.pdks_checkInTime);
    });

    let onTimeCount = 0;
    const absentList = [];

    allPersonnel.forEach(person => {
      const checkIn = checkInMap[person.per_id];

      if (!checkIn) {
        absentList.push(`${person.per_name} ${person.per_lname}`);
      } else {
        const hours = checkIn.getHours();
        const minutes = checkIn.getMinutes();
        if (hours < 8 || (hours === 8 && minutes < 10)) {
          onTimeCount += 1;
        }
      }
    });

    res.json({
      date: today,
      onTimeToday: onTimeCount,
      absentToday: absentList.length,
      absentNames: absentList,
      totalPersonnel: allPersonnel.length,
    });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to calculate stats" });
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
      SELECT COUNT(DISTINCT per_department) AS totalDepartments FROM personnel
    `);

    // Today's entries with valid check-in time
    const [todayEntries] = await db.query(`
      SELECT personnel_per_id, pdks_date, pdks_checkInTime
      FROM pdks_entry
      WHERE pdks_date = ?
        AND pdks_checkInTime != '00:00:00'
      ORDER BY pdks_checkInTime DESC
    `, [today]);

    // Get last entry time
    let lastEntryTime = "-";
    if (todayEntries.length > 0) {
      const last = todayEntries[0];
      const combinedDateTime = new Date(`${last.pdks_date}T${last.pdks_checkInTime}`);
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
    todayEntries.forEach(entry => {
      checkInMap[entry.personnel_per_id] = new Date(`${entry.pdks_date}T${entry.pdks_checkInTime}`);
    });

    let onTimeToday = 0;
    const absentNames = [];

    allPersonnel.forEach(p => {
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
