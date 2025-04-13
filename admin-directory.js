document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
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
=======
  // --- docSynonyms for local file search ---
  const docSynonyms = {
    "us": "united states",
  };

  const documentList = document.getElementById('documentList');
  const searchInput = document.getElementById('searchInput');
  const notification = document.getElementById('notification');
  const sortSelect = document.getElementById('sortSelect');
  const regionFilter = document.getElementById('continentFilter');
>>>>>>> 9ac089b (update with modal)

  // --- Elements for fallback country data ---
  const countryInfoSection = document.getElementById('country-info');
  const borderingSection = document.getElementById('bordering-countries');

<<<<<<< HEAD
  let allDocuments = []; // Local documents fetched from backend

  // Instantiate external classes (from CountryData.js and CountryInfoService.js)
  const countryAliases = new CountryAliases();   // Provides alias mapping and canonical conversions.
  const countryFacts = new CountryFacts();
  const countryInfoService = new CountryInfoService();

  // Instantiate the deletion module from AdminDirectoryDeletion.js.
  // Provide the base URL for deletion API calls.
  const adminDeletion = new AdminDirectoryDeletion("http://localhost:3000/constitutionalDocuments");

  // Utility: Show a temporary notification message
=======
  // --- Modal elements ---
  const deleteModal = document.querySelector('.deleteModal');
  const yesBtn = document.querySelector('.yesBtn');
  const noBtn = document.querySelector('.noBtn');
  
  let allDocuments = [];
  let currentDocToDelete = null;

  // Utility: Show a notification
>>>>>>> 9ac089b (update with modal)
  function showNotification(message, duration = 5000) {
    notification.innerText = message;
    notification.style.display = "block";
    setTimeout(() => { notification.style.display = "none"; }, duration);
  }

<<<<<<< HEAD
  // Fetch local documents from the backend
=======
  // Fetch local documents
>>>>>>> 9ac089b (update with modal)
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

<<<<<<< HEAD
  /**
   * Filters documents using a raw, lowercased query.
   * Each token (optionally replaced via docSynonyms) must appear in the combined document fields.
   */
  function filterDocuments(docs, query, region) {
    let filtered = docs;
    if (query) {
      const normalizedQuery = query.toLowerCase().trim();
      let tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      // Replace tokens with synonyms if available.
      tokens = tokens.map(token => docSynonyms[token] || token);
      if (tokens.length === 0) {
        filtered = [];
      } else {
        filtered = docs.filter(doc => {
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
   * Instead of handling deletion inline, we use the AdminDirectoryDeletion module.
   */
=======
  // ... (keep all your existing filter, sort, and render utility functions)

  // Modified renderDocuments function to include delete buttons
>>>>>>> 9ac089b (update with modal)
  function renderDocuments(docs) {
    documentList.innerHTML = "";
    docs.forEach(doc => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      li.style.border = '1px solid #ccc';
      li.style.padding = '0.5rem';
      li.style.borderRadius = '4px';

<<<<<<< HEAD
=======
      // Your existing document rendering code
>>>>>>> 9ac089b (update with modal)
      let infoHTML = `
        <p><strong>Title:</strong> ${doc.title}</p>
        <p><strong>Date:</strong> ${doc.date}</p>
        <p><strong>Continent:</strong> ${doc.continent}</p>
        <p><strong>Country:</strong> ${doc.country}</p>
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

<<<<<<< HEAD
      // Create a Delete button and use the AdminDirectoryDeletion module to attach the handler.
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = "Delete";
      deleteBtn.style.marginTop = "1rem";
      
      // Attach the delete handler using our deletion module.
      adminDeletion.attachDeleteHandler(deleteBtn, doc.title, doc.id, async () => {
        allDocuments = await fetchDocuments();
        updateDisplayedDocuments();
      });
      
=======
      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('deleteBtn'); // Add class for styling
      deleteBtn.addEventListener('click', () => {
        currentDocToDelete = doc;
        deleteModal.style.display = 'flex';
      });
>>>>>>> 9ac089b (update with modal)
      li.appendChild(deleteBtn);
      documentList.appendChild(li);
    });
  }

<<<<<<< HEAD
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
    if (rawQuery !== "" && filteredDocs.length === 0) {
      documentList.innerHTML = `<li>No matching files found.</li>`;
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

  // Initialization: Fetch local documents and update the UI.
  async function initDocuments() {
    allDocuments = await fetchDocuments();
    updateDisplayedDocuments();
  }

  // Attach event listeners.
=======
  // Setup modal event handlers
  function setupDeleteModal() {
    yesBtn.addEventListener('click', async () => {
      if (currentDocToDelete) {
        try {
          const response = await fetch(`http://localhost:3000/constitutionalDocuments/${currentDocToDelete.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            showNotification('Document deleted successfully');
            allDocuments = await fetchDocuments();
            updateDisplayedDocuments();
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete document");
          }
        } catch (error) {
          showNotification('Error deleting document: ' + error.message);
        } finally {
          deleteModal.style.display = 'none';
          currentDocToDelete = null;
        }
      }
    });

    noBtn.addEventListener('click', () => {
      deleteModal.style.display = 'none';
      currentDocToDelete = null;
    });
  }

  // Initialization
  async function initDocuments() {
    allDocuments = await fetchDocuments();
    updateDisplayedDocuments();
    setupDeleteModal();
  }

  // Event listeners
>>>>>>> 9ac089b (update with modal)
  searchInput.addEventListener('input', updateDisplayedDocuments);
  if (sortSelect) sortSelect.addEventListener('change', updateDisplayedDocuments);
  if (regionFilter) regionFilter.addEventListener('change', updateDisplayedDocuments);

<<<<<<< HEAD
  // Start initialization.
  initDocuments();
});
=======
  initDocuments();
});
>>>>>>> 9ac089b (update with modal)
