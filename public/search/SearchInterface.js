// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";
import { renderSortOptions }   from "./SortOptions.js";
import { initializeApp }       from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- FIREBASE CONFIG (update if needed!) ---
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.appspot.com",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

// --- Initialize Firebase if needed ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function initializeSearchInterface(containerId) {
  // Get settings once (set in settings page)
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") {
    document.body.classList.add("dark-mode");
  }

  // Helper: parse array or CSV string
  const parseList = s =>
    Array.isArray(s)
      ? s.map(x => x.trim().toLowerCase()).filter(Boolean)
      : (typeof s === "string" && s.trim()
        ? s.split(",").map(x => x.trim().toLowerCase()).filter(Boolean)
        : []);

  // Filters
  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // --------- FORCE DEFAULT TYPE TO "ALL" ON LOAD ----------
  let currentQuery = "";
  let currentType  = ""; // default to "All" (empty string = all)
  let currentSort  = saved.sort     || "";
  let dateFrom     = saved.allTime  ? "" : (saved.dateFrom || "");
  let dateTo       = saved.allTime  ? "" : (saved.dateTo   || "");
  const snippetLen = parseInt(saved.snippetLength,10) || 100;
  const gridCols   = parseInt(saved.columns,      10) || 2;

  // UI containers
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label","Search Interface");

  // Results grid
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";
  resultsSection.style.display             = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols},1fr)`;
  resultsSection.style.gap                 = "1.5rem";

  // Search bar
  const searchBar = renderSearchBar(q => {
    currentQuery = q;
    refresh();
  });
  wrapper.append(searchBar);

  // Only render the TYPE and SORT dropdowns
  const filtersUI = renderFilters(f => {
    currentType = f.type;
    refresh();
  });
  // --------- SET TYPE DROPDOWN TO "ALL" BY DEFAULT ---------
  const typeDropdown = filtersUI.querySelector("#filter-type");
  if (typeDropdown) typeDropdown.value = ""; // "" == All files
  //----------------------------------------------------------
  wrapper.append(filtersUI);

  const sortUI = renderSortOptions(s => {
    currentSort = s;
    refresh();
  });
  sortUI.querySelector("select").value = currentSort;
  wrapper.append(sortUI);

  wrapper.append(resultsSection);
  container.appendChild(wrapper);

  // --- Only ever use saved filters, never allow changes here ---

  async function refresh() {
    resultsSection.innerHTML = "<p>🔄 Loading…</p>";
    try {
      // 1. Load all documents from Firestore
      let docsQuery = collection(db, "constitutionalDocuments");
      let allDocs = [];
      const q = currentSort
        ? query(docsQuery, orderBy(currentSort))
        : docsQuery;
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        allDocs.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 2. Apply search/filter logic
      let filtered = allDocs.filter(item => {
        // Query (title or text search)
        if (currentQuery) {
          const text = (
            (item.title || "") +
            " " +
            (item.description || "") +
            " " +
            (item.textContent || "")
          ).toLowerCase();
          if (!text.includes(currentQuery.toLowerCase())) return false;
        }
        // Type
        if (currentType && item.fileType && item.fileType !== currentType) return false;
        // Authors
        if (wantedAuthors.length &&
            !(item.author && wantedAuthors.includes(item.author.toLowerCase())))
          return false;
        // Categories
        if (wantedCategories.length &&
            !(item.category && wantedCategories.includes(item.category.toLowerCase())))
          return false;
        // Institutions
        if (wantedInstitutions.length &&
            !(item.institution && wantedInstitutions.includes(item.institution.toLowerCase())))
          return false;
        // Keywords
        if (wantedKeywords.length) {
          const kws = (item.keywords || []).map(k => k.toLowerCase());
          if (!wantedKeywords.some(w => kws.includes(w))) return false;
        }
        // Date
        if (dateFrom && item.date && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && item.date && new Date(item.date) > new Date(dateTo)) return false;
        return true;
      });

      if (!filtered.length) {
        resultsSection.innerHTML =
          `<p class="no-results">😔 No matches for your filters</p>`;
        return;
      }

      // Truncate snippet (if present)
      filtered.forEach(it => {
        if (it.snippet && it.snippet.length > snippetLen) {
          it.snippet = it.snippet.slice(0, snippetLen) + "…";
        }
      });

      renderSearchResults(resultsSection, filtered);
    } catch(err) {
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Something went wrong.</p>";
    }
  }

  // Initial load
  refresh();
}
