const API_BASE = "http://localhost:4000";

window.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const modes = document.querySelectorAll(".mode-switcher button");
  const form = document.getElementById("filterForm");
  const resetBtn = document.getElementById("resetButton");
  const backBtn = document.getElementById("backButton");

  // Track last visited page
  const ref = document.referrer;
  let lastPage = "../user-interface/user-search.html";
  if (ref.includes("home.html")) lastPage = "../suggestions/home.html";
  else if (ref.includes("history.html")) lastPage = "../suggestions/history.html";
  localStorage.setItem("lastVisitedPage", lastPage);

  // Theme
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const themeClass = saved.themeClass || "";
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
  const filterState = {
    author: [],
    category: [],
    keywords: [],
    institution: [],
    fileType: []
  };
  filterFields.forEach(field => {
    if (saved[field]) filterState[field] = Array.isArray(saved[field]) ? saved[field] : [saved[field]];
  });
  if (saved.type) filterState.fileType = Array.isArray(saved.type) ? saved.type : [saved.type];

  // ---- Render dynamic filter group ----
  function renderDropdownOptions(field, containerId, values, selectedValues = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!values.length) {
      container.innerHTML = '<div class="loading-indicator">No options</div>';
      return;
    }

    // Search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = `Search ${field}s...`;
    searchInput.className = "filter-search";
    searchInput.style.marginBottom = "0.5em";
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      Array.from(container.querySelectorAll(".option-item")).forEach(opt => {
        const txt = opt.textContent.toLowerCase();
        opt.style.display = txt.includes(term) ? "" : "none";
      });
    });

    // "Select All" button
    const selectAllBtn = document.createElement("button");
    selectAllBtn.type = "button";
    selectAllBtn.className = "toggle-all";
    selectAllBtn.textContent = "Select All";
    selectAllBtn.style.float = "right";
    selectAllBtn.style.marginBottom = "0.5em";
    selectAllBtn.addEventListener("click", () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => { cb.checked = !allChecked; });
      updateFilterStateFromDOM(field, container);
    });

    // Header (search + select all)
    const headerDiv = document.createElement("div");
    headerDiv.style.overflow = "auto";
    headerDiv.style.marginBottom = "0.3em";
    headerDiv.appendChild(searchInput);
    headerDiv.appendChild(selectAllBtn);
    container.appendChild(headerDiv);

    // Options
    values.forEach(value => {
      const option = document.createElement("div");
      option.className = "option-item";
      const checkboxId = `${field}-${value.replace(/\s+/g, "-").toLowerCase()}`;
      const checked = selectedValues.includes(value);
      option.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="${checkboxId}" name="${field}" value="${value}" ${checked ? "checked" : ""}>
          <span class="checkmark"></span>
          <span class="label-text">${value}</span>
        </label>
      `;
      container.appendChild(option);
    });
  }

  function renderFileTypeOptions(values, selectedValues = [], restrictDocText = false) {
    document.querySelectorAll('input[name="fileTypes"]').forEach(checkbox => {
      if (restrictDocText) {
        if (checkbox.value === "document" || checkbox.value === "text") {
          checkbox.disabled = false;
          checkbox.checked = true;
        } else {
          checkbox.disabled = true;
          checkbox.checked = false;
        }
      } else {
        const enabled = values.includes(checkbox.value);
        checkbox.disabled = !enabled;
        checkbox.checked = enabled && selectedValues.includes(checkbox.value);
      }
    });
  }

  function updateFilterStateFromDOM(field, container) {
    filterState[field] = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    applyLogicAndPopulate();
  }

  // Main logic: manage filter options and file type rules
  async function applyLogicAndPopulate() {
    // 1. Author filter logic for file types
    const restrictDocText = filterState.author.length > 0;

    if (restrictDocText) {
      filterState.fileType = ["document", "text"];
    }

    // 2. Build API params from filter state
    const params = new URLSearchParams();
    filterFields.concat(["fileType"]).forEach(field => {
      if (filterState[field] && filterState[field].length)
        params.append(field === "fileType" ? "fileType" : field, JSON.stringify(filterState[field]));
    });

    // 3. Fetch valid filter options from backend
    const res = await fetch(`${API_BASE}/api/filters/options?${params.toString()}`);
    const data = await res.json();

    // 4. Render filter UIs
    renderDropdownOptions("author", "authorOptions", data.authors, filterState.author);
    renderDropdownOptions("category", "categoryOptions", data.categories, filterState.category);
    renderDropdownOptions("keywords", "keywordOptions", data.keywords, filterState.keywords);
    renderDropdownOptions("institution", "institutionOptions", data.institutions, filterState.institution);

    // 5. File type UI
    renderFileTypeOptions(data.fileTypes, filterState.fileType, restrictDocText);

    // 6. Set up listeners
    setUpAllListeners();

    // 7. If author is now unselected and fileType doesn't match available, fix it
    if (!restrictDocText) {
      const valid = data.fileTypes;
      const stillSelected = filterState.fileType.filter(ft => valid.includes(ft));
      if (!stillSelected.length) {
        filterState.fileType = [...valid];
        renderFileTypeOptions(data.fileTypes, filterState.fileType, false);
      }
    }
  }

  function setUpAllListeners() {
    filterFields.forEach(field => {
      const container = document.getElementById(field + "Options");
      if (!container) return;
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => updateFilterStateFromDOM(field, container);
      });
    });
    document.querySelectorAll('input[name="fileTypes"]').forEach(cb => {
      cb.onchange = () => {
        filterState.fileType = Array.from(document.querySelectorAll('input[name="fileTypes"]:checked')).map(cb => cb.value);
        applyLogicAndPopulate();
      };
    });
  }

  // Initial load
  await applyLogicAndPopulate();

  // Save settings
  form.addEventListener("submit", e => {
    e.preventDefault();
    const activeBtn = Array.from(modes).find(b => b.classList.contains("active"));
    const themeClass = activeBtn?.dataset.mode || "";
    const allTimeChecked = form.elements.allTime.checked;

    const newSettings = {
      themeClass: themeClass,
      author: filterState.author.length > 0 ? filterState.author : null,
      category: filterState.category.length > 0 ? filterState.category : null,
      keywords: filterState.keywords.length > 0 ? filterState.keywords : null,
      institution: filterState.institution.length > 0 ? filterState.institution : null,
      type: filterState.fileType.length > 0 ? (filterState.fileType.length === 5 ? null : filterState.fileType) : null,
      sort: form.elements.sort.value,
      columns: form.elements.columns.value,
      pageSize: form.elements.pageSize.value,
      dateFrom: allTimeChecked ? "" : form.elements.dateFrom.value,
      dateTo: allTimeChecked ? "" : form.elements.dateTo.value,
      allTime: allTimeChecked,
      snippetLength: form.elements.snippetLength.value
    };

    localStorage.setItem("userSettings", JSON.stringify(newSettings));
    const notification = document.createElement("div");
    notification.className = "notification success";
    notification.textContent = "Settings saved successfully!";
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
      const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
      window.location.href = back;
    }, 1500);
  });

  // Back/Reset
  backBtn?.addEventListener("click", () => {
    const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
    window.location.href = back;
  });

  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("userSettings");
      window.location.reload();
    }
  });

  // Date logic
  const allTimeCheckbox = document.getElementById("allTime");
  const dateFromInput = document.getElementById("dateFrom");
  const dateToInput = document.getElementById("dateTo");
  function toggleDateInputs() {
    const disabled = allTimeCheckbox.checked;
    dateFromInput.disabled = disabled;
    dateToInput.disabled = disabled;
  }
  allTimeCheckbox.addEventListener("change", toggleDateInputs);
  toggleDateInputs();
});
