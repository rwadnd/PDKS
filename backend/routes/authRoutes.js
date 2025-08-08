const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Admin Login
router.post("/login", authController.adminLogin);

// Get all admin users
router.get("/users", authController.getAdminUsers);

// Get all admin users
router.get("/users/:id", authController.getAdminUser);

// Create new admin user
router.post("/users", authController.createAdminUser);

// Update admin user
router.put("/users/:id", authController.updateAdminUser);

// Delete admin user
router.delete("/users/:id", authController.deleteAdminUser);

module.exports = router;
