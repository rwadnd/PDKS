const path = require("path");
const db = require("../db/connection");

const fs = require("fs");

// ensure final uploads folder exists
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

function fileToPublicUrl(file, perId) {
  if (!file) return null;

  const ext = path.extname(file.originalname) || path.extname(file.filename) || ".jpg";
  const safeId = String(perId || "unknown").replace(/\W+/g, "_");
  const filename = `per_${safeId}_${Date.now()}${ext.toLowerCase()}`;
  const dest = path.join(uploadsDir, filename);

  try {
    // move file from wherever multer put it to public/uploads
    fs.renameSync(file.path, dest);
  } catch (err) {
    // fallback: copy then unlink
    fs.copyFileSync(file.path, dest);
    fs.unlinkSync(file.path);
  }

  // URL that the frontend can load
  return `/uploads/${filename}`;
}

// GET all personnel
exports.getAllPersonnel = async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Personnel");
    res.json(rows);
  } catch (err) {
    console.error("getAllPersonnel error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// GET single personnel by ID
exports.getPersonnelById = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Personnel WHERE per_id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Personnel not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getPersonnelById error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// POST new personnel (supports optional avatar upload)
exports.createPersonnel = async (req, res) => {
  try {
    const { firstName, lastName, perId, department, role, per_status } = req.body;

    if (!perId || !firstName || !lastName || !department || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure unique per_id
    const [existingPersonnel] = await db.query(
      "SELECT per_id FROM Personnel WHERE per_id = ?",
      [perId]
    );
    if (existingPersonnel.length > 0) {
      return res.status(400).json({ error: "Personnel ID already exists" });
    }

    const avatarUrl = fileToPublicUrl(req.file); // null if no file

    const [result] = await db.query(
      `INSERT INTO Personnel
        (per_id, per_name, per_lname, per_department, per_role, per_status, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        perId,
        firstName,
        lastName,
        department,
        role,
        per_status || "Active",
        avatarUrl || null,
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      per_id: perId,
      per_name: firstName,
      per_lname: lastName,
      per_department: department,
      per_role: role,
      per_status: per_status || "Active",
      avatar_url: avatarUrl || null,
    });
  } catch (err) {
    console.error("createPersonnel error:", err);
    res.status(500).json({ error: "Failed to insert personnel" });
  }
};

// PUT update personnel (JSON or multipart with "avatar")
exports.updatePersonnel = async (req, res) => {
  try {
    const { id } = req.params;

    // Accept either client naming (firstName/lastName/perId) or DB naming (per_name/per_lname) during update
    const per_name = req.body.per_name || req.body.firstName || null;
    const per_lname = req.body.per_lname || req.body.lastName || null;
    const per_role = req.body.per_role || req.body.role || null;
    const per_department = req.body.per_department || req.body.department || null;
    const per_status = req.body.per_status || req.body.status || null;
    // Accept avatar_url from JSON (for direct URL update)
    const avatar_url = req.body.avatar_url || null;

    // Check existence
    const [existing] = await db.query("SELECT * FROM Personnel WHERE per_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    // If file uploaded, compute new avatar_url
    let newAvatarUrl = null;
    if (req.file) {
      newAvatarUrl = fileToPublicUrl(req.file, id);
    } else if (avatar_url) {
      newAvatarUrl = avatar_url;
    }

    // Build dynamic query pieces
    const fields = [];
    const params = [];

    if (per_name !== null) { fields.push("per_name = ?"); params.push(per_name); }
    if (per_lname !== null) { fields.push("per_lname = ?"); params.push(per_lname); }
    if (per_role !== null) { fields.push("per_role = ?"); params.push(per_role); }
    if (per_department !== null) { fields.push("per_department = ?"); params.push(per_department); }
    if (per_status !== null) { fields.push("per_status = ?"); params.push(per_status); }
    if (newAvatarUrl) { fields.push("avatar_url = ?"); params.push(newAvatarUrl); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);
    const sql = `UPDATE Personnel SET ${fields.join(", ")} WHERE per_id = ?`;

    await db.query(sql, params);

    // Return updated row
    const [updated] = await db.query("SELECT * FROM Personnel WHERE per_id = ?", [id]);
    return res.json({ success: true, person: updated[0] });
  } catch (error) {
    console.error("updatePersonnel error:", error);
    res.status(500).json({ error: "Database update failed" });
  }
};

// POST /api/personnel/:id/avatar (upload avatar only)
// Expects file field to be named "avatar"
exports.updatePersonnelAvatarOnly = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT per_id FROM Personnel WHERE per_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const avatarUrl = fileToPublicUrl(req.file, id);

    await db.query("UPDATE Personnel SET avatar_url = ? WHERE per_id = ?", [
      avatarUrl,
      id,
    ]);

    // Return avatar_url for frontend consistency
    return res.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    console.error("updatePersonnelAvatarOnly error:", err);
    res.status(500).json({ error: "Avatar update failed" });
  }
};

// DELETE personnel
exports.deletePersonnel = async (req, res) => {
  try {
    const [existing] = await db.query("SELECT per_id FROM Personnel WHERE per_id = ?", [
      req.params.id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Personnel not found" });
    }

    await db.query("DELETE FROM Personnel WHERE per_id = ?", [req.params.id]);
    res.json({ message: "Personnel deleted successfully" });
  } catch (err) {
    console.error("deletePersonnel error:", err);
    res.status(500).json({ error: "Failed to delete personnel" });
  }
};

// Soft delete personnel (change status to Inactive)
exports.softDeletePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update status to Inactive instead of deleting
    await db.query(
      "UPDATE Personnel SET per_status = 'Inactive' WHERE per_id = ?",
      [id]
    );
    
    res.json({ message: "Personnel deactivated successfully" });
  } catch (err) {
    console.error("Error deactivating personnel:", err);
    res.status(500).json({ error: "Failed to deactivate personnel" });
  }
};
