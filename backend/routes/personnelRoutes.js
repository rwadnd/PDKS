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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp_uploads/"); // Temporary location
  },
  filename: function (req, file, cb) {
    // Use timestamp as filename, will be renamed in controller
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `temp_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// GET all
router.get("/", getAllPersonnel);

// GET by ID
router.get("/:id", getPersonnelById);

// POST new (with file upload)
router.post("/", upload.single("photo"), createPersonnel);

// PUT update
router.put("/:id", updatePersonnel);

// DELETE
router.delete("/:id", deletePersonnel); // optional

module.exports = router;
