// public/search/UserFilteredSearchInterface.js

import { renderSearchBar } from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

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

  // 2) Fetch filtered docs based on user settings
  let allDocs = [];
  (async () => {
    resultsSection.innerHTML = "🔄 Loading…";

    try {
      const userSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
      const res = await fetch("http://localhost:4000/api/files/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userSettings)
      });
      if (!res.ok) throw new Error("Failed to load filtered documents");
      allDocs = await res.json();
      handleSearch(""); // Initial blank search
    } catch (err) {
      console.error("Error fetching filtered documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  })();

  /**
   * Filters already-filtered docs by search query string only.
   */
  function handleSearch(query) {
    const lower = query.trim().toLowerCase();

    const hits = allDocs.filter(item => {
      return (
        !lower ||
        item.title?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
      );
    });

    hits.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    const results = hits.map(item => ({
      title: item.title,
      description: item.description || "",
      url: item.downloadURL || "",
      fileType: item.fileType || "document"
    }));

    renderSearchResults(resultsSection, results);
  }
}
