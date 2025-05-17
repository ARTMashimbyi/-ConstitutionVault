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

  handleSearch("");

  async function handleSearch(query) {
    resultsSection.innerHTML = "🔄 Loading…";

    try {
      const userSettings = JSON.parse(localStorage.getItem("userSettings")) || {};

      const response = await fetch("http://localhost:3000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, settings: userSettings })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch results from API");
      }

      const { results } = await response.json();

      renderSearchResults(resultsSection, results.map(item => ({
        title: item.title,
        description: item.snippet || "",
        url: item.link || "",
        fileType: item.type || "document"
      })));

    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsSection.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}
