const db = require("../db/connection");

// GET all personnel
exports.getAllPersonnel = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Personnel");
    res.json(rows);
  } catch (err) {
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
    res.status(500).json({ error: "Database error" });
  }
};

// POST new personnel
exports.createPersonnel = async (req, res) => {
  const { firstName, lastName, perId, department, role } = req.body;

  console.log("=== CREATE PERSONNEL DEBUG ===");
  console.log("Body:", req.body);
  console.log("File:", req.file);
  console.log("Headers:", req.headers);

  try {
    // Check if personnel ID already exists
    const [existingPersonnel] = await db.query(
      "SELECT * FROM Personnel WHERE per_id = ?",
      [perId]
    );
    if (existingPersonnel.length > 0) {
      return res.status(400).json({ error: "Personnel ID already exists" });
    }

    // Handle photo upload
    if (req.file) {
      console.log("Photo upload detected:", req.file);
      // Save photo to frontend/public directory with perId as filename
      const fs = require("fs");
      const path = require("path");

      // Create the destination path
      const destPath = path.join(
        __dirname,
        "../../frontend/public",
        `${perId}.jpg`
      );

      console.log("Destination path:", destPath);

      // Copy the uploaded file to the destination
      fs.copyFileSync(req.file.path, destPath);

      // Remove the temporary file
      fs.unlinkSync(req.file.path);
      console.log("Photo saved successfully");
    } else {
      console.log("No photo uploaded");
    }

    // Insert with existing table structure
    const [result] = await db.query(
      "INSERT INTO Personnel (per_id, per_name, per_lname, per_department, per_role, per_status) VALUES (?, ?, ?, ?, ?, ?)",
      [perId, firstName, lastName, department, role, "Active"]
    );

    console.log("Personnel created successfully:", result.insertId);

    res.status(201).json({
      id: result.insertId,
      perId,
      firstName,
      lastName,
      department,
      role,
    });
  } catch (err) {
    console.error("Error creating personnel:", err);
    res.status(500).json({ error: "Failed to insert personnel" });
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
    console.error("Error updating personnel:", error);
    res.status(500).json({ error: "Database update failed" });
  }
};

// DELETE personnel
exports.deletePersonnel = async (req, res) => {
  try {
    await db.query("DELETE FROM Personnel WHERE per_id=?", [req.params.id]);
    res.json({ message: "Personnel deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete personnel" });
  }
};
