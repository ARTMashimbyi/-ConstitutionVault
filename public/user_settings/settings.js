// public/user_settings/settings.js

window.addEventListener("DOMContentLoaded", () => {
  const body     = document.body;
  const modes    = document.querySelectorAll(".mode-switcher button");
  const form     = document.getElementById("filterForm");
  const resetBtn = document.getElementById("resetSettings");
  const backBtn  = document.getElementById("backButton");

  // Store last visited page (from referrer)
  const ref = document.referrer;
  let lastPage = "../user-interface/user-search.html";
  if (ref.includes("home.html")) lastPage = "../suggestions/home.html";
  else if (ref.includes("history.html")) lastPage = "../suggestions/history.html";
  localStorage.setItem("lastVisitedPage", lastPage);

  const saved      = JSON.parse(localStorage.getItem("userSettings") || "{}");
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

  function setInput(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = !!value;
    } else {
      el.value = value ?? "";
    }
  }

  // Fill fields from saved settings
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

  // Save Settings
  form.addEventListener("submit", e => {
    e.preventDefault();

    const activeBtn     = Array.from(modes).find(b => b.classList.contains("active"));
    const themeClass    = activeBtn?.dataset.mode || "";
    const allTimeChecked = form.elements.allTime.checked;

    const newSettings = {
      themeClass:    themeClass,
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
    const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
    window.location.href = back;
  });

  // Back button
  backBtn?.addEventListener("click", () => {
    const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
    window.location.href = back;
  });

  // Reset button
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("userSettings");
    window.location.reload();
  });
});
