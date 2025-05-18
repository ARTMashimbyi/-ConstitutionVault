// server/controllers/filesController.js
const { db, bucket } = require('../config/firebaseAdmin');
const path            = require('path');
const fs              = require('fs');

/**
 * POST /api/files
 * Handles both text uploads and file uploads.
 * - Expects a multipart/form-data body with:
 *    • metadata: JSON string containing title, directory, fileType, plus other fields
 *    • file: the uploaded file (unless fileType==='text')
 */
exports.uploadFile = async (req, res) => {
  try {
    // 1. Parse metadata
    const metadata = JSON.parse(req.body.metadata);
    const { fileType, directory = '' } = metadata;
    let storagePath, downloadURL;

    // 2. Handle text content uploads
    if (fileType === 'text') {
      const safeTitle = metadata.title.replace(/[^\w-]/g, '_');
      const filename  = `${safeTitle}_${Date.now()}.txt`;
      storagePath     = path.posix.join(directory, filename);
      const file      = bucket.file(storagePath);

      // Save text to Storage
      await file.save(metadata.textContent, {
        contentType: 'text/plain'
      });

      // Generate a signed URL (valid for 1 hour)
      [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60*60*1000
      });

    } else {
      // 3. Handle binary file uploads
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      const localPath = req.file.path;              // temp on disk
      storagePath     = path.posix.join(directory, req.file.originalname);

      // Upload to Storage
      await bucket.upload(localPath, { destination: storagePath });

      // Clean up temp file
      fs.unlinkSync(localPath);

      const file = bucket.file(storagePath);
      [downloadURL] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60*60*1000
      });
    }

    // 4. Write metadata record in Firestore
    const docData = {
      ...metadata,
      storagePath,
      downloadURL,
      uploadedAt: new Date().toISOString(),
      clicks: 0
    };
    const docRef = await db.collection('constitutionalDocuments').add(docData);

    // 5. Respond with ID and URL
    res.status(201).json({ id: docRef.id, downloadURL });

  } catch (err) {
    console.error('Error in uploadFile:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files
 * Returns an array of all documents stored in Firestore.
 */
exports.listFiles = async (req, res) => {
  try {
    const snapshot = await db.collection('constitutionalDocuments').get();
    const files    = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(files);
  } catch (err) {
    console.error('Error in listFiles:', err);
    res.status(500).json({ error: err.message });
  }
};
