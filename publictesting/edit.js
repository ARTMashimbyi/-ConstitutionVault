// edit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
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
getAnalytics(app);
const db = getFirestore(app);

// Wait for DOM to load
window.addEventListener("DOMContentLoaded", () => {
  console.log("📖 DOM Loaded");

  // Get book ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  console.log("Book ID from URL:", bookId);

  // Get form and input fields
  const editForm = document.getElementById('editBookForm');
  const nameInput = document.getElementById('bookName');
  const countryInput = document.getElementById('Country');
  const yearInput = document.getElementById('bookYear');
  const subjectInput = document.getElementById('bookSubject');
  const statusMsg = document.getElementById('message');

  // Load book data
  async function loadBook() {
    try {
      const bookRef = doc(db, "Books", bookId);
      const bookSnap = await getDoc(bookRef);
      console.log("📸 Book Snapshot:", bookSnap);
      console.log("✅ Exists?:", bookSnap.exists());
      console.log("📚 Data:", bookSnap.data());

      if (bookSnap.exists()) {
        const book = bookSnap.data();
        console.log("Book Data:", book);
        nameInput.value = book.Name || '';
        countryInput.value = book.Country || '';
        yearInput.value = book.Year || '';
        subjectInput.value = book.Subject || '';
      } else {
        statusMsg.textContent = "Book not found.";
        statusMsg.style.color = "red";
      }
    } catch (err) {
      console.error("Error loading book:", err);
      statusMsg.textContent = "Failed to load book.";
      statusMsg.style.color = "red";
    }
  }

  // Load book as soon as the DOM and URL are ready
  if (bookId) {
    loadBook();
  } else {
    statusMsg.textContent = "Invalid book ID.";
    statusMsg.style.color = "red";
  }

  // Handle form submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const bookRef = doc(db, "Books", bookId);
      await updateDoc(bookRef, {
        Name: nameInput.value,
        Country: countryInput.value,
        Year: parseInt(yearInput.value),
        Subject: subjectInput.value
      });
      statusMsg.textContent = "✅ Book updated successfully!";
      statusMsg.style.color = "green";
    } catch (err) {
      console.error("Error updating book:", err);
      statusMsg.textContent = "❌ Failed to update book.";
      statusMsg.style.color = "red";
    }
  });
});
