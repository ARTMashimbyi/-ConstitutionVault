// tests/SearchInterface.int.test.js

/**
 * @jest-environment jsdom
 */

// Shim out the Firebase Web SDK imports
const originalRequire = module.require.bind(module);
module.require = path => {
  if (path === "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js") {
    return { initializeApp: jest.fn() };
  }
  if (path === "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js") {
    return {
      getFirestore: jest.fn(),
      collection: jest.fn(),
      getDocs: jest.fn()
    };
  }
  return originalRequire(path);
};

const { initializeSearchInterface } = require("../public/search/SearchInterface.js");

describe("SearchInterface Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="search-container"></div>`;
    jest.clearAllMocks();
  });

  test("filters and displays matching documents based on query", async () => {
    // Grab our mocks
    const { getDocs, collection } = require(
      "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
    );

    // Prepare fake Firestore data
    const fakeDocs = [
      { data: () => ({ title: "AlphaDoc", description: "First" }) },
      { data: () => ({ title: "BetaDoc", description: "Second" }) }
    ];
    getDocs.mockResolvedValue(fakeDocs);
    collection.mockReturnValue("fake-collection");

    // Initialize UI and run a search
    initializeSearchInterface("search-container");
    const input = document.querySelector("input.search-input");
    const button = document.querySelector("button.search-button");
    input.value = "Alpha";
    button.click();

    // Wait for the async refreshResults()
   await new Promise(r => setTimeout(r, 0));

    // Assert only the matching result shows
    const results = document.querySelectorAll(".search-result h3");
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toBe("AlphaDoc");
  });
});
