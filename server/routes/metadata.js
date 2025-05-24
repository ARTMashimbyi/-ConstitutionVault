// server/routes/metadata.js

const express = require("express");
const router = express.Router();
const { getUniqueMetadataValues } = require("../controllers/metadataController");

// GET /api/metadata/:type
router.get("/:type", getUniqueMetadataValues);

module.exports = router;
