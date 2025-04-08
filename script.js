document.getElementById('uploadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
  
    fetch(this.action, {
      method: 'POST',
      body: formData
    })
      .then(res => res.text())
      .then(msg => {
        document.getElementById('response').innerText = msg;
      })
      .catch(err => {
        document.getElementById('response').innerText = 'Upload failed.';
        console.error(err);
      });
  });
  