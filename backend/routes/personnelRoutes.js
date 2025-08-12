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
} = require("../controllers/personnelController");

// Multer: store to a temp directory; controller will move/rename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp_uploads/"); // temporary
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `temp_${timestamp}${ext}`);
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

// DELETE
router.delete("/:id", deletePersonnel);

module.exports = router;
