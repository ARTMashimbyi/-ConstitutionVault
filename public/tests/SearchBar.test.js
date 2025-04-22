// tests/SearchBar.test.js

/**
 * @jest-environment jsdom
 */

const { renderSearchBar } = require("../public/search/SearchBar.js");

describe("SearchBar Component", () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    container = document.getElementById("root");
  });

  test("renders search input and button", () => {
    const mockCallback = jest.fn();
    const searchBar = renderSearchBar(mockCallback);
    container.appendChild(searchBar);

    const input = searchBar.querySelector("input.search-input");
    const button = searchBar.querySelector("button.search-button");

    expect(input).toBeTruthy();
    expect(button).toBeTruthy();
  });

  test("calls callback with query on button click", () => {
    const mockCallback = jest.fn();
    const searchBar = renderSearchBar(mockCallback);
    container.appendChild(searchBar);

    const input = searchBar.querySelector("input.search-input");
    const button = searchBar.querySelector("button.search-button");

    input.value = "test query";
    button.click();

    expect(mockCallback).toHaveBeenCalledWith("test query");
  });

  test("calls callback with query on Enter key press", () => {
    const mockCallback = jest.fn();
    const searchBar = renderSearchBar(mockCallback);
    container.appendChild(searchBar);

    const input = searchBar.querySelector("input.search-input");
    input.value = "enter query";

    const enterEvent = new KeyboardEvent("keypress", { key: "Enter" });
    input.dispatchEvent(enterEvent);

    expect(mockCallback).toHaveBeenCalledWith("enter query");
  });
});
