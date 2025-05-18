// server/routes/files.js

const express = require("express");
const multer  = require("multer");
const {
  listFiles,
  uploadFile,
  updateFile,
  deleteFile
} = require("../controllers/filesController");

const router = express.Router();

// Multer setup: keep uploads in memory, max 100 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// GET /api/files
// → returns all documents (with fullText) sorted by newest first
router.get("/", listFiles);

// POST /api/files
// → expects multipart form with a 'metadata' JSON field + optional 'file' field
router.post("/", upload.single("file"), uploadFile);

// PATCH /api/files/:id
// → updates metadata fields for the given document
router.patch("/:id", updateFile);

// DELETE /api/files/:id
// → deletes both the Firestore record and its Storage blob
router.delete("/:id", deleteFile);

module.exports = router;
