// public/settings/settings.js

import { API_BASE } from "../shared/utils.js";

window.addEventListener("DOMContentLoaded", async () => {
  const body    = document.body;
  const modes   = document.querySelectorAll(".mode-switcher button");
  const form    = document.getElementById("filterForm");
  const resetBtn= document.getElementById("resetButton");
  const backBtn = document.getElementById("backButton");

  // Track last visited page
  {
    const ref = document.referrer;
    let lastPage = "../user-interface/user-search.html";
    if (ref.includes("home.html"))      lastPage = "../suggestions/home.html";
    else if (ref.includes("history.html")) lastPage = "../suggestions/history.html";
    localStorage.setItem("lastVisitedPage", lastPage);
  }

  // Theme
  const saved     = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const themeClass= saved.themeClass || "";
  if (themeClass) body.classList.add(themeClass);
  modes.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === themeClass);
    btn.addEventListener("click", () => {
      body.classList.remove("dark-mode", "solar-mode", "hc-mode");
      const cls = btn.dataset.mode;
      if (cls) body.classList.add(cls);
      modes.forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // Filter state
  const filterFields = ["author", "category", "keywords", "institution"];
  const filterState  = {
    author: [], category: [], keywords: [], institution: [], fileType: []
  };

  filterFields.forEach(f => {
    if (saved[f]) {
      filterState[f] = Array.isArray(saved[f]) ? saved[f] : [saved[f]];
    }
  });
  if (saved.type) {
    filterState.fileType = Array.isArray(saved.type)
      ? saved.type
      : [saved.type];
  }

  // ---- UI rendering functions ----
  function renderDropdownOptions(field, containerId, values, selectedValues = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!values.length) {
      container.innerHTML = `<div class="loading-indicator">No options</div>`;
      return;
    }

    // Search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = `Search ${field}s...`;
    searchInput.className = "filter-search";
    searchInput.addEventListener("input", e => {
      const term = e.target.value.toLowerCase();
      container.querySelectorAll(".option-item").forEach(opt => {
        opt.style.display =
          opt.textContent.toLowerCase().includes(term) ? "" : "none";
      });
    });

    // Select All toggle
    const selectAllBtn = document.createElement("button");
    selectAllBtn.type = "button";
    selectAllBtn.className = "toggle-all";
    selectAllBtn.textContent = "Select All";
    selectAllBtn.addEventListener("click", () => {
      const allChecked = Array.from(
        container.querySelectorAll('input[type="checkbox"]')
      ).every(cb => cb.checked);
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = !allChecked;
      });
      updateFilterStateFromDOM(field, container);
    });

    // Header (search + select)
    const header = document.createElement("menu");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.appendChild(searchInput);
    header.appendChild(selectAllBtn);
    container.appendChild(header);

    // Options list
    values.forEach(val => {
      const option = document.createElement("menu");
      option.className = "option-item";
      const id   = `${field}-${val.replace(/\s+/g,"-").toLowerCase()}`;
      const chk  = selectedValues.includes(val) ? "checked" : "";
      option.innerHTML = `
        <label class="checkbox-container">
          <input
            type="checkbox"
            id="${id}"
            name="${field}"
            value="${val}"
            ${chk}
          />
          <span class="checkmark"></span>
          <span class="label-text">${val}</span>
        </label>
      `;
      container.appendChild(option);
    });
  }

  function renderFileTypeOptions(values, selectedValues = [], restrictDocText = false) {
    document.querySelectorAll('input[name="fileTypes"]').forEach(cb => {
      if (restrictDocText) {
        // only allow docs/text when author filter is active
        const ok = cb.value === "document" || cb.value === "text";
        cb.disabled = !ok;
        cb.checked  = ok;
      } else {
        const ok = values.includes(cb.value);
        cb.disabled = !ok;
        cb.checked  = ok && selectedValues.includes(cb.value);
      }
    });
  }

  function updateFilterStateFromDOM(field, container) {
    filterState[field] = Array.from(
      container.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    applyLogicAndPopulate();
  }

  function setUpAllListeners() {
    filterFields.forEach(field => {
      const c = document.getElementById(field + "Options");
      if (!c) return;
      c.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => updateFilterStateFromDOM(field, c);
      });
    });
    document.querySelectorAll('input[name="fileTypes"]').forEach(cb => {
      cb.onchange = () => {
        filterState.fileType = Array.from(
          document.querySelectorAll('input[name="fileTypes"]:checked')
        ).map(x => x.value);
        applyLogicAndPopulate();
      };
    });
  }

  // ---- Core logic & initial population ----
  async function applyLogicAndPopulate() {
    // if an author is selected, restrict to docs/text
    const restrictDocText = filterState.author.length > 0;
    if (restrictDocText) {
      filterState.fileType = ["document", "text"];
    }

    // build query params
    const params = new URLSearchParams();
    [...filterFields, "fileType"].forEach(f => {
      if (filterState[f]?.length) {
        params.append(
          f === "fileType" ? f : f,
          JSON.stringify(filterState[f])
        );
      }
    });

    // fetch dynamic options
    const res  = await fetch(`${API_BASE}/filters/options?${params}`);
    const data = await res.json();

    // re-render UIs
    renderDropdownOptions("author",      "authorOptions",      data.authors,      filterState.author);
    renderDropdownOptions("category",    "categoryOptions",    data.categories,   filterState.category);
    renderDropdownOptions("keywords",    "keywordOptions",      data.keywords,     filterState.keywords);
    renderDropdownOptions("institution", "institutionOptions",  data.institutions, filterState.institution);
    renderFileTypeOptions(data.fileTypes, filterState.fileType, restrictDocText);

    setUpAllListeners();

    // if nothing selected & no restriction, default to all fileTypes
    if (!restrictDocText && !filterState.fileType.length) {
      filterState.fileType = [...data.fileTypes];
      renderFileTypeOptions(data.fileTypes, filterState.fileType, false);
    }
  }

  // run it
  await applyLogicAndPopulate();

  // ---- Save & navigation ----
  form.addEventListener("submit", e => {
    e.preventDefault();
    // get theme
    const activeBtn = Array.from(modes).find(b => b.classList.contains("active"));
    const theme     = activeBtn?.dataset.mode || "";

    // detect “all file types”
    const totalTypes = (new Set(document.querySelectorAll('input[name="fileTypes"]')))
      .size;
    const typeSetting = 
      !filterState.fileType.length ||
      filterState.fileType.length === totalTypes
        ? null
        : filterState.fileType;

    const allTime = form.elements.allTime.checked;
    const newSettings = {
      themeClass:    theme,
      author:        filterState.author.length      ? filterState.author      : null,
      category:      filterState.category.length    ? filterState.category    : null,
      keywords:      filterState.keywords.length    ? filterState.keywords    : null,
      institution:   filterState.institution.length ? filterState.institution : null,
      type:          typeSetting,
      sort:          form.elements.sort.value,
      columns:       form.elements.columns.value,
      pageSize:      form.elements.pageSize.value,
      dateFrom:      allTime ? "" : form.elements.dateFrom.value,
      dateTo:        allTime ? "" : form.elements.dateTo.value,
      allTime:       allTime,
      snippetLength: form.elements.snippetLength.value
    };

    localStorage.setItem("userSettings", JSON.stringify(newSettings));

    // success notification
    const note = document.createElement("menu");
    note.className = "notification success";
    note.textContent = "Settings saved successfully!";
    document.body.appendChild(note);

    setTimeout(() => {
      note.remove();
      const back = localStorage.getItem("lastVisitedPage")
                   || "../user-interface/user-search.html";
      window.location.href = back;
    }, 1500);
  });

  backBtn?.addEventListener("click", () => {
    const back = localStorage.getItem("lastVisitedPage")
                 || "../user-interface/user-search.html";
    window.location.href = back;
  });

  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all settings to default?")) {
      localStorage.removeItem("userSettings");
      window.location.reload();
    }
  });

  // date inputs enable/disable
  {
    const allTimeCheckbox = document.getElementById("allTime");
    const fromInput       = document.getElementById("dateFrom");
    const toInput         = document.getElementById("dateTo");
    function toggleDates() {
      const d = allTimeCheckbox.checked;
      fromInput.disabled = d;
      toInput.disabled   = d;
    }
    allTimeCheckbox.addEventListener("change", toggleDates);
    toggleDates();
  }
});
