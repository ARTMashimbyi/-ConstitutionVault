document.addEventListener('DOMContentLoaded', () => {
  // --- (Optional) Document synonyms for local search (if you want to keep them here)
  const docSynonyms = {
    "us": "united states"
    // Add further synonyms if needed.
  };

  // --- Elements for local documents ---
  const documentList = document.getElementById('documentList');
  const searchInput = document.getElementById('searchInput');
  const notification = document.getElementById('notification');
  const sortSelect = document.getElementById('sortSelect');       // Sorting dropdown
  const regionFilter = document.getElementById('continentFilter');  // Continent filter dropdown
  const directoryTree = document.getElementById('directoryTree');  // Directory tree container
  const currentPath = document.getElementById('currentPath');      // Current path display

  // --- Elements for fallback country data ---
  const countryInfoSection = document.getElementById('country-info');
  const borderingSection = document.getElementById('bordering-countries');

  // --- Modal elements ---
  const newFolderModal = document.getElementById('newFolderModal');
  const createFolderBtn = document.getElementById('createFolderBtn');
  const createFolderSubmit = document.getElementById('createFolderSubmit');
  const cancelFolderCreate = document.getElementById('cancelFolderCreate');
  const folderNameInput = document.getElementById('folderName');
  const modalClose = document.querySelector('.close');

  let allDocuments = []; // Local documents fetched from backend
  let currentDirectory = '/'; // Current directory path
  let directoryStructure = {}; // Directory structure object

  // Instantiate external classes (from CountryData.js and CountryInfoService.js)
  const countryAliases = new CountryAliases();   // Provides alias mapping and canonical conversions.
  const countryFacts = new CountryFacts();
  const countryInfoService = new CountryInfoService();
  
  // Instantiate the directory manager from DirectoryManager.js
  const directoryManager = new DirectoryManager();

  // Instantiate the deletion module from AdminDirectoryDeletion.js.
  // Provide the base URL for deletion API calls.
  const adminDeletion = new AdminDirectoryDeletion("http://localhost:3000/constitutionalDocuments");

  // Utility: Show a temporary notification message
  function showNotification(message, duration = 5000) {
    notification.innerText = message;
    notification.style.display = "block";
    setTimeout(() => { notification.style.display = "none"; }, duration);
  }

  // Fetch local documents from the backend
  async function fetchDocuments() {
    try {
      const res = await fetch('http://localhost:3000/constitutionalDocuments');
      const docs = await res.json();
      return docs;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  }

  // Fetch directory structure from backend
  async function fetchDirectoryStructure() {
    try {
      const res = await fetch('http://localhost:3000/directoryStructure');
      const structure = await res.json();
      return structure;
    } catch (error) {
      console.error("Error fetching directory structure:", error);
      return { root: [] }; // Default structure with just a root
    }
  }

  // Save directory structure to backend
  async function saveDirectoryStructure(structure) {
    try {
      const res = await fetch('http://localhost:3000/directoryStructure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(structure),
      });
      return await res.json();
    } catch (error) {
      console.error("Error saving directory structure:", error);
      showNotification("Failed to save directory structure");
      return false;
    }
  }

  // Create a new directory
  async function createDirectory(path, name) {
    const newPath = path === '/' ? `/${name}` : `${path}/${name}`;
    const success = await directoryManager.createDirectory(newPath);
    
    if (success) {
      directoryStructure = await fetchDirectoryStructure();
      renderDirectoryTree();
      showNotification(`Folder "${name}" created successfully`);
      return true;
    }
    
    showNotification("Failed to create folder");
    return false;
  }

  // Move a document to a different directory
  async function moveDocument(documentId, newPath) {
    try {
      const res = await fetch(`http://localhost:3000/constitutionalDocuments/${documentId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: newPath }),
      });
      
      if (res.ok) {
        allDocuments = await fetchDocuments();
        updateDisplayedDocuments();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error moving document:", error);
      return false;
    }
  }

  /**
   * Filters documents using a raw, lowercased query.
   * Each token (optionally replaced via docSynonyms) must appear in the combined document fields.
   * Also filters by current directory path.
   */
  function filterDocuments(docs, query, region) {
    // First filter by current directory
    let filtered = docs.filter(doc => {
      const docPath = doc.directoryPath || '/';
      return currentDirectory === '/' || docPath === currentDirectory || docPath.startsWith(`${currentDirectory}/`);
    });
    
    if (query) {
      const normalizedQuery = query.toLowerCase().trim();
      let tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      // Replace tokens with synonyms if available.
      tokens = tokens.map(token => docSynonyms[token] || token);
      if (tokens.length === 0) {
        filtered = [];
      } else {
        filtered = filtered.filter(doc => {
          const combined = [
            doc.title,
            doc.continent,
            doc.country,
            doc.institution,
            doc.category,
            doc.keywords
          ].filter(Boolean).join(" ").toLowerCase();
          return tokens.every(token => combined.includes(token));
        });
      }
    }
    
    if (region && region.toLowerCase() !== 'all') {
      filtered = filtered.filter(doc => {
        const docContinent = (doc.continent || "").toLowerCase();
        return docContinent === region.toLowerCase();
      });
    }
    
    return filtered;
  }

  /**
   * Sorts documents based on date (newest first) or title (alphabetical).
   */
  function sortDocuments(docs) {
    if (!sortSelect) return docs;
    const sortBy = sortSelect.value;
    if (sortBy === "date") {
      return docs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "title") {
      return docs.sort((a, b) => a.title.localeCompare(b.title));
    }
    return docs;
  }

  /**
   * Renders a file preview based on the fileType.
   */
  function renderFilePreview(doc) {
    const type = doc.fileType ? doc.fileType.toLowerCase() : 'document';
    const fileURL = `http://localhost:3000/uploads/${doc.document}`;
    if (type === 'video') {
      return `
        <video width="400" controls>
          <source src="${fileURL}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else if (type === 'image') {
      return `<img src="${fileURL}" alt="${doc.title}" width="400">`;
    } else if (type === 'audio') {
      return `
        <audio controls>
          <source src="${fileURL}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
    } else {
      return `<p><a href="${fileURL}" target="_blank">View File</a></p>`;
    }
  }

  /**
   * Renders the list of local documents.
   */
  function renderDocuments(docs) {
    documentList.innerHTML = "";
    
    // Update the current path display
    currentPath.textContent = `Location: ${currentDirectory}`;
    
    docs.forEach(doc => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      li.style.border = '1px solid #ccc';
      li.style.padding = '0.5rem';
      li.style.borderRadius = '4px';

      let infoHTML = `
        <p><strong>Title:</strong> ${doc.title}</p>
        <p><strong>Date:</strong> ${doc.date}</p>
        <p><strong>Continent:</strong> ${doc.continent}</p>
        <p><strong>Country:</strong> ${doc.country}</p>
        <p><strong>Directory:</strong> ${doc.directoryPath || '/'}</p>
      `;
      
      if (doc.institution) {
        infoHTML += `<p><strong>Institution:</strong> ${doc.institution}</p>`;
      }
      if (doc.author) {
        infoHTML += `<p><strong>Author:</strong> ${doc.author}</p>`;
      }
      if (doc.category) {
        infoHTML += `<p><strong>Category:</strong> ${doc.category}</p>`;
      }
      if (doc.keywords) {
        infoHTML += `<p><strong>Keywords:</strong> ${doc.keywords}</p>`;
      }
      infoHTML += renderFilePreview(doc);
      li.innerHTML = infoHTML;

      // Create action buttons container
      const actionDiv = document.createElement('div');
      actionDiv.style.marginTop = "1rem";
      actionDiv.style.display = "flex";
      actionDiv.style.gap = "10px";
      
      // Create Move button
      const moveBtn = document.createElement('button');
      moveBtn.innerText = "Move";
      moveBtn.addEventListener('click', () => {
        // Show directory selector modal or context menu for moving
        showMoveDocumentDialog(doc);
      });
      
      // Create Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = "Delete";
      
      // Attach the delete handler using our deletion module
      adminDeletion.attachDeleteHandler(deleteBtn, doc.title, doc.id, async () => {
        allDocuments = await fetchDocuments();
        updateDisplayedDocuments();
      });
      
      actionDiv.appendChild(moveBtn);
      actionDiv.appendChild(deleteBtn);
      li.appendChild(actionDiv);
      documentList.appendChild(li);
    });
  }

  /**
   * Shows a dialog to move a document to a different directory
   */
  function showMoveDocumentDialog(doc) {
    // This is a simple implementation - you might want to create a more sophisticated dialog
    const newPath = prompt("Enter the destination directory path:", doc.directoryPath || '/');
    
    if (newPath !== null) {
      moveDocument(doc.id, newPath).then(success => {
        if (success) {
          showNotification(`Moved "${doc.title}" to ${newPath}`);
        } else {
          showNotification("Failed to move document");
        }
      });
    }
  }

  /**
   * Renders the directory tree structure
   */
  function renderDirectoryTree() {
    directoryTree.innerHTML = "";
    
    // Create the root directory node
    const rootNode = document.createElement('div');
    rootNode.className = currentDirectory === '/' ? 'folder open' : 'folder';
    rootNode.textContent = 'Root Directory';
    rootNode.addEventListener('click', () => {
      currentDirectory = '/';
      updateDisplayedDocuments();
      renderDirectoryTree();
    });
    
    directoryTree.appendChild(rootNode);
    
    // Create the directory tree from the structure
    const rootUl = document.createElement('ul');
    renderDirectoryNode(rootUl, directoryStructure.root || [], '/');
    directoryTree.appendChild(rootUl);
  }

  /**
   * Recursively renders a directory node and its children
   */
  function renderDirectoryNode(parentElement, directories, parentPath) {
    directories.forEach(dir => {
      const li = document.createElement('li');
      const fullPath = parentPath === '/' ? `/${dir.name}` : `${parentPath}/${dir.name}`;
      
      const folderDiv = document.createElement('div');
      folderDiv.className = currentDirectory === fullPath ? 'folder open' : 'folder';
      folderDiv.textContent = dir.name;
      folderDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        currentDirectory = fullPath;
        updateDisplayedDocuments();
        renderDirectoryTree();
      });
      
      li.appendChild(folderDiv);
      
      // If this directory has children, render them recursively
      if (dir.children && dir.children.length > 0) {
        const ul = document.createElement('ul');
        renderDirectoryNode(ul, dir.children, fullPath);
        li.appendChild(ul);
      }
      
      parentElement.appendChild(li);
    });
  }

  /**
   * Main update function: Filters, sorts, and renders local documents,
   * then updates the fallback Additional Information section.
   */
  async function updateDisplayedDocuments() {
    const rawQuery = searchInput.value.trim();
    const region = regionFilter ? regionFilter.value : "";

    let filteredDocs = filterDocuments(allDocuments, rawQuery, region);
    filteredDocs = sortDocuments(filteredDocs);
    renderDocuments(filteredDocs);

    // If no local documents are found, display a message.
    if (filteredDocs.length === 0) {
      if (rawQuery !== "") {
        documentList.innerHTML = `<li>No matching files found for "${rawQuery}".</li>`;
      } else {
        documentList.innerHTML = `<li>No files found in this directory.</li>`;
      }
    }

    // For Additional Information, use CountryAliases to convert raw query to a canonical name.
    if (rawQuery !== "") {
      const canonicalQuery = countryAliases.getCanonicalName(rawQuery);
      fetchCountryData(canonicalQuery);
    } else {
      countryInfoSection.innerHTML = "";
      borderingSection.innerHTML = "";
    }
  }

  /**
   * Fetches country data using CountryInfoService and displays it.
   */
  async function fetchCountryData(query) {
    try {
      const country = await countryInfoService.getCountryInfo(query);
      displayCountryInfo(country);
      if (country && country.borders && country.borders.length > 0) {
        displayBorderCountries(country.borders);
      } else {
        borderingSection.innerHTML = "<p>No bordering countries found.</p>";
      }
    } catch (error) {
      countryInfoSection.innerHTML = `<p>No country information found for "${query}". ${error.message}</p>`;
      borderingSection.innerHTML = "";
    }
  }

  /**
   * Displays country information and custom facts.
   */
  function displayCountryInfo(country) {
    if (!country) return;
    const capital = country.capital ? country.capital[0] : "N/A";
    const population = country.population ? country.population.toLocaleString() : "N/A";
    const region = country.region || "N/A";
    const flagUrl = (country.flags && country.flags.png) || "";

    countryInfoSection.innerHTML = `
      <h2>${country.name.common}</h2>
      <p><strong>Capital:</strong> ${capital}</p>
      <p><strong>Population:</strong> ${population}</p>
      <p><strong>Region:</strong> ${region}</p>
      ${flagUrl ? `<p><img src="${flagUrl}" alt="Flag of ${country.name.common}" class="flag"></p>` : ""}
    `;

    const facts = countryFacts.getFacts(country.name.common);
    if (facts) {
      countryInfoSection.innerHTML += `
        <p><em>Independence Year:</em> ${facts.independenceYear}</p>
        <p><em>Motto:</em> ${facts.motto}</p>
        <p><em>Famous For:</em> ${facts.famousFor}</p>
        <p><em>Languages:</em> ${facts.languages.join(', ')}</p>
        <p><em>Additional Info:</em> ${facts.additionalInfo}</p>
      `;
    }
  }

  /**
   * Displays bordering countries using CountryInfoService.
   */
  async function displayBorderCountries(borders) {
    borderingSection.innerHTML = "<h3>Bordering Countries:</h3>";
    try {
      const borderCountries = await countryInfoService.getBorderCountries(borders);
      if (borderCountries.length === 0) {
        borderingSection.innerHTML = "<p>No bordering countries found.</p>";
        return;
      }
      borderCountries.forEach(borderCountry => {
        const borderCountryName = borderCountry.name.common;
        const borderFlagUrl = (borderCountry.flags && borderCountry.flags.png) || "";
        const countryCard = document.createElement('article');
        countryCard.classList.add('country-card');
        countryCard.innerHTML = `
          <h4>${borderCountryName}</h4>
          ${borderFlagUrl ? `<img src="${borderFlagUrl}" alt="Flag of ${borderCountryName}" class="flag">` : ""}
        `;
        borderingSection.appendChild(countryCard);
      });
    } catch (error) {
      console.error("Error fetching border countries:", error);
      borderingSection.innerHTML = `<p>${error.message}</p>`;
    }
  }

  // Modal event handlers
  function openNewFolderModal() {
    newFolderModal.style.display = "block";
    folderNameInput.value = "";
    folderNameInput.focus();
  }

  function closeNewFolderModal() {
    newFolderModal.style.display = "none";
  }

  async function handleCreateFolder() {
    const folderName = folderNameInput.value.trim();
    if (!folderName) {
      alert("Please enter a folder name");
      return;
    }
    
    const success = await createDirectory(currentDirectory, folderName);
    if (success) {
      closeNewFolderModal();
    }
  }

  // Attach modal event listeners
  createFolderBtn.addEventListener('click', openNewFolderModal);
  modalClose.addEventListener('click', closeNewFolderModal);
  cancelFolderCreate.addEventListener('click', closeNewFolderModal);
  createFolderSubmit.addEventListener('click', handleCreateFolder);
  
  // Close modal if clicked outside
  window.addEventListener('click', (event) => {
    if (event.target === newFolderModal) {
      closeNewFolderModal();
    }
  });

  // Initialization: Fetch local documents and directory structure, then update the UI.
  async function initDocuments() {
    // Fetch documents and directory structure in parallel
    const [docs, structure] = await Promise.all([
      fetchDocuments(),
      fetchDirectoryStructure()
    ]);
    
    allDocuments = docs;
    directoryStructure = structure;
    
    renderDirectoryTree();
    updateDisplayedDocuments();
    
    // Store the directory structure in local storage for other pages to access
    localStorage.setItem('directoryStructure', JSON.stringify(directoryStructure));
    
    // Share the structure with the DirectoryManager
    directoryManager.setDirectoryStructure(directoryStructure);
  }

  // Attach event listeners.
  searchInput.addEventListener('input', updateDisplayedDocuments);
  if (sortSelect) sortSelect.addEventListener('change', updateDisplayedDocuments);
  if (regionFilter) regionFilter.addEventListener('change', updateDisplayedDocuments);

  // Start initialization.
  initDocuments();
});