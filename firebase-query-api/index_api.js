// server.js
const express = require('express');
const nlp = require('compromise');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

console.log("✅ THIS IS THE CORRECT FILE RUNNING ✅");

// Firebase Admin
console.log("Initializing Firebase Admin...");
const serviceAccount = require('./constitutionvault-1b5d1-firebase-adminsdk-fbsvc-9d7ee4d20e.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
console.log("Initialized Firebase Admin...");

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ NLP parser function
function parseNaturalQuery(input) {
  const doc = nlp(input);

  const month = doc.match('#Month').text();
  const monthNum = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12'
  }[month] || null;

  const titleMatch = input.match(/(?:called|named|titled)\s+(.+)/i);
  let title = titleMatch ? titleMatch[1].trim() : null;

  // 🩹 Fallback to full query if nothing else is matched
  const allEmpty = !title && !month && !doc.has('assignment') && !doc.match('University|College').found;
  if (allEmpty) {
    title = input.trim();
  }

  // Attempt more flexible author match
  const authorMatch = input.match(/by ([\w\s.]+)/i);
  const author = authorMatch ? authorMatch[1].trim() : null;

  return {
    author,
    category: doc.has('assignment') ? 'assignments' : null,
    institution: doc.match('University of *|Kings College London|King\'s College London').text() || null,
    month,
    monthNum,
    title
  };
}



// ✅ Only this /query route should exist
router.post('/query', async (req, res) => {
  console.log("🔥 /query route hit");
  const { query } = req.body;
  console.log("Raw search input:", query);

  // 🛑 Show all documents if query is empty
  if (!query || query.trim() === '') {
    try {
      const snapshot = await db.collection('constitutionalDocuments').get();
      const results = snapshot.docs.map(doc => doc.data());
      console.log(`📦 Returned ${results.length} documents (no query)`);
      return res.json({ results });
    } catch (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: err.message || 'Something went wrong' });
    }
  }

  // ✅ Parse query and continue with filtering
  const parsed = parseNaturalQuery(query);
  console.log("Parsed query:", parsed);

  try {
    let firestoreQuery = db.collection('constitutionalDocuments');

    // Apply exact filters on Firestore where possible
    if (parsed.author) {
      console.log("Filtering by author:", parsed.author);
      firestoreQuery = firestoreQuery.where('author', '==', parsed.author.trim());
    }
    if (parsed.category) {
      console.log("Filtering by category:", parsed.category);
      firestoreQuery = firestoreQuery.where('category', '==', parsed.category);
    }
    if (parsed.institution) {
      console.log("Filtering by institution:", parsed.institution);
      firestoreQuery = firestoreQuery.where('institution', '==', parsed.institution);
    }
    if (parsed.monthNum) {
      const startDate = `2025-${parsed.monthNum}-01`;
      const endDate = `2025-${parsed.monthNum}-31`;
      console.log("Filtering by date between", startDate, "and", endDate);
      firestoreQuery = firestoreQuery
        .where('date', '>=', startDate)
        .where('date', '<=', endDate);
    }

    const snapshot = await firestoreQuery.get();
    console.log("Documents found:", snapshot.size);
    let results = snapshot.docs.map(doc => doc.data());

    // 🧠 Normalize helper function
   const normalize = (str) =>
  str?.toLowerCase().replace(/[^\w\s]/gi, '').trim();

const queryTitle = normalize(parsed.title || '');
const queryAuthor = normalize(parsed.author || '');

// Then filter results by matching parsed title or author
results = results.filter(doc => {
  const normalizedDocTitle = normalize(doc.title);
  const normalizedDocAuthor = normalize(doc.author);

  const matchedTitle = queryTitle && normalizedDocTitle.includes(queryTitle);
  const matchedAuthor = queryAuthor && normalizedDocAuthor.includes(queryAuthor);

  console.log(`Comparing parsed title "${queryTitle}" with title "${normalizedDocTitle}" → ${matchedTitle}`);
  console.log(`Comparing parsed author "${queryAuthor}" with author "${normalizedDocAuthor}" → ${matchedAuthor}`);

  // Match if either title or author matches
  return matchedTitle || matchedAuthor;
});
    console.log("Final results count:", results.length);
    res.json({ results });

  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
});




// ✅ Health check
app.get('/test', (req, res) => {
  console.log('✅ GET /test called');
  res.send('API is running');
});

// ✅ Use the router

app.use('/', router);
// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
