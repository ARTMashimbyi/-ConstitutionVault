// public/suggestions/history_home.js

import {
  API_BASE,
  getUserInteractions,
  recordView
} from "../shared/utils.js";

const currentUserId = localStorage.getItem("currentUserId");
const historyList   = document.getElementById("history");
const loader        = document.getElementById("loading-indicator");
const errorBox      = document.getElementById("error-container");
const dialog        = document.getElementById("viewer-dialog");
const modalBody     = dialog?.querySelector(".modal-body");
const closeBtn      = document.getElementById("modal-close");

// ────────────────────────────────────────────────────
// Initialization
// ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  try {
    showLoading(true);
    const ui = await getUserInteractions(currentUserId);
    renderStats(ui);
    await renderHistory(ui.viewed || []);
  } catch (err) {
    console.error("Initialization error:", err);
    showError("Failed to load history");
  } finally {
    showLoading(false);
  }
}

// ────────────────────────────────────────────────────
// Render “Recently Viewed”
// ────────────────────────────────────────────────────
async function renderHistory(viewedIds) {
  historyList.innerHTML = "";

  // Reverse‐chronological, take up to 5
  const recent = [...viewedIds].reverse().slice(0, 5);
  if (!recent.length) {
    historyList.innerHTML = "<li>No recently viewed files</li>";
    return;
  }

  for (const id of recent) {
    try {
      // Fetch metadata from your API
      const res  = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(res.statusText);
      const doc = await res.json();

      // Icon mapping
      const icons = {
        document: "📄",
        video:    "🎬",
        image:    "🖼️",
        audio:    "🔊",
        text:     "📝"
      };
      const icon = icons[doc.fileType] || "📄";

      // Build list item
      const li = document.createElement("li");
      li.className = "document-item";
      li.innerHTML = `
        <mark class="doc-badge">RECENT</mark>
        <span class="doc-icon">${icon}</span>
        <article class="doc-info">
          <h3 class="doc-title">${doc.title || "Untitled"}</h3>
          <aside class="doc-meta">${doc.fileType || "Unknown"}</aside>
        </article>
      `;
      // On click: record view + open inline
      li.addEventListener("click", async () => {
        try {
          await recordView(currentUserId, id);
        } catch(e) {
          console.error("Failed to record view:", e);
        }
        openDocumentInline(doc);
      });

      historyList.appendChild(li);
    } catch (e) {
      console.error(`Error loading file ${id}:`, e);
    }
  }
}

// ────────────────────────────────────────────────────
// Inline viewer modal
// ────────────────────────────────────────────────────
function openDocumentInline(doc) {
  if (!dialog || !modalBody) return;
  modalBody.innerHTML = ""; // clear previous
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
    case "document":
    default:
      // assume PDF
      viewer = document.createElement("embed");
      viewer.src = `${doc.downloadURL}#page=1&view=FitH`;
      viewer.type = "application/pdf";
      viewer.width = "100%";
      viewer.height = "600px";
  }

  modalBody.appendChild(viewer);
  dialog.showModal();
}

// Close modal
if (closeBtn && dialog) {
  closeBtn.addEventListener("click", () => dialog.close());
}

// ────────────────────────────────────────────────────
// Helpers for loading/error/stats
// ────────────────────────────────────────────────────
function showLoading(on) {
  if (loader) loader.style.display = on ? "block" : "none";
}

function showError(msg) {
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }
}

function renderStats(ui) {
  // Example: update “Viewed” stat card
  const totalViewed = (ui.viewed || []).length;
  document.querySelectorAll(".stat-card").forEach(card => {
    const label = card.querySelector(".stat-label")?.textContent;
    const value = card.querySelector(".stat-value");
    if (!value) return;
    if (label === "Viewed") {
      value.textContent = totalViewed;
    }
    // (You can also fill Favorites / Shared here if desired)
  });
}
