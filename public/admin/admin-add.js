// public/admin/admin-add.js

// ── Removed Firebase client SDK imports; we no longer talk to Firebase directly 🔄
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
// import { getFirestore, collection, addDoc, getDocs, query, where }
//   from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL }
//   from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// ── Everything above is gone; instead we just use fetch() to our own API

const uploadForm       = document.getElementById("uploadForm");
const uploadStatus     = document.getElementById("uploadStatus");
const directoryInput   = document.getElementById("directory");
const dateInput        = document.getElementById("date");
const fileTypeSelect   = document.getElementById("fileType");
const fileInput        = document.getElementById("file");
const fileLabel        = document.getElementById("fileLabel");
const textContent      = document.getElementById("textContent");
const textContentLabel = document.getElementById("textContentLabel");

const fileTypeAccepts = {
  document: ".pdf,.doc,.docx,.txt,.rtf",
  video:    ".mp4,.mov,.avi,.webm",
  image:    ".jpg,.jpeg,.png,.gif,.svg",
  audio:    ".mp3,.wav,.ogg,.m4a"
};

// Auto-fill today's date
const today      = new Date();
dateInput.value = today.toISOString().split("T")[0];

// On load, pick up ?directory=foo from the URL
document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
  handleFileTypeChange();
});

fileTypeSelect.addEventListener("change", handleFileTypeChange);

function handleFileTypeChange() {
  const selected = fileTypeSelect.value;
  if (selected === "text") {
    fileInput.style.display        = "none";
    fileLabel.style.display        = "none";
    textContent.style.display      = "block";
    textContentLabel.style.display = "block";
    fileInput.required             = false;
    textContent.required           = true;
  } else {
    fileInput.style.display        = "block";
    fileLabel.style.display        = "block";
    textContent.style.display      = "none";
    textContentLabel.style.display = "none";
    fileInput.required             = true;
    textContent.required           = false;
    if (fileTypeAccepts[selected]) {
      fileInput.setAttribute("accept", fileTypeAccepts[selected]);
    } else {
      fileInput.removeAttribute("accept");
    }
  }
}

uploadForm.addEventListener("submit", async e => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const fileType = formData.get("fileType");

  // Validate text vs file
  if (fileType === "text") {
    const text = formData.get("textContent");
    if (!text?.trim()) {
      uploadStatus.style.color   = "red";
      uploadStatus.textContent   = "⚠️ Please enter text content.";
      uploadStatus.style.display = "block";
      return;
    }
  } else {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      uploadStatus.style.color   = "red";
      uploadStatus.textContent   = "⚠️ Please select a file.";
      uploadStatus.style.display = "block";
      return;
    }
  }

  // Normalize directory
  let dir = (formData.get("directory") || "/").trim();
  dir     = dir.replace(/^\/|\/$/g, "");

  try {
    // Build metadata payload
    const metadata = {
      fileType:  formData.get("fileType"),
      title:     formData.get("title"),
      date:      formData.get("date"),
      institution: formData.get("institution"),
      author:    formData.get("author"),
      category:  formData.get("category"),
      keywords:  formData.get("keywords")
                    ?.split(",")
                    .map(kw => kw.trim()) || [],
      directory: dir,
      // textContent only if text
      textContent: formData.get("textContent") || ""
    };

    // Build request body
    const payload = new FormData();
    payload.append("metadata", JSON.stringify(metadata));
    if (fileType !== "text") {
      payload.append("file", formData.get("file")); // Multer will pick this up
    }

    // 🔄 CHANGED: send to our Express API instead of Firebase client SDK
    const response = await fetch("http://localhost:4000/api/files", {
      method: "POST",
      body: payload
    });

    if (!response.ok) {
      throw new Error((await response.json()).error || response.statusText);
    }

    const { downloadURL } = await response.json();

    uploadStatus.style.color   = "green";
    uploadStatus.textContent   = "✅ Uploaded successfully! Redirecting…";
    uploadStatus.style.display = "block";

    setTimeout(() => {
      window.location.href = "hierarcy.html";
    }, 1500);

  } catch (err) {
    console.error("Upload failed:", err);
    uploadStatus.style.color   = "red";
    uploadStatus.textContent   = `❌ Upload failed: ${err.message}`;
    uploadStatus.style.display = "block";
  }
});
