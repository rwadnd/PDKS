const dbConfig = require("../db/connection");
const bcrypt = require("bcryptjs"); // Şifre hash'lemek için eklendi

// Kullanıcı profilini ID'ye göre getir
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const [rows] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, is_active FROM admin_users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Kullanıcı profilini ve şifresini güncelle
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, email, password } = req.body;

    // Validate input
    if (!full_name || !username || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let updateQuery = "UPDATE admin_users SET full_name = ?, username = ?, email = ? WHERE id = ?";
    let updateParams = [full_name, username, email, id];

    // Şifre güncellenmek isteniyorsa
    if (password && password !== '••••••••') {
      updateQuery = "UPDATE admin_users SET full_name = ?, username = ?, email = ?, password = ? WHERE id = ?";
      updateParams = [full_name, username, email, password, id];
    }
    
    // Check if user exists
    const [userCheck] = await dbConfig.execute(
      "SELECT id FROM admin_users WHERE id = ?",
      [id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user data
    const [result] = await dbConfig.execute(
      updateQuery,
      updateParams
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made to the profile",
      });
    }

    // Get updated user data
    const [updatedUser] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, is_active FROM admin_users WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};