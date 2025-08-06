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


exports.updateRequest = async (req, res) => {
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


exports.submitRequest = async (req, res) => {
  const {
    personnel_per_id,
    request_start_date,
    request_end_date,
    request_type,
    request_other
  } = req.body;

  const request_date = new Date(); // current date
  const status = 'Pending';

  try {
    await db.query(
      `
      INSERT INTO leave_request (
        personnel_per_id,
        request_start_date,
        request_end_date,
        request_type,
        request_other,
        request_date,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        personnel_per_id,
        request_start_date,
        request_end_date,
        request_type,
        request_other,
        request_date,
        status
      ]
    );

    res.json({ message: 'Leave request submitted successfully' });
  } catch (err) {
    console.error("❌ Submit request failed:", err);
    res.status(500).json({ error: 'Submit failed', detail: err.message });
  }
};