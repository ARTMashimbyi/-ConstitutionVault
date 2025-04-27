// public/search/SearchBar.js

/**
 * Renders a search bar as a form, wiring up the onSubmitCallback.
 * @param {(query: string) => void} onSubmitCallback
 * @returns {HTMLFormElement}
 */
export function renderSearchBar(onSubmitCallback) {
  // Create a <form> to handle both button click and Enter key
  const form = document.createElement("form");
  form.className = "search-bar";

  // Text input
  const input = document.createElement("input");
  input.type        = "text";
  input.placeholder = "Enter search query…";
  input.className   = "search-input";
  input.name        = "searchQuery";

  // Submit button
  const button = document.createElement("button");
  button.type        = "submit";
  button.textContent = "Search";
  button.className   = "search-button";

  // When the form is submitted (click or Enter), call the callback
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    onSubmitCallback(query);
  });

  // Assemble
  form.append(input, button);
  return form;
}
