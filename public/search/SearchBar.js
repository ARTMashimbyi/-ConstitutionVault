// public/search/SearchBar.js

/**
 * Renders a search bar as a <form> that auto-submits on typing (debounced).
 * @param {(query: string) => void} onSearchCallback
 * @returns {HTMLFormElement}
 */
export function renderSearchBar(onSearchCallback) {
  // Use a <form> so we stay semantic and never use a <div>
  const form = document.createElement("form");
  form.className = "search-bar";

  const input = document.createElement("input");
  input.type        = "search";
  input.name        = "searchQuery";
  input.placeholder = "Start typing to search…";
  input.className   = "search-input";

  form.append(input);

  // Prevent the form from actually submitting & reloading
  form.addEventListener("submit", e => e.preventDefault());

  // Debounce input so we only fire after 300ms of no typing
  let timeoutId;
  input.addEventListener("input", () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      onSearchCallback(input.value.trim());
    }, 300);
  });

  return form;
}
