// public/search/SearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

// ← Your Web-app config (must match your Firebase project exactly)
const firebaseConfig = {
  apiKey:            "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:        "constitutionvault-1b5d1.firebaseapp.com",
  projectId:         "constitutionvault-1b5d1",
  storageBucket:     "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId:             "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:     "G-YJEYZ85T3S"
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

  // Semantic wrapper
  const wrapper = document.createElement("section");
  wrapper.id    = "search-interface";

  // Search bar (submit only on button/Enter)
  const searchBar = renderSearchBar(handleSearch);

  // Results area
  const resultsSection = document.createElement("section");
  resultsSection.id  = "search-results";

  wrapper.append(searchBar, resultsSection);
  container.appendChild(wrapper);

  // Initial load
  handleSearch("");

  async function handleSearch(query) {
    resultsSection.innerHTML = "🔄 Loading…";
    try {
      const response = await fetch('http://localhost:3000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch results from the API');
      }
  
      const data = await response.json();
      const resultsArray = data.results; // fix: get the array
  
      renderSearchResults(resultsSection, resultsArray);
  
    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
  
}
