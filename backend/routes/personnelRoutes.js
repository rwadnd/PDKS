const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");






const {
  getAllPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  updatePersonnelAvatarOnly, // add this import
} = require("../controllers/personnelController");

// Multer: store to a temp directory; controller will move/rename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/personnel"); // change to match profile logic (direct to public/uploads/personnel)
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || ".jpg";
    // Use per_id if available for uniqueness
    const perId = req.body.perId || req.params.id || "unknown";
    cb(null, `per_${perId}_${timestamp}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//i.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

// GET all
router.get("/", getAllPersonnel);

// GET by ID
router.get("/:id", getPersonnelById);

// POST new (optionally with photo)
router.post("/", upload.single("photo"), createPersonnel);

// PUT update (accept text fields AND optional photo)
router.put("/:id", upload.single("photo"), updatePersonnel);

// NEW: Avatar upload route (expects field "avatar")
router.post("/:id/avatar", upload.single("avatar"), updatePersonnelAvatarOnly);

// DELETE
router.delete("/:id", deletePersonnel);

module.exports = router;
