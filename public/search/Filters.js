// public/search/Filters.js

/**
 * Renders semantic filter controls (no divs!) for “type” and “year”.  
 * Calls onFilterChange with an object `{ type: string, year: string }`
 * whenever either select value changes.
 *
 * @param {(filters: {type: string, year: string}) => void} onFilterChange
 * @returns {HTMLFieldSetElement}
 */
export function renderFilters(onFilterChange) {
  // Use a <fieldset> for grouping filters
  const fieldset = document.createElement("fieldset");
  fieldset.className = "filters";
  fieldset.setAttribute("aria-label", "Filter results");

  const legend = document.createElement("legend");
  legend.textContent = "Filters";
  fieldset.appendChild(legend);

  // --- Type filter ---
  const typeLabel = document.createElement("label");
  typeLabel.htmlFor = "filter-type";
  typeLabel.textContent = "Type:";
  const typeSelect = document.createElement("select");
  typeSelect.id = "filter-type";
  typeSelect.name = "type";
  typeSelect.innerHTML = `
    <option value="">All</option>
    <option value="document">Document</option>
    <option value="video">Video</option>
    <option value="image">Image</option>
    <option value="audio">Audio</option>
  `;
  typeSelect.addEventListener("change", () => {
    onFilterChange({ type: typeSelect.value, year: yearSelect.value });
  });

  // --- Year filter ---
  const yearLabel = document.createElement("label");
  yearLabel.htmlFor = "filter-year";
  yearLabel.textContent = "Year:";
  const yearSelect = document.createElement("select");
  yearSelect.id = "filter-year";
  yearSelect.name = "year";
  yearSelect.innerHTML = `
    <option value="">All</option>
    <option value="2000">2000</option>
    <option value="2001">2001</option>
    <option value="2002">2002</option>
    <option value="2003">2003</option>
  `;
  yearSelect.addEventListener("change", () => {
    onFilterChange({ type: typeSelect.value, year: yearSelect.value });
  });

  // Append in semantic order
  fieldset.append(
    typeLabel,
    typeSelect,
    yearLabel,
    yearSelect
  );

  return fieldset;
}
