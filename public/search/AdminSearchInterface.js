// public/search/AdminSearchInterface.js

import { renderSearchBar }       from "./SearchBar.js";
import { renderSearchResults }   from "./SearchResults.js";
import { renderFilters }         from "./Filters.js";
import { renderSortOptions }     from "./SortOptions.js";


// 🌐 Use Azure or localhost automatically
const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";


/**
 * Initializes the admin search UI in the element with the given ID.
 * @param {string} containerId 
 */
export function initializeAdminSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Admin search container "${containerId}" not found.`);
    return;
  }

  // State
  let allDocs        = [];
  let currentQuery   = "";
  let currentFilters = {};
  let currentSort    = "";

  // Build UI elements
  const wrapper           = document.createElement("div");
  wrapper.id              = "admin-search-interface";
  const searchBar         = renderSearchBar(handleSearch);
  const filters           = renderFilters(filters => {
    currentFilters = filters;
    refreshResults();
  });
  const sortOpts          = renderSortOptions(sortValue => {
    currentSort = sortValue;
    refreshResults();
  });
  const resultsContainer  = document.createElement("div");
  resultsContainer.id     = "admin-search-results";

  wrapper.append(searchBar, filters, sortOpts, resultsContainer);
  container.append(wrapper);

  // 1) Fetch all documents once up front
  (async () => {
    resultsContainer.innerHTML = "🔄 Loading…";
    try {
      const res = await fetch(`${API_BASE}/files`);
      if (!res.ok) throw new Error("Failed to load documents");
      allDocs = await res.json();
      await refreshResults();
    } catch (err) {
      console.error("Error fetching admin search results:", err);
      resultsContainer.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  })();

  // Triggered by the search bar
  async function handleSearch(query) {
    currentQuery = query.trim().toLowerCase();
    await refreshResults();
  }

  // Applies filters, sorting, and renders
  async function refreshResults() {
    resultsContainer.innerHTML = "🔄 Loading…";

    // Filter by query
    let results = allDocs.filter(item => {
      const textMatch =
        !currentQuery ||
        item.title?.toLowerCase().includes(currentQuery) ||
        item.description?.toLowerCase().includes(currentQuery);

      const typeMatch =
        !currentFilters.type || item.fileType === currentFilters.type;
      const yearMatch =
        !currentFilters.year || String(item.date)?.slice(0,4) === String(currentFilters.year);

      return textMatch && typeMatch && yearMatch;
    });

    // Sort
    results = applySorting(results, currentSort);

    // Render
    renderSearchResults(resultsContainer, results);
  }

  // Sorting helper
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
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "year-desc":
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }
    return sorted;
  }
}
