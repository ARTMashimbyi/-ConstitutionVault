// Override content grid update to ensure we reattach our handlers when needed
const originalUpdateContentGrid = window.updateContentGrid;
if (originalUpdateContentGrid) {
    window.updateContentGrid = function() {
        // Call original function
        originalUpdateContentGrid.apply(window);
        
        // If we're in selection mode, reapply our selection handlers
        if (isSelectionMode) {
            setTimeout(addSelectionHandlers, 100);
        }
    };
}

// When any directory navigation happens, exit selection mode
const originalNavigateToPath = window.navigateToPath;
if (originalNavigateToPath) {
    window.navigateToPath = function(path) {
        // If in selection mode, exit it
        if (isSelectionMode) {
            toggleSelectionMode();
        }
        
        // Call original function
        originalNavigateToPath.apply(window, [path]);
    };
}

// Add selection click handlers to item cards
function addSelectionHandlers() {
  const itemCards = document.querySelectorAll('.item-card');
  
  itemCards.forEach(card => {
      // Store a reference to the original click handler
      if (!card._originalClickHandler) {
          // Clone the element to get a clean version without event listeners
          const clone = card.cloneNode(true);
          
          // Remove all existing event listeners by replacing with the clone
          card.parentNode.replaceChild(clone, card);
          
          // Update our reference to the new clean element
          card = clone;
          
          // Add selection handler
          card.addEventListener('click', handleItemSelection);
      }
  });
}

// Handle item selection for move operation
function handleItemSelection(event) {
  // Prevent default behavior and propagation
  event.preventDefault();
  event.stopPropagation();
  
  if (!isSelectionMode) return;
  
  const itemCard = this;
  const itemId = itemCard.getAttribute('data-id');
  const item = window.archiveData[itemId]; // Access global archiveData
  
  // Skip directories, only allow selecting files
  if (item && item.type === 'file') {
      itemCard.classList.toggle('selected');
      
      // Update selected files array
      if (itemCard.classList.contains('selected')) {
          selectedFiles.push({
              id: itemId,
              firestoreId: item.firestoreId,
              name: item.name,
              type: item.type
          });
      } else {
          selectedFiles = selectedFiles.filter(file => file.id !== itemId);
      }
      
      // Update selected count
      updateSelectedCount();
  } else if (item && item.type === 'directory') {
      // Don't allow selecting directories, but show a tooltip or message
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = 'Only files can be moved';
      tooltip.style.position = 'absolute';
      tooltip.style.top = (event.clientY + 10) + 'px';
      tooltip.style.left = (event.clientX + 10) + 'px';
      document.body.appendChild(tooltip);
      
      // Remove tooltip after a short delay
      setTimeout(() => {
          document.body.removeChild(tooltip);
      }, 2000);
  }
}

// Toggle selection mode for moving files
function toggleSelectionMode() {
  isSelectionMode = !isSelectionMode;
  
  // Update UI based on selection mode
  const moveActionBar = document.getElementById('move-action-bar');
  const contentGrid = document.getElementById('content-grid');
  const moveFilesBtn = document.getElementById('move-files-btn');
  
  if (isSelectionMode) {
      // Enter selection mode
      moveActionBar.style.display = 'flex';
      contentGrid.classList.add('selection-mode');
      moveFilesBtn.classList.add('active');
      moveFilesBtn.innerHTML = '<span>Cancel Selection</span>';
      
      // Reset selected files
      selectedFiles = [];
      updateSelectedCount();
      
      // First remove original click handlers from all items
      const itemCards = document.querySelectorAll('.item-card');
      itemCards.forEach(card => {
          // Store a clone of each card to use when restoring functionality
          const clone = card.cloneNode(true);
          card._clone = clone;
          
          // Remove all existing event listeners
          const newCard = card.cloneNode(true);
          card.parentNode.replaceChild(newCard, card);
          
          // Add our selection handler
          newCard.addEventListener('click', handleItemSelection);
      });
  } else {
      // Exit selection mode
      moveActionBar.style.display = 'none';
      contentGrid.classList.remove('selection-mode');
      moveFilesBtn.classList.remove('active');
      moveFilesBtn.innerHTML = '<span>Move Files</span>';
      
      // Remove selection classes
      removeSelectionClasses();
      
      // Reset selected files
      selectedFiles = [];
      
      // Restore original functionality by refreshing content grid
      window.updateContentGrid();
  }
}

// After moving files or canceling, we need to restore normal functionality
function restoreNormalFunctionality() {
  // Simply refresh the content grid using the main app's function
  window.updateContentGrid();
}

// Cancel move operation
function cancelMove() {
  toggleSelectionMode(); // This will reset everything
  restoreNormalFunctionality();
}

// Update the moveFilesToDestination function to restore functionality after move
async function moveFilesToDestination(destinationPath) {
  // ... existing code ...
  
  try {
      // ... existing code for moving files ...
      
      // Refresh UI using the main app's function
      window.updateContentGrid();
      
      // Show success message
      alert(`Successfully moved ${selectedFiles.length} file(s) to ${destinationPath}`);
      
  } catch (error) {
      console.error("Error moving files:", error);
      alert("Failed to move files. Please try again.");
  } finally {
      // Remove loading indicator
      document.body.removeChild(loadingIndicator);
      
      // Exit selection mode and restore functionality
      cancelMove();
  }
}