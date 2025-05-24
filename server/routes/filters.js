// server/routes/filters.js

const express = require("express");
const router = express.Router();
const { getFilterOptions } = require("../controllers/filtersController");

// GET /api/filters/options
router.get("/options", getFilterOptions);

module.exports = router;
