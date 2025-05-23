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


// New loadDataFromFirestore using  Express API
async function loadDataFromFirestore() {
  try {
    // 1) Fetch all directories (you'll need a /api/directories endpoint)
    const dirRes = await fetch("http://localhost:4000/api/directories");
    const directories = await dirRes.json();
    directories.forEach(dirData => {
      addDirectoryToHierarchy(dirData.id, dirData);
    });

    // 2) Fetch all documents
    const fileRes = await fetch("http://localhost:4000/api/files");
    const files = await fileRes.json();
    files.forEach(fileData => {
      addDocumentToHierarchy(fileData.id, fileData);
    });

    // 3) Build the UI
    initializeUI();

  } catch (err) {
    console.error("Error loading data from API:", err);
  }
}


// Function to add a directory to the hierarchical structure
function addDirectoryToHierarchy(id, directoryData) {
  const dirPath     = directoryData.path || "/";
  const pathSegments = dirPath.split('/').filter(s => s);

  let currentNode = archiveData.root;
  let currentPath = "";

  for (let i = 0; i < pathSegments.length; i++) {
    const segment     = pathSegments[i];
    currentPath      += `/${segment}`;
    const isTargetDir = i === pathSegments.length - 1;
    const segmentId   = isTargetDir 
      ? id 
      : segment.toLowerCase().replace(/\s+/g, '_');

    let found = false;
    currentNode.children = currentNode.children || [];
    for (const childId of currentNode.children) {
      if (
        archiveData[childId] && 
        archiveData[childId].path === currentPath
      ) {
        currentNode = archiveData[childId];
        found = true;
        break;
      }
    }

    if (!found) {
      archiveData[segmentId] = {
        name:        directoryData.name  || segment,
        type:        "directory",
        path:        currentPath,
        children:    [],
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
  const directoryPath = (documentData.directory || "/").replace(/\/$/,'');
  const pathSegments  = directoryPath.split('/').filter(s => s);

  let currentNode = archiveData.root;
  let currentPath = "";

  // Re-create any missing folders in memory
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    currentNode.children = currentNode.children || [];
    let foundChild = null;
    for (const childId of currentNode.children) {
      if (
        archiveData[childId] && 
        archiveData[childId].path === currentPath
      ) {
        foundChild = childId;
        break;
      }
    }
    if (!foundChild) {
      const childId = `${segment.toLowerCase().replace(/\s+/g,'_')}_${Date.now()}`;
      archiveData[childId] = {
        name:        segment,
        type:        "directory",
        path:        currentPath,
        children:    [],
        description: ""
      };
      currentNode.children.push(childId);
      currentNode = archiveData[childId];
    } else {
      currentNode = archiveData[foundChild];
    }
  }

  // Finally add the file
  const fileId = `file_${id}`;
  archiveData[fileId] = {
    name:         documentData.title,
    type:         "file",
    fileType:     documentData.fileType   || "document",
    path:         `${currentPath}/${documentData.title.replace(/\s+/g,'_').toLowerCase()}`,
    size:         documentData.fileSize   || "Unknown",
    lastModified: documentData.uploadedAt || new Date().toISOString(),
    metadata:     { ...documentData },
    firestoreId:  id
  };

  currentNode.children = currentNode.children || [];
  currentNode.children.push(fileId);
}

// Function to save a directory to Firestore - COMMENTED OUT
async function saveDirectoryToFirestore(id, directoryData) {
  try {
    // Send the new directory to your Express API
    const res = await fetch("http://localhost:4000/api/directories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        name:        directoryData.name,
        path:        directoryData.path,
        description: directoryData.description || ""
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || res.statusText);
    }

    // Expect your API to return { id: "<new-firestore-doc-id>" }
    const { id: firestoreId } = await res.json();
    console.log("Directory saved with Firestore ID:", firestoreId);
    return firestoreId;

  } catch (error) {
    console.error("Error saving directory via API:", error);
    throw error;
  }
}


// Inside initializeUI(), 
// Inside hierarcy.js
function initializeUI() {
// ── Grab modal, form, and buttons from the DOM ──
const newDirBtn          = document.getElementById('new-dir-btn');
const newDirModal        = document.getElementById('new-dir-modal');
const cancelDirBtn       = document.getElementById('cancel-dir-btn');
const newDirForm         = document.getElementById('new-dir-form');

// ── 1) Build the existing tree & UI ──
buildDirectoryTree();
updatePathNavigation();
updateContentGrid();

// ── 2) "New Directory" button opens the <dialog> ──
if (newDirBtn && newDirModal) {
  newDirBtn.addEventListener('click', () => {
    newDirModal.showModal();
  });
}

// ── 3) Cancel button closes the dialog ──
if (cancelDirBtn && newDirModal) {
  cancelDirBtn.addEventListener('click', () => {
    newDirModal.close();
  });
}

// ── 4) Form submission creates & persists the new folder ──
if (newDirForm && newDirModal) {
  newDirForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Gather inputs
    const dirName        = document.getElementById('dir-name').value.trim();
    const dirDescription = document.getElementById('dir-description').value.trim();
    const dirPath        = currentPath === '/'
      ? `/${dirName}`
      : `${currentPath}/${dirName}`;

    // Build in-memory object
    const newDir = {
      name:        dirName,
      type:        'directory',
      path:        dirPath,
      children:    [],
      description: dirDescription
    };

    try {
      // Persist via your Express API
      const response    = await fetch('http://localhost:4000/api/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDir)
      });
      const { id }      = await response.json();  // assume { id: "<firestoreId>" }
      newDir.firestoreId = id;

      // Inject into in-memory hierarchy
      archiveData[id] = newDir;
      const parent = findDirectoryByPath(currentPath);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(id);
      }

      // Close modal, rebuild UI, and reset form
      newDirModal.close();
      buildDirectoryTree();
      updateContentGrid();
      newDirForm.reset();

      console.log("Directory created and saved with ID:", id);
    } catch (error) {
      console.error("Error creating directory:", error);
      alert("Failed to create directory. Please try again.");
    }
  });
}

// ── 5) Handle "Upload Files" button click ──
const uploadBtn           = document.getElementById('upload-btn');
const emptyStateUploadBtn = document.querySelector('.empty-state .btn');

function goToUpload() {
  const directoryPath = currentPath === '/' ? '/' : currentPath;
  window.location.href = `admin-add.html?directory=${encodeURIComponent(directoryPath)}`;
}

if (uploadBtn) {
  uploadBtn.addEventListener('click', goToUpload);
}
if (emptyStateUploadBtn) {
  emptyStateUploadBtn.addEventListener('click', goToUpload);
}

// ── 6) Per-directory search within the grid ──
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    const term = this.value.toLowerCase();
    document.querySelectorAll('.item-card').forEach(item => {
      const name = item.querySelector('.item-name').textContent.toLowerCase();
      item.style.display = name.includes(term) ? 'flex' : 'none';
    });
  });
}
}



// Function to create a directory structure from a path string and save each new folder
async function createDirectoryStructure(directoryPath) {
  // Split into segments, e.g. "/foo/bar" → ["foo","bar"]
  const pathSegments = directoryPath
    .split('/')
    .filter(segment => segment !== '');

  let currentNode = archiveData.root;
  let currentPath = "";

  for (const segment of pathSegments) {
    currentPath += `/${segment}`;

    // Ensure children array exists
    currentNode.children = currentNode.children || [];

    // Check if this segment already exists
    let foundChildId = currentNode.children.find(childId =>
      archiveData[childId] && archiveData[childId].path === currentPath
    );

    // If it doesn't exist, create & persist it
    if (!foundChildId) {
      // Build the new directory object
      const newDir = {
        name:        segment,
        type:        "directory",
        path:        currentPath,
        children:    [],
        description: ""
      };

      try {
        // 🔄 Persist via API and get the real Firestore ID
        const firestoreId = await saveDirectoryToFirestore(null, newDir);
        newDir.firestoreId = firestoreId;

        // Store in memory under its Firestore ID
        archiveData[firestoreId] = newDir;
        currentNode.children.push(firestoreId);

        // Move into the new node
        currentNode = archiveData[firestoreId];

      } catch (error) {
        console.error("Error creating directory in structure:", error);
        throw error;
      }

    } else {
      // Already exists: just descend into it
      currentNode = archiveData[foundChildId];
    }
  }

  return currentPath;
}


// UPDATED: Function to build directory tree with collapsible functionality
function buildDirectoryTree() {
  const rootUl = document.getElementById('root-directory');
  rootUl.innerHTML = '';
  
  // Add root directory
  const rootLi = document.createElement('li');
  rootLi.innerHTML = `
      <article class="directory active" data-path="/">
          <button class="directory-toggle" type="button" aria-label="Toggle directory">▼</button>
          <i class="directory-icon" aria-hidden="true">📁</i>
          <h3 class="directory-name">Root</h3>
      </article>
  `;
  rootUl.appendChild(rootLi);
  
  // Add first level directories
  const rootChildren = archiveData.root.children;
  if (rootChildren && rootChildren.length > 0) {
      const childrenUl = document.createElement('ul');
      childrenUl.className = 'directory-children';
      rootLi.appendChild(childrenUl);
      
      rootChildren.forEach(childId => {
          const child = archiveData[childId];
          if (child && child.type === 'directory') {
              buildDirectoryItem(childrenUl, child, childId);
          }
      });
  }
  
  // Add click event listeners to directory toggles
  document.querySelectorAll('.directory-toggle').forEach(toggle => {
      toggle.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent directory selection
          
          const li = this.closest('li');
          const childrenUl = li.querySelector('ul');
          
          if (childrenUl) {
              // Toggle visibility
              const isExpanded = childrenUl.style.display !== 'none';
              if (isExpanded) {
                  childrenUl.style.display = 'none';
                  this.textContent = '▶'; // Right arrow
                  this.setAttribute('aria-expanded', 'false');
              } else {
                  childrenUl.style.display = 'block';
                  this.textContent = '▼'; // Down arrow
                  this.setAttribute('aria-expanded', 'true');
              }
          }
      });
  });
  
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

// New function to build a directory item with its children
function buildDirectoryItem(parentUl, directory, directoryId) {
  const hasChildren = directory.children && directory.children.length > 0 && 
                     directory.children.some(childId => archiveData[childId] && archiveData[childId].type === 'directory');
  
  const dirLi = document.createElement('li');
  dirLi.innerHTML = `
      <article class="directory" data-path="${directory.path}">
          ${hasChildren ? 
              '<button class="directory-toggle" type="button" aria-label="Toggle directory" aria-expanded="false">▶</button>' : 
              '<span class="directory-spacer" aria-hidden="true"></span>'}
          <i class="directory-icon" aria-hidden="true">📁</i>
          <h4 class="directory-name">${directory.name}</h4>
      </article>
  `;
  parentUl.appendChild(dirLi);
  
  // Add children if any
  if (hasChildren) {
      const childrenUl = document.createElement('ul');
      childrenUl.className = 'directory-children';
      childrenUl.style.display = 'none'; // Start collapsed
      dirLi.appendChild(childrenUl);
      
      // Add each child directory (but not files)
      directory.children.forEach(childId => {
          const child = archiveData[childId];
          if (child && child.type === 'directory') {
              buildDirectoryItem(childrenUl, child, childId);
          }
      });
  }
}

// Function to navigate to a specific path
function navigateToPath(path) {
  currentPath = path;
  currentPathSegments = path.split('/').filter(segment => segment !== '');
  
  // Update path navigation
  updatePathNavigation();
  
  // Update content grid
  updateContentGrid();
  
  // Update expanded state in directory tree
  expandDirectoryPath(path);
}

// New function to expand directories along a path
function expandDirectoryPath(path) {
  if (path === '/') return;
  
  const pathSegments = path.split('/').filter(segment => segment !== '');
  let currentPath = '';
  
  // Expand each segment in the path
  for (let i = 0; i < pathSegments.length; i++) {
      currentPath += '/' + pathSegments[i];
      
      // Find the directory element with this path
      const dirElement = document.querySelector(`.directory[data-path="${currentPath}"]`);
      if (dirElement) {
          // Find parent li and its child ul
          const parentLi = dirElement.closest('li');
          const childrenUl = parentLi.querySelector('ul');
          
          // Expand if it has children
          if (childrenUl) {
              childrenUl.style.display = 'block';
              const toggle = dirElement.querySelector('.directory-toggle');
              if (toggle) {
                  toggle.textContent = '▼'; // Down arrow
                  toggle.setAttribute('aria-expanded', 'true');
              }
          }
      }
  }
}

// Update the path navigation breadcrumb
function updatePathNavigation() {
  const pathNav = document.getElementById('path-navigation');
  pathNav.innerHTML = '<a href="#" data-path="/" class="breadcrumb-link">Root</a>';
  
  let currentBuildPath = '';
  currentPathSegments.forEach((segment, index) => {
      currentBuildPath += '/' + segment;
      
      // Find the proper name for this path segment
      let displayName = segment;
      Object.keys(archiveData).forEach(key => {
          if (archiveData[key].path === currentBuildPath) {
              displayName = archiveData[key].name;
          }
      });
      
      // Add separator
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.setAttribute('aria-hidden', 'true');
      separator.textContent = '/';
      pathNav.appendChild(separator);
      
      if (index === currentPathSegments.length - 1) {
          // Last segment (current directory)
          const currentSpan = document.createElement('span');
          currentSpan.className = 'breadcrumb-current';
          currentSpan.setAttribute('aria-current', 'page');
          currentSpan.textContent = displayName;
          pathNav.appendChild(currentSpan);
      } else {
          // Navigable segment
          const link = document.createElement('a');
          link.href = '#';
          link.className = 'breadcrumb-link';
          link.setAttribute('data-path', currentBuildPath);
          link.textContent = displayName;
          pathNav.appendChild(link);
      }
  });
  
  // Add click event listeners to path links
  document.querySelectorAll('#path-navigation .breadcrumb-link').forEach(link => {
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
              let itemType = '';
              
              if (child.type === 'directory') {
                  icon = '<figure class="item-icon"><i class="folder-icon" aria-hidden="true">📁</i></figure>';
                  itemType = 'Directory';
              } else if (child.fileType === 'document' || child.fileType === 'pdf') {
                  icon = '<figure class="item-icon"><i class="document-icon" aria-hidden="true">📄</i></figure>';
                  itemType = child.fileType.toUpperCase();
              } else if (child.fileType === 'video') {
                  icon = '<figure class="item-icon"><i class="video-icon" aria-hidden="true">🎬</i></figure>';
                  itemType = 'VIDEO';
              } else if (child.fileType === 'image') {
                  icon = '<figure class="item-icon"><i class="image-icon" aria-hidden="true">🖼️</i></figure>';
                  itemType = 'IMAGE';
              } else if (child.fileType === 'audio') {
                  icon = '<figure class="item-icon"><i class="audio-icon" aria-hidden="true">🔊</i></figure>';
                  itemType = 'AUDIO';
              } else {
                  icon = '<figure class="item-icon"><i class="file-icon" aria-hidden="true">📝</i></figure>';
                  itemType = 'FILE';
              }
              
              const itemCard = document.createElement('article');
              itemCard.className = 'item-card';
              itemCard.setAttribute('data-id', childId);
              itemCard.setAttribute('role', 'button');
              itemCard.setAttribute('tabindex', '0');
              itemCard.innerHTML = `
                  ${icon}
                  <section class="item-details">
                      <h3 class="item-name">${child.name}</h3>
                      <p class="item-meta">
                          ${child.type === 'file' ? `${itemType} · ${child.size}` : itemType}
                      </p>
                  </section>
              `;
              contentGrid.appendChild(itemCard);
              
              // Add click and keyboard event handlers
              function handleItemActivation() {
                  const id = itemCard.getAttribute('data-id');
                  const item = archiveData[id];
                  
                  if (item.type === 'directory') {
                      navigateToPath(item.path);
                  } else {
                      // Navigate to file view page or show details
                      if (item.firestoreId) {
                          window.location.href = `../delete/preview.html?id=${item.firestoreId}`;
                          localStorage.setItem('selectedID', item.firestoreId);
                      } else {
                          alert(`Viewing file: ${item.name}`);
                      }
                  }
              }
              
              itemCard.addEventListener('click', handleItemActivation);
              itemCard.addEventListener('keydown', function(e) {
                  if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemActivation();
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

// Initialize the application by loading data via your API
document.addEventListener('DOMContentLoaded', function() {
  loadDataFromFirestore();

  // Setup logout functionality
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      window.location.href = './home_page/admin_home.html';
    });
  }
});



module.exports = {
  archiveData,
  initializeUI,
  currentPath,
  navigateToPath,
  findDirectoryByPath,
  addDirectoryToHierarchy,
  addDocumentToHierarchy,
  loadDataFromFirestore
};