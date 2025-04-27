// public/admin/admin-add.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getStorage,
  ref   as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// ── Your Firebase web app config (ensure storageBucket matches your console) ──
const firebaseConfig = {
  apiKey:            "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:        "constitutionvault-1b5d1.firebaseapp.com",
  projectId:         "constitutionvault-1b5d1",
  storageBucket:     "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId:             "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:     "G-YJEYZ85T3S"
};

// Initialize Firebase, Firestore & Storage
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);

// Grab your form elements
const uploadForm     = document.getElementById("uploadForm");
const uploadStatus   = document.getElementById("uploadStatus");
const directoryInput = document.getElementById("directory");
const dateInput      = document.getElementById("date");

// Prefill today's date
const today         = new Date();
dateInput.value     = today.toISOString().split("T")[0];

// If ?directory=foo/bar in URL, populate that field
document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const file     = formData.get("file");

  // Ensure a file was chosen
  if (!(file instanceof File)) {
    uploadStatus.style.color = "red";
    uploadStatus.textContent = "⚠️ Please select a file.";
    uploadStatus.style.display = "block";
    return;
  }

  // Normalize directory path (no leading/trailing slash)
  let dir = (formData.get("directory") || "/").trim();
  dir     = dir.replace(/^\/|\/$/g, ""); // e.g. "" or "sub/folder"

  // Build storage path: either "filename.ext" or "sub/folder/filename.ext"
  const storagePath = dir
    ? `${dir}/${file.name}`
    : file.name;

  try {
    // 1) Ensure your 'directories' collection contains each segment
    if (dir && dir !== "") {
      const segments = dir.split("/");
      let current   = "";
      for (const seg of segments) {
        current = current ? `${current}/${seg}` : seg;
        const dirQuery = await getDocs(
          query(collection(db, "directories"), where("path", "==", current))
        );
        if (dirQuery.empty) {
          await addDoc(collection(db, "directories"), {
            name:      seg,
            path:      current,
            description: "",
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // 2) Upload the file to Storage
    const fileRef = storageRef(storage, storagePath);
    const snap    = await uploadBytes(fileRef, file);

    // 3) Grab a download URL
    const downloadURL = await getDownloadURL(snap.ref);

    // 4) Compose metadata for Firestore
    const metadata = {
      fileType:    formData.get("fileType"),
      title:       formData.get("title"),
      date:        formData.get("date"),
      institution: formData.get("institution"),
      author:      formData.get("author"),
      category:    formData.get("category"),
      keywords:    formData.get("keywords")
                      ?.split(",")
                      .map(kw => kw.trim()) || [],
      directory:   formData.get("directory"),
      storagePath,    // for dynamic lookups if needed
      downloadURL,    // for direct viewing/downloads
      uploadedAt:  new Date().toISOString()
    };

    // 5) Write to your 'constitutionalDocuments' collection
    await addDoc(collection(db, "constitutionalDocuments"), metadata);

    // 6) Notify + redirect
    uploadStatus.style.color = "green";
    uploadStatus.textContent = "✅ Uploaded successfully! Redirecting…";
    uploadStatus.style.display = "block";
    setTimeout(() => {
      window.location.href = "hierarchy.html";
    }, 1500);

  } catch (err) {
    console.error("Upload failed:", err);
    uploadStatus.style.color = "red";
    uploadStatus.textContent = "❌ Upload failed. Please try again.";
    uploadStatus.style.display = "block";
  }
});
