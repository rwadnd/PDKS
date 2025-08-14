const express = require("express");
const router = express.Router();
const {
  overview,
  getAllDepartments,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} = require("../controllers/departmentController");

// GET all
router.get("/", overview);

// GET all departments list
router.get("/list", getAllDepartments);

// POST create new department
router.post("/", createDepartment);

// DELETE department
router.delete("/:id", deleteDepartment);

// PUT update department
router.put("/:id", updateDepartment);

module.exports = router;
