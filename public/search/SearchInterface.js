// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";
import { renderSortOptions }   from "./SortOptions.js";
import { API_BASE }            from "../shared/utils.js";

export function initializeSearchInterface(containerId) {
  // Pull in & apply saved UI settings
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") {
    document.body.classList.add("dark-mode");
  }

  // Helper: normalize CSV or array to lower-cased list
  const parseList = s =>
    Array.isArray(s)
      ? s.map(x => x.trim().toLowerCase()).filter(Boolean)
      : (typeof s === "string" && s.trim()
          ? s.split(",").map(x => x.trim().toLowerCase()).filter(Boolean)
          : []);

  // Frozen filters from settings
  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // Query / UI state
  let currentQuery = "";
  let currentType  = ""; // "" == All
  let currentSort  = saved.sort || "";
  let dateFrom     = saved.allTime ? "" : (saved.dateFrom || "");
  let dateTo       = saved.allTime ? "" : (saved.dateTo   || "");
  const snippetLen = parseInt(saved.snippetLength, 10) || 100;
  const gridCols   = parseInt(saved.columns,      10) || 2;

  // Container setup
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label", "Search Interface");

  // Results grid
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";
  resultsSection.style.display             = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols},1fr)`;
  resultsSection.style.gap                 = "1.5rem";

  // Debounce / abort setup
  let controller = null;
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Core fetch + render
  async function doRefresh() {
    // Cancel any in-flight request
    if (controller) controller.abort();
    controller = new AbortController();
    const { signal } = controller;

    // Build query string
    const params = [
      `query=${encodeURIComponent(currentQuery.trim())}`,
      currentType  ? `type=${encodeURIComponent(currentType)}`   : null,
      currentSort  ? `sort=${encodeURIComponent(currentSort)}`   : null,
      dateFrom     ? `dateFrom=${encodeURIComponent(dateFrom)}`  : null,
      dateTo       ? `dateTo=${encodeURIComponent(dateTo)}`      : null,
    ].filter(Boolean).join("&");

    resultsSection.innerHTML = "<p>🔄 Loading…</p>";

    try {
      const res = await fetch(`${API_BASE}/search?${params}`, { signal });
      const { results = [], error } = await res.json();
      if (error) {
        resultsSection.innerHTML = `<p>❌ ${error}</p>`;
        return;
      }

      // Client-side frozen filters
      const filtered = results.filter(item => {
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
          const kws = (item.keywords||[]).map(k => k.toLowerCase());
          if (!wantedKeywords.some(w => kws.includes(w))) return false;
        }
        return true;
      });

      if (!filtered.length) {
        resultsSection.innerHTML =
          `<p class="no-results">😔 No matches for your filters</p>`;
        return;
      }

      // Truncate snippets in-place
      filtered.forEach(it => {
        if (it.snippet && it.snippet.length > snippetLen) {
          it.snippet = it.snippet.slice(0, snippetLen) + "…";
        }
      });

      renderSearchResults(resultsSection, filtered);
    } catch (err) {
      if (err.name === "AbortError") {
        // ignore, will be superseded by next request
        return;
      }
      console.error(err);
      resultsSection.innerHTML = "<p>❌ Something went wrong.</p>";
    }
  }

  // Debounce by 300ms
  const refresh = debounce(doRefresh, 300);

  // Build UI pieces
  const searchBar = renderSearchBar(q => {
    currentQuery = q;
    refresh();
  });
  wrapper.append(searchBar);

  const filtersUI = renderFilters(f => {
    currentType = f.type;
    refresh();
  });
  // default TYPE to All
  const typeDropdown = filtersUI.querySelector("#filter-type");
  if (typeDropdown) typeDropdown.value = "";
  wrapper.append(filtersUI);

  const sortUI = renderSortOptions(s => {
    currentSort = s;
    refresh();
  });
  sortUI.querySelector("select").value = currentSort;
  wrapper.append(sortUI);

  wrapper.append(resultsSection);
  container.appendChild(wrapper);

  // Initial load
  refresh();
}
