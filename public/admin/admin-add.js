// public/admin/admin-add.js

const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";


// Grab all the form fields & containers
const uploadForm       = document.getElementById("uploadForm");
const uploadStatus     = document.getElementById("uploadStatus");
const directoryInput   = document.getElementById("directory");
const dateInput        = document.getElementById("date");
const fileTypeSelect   = document.getElementById("fileType");

const fileContainer    = document.getElementById("fileContainer");
const fileInput        = document.getElementById("file");
const textContainer    = document.getElementById("textContainer");
const textContent      = document.getElementById("textContent");

const authorContainer   = document.getElementById("authorContainer");
const categoryContainer = document.getElementById("categoryContainer");
const keywordsContainer = document.getElementById("keywordsContainer");

// Map fileType → accept attribute
const fileTypeAccepts = {
  document: ".pdf,.doc,.docx,.txt,.rtf",
  video:    ".mp4,.mov,.avi,.webm",
  image:    ".jpg,.jpeg,.png,.gif,.svg",
  audio:    ".mp3,.wav,.ogg,.m4a"
};

// 1) Auto-fill today’s date
dateInput.value = new Date().toISOString().split("T")[0];

// 2) On DOM ready: prefill directory from query and apply fileType logic
document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
  handleFileTypeChange();
});

// 3) Show/hide fields when fileType changes
fileTypeSelect.addEventListener("change", handleFileTypeChange);

function handleFileTypeChange() {
  const type = fileTypeSelect.value;

  // Toggle between file input and text input
  const isText = type === "text";
  fileContainer.hidden    = isText;
  textContainer.hidden    = !isText;
  fileInput.required      = !isText;
  textContent.required    = isText;

  // Apply accept filter to file input if applicable
  if (!isText && fileTypeAccepts[type]) {
    fileInput.setAttribute("accept", fileTypeAccepts[type]);
  } else {
    fileInput.removeAttribute("accept");
  }

  // Show metadata only for text and document
  const showMeta = type === "text" || type === "document";
  authorContainer.hidden   = !showMeta;
  categoryContainer.hidden = !showMeta;
  keywordsContainer.hidden = !showMeta;
}

// 4) On submit → send to backend
uploadForm.addEventListener("submit", async e => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const fileType = formData.get("fileType");

  // Basic validation
  if (fileType === "text") {
    if (!formData.get("textContent")?.trim()) {
      return showError("Please enter text content.");
    }
  } else {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return showError("Please select a file to upload.");
    }
  }

  // Normalize directory
  const dir = (formData.get("directory") || "/").trim().replace(/^\/|\/$/g, "");

  // Build metadata object
  const metadata = {
    fileType:    fileType,
    title:       formData.get("title"),
    date:        formData.get("date"),
    institution: formData.get("institution"),
    author:      formData.get("author"),
    category:    formData.get("category"),
    keywords:    (formData.get("keywords") || "")
                  .split(",")
                  .map(k => k.trim())
                  .filter(k => k),
    directory:   dir,
    textContent: fileType === "text" ? formData.get("textContent") : ""
  };

  try {
    // Package and send form data
    const payload = new FormData();
    payload.append("metadata", JSON.stringify(metadata));
    if (fileType !== "text") {
      payload.append("file", formData.get("file"));
    }

    // <-- UPDATED to use API_BASE!
    const res = await fetch(`${API_BASE}/files`, {
      method: "POST",
      body: payload
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || res.statusText);
    }

    showSuccess("Uploaded! Redirecting…");
    setTimeout(() => (window.location.href = "hierarcy.html"), 1200);
  } catch (err) {
    console.error("Upload failed:", err);
    showError(`Upload failed: ${err.message}`);
  }
});

// Status helpers
function showError(msg) {
  uploadStatus.style.color   = "red";
  uploadStatus.textContent   = `⚠️ ${msg}`;
  uploadStatus.style.display = "block";
}

function showSuccess(msg) {
  uploadStatus.style.color   = "green";
  uploadStatus.textContent   = `✅ ${msg}`;
  uploadStatus.style.display = "block";
}

if (typeof module !== 'undefined' && module.exports) {
  // Export for tests
  module.exports = {
    showError,
    showSuccess,
    handleFileTypeChange
  };
} else {
  // Expose to window in browser
  window.showError = showError;
  window.showSuccess = showSuccess;
  window.handleFileTypeChange = handleFileTypeChange;
}
