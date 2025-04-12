document.addEventListener('DOMContentLoaded', () => {
  // --- Elements for local documents ---
  const documentList = document.getElementById('documentList');
  const searchInput = document.getElementById('searchInput');
  const notification = document.getElementById('notification');
  const sortSelect = document.getElementById('sortSelect');       // Optional sorting drop-down
  const regionFilter = document.getElementById('continentFilter');  // Using continent drop-down
  
  // --- Elements for fallback country data ---
  const countryInfoSection = document.getElementById('country-info');
  const borderingSection = document.getElementById('bordering-countries');

  let allDocuments = []; // All local documents fetched from the backend

  // --- Synonym Mapping for common abbreviations ---
  const synonymMapping = {
    "mit": "massachusetts institute of technology",
    "wits": "university of the witwatersrand",
    "harvard": "harvard university",
    "us": "united states",
    "usa": "united states"
    // Add more mappings as needed.
  };

  // Normalize the query using the mapping
  function normalizeQuery(query) {
    const lowerQuery = query.toLowerCase().trim();
    return synonymMapping[lowerQuery] || lowerQuery;
  }

  // Utility: Show a temporary notification message
  function showNotification(message, duration = 5000) {
    notification.innerText = message;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, duration);
  }

  // Fetch local constitutional documents (or files) from backend
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

  // Filter documents based on search query and continent filter.
  function filterDocuments(docs, query, region) {
    let filtered = docs;
    
    // Apply search query filter, if provided.
    if (query) {
      const normalized = normalizeQuery(query);
      filtered = filtered.filter(doc => {
        const title = doc.title ? doc.title.toLowerCase() : "";
        const continent = doc.continent ? doc.continent.toLowerCase() : "";
        const country = doc.country ? doc.country.toLowerCase() : "";
        const institution = doc.institution ? doc.institution.toLowerCase() : "";
        const category = doc.category ? doc.category.toLowerCase() : "";
        const keywords = doc.keywords ? doc.keywords.toLowerCase() : "";
        return (
          title.includes(normalized) ||
          continent.includes(normalized) ||
          country.includes(normalized) ||
          institution.includes(normalized) ||
          category.includes(normalized) ||
          keywords.includes(normalized)
        );
      });
    }
    
    // Apply continent filter if selected (not "all").
    if (region && region.toLowerCase() !== 'all') {
      filtered = filtered.filter(doc => {
        const docContinent = doc.continent ? doc.continent.toLowerCase() : "";
        return docContinent === region.toLowerCase();
      });
    }
    
    return filtered;
  }

  // Sort documents based on the sortSelect drop-down (if present)
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

  // Render file preview based on fileType. Make comparison case-insensitive.
  function renderFilePreview(doc) {
    // Use lowercase for file type and extension checks.
    const type = doc.fileType ? doc.fileType.toLowerCase() : 'document';
    const fileURL = `http://localhost:3000/uploads/${doc.document}`;
    
    switch (type) {
      case 'video':
        return `
          <video width="400" controls>
            <source src="${fileURL}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
      case 'image':
        return `<img src="${fileURL}" alt="${doc.title}" width="400">`;
      case 'audio':
        return `
          <audio controls>
            <source src="${fileURL}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        `;
      default:
        // Default for "document" or unrecognized types.
        return `<p><a href="${fileURL}" target="_blank">View File</a></p>`;
    }
  }

  // Render documents (or files) with metadata and file preview.
  function renderDocuments(docs) {
    documentList.innerHTML = "";
    docs.forEach(doc => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      li.style.border = '1px solid #ccc';
      li.style.padding = '0.5rem';
      li.style.borderRadius = '4px';

      // Build info block.
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
      
      // Append file preview.
      infoHTML += renderFilePreview(doc);

      li.innerHTML = infoHTML;

      // Add Delete Button.
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = "Delete";
      deleteBtn.style.marginTop = "1rem";
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
          try {
            const res = await fetch(`http://localhost:3000/constitutionalDocuments/${doc.id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              alert("File deleted successfully.");
              allDocuments = await fetchDocuments();
              updateDisplayedDocuments();
            } else {
              const errorData = await res.json();
              alert(errorData.error || "Failed to delete file.");
            }
          } catch (error) {
            console.error("Error deleting file:", error);
            alert("Error deleting file.");
          }
        }
      });
      li.appendChild(deleteBtn);

      documentList.appendChild(li);
    });
  }

  // Update displayed documents by filtering and sorting.
  async function updateDisplayedDocuments() {
    const query = searchInput.value.trim();
    const region = regionFilter ? regionFilter.value : "";
    let filteredDocs = filterDocuments(allDocuments, query, region);
    filteredDocs = sortDocuments(filteredDocs);

    // Clear fallback sections.
    if (countryInfoSection) countryInfoSection.innerHTML = "";
    if (borderingSection) borderingSection.innerHTML = "";

    if (filteredDocs.length === 0 && query !== "") {
      documentList.innerHTML = `<li>No local files found matching your search.</li>`;
      fetchCountryData(query);
    } else {
      renderDocuments(filteredDocs);
    }
  }

  // --- Fallback Country Search Functions ---
  async function fetchCountryData(query) {
    let countryName = query;
    if (synonymMapping[countryName.toLowerCase()]) {
      countryName = synonymMapping[countryName.toLowerCase()];
    }
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}?fullText=true`);
      if (!response.ok) {
        throw new Error("Country not found");
      }
      const data = await response.json();
      const country = data[0];
      displayCountryInfo(country);
      if (country.borders && country.borders.length > 0) {
        displayBorderCountries(country.borders);
      } else {
        borderingSection.innerHTML = "<p>No bordering countries found.</p>";
      }
    } catch (error) {
      countryInfoSection.innerHTML = `<p>No local files or country info found. ${error.message}</p>`;
    }
  }

  function displayCountryInfo(country) {
    const capital = country.capital ? country.capital[0] : "N/A";
    const population = country.population ? country.population.toLocaleString() : "N/A";
    const region = country.region;
    const flagUrl = country.flags && country.flags.png ? country.flags.png : "";
    
    countryInfoSection.innerHTML = `
      <h2>${country.name.common}</h2>
      <p><strong>Capital:</strong> ${capital}</p>
      <p><strong>Population:</strong> ${population}</p>
      <p><strong>Region:</strong> ${region}</p>
      ${flagUrl ? `<p><img src="${flagUrl}" alt="Flag of ${country.name.common}" class="flag"></p>` : ""}
    `;
  }

  async function displayBorderCountries(borders) {
    borderingSection.innerHTML = "<h3>Bordering Countries:</h3>";
    for (let code of borders) {
      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
        if (!response.ok) {
          throw new Error("Border country not found");
        }
        const data = await response.json();
        const borderCountry = data[0];
        const borderCountryName = borderCountry.name.common;
        const borderFlagUrl = borderCountry.flags && borderCountry.flags.png ? borderCountry.flags.png : "";
        const countryCard = document.createElement('article');
        countryCard.classList.add('country-card');
        countryCard.innerHTML = `
          <h4>${borderCountryName}</h4>
          ${borderFlagUrl ? `<img src="${borderFlagUrl}" alt="Flag of ${borderCountryName}" class="flag">` : ""}
        `;
        borderingSection.appendChild(countryCard);
      } catch (error) {
        console.error("Error fetching border country data:", error);
      }
    }
  }

  // --- Initialization ---
  async function initDocuments() {
    allDocuments = await fetchDocuments();
    updateDisplayedDocuments();
  }

  // Attach event listeners for search, sorting, and region filtering.
  searchInput.addEventListener('input', updateDisplayedDocuments);
  if (sortSelect) {
    sortSelect.addEventListener('change', updateDisplayedDocuments);
  }
  if (regionFilter) {
    regionFilter.addEventListener('change', updateDisplayedDocuments);
  }

  initDocuments();
});
