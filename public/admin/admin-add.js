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
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.appspot.com",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");
const directoryInput = document.getElementById("directory");
const dateInput = document.getElementById("date");
const fileTypeSelect = document.getElementById("fileType");
const fileInput = document.getElementById("file");
const fileLabel = document.getElementById("fileLabel");
const textContent = document.getElementById("textContent");
const textContentLabel = document.getElementById("textContentLabel");

const fileTypeAccepts = {
  document: ".pdf,.doc,.docx,.txt,.rtf",
  video: ".mp4,.mov,.avi,.webm",
  image: ".jpg,.jpeg,.png,.gif,.svg",
  audio: ".mp3,.wav,.ogg,.m4a"
};

const today = new Date();
dateInput.value = today.toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", () => {
  const dirParam = new URLSearchParams(window.location.search).get("directory");
  if (dirParam) directoryInput.value = dirParam;
  handleFileTypeChange();
});

fileTypeSelect.addEventListener("change", handleFileTypeChange);

function handleFileTypeChange() {
  const selectedType = fileTypeSelect.value;

  if (selectedType === "text") {
    fileInput.style.display = "none";
    fileLabel.style.display = "none";
    textContent.style.display = "block";
    textContentLabel.style.display = "block";
    fileInput.required = false;
    textContent.required = true;
  } else {
    fileInput.style.display = "block";
    fileLabel.style.display = "block";
    textContent.style.display = "none";
    textContentLabel.style.display = "none";
    fileInput.required = true;
    textContent.required = false;

    if (fileTypeAccepts[selectedType]) {
      fileInput.setAttribute("accept", fileTypeAccepts[selectedType]);
    } else {
      fileInput.removeAttribute("accept");
    }
  }
}

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  uploadStatus.style.display = "none";

  const formData = new FormData(uploadForm);
  const fileType = formData.get("fileType");

  if (fileType === "text") {
    const text = formData.get("textContent");
    if (!text || text.trim() === "") {
      uploadStatus.style.color = "red";
      uploadStatus.textContent = "⚠️ Please enter text content.";
      uploadStatus.style.display = "block";
      return;
    }
  } else {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      uploadStatus.style.color = "red";
      uploadStatus.textContent = "⚠️ Please select a file.";
      uploadStatus.style.display = "block";
      return;
    }
  }

  let dir = (formData.get("directory") || "/").trim();
  dir = dir.replace(/^\/|\/$/g, "");

  try {
    let downloadURL = "";
    let storagePath = "";

    if (fileType === "text") {
      const textContent = formData.get("textContent");
      const safeTitle = formData.get("title").replace(/[^\w\-]/g, "_");
      const fileName = `${safeTitle}_${Date.now()}.txt`;
      const blob = new Blob([textContent], { type: "text/plain" });
      storagePath = dir ? `${dir}/${fileName}` : fileName;
      const fileRef = storageRef(storage, storagePath);
      const snap = await uploadBytes(fileRef, blob);
      downloadURL = await getDownloadURL(snap.ref);
    } else {
      const file = formData.get("file");
      storagePath = dir ? `${dir}/${file.name}` : file.name;
      const fileRef = storageRef(storage, storagePath);
      const snap = await uploadBytes(fileRef, file);
      downloadURL = await getDownloadURL(snap.ref);
    }

    if (dir && dir !== "") {
      const segments = dir.split("/");
      let current = "";
      for (const seg of segments) {
        current = current ? `${current}/${seg}` : seg;
        const dirQuery = await getDocs(
          query(collection(db, "directories"), where("path", "==", current))
        );
        if (dirQuery.empty) {
          await addDoc(collection(db, "directories"), {
            name: seg,
            path: current,
            description: "",
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    const metadata = {
      fileType: formData.get("fileType"),
      title: formData.get("title"),
      date: formData.get("date"),
      institution: formData.get("institution"),
      author: formData.get("author"),
      category: formData.get("category"),
      keywords: formData.get("keywords")
        ?.split(",")
        .map(kw => kw.trim()) || [],
      directory: formData.get("directory"),
      storagePath,
      downloadURL,
      uploadedAt: new Date().toISOString(),
      clicks : 0
    };

    if (fileType === "text") {
      metadata.textContent = formData.get("textContent");
    }

    await addDoc(collection(db, "constitutionalDocuments"), metadata);

    uploadStatus.style.color = "green";
    uploadStatus.textContent = "✅ Uploaded successfully! Redirecting…";
    uploadStatus.style.display = "block";
    setTimeout(() => {
      window.location.href = "hierarchy.html";
    }, 1500);

  } catch (err) {
    console.error("Upload failed:", err);
    uploadStatus.style.color = "red";
    uploadStatus.textContent = `❌ Upload failed: ${err.message}. Please try again.`;
    uploadStatus.style.display = "block";
  }
});
