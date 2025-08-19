const express = require("express");
const router = express.Router();
const {
  getRecordsByPersonelId,
  getRecordsByDate,
  submitEntry,
  getDashboardStats,
  getAverageCheckInRange,
  getOnTimeLeaderboard,
} = require("../controllers/pdksController");

// Specific routes first to avoid being captured by ":id"
router.get("/average-checkin", getAverageCheckInRange);
router.get("/leaderboard/on-time", getOnTimeLeaderboard);
router.get("/by-date/:date", getRecordsByDate);
router.post("/submit", submitEntry);
router.get("/dashboard/stats", getDashboardStats);
router.get("/:id", getRecordsByPersonelId);

module.exports = router;
