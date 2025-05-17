console.log("✅ THIS IS THE CORRECT FILE RUNNING ✅");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
console.log("Initializing Firebase Admin...");
const serviceAccount = require('./key/constitutionvault-1b5d1-firebase-adminsdk-fbsvc-e1edbb46b4.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
console.log("Initialized Firebase Admin...");

// Firestore instance
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Basic health check
app.get('/test', (req, res) => {
  process.stdout.write('✅ get is working\n');  // force print
  res.send('API is running');
});
console.log("API is up");

// Query endpoint (with multi-value filtering support)
app.post('/query', async (req, res) => {
  console.log('Received a POST request to /query');

  const { query, settings = {} } = req.body;
  console.log(`Received query: ${query}`);
  console.log(`Received settings:`, settings);

  try {
    const snapshot = await db.collection('constitutionalDocuments').get();
    console.log(`Found ${snapshot.size} documents in the collection.`);
    let results = [];

    const lower = query?.toLowerCase().trim() || "";

    // Helper function to match comma-separated filters
    const matchListField = (field, docValue) => {
      if (!settings[field]) return true;
      const values = settings[field]
        .split(",")
        .map(v => v.trim().toLowerCase())
        .filter(v => v);
      return values.includes((docValue || "").toLowerCase());
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Document data:`, data);

      // Match query
      const matchQuery =
        !lower ||
        data.title?.toLowerCase().includes(lower) ||
        data.keywords?.some(k => k.toLowerCase().includes(lower));

      // Match filters
      const matchAuthor = matchListField("author", data.author);
      const matchCategory = matchListField("category", data.category);
      const matchInstitution = matchListField("institution", data.institution);

      // Match keywords array
      let matchKeywords = true;
      if (settings.keywords) {
        const keywordList = settings.keywords
          .split(",")
          .map(k => k.trim().toLowerCase())
          .filter(k => k);

        if (Array.isArray(data.keywords)) {
          matchKeywords = keywordList.some(k =>
            data.keywords.some(docKeyword =>
              docKeyword.toLowerCase() === k
            )
            
          );
        } else {
          matchKeywords = false;
        }
      }

      // Add result if all match
      if (matchQuery && matchAuthor && matchCategory && matchInstitution && matchKeywords) {
        results.push({
          institution: data.institution || 'Unknown institution',
          title: data.title || 'No title',
          snippet: `keywords: ${data.keywords?.join(', ')}`,
          link: data.downloadURL || 'No link',
          type: data.fileType || 'pdf'
        });
      }
    });

    results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    res.status(200).send({ query, results });

  } catch (error) {
    console.error('❌ Error occurred:', error);
    res.status(500).send('Error querying data');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
