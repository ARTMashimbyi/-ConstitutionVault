// public/search/SearchBar.js

/**
 * Renders a search bar as a semantic <form> that auto‐searches on typing.
 * Includes a visually‐hidden <label> for accessibility.
 *
 * @param {(query: string) => void} onSearchCallback
 * @returns {HTMLFormElement}
 */
export function renderSearchBar(onSearchCallback) {
  // 1) Create the form
  const form = document.createElement("form");
  form.className = "search-bar";
  form.setAttribute("role", "search");

  // 2) Visually-hidden label for screen readers
  const label = document.createElement("label");
  label.className = "visually-hidden";
  label.htmlFor  = "search-input";
  label.textContent = "Search constitutional archive";

  // 3) The actual input
  const input = document.createElement("input");
  input.type        = "search";
  input.id          = "search-input";
  input.name        = "searchQuery";
  input.placeholder = "Search title, author, category, keywords…";
  input.className   = "search-input";
  input.setAttribute("aria-label", "Search");

  // 4) Prevent real form-submit
  form.addEventListener("submit", e => e.preventDefault());

  // 5) Debounce onInput
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      onSearchCallback(input.value.trim());
    }, 300);
  });

  // 6) Assemble
  form.append(label, input);
  return form;
}
