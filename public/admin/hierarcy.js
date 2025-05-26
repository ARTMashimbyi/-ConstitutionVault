// ─── API BASE ─────────────────────────────────────────────────────────────

const hostname = window.location.hostname;
const API_BASE =
  hostname === "localhost" || hostname.startsWith("127.0.0.1")
    ? "http://localhost:4000/api"
    : "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api";

  

let isLoading = false;



function setLoading(loading, message = 'Refreshing…') {
  isLoading = loading;
  let banner = document.getElementById('statusBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'statusBanner';
    banner.className = 'status-banner';
    document.querySelector('.main-content').prepend(banner);
  }
  if (loading) {
    banner.textContent = message;
    banner.className = 'status-banner info';
    banner.style.display = 'block';
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
  } else {
    banner.style.display = 'none';
    document.querySelectorAll('button').forEach(btn => btn.disabled = false);
  }
}


let bannerTimeout = null;

/**
 * Displays a banner message at the top of your main‐content.
 * type can be 'info', 'success' or 'error'
 */
function showStatus(message, type = 'info') {
  let banner = document.getElementById('statusBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id        = 'statusBanner';
    banner.className = 'status-banner';
    document.querySelector('.main-content').prepend(banner);
  }
  banner.textContent   = message;
  banner.className     = `status-banner ${type}`;
  banner.style.display = 'block';

  // Clear any previous timeout to prevent overlap
  if (bannerTimeout) clearTimeout(bannerTimeout);

  // Hide after 1.5 seconds for all message types
  bannerTimeout = setTimeout(() => {
    banner.style.display = 'none';
    bannerTimeout = null; // Clean up
  }, 150);
}




// Structure to store our hierarchical data; will be filled from the API
let archiveData = {};

// Current path for navigation (always starts at “/” for Root)
let currentPath = '/';

let allFiles = []

/**
 * Fetches all folders and files from your Express API, seeds archiveData,
 * then kicks off the UI rendering.
 */
async function loadDataFromFirestore() {
  try {
    console.log('⏳  Fetching directories from API…');
    const dirRes = await fetch(`${API_BASE}/directories`);
    if (!dirRes.ok) {
      throw new Error(`Failed to fetch directories: ${dirRes.status}`);
    }
    let directories = await dirRes.json();
    console.log('✅  Raw directories:', directories);

    // Normalize all incoming paths so findDirectoryByPath will work
    directories = directories.map(d => ({
      ...d,
      path: normalizePath(d.path)
    }));
    console.log('✅  Normalized directories:', directories);

    // --- Add ROOT first ---
    const rootDir = directories.find(d => d.path === '/');
    if (!rootDir) throw new Error('Root folder not returned by API');
    addDirectoryToHierarchy(rootDir.id, rootDir);

    // --- Add all other directories in order of depth (shallowest to deepest) ---
    directories
      .filter(d => d.path !== '/')
      .sort((a, b) =>
        a.path.split('/').length - b.path.split('/').length
      )
      .forEach(d => addDirectoryToHierarchy(d.id, d));

    console.log('✅  archiveData after directories:', archiveData);

    // --- Now do files ---
    console.log('⏳  Fetching files...');
    const fileRes = await fetch(`${API_BASE}/files`);
    if (!fileRes.ok) {
      throw new Error(`Failed to fetch files: ${fileRes.status}`);
    }
    const files = await fileRes.json();
    allFiles = files; // <-- Assign to global for grid update!
    files.forEach(f => addDocumentToHierarchy(f.id, f));
    console.log('✅  archiveData after files:', archiveData);

    // --- Finally spin up the UI ---
    initializeUI();
  } catch (err) {
    console.error('🔥 loadDataFromFirestore error:', err);
    showStatus('❌ Failed to load data', 'error');
  }
}

// (Optional debug)
// console.log('archiveData:', JSON.stringify(archiveData, null, 2));

 

/**
 * Inserts a directory node into our in-memory hierarchy.
 *
 * @param {string} id            Firestore document ID for this directory
 * @param {object} directoryData The data from GET /api/directories
 *   { name, path, description? }
 */
function addDirectoryToHierarchy(id, directoryData) {
  const dirPath = normalizePath(directoryData.path);

  // Root directory ("/") is special: only one root
  if (dirPath === '/') {
    const existing = archiveData[id] || { children: [] };
    archiveData[id] = {
      id,
      firestoreId: id,
      name: directoryData.name || existing.name || 'Root',
      type: 'directory',
      path: '/',
      children: existing.children,
      description: directoryData.description || existing.description || ''
    };
    return;
  }

  // Find parent by normalized path
  const idx = dirPath.lastIndexOf('/');
  const parentPath = idx === 0 ? '/' : dirPath.slice(0, idx);
  const parentDir = findDirectoryByPath(parentPath);

  if (!parentDir) {
    console.warn(`Parent folder "${parentPath}" not found for "${dirPath}"`);
    return;
  }

  // Add or update this node, keeping any children already present
  const existing = archiveData[id] || { children: [] };
  archiveData[id] = {
    id,
    firestoreId: id,
    name: directoryData.name || existing.name || 'Unnamed',
    type: 'directory',
    path: dirPath,
    children: existing.children,
    description: directoryData.description || existing.description || ''
  };

  // Link this directory into its parent's children array by ID
  parentDir.children = parentDir.children || [];
  if (!parentDir.children.includes(id)) {
    parentDir.children.push(id);
  }
}



/**
 * Normalize incoming path so it has exactly one leading slash,
 * no trailing slash (unless it’s just "/"), and drops any "/Root" prefix.
 */
function normalizePath(raw) {
  let p = raw || '/';

  // Remove duplicate slashes everywhere
  p = p.replace(/\/+/g, '/');

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;

  // Remove exact "/Root" or "/Root/" prefix (but not "/Rooted")
  if (p === '/Root' || p === '/Root/') p = '/';
  else if (p.startsWith('/Root/')) p = p.slice(5); // "/Root/abc" -> "/abc"

  // Remove trailing slash (but keep "/" alone)
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  // After slice, ensure still at least "/"
  if (p === '') p = '/';

  return p;
}



/**
 * Adds a file into our in-memory hierarchy under its directory.
 *
 * @param {string} id            Firestore document ID
 * @param {object} documentData  The metadata you got from GET /api/files or getFileById
 */
function addDocumentToHierarchy(id, documentData) {
  // ── 1) Normalize the directory path (foo, /Foo/, FOO/ → "/Foo")
  const dirPath = normalizePath(documentData.directory);

  // ── 2) Lookup its parent directory
  const parent = findDirectoryByPath(dirPath);
  if (!parent) {
    console.warn(`Parent folder "${dirPath}" not found for file ${id}`);
    return;
  }
  parent.children = parent.children || [];

  // ── 3) Build or update the file node (preserving any existing fields)
  const existing = archiveData[id] || {};

  // Construct and normalize the full file path
  const rawFilePath = dirPath === '/'
    ? `/${documentData.title}`
    : `${dirPath}/${documentData.title}`;
  const filePath = normalizePath(rawFilePath);

  const fileNode = {
    id,
    firestoreId:  id,
    name:         documentData.title       || existing.name,
    type:         'file',
    fileType:     documentData.fileType    || existing.fileType || 'document',
    path:         filePath,
    size:         documentData.fileSize    || existing.size     || 'Unknown',
    lastModified: documentData.uploadedAt  || existing.lastModified,
    metadata:     documentData
  };

  archiveData[id] = fileNode;

  // ── 4) Link it under its parent if not already present
  if (!parent.children.includes(id)) {
    parent.children.push(id);
  }
}


/**
 * Create or update a directory via your Express API.
 * If directoryData.id is present, does PATCH /api/directories/:id,
 * otherwise does POST /api/directories.
 *
 * @param {Object} directoryData
 *   - id?           Firestore ID when updating
 *   - name          directory name
 *   - path          full path string
 *   - description?  optional description
 *   - children?     optional children array (only needed when updating)
 * @returns {Promise<string>}
 *   The Firestore ID of the created or updated directory
 */
async function saveDirectory(directoryData) {
  let { id, name, path, description = "", children } = directoryData;

  // ── Normalize the path so we never send "/Root/foo/" or "foo" to the API
  path = normalizePath(path);

  // ── Determine URL and HTTP method
  const url    = id
    ? `${API_BASE}/directories/${encodeURIComponent(id)}`
    : `${API_BASE}/directories`;
  const method = id ? "PATCH" : "POST";

  // ── Build payload (omit id)
  const payload = { name, path, description };
  if (children) payload.children = children;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errMsg = res.statusText;
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch (_) {}
      throw new Error(`${method} failed: ${res.status} ${errMsg}`);
    }

    // On POST you'll get { id: "<new-id>" }; on PATCH you might or might not
    const json       = await res.json();
    const returnedId = json.id || id;
    console.log(
      `Directory ${method === "POST" ? "created" : "updated"} with ID:`,
      returnedId
    );
    return returnedId;

  } catch (err) {
    console.error("Error saving directory:", err);
    throw err;
  }
}


// debug: catch any click inside the tree container
const treeEl = document.getElementById('root-directory');
if (treeEl) {
  treeEl.addEventListener('click', e => {
    const path = e.target.closest('[data-path]')?.dataset.path;
    console.log('⚡ Tree click:', e.target, '→ path:', path);
  });
}


function removeOldDeleteButtons() {
  document.querySelectorAll('.delete-dir-btn').forEach(btn => btn.remove());
}

/**
 * Initializes all UI event handlers and renders the initial view.
 */
function initializeUI() {
  // ── Grab modal, form, and buttons from the DOM ──
  const newDirBtn    = document.getElementById('new-dir-btn');
  const newDirModal  = document.getElementById('new-dir-modal');
  const cancelDirBtn = document.getElementById('cancel-dir-btn');
  const newDirForm   = document.getElementById('new-dir-form');

  // ── 1) Build the directory tree and initial panels ──
  buildDirectoryTree();
  updatePathNavigation();
  updateContentGrid();

  // ── 2) “New Directory” button opens the <dialog> ──
  if (newDirBtn && newDirModal) {
    newDirBtn.addEventListener('click', () => newDirModal.showModal());
  }

  // ── 3) Cancel button closes the dialog ──
  if (cancelDirBtn && newDirModal) {
    cancelDirBtn.addEventListener('click', () => newDirModal.close());
  }

  // ── 4) Form submission creates & persists the new folder ──
  if (newDirForm && newDirModal) {
    newDirForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name        = document.getElementById('dir-name').value.trim();
      const description = document.getElementById('dir-description').value.trim();
      const parentPath  = getCurrentPath();
      const path        = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
      const newDir      = { name, path, children: [], description };
      try {
        setLoading(true, 'Creating directory...');
        newDirBtn.disabled = true;
        await saveDirectory(newDir);
        newDirModal.close();
        newDirForm.reset();
        await loadDataFromFirestore(); // FULLY reload all data
        navigateToPath(path);
        showStatus('✅ Directory created', 'success');
      } catch {
        showStatus('❌ Failed to create directory', 'error');
      } finally {
        setLoading(false);
        newDirBtn.disabled = false;
      }
    });
  }

  // ── 5) Handle "Upload Files" button click ──
  const uploadBtn           = document.getElementById('upload-btn');
  const emptyStateUploadBtn = document.querySelector('.empty-state button');
  const goToUpload = () => {
    const dir = getCurrentPath();
    window.location.href = `admin-add.html?directory=${encodeURIComponent(dir)}`;
  };
  uploadBtn?.addEventListener('click', goToUpload);
  emptyStateUploadBtn?.addEventListener('click', goToUpload);

  // ── 6) Inject "Delete Folder" button into the same btn-group ──
const btnGroup = document.querySelector('.btn-group');
if (btnGroup) {
  // Remove previous delete buttons to avoid duplicates
  removeOldDeleteButtons();

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'btn delete-dir-btn';
  deleteBtn.textContent = 'Delete Folder';

  deleteBtn.addEventListener('click', async () => {
    const dir = findDirectoryByPath(getCurrentPath());
    if (!dir || dir.path === '/') {
      return showStatus("❌ You can’t delete the Root folder.", "error");
    }
    if (!confirm(`Delete "${dir.name}" and all its contents?`)) return;
  
    try {
      setLoading(true, 'Deleting folder...');
      deleteBtn.disabled = true;
  
      // 1. Delete on the backend
      const response = await fetch(`${API_BASE}/directories/${dir.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed on server');
  
      // 2. FORCE full page reload so UI always reflects backend
      window.location.reload();
  
      // (The code below won't run after reload, so you can remove it)
      // await loadDataFromFirestore();
      // navigateToPath('/');
      // showStatus('✅ Folder deleted', 'success');
    } catch (e) {
      showStatus('❌ Failed to delete folder', 'error');
      console.error('Delete folder error:', e);
    } finally {
      setLoading(false);
      deleteBtn.disabled = false;
    }
  });
  
  btnGroup.append(deleteBtn);
}


  // ── 7) Per-directory search within the grid ──
  const searchInput = document.querySelector('.search-bar input');
  searchInput?.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    document.querySelectorAll('.item-card').forEach(card => {
      const name = card.querySelector('.item-name').textContent.toLowerCase();
      card.style.display = name.includes(term) ? 'grid' : 'none';
    });
  });
}


/**
 * Ensures a nested path of folders exists, creating any missing ones via the API.
 * @param {string} directoryPath  e.g. "/foo/bar/baz"
 * @returns {Promise<string>}     The normalized path (same as input)
 */
async function createDirectoryStructure(directoryPath) {
  // 1) normalize once up‐front
  const targetPath = normalizePath(directoryPath);
  const segments   = targetPath.split('/').filter(Boolean);

  // 2) start at root
  const rootDir = findDirectoryByPath('/');
  if (!rootDir) throw new Error('Root directory not found in memory');
  let currentId = rootDir.id;
  let accumPath = '';

  // 3) walk each segment, creating via saveDirectory(...) if missing
  for (const segment of segments) {
    accumPath += '/' + segment;
    const path = normalizePath(accumPath);

    // ensure children array
    archiveData[currentId].children ||= [];

    // do we already have a child at this path?
    let childId = archiveData[currentId].children.find(id => {
      const node = archiveData[id];
      return node &&
             node.type === 'directory' &&
             normalizePath(node.path) === path;
    });

    if (!childId) {
      // create it on the server
      const newDirData = {
        name:        segment,
        path:        path,
        description: '',
        children:    []
      };
      const firestoreId = await saveDirectory(newDirData);

      // record it in memory
      archiveData[firestoreId] = {
        id:          firestoreId,
        firestoreId: firestoreId,
        name:        segment,
        type:        'directory',
        path:        path,
        description: '',
        children:    []
      };
      archiveData[currentId].children.push(firestoreId);
      childId = firestoreId;
    }

    // descend
    currentId = childId;
  }

  return targetPath;
}


/**
 * Builds the sidebar directory tree with collapsible nodes,
 * using buildDirectoryItem(...) so each header gets its click listener.
 */
function buildDirectoryTree() {
  const rootUl = document.getElementById('root-directory');
  if (!rootUl) {
    console.error('#root-directory UL not found');
    return;
  }
  rootUl.innerHTML = '';  // wipe out old tree

  const rootDir = findDirectoryByPath('/');
  if (!rootDir) {
    console.error('Root ("/") missing from archiveData');
    return;
  }

  // Recurse helper
  function recurse(parentUl, dir) {
    const id = dir.firestoreId || dir.id;
    buildDirectoryItem(parentUl, dir, id);
  }

  // Kick it off
  recurse(rootUl, rootDir);
}


// Handler for any folder-link click
function onTreeClick(e) {
  const link = e.target.closest('a.directory-link');
  if (!link) return;
  e.preventDefault();
  const path = link.dataset.path;
  if (!path) {
    console.warn('Tree link missing data-path:', link);
    return;
  }
  console.log('🌳 clicked folder link:', path);
  navigateToPath(path); // Already normalizes path
}



/**
 * Creates a <li> + <div class="directory"> item (with toggle) and appends it to parentUl.
 * @param {HTMLUListElement} parentUl
 * @param {Object} directory     One entry from archiveData
 * @param {string} directoryId   Its key in archiveData
 */
function buildDirectoryItem(parentUl, directory, directoryId) {
  // ── Debug: confirm we got the right inputs
  console.log('Built tree item:', directory.name, '→', directory.path);

  // Determine whether this node has nested folders
  const hasChildren = Array.isArray(directory.children) &&
    directory.children.some(id => archiveData[id]?.type === 'directory');

  // Build the <li> wrapper and the header bar
  const li     = document.createElement('li');
  const header = document.createElement('div');
  header.className  = 'directory';
  header.dataset.id = directoryId;

  // Normalize and store the path (trimmed, stripping any "/Root")
  const path = normalizePath(directory.path);
  header.dataset.path = path;

  // ── Immediately attach a click listener to this header
  header.addEventListener('click', e => {
    e.stopPropagation();
    console.log('👉 clicked header:', path);

    // 1) navigate into exactly this folder
    navigateToPath(path);

    // 2) expand all parent levels in the sidebar
    expandDirectoryPath(path);

    // 3) highlight the active node
    document.querySelectorAll('.directory').forEach(d => d.classList.remove('active'));
    header.classList.add('active');
  });

  // The toggle arrow (or a spacer if no children)
  const toggle = document.createElement('span');
  if (hasChildren) {
    toggle.className   = 'directory-toggle';
    toggle.textContent = '▶';
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const sub = li.querySelector('ul.directory-children');
      if (!sub) return;
      const show = sub.style.display !== 'block';
      sub.style.display  = show ? 'block' : 'none';
      toggle.textContent = show ? '▼' : '▶';
    });
  } else {
    toggle.className   = 'directory-spacer';
    toggle.textContent = '';
  }

  // Folder icon and name
  const icon = document.createElement('span');
  icon.className   = 'directory-icon';
  icon.textContent = '📁';

  const name = document.createElement('span');
  name.className   = 'directory-name';
  name.textContent = directory.name;

  header.append(toggle, icon, name);
  li.appendChild(header);

  // If there are sub-folders, build them recursively
  if (hasChildren) {
    const childrenUl = document.createElement('ul');
    childrenUl.className     = 'directory-children';
    childrenUl.style.display = 'none';
    directory.children.forEach(childId => {
      const child = archiveData[childId];
      if (child?.type === 'directory') {
        buildDirectoryItem(childrenUl, child, childId);
      }
    });
    li.appendChild(childrenUl);
  }

  parentUl.appendChild(li);
}



/**
 * Navigate to a given folder path.
 * Rebuilds the UI to reflect that directory.
 *
 * @param {string} path  e.g. "/foo/bar"
 */
function navigateToPath(path) {
  // 1) Canonicalize the path
  const normalized = normalizePath(path);

  // 2) Check if the directory exists; if not, fallback to root
  const dir = findDirectoryByPath(normalized);
  if (!dir) {
    showStatus(`❌ Directory not found: ${normalized}`, 'error');
    // Optionally, navigate to root as a fallback
    currentPath = '/';
  } else {
    currentPath = normalized;
  }

  // 3) Rebuild the breadcrumb navigation
  updatePathNavigation();

  // 4) Re-render the grid of folders/files
  updateContentGrid();

  // 5) Expand that path in the sidebar tree (if sidebar exists)
  if (typeof expandDirectoryPath === "function") {
    expandDirectoryPath(currentPath);
  }
}




/**
 * Expands all directory nodes in the sidebar tree
 * so that the given path is visible/open.
 *
 * @param {string} targetPath  e.g. "/foo/bar"
 */
function expandDirectoryPath(targetPath) {
  // 1) canonicalize the incoming path
  const normalizedTarget = normalizePath(targetPath);
  if (normalizedTarget === '/') return;

  // 2) walk each segment of "/foo/bar" → ["foo","bar"]
  const segments = normalizedTarget.slice(1).split('/');
  let accumPath = '';

  segments.forEach(segment => {
    accumPath += '/' + segment;
    const pathToOpen = normalizePath(accumPath);

    // 3) find the directory label that matches this exact normalized path
    const dirLabel = document.querySelector(
      `.directory[data-path="${pathToOpen}"]`
    );
    if (!dirLabel) return;

    // 4) expand its <ul> of children
    const parentLi  = dirLabel.closest('li');
    const childrenUl = parentLi?.querySelector('ul.directory-children');
    if (childrenUl) {
      childrenUl.style.display = 'block';
      // update the toggle arrow if present
      const toggleIcon = dirLabel.querySelector('.directory-toggle');
      if (toggleIcon) toggleIcon.textContent = '▼';
    }
  });
}


/**
 * Returns the true current path from the app state.
 */
function getCurrentPath() {
  return currentPath;
}




/**
 * Rebuilds the breadcrumb nav based on currentPath.
 * Ensures each <a> has a proper data-path for moveFiles.js.
 */
function updatePathNavigation() {
  const nav = document.getElementById("path-navigation");
  let ol = nav.querySelector("ol");
  if (!ol) {
    ol = document.createElement("ol");
    nav.appendChild(ol);
  }
  ol.innerHTML = ""; // Clear old breadcrumbs

  // Split currentPath into segments
  const path = currentPath;
  const segments = path === "/" ? [] : path.slice(1).split("/");

  // Always add root first
  let accumulated = "";
  const rootLi = document.createElement("li");
  const rootA  = document.createElement("a");
  rootA.textContent = "Root";
  rootA.href = "#";
  rootA.setAttribute("data-path", "/");
  rootA.addEventListener("click", () => navigateToPath("/"));
  rootLi.appendChild(rootA);
  ol.appendChild(rootLi);

  // If at root, we're done
  if (segments.length === 0) return;

  // Add each path segment as a breadcrumb
  accumulated = "";
  segments.forEach((seg, idx) => {
    accumulated += "/" + seg;
    const dirObj = findDirectoryByPath(accumulated);
    const displayName = dirObj ? dirObj.name : seg;
    const li = document.createElement("li");
    if (idx === segments.length - 1) {
      // Last crumb: not a link
      const span = document.createElement("span");
      span.textContent = displayName;
      span.setAttribute("data-path", accumulated); // So moveFiles.js can read it!
      li.appendChild(span);
    } else {
      const a = document.createElement("a");
      a.textContent = displayName;
      a.href = "#";
      a.setAttribute("data-path", accumulated);
      a.addEventListener("click", () => navigateToPath(accumulated));
      li.appendChild(a);
    }
    ol.appendChild(li);
  });
}



/**
 * Update the content grid based on the current breadcrumb path.
 */
function updateContentGrid() {
  const contentGrid = document.getElementById('content-grid');
  const emptyState  = document.getElementById('empty-state');
  contentGrid.innerHTML = '';

  // 1) Figure out where we are
  const path       = getCurrentPath();
  const currentDir = findDirectoryByPath(path);

  // Debug: only now that currentDir exists
  console.log('Rendering grid for path:', path, '→', currentDir);

  let hasItems = false;

  // 2) If there are children, show them (directories and any files added as children)
  if (currentDir && currentDir.children?.length) {
    emptyState.style.display  = 'none';
    contentGrid.style.display = 'grid';

    currentDir.children.forEach(childId => {
      const child = archiveData[childId];
      if (!child) return;

      // Choose an icon HTML snippet
      let iconHTML;
      if (child.type === 'directory') {
        iconHTML = `<div class="item-icon"><span class="folder-icon">📁</span></div>`;
      } else {
        switch ((child.fileType || '').toLowerCase()) {
          case 'document': iconHTML = `<div class="item-icon">📄</div>`; break;
          case 'pdf':      iconHTML = `<div class="item-icon">📄</div>`; break;
          case 'video':    iconHTML = `<div class="item-icon">🎬</div>`; break;
          case 'image':    iconHTML = `<div class="item-icon">🖼️</div>`; break;
          case 'audio':    iconHTML = `<div class="item-icon">🔊</div>`; break;
          default:         iconHTML = `<div class="item-icon">📝</div>`;
        }
      }

      // Build the card
      const itemCard = document.createElement('div');
      itemCard.className = 'item-card' + (child.type === 'directory' ? ' folder' : '');

      // folders get normalized data-path, files get data-id
      if (child.type === 'directory') {
        itemCard.dataset.path = normalizePath(child.path);
      } else {
        itemCard.dataset.id = childId;
      }

      itemCard.innerHTML = `
        ${iconHTML}
        <div class="item-details">
          <div class="item-name">${child.name}</div>
          <div class="item-meta">
            ${child.type === 'directory'
              ? 'Directory'
              : `${child.fileType?.toUpperCase() || 'FILE'} · ${child.size || ''}`
            }
          </div>
        </div>
      `;

      // Click behavior for each item
      itemCard.addEventListener('click', () => {
        if (child.type === 'directory') {
          navigateToPath(normalizePath(child.path));
        } else {
          window.location.href = `../delete/preview.html?id=${childId}`;
          localStorage.setItem('selectedID', childId);
        }
      });

      contentGrid.appendChild(itemCard);
      hasItems = true;
    });
  }

  // 3) ALWAYS show all files whose directory matches the current path (even if not in children)
  if (typeof allFiles !== "undefined" && Array.isArray(allFiles)) {
    allFiles.forEach(file => {
      if (normalizePath(file.directory) === normalizePath(path)) {
        // If not already rendered (not in children)
        if (!currentDir || !currentDir.children || !currentDir.children.includes(file.id)) {
          // Build the card for this file
          let iconHTML;
          switch ((file.fileType || '').toLowerCase()) {
            case 'document': iconHTML = `<div class="item-icon">📄</div>`; break;
            case 'pdf':      iconHTML = `<div class="item-icon">📄</div>`; break;
            case 'video':    iconHTML = `<div class="item-icon">🎬</div>`; break;
            case 'image':    iconHTML = `<div class="item-icon">🖼️</div>`; break;
            case 'audio':    iconHTML = `<div class="item-icon">🔊</div>`; break;
            default:         iconHTML = `<div class="item-icon">📝</div>`;
          }
          const itemCard = document.createElement('div');
          itemCard.className = 'item-card';
          itemCard.dataset.id = file.id;
          itemCard.innerHTML = `
            ${iconHTML}
            <div class="item-details">
              <div class="item-name">${file.title || file.name}</div>
              <div class="item-meta">
                ${file.fileType?.toUpperCase() || 'FILE'} · ${file.size || ''}
              </div>
            </div>
          `;
          itemCard.addEventListener('click', () => {
            window.location.href = `../delete/preview.html?id=${file.id}`;
            localStorage.setItem('selectedID', file.id);
          });
          contentGrid.appendChild(itemCard);
          hasItems = true;
        }
      }
    });
  }

  // 4) Show empty state if no items
  if (!hasItems) {
    contentGrid.style.display = 'none';
    emptyState.style.display  = 'block';
  }
}





// ─── Helper: look up a directory object by its normalized path ───────────────
function findDirectoryByPath(path) {
  const target = normalizePath(path);
  return (
    Object.values(archiveData).find(
      dir => dir.type === 'directory' && dir.path === target
    ) || null
  );
}



// ─── Initialize the application by loading data via your API ─────────────
document.addEventListener('DOMContentLoaded', () => {
  // Kick off the data load and UI render
  loadDataFromFirestore().catch(err => {
    console.error('Initialization error:', err);
    showStatus('❌ Failed to initialize application', 'error');
  });

  // Setup logout functionality
  document.querySelector('.logout-btn')?.addEventListener('click', () => {
    window.location.href = './home_page/admin_home.html';
  });
});


  
 // ─── Only export for Node (tests, server‐side), never in the browser ──────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_BASE,
    archiveData,
    currentPath,
    showStatus,
    loadDataFromFirestore,
    initializeUI,
    createDirectoryStructure,
    saveDirectory,
    buildDirectoryTree,
    buildDirectoryItem,
    updatePathNavigation,
    getCurrentPath,
    updateContentGrid,
    expandDirectoryPath,
    navigateToPath,
    findDirectoryByPath,
    addDirectoryToHierarchy,
    addDocumentToHierarchy
  };
}






