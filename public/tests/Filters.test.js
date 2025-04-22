// tests/Filters.test.js

/**
 * @jest-environment jsdom
 */

const { renderFilters } = require("../public/search/Filters.js");

describe("Filters Component", () => {
  let container, callback;

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    container = document.getElementById("root");
    callback = jest.fn();
  });

  test("renders type and year selects with options", () => {
    const filters = renderFilters(callback);
    container.appendChild(filters);

    const typeSelect = container.querySelector("select#filter-type");
    const yearSelect = container.querySelector("select#filter-year");

    expect(typeSelect).toBeTruthy();
    expect(yearSelect).toBeTruthy();
    expect(typeSelect.querySelectorAll("option").length).toBeGreaterThanOrEqual(5); // All + 4 types
    expect(yearSelect.querySelectorAll("option").length).toBeGreaterThanOrEqual(5); // All + 4 years
  });

  test("calls callback with correct filters when type changes", () => {
    const filters = renderFilters(callback);
    container.appendChild(filters);

    const typeSelect = container.querySelector("select#filter-type");

    typeSelect.value = "video";
    typeSelect.dispatchEvent(new Event("change"));

    expect(callback).toHaveBeenCalledWith({ type: "video", year: "" });
  });

  test("calls callback with correct filters when year changes", () => {
    const filters = renderFilters(callback);
    container.appendChild(filters);

    const typeSelect = container.querySelector("select#filter-type");
    const yearSelect = container.querySelector("select#filter-year");

    // select a type first
    typeSelect.value = "image";
    typeSelect.dispatchEvent(new Event("change"));

    // now select a year
    yearSelect.value = "2001";
    yearSelect.dispatchEvent(new Event("change"));

    // last call should reflect both selections
    expect(callback).toHaveBeenLastCalledWith({ type: "image", year: "2001" });
  });
});
