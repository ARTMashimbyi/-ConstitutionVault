// tests/SortOptions.test.js

/**
 * @jest-environment jsdom
 */

const { renderSortOptions } = require("../public/search/SortOptions.js");

describe("SortOptions Component", () => {
  let container, callback;

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    container = document.getElementById("root");
    callback = jest.fn();
  });

  test("renders a label and select with the correct option values", () => {
    const sortOptions = renderSortOptions(callback);
    container.appendChild(sortOptions);

    const label = container.querySelector("label[for='sort-select']");
    const select = container.querySelector("select#sort-select");
    const values = Array.from(select.options).map(opt => opt.value);

    expect(label).toBeTruthy();
    expect(label.textContent).toBe("Sort by:");
    expect(select).toBeTruthy();
    expect(values).toEqual([
      "",
      "title-asc",
      "title-desc",
      "year-asc",
      "year-desc"
    ]);
  });

  test("calls callback with the new sort value when changed", () => {
    const sortOptions = renderSortOptions(callback);
    container.appendChild(sortOptions);

    const select = container.querySelector("select#sort-select");

    select.value = "title-desc";
    select.dispatchEvent(new Event("change"));
    expect(callback).toHaveBeenCalledWith("title-desc");

    select.value = "year-asc";
    select.dispatchEvent(new Event("change"));
    expect(callback).toHaveBeenCalledWith("year-asc");
  });
});
