// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container element.
 * Each result object should have at least a `title` and `description` property.
 *
 * @param {HTMLElement} container  – the element to populate with results
 * @param {Array<{ title: string, description?: string }>} results
 */
function renderSearchResults(container, results) {
  // Clear any existing content
  container.innerHTML = "";

  // If no results, show a friendly message
  if (!results || results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "no-results";
    empty.textContent = "No results found.";
    container.appendChild(empty);
    return;
  }

  // For each result, create a result card
  results.forEach((item) => {
    const card = document.createElement("div");
    card.className = "search-result";

    const title = document.createElement("h3");
    title.textContent = item.title;
    card.appendChild(title);

    if (item.description) {
      const desc = document.createElement("p");
      desc.textContent = item.description;
      card.appendChild(desc);
    }

    container.appendChild(card);
  });
}

module.exports = { renderSearchResults };
