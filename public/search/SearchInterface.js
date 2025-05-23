// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";
import { renderSortOptions }   from "./SortOptions.js";

const API_BASE = "http://localhost:4000";

export function initializeSearchInterface(containerId) {
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") document.body.classList.add("dark-mode");

  // parse CSV lists from settings
  const parseList = s =>
    typeof s === "string" && s.trim()
      ? s.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean)
      : [];
  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // state
  let currentQuery = "";
  let currentType  = saved.type     || "";
  let currentSort  = saved.sort     || "";
  let dateFrom     = saved.allTime  ? "" : (saved.dateFrom || "");
  let dateTo       = saved.allTime  ? "" : (saved.dateTo   || "");
  const snippetLen = parseInt(saved.snippetLength,10) || 100;
  const gridCols   = parseInt(saved.columns,      10) || 2;

  // filler words
  const stopWords = new Set([
    "can","i","please","have","get","me","the","a","to","for","of","in",
    "do","you","uhm","um","uh"
  ]);

  // map spoken keywords → fileType
  const typeMap = {
    video:"video", videos:"video", clip:"video",
    image:"image", images:"image", picture:"image",
    audio:"audio", audios:"audio", sound:"audio",
    text:"text", texts:"text", note:"text", notes:"text",
    presentation:"document", ppt:"document", slides:"document",
    document:"document", documents:"document",
    file:"document", files:"document"
  };

  // build UI
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);

  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label","Search Interface");

  // Search bar
  const searchBar = renderSearchBar(q => {
    currentQuery = q;
    refresh();
  });

  // Type dropdown
  const filtersUI = renderFilters(f => {
    currentType = f.type;
    refresh();
  });
  filtersUI.querySelector("#filter-type").value = currentType;

  // Sort dropdown
  const sortUI = renderSortOptions(s => {
    currentSort = s;
    refresh();
  });
  sortUI.querySelector("select").value = currentSort;

  // Results grid
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";
  resultsSection.style.display             = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols},1fr)`;
  resultsSection.style.gap                 = "1.5rem";

  wrapper.append(searchBar, filtersUI, sortUI, resultsSection);
  container.appendChild(wrapper);

  // initial load
  refresh();

  async function refresh() {
    // normalize & strip filler words
    let raw = (currentQuery||"").trim().toLowerCase()
      .split(/\s+/).filter(w=>!stopWords.has(w)).join(" ");

    // detect & strip ONE type keyword (without erasing entire query)
    for (let kw in typeMap) {
      const rx = new RegExp(`\\b${kw}\\b`,"i");
      if (rx.test(raw)) {
        currentType = typeMap[kw];
        filtersUI.querySelector("#filter-type").value = currentType;
        raw = raw.replace(rx,"").trim();
        break;
      }
    }

    // if nothing typed AND no other filters, do full “load all”
    const noText = !raw;
    const anyFilter = !!(currentType || currentSort || dateFrom || dateTo);
    if (noText && !anyFilter) {
      return fetchAllDocuments();
    }

    // build URL with whatever is set
    const parts = [
      `query=${encodeURIComponent(raw)}`,
      currentType  ? `type=${encodeURIComponent(currentType)}` : null,
      currentSort  ? `sort=${encodeURIComponent(currentSort)}` : null,
      dateFrom     ? `dateFrom=${encodeURIComponent(dateFrom)}` : null,
      dateTo       ? `dateTo=${encodeURIComponent(dateTo)}`   : null
    ].filter(Boolean).join("&");

    const url = `${API_BASE}/api/search?${parts}`;
    resultsSection.innerHTML = raw
      ? "<p>🔄 Searching…</p>"
      : "<p>🔄 Applying filters…</p>";

    try {
      const res = await fetch(url);
      const { results = [], message, error } = await res.json();

      if (error) {
        return resultsSection.innerHTML = `<p>❌ ${error}</p>`;
      }

      // client‐side author/category/keyword filters
      const filtered = results.filter(item=>{
        if (wantedAuthors.length &&
            !(item.author && wantedAuthors.includes(item.author.toLowerCase())))
          return false;
        if (wantedCategories.length &&
            !(item.category && wantedCategories.includes(item.category.toLowerCase())))
          return false;
        if (wantedInstitutions.length &&
            !(item.institution && wantedInstitutions.includes(item.institution.toLowerCase())))
          return false;
        if (wantedKeywords.length) {
          const kws = (item.keywords||[]).map(k=>k.toLowerCase());
          if (!wantedKeywords.some(w=>kws.includes(w))) return false;
        }
        return true;
      });

      if (!filtered.length) {
        return resultsSection.innerHTML =
          `<p class="no-results">😔 No matches for “${raw}”</p>`;
      }

      // truncate snippet
      filtered.forEach(it=>{
        if (it.snippet && it.snippet.length > snippetLen) {
          it.snippet = it.snippet.slice(0, snippetLen)+"…";
        }
      });

      renderSearchResults(resultsSection, filtered);

    } catch(err) {
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Something went wrong.</p>";
    }
  }

  // load everything at once
  async function fetchAllDocuments() {
    resultsSection.innerHTML = "<p>🔄 Loading all documents…</p>";
    try {
      const res = await fetch(`${API_BASE}/api/search?query=`);
      const { results = [], error } = await res.json();
      if (error) {
        resultsSection.innerHTML = `<p>❌ ${error}</p>`;
        return;
      }
      renderSearchResults(resultsSection, results);
    } catch(err) {
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Failed to load documents.</p>";
    }
  }
}
