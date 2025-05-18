// server/routes/files.js
const express = require("express");
const { db }  = require("../config/firebaseAdmin");

const router = express.Router();

// GET /api/files          → all documents
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("constitutionalDocuments").get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(docs);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// GET /api/files/:id      → single document by Firestore ID
router.get("/:id", async (req, res) => {
  try {
    const docRef  = db.collection("constitutionalDocuments").doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json({ id: docSnap.id, ...docSnap.data() });
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

// PATCH /api/files/:id    → update metadata
router.patch("/:id", async (req, res) => {
  try {
    await db.collection("constitutionalDocuments")
            .doc(req.params.id)
            .update(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating file metadata:", err);
    res.status(500).json({ error: "Failed to update file" });
  }
});

module.exports = router;
