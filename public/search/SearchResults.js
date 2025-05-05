// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container element.
 * Each result object may have:
 *   • title: string
 *   • url: string
 *   • fileType: "document"|"image"|"audio"|"video"
 *   • description?: string
 *   • author?: string
 *   • institution?: string
 *   • category?: string
 *   • keywords?: string[]
 *
 * @param {HTMLElement} container
 * @param {Array<Object>} results
 */
export function renderSearchResults(container, results) {

  // 2) Handle no-results
  if (!Array.isArray(results) || results.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = "No results found.";
    container.appendChild(msg);
    return;
  }

  // Render each item (ranked by order)
  results.forEach((item, index) => {
    const rank = index + 1;

    const article = document.createElement("article");
    article.className = "search-result";

    // Rank number + title
    const h3 = document.createElement("h3");
    h3.textContent = `${rank}. ${item.title}`;
    article.append(h3);
    // 🔗 Preview Link (force open)
    if (item.link) {
      const button = document.createElement("button");
      button.textContent = "Preview Document";
      button.addEventListener("click", () => {
        window.open(item.link, "_blank", "noopener");
      });
      article.append(button);
    }
     // 🎓 Institution
     if (item.institution) {
      const inst = document.createElement("p");
      inst.textContent = `Institution: ${item.institution}`;
      article.append(inst);
    }
    

    container.append(article);
  });
}