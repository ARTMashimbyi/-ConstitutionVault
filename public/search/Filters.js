// public/search/Filters.js

/**
 * Renders a filter control for “type”.
 * Calls onFilterChange({ type }) whenever the select changes.
 *
 * @param {(filters: {type: string}) => void} onFilterChange
 * @returns {HTMLDivElement}
 */
export function renderFilters(onFilterChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "filters";

  // Type filter
  const label = document.createElement("label");
  label.htmlFor = "filter-type";
  label.textContent = "Type:";

  const select = document.createElement("select");
  select.id = "filter-type";
  select.innerHTML = `
    <option value="">All</option>
    <option value="document">Document</option>
    <option value="text">Text</option>
    <option value="image">Image</option>
    <option value="video">Video</option>
    <option value="audio">Audio</option>
  `;

  select.addEventListener("change", () => {
    onFilterChange({ type: select.value });
  });

  wrapper.append(label, select);
  return wrapper;
}
