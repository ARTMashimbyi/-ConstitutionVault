// public/admin/admin-add.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Grab form elements
const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");
const directoryInput = document.getElementById("directory");
const dateInput = document.getElementById("date");
const fileTypeSelect = document.getElementById("fileType");

const fileContainer = document.getElementById("fileContainer");
const fileInput = document.getElementById("file");
const textContainer = document.getElementById("textContainer");
const textContent = document.getElementById("textContent");

const authorContainer = document.getElementById("authorContainer");
const categoryContainer = document.getElementById("categoryContainer");
const keywordsContainer = document.getElementById("keywordsContainer");

// Map fileType → accept attribute
const fileTypeAccepts = {
  document: ".pdf,.doc,.docx,.txt,.rtf",
  video: ".mp4,.mov,.avi,.webm",
  image: ".jpg,.jpeg,.png,.gif,.svg",
  audio: ".mp3,.wav,.ogg,.m4a",
};

// Autofill today’s date
dateInput.value = new Date().toISOString().split("T")[0];

// On DOM ready: prefill directory from query and handle fileType logic
document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
  handleFileTypeChange();
});

// Show/hide fields on fileType change
fileTypeSelect.addEventListener("change", handleFileTypeChange);

function handleFileTypeChange() {
  const type = fileTypeSelect.value;

  const isText = type === "text";
  fileContainer.hidden = isText;
  textContainer.hidden = !isText;
  fileInput.required = !isText;
  textContent.required = isText;

  if (!isText && fileTypeAccepts[type]) {
    fileInput.setAttribute("accept", fileTypeAccepts[type]);
  } else {
    fileInput.removeAttribute("accept");
  }

  const showMeta = type === "text" || type === "document";
  authorContainer.hidden = !showMeta;
  categoryContainer.hidden = !showMeta;
  keywordsContainer.hidden = !showMeta;
}

// Upload handler
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const fileType = formData.get("fileType");

  // Validation
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

  // Normalize directory path
  const dir = (formData.get("directory") || "").trim().replace(/^\/|\/$/g, "");

  // Prepare metadata
  const metadata = {
    fileType: fileType,
    title: formData.get("title"),
    date: formData.get("date"),
    institution: formData.get("institution"),
    author: formData.get("author"),
    category: formData.get("category"),
    keywords: (formData.get("keywords") || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    directory: dir,
    textContent: fileType === "text" ? formData.get("textContent") : "",
    clicks: 0,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    downloadURL: "",
    storagePath: "",
  };

  try {
    if (fileType !== "text") {
      // Upload file
      const file = formData.get("file");
      const filePath = `${dir ? dir + "/" : ""}${file.name}`;
      const fileRef = storageRef(storage, filePath);

      await new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => resolve()
        );
      });

      // Build the correct public URL
      const bucketName = firebaseConfig.storageBucket;
      const encodedPath = encodeURIComponent(filePath);
      metadata.downloadURL = `https://storage.googleapis.com/${bucketName}/${encodedPath}`;
      metadata.storagePath = filePath;
    } else {
      // No file upload, so clear URLs
      metadata.downloadURL = "";
      metadata.storagePath = "";
    }

    // Save metadata doc to 'constitutionalDocuments' collection
    await addDoc(collection(db, "constitutionalDocuments"), metadata);

    showSuccess("Uploaded! Redirecting…");
    setTimeout(() => (window.location.href = "hierarcy.html"), 1200);
  } catch (err) {
    console.error("Upload failed:", err);
    showError(`Upload failed: ${err.message}`);
  }
});

// Helpers for status messages
function showError(msg) {
  uploadStatus.style.color = "red";
  uploadStatus.textContent = `⚠️ ${msg}`;
  uploadStatus.style.display = "block";
}

function showSuccess(msg) {
  uploadStatus.style.color = "green";
  uploadStatus.textContent = `✅ ${msg}`;
  uploadStatus.style.display = "block";
}

// Export or expose
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showError,
    showSuccess,
    handleFileTypeChange,
  };
} else {
  window.showError = showError;
  window.showSuccess = showSuccess;
  window.handleFileTypeChange = handleFileTypeChange;
}
