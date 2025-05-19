// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";      // type dropdown only
import { renderSortOptions }   from "./SortOptions.js";  // title/year sorting

/**
 * @param {string} containerId – the ID of the element where we mount
 */
export function initializeSearchInterface(containerId) {
  // 0) Grab any saved user settings
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  // Apply dark mode if set
  if (saved.theme === "dark") document.body.classList.add("dark-mode");

  // wrap missing arrays
  const parseList = str =>
    typeof str === "string" && str.trim()
      ? str.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // 1) Find container
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // 2) Build UI shell
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "ConstitutionVault Search Interface");

  // 3) State
  let allDocs      = [];
  let currentQuery = "";
  let currentType  = saved.type || "";
  let currentSort  = "";

  // 4) Controls
  // 4a) Search bar
  const searchBar = renderSearchBar(q => {
    currentQuery = q;
    refreshResults();
  });
  // 4b) Type filter dropdown
  const filtersUI = renderFilters(f => {
    currentType = f.type;
    refreshResults();
  });
  // seed the dropdown
  const typeSelect = filtersUI.querySelector("#filter-type");
  if (typeSelect) typeSelect.value = currentType;

  // 4c) Sort options
  const sortUI = renderSortOptions(s => {
    currentSort = s;
    refreshResults();
  });

  // 5) Results container
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";

  // 6) Assemble on page
  wrapper.append(searchBar, filtersUI, sortUI, resultsSection);
  container.appendChild(wrapper);

  // 7) Fetch all data once
  (async () => {
    resultsSection.innerHTML = "<p>🔄 Loading…</p>";
    try {
      const res = await fetch("http://localhost:4000/api/files");
      if (!res.ok) throw new Error("Failed to load documents");
      allDocs = await res.json();
      refreshResults();
    } catch (err) {
      console.error("Error loading documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  })();

  // 8) Combined filter/search/sort logic
  function refreshResults() {
    const q = currentQuery.trim().toLowerCase();

    // 8a) Filter pass
    let hits = allDocs.filter(item => {
      // full-text + metadata fields
      const fields = [
        item.title, item.description, item.author,
        item.category, item.institution,
        ...(Array.isArray(item.keywords) ? item.keywords : []),
        item.fullText
      ]
        .filter(Boolean)
        .map(s => s.toLowerCase());

      const textMatch = !q || fields.some(f => f.includes(q));

      // user-settings filters
      const authorMatch = !wantedAuthors.length
        || (item.author && wantedAuthors.includes(item.author.toLowerCase()));

      const categoryMatch = !wantedCategories.length
        || (item.category && wantedCategories.includes(item.category.toLowerCase()));

      const institutionMatch = !wantedInstitutions.length
        || (item.institution && wantedInstitutions.includes(item.institution.toLowerCase()));

      const keywordsMatch = !wantedKeywords.length
        || (Array.isArray(item.keywords)
            && wantedKeywords.some(k => item.keywords.map(x => x.toLowerCase()).includes(k)));

      // dropdown type filter
      const typeMatch = !currentType || item.fileType === currentType;

      return textMatch && authorMatch && categoryMatch
        && institutionMatch && keywordsMatch && typeMatch;
    });

    // 8b) Sorting
    if (currentSort) {
      const [field, dir] = currentSort.split("-");
      hits.sort((a, b) => {
        let va = a[field], vb = b[field];
        if (field === "year" && a.uploadDate) {
          va = new Date(a.uploadDate).getFullYear();
          vb = new Date(b.uploadDate).getFullYear();
        }
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
        return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    } else {
      hits.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    // 8c) Render
    const shaped = hits.map(item => ({
      title:       item.title,
      description: item.description || "",
      author:      item.author || "",
      category:    item.category || "",
      institution: item.institution || "",
      keywords:    Array.isArray(item.keywords) ? item.keywords : [],
      url:         item.downloadURL || item.url || "",
      fileType:    item.fileType || "document",
      snippet:     item.snippet || ""
    }));

    renderSearchResults(resultsSection, shaped);
  }
}
