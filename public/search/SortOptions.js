// public/search/SortOptions.js

/**
 * Renders a sort-by dropdown.
 * Calls onSortChange with one of:
 *   ""            – default (no sorting)
 *   "title-asc"   – Title ascending
 *   "title-desc"  – Title descending
 *   "year-asc"    – Year ascending
 *   "year-desc"   – Year descending
 *
 * @param {(sortValue: string) => void} onSortChange
 * @returns {HTMLDivElement}
 */
export function renderSortOptions(onSortChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "sort-options";

  const label = document.createElement("label");
  label.htmlFor   = "sort-select";
  label.textContent = "Sort by:";

  const select = document.createElement("select");
  select.id = "sort-select";
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

  wrapper.append(label, select);
  return wrapper;
}
