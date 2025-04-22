// public/search/SearchBar.js

/**
 * Renders a search bar with input and button, wiring up callbacks.
 * @param {(query: string) => void} onSubmitCallback
 * @returns {HTMLDivElement}
 */
function renderSearchBar(onSubmitCallback) {
  const wrapper = document.createElement("div");
  wrapper.className = "search-bar";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter search query...";
  input.className = "search-input";

  const button = document.createElement("button");
  button.innerText = "Search";
  button.className = "search-button";

  // Submit on click
  button.addEventListener("click", () => {
    const query = input.value.trim();
    onSubmitCallback(query);
  });

  // Submit on Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = input.value.trim();
      onSubmitCallback(query);
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(button);

  return wrapper;
}

module.exports = { renderSearchBar };
