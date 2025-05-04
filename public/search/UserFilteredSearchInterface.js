// public/search/UserFilteredSearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:        "constitutionvault-1b5d1.firebaseapp.com",
  projectId:         "constitutionvault-1b5d1",
  storageBucket:     "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId:             "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:     "G-YJEYZ85T3S"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export function initializeUserFilteredSearch(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";

  const searchBar = renderSearchBar(handleSearch);
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";

  wrapper.append(searchBar, resultsSection);
  container.appendChild(wrapper);

  handleSearch("");

  async function handleSearch(query) {
    resultsSection.innerHTML = "🔄 Loading…";

    try {
      const userSettings = JSON.parse(localStorage.getItem("userSettings")) || {};
      const snapshot = await getDocs(collection(db, "constitutionalDocuments"));

      const lower = query.trim().toLowerCase();
      const hits = [];

      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };

        const matchQuery =
          !lower ||
          data.title?.toLowerCase().includes(lower) ||
          data.description?.toLowerCase().includes(lower);

        const matchAuthor = !userSettings.author || data.author === userSettings.author;
        const matchCategory = !userSettings.category || data.category === userSettings.category;
        const matchInstitution = !userSettings.institution || data.institution === userSettings.institution;

        let matchKeywords = true;
        if (userSettings.keywords) {
          const keywordList = userSettings.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k);
          if (Array.isArray(data.keywords)) {
            matchKeywords = keywordList.some(k =>
              data.keywords.some(docKeyword => docKeyword.toLowerCase() === k)
            );
          } else {
            matchKeywords = false;
          }
        }

        if (matchQuery && matchAuthor && matchCategory && matchInstitution && matchKeywords) {
          hits.push(data);
        }
      });

      hits.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

      const results = hits.map(item => ({
        title: item.title,
        description: item.description || "",
        url: item.downloadURL || "",
        fileType: item.fileType || "document"
      }));

      renderSearchResults(resultsSection, results);

    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}
