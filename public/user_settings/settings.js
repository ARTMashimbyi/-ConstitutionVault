// public/user_settings/settings.js

window.addEventListener("DOMContentLoaded", () => {
  const body      = document.body;
  const modes     = document.querySelectorAll(".mode-switcher button");
  const form      = document.getElementById("filterForm");
  const resetBtn  = document.getElementById("resetSettings");

  // 1️⃣ Load saved settings (or defaults)
  const saved      = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const themeClass = saved.themeClass || "";

  // 2️⃣ Apply saved theme class
  if (themeClass) body.classList.add(themeClass);

  // 3️⃣ Highlight active mode button
  modes.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === themeClass);
  });

  // 4️⃣ Wire up mode buttons
  modes.forEach(btn => {
    btn.addEventListener("click", () => {
      // remove all theme classes
      body.classList.remove("dark-mode", "solar-mode", "hc-mode");
      // apply the clicked one
      const cls = btn.dataset.mode;
      if (cls) body.classList.add(cls);
      // update active button styling
      modes.forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // 5️⃣ Helper to populate input/select/checkbox
  function setInput(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = !!value;
    } else {
      el.value = value ?? "";
    }
  }

  // 6️⃣ Populate all fields from saved settings
  setInput("author",        saved.author);
  setInput("category",      saved.category);
  setInput("keywords",      saved.keywords);
  setInput("institution",   saved.institution);
  setInput("type",          saved.type);
  setInput("sort",          saved.sort);
  setInput("columns",       saved.columns);
  setInput("pageSize",      saved.pageSize);
  setInput("dateFrom",      saved.dateFrom);
  setInput("dateTo",        saved.dateTo);
  setInput("allTime",       saved.allTime);
  setInput("snippetLength", saved.snippetLength);

  // 7️⃣ On form submit, gather everything and save
  form.addEventListener("submit", e => {
    e.preventDefault();

    // which theme is active?
    const activeBtn     = Array.from(modes).find(b => b.classList.contains("active"));
    const newThemeClass = activeBtn?.dataset.mode || "";

    // if "All Time" is checked, blank out dates
    const allTimeChecked = form.elements.allTime.checked;

    const newSettings = {
      themeClass:    newThemeClass,
      author:        form.elements.author.value.trim(),
      category:      form.elements.category.value.trim(),
      keywords:      form.elements.keywords.value.trim(),
      institution:   form.elements.institution.value.trim(),
      type:          form.elements.type.value,
      sort:          form.elements.sort.value,
      columns:       form.elements.columns.value,
      pageSize:      form.elements.pageSize.value,
      dateFrom:      allTimeChecked ? "" : form.elements.dateFrom.value,
      dateTo:        allTimeChecked ? "" : form.elements.dateTo.value,
      allTime:       allTimeChecked,
      snippetLength: form.elements.snippetLength.value
    };

    localStorage.setItem("userSettings", JSON.stringify(newSettings));
    window.location.href = "../user-interface/user-search.html";
  });

  // 8️⃣ Reset button clears all settings and reloads defaults
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("userSettings");
    window.location.reload();
  });
});
