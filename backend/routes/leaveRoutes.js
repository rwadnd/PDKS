const express = require('express');
const router = express.Router();
const {
  getLeaves,
  updateRequest,
  submitRequest,
} = require('../controllers/leaveController');

// GET all
router.get('/', getLeaves);
router.put('/:id',updateRequest)
router.post('/', submitRequest)

module.exports = router;