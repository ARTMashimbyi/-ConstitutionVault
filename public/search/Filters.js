/**
 * Renders a filter control for “type”.
 * Calls onFilterChange({ type }) whenever the select changes.
 * If enabledTypes is provided, only enables those types.
 *
 * @param {(filters: {type: string}) => void} onFilterChange
 * @param {string[]} [enabledTypes]  // e.g. ["document", "text"]
 * @returns {HTMLDivElement}
 */
export function renderFilters(onFilterChange, enabledTypes = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "filters";

  // Type filter
  const label = document.createElement("label");
  label.htmlFor = "filter-type";
  label.textContent = "Type:";

  const typeOptions = [
    { value: "", label: "All" },
    { value: "document", label: "Document" },
    { value: "text", label: "Text" },
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" }
  ];

  const select = document.createElement("select");
  select.id = "filter-type";

  typeOptions.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    // If enabledTypes is set, disable those not included
    if (enabledTypes && opt.value && !enabledTypes.includes(opt.value)) {
      option.disabled = true;
      option.style.color = "#aaa"; // Optional: greyed out for visibility
    }
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    onFilterChange({ type: select.value });
  });

  wrapper.append(label, select);
  return wrapper;
}
