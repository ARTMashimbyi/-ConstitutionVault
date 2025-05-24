// server/routes/files.js

const express = require("express");
const multer  = require("multer");
const {
  listFiles,
  getFileById,    // new: fetch a single file’s metadata
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

// ─── List all files ────────────────────────────────────────────────────────
// GET /api/files
// → returns all documents (with fullText) sorted by newest first
router.get("/", listFiles);

// ─── Fetch a single file by ID ─────────────────────────────────────────────
// GET /api/files/:id
// → returns { id, title, directory, … }
router.get("/:id", getFileById);

// ─── Upload a new file ─────────────────────────────────────────────────────
// POST /api/files
// → expects multipart form with a 'metadata' JSON field + optional 'file' field
router.post("/", upload.single("file"), uploadFile);

// ─── Update existing file metadata ─────────────────────────────────────────
// PATCH /api/files/:id
// → updates only the metadata fields for the given document
router.patch("/:id", updateFile);

// ─── Delete a file ─────────────────────────────────────────────────────────
// DELETE /api/files/:id
// → deletes both the Firestore record and its Storage blob
router.delete("/:id", deleteFile);

module.exports = router;
