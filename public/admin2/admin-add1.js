// Prefill directory input from query string
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const directory = params.get('directory');
  if (directory) {
    document.getElementById('directory').value = directory;
  }
});



document.getElementById('uploadForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  try {
    const response = await fetch('http://localhost:3000/constitutionalDocuments', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    const statusPara = document.getElementById('uploadStatus');

    if (response.ok) {
      statusPara.textContent = result.message;
      statusPara.style.color = 'green';
    } else {
      statusPara.textContent = 'Upload failed: ' + (result.error || 'Unknown error');
      statusPara.style.color = 'red';
    }

    statusPara.style.display = 'block';
  } catch (err) {
    const statusPara = document.getElementById('uploadStatus');
    statusPara.textContent = 'An error occurred during upload.';
    statusPara.style.color = 'red';
    statusPara.style.display = 'block';
  }
});
