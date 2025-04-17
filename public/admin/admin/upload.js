document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const resetButton = document.getElementById('resetButton');
    const statusMessage = document.getElementById('uploadStatus');
    const parentSelect = document.getElementById('parent_id');
    const archivalLevelSelect = document.getElementById('archival_level');
  
    // Load parent containers based on selected archival level
    archivalLevelSelect.addEventListener('change', async () => {
      const level = archivalLevelSelect.value;
      
      if (!level) {
        // If no level is selected, clear and disable parent selector
        parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
        return;
      }
      
      try {
        // Get valid parent levels based on current selection
        const validParentLevels = getValidParentLevels(level);
        
        if (validParentLevels.length === 0) {
          parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
          return;
        }
        
        // Fetch potential parent containers
        const response = await fetch(`/api/archives/containers?levels=${validParentLevels.join(',')}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch parent containers');
        }
        
        const containers = await response.json();
        
        // Populate parent select dropdown
        parentSelect.innerHTML = '<option value="">None (Top Level)</option>';
        
        containers.forEach(container => {
          const option = document.createElement('option');
          option.value = container.id;
          option.textContent = `${container.title} (${container.archival_level})`;
          parentSelect.appendChild(option);
        });
        
      } catch (error) {
        console.error('Error loading parent containers:', error);
      }
    });
  
    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show uploading message
      statusMessage.textContent = 'Uploading document...';
      statusMessage.className = 'status-message';
      statusMessage.style.display = 'block';
      
      try {
        const formData = new FormData(uploadForm);
        
        const response = await fetch(uploadForm.action, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          statusMessage.textContent = 'Document uploaded successfully!';
          statusMessage.className = 'status-message success';
          uploadForm.reset();
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
        statusMessage.className = 'status-message error';
      }
    });
  
    // Handle form reset
    resetButton.addEventListener('click', () => {
      uploadForm.reset();
      statusMessage.style.display = 'none';
    });
  
    // Helper function to determine valid parent levels based on selected level
    function getValidParentLevels(selectedLevel) {
      const levelHierarchy = ['fonds', 'series', 'subseries', 'file', 'item'];
      const selectedIndex = levelHierarchy.indexOf(selectedLevel);
      
      if (selectedIndex <= 0) {
        return []; // fonds can't have parents
      }
      
      // Return all levels above the selected one
      return levelHierarchy.slice(0, selectedIndex);
    }
  });