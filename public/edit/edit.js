//edit.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// Wait for DOM to load
window.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM Loaded for Document Editor");

  // Get document ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id');
  console.log("Document ID from URL:", docId);


  const editForm = document.getElementById('editDocForm');
  const titleInput = document.getElementById('docTitle');
  const institutionInput = document.getElementById('docInstitution');
  const authorInput = document.getElementById('docAuthor');
  const categoryInput = document.getElementById('docCategory');
  const keywordsInput = document.getElementById('docKeywords');
  const dateInput = document.getElementById('docDate');
  const statusMsg = document.getElementById('message');
  const cancelButton = document.getElementById('cancelButton');

  // Load document data
  async function loadDocument() {
    try {
      const docRef = doc(collection(db, "constitutionalDocuments"), docId);
      const docSnap = await getDoc(docRef);
      console.log("📸 Document Snapshot:", docSnap);
      
      if (docSnap.exists()) {
        const docData = docSnap.data();
        console.log("📝 Document Data:", docData);
        
        // Populate form fields with existing data
        titleInput.value = docData.title || '';
        institutionInput.value = docData.institution || '';
        authorInput.value = docData.author || '';
        categoryInput.value = docData.category || '';
        
        // Format keywords array back to comma-separated string
        if (docData.keywords && Array.isArray(docData.keywords)) {
          keywordsInput.value = docData.keywords.join(', ');
        }
        
        // Format date for input field (YYYY-MM-DD)
        if (docData.date) {
          const dateObj = new Date(docData.date);
          const formattedDate = dateObj.toISOString().split('T')[0];
          dateInput.value = formattedDate;
        }
      } else {
        statusMsg.textContent = "Document not found.";
        statusMsg.style.color = "red";
      }
    } catch (err) {
      console.error("Error loading document:", err);
      statusMsg.textContent = "Failed to load document.";
      statusMsg.style.color = "red";
    }
  }

 
  if (docId) {
    loadDocument();
  } else {
    statusMsg.textContent = "Invalid document ID.";
    statusMsg.style.color = "red";
  }

  
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const docRef = doc(collection(db, "constitutionalDocuments"), docId);
      
      
      const keywordsString = keywordsInput.value;
      const keywordsArray = keywordsString
        ? keywordsString.split(',').map(keyword => keyword.trim())
        : [];
        
      await updateDoc(docRef, {
        title: titleInput.value,
        institution: institutionInput.value,
        author: authorInput.value,
        category: categoryInput.value,
        keywords: keywordsArray,
        date: dateInput.value,
        updatedAt: new Date().toISOString() 
      });
      
      statusMsg.textContent = "✅ Document updated successfully!";
      statusMsg.style.color = "green";
      
      
      setTimeout(() => {
        window.location.href = `../admin/hierarcy.html?id=${docId}`;
      }, 1500);
    } catch (err) {
      console.error("Error updating document:", err);
      statusMsg.textContent = "❌ Failed to update document.";
      statusMsg.style.color = "red";
    }
  });
  
  
  cancelButton.addEventListener('click', () => {
    
    window.location.href = `../admin/hierarcy.html?id=${docId}`;
  });
});