// public/search/SearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

// ← Your Web-app config (make sure this matches your project)
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

  // Create a semantic section for the search interface
  const wrapper = document.createElement("section");
  wrapper.id    = "search-interface";

  // Render the search bar (handles its own <form> or <input>)
  const searchBar = renderSearchBar(handleSearch);

  // Create a section to hold results
  const resultsSection = document.createElement("section");
  resultsSection.id  = "search-results";

  // Assemble and mount
  wrapper.append(searchBar, resultsSection);
  container.appendChild(wrapper);

  // Kick off initial load
  handleSearch("");

  async function handleSearch(query) {
    resultsSection.innerHTML = "🔄 Loading…";
    try {
      // 1) Fetch all docs
      const snapshot = await getDocs(
        collection(db, "constitutionalDocuments")
      );

      // 2) Filter by title/description
      const lower = query.trim().toLowerCase();
      const hits  = [];
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (
          !lower ||
          data.title?.toLowerCase().includes(lower) ||
          data.description?.toLowerCase().includes(lower)
        ) {
          hits.push(data);
        }
      });

      // 3) Sort alphabetically by title
      hits.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );

      // 4) Map to include the stored downloadURL
      const results = hits.map(item => ({
        ...item,
        url: item.downloadURL || ""      // relies on your Firestore field
      }));

      // 5) Render with your existing helper
      renderSearchResults(resultsSection, results);

    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}
