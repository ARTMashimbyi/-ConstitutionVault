// public/search/SearchInterface.js

const { initializeApp } = require("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
const { getFirestore, collection, getDocs } = require("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
const { renderSearchBar } = require("./SearchBar.js");
const { renderSearchResults } = require("./SearchResults.js");

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Mounts the user‐facing search interface into the given container.
 * @param {string} containerId  – the id of the element to render into
 */
function initializeSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // Build UI
  const wrapper = document.createElement("div");
  wrapper.id = "search-interface";

  const resultsContainer = document.createElement("div");
  resultsContainer.id = "search-results";

  const searchBar = renderSearchBar(handleSearch);

  wrapper.appendChild(searchBar);
  wrapper.appendChild(resultsContainer);
  container.appendChild(wrapper);

  async function handleSearch(query) {
    resultsContainer.innerHTML = "🔄 Loading...";
    try {
      const snapshot = await getDocs(collection(db, "constitutionalDocuments"));
      const lowerQuery = query.toLowerCase();
      const results = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const matches =
          !lowerQuery ||
          data.title?.toLowerCase().includes(lowerQuery) ||
          data.description?.toLowerCase().includes(lowerQuery);
        if (matches) results.push(data);
      });
      renderSearchResults(resultsContainer, results);
    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsContainer.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}

module.exports = { initializeSearchInterface };
