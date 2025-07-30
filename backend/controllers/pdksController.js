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
        pk.*,
        p.per_name,
        p.per_lname,
        p.per_department,
        p.per_role,
        p.per_status
      FROM pdks_entry pk
      JOIN personnel p ON pk.personnel_per_id = p.per_id
      WHERE DATE(pdks_date) = ?
      ORDER BY pdks_checkInTime DESC
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