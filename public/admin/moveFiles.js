// public/moveFiles.js

const hostname = window.location.hostname;
const API_BASE =
  hostname === "localhost" || hostname.startsWith("127.0.0.1")
    ? "http://localhost:4000/api"
    : "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api";



let fileToMove = null;
let moveMode = false;

/**
 * Normalize paths: leading slash, no trailing slash (except "/").
 */
function normalizePath(p) {
  if (!p) return '/';
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Get current directory path from breadcrumb.
 */
function getCurrentPath() {
  const crumbs = document.querySelectorAll("#path-navigation [data-path]");
  if (!crumbs.length) return '/';
  // The last crumb is always the current directory
  return normalizePath(crumbs[crumbs.length - 1].getAttribute("data-path"));
}

/**
 * Show status message in a banner.
 */
function showStatus(msg, type = "info") {
  let status = document.getElementById("moveStatus");
  if (!status) {
    status = document.createElement("section");
    status.id = "moveStatus";
    status.className = "move-status";
    document.querySelector(".main-content").prepend(status);
  }
  status.textContent = msg;
  status.className = `move-status ${type}`;
  status.style.display = "block";
  if (type === "success" || type === "info") {
    setTimeout(() => (status.style.display = "none"), 1500);
  }
}

/**
 * Activate move mode for a given file ID.
 */
async function activateMoveMode(docId) {
  moveMode = true;
  // Fetch file metadata
  let fileData;
  try {
    const res = await fetch(`${API_BASE}/files/${docId}`);
    if (!res.ok) throw new Error("File not found");
    fileData = await res.json();
  } catch (err) {
    showStatus("❌ Failed to load file data.", "error");
    return;
  }
  fileToMove = { id: docId, data: fileData };

  // Render move banner at the top
  let moveBanner = document.getElementById("moveBanner");
  if (!moveBanner) {
    moveBanner = document.createElement("section");
    moveBanner.id = "moveBanner";
    moveBanner.className = "move-banner";
    document.querySelector(".main-content").prepend(moveBanner);
  }
  moveBanner.innerHTML = `
    <p>Moving file: <strong>${fileToMove.data.title || fileToMove.data.name || fileToMove.id}</strong></p>
    <p>Select a destination folder and click "Move Here"</p>
    <section class="move-actions">
      <button id="moveHereBtn" class="btn move-here-btn">Move Here</button>
      <button id="cancelMoveBtn" class="btn cancel-move-btn">Cancel</button>
    </section>
  `;
  moveBanner.style.display = "block";

  // Disable upload and new dir while moving
  document.getElementById("upload-btn")?.setAttribute("disabled", "true");
  document.getElementById("new-dir-btn")?.setAttribute("disabled", "true");

  // Wire up buttons
  document.getElementById("moveHereBtn").onclick = moveFileHere;
  document.getElementById("cancelMoveBtn").onclick = () => window.location.href = "./hierarcy.html";

  // Remove all Move buttons from file cards to avoid confusion
  document.querySelectorAll(".move-btn").forEach(btn => btn.remove());

  showStatus(`Select destination folder for "${fileToMove.data.title}"`, "info");
}

/**
 * Actually perform the move.
 */
async function moveFileHere() {
  if (!fileToMove) return;

  try {
    // Always use the last breadcrumb's data-path as the current folder
    const nav = document.getElementById("path-navigation");
    let newDir = "/";
    if (nav) {
      const crumbs = Array.from(nav.querySelectorAll("[data-path]"));
      if (crumbs.length) {
        // Find the last breadcrumb with data-path
        newDir = crumbs[crumbs.length - 1].getAttribute('data-path') || "/";
      }
    }
    newDir = normalizePath(newDir);

    // DEBUG
    alert(`(Debug) About to move to: "${newDir}"`);

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
    }, 800);

  } catch (err) {
    console.error("Error moving file:", err);
    showStatus("❌ Failed to move file.", "error");
  }
}



/**
 * Add "Move" buttons to all file cards (not directories).
 */
function addMoveButtons() {
  if (moveMode) return; // Don't show move buttons in move mode
  document.querySelectorAll(".item-card").forEach(item => {
    const isDir = item.querySelector(".item-meta")?.textContent.includes("Directory");
    if (isDir || item.querySelector(".move-btn")) return;

    const firestoreId = item.getAttribute("data-id")?.replace("file_", "");
    if (!firestoreId) return;

    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.textContent = "Move";
    btn.onclick = (e) => {
      e.stopPropagation();
      window.location.href = `./hierarcy.html?move=${firestoreId}`;
    };
    item.appendChild(btn);
  });
}

/**
 * On DOM ready, add move buttons, activate move if needed.
 */
window.addEventListener("DOMContentLoaded", () => {
  // If URL has ?move=ID, activate move mode for that file
  const moveId = new URLSearchParams(window.location.search).get("move");
  if (moveId) activateMoveMode(moveId);

  // Observe content grid for file card changes and (re)add move buttons as needed
  const contentGrid = document.getElementById("content-grid");
  if (contentGrid) {
    const observer = new MutationObserver(addMoveButtons);
    observer.observe(contentGrid, { childList: true });
    addMoveButtons();
  }
});
