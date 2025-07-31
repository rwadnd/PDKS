const express = require('express');
const router = express.Router();
const {
  overview,
} = require('../controllers/departmentController');

// GET all
router.get('/', overview);


module.exports = router;
