// server/config/firebaseAdmin.js

const path  = require("path");
const admin = require("firebase-admin");

// Adjust this to exactly match your JSON key filename:
const keyPath = path.join(
  __dirname,    // …/server/config
  "..",         // …/server
  "..",         // …/-ConstitutionVault (project root)
  "key",        // the folder next to server/
  "constitutionvault-1b5d1-firebase-adminsdk-fbsvc-6a8ce536de.json"
);

// Load the service account key
const serviceAccount = require(keyPath);

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app"
});

// Export Firestore for your route handlers
const db = admin.firestore();
module.exports = { db };
