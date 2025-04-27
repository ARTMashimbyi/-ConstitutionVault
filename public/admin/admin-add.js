// public/admin-add.js

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
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// ——— Your Firebase config stays the same ———
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);

// Grab form elements
const uploadForm     = document.getElementById("uploadForm");
const uploadStatus   = document.getElementById("uploadStatus");
const directoryInput = document.getElementById("directory");
const dateInput      = document.getElementById("date");

// Auto‑fill today’s date
dateInput.value = new Date().toISOString().split("T")[0];

// Prefill directory from URL if present
document.addEventListener("DOMContentLoaded", () => {
  const dir = new URLSearchParams(window.location.search).get("directory");
  if (dir) directoryInput.value = dir;
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData      = new FormData(uploadForm);
  const directoryPath = formData.get("directory") || "/";
  const fileField     = document.getElementById("document");
  const file          = fileField.files[0];

  // Must pick a file
  if (!file) {
    uploadStatus.style.display = "block";
    uploadStatus.style.color   = "red";
    uploadStatus.textContent   = "⚠️ Please choose a file first.";
    return;
  }

  try {
    // ——— 1) Ensure directory exists in Firestore ———
    const dirsSnap = await getDocs(
      query(collection(db, "directories"), where("path", "==", directoryPath))
    );
    if (dirsSnap.empty && directoryPath !== "/") {
      let current = "";
      for (const seg of directoryPath.split("/").filter(Boolean)) {
        current += `/${seg}`;
        const segSnap = await getDocs(
          query(collection(db, "directories"), where("path", "==", current))
        );
        if (segSnap.empty) {
          await addDoc(collection(db, "directories"), {
            name: seg,
            path: current,
            description: "",
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // ——— 2) Upload blob to Cloud Storage ———
    // give each file a unique name
    const uniqueName = `${Date.now()}_${file.name}`;
    // e.g. "Ghana/1992/Fonds A/Series 1/1612345678900_mydoc.pdf"
    const fullPath   = `${directoryPath}/${uniqueName}`.replace(/^\/+/, "");
    const fRef       = storageRef(storage, fullPath);
    const uploadTask = uploadBytesResumable(fRef, file);

    // await completion
    await new Promise((resolve, reject) =>
      uploadTask.on(
        "state_changed",
        null,
        (err) => reject(err),
        () => resolve()
      )
    );

    // ——— 3) Grab the public download URL ———
    const downloadURL = await getDownloadURL(fRef);

    // ——— 4) Write Firestore metadata (including storagePath & URL) ———
    const metadata = {
      fileType:    formData.get("fileType"),
      title:       formData.get("title"),
      date:        formData.get("date"),
      institution: formData.get("institution"),
      author:      formData.get("author"),
      category:    formData.get("category"),
      keywords:    formData
                      .get("keywords")
                      .split(",")
                      .map((kw) => kw.trim())
                      .filter(Boolean),
      directory:   directoryPath,
      storagePath: fullPath,
      downloadURL,
      uploadedAt:  new Date().toISOString()
    };
    await addDoc(collection(db, "constitutionalDocuments"), metadata);

    // ——— success! ———
    uploadStatus.style.display   = "block";
    uploadStatus.style.color     = "green";
    uploadStatus.textContent     = "✅ Uploaded! Redirecting…";
    setTimeout(() => {
      window.location.href = "hierarcy.html";
    }, 1500);

  } catch (err) {
    console.error("Upload failed:", err);
    uploadStatus.style.display = "block";
    uploadStatus.style.color   = "red";
    uploadStatus.textContent   = "❌ Upload failed. Check console.";
  }
});
