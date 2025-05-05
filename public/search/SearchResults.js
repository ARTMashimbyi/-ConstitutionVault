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
<<<<<<< HEAD
  // Clear any previous results
  container.innerHTML = '';
=======
  // 1) Clear any existing results
  container.innerHTML = "";
>>>>>>> ad896a039b80097861da9eab0a2a2739fe661bbe

  // 2) Handle no-results
  if (!Array.isArray(results) || results.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = "No results found.";
    container.appendChild(msg);
    return;
  }

<<<<<<< HEAD
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
=======
  // 3) Render each result
  results.forEach(item => {
    const article = document.createElement("article");
    article.className = "search-result";

    // 3.1 Title
    const h3 = document.createElement("h3");
    h3.textContent = item.title;
    article.appendChild(h3);

    // 3.2 Metadata
    const metaParts = [];
    if (item.author)      metaParts.push(`By ${item.author}`);
    if (item.institution) metaParts.push(item.institution);
    if (item.category)    metaParts.push(`Category: ${item.category}`);
    if (Array.isArray(item.keywords) && item.keywords.length) {
      metaParts.push(`Keywords: ${item.keywords.join(", ")}`);
    }
    if (metaParts.length) {
      const meta = document.createElement("small");
      meta.textContent = metaParts.join(" • ");
      article.appendChild(meta);
    }

    // 3.3 Description
    if (item.description) {
      const p = document.createElement("p");
      p.textContent = item.description;
      article.appendChild(p);
    }

    // 3.4 Snippet preview
    const fig = document.createElement("figure");
    let previewEl;
    switch (item.fileType) {
      case "image":
        previewEl = document.createElement("img");
        previewEl.src = item.url;
        previewEl.alt = item.title;
        break;
      case "audio":
        previewEl = document.createElement("audio");
        previewEl.controls = true;
        previewEl.src      = item.url;
        break;
      case "video":
        previewEl = document.createElement("video");
        previewEl.controls = true;
        previewEl.src      = item.url;
        break;
      case "document":
      default:
        previewEl = document.createElement("embed");
        previewEl.src    = `${item.url}#page=1&view=FitH`;
        previewEl.type   = "application/pdf";
        previewEl.width  = "100%";
        previewEl.height = "400px";
        break;
    }
    previewEl.loading = "lazy";
    fig.appendChild(previewEl);
    article.appendChild(fig);

    // 3.5 Single action: View in Full
    const footer = document.createElement("footer");
    footer.className = "result-actions";

    const viewLink = document.createElement("a");
    viewLink.href        = item.url;
    // open in the same tab so browser back button works
    viewLink.target      = "_self";
    viewLink.textContent = "View in Full";
    viewLink.className   = "btn btn-primary";

    footer.appendChild(viewLink);
    article.appendChild(footer);

    container.appendChild(article);
>>>>>>> ad896a039b80097861da9eab0a2a2739fe661bbe
  });
}