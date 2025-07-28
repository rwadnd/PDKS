const express = require('express');
const router = express.Router();
const {
  getAllRecords,
  getRecordsByPersonelId,
  getRecordsByDate,
  createRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/pdksController');

router.get('/', getAllRecords);
router.get('/:id', getRecordsByPersonelId);
router.get('/by-date/:date', getRecordsByDate);
router.post('/', createRecord);
router.put('/:id', updateRecord);       // Optional
router.delete('/:id', deleteRecord);    // Optional

module.exports = router;