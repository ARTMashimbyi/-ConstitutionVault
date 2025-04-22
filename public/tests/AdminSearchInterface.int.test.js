// tests/AdminSearchInterface.int.test.js

/**
 * @jest-environment jsdom
 */

const { initializeAdminSearchInterface } = require("../public/search/AdminSearchInterface.js");

describe("AdminSearchInterface Integration", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="admin-search-container"></div>`;
    jest.clearAllMocks();
  });

  test("filters and displays matching documents based on query", async () => {
    // Grab our mocked Firestore methods
    const { getDocs, collection } = require(
      "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
    );

    // Arrange: fake snapshot of two docs
    const fakeDocs = [
      { data: () => ({ title: "AlphaDoc", description: "First", type: "bill", year: "2000" }) },
      { data: () => ({ title: "BetaDoc",  description: "Second", type: "bill", year: "2000" }) }
    ];
    getDocs.mockResolvedValue(fakeDocs);
    collection.mockReturnValue("fake-collection");

    // Act: initialize UI and perform a search for "Alpha"
    initializeAdminSearchInterface("admin-search-container");
    const input  = document.querySelector("input.search-input");
    const button = document.querySelector("button.search-button");
    input.value = "Alpha";
    button.click();

    // Wait for the async refresh
    await new Promise(r => setTimeout(r, 0));

    // Assert: only AlphaDoc appears
    const results = document.querySelectorAll(".search-result h3");
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toBe("AlphaDoc");
  });
});
