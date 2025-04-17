// Current path for navigation
let currentPath = "/";
let currentPathSegments = [];
let directoriesCache = {}; // Cache for directory structure
let documentsCache = {}; // Cache for documents

// Function to fetch directory structure from the database
async function fetchDirectoryStructure() {
    try {
        // Fetch all directories from the database
        const response = await fetch('http://localhost:3000/constitutionalDocuments/directories');
        if (!response.ok) {
            throw new Error('Failed to fetch directories');
        }
        
        const directories = await response.json();
        
        // Build directory structure from flat list
        const directoryTree = buildDirectoryTreeFromPaths(directories);
        
        // Build the UI tree
        buildDirectoryTreeUI(directoryTree);
        
        return directoryTree;
    } catch (error) {
        console.error('Error fetching directory structure:', error);
        showErrorMessage('Failed to load directory structure');
        return null;
    }
}

// Function to convert flat list of directory paths into a hierarchical structure
function buildDirectoryTreeFromPaths(directories) {
    const tree = {
        root: {
            name: "Root",
            type: "directory",
            path: "/",
            children: []
        }
    };
    
    directoriesCache = {}; // Reset cache
    
    // Add root to cache
    directoriesCache["root"] = tree.root;
    
    // Process each directory path
    directories.forEach(dir => {
        let path = dir.path;
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Split path into segments and build the tree
        const segments = path.split('/').filter(segment => segment !== '');
        let currentPath = '';
        let parentPath = '/';
        let parentId = 'root';
        
        // Create each directory in the path if it doesn't exist
        segments.forEach(segment => {
            currentPath += '/' + segment;
            
            // Create unique ID for this path
            const dirId = sanitizePathToId(currentPath);
            
            // Check if this directory already exists in our tree
            if (!directoriesCache[dirId]) {
                // Create new directory node
                const newDir = {
                    id: dirId,
                    name: segment,
                    type: 'directory',
                    path: currentPath,
                    children: []
                };
                
                // Add to cache
                directoriesCache[dirId] = newDir;
                
                // Add as child to parent
                if (directoriesCache[parentId]) {
                    directoriesCache[parentId].children.push(dirId);
                }
            }
            
            // Update parent for next iteration
            parentPath = currentPath;
            parentId = dirId;
        });
    });
    
    return tree;
}

// Function to sanitize a path into a usable ID
function sanitizePathToId(path) {
    return path.replace(/\//g, '_').replace(/^\s+|\s+$/g, '').replace(/\s+/g, '_');
}

// Function to build the directory tree UI
function buildDirectoryTreeUI(directoryTree) {
    const rootUl = document.getElementById('root-directory');
    rootUl.innerHTML = '';
    
    // Add root directory
    const rootLi = document.createElement('li');
    rootLi.innerHTML = `<div class="directory active" data-path="/">
                        <span class="directory-icon">📁</span>
                        <span>Root</span>
                    </div>`;
    rootUl.appendChild(rootLi);
    
    // Add children directories
    if (directoryTree.root.children && directoryTree.root.children.length > 0) {
        const childrenUl = document.createElement('ul');
        rootLi.appendChild(childrenUl);
        
        buildChildDirectories(childrenUl, directoryTree.root.children);
    }
    
    // Add click event listeners to directories
    document.querySelectorAll('.directory').forEach(dir => {
        dir.addEventListener('click', function() {
            const path = this.getAttribute('data-path');
            navigateToPath(path);
            
            // Update active directory
            document.querySelectorAll('.directory').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Recursively build child directories
function buildChildDirectories(parentUl, childIds) {
    childIds.forEach(childId => {
        const child = directoriesCache[childId];
        if (child) {
            const childLi = document.createElement('li');
            childLi.innerHTML = `<div class="directory" data-path="${child.path}">
                                <span class="directory-icon">📁</span>
                                <span>${child.name}</span>
                            </div>`;
            parentUl.appendChild(childLi);
            
            // Continue recursion if this directory has children
            if (child.children && child.children.length > 0) {
                const nestedUl = document.createElement('ul');
                childLi.appendChild(nestedUl);
                buildChildDirectories(nestedUl, child.children);
            }
        }
    });
}

// Function to fetch documents in the current directory
async function fetchDocumentsInDirectory(path) {
    try {
        const encodedPath = encodeURIComponent(path);
        const response = await fetch(`http://localhost:3000/constitutionalDocuments/directory?path=${encodedPath}`);
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        
        const documents = await response.json();
        
        // Update cache
        documents.forEach(doc => {
            documentsCache[doc.id] = doc;
        });
        
        return documents;
    } catch (error) {
        console.error('Error fetching documents:', error);
        showErrorMessage('Failed to load documents');
        return [];
    }
}

// Function to navigate to a specific path
async function navigateToPath(path) {
    currentPath = path;
    currentPathSegments = path.split('/').filter(segment => segment !== '');
    
    // Update path navigation
    updatePathNavigation();
    
    // Fetch and update content grid
    await updateContentGrid();
}

// Update the path navigation breadcrumb
function updatePathNavigation() {
    const pathNav = document.getElementById('path-navigation');
    pathNav.innerHTML = '<a href="#" data-path="/">Root</a>';
    
    let currentBuildPath = '';
    currentPathSegments.forEach((segment, index) => {
        currentBuildPath += '/' + segment;
        pathNav.innerHTML += '<span>/</span>';
        
        // Find the proper name for this path segment
        let displayName = segment;
        const dirId = sanitizePathToId(currentBuildPath);
        if (directoriesCache[dirId]) {
            displayName = directoriesCache[dirId].name;
        }
        
        if (index === currentPathSegments.length - 1) {
            // Last segment (current directory)
            pathNav.innerHTML += `<span>${displayName}</span>`;
        } else {
            // Navigable segment
            pathNav.innerHTML += `<a href="#" data-path="${currentBuildPath}">${displayName}</a>`;
        }
    });
    
    // Add click event listeners to path links
    document.querySelectorAll('#path-navigation a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('data-path');
            navigateToPath(path);
            
            // Update active directory in sidebar
            document.querySelectorAll('.directory').forEach(dir => {
                if (dir.getAttribute('data-path') === path) {
                    document.querySelectorAll('.directory').forEach(d => d.classList.remove('active'));
                    dir.classList.add('active');
                }
            });
        });
    });
}

// Update the content grid based on current path
async function updateContentGrid() {
    const contentGrid = document.getElementById('content-grid');
    const emptyState = document.getElementById('empty-state');
    contentGrid.innerHTML = '';
    
    // Show loading indicator
    contentGrid.innerHTML = '<div class="loading">Loading...</div>';
    
    // Fetch documents in this directory
    const documents = await fetchDocumentsInDirectory(currentPath);
    
    // Clear loading
    contentGrid.innerHTML = '';
    
    // Get child directories
    const childDirectories = [];
    const currentDirId = sanitizePathToId(currentPath);
    const currentDir = directoriesCache[currentDirId];
    
    if (currentDir && currentDir.children && currentDir.children.length > 0) {
        currentDir.children.forEach(childId => {
            if (directoriesCache[childId]) {
                childDirectories.push(directoriesCache[childId]);
            }
        });
    }
    
    // Display content if we have documents or directories
    if (documents.length > 0 || childDirectories.length > 0) {
        emptyState.style.display = 'none';
        contentGrid.style.display = 'grid';
        
        // Add directories first
        childDirectories.forEach(dir => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            itemCard.setAttribute('data-path', dir.path);
            itemCard.setAttribute('data-type', 'directory');
            itemCard.innerHTML = `
                <div class="item-icon"><span class="folder-icon">📁</span></div>
                <div class="item-details">
                    <div class="item-name">${dir.name}</div>
                    <div class="item-meta">Directory</div>
                </div>
            `;
            contentGrid.appendChild(itemCard);
            
            // Add click event
            itemCard.addEventListener('click', function() {
                const path = this.getAttribute('data-path');
                navigateToPath(path);
            });
        });
        
        // Add documents
        documents.forEach(doc => {
            let icon = '';
            const fileType = doc.fileType ? doc.fileType.toLowerCase() : 'document';
            
            if (fileType === 'document' || fileType === 'pdf') {
                icon = '<div class="item-icon"><span class="document-icon">📄</span></div>';
            } else if (fileType === 'video') {
                icon = '<div class="item-icon"><span class="video-icon">🎬</span></div>';
            } else if (fileType === 'image') {
                icon = '<div class="item-icon"><span class="image-icon">🖼️</span></div>';
            } else if (fileType === 'audio') {
                icon = '<div class="item-icon"><span class="audio-icon">🔊</span></div>';
            } else {
                icon = '<div class="item-icon"><span class="file-icon">📝</span></div>';
            }
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            itemCard.setAttribute('data-id', doc.id);
            itemCard.setAttribute('data-type', 'file');
            
            // Format file size if available
            let metaText = fileType.toUpperCase();
            if (doc.fileSize) {
                metaText += ` · ${formatFileSize(doc.fileSize)}`;
            }
            
            itemCard.innerHTML = `
                ${icon}
                <div class="item-details">
                    <div class="item-name">${doc.title}</div>
                    <div class="item-meta">${metaText}</div>
                </div>
            `;
            contentGrid.appendChild(itemCard);
            
            // Add click event
            itemCard.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                // Navigate to file view page
                window.location.href = `file-view.html?id=${id}`;
            });
        });
    } else {
        // Show empty state
        contentGrid.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Update empty state button to navigate to upload with current path
        const uploadBtn = emptyState.querySelector('button');
        uploadBtn.addEventListener('click', function() {
            window.location.href = `admin-add.html?directory=${encodeURIComponent(currentPath)}`;
        });
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Handle "New Directory" button click
const newDirBtn = document.getElementById('new-dir-btn');
const newDirModal = document.getElementById('new-dir-modal');
const cancelDirBtn = document.getElementById('cancel-dir-btn');
const newDirForm = document.getElementById('new-dir-form');

newDirBtn.addEventListener('click', function() {
    newDirModal.style.display = 'flex';
});

cancelDirBtn.addEventListener('click', function() {
    newDirModal.style.display = 'none';
});

newDirForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const dirName = document.getElementById('dir-name').value;
    const dirDescription = document.getElementById('dir-description').value;
    
    // Create path for new directory
    const newDirPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
    
    try {
        // Send request to create directory
        const response = await fetch('http://localhost:3000/constitutionalDocuments/directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: newDirPath,
                description: dirDescription
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create directory');
        }
        
        // Close modal
        newDirModal.style.display = 'none';
        
        // Refresh directory structure
        await fetchDirectoryStructure();
        
        // Refresh current view
        await navigateToPath(currentPath);
        
        // Reset form
        document.getElementById('dir-name').value = '';
        document.getElementById('dir-description').value = '';
        
    } catch (error) {
        console.error('Error creating directory:', error);
        showErrorMessage('Failed to create directory');
    }
});

// Handle "Upload Files" button click
const uploadBtn = document.getElementById('upload-btn');
uploadBtn.addEventListener('click', function () {
    const directoryPath = currentPath === '/' ? '/' : currentPath;
    window.location.href = `admin-add.html?directory=${encodeURIComponent(directoryPath)}`;
});

// Handle directory form submit
document.getElementById('create-directory-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const directoryPath = document.getElementById('directory-path').value;
    if (!directoryPath) return;
    
    try {
        const response = await fetch('http://localhost:3000/constitutionalDocuments/directory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: directoryPath })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create directory');
        }
        
        // Refresh directory structure
        await fetchDirectoryStructure();
        document.getElementById('directory-path').value = '';
        
    } catch (error) {
        console.error('Error creating directory:', error);
        showErrorMessage('Failed to create directory');
    }
});

// Initialize the page
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchDirectoryStructure();
        updatePathNavigation();
        await updateContentGrid();
    } catch (error) {
        console.error('Error initializing page:', error);
        showErrorMessage('Failed to initialize page');
    }
});