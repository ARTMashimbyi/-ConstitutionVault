document.addEventListener('DOMContentLoaded', () => {
  // --- docSynonyms for local file search ---
  const docSynonyms = {
    "us": "united states",
  };

  // --- Elements for local documents ---
  const documentList = document.getElementById('documentList');
  const searchInput = document.getElementById('searchInput');
  const notification = document.getElementById('notification');
  const sortSelect = document.getElementById('sortSelect');
  const regionFilter = document.getElementById('continentFilter');

  // --- Elements for fallback country data ---
  const countryInfoSection = document.getElementById('country-info');
  const borderingSection = document.getElementById('bordering-countries');

  // --- Modal elements ---
  const deleteModal = document.querySelector('.deleteModal');
  const yesBtn = document.querySelector('.yesBtn');
  const noBtn = document.querySelector('.noBtn');
  
  let allDocuments = [];
  let currentDocToDelete = null;

  // Utility: Show a notification
  function showNotification(message, duration = 5000) {
    notification.innerText = message;
    notification.style.display = "block";
    setTimeout(() => { notification.style.display = "none"; }, duration);
  }

  // Fetch local documents
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

  // ... (keep all your existing filter, sort, and render utility functions)

  // Modified renderDocuments function to include delete buttons
  function renderDocuments(docs) {
    documentList.innerHTML = "";
    docs.forEach(doc => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      li.style.border = '1px solid #ccc';
      li.style.padding = '0.5rem';
      li.style.borderRadius = '4px';

      // Your existing document rendering code
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

      // Add delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('deleteBtn'); // Add class for styling
      deleteBtn.addEventListener('click', () => {
        currentDocToDelete = doc;
        deleteModal.style.display = 'flex';
      });
      li.appendChild(deleteBtn);
      documentList.appendChild(li);
    });
  }

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
  searchInput.addEventListener('input', updateDisplayedDocuments);
  if (sortSelect) sortSelect.addEventListener('change', updateDisplayedDocuments);
  if (regionFilter) regionFilter.addEventListener('change', updateDisplayedDocuments);

  initDocuments();
});