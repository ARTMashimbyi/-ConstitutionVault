document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  const viewer = document.getElementById('pdfViewer');

  const API_BASE_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://constitutionvault-eehxb8e0hgfphxb6.southafricanorth-01.azurewebsites.net';

  if (!bookId) {
    document.body.innerHTML = '<p>Invalid book ID.</p>';
    return;
  }

  fetch(`${API_BASE_URL}/books/${bookId}/document`)
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
