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

  const parseList = (str) =>
    str
      ?.split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

  const wantedAuthors      = parseList(userSettings.author);
  const wantedCategories   = parseList(userSettings.category);
  const wantedInstitutions = parseList(userSettings.institution);
  const wantedKeywords     = parseList(userSettings.keywords);

  const hits = allDocs.filter(item => {
    // Text match
    const textMatch =
      !lower ||
      item.title?.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower);

    // Match any of the wanted authors/categories/etc.
    const authorMatch = wantedAuthors.length === 0 ||
      wantedAuthors.includes(item.author?.toLowerCase());

    const categoryMatch = wantedCategories.length === 0 ||
      wantedCategories.includes(item.category?.toLowerCase());

    const institutionMatch = wantedInstitutions.length === 0 ||
      wantedInstitutions.includes(item.institution?.toLowerCase());

    // Keywords match
    let keywordsMatch = true;
    if (wantedKeywords.length > 0) {
      if (Array.isArray(item.keywords)) {
        const itemKeywords = item.keywords.map(k => k.toLowerCase());
        keywordsMatch = wantedKeywords.some(k => itemKeywords.includes(k));
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
