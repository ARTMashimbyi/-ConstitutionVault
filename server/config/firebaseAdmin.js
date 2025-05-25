// server/config/firebaseAdmin.js 

const admin = require("firebase-admin");

// Load credentials from environment variable in production (Azure)
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
} else {
  // Fallback: Load from local file for local development
  const path = require("path");
  const keyPath = path.join(
    __dirname, "..", "..", "key",
    "constitutionvault-1b5d1-firebase-adminsdk-fbsvc-6a8ce536de.json"
  );
  serviceAccount = require(keyPath);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app"   // <-- correct bucket name!
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
