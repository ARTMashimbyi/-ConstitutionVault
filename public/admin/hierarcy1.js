//hierarcy.js


// Mock data for directories and files
const archiveData = {
    root: {
        name: "Root",
        type: "directory",
        path: "/",
        children: ["constitutions", "legal_documents", "historical_archives"]
    },
    constitutions: {
        name: "Constitutions",
        type: "directory",
        path: "/constitutions",
        children: ["us_constitution", "international_constitutions"]
    },
    us_constitution: {
        name: "US Constitution",
        type: "directory",
        path: "/constitutions/us_constitution",
        children: ["original_document", "amendments"]
    },
    original_document: {
        name: "Original Document",
        type: "file",
        fileType: "pdf",
        path: "/constitutions/us_constitution/original_document",
        size: "1.2 MB",
        lastModified: "2023-05-15",
        metadata: {
            title: "United States Constitution - Original Document",
            year: "1787",
            description: "The original text of the United States Constitution",
            authors: ["Constitutional Convention"],
            tags: ["founding document", "constitutional law", "US history"]
        }
    },
    amendments: {
        name: "Amendments",
        type: "directory", 
        path: "/constitutions/us_constitution/amendments",
        children: ["bill_of_rights", "13th_amendment"]
    },
    bill_of_rights: {
        name: "Bill of Rights",
        type: "file",
        fileType: "pdf",
        path: "/constitutions/us_constitution/amendments/bill_of_rights",
        size: "0.8 MB",
        lastModified: "2023-05-15",
        metadata: {
            title: "Bill of Rights",
            year: "1791",
            description: "The first ten amendments to the United States Constitution",
            authors: ["James Madison"],
            tags: ["amendments", "constitutional law", "civil liberties"]
        }
    },
    "13th_amendment": {
        name: "13th Amendment",
        type: "file",
        fileType: "pdf",
        path: "/constitutions/us_constitution/amendments/13th_amendment",
        size: "0.3 MB",
        lastModified: "2023-06-20",
        metadata: {
            title: "13th Amendment",
            year: "1865",
            description: "Constitutional amendment abolishing slavery",
            authors: ["38th United States Congress"],
            tags: ["amendments", "abolition", "civil war"]
        }
    },
    international_constitutions: {
        name: "International Constitutions",
        type: "directory",
        path: "/constitutions/international_constitutions",
        children: ["french_constitution", "german_basic_law"]
    },
    french_constitution: {
        name: "French Constitution",
        type: "file",
        fileType: "pdf",
        path: "/constitutions/international_constitutions/french_constitution",
        size: "1.5 MB",
        lastModified: "2023-07-10",
        metadata: {
            title: "Constitution of the Fifth French Republic",
            year: "1958",
            description: "The current constitution of France",
            authors: ["Constitutional Committee"],
            tags: ["France", "constitutional law", "Fifth Republic"]
        }
    },
    german_basic_law: {
        name: "German Basic Law",
        type: "file",
        fileType: "pdf",
        path: "/constitutions/international_constitutions/german_basic_law",
        size: "1.7 MB",
        lastModified: "2023-07-12",
        metadata: {
            title: "Basic Law for the Federal Republic of Germany",
            year: "1949",
            description: "The constitution of Germany",
            authors: ["Parliamentary Council"],
            tags: ["Germany", "constitutional law", "post-war"]
        }
    },
    legal_documents: {
        name: "Legal Documents",
        type: "directory",
        path: "/legal_documents",
        children: ["supreme_court_decisions", "treaties"]
    },
    supreme_court_decisions: {
        name: "Supreme Court Decisions",
        type: "directory",
        path: "/legal_documents/supreme_court_decisions",
        children: ["marbury_v_madison", "brown_v_board"]
    },
    marbury_v_madison: {
        name: "Marbury v. Madison",
        type: "file",
        fileType: "pdf",
        path: "/legal_documents/supreme_court_decisions/marbury_v_madison",
        size: "0.9 MB",
        lastModified: "2023-08-05",
        metadata: {
            title: "Marbury v. Madison",
            year: "1803",
            description: "Landmark Supreme Court case establishing judicial review",
            authors: ["Chief Justice John Marshall"],
            tags: ["Supreme Court", "judicial review", "landmark case"]
        }
    },
    brown_v_board: {
        name: "Brown v. Board of Education",
        type: "file",
        fileType: "pdf",
        path: "/legal_documents/supreme_court_decisions/brown_v_board",
        size: "1.1 MB",
        lastModified: "2023-08-10",
        metadata: {
            title: "Brown v. Board of Education",
            year: "1954",
            description: "Supreme Court case ruling segregation in public schools unconstitutional",
            authors: ["Chief Justice Earl Warren"],
            tags: ["Supreme Court", "segregation", "civil rights", "education"]
        }
    },
    treaties: {
        name: "Treaties",
        type: "directory",
        path: "/legal_documents/treaties",
        children: ["treaty_of_paris", "un_charter"]
    },
    treaty_of_paris: {
        name: "Treaty of Paris",
        type: "file",
        fileType: "pdf",
        path: "/legal_documents/treaties/treaty_of_paris",
        size: "0.7 MB",
        lastModified: "2023-09-15",
        metadata: {
            title: "Treaty of Paris",
            year: "1783",
            description: "Treaty ending the American Revolutionary War",
            authors: ["Benjamin Franklin", "John Adams", "John Jay"],
            tags: ["treaty", "American Revolution", "diplomacy"]
        }
    },
    un_charter: {
        name: "UN Charter",
        type: "file",
        fileType: "pdf",
        path: "/legal_documents/treaties/un_charter",
        size: "1.3 MB",
        lastModified: "2023-09-20",
        metadata: {
            title: "Charter of the United Nations",
            year: "1945",
            description: "Foundational treaty of the United Nations",
            authors: ["United Nations Conference on International Organization"],
            tags: ["UN", "treaty", "international law", "international organization"]
        }
    },
    historical_archives: {
        name: "Historical Archives",
        type: "directory",
        path: "/historical_archives",
        children: ["declaration_of_independence", "federalist_papers"]
    },
    declaration_of_independence: {
        name: "Declaration of Independence",
        type: "file",
        fileType: "pdf",
        path: "/historical_archives/declaration_of_independence",
        size: "0.6 MB",
        lastModified: "2023-10-05",
        metadata: {
            title: "Declaration of Independence",
            year: "1776",
            description: "Document declaring independence of the thirteen American colonies",
            authors: ["Thomas Jefferson", "Continental Congress"],
            tags: ["American Revolution", "founding document", "US history"]
        }
    },
    federalist_papers: {
        name: "Federalist Papers",
        type: "file",
        fileType: "pdf",
        path: "/historical_archives/federalist_papers",
        size: "2.5 MB",
        lastModified: "2023-10-10",
        metadata: {
            title: "The Federalist Papers",
            year: "1787-1788",
            description: "Collection of 85 articles advocating for the ratification of the US Constitution",
            authors: ["Alexander Hamilton", "James Madison", "John Jay"],
            tags: ["constitutional history", "US history", "federalism"]
        }
    }
};

// Current path for navigation
let currentPath = "/";
let currentPathSegments = [];

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
                } else if (child.fileType === 'pdf') {
                    icon = '<div class="item-icon"><span class="document-icon">📄</span></div>';
                } else if (['jpg', 'png', 'gif', 'jpeg'].includes(child.fileType)) {
                    icon = '<div class="item-icon"><span class="image-icon">🖼️</span></div>';
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
                        // Navigate to file view page
                        window.location.href = `file-view.html?id=${id}`;
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

newDirForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const dirName = document.getElementById('dir-name').value;
    const dirDescription = document.getElementById('dir-description').value;
    
    // Generate a unique ID for the new directory
    const dirId = dirName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    
    // Create new directory object
    const newDir = {
        name: dirName,
        type: 'directory',
        path: currentPath === '/' ? `/${dirId}` : `${currentPath}/${dirId}`,
        children: []
    };
    
    // Add to archive data
    archiveData[dirId] = newDir;
    
    // Find parent directory and add new dir to its children
    const parentDir = findDirectoryByPath(currentPath);
    if (parentDir) {
        if (!parentDir.children) {
            parentDir.children = [];
        }
        parentDir.children.push(dirId);
    }
    
    // Close modal
    newDirModal.style.display = 'none';
    
    // Refresh directory tree and content
    buildDirectoryTree();
    updateContentGrid();
    
    // Reset form
    document.getElementById('dir-name').value = '';
    document.getElementById('dir-description').value = '';
});

// Handle "Upload Files" button click
const uploadBtn = document.getElementById('upload-btn');
uploadBtn.addEventListener('click', function () {
    const directoryPath = currentPath === '/' ? '/' : currentPath;
    window.location.href = `admin-add.html?directory=${encodeURIComponent(directoryPath)}`;
});


// Initialize the page
buildDirectoryTree();
updatePathNavigation();
updateContentGrid();
