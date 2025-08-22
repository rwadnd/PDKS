const express = require('express');
const router = express.Router();
const {
  getLeaves,
  updateRequest,
  submitRequest,
  getLeavesByPersonnelId,
  deleteLeave,
  getApproved
} = require('../controllers/leaveController');

// GET all
router.get("/approved",getApproved)
router.get('/', getLeaves);
router.post('/', submitRequest)
router.get('/:id',getLeavesByPersonnelId)
router.put('/:id',updateRequest)
router.delete("/:leaveId", deleteLeave);   

module.exports = router;