const express = require('express');
const router = express.Router();
const {
  getRecordsByPersonelId,
  getRecordsByDate,
  submitEntry,
  getDashboardStats
} = require('../controllers/pdksController');

router.get('/:id', getRecordsByPersonelId);
router.get('/by-date/:date', getRecordsByDate);
router.post('/submit', submitEntry);
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;