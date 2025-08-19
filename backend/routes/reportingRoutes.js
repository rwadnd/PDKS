// backend/routes/reporting.js
const express = require("express");
const router = express.Router();
const reporting = require("../controllers/reportingController");

router.get("/metadata", reporting.getMetadata);
router.post("/export", reporting.exportReport);

module.exports = router;
