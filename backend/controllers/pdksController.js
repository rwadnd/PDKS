const db = require('../db/connection');

// GET all PDKS records
exports.getAllRecords = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pk.*, p.ad, p.soyad 
      FROM pdks_kayit pk 
      JOIN personel p ON pk.personel_id = p.id
      ORDER BY pk.tarih DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// GET records for one person
exports.getRecordsByPersonelId = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM pdks_kayit 
      WHERE personel_id = ?
      ORDER BY tarih DESC
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
      INSERT INTO pdks_kayit (personel_id, tarih, giris_saat, cikis_saat) 
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
      UPDATE pdks_kayit 
      SET tarih=?, giris_saat=?, cikis_saat=? 
      WHERE id=?
    `, [tarih, giris_saat, cikis_saat, req.params.id]);
    res.json({ message: 'PDKS record updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};

// DELETE record (optional)
exports.deleteRecord = async (req, res) => {
  try {
    await db.query('DELETE FROM pdks_kayit WHERE id = ?', [req.params.id]);
    res.json({ message: 'PDKS record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
};
