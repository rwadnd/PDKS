const express = require('express');
const router = express.Router();
const {
  getLeaves,
} = require('../controllers/leaveController');

// GET all
router.get('/', getLeaves);


module.exports = router;