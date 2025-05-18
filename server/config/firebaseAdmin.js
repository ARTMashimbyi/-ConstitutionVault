// server/config/firebaseAdmin.js
const path  = require("path");
const admin = require("firebase-admin");

// Point this at your service account JSON:
const keyPath = path.join(
  __dirname, "..", "..", "key",
  "constitutionvault-1b5d1-firebase-adminsdk-fbsvc-6a8ce536de.json"
);
const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app"
});

const db     = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
