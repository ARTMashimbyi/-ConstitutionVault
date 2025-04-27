// public/search/SearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { renderSearchBar } from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

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

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/**
 * Mounts the search UI and immediately loads & sorts all documents.
 *
 * @param {string} containerId – ID of the element to render into
 */
export function initializeSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // Build the UI
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";

  const searchBar        = renderSearchBar(handleSearch);
  const resultsContainer = document.createElement("div");
  resultsContainer.id    = "search-results";

  wrapper.append(searchBar, resultsContainer);
  container.appendChild(wrapper);

  // Initial load: fetch & display all docs
  handleSearch("");

  // Fetch, filter, sort, and render
  async function handleSearch(query) {
    resultsContainer.innerHTML = "🔄 Loading…";
    try {
      const snapshot = await getDocs(
        collection(db, "constitutionalDocuments")
      );

      const lower = query.trim().toLowerCase();
      const hits  = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (
          !lower ||
          data.title?.toLowerCase().includes(lower) ||
          data.description?.toLowerCase().includes(lower)
        ) {
          hits.push(data);
        }
      });

      // Default sort: alphabetical by title
      hits.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );

      renderSearchResults(resultsContainer, hits);
    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsContainer.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}
