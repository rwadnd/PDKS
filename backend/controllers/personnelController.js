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
 const { per_name, per_lname, per_role, per_department } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE personnel SET per_name = ?, per_lname = ?, per_role = ?, per_department = ? WHERE per_id = ?`,
      [per_name, per_lname, per_role, per_department, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating personnel:', error);
    res.status(500).json({ error: 'Database update failed' });
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
