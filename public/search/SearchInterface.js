// public/search/SearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

// ── Your Firebase web-app config (must match your console) ──
const firebaseConfig = {
  apiKey:            "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:        "constitutionvault-1b5d1.firebaseapp.com",
  projectId:         "constitutionvault-1b5d1",
  storageBucket:     "constitutionvault-1b5d1.appspot.com",
  messagingSenderId: "616111688261",
  appId:             "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:     "G-YJEYZ85T3S"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/**
 * Mounts the search UI into the given container and performs live filtering.
 *
 * @param {string} containerId – ID of the element to render into
 */
export function initializeSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // 1) Create a wrapping <section> for ARIA & styling
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "ConstitutionVault Search Interface");

  // 2) Render & mount the search bar (returns an <aside> or <section>, depending on your SearchBar.js)
  const searchBar = renderSearchBar(handleSearch);

  // 3) Create & mount the results container
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";

  // Append in one go (no <div> used)
  wrapper.append(searchBar, resultsSection);
  container.append(wrapper);

  // 4) Run an initial empty search
  handleSearch("");

  /**
   * Fetches all documents from Firestore, filters & sorts them,
   * then passes them to renderSearchResults.
   *
   * @param {string} query
   */
  async function handleSearch(query) {
    // show loading state
    resultsSection.innerHTML = "<p>🔄 Loading…</p>";

    try {
<<<<<<< HEAD
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
  
=======
      // pull every doc
      const snapshot = await getDocs(
        collection(db, "constitutionalDocuments")
      );

      const lower = query.trim().toLowerCase();
      const hits = [];

      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };

        // gather searchable text fields
        const textFields = [
          data.title,
          data.description,
          data.author,
          data.category,
          data.institution
        ]
          .filter(Boolean)
          .map(s => s.toLowerCase());

        // keywords match
        const keywordMatch = Array.isArray(data.keywords) &&
          data.keywords.some(kw => kw.toLowerCase().includes(lower));

        if (
          !lower ||
          textFields.some(field => field.includes(lower)) ||
          keywordMatch
        ) {
          hits.push(data);
        }
      });

      // sort by title
      hits.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );

      // shape data for the renderer
      const results = hits.map(item => ({
        title:       item.title,
        description: item.description || "",
        author:      item.author || "",
        institution: item.institution || "",
        category:    item.category || "",
        keywords:    Array.isArray(item.keywords) ? item.keywords : [],
        url:         item.downloadURL || item.url || "",
        fileType:    item.fileType   || "document"
      }));

      // hand off to SearchResults
      renderSearchResults(resultsSection, results);

>>>>>>> ad896a039b80097861da9eab0a2a2739fe661bbe
    } catch (err) {
      console.error("Error fetching or filtering documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
<<<<<<< HEAD
  
}
=======
}
>>>>>>> ad896a039b80097861da9eab0a2a2739fe661bbe
