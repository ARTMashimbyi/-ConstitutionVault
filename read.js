// public/read.js
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  const viewer = document.getElementById('pdfViewer');

  if (!bookId) {
    document.body.innerHTML = '<p>Invalid book ID.</p>';
    return;
  }

  fetch(`http://localhost:3000/books/${bookId}/document`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load book');
      const filename = response.headers
        .get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] || `Book #${bookId}`;
      document.getElementById('bookTitle').textContent = `📖 ${filename.replace('.pdf', '')}`;
      return response.blob();
    })
    .then(blob => {
      viewer.src = URL.createObjectURL(blob);
    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = '<p>Error loading book.</p>';
    });
});
