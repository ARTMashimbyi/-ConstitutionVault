// public/suggestions/home.js

// ——————————————————————————————————————————
// 1) API base URL & shared helpers
// ——————————————————————————————————————————
import {
  API_BASE,
  getUserInteractions,
  toggleFavorite,
  recordView,
  recordShare
} from "../shared/utils.js";



// ——————————————————————————————————————————
// 2) App state
// ——————————————————————————————————————————
export let loadedDocuments    = [];
let userInteractions          = { clicks: [], viewed: [], isFavorite: [], shared: [] };
let currentDoc                = null;
const currentUserId           = localStorage.getItem("currentUserId");
const currentDocId            = localStorage.getItem("currentDoc");
const settings                = JSON.parse(localStorage.getItem("userSettings") || "{}");

// ——————————————————————————————————————————
// 3) Bootstrapping
// ——————————————————————————————————————————
document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
  logOut();
});

async function initApp() {
  try {
    setupSearchBtn();
    await loadAllDocuments();
    // Only load interactions if a user is logged in
    if (currentUserId) {
      userInteractions = await getUserInteractions(currentUserId);
      updateStats();
    }
  } catch (err) {
    console.error("Initialization error:", err);
    showError("Failed to load documents");
  }
}

// ——————————————————————————————————————————
// 4) Load all docs from your API
// ——————————————————————————————————————————
export async function loadAllDocuments() {
  try {
    const res  = await fetch(`${API_BASE}/files`);
    if (!res.ok) throw new Error(res.statusText);
    const docs = await res.json();
    loadedDocuments = docs.map(d => ({
      ...d,
      isNew: isDocumentNew(d.uploadDate)
    }));
    applyFilters();
    renderAllSections();
  } catch (err) {
    console.error("Error loading documents:", err);
    showError("Failed to load documents");
  }
}

// ——————————————————————————————————————————
// 5) “New” badge helper
// ——————————————————————————————————————————
function isDocumentNew(uploadDate) {
  if (!uploadDate) return false;
  const then    = new Date(uploadDate).getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return then > weekAgo;
}


function createDocCard(doc) {
  const card = document.createElement('article');
  card.className = 'document-card';

  // NEW badge
  if (doc.isNew) {
    const badge = document.createElement('mark');
    badge.className = 'doc-badge';
    badge.textContent = 'NEW';
    card.appendChild(badge);
  }

  // Preview
  const fig = document.createElement('figure');
  let previewEl;
  switch (doc.fileType) {
    case 'image':
      previewEl = document.createElement('img');
      previewEl.src = doc.downloadURL;
      previewEl.alt = doc.title || 'Image preview';
      previewEl.loading = 'lazy';
      break;
    case 'audio':
      previewEl = document.createElement('audio');
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    case 'video':
      previewEl = document.createElement('video');
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    default:
      if (doc.downloadURL?.endsWith('.pdf')) {
        previewEl = document.createElement('embed');
        previewEl.src = `${doc.downloadURL}#page=1&view=FitH`;
        previewEl.type = 'application/pdf';
        previewEl.width = '100%';
        previewEl.height = '400px';
      } else {
        previewEl = document.createElement('p');
        previewEl.textContent = 'Preview not available for this file type.';
      }
  }
  fig.appendChild(previewEl);
  card.appendChild(fig);

  // Metadata + actions
  card.innerHTML += `
    <h3>${doc.title || 'Untitled Document'}</h3>
    <menu class="doc-meta">
      <li><i class="fas fa-file"></i> ${doc.fileType || 'Unknown'}</li>
      <li><i class="fas fa-eye"></i> ${doc.clicks || 0}</li>
      <li><i class="fas fa-tag"></i> ${doc.category || 'Uncategorized'}</li>
    </menu>
    ${doc.institution ? `<p>${doc.institution}</p>` : ''}
    <menu class="doc-actions">
      <li><button class="action-btn view-btn"><i class="fas fa-eye"></i> View</button></li>
      <li><button class="action-btn fav-btn ${doc.isFavorite ? 'active' : ''}"
                 aria-label="${doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fas fa-star"></i>
          </button></li>
      <li><button class="action-btn share-btn"><i class="fas fa-share-alt"></i></button></li>
    </menu>
  `;

  // Favorite toggle
  card.querySelector('.fav-btn').addEventListener('click', async e => {
    e.stopPropagation();
    userInteractions = await toggleFavorite(currentUserId, doc.id, !doc.isFavorite);
    renderAllSections();
  });

  // View inline
  card.querySelector('.view-btn').addEventListener('click', async e => {
    e.stopPropagation();
    userInteractions = await recordView(currentUserId, doc.id);
    updateStats();
    openDocumentInline(doc);
  });

  // Share
  card.querySelector('.share-btn').addEventListener('click', async e => {
    e.stopPropagation();
    const shareData = {
      title: doc.title || 'Untitled',
      text:  doc.description || 'Check this out!',
      url:   doc.downloadURL
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(console.error);
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
    userInteractions = await recordShare(currentUserId, doc.id);
    updateStats();
  });

  return card;
}



// ——————————————————————————————————————————
// Rendering helpers
// ——————————————————————————————————————————

/**
 * Render a list of document cards into the given container.
 * @param {string} sectionSelector - CSS selector for the container
 * @param {Array<Object>} docs - Array of document objects
 */
function renderDocuments(sectionSelector, docs) {
  const container = document.querySelector(sectionSelector);
  if (!container) return;

  container.innerHTML = "";
  if (!docs?.length) {
    container.innerHTML = `
      <article class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No documents found</p>
      </article>
    `;
    return;
  }

  docs.forEach(doc => container.appendChild(createDocCard(doc)));
}

/**
 * Render the “All Files” grid using whatever is
 * returned by applyFilters()
 */
function renderAllDocuments() {
  const filtered = applyFilters();
  renderDocuments("#all-documents-grid", filtered);
}

/**
 * Render suggestions, recently viewed, favorites, and all documents.
 */
async function renderAllSections() {
  // 1) Refresh user interactions if we have a user
  if (currentUserId) {
    userInteractions = await getUserInteractions(currentUserId);
  }

  // 2) Mark favorites on loadedDocuments
  loadedDocuments.forEach(doc => {
    doc.isFavorite = userInteractions.isFavorite?.includes(doc.id);
  });

  // 3) Suggestions (top 5 by click count)
  const suggested = [...loadedDocuments]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);
  renderDocuments(".suggestions", suggested);

  // 4) Recently Viewed (last 5 in reverse-chronological order)
  if (currentUserId) {
    const recentIds = (userInteractions.viewed || []).slice(-5).reverse();
    const recentDocs = loadedDocuments.filter(d => recentIds.includes(d.id));
    renderDocuments(".recently-viewed", recentDocs);
  }

  // 5) Favorites
  const favorites = loadedDocuments.filter(doc => doc.isFavorite);
  renderDocuments(".favorites", favorites);

  // 6) All Files grid (first page of filtered results)
  renderAllDocuments();

  // 7) Update the stat cards
  updateStats();
}

// ——————————————————————————————————————————
// 7) Filtering logic based on userSettings
// ——————————————————————————————————————————
function applyFilters() {
  // Use the pre-parsed settings object
  const userSettings = settings;

  // If no settings or no loaded docs, skip filtering
  if (!Array.isArray(loadedDocuments) || !userSettings || !Object.keys(userSettings).length) {
    return loadedDocuments;
  }

  return loadedDocuments.filter(doc => {
    const normalize = str => str?.toLowerCase().trim() || "";

    // Author filter
    const authorList = Array.isArray(userSettings.author) ? userSettings.author : [];
    const authorMatch = !authorList.length ||
      authorList.map(normalize).includes(normalize(doc.author));

    // Category filter
    const categoryList = Array.isArray(userSettings.category) ? userSettings.category : [];
    const categoryMatch = !categoryList.length ||
      categoryList.map(normalize).includes(normalize(doc.category));

    // Institution filter
    const institutionList = Array.isArray(userSettings.institution) ? userSettings.institution : [];
    const institutionMatch = !institutionList.length ||
      institutionList.map(normalize).includes(normalize(doc.institution));

    // Keywords filter
    let keywordsMatch = true;
    if (Array.isArray(userSettings.keywords) && userSettings.keywords.length) {
      const wanted = userSettings.keywords
        .map(k => k.trim().toLowerCase())
        .filter(k => k);
      if (Array.isArray(doc.keywords) && doc.keywords.length) {
        keywordsMatch = doc.keywords.some(kw =>
          wanted.includes(kw.toLowerCase())
        );
      } else {
        keywordsMatch = false;
      }
    }

    return authorMatch && categoryMatch && institutionMatch && keywordsMatch;
  });
}


// ——————————————————————————————————————————
// 8) Error display helper
// ——————————————————————————————————————————
function showError(message) {
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
}

// ——————————————————————————————————————————
// 9) Update dashboard stats
// ——————————————————————————————————————————
function updateStats() {
  const totalDocs   = loadedDocuments.length;
  const totalViews  = userInteractions.viewed?.length    || 0;
  const totalFav    = userInteractions.isFavorite?.length || 0;
  const totalShares = userInteractions.shared?.length    || 0;

  document.querySelectorAll(".stat-card").forEach(card => {
    const label = card.querySelector(".stat-label")?.textContent;
    const value = card.querySelector(".stat-value");
    if (!value) return;

    switch (label) {
      case "Total Documents":
        value.textContent = totalDocs;
        break;
      case "Viewed":
        value.textContent = totalViews;
        break;
      case "Favorites":
        value.textContent = totalFav;
        break;
      case "Shared":
        value.textContent = totalShares;
        break;
    }
  });
}

// ——————————————————————————————————————————
// 10) Button wiring & navigation
// ——————————————————————————————————————————
function setupSearchBtn() {
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      // go to the full search interface
      window.location.href = "../user-interface/user-search.html";
    });
  }
}

function logOut() {
  const logOutBtn = document.querySelector('a[href="#"] .fa-sign-out-alt')
                       ?.parentElement;
  if (logOutBtn) {
    logOutBtn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }
}

// ——————————————————————————————————————————
// 11) Open in inline modal viewer
// ——————————————————————————————————————————
function openDocument(doc) {
  openDocumentInline(doc);
}

// ——————————————————————————————————————————
// 12) Fallback “popular” suggestions
// ——————————————————————————————————————————
function popularSuggestions() {
  return loadedDocuments
    .filter(d => d.id)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);
}

// ——————————————————————————————————————————
// 13) Build preference counts from loadedDocuments + userInteractions
// ——————————————————————————————————————————
async function preferences() {
  const viewedIds = userInteractions.viewed || [];
  const preference = {
    category: {}, author: {}, institution: {},
    fileType: {}, keywords: {}
  };

  viewedIds.forEach(id => {
    const d = loadedDocuments.find(doc => doc.id === id);
    if (!d) return;
    ['category', 'author', 'institution', 'fileType'].forEach(key => {
      const val = d[key];
      if (val) preference[key][val] = (preference[key][val] || 0) + 1;
    });
    (d.keywords || []).forEach(kw => {
      preference.keywords[kw] = (preference.keywords[kw] || 0) + 1;
    });
  });

  return preference;
}

// ——————————————————————————————————————————
// 14) Score & pick top suggestions by preference
// ——————————————————————————————————————————
function suggestionsByPreference(preference, allDocs, currentDocId) {
  return allDocs
    .filter(doc => doc.id !== currentDocId)
    .map(doc => {
      let value = 0;
      value += (preference.category[doc.category] || 0) * 2;
      value += (preference.author[doc.author] || 0) * 2;
      value += (preference.institution[doc.institution] || 0) * 2;
      value += (preference.fileType[doc.fileType] || 0) * 2;
      (doc.keywords || []).forEach(keyword => {
        value += (preference.keywords[keyword] || 0) * 2;
      });
      return { doc, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(item => item.doc);
}

// ——————————————————————————————————————————
// 15) (OLD override removed)  
// ——————————————————————————————————————————
// All favorite–toggling now uses the `toggleFavorite` imported at the top of this file.


/**
 * Record a “share” for both file and user, then update stats.
 * @param {string} docId
 */
async function incrementShareCount(docId) {
  try {
    userInteractions = await recordShare(currentUserId, docId);
    updateStats();
  } catch (error) {
    console.error("Error recording share:", error);
  }
}

/**
 * Fetch the latest share count for a file and update the UI.
 * @param {string} docId
 */
export async function updateSharedStat(docId) {
  try {
    const res = await fetch(
      `${API_BASE}/files/${encodeURIComponent(docId)}`
    );
    if (!res.ok) throw new Error(res.statusText);
    const file = await res.json();
    document.getElementById("shared-count").textContent = file.shares || 0;
  } catch (error) {
    console.error("Error fetching shared stat:", error);
  }
}

// Note: we no longer need a separate incrementViewCount helper,
// since recordView(userId, docId) already bumps both file and user history.