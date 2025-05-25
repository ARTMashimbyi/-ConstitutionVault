// server/routes/auth.js

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Middleware to verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  const idToken = req.body.idToken || req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Missing ID token" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid ID token" });
  }
}

// Example: POST /api/auth/admin-status
router.post("/admin-status", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Check if UID is in the Admin_users collection (assumes Firestore)
    const db = admin.firestore();
    const adminSnap = await db.collection("Admin_users").where("UID", "==", uid).get();

    const isAdmin = !adminSnap.empty;
    res.json({ isAdmin });
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
