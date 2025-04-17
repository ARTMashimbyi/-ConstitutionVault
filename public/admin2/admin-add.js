// Fetch available directories for the dropdown
async function fetchDirectories() {
    try {
      const response = await fetch('/api/constitutionalDocuments/directories');
      const directories = await response.json();
      
      const directorySelect = document.getElementById('directory');
      if (directorySelect) {
        directorySelect.innerHTML = '';
        
        // Add options for each directory
        directories.forEach(dir => {
          const option = document.createElement('option');
          option.value = dir.path;
          option.textContent = dir.path === '/' ? 'Root' : dir.path;
          directorySelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  }
  
  // Prefill directory input from query string
  window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const directory = params.get('directory');
    
    // Fetch directories and then set the selected value
    fetchDirectories().then(() => {
      const directorySelect = document.getElementById('directory');
      if (directorySelect && directory) {
        directorySelect.value = directory;
      }
    });
    
    // Set up form submission handler
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', handleFormSubmit);
    }
  });
  
  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();
  
    const form = event.target;
    const formData = new FormData(form);
    const statusPara = document.getElementById('uploadStatus');
  
    try {
      statusPara.textContent = 'Uploading...';
      statusPara.style.color = 'blue';
      statusPara.style.display = 'block';
      
      const response = await fetch('/api/constitutionalDocuments', {
        method: 'POST',
        body: formData
      });
  
      const result = await response.json();
  
      if (response.ok) {
        statusPara.textContent = result.message;
        statusPara.style.color = 'green';
        
        // Reset form
        form.reset();
        
        // Offer to return to the previous directory
        const directoryPath = formData.get('directory');
        setTimeout(() => {
          if (confirm('Document uploaded successfully. Return to directory view?')) {
            window.location.href = `index.html?path=${encodeURIComponent(directoryPath)}`;
          }
        }, 1000);
      } else {
        statusPara.textContent = 'Upload failed: ' + (result.error || 'Unknown error');
        statusPara.style.color = 'red';
      }
    } catch (err) {
      statusPara.textContent = 'An error occurred during upload.';
      statusPara.style.color = 'red';
      console.error('Upload error:', err);
    }
  }
  
  // Directory creation form handling
  const createDirectoryForm = document.getElementById('create-directory-form');
  if (createDirectoryForm) {
    createDirectoryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const directoryPath = document.getElementById('directory-path').value;
      
      try {
        const response = await fetch('/api/constitutionalDocuments/directory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: '/' + directoryPath })
        });
        
        if (response.ok) {
          alert('Directory created successfully');
          // Reload directories
          fetchDirectories();
          // Clear the form
          document.getElementById('directory-path').value = '';
        } else {
          const result = await response.json();
          alert('Failed to create directory: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error creating directory:', error);
        alert('An error occurred while creating the directory');
      }
    });
  }