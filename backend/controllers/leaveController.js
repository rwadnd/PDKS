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



exports.getLeavesByPersonnelId = async (req, res) => {
  try {
    const personnelId = parseInt(req.params.id, 10);
    if (!personnelId || personnelId <= 0) {
      return res.status(400).json({ error: "Invalid personnel id" });
    }

    const [rows] = await db.query(
      `
      SELECT 
        lr.*,
        p.per_name,
        p.per_lname,
        p.per_department
      FROM leave_request AS lr
      JOIN personnel AS p
        ON lr.personnel_per_id = p.per_id
      WHERE lr.personnel_per_id = ?
      ORDER BY lr.request_start_date DESC, lr.request_end_date DESC
      `,
      [personnelId]
    );

    res.json(rows);
  } catch (err) {
    console.error("getLeavesByPersonnelId error:", err);
    res.status(500).json({ error: "Database error" });
  }
};


exports.deleteLeave = async (req, res) => {
  try {
    const leaveId = parseInt(req.params.leaveId, 10);
    if (!leaveId || leaveId <= 0) {
      return res.status(400).json({ error: "Invalid leave id" });
    }

    // Optional: ensure row exists first
    const [chk] = await db.query("SELECT request_id FROM leave_request WHERE request_id = ?", [leaveId]);
    if (chk.length === 0) {
      return res.status(404).json({ error: "Leave not found" });
    }

    await db.query("DELETE FROM leave_request WHERE request_id = ?", [leaveId]);
    return res.status(204).send(); // No Content
  } catch (err) {
    console.error("deleteLeave error:", err);
    return res.status(500).json({ error: "Database error" });
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