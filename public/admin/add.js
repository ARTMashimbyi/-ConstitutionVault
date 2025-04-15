document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const status = document.getElementById('uploadStatus');
  
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(form);
  
      status.style.display = 'block';
      status.innerText = 'Uploading...';
  
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: data
        });
        const result = await res.json();
  
        if (res.ok) {
          status.innerText = result.message;
          form.reset();
        } else {
          status.innerText = result.error || 'Upload failed.';
        }
      } catch (err) {
        status.innerText = 'Error: ' + err.message;
      }
    });
  });
  