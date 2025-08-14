const express = require('express');
const router = express.Router();
const {
  overview,
  getAllDepartments,
} = require('../controllers/departmentController');

// GET all
router.get('/', overview);

// GET all departments list
router.get('/list', getAllDepartments);


module.exports = router;
