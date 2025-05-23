// server/routes/directories.js

const express = require("express");
const { db }  = require("../config/firebaseAdmin");  // use the exported db

const router = express.Router();

// GET /api/directories
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("directories").get();
    const dirs = snapshot.docs.map(doc => ({
      id:   doc.id,
      ...doc.data()
    }));
    res.json(dirs);
  } catch (err) {
    console.error("Error fetching directories:", err);
    res.status(500).json({ error: "Failed to fetch directories" });
  }
});

module.exports = router;
