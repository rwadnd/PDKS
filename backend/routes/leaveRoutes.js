const express = require('express');
const router = express.Router();
const {
  getLeaves,
  UpdateRequest,
} = require('../controllers/leaveController');

// GET all
router.get('/', getLeaves);
router.put('/:id',UpdateRequest)

module.exports = router;