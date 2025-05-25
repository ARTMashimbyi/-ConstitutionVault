// public/search/UserFilteredSearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

// 🌐 Use Azure or localhost automatically
const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";

/**
 * Mounts a search UI into `containerId`, filtering by both text and
 * saved user settings (author, category, institution, keywords).
 */
export function initializeUserFilteredSearch(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // 1) Create wrapper and results area
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  const searchBar      = renderSearchBar(handleSearch);
  const resultsSection = document.createElement("section");
  resultsSection.id    = "search-results";
  wrapper.append(searchBar, resultsSection);
  container.appendChild(wrapper);

  // 2) Fetch all docs once up front
  let allDocs = [];
  (async () => {
    resultsSection.innerHTML = "🔄 Loading…";
    try {
      const res = await fetch(`${API_BASE}/files`);
      if (!res.ok) throw new Error("Failed to load documents");
      allDocs = await res.json();
      // Initial empty search
      handleSearch("");
    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  })();

  /**
   * Filters `allDocs` by the query string and user settings,
   * then renders via `renderSearchResults`.
   */
  async function handleSearch(query) {
    const lower = query.trim().toLowerCase();
    const userSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");

    // Convert settings fields to arrays (support multi-select)
    function toArray(val) {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return [val];
      return [];
    }
    const authors      = toArray(userSettings.author).map(s => s.toLowerCase());
    const categories   = toArray(userSettings.category).map(s => s.toLowerCase());
    const institutions = toArray(userSettings.institution).map(s => s.toLowerCase());
    const keywords     = toArray(userSettings.keywords).map(s => s.toLowerCase());

    const hits = allDocs.filter(item => {
      // Text match
      const textMatch =
        !lower ||
        (item.title && item.title.toLowerCase().includes(lower)) ||
        (item.description && item.description.toLowerCase().includes(lower));

      // Array-based matches: must match *at least one* if any selected, else pass
      const authorMatch =
        authors.length === 0 ||
        (item.author && authors.includes(item.author.toLowerCase()));

      const categoryMatch =
        categories.length === 0 ||
        (item.category && categories.includes(item.category.toLowerCase()));

      const institutionMatch =
        institutions.length === 0 ||
        (item.institution && institutions.includes(item.institution.toLowerCase()));

      // Keywords: must match at least one keyword
      let keywordsMatch = true;
      if (keywords.length > 0) {
        if (Array.isArray(item.keywords)) {
          const itemKeywords = item.keywords.map(k => k.toLowerCase());
          keywordsMatch = keywords.some(kw => itemKeywords.includes(kw));
        } else {
          keywordsMatch = false;
        }
      }

      return textMatch && authorMatch && categoryMatch && institutionMatch && keywordsMatch;
    });

    // Sort & shape results
    hits.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    const results = hits.map(item => ({
      title:       item.title,
      description: item.description || "",
      url:         item.downloadURL || "",
      fileType:    item.fileType   || "document"
    }));

    renderSearchResults(resultsSection, results);
  }
}
