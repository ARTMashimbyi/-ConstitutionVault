// public/user_settings/settings.js

window.addEventListener("DOMContentLoaded", () => {
  const body     = document.body;
  const modes    = document.querySelectorAll(".mode-switcher button");
  const form     = document.getElementById("filterForm");

  // 1️⃣ Load saved settings
  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const themeClass = saved.themeClass || "";

  // 2️⃣ Apply saved theme
  if (themeClass) body.classList.add(themeClass);

  // 3️⃣ Highlight the active button
  modes.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === themeClass);
  });

  // 4️⃣ Wire mode buttons
  modes.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove any existing theme classes
      body.classList.remove("dark-mode", "solar-mode", "hc-mode");
      // Apply the new one (empty = default/light)
      const cls = btn.dataset.mode;
      if (cls) body.classList.add(cls);

      // Update button highlighting
      modes.forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // 5️⃣ Populate filter fields from saved
  ["author","category","keywords","institution"].forEach(key => {
    if (saved[key]) {
      const inp = document.getElementById(key);
      if (inp) inp.value = saved[key];
    }
  });

  // 6️⃣ Save & redirect
  form.addEventListener("submit", e => {
    e.preventDefault();
    // Find which mode button is active
    const activeBtn = Array.from(modes).find(b => b.classList.contains("active"));
    const newTheme = activeBtn?.dataset.mode || "";
    const settings = {
      themeClass:  newTheme,
      author:      form.author.value.trim(),
      category:    form.category.value.trim(),
      keywords:    form.keywords.value.trim(),
      institution: form.institution.value.trim()
    };
    localStorage.setItem("userSettings", JSON.stringify(settings));
    window.location.href = "../user-interface/user-search.html";
  });
});
