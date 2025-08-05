const db = require('../db/connection');

exports.getLeaves = async (req, res) => {
  try {
    const [rows] = await db.query(`
SELECT 
  leave_request.*, 
  personnel.per_lname,
  personnel.per_name,
  personnel.per_department
FROM 
  leave_request
JOIN 
  personnel 
ON 
  leave_request.personnel_per_id = personnel.per_id;
     `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};


exports.UpdateRequest = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query(`
      UPDATE leave_request 
      SET status=?
      WHERE request_id=?
    `, [status, req.params.id]);
    res.json({ message: 'Request status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};