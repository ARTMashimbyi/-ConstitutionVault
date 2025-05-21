// server/routes/user.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Admin check
router.post('/check-admin', userController.checkAdmin);

// Register user if not exists
router.post('/register', userController.register);

// Initialize user activity if needed
router.post('/track-activity', userController.trackActivity);

module.exports = router; // ✅ Important: this makes it usable in server.js
