import { renderSearchBar } from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters } from "./Filters.js";
import { renderSortOptions } from "./SortOptions.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAt,
  endAt,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- Firebase config (replace with your config if needed) ---
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function initializeSearchInterface(containerId) {
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") {
    document.body.classList.add("dark-mode");
  }

  const parseList = (s) =>
    Array.isArray(s)
      ? s.map((x) => x.trim().toLowerCase()).filter(Boolean)
      : typeof s === "string" && s.trim()
      ? s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
      : [];

  const wantedAuthors = parseList(saved.author);
  const wantedCategories = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords = parseList(saved.keywords);

  let currentQuery = "";
  let currentType = ""; // "" == All
  let currentSort = saved.sort || "";
  let dateFrom = saved.allTime ? "" : saved.dateFrom || "";
  let dateTo = saved.allTime ? "" : saved.dateTo || "";
  const snippetLen = parseInt(saved.snippetLength, 10) || 100;
  const gridCols = parseInt(saved.columns, 10) || 2;

  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);

  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "Search Interface");

  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";
  resultsSection.style.display = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
  resultsSection.style.gap = "1.5rem";

  let controller = null;

  // Debounce helper
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Firestore search function
  async function doRefresh() {
    if (controller) controller.abort?.();
    controller = new AbortController();
    const signal = controller.signal;

    resultsSection.innerHTML = "<p>🔄 Loading…</p>";

    try {
      // Reference to your Firestore collection
      const docsCol = collection(db, "constitutionalDocuments");

      // Build query constraints array
      const constraints = [];

      // Filter by fileType if set
      if (currentType) {
        constraints.push(where("fileType", "==", currentType));
      }

      // Filter by dateFrom and dateTo if set (assuming date field is stored as string ISO)
      if (dateFrom) {
        constraints.push(where("date", ">=", dateFrom));
      }
      if (dateTo) {
        constraints.push(where("date", "<=", dateTo));
      }

      // Build Firestore query with constraints and sorting
      let q;
      if (constraints.length > 0) {
        q = query(docsCol, ...constraints);
      } else {
        q = query(docsCol);
      }

      // Apply sort if any (assuming fields like 'date', 'title', 'author')
      if (currentSort) {
        // Example: sort string can be 'date_asc', 'date_desc', 'title_asc', 'title_desc'
        const [field, direction] = currentSort.split("_");
        q = query(q, orderBy(field, direction));
      }

      // Fetch documents
      const snapshot = await getDocs(q);

      // Map docs to array of data + id
      let results = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      // Filter by text query (simple search on title, author, category, institution, keywords, textContent)
      if (currentQuery.trim()) {
        const qLower = currentQuery.trim().toLowerCase();
        results = results.filter((item) => {
          return (
            (item.title && item.title.toLowerCase().includes(qLower)) ||
            (item.author && item.author.toLowerCase().includes(qLower)) ||
            (item.category && item.category.toLowerCase().includes(qLower)) ||
            (item.institution && item.institution.toLowerCase().includes(qLower)) ||
            (item.keywords &&
              item.keywords.some((k) => k.toLowerCase().includes(qLower))) ||
            (item.textContent && item.textContent.toLowerCase().includes(qLower))
          );
        });
      }

      // Apply client-side frozen filters (author, category, institution, keywords)
      const filtered = results.filter((item) => {
        if (
          wantedAuthors.length &&
          !(
            item.author &&
            wantedAuthors.includes(item.author.toLowerCase())
          )
        )
          return false;
        if (
          wantedCategories.length &&
          !(
            item.category &&
            wantedCategories.includes(item.category.toLowerCase())
          )
        )
          return false;
        if (
          wantedInstitutions.length &&
          !(
            item.institution &&
            wantedInstitutions.includes(item.institution.toLowerCase())
          )
        )
          return false;
        if (wantedKeywords.length) {
          const kws = (item.keywords || []).map((k) => k.toLowerCase());
          if (!wantedKeywords.some((w) => kws.includes(w))) return false;
        }
        return true;
      });

      if (!filtered.length) {
        resultsSection.innerHTML = `<p class="no-results">😔 No matches for your filters</p>`;
        return;
      }

      // Truncate snippets
      filtered.forEach((it) => {
        if (it.snippet && it.snippet.length > snippetLen) {
          it.snippet = it.snippet.slice(0, snippetLen) + "…";
        }
      });

      renderSearchResults(resultsSection, filtered);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Something went wrong.</p>";
    }
  }

  const refresh = debounce(doRefresh, 300);

  // Build UI
  const searchBar = renderSearchBar((q) => {
    currentQuery = q;
    refresh();
  });
  wrapper.append(searchBar);

  const filtersUI = renderFilters((f) => {
    currentType = f.type;
    refresh();
  });
  const typeDropdown = filtersUI.querySelector("#filter-type");
  if (typeDropdown) typeDropdown.value = "";
  wrapper.append(filtersUI);

  const sortUI = renderSortOptions((s) => {
    currentSort = s;
    refresh();
  });
  sortUI.querySelector("select").value = currentSort;
  wrapper.append(sortUI);

  wrapper.append(resultsSection);
  container.appendChild(wrapper);

  // Initial search
  refresh();
}
