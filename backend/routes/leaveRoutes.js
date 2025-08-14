const express = require('express');
const router = express.Router();
const {
  getLeaves,
  updateRequest,
  submitRequest,
  getLeavesByPersonnelId,
  deleteLeave,
} = require('../controllers/leaveController');

// GET all
router.get('/', getLeaves);
router.get('/:id',getLeavesByPersonnelId)
router.put('/:id',updateRequest)
router.post('/', submitRequest)
router.delete("/:leaveId", deleteLeave);   

module.exports = router;