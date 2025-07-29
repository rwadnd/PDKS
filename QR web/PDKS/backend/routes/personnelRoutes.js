const express = require('express');
const router = express.Router();
const {
  getAllPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel
} = require('../controllers/personnelController');

// GET all
router.get('/', getAllPersonnel);

// GET by ID
router.get('/:id', getPersonnelById);

// POST new
router.post('/', createPersonnel);

// PUT update
router.put('/:id', updatePersonnel);

// DELETE
router.delete('/:id', deletePersonnel); // optional

module.exports = router;
