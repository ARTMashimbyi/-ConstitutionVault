document.addEventListener('DOMContentLoaded', () => { 
    const uploadForm = document.getElementById('uploadForm');
    const statusElem = document.getElementById('uploadStatus');
    const fileInput = document.getElementById('document');
    
    const fileTypeSelect = document.getElementById('fileType');
    const fileLabel = document.getElementById('fileLabel');
    const authorLabel = document.getElementById('authorLabel');
  
    // Base API URL: change based on environment
    const API_BASE_URL = window.location.hostname.includes('localhost')
      ? 'http://localhost:3000'
      : 'https://constitutionvault-eehxb8e0hgfphxb6.southafricanorth-01.azurewebsites.net';
  
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
  
    function showNotification(message, duration = 5000) {
      statusElem.innerText = message;
      statusElem.style.display = "block";
      setTimeout(() => {
        statusElem.style.display = "none";
      }, duration);
    }
  
    if (fileTypeSelect) {
      fileTypeSelect.addEventListener('change', function (e) {
        const selectedType = e.target.value;
        switch(selectedType) {
          case 'video':
            fileLabel.textContent = 'Upload Video';
            fileInput.setAttribute('accept', 'video/*');
            if (authorLabel) authorLabel.textContent = 'Creator';
            break;
          case 'image':
            fileLabel.textContent = 'Upload Image';
            fileInput.setAttribute('accept', 'image/*');
            if (authorLabel) authorLabel.textContent = 'Photographer';
            break;
          case 'audio':
            fileLabel.textContent = 'Upload Audio';
            fileInput.setAttribute('accept', 'audio/*');
            if (authorLabel) authorLabel.textContent = 'Artist';
            break;
          default:
            fileLabel.textContent = 'Upload File';
            fileInput.setAttribute('accept', 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            if (authorLabel) authorLabel.textContent = 'Author';
        }
      });
    }
  
    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (file && file.size > MAX_FILE_SIZE) {
        showNotification("Error: The selected file exceeds 100 MB. Please choose a smaller file.", 7000);
        fileInput.value = "";
      }
    });
  
    uploadForm.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const file = fileInput.files[0];
      if (!file) {
        showNotification("Error: Please select a file to upload.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showNotification("Error: The selected file exceeds 100 MB.");
        return;
      }
  
      const formData = new FormData(uploadForm);
  
      statusElem.style.display = "block";
      statusElem.innerText = "Uploading...";
  
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
  
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
  
        if (response.ok) {
          showNotification(result.message || "Upload successful!", 5000);
          uploadForm.reset();
        } else {
          showNotification(result.error || "Upload failed.", 5000);
        }
      } catch (error) {
        showNotification("Error: " + error.message, 5000);
      }
    });
  });
  