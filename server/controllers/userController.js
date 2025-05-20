// server/controllers/userController.js

const { db } = require('../config/firebaseAdmin');

/**
 * Check if the given UID belongs to an admin
 * This version loops through all admin records like the old frontend logic
 */
exports.checkAdmin = async (req, res) => {
  const { uid } = req.body;

  try {
    const adminSnap = await db.collection("Admin_users").get();
    let isAdmin = false;

    adminSnap.forEach((doc) => {
      const adminData = doc.data();
      if (adminData.UID === uid) {
        isAdmin = true;
        console.log(`✅ Admin matched for UID: ${uid}`);
      }
    });

    if (!isAdmin) {
      console.log(`🚫 UID ${uid} not found in Admin_users`);
    }

    res.json({ isAdmin });
  } catch (err) {
    console.error("❌ Admin check failed:", err.message);
    res.status(500).json({ isAdmin: false });
  }
};

/**
 * Register a new user if not already present in Firestore
 */
exports.register = async (req, res) => {
  const { uid } = req.body;

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        uid,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Registered new user: ${uid}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Failed to register user:", err.message);
    res.status(500).json({ success: false });
  }
};

/**
 * Initialize user activity tracking fields if not already present
 */
exports.trackActivity = async (req, res) => {
  const { uid } = req.body;

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists && !userSnap.data().userInteractions) {
      await userRef.update({
        userInteractions: {
          clicks: {},
          shared: [],
          isFavorite: [],
          viewed: []
        }
      });
      console.log(`📊 Initialized activity for user: ${uid}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Failed to track user activity:", err.message);
    res.status(500).json({ success: false });
  }
};
