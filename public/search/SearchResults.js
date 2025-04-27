// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container element.
 * Each result object should have at least:
 *   • title: string
 *   • description?: string
 *   • url?: string
 *
 * @param {HTMLElement} container  
 * @param {Array<{ title: string, description?: string, url?: string }>} results
 */
export function renderSearchResults(container, results) {
  // Clear existing content
  container.innerHTML = "";

  // No results case
  if (!results || results.length === 0) {
    const empty = document.createElement("p");
    empty.className   = "no-results";
    empty.textContent = "No results found.";
    container.append(empty);
    return;
  }

  // Render each result as an <article>
  results.forEach((item) => {
    const article = document.createElement("article");
    article.className = "search-result";

    // Title
    const title = document.createElement("h3");
    title.textContent = item.title;
    article.append(title);

    // Description (if any)
    if (item.description) {
      const desc = document.createElement("p");
      desc.textContent = item.description;
      article.append(desc);
    }

    // View link (if URL available)
    if (item.url) {
      const link = document.createElement("a");
      link.href        = item.url;
      link.target      = "_blank";
      link.rel         = "noopener";
      link.textContent = "View Document";
      article.append(link);
    }

    container.append(article);
  });
}
