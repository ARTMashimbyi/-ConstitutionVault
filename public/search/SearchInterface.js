// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";
import { renderSortOptions }   from "./SortOptions.js";

const API_BASE = "http://localhost:4000";

export function initializeSearchInterface(containerId) {
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") document.body.classList.add("dark-mode");

  // multi‐value filters
  const parseList = str =>
    typeof str === "string" && str.trim()
      ? str.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];
  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // state
  let currentQuery = "";
  let currentType  = saved.type || "";
  let currentSort  = saved.sort || "";
  let dateFrom     = saved.allTime ? "" : saved.dateFrom || "";
  let dateTo       = saved.allTime ? "" : saved.dateTo   || "";
  const gridCols   = parseInt(saved.columns, 10) || 2;
  const snippetLen = parseInt(saved.snippetLength, 10) || 100;

  // synonyms fallback
  const synonyms = {
    vehicle: "car",
    vehicles: "car"
    // add more here as needed…
  };

  // map of file‐type keywords
  const typeMap = {
    video: "video", videos: "video", clip: "video",
    image: "image", images: "image", picture: "image",
    audio: "audio", audios: "audio", sound: "audio",
    text: "text", texts: "text", note: "text", notes: "text",
    presentation: "document", ppt: "document", slides: "document",
    document: "document", documents: "document", file: "document", files: "document"
  };

  // filler words to strip out
  const stopWords = new Set([
    "can","i","please","have","get","me","the","a","to","for","of","in",
    "do","you","uhm","um","uh"
  ]);

  // build UI
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);

  const wrapper   = document.createElement("section");
  wrapper.id      = "search-interface";
  wrapper.setAttribute("aria-label","ConstitutionVault Search Interface");

  const searchBar = renderSearchBar(q => { currentQuery = q; refreshResults(); });
  const filtersUI = renderFilters(f => { currentType = f.type; refreshResults(); });
  const sortUI    = renderSortOptions(s => { currentSort = s; refreshResults(); });

  filtersUI.querySelector("#filter-type").value = currentType;
  sortUI.querySelector("select").value         = currentSort;

  const resultsSection = document.createElement("section");
  resultsSection.id    = "search-results";
  resultsSection.style.display             = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols},1fr)`;
  resultsSection.style.gap                 = "1.5rem";

  wrapper.append(searchBar, filtersUI, sortUI, resultsSection);
  container.appendChild(wrapper);

  // initial load
  refreshResults();

  async function refreshResults() {
    let raw = (currentQuery || "").trim().toLowerCase();

    // strip filler words
    raw = raw.split(/\s+/).filter(w => !stopWords.has(w)).join(" ");

    // if no query at all, show every doc
    if (!raw) {
      await fetchAndRenderAll();
      return;
    }

    // look up synonyms first
    if (synonyms[raw]) raw = synonyms[raw];

    // detect & strip type keywords
    for (let kw in typeMap) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(raw)) {
        currentType = typeMap[kw];
        filtersUI.querySelector("#filter-type").value = currentType;
        raw = raw.replace(new RegExp(`\\b${kw}\\b`, "i"), "").trim();
        break;
      }
    }

    // build URL
    const qParam    = encodeURIComponent(raw);
    const typeParam = currentType ? `&type=${encodeURIComponent(currentType)}` : "";
    const sortParam = currentSort ? `&sort=${encodeURIComponent(currentSort)}` : "";
    const fromParam = dateFrom    ? `&dateFrom=${encodeURIComponent(dateFrom)}` : "";
    const toParam   = dateTo      ? `&dateTo=${encodeURIComponent(dateTo)}` : "";
    const url       = `${API_BASE}/api/search?query=${qParam}${typeParam}${sortParam}${fromParam}${toParam}`;

    resultsSection.innerHTML = "<p>🔄 Searching…</p>";

    try {
      const res = await fetch(url);
      const { results = [], message, error } = await res.json();

      if (error) {
        resultsSection.innerHTML = `<p>❌ ${error}</p>`;
        return;
      }

      // client‐side metadata filters
      const filtered = results.filter(item => {
        if (wantedAuthors.length      && !(item.author     && wantedAuthors.includes(item.author.toLowerCase()))) return false;
        if (wantedCategories.length   && !(item.category   && wantedCategories.includes(item.category.toLowerCase()))) return false;
        if (wantedInstitutions.length && !(item.institution && wantedInstitutions.includes(item.institution.toLowerCase()))) return false;
        if (wantedKeywords.length) {
          const kws = Array.isArray(item.keywords) ? item.keywords.map(k => k.toLowerCase()) : [];
          if (!wantedKeywords.some(w => kws.includes(w))) return false;
        }
        return true;
      });

      if (!filtered.length) {
        // no match → suggestion UI
        resultsSection.innerHTML = `
          <p class="no-results">😔 No matches for “${raw}”</p>
          <p style="text-align:center">
            🔍 Did you mean
            <button class="suggestion">show all</button>?
          </p>`;
        resultsSection.querySelector(".suggestion")
          .addEventListener("click", () => {
            // reset everything
            currentQuery = "";
            currentType  = "";
            currentSort  = "";
            dateFrom     = "";
            dateTo       = "";
            filtersUI.querySelector("#filter-type").value = "";
            sortUI.querySelector("select").value        = "";
            refreshResults();
          });
        return;
      }

      // truncate snippet
      filtered.forEach(item => {
        if (item.snippet && item.snippet.length > snippetLen) {
          item.snippet = item.snippet.slice(0, snippetLen) + "…";
        }
      });

      // render
      renderSearchResults(resultsSection, filtered);

    } catch (err) {
      console.error("Fetch error:", err);
      resultsSection.innerHTML = "<p>❌ Oops—something went wrong.</p>";
    }
  }

  // helper: load all docs, bypass query
  async function fetchAndRenderAll() {
    resultsSection.innerHTML = "<p>🔄 Loading all documents…</p>";
    try {
      const res = await fetch(`${API_BASE}/api/search?query=`);
      const { results = [], error } = await res.json();
      if (error) {
        resultsSection.innerHTML = `<p>❌ ${error}</p>`;
        return;
      }
      renderSearchResults(resultsSection, results);
    } catch (err) {
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Failed to load documents.</p>";
    }
  }
}
