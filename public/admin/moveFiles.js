// public/moveFiles.js

let fileToMove   = null;
let moveMode     = false;
let statusMsg    = null;

window.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM Loaded for File Mover");

  // Create a status message area
  statusMsg = document.createElement("div");
  statusMsg.id    = "moveStatus";
  statusMsg.className = "move-status";
  document
    .querySelector(".main-content")
    .appendChild(statusMsg);

  // Check for ?move=<docId>
  const moveId = new URLSearchParams(window.location.search).get("move");
  if (moveId) {
    activateMoveMode(moveId);
  }

  enhanceContentGrid();
});

/**
 * Fetches the file metadata via your API and enables move mode.
 */
async function activateMoveMode(docId) {
  try {
    // 🔄 CHANGED: Fetch single file via your API
    const res = await fetch(`http://localhost:4000/api/files/${docId}`);
    if (!res.ok) throw new Error("File not found");
    const fileData = await res.json();

    fileToMove = { id: docId, data: fileData };
    moveMode   = true;

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

/**
 * Performs the "move" by PATCHing the new directory to your API.
 */
async function moveFileHere() {
  if (!fileToMove) return;

  try {
    const newDir = getCurrentPath();
    // 🔄 CHANGED: Send PATCH to your API
    const res = await fetch(
      `http://localhost:4000/api/files/${fileToMove.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory: newDir,
          updatedAt: new Date().toISOString()
        })
      }
    );
    if (!res.ok) throw new Error("Move failed");

    showStatus("✅ File moved successfully!", "success");
    setTimeout(() => {
      window.location.href = "hierarcy.html";
    }, 1500);

  } catch (err) {
    console.error("Error moving file:", err);
    showStatus("❌ Failed to move file.", "error");
  }
}

function cancelMove() {
  window.location.href = "hierarcy.html";
}

/** Reads your breadcrumb to get the current path */
function getCurrentPath() {
  const segments = [];
  document
    .querySelectorAll("#path-navigation a, #path-navigation span:not(:first-child)")
    .forEach(el => {
      if (el.tagName === "A" || (el.tagName === "SPAN" && el.textContent !== "/")) {
        segments.push(el.textContent);
      }
    });
  const p = "/" + segments.join("/");
  return p === "/" ? "/" : p;
}

/** Adds a "Move" button to each file card */
function enhanceContentGrid() {
  const observer = new MutationObserver(mutations => {
    if (moveMode) return;
    addMoveButtonsToItems();
  });
  const contentGrid = document.getElementById("content-grid");
  observer.observe(contentGrid, { childList: true });
  addMoveButtonsToItems();
}

function addMoveButtonsToItems() {
  if (moveMode) return;

  document.querySelectorAll(".item-card").forEach(item => {
    const meta = item.querySelector(".item-meta");
    if (
      meta &&
      !meta.textContent.includes("Directory") &&
      !item.querySelector(".move-btn")
    ) {
      const firestoreId = item.getAttribute("data-id").replace("file_", "");
      const btn = document.createElement("button");
      btn.className   = "move-btn";
      btn.textContent = "Move";
      btn.addEventListener("click", e => {
        e.stopPropagation();
        window.location.href = `hierarcy.html?move=${firestoreId}`;
      });
      item.appendChild(btn);
    }
  });
}

/** Shows status messages in the banner area */
function showStatus(message, type = "info") {
  if (!statusMsg) return;
  statusMsg.textContent   = message;
  statusMsg.className     = `move-status ${type}`;
  statusMsg.style.display = "block";
  if (type === "info") {
    setTimeout(() => (statusMsg.style.display = "none"), 5000);
  }
}
