// server/routes/files.js

const express = require("express");
const multer  = require("multer");
const { db, bucket } = require("../config/firebaseAdmin");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// ----------------------------------------
// GET /api/files
// Returns all documents sorted by upload date (newest first)
// ----------------------------------------
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("constitutionalDocuments")
      .orderBy("uploadedAt", "desc")
      .get();

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(docs);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// ----------------------------------------
// POST /api/files
// - Expects 'metadata' (JSON string) + optional 'file'
// - Returns { id, downloadURL }
// ----------------------------------------
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // 1) Parse metadata
    const metadata = JSON.parse(req.body.metadata);

    let downloadURL = "";
    let storagePath = "";

    // 2) If there's a file, upload it to Storage
    if (req.file) {
      const filename  = `${Date.now()}_${req.file.originalname}`;
      storagePath     = metadata.directory
                        ? `${metadata.directory}/${filename}`
                        : filename;

      const file = bucket.file(storagePath);
      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });
      await file.makePublic();
      downloadURL = file.publicUrl();
    }

    // 3) Build Firestore document data
    const docData = {
      ...metadata,
      storagePath,
      downloadURL,
      uploadedAt: new Date().toISOString(),
      clicks: 0
    };

    // 4) Save to Firestore
    const docRef = await db.collection("constitutionalDocuments").add(docData);

    // 5) Respond with new ID & URL
    res.status(201).json({ id: docRef.id, downloadURL });
  } catch (err) {
    console.error("Error uploading file:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// ----------------------------------------
// PATCH /api/files/:id
// Updates metadata fields on an existing document
// ----------------------------------------
router.patch("/:id", async (req, res) => {
  try {
    const updates = req.body; // assume valid fields from client
    await db.collection("constitutionalDocuments")
            .doc(req.params.id)
            .update(updates);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating file:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ----------------------------------------
// DELETE /api/files/:id
// Deletes both the Firestore document and its Storage file
// ----------------------------------------
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // 1) Fetch the doc to get its storagePath
    const docSnap = await db.collection("constitutionalDocuments").doc(id).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Document not found" });
    }
    const { storagePath } = docSnap.data();

    // 2) Delete the Firestore document
    await db.collection("constitutionalDocuments").doc(id).delete();

    // 3) Delete the file from Storage, if present
    if (storagePath) {
      try {
        await bucket.file(storagePath).delete();
      } catch (storageErr) {
        console.warn("Warning: failed to delete storage file:", storageErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
