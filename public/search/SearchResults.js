// public/search/SearchResults.js

/**
 * Renders a list of search results into the given container element.
 * Each result object must have:
 *   • title: string
 *   • url: string
 *   • fileType: "document"|"image"|"audio"|"video"
 *   • description?: string
 *
 * @param {HTMLElement} container
 * @param {Array<{ title: string, url: string, fileType: string, description?: string }>} results
 */
export function renderSearchResults(container, results) {
  // Clear any existing content
  container.innerHTML = "";

  // No-results message
  if (!results || results.length === 0) {
    const msg = document.createElement("p");
    msg.className   = "no-results";
    msg.textContent = "No results found.";
    container.append(msg);
    return;
  }

  // Render each item
  results.forEach(item => {
    const article = document.createElement("article");
    article.className = "search-result";

    // Title
    const h3 = document.createElement("h3");
    h3.textContent = item.title;
    article.append(h3);

    // Description
    if (item.description) {
      const p = document.createElement("p");
      p.textContent = item.description;
      article.append(p);
    }

    // Inline preview for supported types
    switch (item.fileType) {
      case "image": {
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.title;
        article.append(img);
        break;
      }
      case "audio": {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src      = item.url;
        article.append(audio);
        break;
      }
      case "video": {
        const video = document.createElement("video");
        video.controls = true;
        video.src      = item.url;
        article.append(video);
        break;
      }
      case "document": {
        // PDF embed preview
        const embed = document.createElement("embed");
        embed.src    = item.url;
        embed.type   = "application/pdf";
        embed.width  = "100%";
        embed.height = "400px";
        article.append(embed);
        break;
      }
    }

    // Actions footer (no <div>)
    const footer = document.createElement("footer");
    footer.className = "result-actions";

    // Preview link (opens in new tab)
    const previewLink = document.createElement("a");
    previewLink.href        = item.url;
    previewLink.target      = "_blank";
    previewLink.rel         = "noopener";
    previewLink.textContent = "Preview";
    footer.append(previewLink);

    // Download link (native download via <a download>)
    const downloadLink = document.createElement("a");
    downloadLink.href        = item.url;
    downloadLink.download    = item.title || "";
    downloadLink.textContent = "Download";
    footer.append(downloadLink);

    article.append(footer);
    container.append(article);
  });
}
