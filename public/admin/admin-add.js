// public/admin/admin-add.js

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

// 2) On DOM ready: pick up ?directory=… and wire fileType changes
document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
  handleFileTypeChange();
});

// 3) Show/hide fields when fileType changes
fileTypeSelect.addEventListener("change", handleFileTypeChange);
function handleFileTypeChange() {
  const t = fileTypeSelect.value;

  // text vs file upload
  if (t === "text") {
    fileContainer.hidden = true;
    textContainer.hidden = false;
    fileInput.required   = false;
    textContent.required = true;
  } else {
    fileContainer.hidden = false;
    textContainer.hidden = true;
    fileInput.required   = true;
    textContent.required = false;
    // apply accept filter
    if (fileTypeAccepts[t]) {
      fileInput.setAttribute("accept", fileTypeAccepts[t]);
    } else {
      fileInput.removeAttribute("accept");
    }
  }

  // Only documents & text show author/category/keywords
  const isDocLike = (t === "document" || t === "text");
  authorContainer.hidden   = !isDocLike;
  categoryContainer.hidden = !isDocLike;
  keywordsContainer.hidden = !isDocLike;
}

// 4) On submit → POST to your API
uploadForm.addEventListener("submit", async e => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const fileType = formData.get("fileType");

  // Validate presence
  if (fileType === "text") {
    if (!formData.get("textContent")?.trim()) {
      return showError("Please enter text content.");
    }
  } else {
    const f = formData.get("file");
    if (!(f instanceof File) || f.size === 0) {
      return showError("Please select a file to upload.");
    }
  }

  // Normalize directory (no leading/trailing slash)
  let dir = (formData.get("directory") || "/").trim().replace(/^\/|\/$/g, "");

  // Build metadata object
  const metadata = {
    fileType:   formData.get("fileType"),
    title:      formData.get("title"),
    date:       formData.get("date"),
    institution: formData.get("institution"),
    author:     formData.get("author"),
    category:   formData.get("category"),
    keywords:   formData.get("keywords")
                     ?.split(",")
                     .map(kw => kw.trim())
                     .filter(kw => kw) || [],
    directory:  dir,
    textContent:
      fileType === "text"
        ? formData.get("textContent")
        : ""
  };

  try {
    // Package into multipart/form-data
    const payload = new FormData();
    payload.append("metadata", JSON.stringify(metadata));
    if (fileType !== "text") {
      payload.append("file", formData.get("file"));
    }

    const res = await fetch("http://localhost:4000/api/files", {
      method: "POST",
      body: payload
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>null);
      throw new Error(err?.error || res.statusText);
    }

    // On success, show message then redirect
    showSuccess("Uploaded! Redirecting…");
    setTimeout(() => window.location.href = "hierarcy.html", 1200);

  } catch (err) {
    console.error("Upload failed:", err);
    showError(`Upload failed: ${err.message}`);
  }
});

// Helpers to show status
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