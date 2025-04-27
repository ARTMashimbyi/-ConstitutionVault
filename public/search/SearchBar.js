// public/search/SearchBar.js

/**
 * Renders a semantic search form (no divs!) with input and submit button.
 * @param {(query: string) => void} onSubmitCallback
 * @returns {HTMLFormElement}
 */
export function renderSearchBar(onSubmitCallback) {
  // Use a <form> with role="search" instead of a div
  const form = document.createElement("form");
  form.className = "search-bar";
  form.setAttribute("role", "search");

  // Search input
  const input = document.createElement("input");
  input.type = "search";
  input.name = "query";
  input.placeholder = "Enter search query…";
  input.className = "search-input";

  // Submit button
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "search-button";
  button.textContent = "Search";

  // Handle both click and Enter via form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    onSubmitCallback(q);
  });

  // Compose
  form.append(input, button);

  return form;
}
