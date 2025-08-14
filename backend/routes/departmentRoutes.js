const express = require("express");
const router = express.Router();
const {
  overview,
  getAllDepartments,
  createDepartment,
} = require("../controllers/departmentController");

// GET all
router.get("/", overview);

// GET all departments list
router.get("/list", getAllDepartments);

// POST create new department
router.post("/", createDepartment);

module.exports = router;
