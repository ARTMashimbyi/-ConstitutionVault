// server/routes/directories.js

const express = require("express");
const {
  listAllDirectories,
  createDirectory,
  getDirectoryById,
  deleteDirectory
} = require("../controllers/directoriesController");

const router = express.Router();

/**
 * GET /api/directories
 * List all directories (including nested ones)
 */
router.get("/", listAllDirectories);

/**
 * POST /api/directories
 * Create a new directory
 * Expects JSON body { name, path, description }
 * Returns { id: "<new-firestore-id>" }
 */
router.post("/", createDirectory);

/**
 * GET /api/directories/:id
 * Fetch a single directory by ID
 */
router.get("/:id", getDirectoryById);

/**
 * DELETE /api/directories/:id
 * Delete a directory and all of its subdirectories and files,
 * but prevent deletion if this is the root directory
 */
router.delete("/:id", async (req, res, next) => {
  // Optional safeguard: don't allow deleting the root folder by ID if you know it
  if (req.params.id === 'root' || req.params.id === 'ROOT') {
    return res.status(400).json({ error: "Cannot delete root directory" });
  }
  // Otherwise, proceed
  return deleteDirectory(req, res, next);
});

module.exports = router;
