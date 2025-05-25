// public/search/SearchInterface.js

// public/search/SearchInterface.js

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";
import { renderFilters }       from "./Filters.js";
import { renderSortOptions }   from "./SortOptions.js";

const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";


export function initializeSearchInterface(containerId) {
  // Get settings once (set in settings page)
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  if (saved.themeClass === "dark-mode") document.body.classList.add("dark-mode");

  // Parse helper (handles arrays or CSV)
  const parseList = s =>
    Array.isArray(s)
      ? s.map(x => x.trim().toLowerCase()).filter(Boolean)
      : (typeof s === "string" && s.trim()
        ? s.split(",").map(x => x.trim().toLowerCase()).filter(Boolean)
        : []);

  // Filter state (frozen to whatever was saved in settings)
  const wantedAuthors      = parseList(saved.author);
  const wantedCategories   = parseList(saved.category);
  const wantedInstitutions = parseList(saved.institution);
  const wantedKeywords     = parseList(saved.keywords);

  // Main state
  let currentQuery = "";
  let currentType  = saved.type && Array.isArray(saved.type) ? saved.type[0] : (saved.type || "");
  let currentSort  = saved.sort     || "";
  let dateFrom     = saved.allTime  ? "" : (saved.dateFrom || "");
  let dateTo       = saved.allTime  ? "" : (saved.dateTo   || "");
  const snippetLen = parseInt(saved.snippetLength,10) || 100;
  const gridCols   = parseInt(saved.columns,      10) || 2;

  // UI containers
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Missing #${containerId}`);
  const wrapper = document.createElement("section");
  wrapper.id = "search-interface";
  wrapper.setAttribute("aria-label","Search Interface");

  // Results grid
  const resultsSection = document.createElement("section");
  resultsSection.id = "search-results";
  resultsSection.style.display             = "grid";
  resultsSection.style.gridTemplateColumns = `repeat(${gridCols},1fr)`;
  resultsSection.style.gap                 = "1.5rem";

  // Search bar
  const searchBar = renderSearchBar(q => {
    currentQuery = q;
    refresh();
  });
  wrapper.append(searchBar);

  // Only render the TYPE and SORT dropdowns
  const filtersUI = renderFilters(f => {
    currentType = f.type;
    refresh();
  });
  filtersUI.querySelector("#filter-type").value = currentType;
  wrapper.append(filtersUI);

  const sortUI = renderSortOptions(s => {
    currentSort = s;
    refresh();
  });
  sortUI.querySelector("select").value = currentSort;
  wrapper.append(sortUI);

  wrapper.append(resultsSection);
  container.appendChild(wrapper);

  // --- Only ever use saved filters, never allow changes here ---

  async function refresh() {
    // build query params for main search
    const queryParams = [
      `query=${encodeURIComponent((currentQuery || "").trim())}`,
      currentType  ? `type=${encodeURIComponent(currentType)}` : null,
      currentSort  ? `sort=${encodeURIComponent(currentSort)}` : null,
      dateFrom     ? `dateFrom=${encodeURIComponent(dateFrom)}` : null,
      dateTo       ? `dateTo=${encodeURIComponent(dateTo)}`   : null
    ].filter(Boolean).join("&");

    resultsSection.innerHTML = "<p>🔄 Loading…</p>";
    try {
      const res = await fetch(`${API_BASE}/search?${queryParams}`);
      const { results = [], message, error } = await res.json();

      if (error) {
        resultsSection.innerHTML = `<p>❌ ${error}</p>`;
        return;
      }

      // Client‐side filter with the frozen filters from settings
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
        resultsSection.innerHTML =
          `<p class="no-results">😔 No matches for your filters</p>`;
        return;
      }

      // Truncate snippet
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

  // Initial load
  refresh();
}
