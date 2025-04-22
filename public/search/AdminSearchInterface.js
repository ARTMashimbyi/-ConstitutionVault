// public/search/AdminSearchInterface.js

const { initializeApp } = require("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
const {
  getFirestore,
  collection,
  getDocs
} = require("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
const { renderSearchBar } = require("./SearchBar.js");
const { renderSearchResults } = require("./SearchResults.js");
const { renderFilters } = require("./Filters.js");
const { renderSortOptions } = require("./SortOptions.js");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "gs://constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Initializes the admin search UI in the element with the given ID.
 * @param {string} containerId 
 */
function initializeAdminSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Admin search container "${containerId}" not found.`);
    return;
  }

  // State
  let currentQuery = "";
  let currentFilters = {};
  let currentSort = "";

  // Build UI elements
  const wrapper = document.createElement("div");
  wrapper.id = "admin-search-interface";

  const searchBar = renderSearchBar(handleSearch);
  const filters    = renderFilters(filters => {
    currentFilters = filters;
    refreshResults();
  });
  const sortOpts   = renderSortOptions(sortValue => {
    currentSort = sortValue;
    refreshResults();
  });
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "admin-search-results";

  wrapper.appendChild(searchBar);
  wrapper.appendChild(filters);
  wrapper.appendChild(sortOpts);
  wrapper.appendChild(resultsContainer);
  container.appendChild(wrapper);

  async function handleSearch(query) {
    currentQuery = query.toLowerCase();
    await refreshResults();
  }

  async function refreshResults() {
    resultsContainer.innerHTML = "🔄 Loading...";
    try {
      const snapshot = await getDocs(collection(db, "constitutionalDocuments"));
      let results = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const matchesQuery =
          !currentQuery ||
          data.title?.toLowerCase().includes(currentQuery) ||
          data.description?.toLowerCase().includes(currentQuery);
        const matchesType =
          !currentFilters.type || data.type === currentFilters.type;
        const matchesYear =
          !currentFilters.year || String(data.year) === String(currentFilters.year);
        if (matchesQuery && matchesType && matchesYear) {
          results.push(data);
        }
      });
      results = applySorting(results, currentSort);
      renderSearchResults(resultsContainer, results);
    } catch (err) {
      console.error("Error fetching admin search results:", err);
      resultsContainer.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }

  function applySorting(results, sortValue) {
    const sorted = [...results];
    switch (sortValue) {
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "year-asc":
        sorted.sort((a, b) => a.year - b.year);
        break;
      case "year-desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
    }
    return sorted;
  }
}

module.exports = { initializeAdminSearchInterface };
