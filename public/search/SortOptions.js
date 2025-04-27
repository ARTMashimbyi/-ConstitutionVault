// public/search/SortOptions.js

/**
 * Renders semantic sort controls (no divs!) as a dropdown.
 * Calls onSortChange with one of:
 *   ""            – default (no sorting)
 *   "title-asc"   – Title ascending
 *   "title-desc"  – Title descending
 *   "year-asc"    – Year ascending
 *   "year-desc"   – Year descending
 *
 * @param {(sortValue: string) => void} onSortChange
 * @returns {HTMLFieldSetElement}
 */
export function renderSortOptions(onSortChange) {
  // Use a fieldset for grouping sort controls
  const fieldset = document.createElement("fieldset");
  fieldset.className = "sort-options";
  fieldset.setAttribute("aria-label", "Sort results");

  const legend = document.createElement("legend");
  legend.textContent = "Sort by";
  fieldset.appendChild(legend);

  const label = document.createElement("label");
  label.htmlFor = "sort-select";
  label.textContent = "Sort by:";
  fieldset.appendChild(label);

  const select = document.createElement("select");
  select.id = "sort-select";
  select.name = "sort";
  select.innerHTML = `
    <option value="">Default</option>
    <option value="title-asc">Title ↑</option>
    <option value="title-desc">Title ↓</option>
    <option value="year-asc">Year ↑</option>
    <option value="year-desc">Year ↓</option>
  `;
  select.addEventListener("change", () => {
    onSortChange(select.value);
  });

  fieldset.appendChild(select);
  return fieldset;
}
