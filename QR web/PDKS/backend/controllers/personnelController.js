const db = require('../db/connection');

// GET all personnel
exports.getAllPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Personnel');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// GET single personnel by ID
exports.getPersonnelById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Personnel WHERE per_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Personnel not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// POST new personnel
exports.createPersonnel = async (req, res) => {
  const { ad, soyad, departman, gorev, durum } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Personnel (per_name, per_lname, per_department, per_role, per_status) VALUES (?, ?, ?, ?, ?)',
      [ad, soyad, departman, gorev, durum || 'Aktif']
    );
    res.status(201).json({ id: result.insertId, ad, soyad, departman, gorev, durum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert personnel' });
  }
};

// PUT update personnel
exports.updatePersonnel = async (req, res) => {
  const { ad, soyad, departman, gorev, durum } = req.body;
  try {
    await db.query(
      'UPDATE Personnel SET per_name=?, per_lname=?, per_department=?, per_role=?, per_status=? WHERE per_id=?',
      [ad, soyad, departman, gorev, durum, req.params.id]
    );
    res.json({ message: 'Personnel updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update personnel' });
  }
};

// DELETE personnel
exports.deletePersonnel = async (req, res) => {
  try {
    await db.query('DELETE FROM Personnel WHERE per_id=?', [req.params.id]);
    res.json({ message: 'Personnel deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete personnel' });
  }
};
