document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  const API_BASE_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://constitutionvault-eehxb8e0hgfphxb6.southafricanorth-01.azurewebsites.net';

  fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  })
    .then(res => res.text())
    .then(msg => {
      document.getElementById('response').innerText = msg;
      setTimeout(() => {
        window.location.href = 'index.html'; // Redirect after 1 sec
      }, 1000);
    })
    .catch(err => {
      document.getElementById('response').innerText = 'Upload failed.';
      console.error(err);
    });
});
