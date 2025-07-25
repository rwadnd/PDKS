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
