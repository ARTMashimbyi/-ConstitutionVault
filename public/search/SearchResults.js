/**
 * Renders a list of search results into the given container element.
 * Each result object may have:
 *   • title: string
 *   • downloadURL: string           // changed from url to downloadURL
 *   • fileType: "document"|"image"|"audio"|"video"
 *   • author?: string
 *   • institution?: string
 *   • category?: string
 *   • keywords?: string[]
 *   • date?: string                 // ISO upload date
 *   • snippet?: string             // snippet of matched text
 *   • score?: string               // optional relevance score
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
  results.forEach(item => {
    const article = document.createElement("article");
    article.className = "search-result";

    // 3.1 Title (as a link)
    const h3 = document.createElement("h3");
    const link = document.createElement("a");
    if (item.downloadURL) {
      link.href = item.downloadURL;
      link.textContent = item.title || "Untitled Document";
      link.target = "_blank"; // optional: open in new tab
      link.rel = "noopener noreferrer";
    } else {
      link.textContent = item.title || "Untitled Document (No URL)";
      link.style.color = "gray";
      link.style.cursor = "default";
      link.href = "#";
      link.addEventListener("click", e => e.preventDefault());
      console.warn("Missing downloadURL for document:", item.title);
    }
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

    // 3.5 Media/document preview
    const fig = document.createElement("figure");
    let previewEl;

    switch (item.fileType) {
      case "image":
        if (item.downloadURL) {
          previewEl = document.createElement("img");
          previewEl.src = item.downloadURL;
          previewEl.alt = item.title || "Image preview";
        }
        break;

      case "audio":
        if (item.downloadURL) {
          previewEl = document.createElement("audio");
          previewEl.controls = true;
          previewEl.src = item.downloadURL;
        }
        break;

      case "video":
        if (item.downloadURL) {
          previewEl = document.createElement("video");
          previewEl.controls = true;
          previewEl.src = item.downloadURL;
        }
        break;

      default: // "document"
        if (item.downloadURL) {
          previewEl = document.createElement("embed");
          previewEl.src = `${item.downloadURL}#page=1&view=FitH`;
          previewEl.type = "application/pdf";
          previewEl.width = "100%";
          previewEl.height = "400px";
        }
    }

    if (previewEl) {
      previewEl.loading = "lazy";
      fig.appendChild(previewEl);
      article.appendChild(fig);
    } else {
      // If no preview available, show a placeholder message
      const noPreviewMsg = document.createElement("p");
      noPreviewMsg.textContent = "Preview not available";
      noPreviewMsg.style.fontStyle = "italic";
      article.appendChild(noPreviewMsg);
    }

    // 3.6 Single action: View in Full (same tab)
    const footer = document.createElement("footer");
    footer.className = "result-actions";

    const viewLink = document.createElement("a");
    if (item.downloadURL) {
      viewLink.href = item.downloadURL;
      viewLink.textContent = "View in Full";
      viewLink.className = "btn btn-primary";
      viewLink.target = "_blank";
      viewLink.rel = "noopener noreferrer";
    } else {
      viewLink.textContent = "View in Full (Unavailable)";
      viewLink.className = "btn btn-disabled";
      viewLink.style.color = "gray";
      viewLink.style.cursor = "default";
      viewLink.href = "#";
      viewLink.addEventListener("click", e => e.preventDefault());
    }

    footer.appendChild(viewLink);
    article.appendChild(footer);

    container.appendChild(article);
  });
}
