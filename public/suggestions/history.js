// public/suggestions/history.js

import {
  API_BASE,
  getUserInteractions,
  recordView,
  toggleFavorite
} from "../shared/utils.js";

let loadedDocuments    = [];
let userInteractions   = {};

const currentUserId = localStorage.getItem("currentUserId");
console.log("Current User ID:", currentUserId);

if (!currentUserId) {
  alert("Please login to view documents.");
  window.location.href = "../user signup/index.html";
}

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  try {
    await loadAllDocuments();
    userInteractions = await getUserInteractions(currentUserId);
    renderStats(userInteractions);
    await loadAllHistory(currentUserId);
    renderAllSections();
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to load documents");
  }
}

async function loadAllDocuments() {
  const res = await fetch(`${API_BASE}/files`);
  if (!res.ok) throw new Error(res.statusText);
  const docs = await res.json();
  loadedDocuments = docs.map(d => ({
    ...d,
    isNew: isDocumentNew(d.uploadDate)
  }));
}

function isDocumentNew(uploadDate) {
  if (!uploadDate) return false;
  const uploadTime = new Date(uploadDate).getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return uploadTime > weekAgo;
}

async function loadAllHistory(userId) {
  const viewed = userInteractions.viewed || [];
  const recent = [...viewed].reverse().slice(0, 5);
  const historyList = document.getElementById("history");
  historyList.innerHTML = "";

  if (!recent.length) {
    historyList.innerHTML = "<li>No user history</li>";
    return;
  }

  for (const docId of recent) {
    try {
      const res = await fetch(`${API_BASE}/files/${encodeURIComponent(docId)}`);
      if (!res.ok) throw new Error(res.statusText);
      const file = await res.json();
      getTitle(file);
      console.log(docId);
    } catch (err) {
      console.error(`Error loading history item ${docId}:`, err);
    }
  }
}
loadAllHistory(currentUserId);
async function loadUserInteractions(userId) {
  userInteractions = await getUserInteractions(userId);
  console.log("User interactions loaded:", userInteractions);
  updateStats(userInteractions);
}


let historyItems = [];

/**
 * Add a file object to the history list.
 * @param {object} file  File metadata from API
 */
function getTitle(file) {
  if (!file || !file.id) return;
  historyItems.push(file);
}

/**
 * Render the “All Documents” grid from historyItems.
 */
function renderAllDocuments() {
  const container = document.getElementById("all-documents-grid");
  if (!container) return;
  container.innerHTML = "";

  if (historyItems.length === 0) {
    container.innerHTML = `
      <article class="empty-state" style="grid-column: 1/-1">
        <i class="fas fa-folder-open"></i>
        <p>No documents found</p>
      </article>
    `;
    return;
  }

  historyItems.forEach(doc => {
    container.appendChild(createDocCard(doc));
  });
}

/**
 * Create a document‐card element with View, Favorite, Share buttons.
 * Uses API helpers for actions and opens inline in a modal.
 */
function createDocCard(doc) {
  const card = document.createElement("article");
  card.className = "document-card";

  // NEW badge
  if (doc.isNew) {
    const badge = document.createElement("mark");
    badge.className = "doc-badge";
    badge.textContent = "NEW";
    card.appendChild(badge);
  }

  // Preview element
  const fig = document.createElement("figure");
  let previewEl;
  switch (doc.fileType) {
    case "image":
      previewEl = document.createElement("img");
      previewEl.src = doc.downloadURL;
      previewEl.alt = doc.title || "Image preview";
      previewEl.loading = "lazy";
      break;
    case "audio":
      previewEl = document.createElement("audio");
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    case "video":
      previewEl = document.createElement("video");
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    default:
      if (doc.downloadURL?.endsWith(".pdf")) {
        previewEl = document.createElement("embed");
        previewEl.src = `${doc.downloadURL}#page=1&view=FitH`;
        previewEl.type = "application/pdf";
        previewEl.width = "100%";
        previewEl.height = "400px";
      } else {
        previewEl = document.createElement("p");
        previewEl.textContent = "Preview not available for this file type.";
      }
  }
  fig.appendChild(previewEl);
  card.appendChild(fig);

  // Metadata & actions
  card.innerHTML += `
    <h3>${doc.title || "Untitled Document"}</h3>
    <menu class="doc-meta">
      <li><i class="fas fa-file"></i> ${doc.fileType || "Unknown"}</li>
      <li><i class="fas fa-eye"></i> ${doc.clicks || 0}</li>
      <li><i class="fas fa-tag"></i> ${doc.category || "Uncategorized"}</li>
    </menu>
    ${doc.institution ? `<p>${doc.institution}</p>` : ""}
    <menu class="doc-actions">
      <li>
        <button class="action-btn view-btn">
          <i class="fas fa-eye"></i> View
        </button>
      </li>
      <li>
        <button class="action-btn fav-btn ${
          doc.isFavorite ? "active" : ""
        }"
          aria-label="${
            doc.isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }">
          <i class="fas fa-star"></i>
        </button>
      </li>
      <li>
        <button class="action-btn share-btn">
          <i class="fas fa-share-alt"></i>
        </button>
      </li>
    </menu>
  `;

  // Favorite toggle
  const favBtn = card.querySelector(".fav-btn");
  favBtn.addEventListener("click", async e => {
    e.stopPropagation();
    userInteractions = await toggleFavorite(
      currentUserId,
      doc.id,
      !doc.isFavorite
    );
    renderAllSections();
  });

  // View inline
  const viewBtn = card.querySelector(".view-btn");
  viewBtn.addEventListener("click", async e => {
    e.stopPropagation();
    userInteractions = await recordView(currentUserId, doc.id);
    renderStats(userInteractions);
    openDocumentInline(doc);
  });

  // Share (if desired)
  const shareBtn = card.querySelector(".share-btn");
  shareBtn.addEventListener("click", async e => {
    e.stopPropagation();
    userInteractions = await recordShare(currentUserId, doc.id);
    renderStats(userInteractions);
  });

  return card;
}


// Replace these utility functions with API-based versions:

// OLD incrementViewCount → NEW recordViewAndRefresh
async function recordViewAndRefresh(docId) {
  try {
    // Record the view on both file and user via shared utils
    userInteractions = await recordView(currentUserId, docId);
    // Update stats after recording
    renderStats(userInteractions);
  } catch (error) {
    console.error("Error recording view:", error);
  }
}

// OLD openDocument → NEW openDocumentInline
function openDocumentInline(doc) {
  if (!dialog || !modalBody) return;
  modalBody.innerHTML = "";
  let viewer;
  switch (doc.fileType) {
    case "image":
      viewer = document.createElement("img");
      viewer.src = doc.downloadURL;
      break;
    case "audio":
      viewer = document.createElement("audio");
      viewer.controls = true;
      viewer.src = doc.downloadURL;
      break;
    case "video":
      viewer = document.createElement("video");
      viewer.controls = true;
      viewer.src = doc.downloadURL;
      break;
    default:
      viewer = document.createElement("embed");
      viewer.src = `${doc.downloadURL}#page=1&view=FitH`;
      viewer.type = "application/pdf";
      viewer.width = "100%";
      viewer.height = "600px";
  }
  modalBody.appendChild(viewer);
  dialog.showModal();
}

// renderDocuments remains unchanged
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

// OLD toggleFavorite → NEW toggleFavoriteAndRefresh
async function toggleFavoriteAndRefresh(docId, shouldFavorite) {
  try {
    userInteractions = await toggleFavorite(currentUserId, docId, shouldFavorite);
    // Refresh sections and stats
    renderAllSections();
    renderStats(userInteractions);
  } catch (error) {
    console.error("Error updating favorite:", error);
  }
}

// Render all document sections
async function renderAllSections() {
  try {
    // Re-fetch interactions so we’re always up-to-date
    userInteractions = await getUserInteractions(currentUserId);
  } catch (err) {
    console.error("Error loading user interactions in renderAllSections:", err);
  }

  // Mark favorites on each document
  loadedDocuments.forEach(d => {
    d.isFavorite = userInteractions.isFavorite?.includes(d.id);
  });

  // Suggestions: top 3 by your click history
  const mostClicked = Object.entries(userInteractions.clicks || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);
  const suggested = loadedDocuments.filter(d => mostClicked.includes(d.id));
  renderDocuments(".suggestions", suggested);

  // Favorites section
  const favorites = loadedDocuments.filter(d => d.isFavorite);
  renderDocuments(".favorites", favorites);

  // All documents grid (history page may show its own grid)
  renderAllDocuments();

  // Update the stat cards
  updateStats();
}

function showError(message) {
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
}

function updateStats() {
  const totalDocs    = loadedDocuments.length;
  const totalViews   = userInteractions.viewed?.length    || 0;
  const totalFav     = userInteractions.isFavorite?.length || 0;
  const totalShares  = userInteractions.shared?.length    || 0;

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

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
