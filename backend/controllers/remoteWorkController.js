const db = require("../db/connection");

// Get all remote work requests
const getAllRemoteWorkRequests = async (req, res) => {
  try {
    const query = `
      SELECT rwr.*, 
             p.per_name, p.per_lname, p.per_department, p.per_role,
             a.full_name as approved_by_name
      FROM remote_work_requests rwr
      LEFT JOIN personnel p ON rwr.personnel_per_id = p.per_id
      LEFT JOIN admin_users a ON rwr.approved_by = a.id
      ORDER BY rwr.created_at DESC
    `;

    const [requests] = await db.execute(query);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching remote work requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get remote work requests by personnel ID
const getRemoteWorkRequestsByPersonnel = async (req, res) => {
  try {
    const { personnelId } = req.params;

    const query = `
      SELECT rwr.*, 
             p.per_name, p.per_lname, p.per_department, p.per_role,
             a.full_name as approved_by_name
      FROM remote_work_requests rwr
      LEFT JOIN personnel p ON rwr.personnel_per_id = p.per_id
      LEFT JOIN admin_users a ON rwr.approved_by = a.id
      WHERE rwr.personnel_per_id = ?
      ORDER BY rwr.created_at DESC
    `;

    const [requests] = await db.execute(query, [personnelId]);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching remote work requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new remote work request
const createRemoteWorkRequest = async (req, res) => {
  try {
    const { personnelId, requestDate, workMode, requestReason } = req.body;

    // Check if request already exists for this date and personnel
    const checkQuery = `
      SELECT * FROM remote_work_requests 
      WHERE personnel_per_id = ? AND request_date = ? AND status != 'Rejected'
    `;
    const [existing] = await db.execute(checkQuery, [personnelId, requestDate]);

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "A request already exists for this date" });
    }

    const insertQuery = `
      INSERT INTO remote_work_requests 
      (personnel_per_id, request_date, work_mode, request_reason, status) 
      VALUES (?, ?, ?, ?, 'Pending')
    `;

    const [result] = await db.execute(insertQuery, [
      personnelId,
      requestDate,
      workMode,
      requestReason,
    ]);

    res.status(201).json({
      message: "Remote work request created successfully",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating remote work request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update remote work request status (approve/reject)
const updateRemoteWorkRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, approvedBy } = req.body;

    const updateQuery = `
      UPDATE remote_work_requests 
      SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE request_id = ?
    `;

    await db.execute(updateQuery, [status, approvedBy, requestId]);

    res.json({ message: "Remote work request status updated successfully" });
  } catch (error) {
    console.error("Error updating remote work request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update personnel work mode
const updatePersonnelWorkMode = async (req, res) => {
  try {
    const { personnelId } = req.params;
    const { workMode } = req.body;

    const updateQuery = `
      UPDATE personnel 
      SET work_mode = ?
      WHERE per_id = ?
    `;

    await db.execute(updateQuery, [workMode, personnelId]);

    res.json({ message: "Work mode updated successfully" });
  } catch (error) {
    console.error("Error updating work mode:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get personnel work mode
const getPersonnelWorkMode = async (req, res) => {
  try {
    const { personnelId } = req.params;

    const query = `
      SELECT per_id, per_name, per_lname, work_mode
      FROM personnel 
      WHERE per_id = ?
    `;

    const [personnel] = await db.execute(query, [personnelId]);

    if (personnel.length === 0) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    res.json(personnel[0]);
  } catch (error) {
    console.error("Error fetching work mode:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update entry location type
const updateEntryLocationType = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { locationType } = req.body;

    const updateQuery = `
      UPDATE pdks_entry 
      SET location_type = ?
      WHERE pdks_id = ?
    `;

    await db.execute(updateQuery, [locationType, entryId]);

    res.json({ message: "Entry location type updated successfully" });
  } catch (error) {
    console.error("Error updating entry location type:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get remote work statistics
const getRemoteWorkStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    let params = [];

    if (startDate && endDate) {
      dateFilter = "WHERE rwr.request_date BETWEEN ? AND ?";
      params = [startDate, endDate];
    }

    const query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_requests,
        SUM(CASE WHEN work_mode = 'Remote' THEN 1 ELSE 0 END) as remote_requests,
        SUM(CASE WHEN work_mode = 'Hybrid' THEN 1 ELSE 0 END) as hybrid_requests
      FROM remote_work_requests rwr
      ${dateFilter}
    `;

    const [stats] = await db.execute(query, params);

    res.json(stats[0]);
  } catch (error) {
    console.error("Error fetching remote work stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllRemoteWorkRequests,
  getRemoteWorkRequestsByPersonnel,
  createRemoteWorkRequest,
  updateRemoteWorkRequestStatus,
  updatePersonnelWorkMode,
  getPersonnelWorkMode,
  updateEntryLocationType,
  getRemoteWorkStats,
};
