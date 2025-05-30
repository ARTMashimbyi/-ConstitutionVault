// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container element.
 * Each result object may have:
 *   • title: string
 *   • downloadURL: string       // public file URL (used instead of url)
 *   • fileType: "document"|"image"|"audio"|"video"
 *   • author?: string
 *   • institution?: string
 *   • category?: string
 *   • keywords?: string[]
 *   • date?: string          // ISO upload date
 *   • snippet?: string       // snippet of matched text
 *   • score?: string         // optional relevance score
 *
 * @param {HTMLElement} container
 * @param {Array<Object>} results
 */
export function renderSearchResults(container, results) {
  // 1) Clear any existing results
  container.innerHTML = "";

  // 2) Handle no-results
  if (!Array.isArray(results) || results.length === 0) {
    const msg = document.createElement("p");
    msg.className = "no-results";
    msg.textContent = "No results to display.";
    container.appendChild(msg);
    return;
  }

  // 3) Render each result
  results.forEach((item) => {
    const article = document.createElement("article");
    article.className = "search-result";

    // Use downloadURL instead of url, with fallback to empty string
    const fileUrl = item.downloadURL || "";

    // 3.1 Title (as a link)
    const h3 = document.createElement("h3");
    const link = document.createElement("a");
    link.href = fileUrl || "#"; // fallback to '#' if no URL
    link.textContent = item.title || "Untitled";
    h3.appendChild(link);
    article.appendChild(h3);

    // 3.2 Optional relevance score
    if (item.score) {
      const scoreEl = document.createElement("small");
      scoreEl.className = "result-score";
      scoreEl.textContent = `Relevance: ${item.score}`;
      article.appendChild(scoreEl);
    }

    // 3.3 Metadata (author, institution, category, keywords, date)
    const metaParts = [];
    if (item.author) metaParts.push(`By ${item.author}`);
    if (item.institution) metaParts.push(item.institution);
    if (item.category) metaParts.push(`Category: ${item.category}`);
    if (Array.isArray(item.keywords) && item.keywords.length) {
      metaParts.push(`Keywords: ${item.keywords.join(", ")}`);
    }
    if (item.date) {
      const d = new Date(item.date);
      metaParts.push(`Date: ${d.toLocaleDateString()}`);
    }
    if (metaParts.length) {
      const meta = document.createElement("small");
      meta.className = "result-meta";
      meta.textContent = metaParts.join(" • ");
      article.appendChild(meta);
    }

    // 3.4 Snippet preview
    if (item.snippet) {
      const snipP = document.createElement("p");
      snipP.className = "result-snippet";
      snipP.textContent = item.snippet;
      article.appendChild(snipP);
    }

    // 3.5 Media/document preview (only show if URL exists)
    if (fileUrl) {
      const fig = document.createElement("figure");
      let previewEl;
      switch (item.fileType) {
        case "image":
          previewEl = document.createElement("img");
          previewEl.src = fileUrl;
          previewEl.alt = item.title || "Image preview";
          break;
        case "audio":
          previewEl = document.createElement("audio");
          previewEl.controls = true;
          previewEl.src = fileUrl;
          break;
        case "video":
          previewEl = document.createElement("video");
          previewEl.controls = true;
          previewEl.src = fileUrl;
          break;
        default: // "document"
          previewEl = document.createElement("embed");
          previewEl.src = `${fileUrl}#page=1&view=FitH`;
          previewEl.type = "application/pdf";
          previewEl.width = "100%";
          previewEl.height = "400px";
      }
      previewEl.loading = "lazy";
      fig.appendChild(previewEl);
      article.appendChild(fig);
    }

    // 3.6 Single action: View in Full (same tab)
    const footer = document.createElement("footer");
    footer.className = "result-actions";

    const viewLink = document.createElement("a");
    viewLink.href = fileUrl || "#";
    viewLink.textContent = "View in Full";
    viewLink.className = "btn btn-primary";

    footer.appendChild(viewLink);
    article.appendChild(footer);

    container.appendChild(article);
  });
}
