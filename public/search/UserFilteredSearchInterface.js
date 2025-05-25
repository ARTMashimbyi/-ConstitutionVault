// public/search/UserFilteredSearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

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
      const res = await fetch("http://localhost:4000/api/files");
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

    const hits = allDocs.filter(item => {
      // Text match
      const textMatch =
        !lower ||
        item.title?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower);

      // User‐setting matches
      const authorMatch      = !userSettings.author      || item.author === userSettings.author;
      const categoryMatch    = !userSettings.category    || item.category === userSettings.category;
      const institutionMatch = !userSettings.institution || item.institution === userSettings.institution;

      // Keywords match
      let keywordsMatch = true;
      if (userSettings.keywords) {
        const wanted = userSettings.keywords
          .split(",")
          .map(k => k.trim().toLowerCase())
          .filter(k => k);
        if (Array.isArray(item.keywords)) {
          keywordsMatch = wanted.some(w =>
            item.keywords.some(kw => kw.toLowerCase() === w)
          );
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
