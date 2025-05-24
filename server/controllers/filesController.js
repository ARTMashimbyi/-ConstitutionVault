// server/controllers/filesController.js

const { db, bucket } = require('../config/firebaseAdmin');
const path            = require('path');
const pdfParse        = require('pdf-parse');

/**
 * POST /api/files
 * Handles text and binary uploads.
 */
exports.uploadFile = async (req, res) => {
  try {
    const metadata = JSON.parse(req.body.metadata);
    const { fileType, directory = '' } = metadata;
    let storagePath, downloadURL, fullText = '';

    if (fileType === 'text') {
      // Text uploads
      const safeTitle = metadata.title.replace(/[^\w-]/g, '_');
      const filename  = `${safeTitle}_${Date.now()}.txt`;
      storagePath     = path.posix.join(directory, filename);
      const file      = bucket.file(storagePath);

      await file.save(metadata.textContent, { contentType: 'text/plain' });
      fullText = metadata.textContent;
      [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000
      });

    } else {
      // Binary uploads (PDF, image, etc.)
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const buffer       = req.file.buffer;
      storagePath        = path.posix.join(directory, req.file.originalname);
      const file         = bucket.file(storagePath);

      await file.save(buffer, { metadata: { contentType: req.file.mimetype } });
      await file.makePublic();
      downloadURL        = file.publicUrl();

      // Extract fullText from PDFs
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        fullText      = pdfData.text;
      }
    }

    // Save to Firestore
    const docData = {
      ...metadata,
      storagePath,
      downloadURL,
      uploadedAt: new Date().toISOString(),
      clicks:     0,
      fullText
    };
    const docRef = await db.collection('constitutionalDocuments').add(docData);

    res.status(201).json({ id: docRef.id, downloadURL });
  } catch (err) {
    console.error('Error in uploadFile:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files
 * Lists all files, sorted newest first.
 */
exports.listFiles = async (req, res) => {
  try {
    const snapshot = await db
      .collection('constitutionalDocuments')
      .orderBy('uploadedAt', 'desc')
      .get();

    const files = snapshot.docs.map(doc => ({
      id:   doc.id,
      ...doc.data()
    }));

    res.json(files);
  } catch (err) {
    console.error('Error in listFiles:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files/:id
 * Fetch a single file by its Firestore ID.
 */
exports.getFileById = async (req, res) => {
  try {
    const snap = await db
      .collection('constitutionalDocuments')
      .doc(req.params.id)
      .get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('Error in getFileById:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/files/:id
 * Updates metadata fields on an existing document.
 */
exports.updateFile = async (req, res) => {
  try {
    await db
      .collection('constitutionalDocuments')
      .doc(req.params.id)
      .update(req.body);

    res.json({ success: true });
  } catch (err) {
    console.error('Error in updateFile:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/files/:id
 * Deletes the Firestore document and its Storage file.
 */
exports.deleteFile = async (req, res) => {
  try {
    const docRef = db.collection('constitutionalDocuments').doc(req.params.id);
    const snap   = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { storagePath } = snap.data();
    await docRef.delete();

    if (storagePath) {
      await bucket.file(storagePath).delete().catch(() => {
        console.warn('Failed to delete storage file:', storagePath);
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error in deleteFile:', err);
    res.status(500).json({ error: err.message });
  }
};
