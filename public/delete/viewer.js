import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, collection, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const docTitle = document.getElementById('docTitle');
const docType = document.getElementById('docType');
const docAuthor = document.getElementById('docAuthor');
const docDate = document.getElementById('docDate');
const backButton = document.getElementById('backButton');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('content');

// Get document ID from URL
const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('id');

// Back button functionality
backButton.addEventListener('click', () => {
  window.history.back();
});

// Load document
async function loadDocument() {
  if (!docId) {
    showError("No document ID provided");
    return;
  }

  try {
    const docRef = doc(collection(db, 'constitutionalDocuments'), docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const docData = docSnap.data();
      displayDocument(docData);
    } else {
      showError("Document not found");
    }
  } catch (error) {
    console.error("Error loading document:", error);
    showError(`Error loading document: ${error.message}`);
  }
}

// Display document
function displayDocument(docData) {
  if (!docData || !docData.downloadURL) {
    showError("Document data or URL is missing");
    return;
  }

  // Update metadata
  docTitle.textContent = docData.title || 'Untitled Document';
  docType.textContent = docData.fileType || 'Unknown Type';
  docAuthor.textContent = docData.author || 'Unknown Author';
  docDate.textContent = formatDate(docData.date) || 'Unknown Date';

  // Determine content type and display accordingly
  const fileType = docData.fileType?.toLowerCase() || '';
  const fileURL = docData.downloadURL;

  // Clear content container
  contentEl.innerHTML = '';

  // Create appropriate element based on file type
  if (fileType.includes('pdf')) {
    // PDF Files
    const iframe = document.createElement('iframe');
    iframe.src = fileURL;
    contentEl.appendChild(iframe);
  } 
  else if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileURL)) {
    // Image files
    const img = document.createElement('img');
    img.src = fileURL;
    img.alt = docData.title || 'Document Image';
    contentEl.appendChild(img);
  } 
  else if (fileType.includes('video') || /\.(mp4|webm|mov|avi)$/i.test(fileURL)) {
    // Video files
    const video = document.createElement('video');
    video.src = fileURL;
    video.controls = true;
    video.autoplay = false;
    contentEl.appendChild(video);
  } 
  else if (fileType.includes('audio') || /\.(mp3|wav|ogg)$/i.test(fileURL)) {
    // Audio files
    const audio = document.createElement('audio');
    audio.src = fileURL;
    audio.controls = true;
    contentEl.appendChild(audio);
  } 
  else {
    // Default: treat as a downloadable or openable file
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    
    const message = document.createElement('p');
    message.textContent = `File type "${fileType}" may not be viewable in browser.`;
    message.style.marginBottom = '20px';
    
    const openBtn = document.createElement('a');
    openBtn.href = fileURL;
    openBtn.target = '_blank';
    openBtn.textContent = 'Open File in New Tab';
    openBtn.style.display = 'inline-block';
    openBtn.style.padding = '10px 20px';
    openBtn.style.backgroundColor = '#304a75';
    openBtn.style.color = 'white';
    openBtn.style.borderRadius = '4px';
    openBtn.style.textDecoration = 'none';
    openBtn.style.margin = '10px';
    
    const downloadBtn = document.createElement('a');
    downloadBtn.href = fileURL;
    downloadBtn.download = docData.title || 'document';
    downloadBtn.textContent = 'Download File';
    downloadBtn.style.display = 'inline-block';
    downloadBtn.style.padding = '10px 20px';
    downloadBtn.style.backgroundColor = '#5a73a7';
    downloadBtn.style.color = 'white';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.textDecoration = 'none';
    downloadBtn.style.margin = '10px';
    
    container.appendChild(message);
    container.appendChild(openBtn);
    container.appendChild(downloadBtn);
    contentEl.appendChild(container);
  }

  // Show content and hide loading
  loadingEl.style.display = 'none';
  errorEl.style.display = 'none';
  contentEl.style.display = 'block';
}

// Show error message
function showError(message) {
  loadingEl.style.display = 'none';
  contentEl.style.display = 'none';
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadDocument);