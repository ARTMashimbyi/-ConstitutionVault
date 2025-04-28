// moveFiles.js - Handles moving files between directories in the constitutional archive

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration - same as in your other files
const firebaseConfig = {
    apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
    authDomain: "constitutionvault-1b5d1.firebaseapp.com",
    projectId: "constitutionvault-1b5d1",
    storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
    messagingSenderId: "616111688261",
    appId: "1:616111688261:web:97cc0a35c8035c0814312c",
    measurementId: "G-YJEYZ85T3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
let selectedFiles = [];
let currentSourcePath = "/";
let moveMode = false;
let selectionPhase = true; // New variable to track which phase of move we're in
let pathMonitorInterval = null; // For tracking path changes

// Initialize move functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize move button in actions section
    const actionSection = document.querySelector('.btn-group');
    if (actionSection) {
        const moveBtn = document.createElement('button');
        moveBtn.className = 'btn move-btn';
        moveBtn.id = 'move-btn';
        moveBtn.innerHTML = '<span>Move Files</span>';
        actionSection.appendChild(moveBtn);
        
        moveBtn.addEventListener('click', toggleMoveMode);
    }
    
    // Initialize move action panel (hidden by default)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const movePanel = document.createElement('section');
        movePanel.className = 'move-panel';
        movePanel.id = 'move-panel';
        movePanel.innerHTML = `
            <p><span id="selected-count">0</span> items selected</p>
            <div class="move-actions">
                <button class="btn cancel-move-btn" id="cancel-move-btn">Cancel</button>
                <button class="btn next-move-btn" id="next-move-btn" disabled>Continue to Select Destination</button>
                <button class="btn confirm-move-btn" id="confirm-move-btn" style="display:none">Move to Current Directory</button>
            </div>
        `;
        mainContent.appendChild(movePanel);
        
        // Add event listeners for move panel buttons
        document.getElementById('cancel-move-btn').addEventListener('click', cancelMove);
        document.getElementById('next-move-btn').addEventListener('click', proceedToDestinationSelection);
        document.getElementById('confirm-move-btn').addEventListener('click', confirmMove);
    }
    
    // Debug info display for paths
    const debugInfo = document.createElement('div');
    debugInfo.id = 'move-debug-info';
    debugInfo.style.display = 'none';
    debugInfo.style.padding = '5px';
    debugInfo.style.margin = '5px 0';
    debugInfo.style.fontSize = '12px';
    debugInfo.style.color = '#666';
    mainContent.appendChild(debugInfo);
});

// Helper function to normalize paths consistently
function normalizePath(path) {
    if (!path || path === "/") return "/";
    return "/" + path.replace(/^\/|\/$/g, "");
}

// Toggle move mode (select files for moving)
function toggleMoveMode() {
    moveMode = !moveMode;
    selectionPhase = true; // Reset to selection phase when toggling
    selectedFiles = [];
    
    // Update UI for move mode
    const contentGrid = document.getElementById('content-grid');
    const movePanel = document.getElementById('move-panel');
    const moveBtn = document.getElementById('move-btn');
    const selectedCount = document.getElementById('selected-count');
    const nextBtn = document.getElementById('next-move-btn');
    const confirmBtn = document.getElementById('confirm-move-btn');
    const debugInfo = document.getElementById('move-debug-info');
    
    if (moveMode) {
        // FIXED: Get current path properly from window.currentPath
        currentSourcePath = normalizePath(window.currentPath);
        
        // Update UI
        contentGrid.classList.add('move-mode');
        movePanel.classList.add('active');
        moveBtn.classList.add('active');
        moveBtn.innerHTML = '<span>Cancel Move</span>';
        selectedCount.textContent = '0';
        
        // Show next button, hide confirm button in selection phase
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = true;
        confirmBtn.style.display = 'none';
        
        // Show debug info in development
        debugInfo.style.display = 'block';
        debugInfo.textContent = `Source path: ${currentSourcePath}`;
        
        // Add selection capability to item cards
        addSelectionToItems();

        // Start path monitor
        if (pathMonitorInterval) clearInterval(pathMonitorInterval);
        pathMonitorInterval = setInterval(() => {
            if (moveMode) {
                const currentPath = normalizePath(window.currentPath);
                debugInfo.textContent = `Source path: ${currentSourcePath} | Current path: ${currentPath}`;
            }
        }, 500);
    } else {
        // Reset UI
        contentGrid.classList.remove('move-mode');
        movePanel.classList.remove('active');
        moveBtn.classList.remove('active');
        moveBtn.innerHTML = '<span>Move Files</span>';
        
        // Hide debug info
        debugInfo.style.display = 'none';
        
        // Remove selection from items
        removeSelectionFromItems();
        
        // Reset buttons
        nextBtn.style.display = 'inline-block';
        confirmBtn.style.display = 'none';
        
        // Clear path monitor
        if (pathMonitorInterval) {
            clearInterval(pathMonitorInterval);
            pathMonitorInterval = null;
        }
    }
}

// Progress from selection phase to destination selection phase
function proceedToDestinationSelection() {
    if (selectedFiles.length === 0) return;
    
    selectionPhase = false; // Switch to destination selection phase
    
    // Update UI for destination selection phase
    const movePanel = document.getElementById('move-panel');
    const nextBtn = document.getElementById('next-move-btn');
    const confirmBtn = document.getElementById('confirm-move-btn');
    const debugInfo = document.getElementById('move-debug-info');
    
    // Update the status message
    const existingStatus = document.querySelector('.destination-status');
    if (existingStatus) {
        existingStatus.parentNode.removeChild(existingStatus);
    }
    
    const statusMsg = document.createElement('p');
    statusMsg.className = 'destination-status';
    statusMsg.innerHTML = 'Now navigate to the destination folder';
    movePanel.insertBefore(statusMsg, movePanel.firstChild);
    
    // Change button visibility
    nextBtn.style.display = 'none';
    confirmBtn.style.display = 'inline-block';
    confirmBtn.disabled = false;
    
    // Update debug info
    const currentPath = normalizePath(window.currentPath);
    debugInfo.textContent = `Source path: ${currentSourcePath} | Current path: ${currentPath}`;
    
    // Remove selection capability but keep move mode active
    transitionToNavigationPhase();
    
    // Update visible status
    movePanel.classList.add('destination-phase');
    
    // Store the original updateBreadcrumbs function
    if (window.updateBreadcrumbs && typeof window.updateBreadcrumbs === 'function' && !window._originalUpdateBreadcrumbs) {
        window._originalUpdateBreadcrumbs = window.updateBreadcrumbs;
        
        // Override updateBreadcrumbs to track path changes
        window.updateBreadcrumbs = function() {
            // Call the original function
            window._originalUpdateBreadcrumbs.apply(this, arguments);
            
            // Update our debug info
            const currentPath = normalizePath(window.currentPath);
            debugInfo.textContent = `Source path: ${currentSourcePath} | Current path: ${currentPath}`;
        };
    }
}

// Transition to navigation phase - make files unselectable but directories navigable
function transitionToNavigationPhase() {
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        // Check if this item is a directory
        const isDirectory = card.querySelector('.icon-folder') !== null;
        
        // First, remove selection-related UI from all items
        card.classList.remove('selectable', 'selected');
        const checkbox = card.querySelector('.item-select');
        if (checkbox) {
            card.removeChild(checkbox);
        }
        
        if (isDirectory) {
            // For directories: restore original click handler and make them look navigable
            card.onclick = card._originalClickHandler;
            card.classList.add('navigable-directory');
            card.classList.remove('disabled'); // Ensure directories are not disabled
        } else {
            // For files: disable them and make them look non-interactive
            const fileId = card.getAttribute('data-id');
            
            // Only disable files that were selected for moving
            if (selectedFiles.includes(fileId)) {
                card.classList.add('selected-for-move');
            }
            
            // Remove click handler for all non-directory items
            card.onclick = null;
        }
    });
}

// Add selection capability to content items
function addSelectionToItems() {
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        // Add selection class
        card.classList.add('selectable');
        card.classList.remove('navigable-directory', 'selected-for-move'); // Clear any navigation phase classes
        
        // Add selection checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'item-select';
        checkbox.innerHTML = `<input type="checkbox" aria-label="Select item">`;
        card.insertBefore(checkbox, card.firstChild);
        
        // Store the original click handler
        const originalClickHandler = card.onclick;
        card._originalClickHandler = originalClickHandler;
        
        // Remove the original click handler
        card.onclick = null;
        
        // Add our new click handler that handles selection
        card.addEventListener('click', function(e) {
            if (moveMode && selectionPhase) {
                // In move mode selection phase, only handle selection
                e.preventDefault();
                e.stopPropagation();
                toggleItemSelection(this);
            } else if (this._originalClickHandler) {
                // Outside move mode, use original handler
                this._originalClickHandler.call(this, e);
            }
        });
        
        // Add specific handler for checkbox
        const checkboxInput = checkbox.querySelector('input');
        if (checkboxInput) {
            checkboxInput.addEventListener('click', function(e) {
                // Prevent the event from bubbling to the card
                e.stopPropagation();
                toggleItemSelection(card);
            });
        }
    });
}

// Remove selection capability from content items
function removeSelectionFromItems() {
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        // Remove all special classes
        card.classList.remove('selectable', 'selected', 'navigable-directory', 'selected-for-move');
        
        // Remove selection checkbox
        const checkbox = card.querySelector('.item-select');
        if (checkbox) {
            card.removeChild(checkbox);
        }
        
        // Restore original click handler for all items
        card.onclick = card._originalClickHandler;
        delete card._originalClickHandler;
        
        // Remove our added event listener
        card.removeEventListener('click', function() {});
    });
}

// Toggle selection state of an item
function toggleItemSelection(itemCard) {
    const itemId = itemCard.getAttribute('data-id');
    const checkbox = itemCard.querySelector('.item-select input');
    
    // Toggle selection
    if (itemCard.classList.contains('selected')) {
        itemCard.classList.remove('selected');
        if (checkbox) checkbox.checked = false;
        
        // Remove from selected files
        selectedFiles = selectedFiles.filter(id => id !== itemId);
    } else {
        itemCard.classList.add('selected');
        if (checkbox) checkbox.checked = true;
        
        // Add to selected files
        selectedFiles.push(itemId);
    }
    
    // Update selected count
    document.getElementById('selected-count').textContent = selectedFiles.length;
    
    // Enable/disable next button based on selection
    document.getElementById('next-move-btn').disabled = selectedFiles.length === 0;
}

// Cancel move operation
function cancelMove() {
    // Remove any destination status if it exists
    const destStatus = document.querySelector('.destination-status');
    if (destStatus) {
        destStatus.parentNode.removeChild(destStatus);
    }
    
    // Remove all special classes from items
    const itemCards = document.querySelectorAll('.item-card');
    itemCards.forEach(card => {
        card.classList.remove('navigable-directory', 'selected-for-move', 'disabled');
    });
    
    // Reset move panel
    const movePanel = document.getElementById('move-panel');
    if (movePanel) {
        movePanel.classList.remove('destination-phase');
    }
    
    // Restore original updateBreadcrumbs if we modified it
    if (window._originalUpdateBreadcrumbs) {
        window.updateBreadcrumbs = window._originalUpdateBreadcrumbs;
        delete window._originalUpdateBreadcrumbs;
    }
    
    // Clear path monitor
    if (pathMonitorInterval) {
        clearInterval(pathMonitorInterval);
        pathMonitorInterval = null;
    }
    
    toggleMoveMode();
}

// Confirm move operation
async function confirmMove() {
    if (selectedFiles.length === 0) return;
    
    // FIXED: Get current target path properly
    const targetPath = normalizePath(window.currentPath);
    
    // Update debug info with exact strings we're comparing
    const debugInfo = document.getElementById('move-debug-info');
    debugInfo.textContent = `Source: "${currentSourcePath}" | Target: "${targetPath}" | Equal: ${currentSourcePath === targetPath}`;
    
    // Don't move if source and target are the same
    if (currentSourcePath === targetPath) {
        alert('Files are already in this directory. Please choose a different destination.');
        return;
    }
    
    try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-move-btn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<span>Moving...</span>';
        confirmBtn.disabled = true;
        
        // Move each selected file
        for (const fileId of selectedFiles) {
            await moveFile(fileId, targetPath);
        }
        
        // Remove destination status if it exists
        const destStatus = document.querySelector('.destination-status');
        if (destStatus) {
            destStatus.parentNode.removeChild(destStatus);
        }
        
        // Restore original updateBreadcrumbs if we modified it
        if (window._originalUpdateBreadcrumbs) {
            window.updateBreadcrumbs = window._originalUpdateBreadcrumbs;
            delete window._originalUpdateBreadcrumbs;
        }
        
        // Clear path monitor
        if (pathMonitorInterval) {
            clearInterval(pathMonitorInterval);
            pathMonitorInterval = null;
        }
        
        // Return to normal mode
        toggleMoveMode();
        
        // Refresh the UI
        if (typeof updateContentGrid === 'function') {
            updateContentGrid();
        }
        
        // Show success message
        alert(`Successfully moved ${selectedFiles.length} item(s) to ${targetPath}`);
    } catch (error) {
        console.error('Error moving files:', error);
        alert(`Error moving files: ${error.message}`);
        
        // Reset button
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Move a single file to the target directory
async function moveFile(fileId, targetPath) {
    console.log(`Moving file ${fileId} to ${targetPath}`);
    
    // Find file in archiveData
    const file = window.archiveData[fileId];
    if (!file || file.type !== 'file') {
        console.error('Invalid file or not a file type:', fileId);
        return;
    }
    
    // Get Firestore document ID
    const firestoreId = file.firestoreId;
    if (!firestoreId) {
        console.error('File has no Firestore ID:', fileId);
        return;
    }
    
    try {
        // Get current document data
        const docRef = doc(db, "constitutionalDocuments", firestoreId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error(`Document ${firestoreId} not found`);
        }
        
        const documentData = docSnap.data();
        
        // Create new document with updated directory path
        const updatedData = {
            ...documentData,
            directory: targetPath, // Already normalized by this point
        };
        
        // Update the document in Firestore
        await updateDoc(docRef, updatedData);
        
        // Update local data structure
        // 1. Find and update in source directory's children
        const sourceDir = findDirectoryByPath(currentSourcePath);
        if (sourceDir && sourceDir.children) {
            sourceDir.children = sourceDir.children.filter(id => id !== fileId);
        }
        
        // 2. Add to target directory's children
        const targetDir = findDirectoryByPath(targetPath);
        if (targetDir) {
            if (!targetDir.children) {
                targetDir.children = [];
            }
            targetDir.children.push(fileId);
        }
        
        // 3. Update file's metadata
        // FIXED: Update file path with proper formatting
        const fileName = file.name.toLowerCase().replace(/\s+/g, '_');
        file.path = targetPath === "/" ? `/${fileName}` : `${targetPath}/${fileName}`;
        
        console.log(`File ${fileId} moved successfully`);
        return true;
    } catch (error) {
        console.error(`Error moving file ${fileId}:`, error);
        throw error;
    }
}

// Helper function to find directory by path (using the global archiveData)
function findDirectoryByPath(path) {
    if (!window.archiveData) return null;
    
    // Normalize the path for comparison
    const normalizedPath = normalizePath(path);
    
    for (const key in window.archiveData) {
        const item = window.archiveData[key];
        if (item && item.type === 'directory') {
            // Normalize the item path too
            const normalizedItemPath = normalizePath(item.path);
            if (normalizedItemPath === normalizedPath) {
                return item;
            }
        }
    }
    return null;
}

// Add some CSS to style the navigation phase
const style = document.createElement('style');
style.textContent = `
.move-panel {
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    display: none;
}

.move-panel.active {
    display: block;
}

.move-panel.destination-phase {
    background-color: #f0f7ff;
}

.move-panel p {
    margin: 0 0 10px 0;
}

.move-actions {
    display: flex;
    gap: 10px;
}

.btn {
    padding: 5px 10px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.cancel-move-btn {
    background-color: #f0f0f0;
    border: 1px solid #ccc;
}

.next-move-btn, .confirm-move-btn {
    background-color: #4a86e8;
    color: white;
}

.next-move-btn:disabled, .confirm-move-btn:disabled {
    background-color: #a9a9a9;
    cursor: not-allowed;
}

.navigable-directory {
    cursor: pointer;
    outline: 2px solid #4a86e8;
    position: relative;
}

.navigable-directory:after {
    content: '🔍';
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 16px;
}

.item-card.selectable {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.item-card.selectable:hover {
    background-color: #f5f5f5;
}

.item-card.selected {
    background-color: #e3effc;
    outline: 2px solid #4a86e8;
}

.item-select {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
}

.selected-for-move {
    opacity: 0.5;
    pointer-events: none;
    position: relative;
}

.selected-for-move:after {
    content: '✓';
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 16px;
    color: #4caf50;
}

.destination-status {
    font-weight: bold;
    color: #4a86e8;
    margin-bottom: 10px;
}

#move-debug-info {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    word-break: break-all;
    font-family: monospace;
}
`;
document.head.appendChild(style);

// Make these functions globally accessible
window.moveFiles = {
    toggleMoveMode,
    cancelMove,
    confirmMove,
    selectedFiles,
    proceedToDestinationSelection,
};

// Export variables to global scope for debugging
window.moveMode = moveMode;
window.currentSourcePath = currentSourcePath;
window.selectionPhase = selectionPhase;