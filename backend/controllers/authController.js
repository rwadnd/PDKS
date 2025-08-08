const mysql = require("mysql2/promise");
const dbConfig = require("../db/connection");

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [rows] = await dbConfig.execute(
      "SELECT * FROM admin_users WHERE username = ? AND password = ? AND is_active = 1",
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = rows[0];

    // Update last login time
    await dbConfig.execute(
      "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id]
    );

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: "Login successful",
      user: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Admin Users
const getAdminUsers = async (req, res) => {
  try {
    const [rows] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, created_at, last_login, is_active FROM admin_users"
    );

    res.json({
      success: true,
      users: rows,
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



// Get Admin Users
const getAdminUser = async (req, res) => {
  try {
    const [rows] = await dbConfig.execute(
      "SELECT id, username, email, full_name, role, created_at, last_login, is_active FROM admin_users WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Return just one user object
    res.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Get admin user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Create Admin User
const createAdminUser = async (req, res) => {
  try {
    const { username, password, email, full_name, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [result] = await dbConfig.execute(
      "INSERT INTO admin_users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)",
      [username, password, email, full_name, role || "admin"]
    );

    res.json({
      success: true,
      message: "Admin user created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Create admin user error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Admin User
const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, is_active } = req.body;

    const [result] = await dbConfig.execute(
      "UPDATE admin_users SET username = ?, email = ?, full_name = ?, role = ?, is_active = ? WHERE id = ?",
      [username, email, full_name, role, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    res.json({
      success: true,
      message: "Admin user updated successfully",
    });
  } catch (error) {
    console.error("Update admin user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Admin User
const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await dbConfig.execute(
      "DELETE FROM admin_users WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    res.json({
      success: true,
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  adminLogin,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminUser
};
