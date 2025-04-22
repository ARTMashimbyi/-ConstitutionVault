/**
 * @jest-environment jsdom
 */

// ✅ Use require instead of import
const { loadBook } = require('C:\\Users\\Lethabo Maloma\\Desktop\\cc\\-ConstitutionVault\\publictesting\\edit.js');


describe("Edit Book", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="edit-form">
        <input id="book-title" />
        <input id="book-author" />
        <button type="submit">Save</button>
      </form>
    `;
    loadBook(); // run your function
  });

  it("loads book data into form", () => {
    const title = document.getElementById("book-title").value;
    const author = document.getElementById("book-author").value;

    expect(title).not.toBe('');
    expect(author).not.toBe('');
  });
});
