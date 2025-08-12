const path = require("path");
const fs = require("fs");
const dbConfig = require("../db/connection");

// Ensure uploads dir exists (uploads/profile)
const profileUploadsDir = path.join(__dirname, "..", "uploads", "profile");
fs.mkdirSync(profileUploadsDir, { recursive: true });

// GET /api/profile/:id
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const [rows] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, is_active, avatar_url FROM admin_users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/profile/:id
// Accepts multipart/form-data (with optional file field "avatar") OR JSON
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Text fields can come from JSON or from multipart body
    const {
      full_name,
      username,
      email,
      password,      // optional
      avatar_url,    // optional if you want to set from client without file
    } = req.body || {};

    if (!full_name || !username || !email) {
      return res.status(400).json({
        success: false,
        message: "full_name, username and email are required",
      });
    }

    // If a file was uploaded (multer), build a new avatar URL
    // We serve /uploads statically from server.js, so the public URL is /uploads/profile/<filename>
    let newAvatarUrl = avatar_url || null;
    if (req.file) {
      newAvatarUrl = `/uploads/profile/${req.file.filename}`;
    }

    // Make sure the user exists
    const [check] = await dbConfig.execute(
      "SELECT id, avatar_url FROM admin_users WHERE id = ?",
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Build query conditionally (do not overwrite password unless provided)
    let query, params;
    if (password && password !== "••••••••") {
      query = `
        UPDATE admin_users
        SET full_name = ?, username = ?, email = ?, password = ?, avatar_url = ?
        WHERE id = ?
      `;
      params = [full_name, username, email, password, newAvatarUrl, id];
    } else {
      query = `
        UPDATE admin_users
        SET full_name = ?, username = ?, email = ?, avatar_url = ?
        WHERE id = ?
      `;
      params = [full_name, username, email, newAvatarUrl, id];
    }

    const [result] = await dbConfig.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "No changes made to the profile" });
    }

    // Return the updated user
    const [updated] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, is_active, avatar_url FROM admin_users WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updated[0],
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
