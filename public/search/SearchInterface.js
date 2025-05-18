// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

/**
 * Mounts the search UI into the given container and performs live filtering.
 *
 * @param {string} containerId – ID of the element to render into
 */
export function initializeSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  // 1) Create a wrapping <section> for ARIA & styling
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "ConstitutionVault Search Interface");

  // 2) Render & mount the search bar
  const searchBar = renderSearchBar(handleSearch);

  // 3) Create & mount the results container
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";

  wrapper.append(searchBar, resultsSection);
  container.append(wrapper);

  // 4) Initial load of all documents
  let allDocs = [];
  (async () => {
    resultsSection.innerHTML = "<p>🔄 Loading…</p>";
    try {
      const res = await fetch("http://localhost:4000/api/files");
      if (!res.ok) throw new Error("Failed to load documents");
      allDocs = await res.json();
      handleSearch("");
    } catch (err) {
      console.error("Error loading documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  })();

  /**
   * Filters the loaded documents by query and renders results.
   *
   * @param {string} query
   */
  function handleSearch(query) {
    const lower = query.trim().toLowerCase();
    const hits  = [];

    for (const data of allDocs) {
      // gather searchable text fields
      const textFields = [
        data.title,
        data.description,
        data.author,
        data.category,
        data.institution
      ]
        .filter(Boolean)
        .map(s => s.toLowerCase());

      // keywords match
      const keywordMatch = Array.isArray(data.keywords) &&
        data.keywords.some(kw => kw.toLowerCase().includes(lower));

      if (
        !lower ||
        textFields.some(field => field.includes(lower)) ||
        keywordMatch
      ) {
        hits.push(data);
      }
    }

    // sort by title
    hits.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    // shape data for the renderer
    const results = hits.map(item => ({
      title:       item.title,
      description: item.description || "",
      author:      item.author || "",
      institution: item.institution || "",
      category:    item.category || "",
      keywords:    Array.isArray(item.keywords) ? item.keywords : [],
      url:         item.downloadURL || item.url   || "",
      fileType:    item.fileType   || "document"
    }));

    renderSearchResults(resultsSection, results);
  }
}
