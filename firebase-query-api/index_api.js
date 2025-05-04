console.log("✅ THIS IS THE CORRECT FILE RUNNING ✅");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
console.log("Initializing Firebase Admin...");
const serviceAccount = require('./constitutionvault-1b5d1-firebase-adminsdk-fbsvc-de355f105d.json');
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
// Query endpoint (skeleton)
app.post('/query', async (req, res) => {
    console.log('Received a POST request to /query');  // Added log here

    const { query } = req.body;
    console.log(`Received query: ${query}`);  // log the query
  
    try {
      const snapshot = await db.collection('constitutionalDocuments').get(); // Collection name is 'constitutionalDocuments'
      console.log(`Found ${snapshot.size} documents in the collection.`);  // log the number of documents
      let results = [];
  
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Document data:`, data); // log each document's data
        // Basic search logic, looking in title or tags
        if (
          data.title?.toLowerCase().includes(query.toLowerCase()) ||
          data.keywords?.some(keywords => keywords.toLowerCase().includes(query.toLowerCase()))
        ) {
          results.push({
            title: data.title || 'No title',
            snippet: `keywords: ${data.keywords?.join(', ')}`,
            link: data.downloadURL || 'No link',
            type: 'pdf' // assuming PDF for now
          });
        }
      });
  
      // Send response with matching results
      res.status(200).send({ query, results });
  
    } catch (error) {
      console.error('❌ Error occurred:', error);
      console.error(error);
      res.status(500).send('Error querying data');
    }
  });
  
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
