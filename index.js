// public/index.js
document.addEventListener('DOMContentLoaded', async () => {
  const bookList = document.getElementById('bookList');
  try {
    const res = await fetch('http://localhost:3000/books');
    const books = await res.json();

    if (books.length === 0) {
      bookList.innerHTML = '<p>No books found.</p>';
      return;
    }

    books.forEach(book => {
      const div = document.createElement('div');
      div.className = 'book-item';
      div.innerHTML = `
        <h3>${book.name}</h3>
        <p><strong>Writer:</strong> ${book.writer}</p>
        <p><strong>Year:</strong> ${book.year}</p>
        <p><strong>Subject:</strong> ${book.subject}</p>
        <button onclick="window.location.href='read.html?id=${book.id}'">Read</button>
      `;
      bookList.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading books:', err);
    bookList.innerHTML = '<p>Error loading books.</p>';
  }
});
