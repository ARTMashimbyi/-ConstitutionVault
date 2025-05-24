// public/moveFiles.js

// ─── CONFIG ────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:4000/api';

// ─── STATE ─────────────────────────────────────────────────────────────
let fileToMove   = null;
let moveMode     = false;
let statusMsg    = null;

// ─── ONLOAD ────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM Loaded for File Mover");

  // create a status message container
  statusMsg = document.createElement("div");
  statusMsg.id    = "moveStatus";
  statusMsg.className = "move-status";
  document
    .querySelector(".main-content")
    .appendChild(statusMsg);

  // check for ?move=<docId>
  const moveId = new URLSearchParams(window.location.search).get("move");
  if (moveId) {
    activateMoveMode(moveId);
  }

  enhanceContentGrid();
});

// ─── ACTIVATE MOVE MODE ─────────────────────────────────────────────────
async function activateMoveMode(docId) {
  try {
    const res = await fetch(`${API_BASE}/files/${docId}`);
    if (!res.ok) throw new Error(`File ${docId} not found`);
    const fileData = await res.json();

    fileToMove = { id: docId, data: fileData };
    moveMode   = true;

    // render move banner
    const container = document.getElementById("directory-container");
    container.innerHTML = `
      <div class="move-banner">
        <p>Moving file: <strong>${fileToMove.data.title}</strong></p>
        <p>Select a destination folder and click "Move Here"</p>
        <div class="move-actions">
          <button id="moveHereBtn" class="btn move-here-btn">Move Here</button>
          <button id="cancelMoveBtn" class="btn cancel-move-btn">Cancel</button>
        </div>
      </div>
    `;

    document
      .getElementById("moveHereBtn")
      .addEventListener("click", moveFileHere);
    document
      .getElementById("cancelMoveBtn")
      .addEventListener("click", cancelMove);

    // disable upload while moving
    const uploadBtn = document.getElementById("upload-btn");
    if (uploadBtn) uploadBtn.disabled = true;

    showStatus(
      `Select destination folder for "${fileToMove.data.title}"`,
      "info"
    );
  } catch (err) {
    console.error("Error activating move mode:", err);
    showStatus("❌ Failed to load file data.", "error");
  }
}

// ─── PERFORM THE MOVE ───────────────────────────────────────────────────
async function moveFileHere() {
  if (!fileToMove) return;

  try {
    const newDir = getCurrentPath();
    const res = await fetch(
      `${API_BASE}/files/${fileToMove.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory: newDir,
          updatedAt: new Date().toISOString()
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Move failed: ${res.status} ${errText}`);
    }

    showStatus("✅ File moved successfully!", "success");
    setTimeout(() => {
      window.location.href = "./hierarcy.html";
    }, 1200);

  } catch (err) {
    console.error("Error moving file:", err);
    showStatus("❌ Failed to move file.", "error");
  }
}

// ─── CANCEL ─────────────────────────────────────────────────────────────
function cancelMove() {
  window.location.href = "./hierarcy.html";
}

// ─── BREADCRUMB → PATH ──────────────────────────────────────────────────
function getCurrentPath() {
  const segments = [];
  document
    .querySelectorAll("#path-navigation a, #path-navigation span:not(:first-child)")
    .forEach(el => {
      const txt = el.textContent.trim();
      if (txt && txt !== "/") segments.push(txt);
    });
  const p = "/" + segments.join("/");
  return p === "/" ? "/" : p;
}

// ─── ADD MOVE BUTTONS ───────────────────────────────────────────────────
function enhanceContentGrid() {
  const observer = new MutationObserver(() => {
    if (!moveMode) addMoveButtonsToItems();
  });
  const contentGrid = document.getElementById("content-grid");
  observer.observe(contentGrid, { childList: true });
  addMoveButtonsToItems();
}

function addMoveButtonsToItems() {
  if (moveMode) return;

  document.querySelectorAll(".item-card").forEach(item => {
    // skip directories and already-processed cards
    const isDir = item.querySelector(".item-meta")?.textContent.includes("Directory");
    if (isDir || item.querySelector(".move-btn")) return;

    // wire up move button
    const firestoreId = item.getAttribute("data-id")?.replace("file_", "");
    if (!firestoreId) return;

    const btn = document.createElement("button");
    btn.className   = "move-btn";
    btn.textContent = "Move";
    btn.addEventListener("click", e => {
      e.stopPropagation();
      window.location.href = `./hierarcy.html?move=${firestoreId}`;
    });

    item.appendChild(btn);
  });
}

// ─── STATUS DISPLAY ─────────────────────────────────────────────────────
function showStatus(message, type = "info") {
  if (!statusMsg) return;
  statusMsg.textContent   = message;
  statusMsg.className     = `move-status ${type}`;
  statusMsg.style.display = "block";
  if (type === "info") {
    setTimeout(() => (statusMsg.style.display = "none"), 4000);
  }
}
