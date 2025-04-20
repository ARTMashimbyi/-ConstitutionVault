import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
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

// Structure to store our hierarchical data
let archiveData = {
    root: {
        name: "Root",
        type: "directory",
        path: "/",
        children: []
    }
};

// Current path for navigation
let currentPath = "/";
let currentPathSegments = [];

// Function to load data from Firestore
async function loadDataFromFirestore() {
    try {
        // First, let's load directories
        const directoriesSnapshot = await getDocs(collection(db, "directories"));
        
        // Build directory structure first
        directoriesSnapshot.forEach(dirDoc => {
            const dirData = dirDoc.data();
            addDirectoryToHierarchy(dirDoc.id, dirData);
        });
        
        // Then load documents
        const querySnapshot = await getDocs(collection(db, "constitutionalDocuments"));
        
        // Process documents and add them to the hierarchy
        querySnapshot.forEach(doc => {
            const data = doc.data();
            addDocumentToHierarchy(doc.id, data);
        });
        
        // Initialize the UI after loading data
        initializeUI();
    } catch (error) {
        console.error("Error loading data from Firestore:", error);
    }
}

// Function to add a directory to the hierarchical structure
function addDirectoryToHierarchy(id, directoryData) {
    // Get the directory path
    const dirPath = directoryData.path || "/";
    
    // Split the path into segments
    const pathSegments = dirPath.split('/').filter(segment => segment !== '');
    
    let currentNode = archiveData.root;
    let currentPath = "";
    
    // Create parent directories if they don't exist
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        // Check if this is the target directory or a parent
        const isTargetDir = i === pathSegments.length - 1;
        const segmentId = isTargetDir ? id : segment.toLowerCase().replace(/\s+/g, '_');
        
        let found = false;
        if (currentNode.children) {
            for (const existingChildId of currentNode.children) {
                if (archiveData[existingChildId] && 
                    archiveData[existingChildId].path === currentPath) {
                    found = true;
                    currentNode = archiveData[existingChildId];
                    break;
                }
            }
        } else {
            currentNode.children = [];
        }
        
        if (!found) {
            // Create directory node
            archiveData[segmentId] = {
                name: directoryData.name || segment,
                type: "directory",
                path: currentPath,
                children: [],
                firestoreId: isTargetDir ? id : null,
                description: directoryData.description || ""
            };
            
            currentNode.children.push(segmentId);
            currentNode = archiveData[segmentId];
        }
    }
}

// Function to add a document to the hierarchical structure
function addDocumentToHierarchy(id, documentData) {
    // Get directory path from the document
    const directoryPath = documentData.directory || "/";
    
    // Split the path into segments
    const pathSegments = directoryPath.split('/').filter(segment => segment !== '');
    
    // Start from root
    let currentNode = archiveData.root;
    let currentPath = "";
    
    // Create directory structure if it doesn't exist
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        // Check if this segment already exists in the current node
        let foundChild = null;
        
        if (currentNode.children) {
            for (const existingChildId of currentNode.children) {
                if (archiveData[existingChildId] && 
                    archiveData[existingChildId].path === currentPath) {
                    foundChild = existingChildId;
                    break;
                }
            }
        } else {
            currentNode.children = [];
        }
        
        // If this directory doesn't exist yet, create it and save to Firestore
        if (!foundChild) {
            const childId = segment.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
            
            // Create directory in memory
            archiveData[childId] = {
                name: segment,
                type: "directory",
                path: currentPath,
                children: [],
                description: ""
            };
            
            // Add to parent's children
            currentNode.children.push(childId);
            
            // Save to Firestore (will be executed asynchronously)
            saveDirectoryToFirestore(childId, archiveData[childId])
                .then(firestoreId => {
                    // Update with Firestore ID
                    archiveData[childId].firestoreId = firestoreId;
                })
                .catch(error => console.error("Error saving directory:", error));
            
            // Update current node reference
            currentNode = archiveData[childId];
        } else {
            // Move to existing child
            currentNode = archiveData[foundChild];
        }
    }
    
    // Add the document itself to the last directory
    const fileId = `file_${id}`;
    
    // Calculate file size (placeholder since we don't have actual file size)
    const fileSize = documentData.fileSize || "Unknown";
    
    // Create file object
    archiveData[fileId] = {
        name: documentData.title,
        type: "file",
        fileType: documentData.fileType || "document",
        path: `${currentPath}/${documentData.title.toLowerCase().replace(/\s+/g, '_')}`,
        size: fileSize,
        lastModified: documentData.uploadedAt || new Date().toISOString(),
        metadata: {
            title: documentData.title,
            year: documentData.date ? new Date(documentData.date).getFullYear().toString() : "",
            description: documentData.description || "",
            author: documentData.author || "Unknown",
            continent: documentData.continent || "",
            country: documentData.country || "",
            institution: documentData.institution || "",
            keywords: documentData.keywords || [],
            category: documentData.category || "",
            uploadedAt: documentData.uploadedAt
        },
        firestoreId: id  // Store the Firestore document ID for reference
    };
    
    // Add file to the directory's children
    if (!currentNode.children) {
        currentNode.children = [];
    }
    currentNode.children.push(fileId);
}

// Function to save a directory to Firestore
async function saveDirectoryToFirestore(id, directoryData) {
    try {
        // Create a clean copy for Firestore (omitting children array which can be rebuilt)
        const dirForFirestore = {
            name: directoryData.name,
            path: directoryData.path,
            description: directoryData.description || "",
            createdAt: new Date().toISOString()
        };
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, "directories"), dirForFirestore);
        console.log("Directory saved with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error saving directory:", error);
        throw error;
    }
}

// Initialize UI elements
function initializeUI() {
    buildDirectoryTree();
    updatePathNavigation();
    updateContentGrid();
    
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
        
        // Generate a temporary ID for the new directory (will be replaced by Firestore ID)
        const tempId = dirName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        
        // Create new directory object
        const newDir = {
            name: dirName,
            type: 'directory',
            path: currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`,
            children: [],
            description: dirDescription
        };
        
        try {
            // Save directory to Firestore
            const firestoreId = await saveDirectoryToFirestore(tempId, newDir);
            
            // Update with Firestore ID
            newDir.firestoreId = firestoreId;
            
            // Add to archive data
            archiveData[firestoreId] = newDir;
            
            // Find parent directory and add new dir to its children
            const parentDir = findDirectoryByPath(currentPath);
            if (parentDir) {
                if (!parentDir.children) {
                    parentDir.children = [];
                }
                parentDir.children.push(firestoreId);
            }
            
            // Close modal
            newDirModal.style.display = 'none';
            
            // Refresh directory tree and content
            buildDirectoryTree();
            updateContentGrid();
            
            // Reset form
            document.getElementById('dir-name').value = '';
            document.getElementById('dir-description').value = '';
            
        } catch (error) {
            console.error("Error creating directory:", error);
            alert("Failed to create directory. Please try again.");
        }
    });

    // Handle "Upload Files" button click
    const uploadBtn = document.getElementById('upload-btn');
    const emptyStateUploadBtn = document.querySelector('.empty-state .btn');
    
    uploadBtn.addEventListener('click', function () {
        const directoryPath = currentPath === '/' ? '/' : currentPath;
        window.location.href = `admin-add.html?directory=${encodeURIComponent(directoryPath)}`;
    });
    
    if (emptyStateUploadBtn) {
        emptyStateUploadBtn.addEventListener('click', function() {
            const directoryPath = currentPath === '/' ? '/' : currentPath;
            window.location.href = `admin-add.html?directory=${encodeURIComponent(directoryPath)}`;
        });
    }
    
    // Set up search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        // Simple filtering for items in the current view
        const contentItems = document.querySelectorAll('.item-card');
        contentItems.forEach(item => {
            const itemName = item.querySelector('.item-name').textContent.toLowerCase();
            if (itemName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Set up directory creation form
    const createDirForm = document.getElementById('create-directory-form');
    if (createDirForm) {
        createDirForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const directoryPath = document.getElementById('directory-path').value;
            try {
                await createDirectoryStructure(directoryPath);
                
                // Reset the form
                document.getElementById('directory-path').value = '';
                
                // Rebuild the UI
                buildDirectoryTree();
                updateContentGrid();
                
                alert("Directory structure created successfully!");
            } catch (error) {
                console.error("Error creating directory structure:", error);
                alert("Error creating directory structure. Please try again.");
            }
        });
    }
    
    // Auto-fill directory path in admin-add.html if opened from hierarchy
    const urlParams = new URLSearchParams(window.location.search);
    const directoryParam = urlParams.get('directory');
    if (directoryParam) {
        // If we're on the admin-add page and directory param is present
        const directoryInput = document.getElementById('directory');
        if (directoryInput) {
            directoryInput.value = directoryParam;
        }
    }
}

// Function to create a directory structure from path string
async function createDirectoryStructure(directoryPath) {
    // Split the path into segments
    const pathSegments = directoryPath.split('/').filter(segment => segment !== '');
    
    // Start from root
    let currentNode = archiveData.root;
    let currentPath = "";
    
    // Create directory structure
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        // Check if this segment already exists in the current node
        let found = false;
        let existingChildId = null;
        
        if (currentNode.children) {
            for (const childId of currentNode.children) {
                const child = archiveData[childId];
                if (child && child.path === currentPath) {
                    found = true;
                    existingChildId = childId;
                    break;
                }
            }
        } else {
            currentNode.children = [];
        }
        
        // If this directory doesn't exist yet, create it
        if (!found) {
            const tempId = segment.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
            
            // Create directory object
            const newDir = {
                name: segment,
                type: "directory",
                path: currentPath,
                children: [],
                description: ""
            };
            
            try {
                // Save to Firestore
                const firestoreId = await saveDirectoryToFirestore(tempId, newDir);
                
                // Update with Firestore ID
                newDir.firestoreId = firestoreId;
                
                // Add to archive data
                archiveData[firestoreId] = newDir;
                currentNode.children.push(firestoreId);
                
                // Move to next level
                currentNode = archiveData[firestoreId];
                
            } catch (error) {
                console.error("Error saving directory in structure:", error);
                throw error;
            }
        } else {
            // Move to existing directory
            currentNode = archiveData[existingChildId];
        }
    }
    
    return currentPath;
}

// Function to build directory tree
function buildDirectoryTree() {
    const rootUl = document.getElementById('root-directory');
    rootUl.innerHTML = '';
    
    // Add root directory
    const rootLi = document.createElement('li');
    rootLi.innerHTML = `<div class="directory active" data-path="/">
                        <span class="directory-icon">📁</span>
                        <span>Root</span>
                    </div>`;
    rootUl.appendChild(rootLi);
    
    // Add first level directories
    const rootChildren = archiveData.root.children;
    if (rootChildren && rootChildren.length > 0) {
        const childrenUl = document.createElement('ul');
        rootLi.appendChild(childrenUl);
        
        rootChildren.forEach(childId => {
            const child = archiveData[childId];
            if (child) {
                const childLi = document.createElement('li');
                childLi.innerHTML = `<div class="directory" data-path="${child.path}">
                                    <span class="directory-icon">📁</span>
                                    <span>${child.name}</span>
                                </div>`;
                childrenUl.appendChild(childLi);
                
                // Add second level directories recursively
                if (child.type === 'directory' && child.children && child.children.length > 0) {
                    buildSubDirectories(childLi, child.children);
                }
            }
        });
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

// Recursively build subdirectories
function buildSubDirectories(parentLi, children) {
    const childrenUl = document.createElement('ul');
    parentLi.appendChild(childrenUl);
    
    children.forEach(childId => {
        const child = archiveData[childId];
        if (child && child.type === 'directory') {
            const childLi = document.createElement('li');
            childLi.innerHTML = `<div class="directory" data-path="${child.path}">
                                <span class="directory-icon">📁</span>
                                <span>${child.name}</span>
                            </div>`;
            childrenUl.appendChild(childLi);
            
            // Continue recursion
            if (child.children && child.children.length > 0) {
                buildSubDirectories(childLi, child.children);
            }
        }
    });
}

// Function to navigate to a specific path
function navigateToPath(path) {
    currentPath = path;
    currentPathSegments = path.split('/').filter(segment => segment !== '');
    
    // Update path navigation
    updatePathNavigation();
    
    // Update content grid
    updateContentGrid();
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
        Object.keys(archiveData).forEach(key => {
            if (archiveData[key].path === currentBuildPath) {
                displayName = archiveData[key].name;
            }
        });
        
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
function updateContentGrid() {
    const contentGrid = document.getElementById('content-grid');
    const emptyState = document.getElementById('empty-state');
    contentGrid.innerHTML = '';
    
    // Find current directory
    let currentDir = findDirectoryByPath(currentPath);
    
    if (currentDir && currentDir.children && currentDir.children.length > 0) {
        emptyState.style.display = 'none';
        contentGrid.style.display = 'grid';
        
        // Add all child items (directories and files)
        currentDir.children.forEach(childId => {
            const child = archiveData[childId];
            if (child) {
                let icon = '';
                if (child.type === 'directory') {
                    icon = '<div class="item-icon"><span class="folder-icon">📁</span></div>';
                } else if (child.fileType === 'document' || child.fileType === 'pdf') {
                    icon = '<div class="item-icon"><span class="document-icon">📄</span></div>';
                } else if (child.fileType === 'video') {
                    icon = '<div class="item-icon"><span class="video-icon">🎬</span></div>';
                } else if (child.fileType === 'image') {
                    icon = '<div class="item-icon"><span class="image-icon">🖼️</span></div>';
                } else if (child.fileType === 'audio') {
                    icon = '<div class="item-icon"><span class="audio-icon">🔊</span></div>';
                } else {
                    icon = '<div class="item-icon"><span class="file-icon">📝</span></div>';
                }
                
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.setAttribute('data-id', childId);
                itemCard.innerHTML = `
                    ${icon}
                    <div class="item-details">
                        <div class="item-name">${child.name}</div>
                        <div class="item-meta">
                            ${child.type === 'file' ? `${child.fileType.toUpperCase()} · ${child.size}` : 'Directory'}
                        </div>
                    </div>
                `;
                contentGrid.appendChild(itemCard);
                
                // Add click event
                itemCard.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const item = archiveData[id];
                    
                    if (item.type === 'directory') {
                        navigateToPath(item.path);
                    } else {
                        // Navigate to file view page or show details
                        if (item.firestoreId) {
                            window.location.href = `file-view.html?id=${item.firestoreId}`;
                        } else {
                            alert(`Viewing file: ${item.name}`);
                        }
                    }
                });
            }
        });
    } else {
        // Show empty state
        contentGrid.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Helper function to find a directory by path
function findDirectoryByPath(path) {
    let result = null;
    Object.keys(archiveData).forEach(key => {
        if (archiveData[key].path === path && archiveData[key].type === 'directory') {
            result = archiveData[key];
        }
    });
    return result;
}

// Initialize the application by loading data from Firestore
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromFirestore();
    
    // Setup logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                // Redirect to login page or perform logout actions
                window.location.href = 'login.html';
            }
        });
    }
});