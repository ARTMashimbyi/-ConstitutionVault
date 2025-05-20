// server/controllers/searchController.js

const { getEmbedding } = require('../config/vertexClient');
const { db }           = require('../config/firebaseAdmin');

/** cosine similarity */
function cosine(a = [], b = []) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA && magB ? dot / Math.sqrt(magA * magB) : 0;
}

/** snippet extractor */
function extractSnippet(fullText = '', query = '') {
  const lower = fullText.toLowerCase();
  const idx   = lower.indexOf(query.toLowerCase());
  if (idx === -1) return fullText.slice(0,150) + '…';
  const start = Math.max(0, idx - 50);
  return (start ? '…' : '') + fullText.slice(start, start + 200) + '…';
}

/**
 * GET /api/search?query=&type=&sort=&dateFrom=&dateTo=
 */
async function semanticSearch(req, res) {
  const rawQ       = (req.query.query || '').trim().toLowerCase();
  const typeFilter = req.query.type;
  const sortFilter = req.query.sort;
  const dateFrom   = req.query.dateFrom; // YYYY-MM-DD
  const dateTo     = req.query.dateTo;   // YYYY-MM-DD

  // 1) Load and type‐filter
  const snapshot = await db.collection('constitutionalDocuments').get();
  let docs = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => !typeFilter || d.fileType === typeFilter);

  // DEBUG: log date params and pre-filter count
  console.log('🔍 dateFrom:', dateFrom, 'dateTo:', dateTo, 'total docs before filter:', docs.length);

  // 2) Date‐range filter
  if (dateFrom || dateTo) {
    docs = docs.filter(d => {
      if (!d.uploadedAt) return false;
      const u = new Date(d.uploadedAt);
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (u < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (u > to) return false;
      }
      return true;
    });
    // DEBUG: log post-filter count
    console.log('… docs after date filter:', docs.length);
  }

  // 3) No query => return first page
  if (!rawQ) {
    const results = docs.slice(0, 20).map(d => ({
      title:       d.title,
      author:      d.author,
      institution: d.institution,
      category:    d.category,
      keywords:    Array.isArray(d.keywords) ? d.keywords : [],
      date:        d.uploadedAt,
      url:         d.downloadURL || d.url,
      fileType:    d.fileType,
      snippet:     d.title,
      score:       null
    }));
    return res.json({ results });
  }

  // 4) Attempt semantic embedding
  let qEmbed = null;
  try {
    qEmbed = await getEmbedding(rawQ);
  } catch (e) {
    console.warn('Embedding error:', e.message);
  }

  // 5) Rank or substring‐filter
  let results;
  if (qEmbed && docs.every(d => Array.isArray(d.embedding))) {
    results = docs
      .map(d => ({ ...d, score: cosine(d.embedding, qEmbed) }))
      .sort((a,b) => b.score - a.score);
  } else {
    results = docs
      .filter(d => {
        const fields = [
          d.title, d.description, d.author, d.category,
          d.institution,
          ...(Array.isArray(d.keywords) ? d.keywords : []),
          d.fullText
        ]
        .filter(Boolean)
        .map(s => s.toLowerCase());
        return fields.some(f => f.includes(rawQ));
      })
      .map(d => ({ ...d, score: null }));
  }

  // 6) Apply user‐selected sort if provided
  if (sortFilter) {
    const [field, dir] = sortFilter.split('-');
    results.sort((a,b) => {
      let va = field === 'year'
        ? new Date(a.uploadedAt).getFullYear()
        : (a[field] || '').toString().toLowerCase();
      let vb = field === 'year'
        ? new Date(b.uploadedAt).getFullYear()
        : (b[field] || '').toString().toLowerCase();
      return dir === 'asc'
        ? String(va).localeCompare(vb)
        : String(vb).localeCompare(va);
    });
  }

  // 7) No matches?
  if (!results.length) {
    return res.json({
      results: [],
      message: '😔 No documents matched—try different keywords or broaden your terms!'
    });
  }

  // 8) Shape top‐20 response
  const top = results.slice(0, 20).map(d => ({
    title:       d.title,
    author:      d.author,
    institution: d.institution,
    category:    d.category,
    keywords:    Array.isArray(d.keywords) ? d.keywords : [],
    date:        d.uploadedAt,
    url:         d.downloadURL || d.url,
    fileType:    d.fileType,
    snippet:     extractSnippet(d.fullText, rawQ),
    score:       d.score != null ? d.score.toFixed(3) : undefined
  }));

  res.json({ results: top });
}

module.exports = { semanticSearch };
