// tests/SearchResults.test.js

/**
 * @jest-environment jsdom
 */

const { renderSearchResults } = require("../public/search/SearchResults.js");

describe("SearchResults Component", () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `<div id="results"></div>`;
    container = document.getElementById("results");
  });

  test("shows 'No results found.' when given an empty array", () => {
    renderSearchResults(container, []);
    const message = container.querySelector("p.no-results");
    expect(message).toBeTruthy();
    expect(message.textContent).toBe("No results found.");
  });

  test("renders one result card per item", () => {
    const sample = [
      { title: "Doc A", description: "First document" },
      { title: "Doc B", description: "Second document" }
    ];
    renderSearchResults(container, sample);

    const cards = container.querySelectorAll("div.search-result");
    expect(cards).toHaveLength(2);

    // titles
    expect(cards[0].querySelector("h3").textContent).toBe("Doc A");
    expect(cards[1].querySelector("h3").textContent).toBe("Doc B");
  });

  test("renders description paragraph when available", () => {
    const sample = [{ title: "Only Doc", description: "Lone description" }];
    renderSearchResults(container, sample);

    const card = container.querySelector("div.search-result");
    expect(card).toBeTruthy();

    const desc = card.querySelector("p");
    expect(desc).toBeTruthy();
    expect(desc.textContent).toBe("Lone description");
  });
});
