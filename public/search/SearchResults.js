// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container.
 * Uses a <ul>/<li> structure instead of <div>s for semantic markup.
 *
 * @param {HTMLElement} container – the element to populate with results
 * @param {Array<{ title: string, description?: string }>} results
 */
export function renderSearchResults(container, results) {
  // Clear any existing content
  container.innerHTML = "";

  // Empty‐state message
  if (!results || results.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "no-results";
    emptyMsg.textContent = "No results found.";
    container.appendChild(emptyMsg);
    return;
  }

  // Build semantic list
  const list = document.createElement("ul");
  list.className = "search-results-list";

  results.forEach((item) => {
    const li = document.createElement("li");
    li.className = "search-result-item";

    // Title
    const titleEl = document.createElement("h3");
    titleEl.textContent = item.title;
    li.appendChild(titleEl);

    // Optional description
    if (item.description) {
      const descEl = document.createElement("p");
      descEl.textContent = item.description;
      li.appendChild(descEl);
    }

    list.appendChild(li);
  });

  container.appendChild(list);
}
