// server/routes/search.js

const express = require('express');
const { semanticSearch } = require('../controllers/searchController');
const router = express.Router();

/**
 * GET /api/search
 * Query parameters:
 *   - query: the search text (required)
 *   - type:  optional fileType filter (e.g. "document", "image", etc.)
 */
router.get('/', semanticSearch);

module.exports = router;
