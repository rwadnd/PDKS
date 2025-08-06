const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController"); // profileController'ı içe aktar

// Kullanıcı profilini ID'ye göre getir
router.get("/:id", profileController.getUserProfile);

// Kullanıcı profilini güncelle
router.put("/:id", profileController.updateUserProfile);

module.exports = router;
