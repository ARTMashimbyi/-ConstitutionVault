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

  // 1) Wrapping section
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "ConstitutionVault Search Interface");

  // 2) Search bar
  const searchBar = renderSearchBar(handleSearch);

  // 3) Results container
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";

  wrapper.append(searchBar, resultsSection);
  container.append(wrapper);

  // 4) Load all documents
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
   * Filters documents by query, including full-text content, and renders results.
   *
   * @param {string} query
   */
  function handleSearch(query) {
    const lower = query.trim().toLowerCase();
    const hits  = [];

    for (const data of allDocs) {
      // combine all searchable fields
      const fields = [
        data.title,
        data.description,
        data.author,
        data.category,
        data.institution,
        ...(Array.isArray(data.keywords) ? data.keywords : []),
        data.fullText    // include the extracted document text
      ]
        .filter(Boolean)
        .map(s => s.toLowerCase());

      // check if any field contains the query
      const matches = lower === "" 
        ? true 
        : fields.some(field => field.includes(lower));

      if (matches) {
        // extract a snippet around the first occurrence in fullText
        let snippet = "";
        if (lower && typeof data.fullText === "string") {
          const idx = data.fullText.toLowerCase().indexOf(lower);
          if (idx !== -1) {
            const start = Math.max(0, idx - 30);
            const end   = Math.min(data.fullText.length, idx + lower.length + 30);
            snippet = data.fullText.slice(start, end).trim();
            if (start > 0) snippet = "… " + snippet;
            if (end < data.fullText.length) snippet += " …";
          }
        }

        hits.push({ ...data, snippet });
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
      fileType:    item.fileType   || "document",
      snippet:     item.snippet    || ""
    }));

    renderSearchResults(resultsSection, results);
  }
}
