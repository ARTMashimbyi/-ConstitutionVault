// server/controllers/directoriesController.js

const { db } = require('../config/firebaseAdmin');

/**
 * Helper to normalize directory paths (single leading slash, no trailing except "/")
 */
function normalizePath(p) {
  if (!p) return '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Recursively lists all directories (flat, since all are in one collection)
 * GET /api/directories
 */
async function listAllDirectories(req, res) {
  try {
    const snap = await db.collection('directories').get();
    const result = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        path: normalizePath(data.path),
        description: data.description || ''
      };
    });
    res.json(result);
  } catch (err) {
    console.error('Error in listAllDirectories:', err);
    res.status(500).json({ error: 'Failed to fetch directories' });
  }
}

/**
 * Create a new directory
 * POST /api/directories
 * Body should be { name, path, description }
 */
async function createDirectory(req, res) {
  try {
    const data = req.body;
    data.path = normalizePath(data.path);
    const docRef = await db.collection('directories').add(data);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    console.error('Error in createDirectory:', err);
    res.status(500).json({ error: 'Failed to create directory' });
  }
}

/**
 * Fetch a single directory by ID
 * GET /api/directories/:id
 */
async function getDirectoryById(req, res) {
  try {
    const snap = await db.collection('directories').doc(req.params.id).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('Error in getDirectoryById:', err);
    res.status(500).json({ error: 'Failed to fetch directory' });
  }
}

/**
 * Batch deletes (Firestore limit: 500 per batch, safe to use 400)
 */
async function runBatchDeletes(ops) {
  const chunks = [];
  for (let i = 0; i < ops.length; i += 400) {
    chunks.push(ops.slice(i, i + 400));
  }
  for (const chunk of chunks) {
    const batch = db.batch();
    for (const ref of chunk) batch.delete(ref);
    await batch.commit();
  }
}

/**
 * Delete a directory and all its subdirectories and files
 * DELETE /api/directories/:id
 */
async function deleteDirectory(req, res) {
  try {
    const id = req.params.id;
    const dirRef = db.collection('directories').doc(id);
    const dirSnap = await dirRef.get();

    if (!dirSnap.exists) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const dirPath = normalizePath(dirSnap.data().path);

    // 1) Delete all sub-directories whose path starts with dirPath + '/'
    const subDirSnap = await db.collection('directories')
      .where('path', '>=', dirPath + '/')
      .where('path', '<', dirPath + '/\uf8ff')
      .get();

    // 2) Delete the directory itself
    const refsToDelete = subDirSnap.docs.map(d => d.ref);
    refsToDelete.push(dirRef);

    // 3) Delete all files in this directory and its subdirectories
    const filesSnap = await db.collection('constitutionalDocuments')
      .where('directory', '>=', dirPath + '/')
      .where('directory', '<', dirPath + '/\uf8ff')
      .get();
    filesSnap.docs.forEach(d => refsToDelete.push(d.ref));

    // 4) Delete files directly in this directory (not only subdirectories)
    const filesInThisDir = await db.collection('constitutionalDocuments')
      .where('directory', '==', dirPath)
      .get();
    filesInThisDir.docs.forEach(d => refsToDelete.push(d.ref));

    // 5) Run batch deletes
    await runBatchDeletes(refsToDelete);

    res.json({ success: true });
  } catch (err) {
    console.error('Error in deleteDirectory:', err);
    res.status(500).json({ error: 'Failed to delete directory' });
  }
}

module.exports = {
  listAllDirectories,
  createDirectory,
  getDirectoryById,
  deleteDirectory
};
