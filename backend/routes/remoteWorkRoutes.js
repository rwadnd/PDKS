const express = require('express');
const router = express.Router();
const {
  getAllRemoteWorkRequests,
  getRemoteWorkRequestsByPersonnel,
  createRemoteWorkRequest,
  updateRemoteWorkRequestStatus,
  updatePersonnelWorkMode,
  getPersonnelWorkMode,
  updateEntryLocationType,
  getRemoteWorkStats
} = require('../controllers/remoteWorkController');

// Get all remote work requests
router.get('/requests', getAllRemoteWorkRequests);

// Get remote work requests by personnel ID
router.get('/requests/personnel/:personnelId', getRemoteWorkRequestsByPersonnel);

// Create new remote work request
router.post('/requests', createRemoteWorkRequest);

// Update remote work request status
router.put('/requests/:requestId/status', updateRemoteWorkRequestStatus);

// Update personnel work mode
router.put('/personnel/:personnelId/work-mode', updatePersonnelWorkMode);

// Get personnel work mode
router.get('/personnel/:personnelId/work-mode', getPersonnelWorkMode);

// Update entry location type
router.put('/entries/:entryId/location-type', updateEntryLocationType);

// Get remote work statistics
router.get('/stats', getRemoteWorkStats);

module.exports = router;
