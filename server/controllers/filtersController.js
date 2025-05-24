// server/controllers/filtersController.js

const { db } = require("../config/firebaseAdmin");

exports.getFilterOptions = async (req, res) => {
  try {
    // 1. Parse query params as filters
    // Accept arrays or CSV strings (frontend can send either)
    const parse = val => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        // Try parsing JSON array
        const arr = JSON.parse(val);
        if (Array.isArray(arr)) return arr;
      } catch {}
      // Otherwise, treat as CSV string
      return String(val)
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);
    };

    const authorFilter      = parse(req.query.author).map(s => s.toLowerCase());
    const typeFilter        = parse(req.query.fileType);
    const categoryFilter    = parse(req.query.category).map(s => s.toLowerCase());
    const keywordsFilter    = parse(req.query.keywords).map(s => s.toLowerCase());
    const institutionFilter = parse(req.query.institution).map(s => s.toLowerCase());

    // 2. Fetch all documents (or optimize for large collections)
    const snapshot = await db.collection("constitutionalDocuments").get();

    // 3. Filter docs by all supplied filters
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (authorFilter.length)
      docs = docs.filter(
        d => d.author && authorFilter.includes(String(d.author).toLowerCase())
      );

    if (typeFilter.length)
      docs = docs.filter(
        d => d.fileType && typeFilter.includes(d.fileType)
      );

    if (categoryFilter.length)
      docs = docs.filter(
        d => d.category && categoryFilter.includes(String(d.category).toLowerCase())
      );

    if (institutionFilter.length)
      docs = docs.filter(
        d => d.institution && institutionFilter.includes(String(d.institution).toLowerCase())
      );

    if (keywordsFilter.length)
      docs = docs.filter(d => {
        if (!d.keywords) return false;
        const kws = Array.isArray(d.keywords)
          ? d.keywords.map(x => x.toLowerCase())
          : [String(d.keywords).toLowerCase()];
        return keywordsFilter.some(k => kws.includes(k));
      });

    // 4. Collect possible values for each filter field in the result set
    const authors      = new Set();
    const fileTypes    = new Set();
    const categories   = new Set();
    const keywords     = new Set();
    const institutions = new Set();

    for (const d of docs) {
      if (d.author)      authors.add(String(d.author));
      if (d.fileType)    fileTypes.add(d.fileType);
      if (d.category)    categories.add(String(d.category));
      if (d.institution) institutions.add(String(d.institution));
      if (d.keywords) {
        (Array.isArray(d.keywords) ? d.keywords : [d.keywords]).forEach(k => keywords.add(k));
      }
    }

    // 5. Respond with possible values for each filter (alphabetically sorted)
    res.json({
      authors:      Array.from(authors).sort(),
      fileTypes:    Array.from(fileTypes).sort(),
      categories:   Array.from(categories).sort(),
      keywords:     Array.from(keywords).sort(),
      institutions: Array.from(institutions).sort(),
    });
  } catch (err) {
    console.error("Error in getFilterOptions:", err);
    res.status(500).json({ error: "Failed to get filter options" });
  }
};
