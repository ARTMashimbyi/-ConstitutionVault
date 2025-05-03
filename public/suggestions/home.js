
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, increment, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
    authDomain: "constitutionvault-1b5d1.firebaseapp.com",
    projectId: "constitutionvault-1b5d1",
    storageBucket: "constitutionvault-1b5d1.appspot.com",
    messagingSenderId: "616111688261",
    appId: "1:616111688261:web:97cc0a35c8035c0814312c",
    measurementId: "G-YJEYZ85T3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let loadedDocuments = [];
let currentUser = null;
const currentUserId = localStorage.getItem("currentUserId") || null;
if(!currentUserId){
    alert("Please login to view documents.");
    window.location.href = "../user%20signup/index.html";
}

async function initApp() {
    try {
      showLoading(true);
      await loadAllDocuments();
      setupEventListeners();
      //renderAllSections(); //since in loadAllDocuments
    } catch (error) {
      console.error("Initialization error:", error);
      showError("Failed to load documents");
    } finally {
      showLoading(false);
    }
}
async function loadAllDocuments() {
    const collectionRef = collection(db, "constitutionalDocuments");
    onSnapshot(collectionRef, (snapshot) => {
        loadedDocuments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isNew: isDocumentNew(doc.data().uploadDate)
        }));
        renderAllSections();
    });
}

function renderAllDocuments() {
    const container = document.getElementById('all-documents-grid');
    if (!container) return;
  
    container.innerHTML = '';
  
    if (loadedDocuments.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <i class="fas fa-folder-open"></i>
          <p>No documents found</p>
        </div>
      `;
      return;
    }
  
    loadedDocuments.forEach(doc => {
      container.appendChild(createDocCard(doc));
    });
  }

function isDocumentNew(uploadDate) {
    if (!uploadDate) return false;
    const uploadTime = new Date(uploadDate).getTime();
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return uploadTime > weekAgo;
}

// Create document card element
function createDocCard(doc) {
  const card = document.createElement('div');
  card.className = 'doc-card';
  
  if (doc.isNew) {
    card.innerHTML += `<div class="doc-badge">NEW</div>`;
  }

  card.innerHTML += `
    <h3>${doc.title || 'Untitled Document'}</h3>
    <div class="doc-meta">
      <span><i class="fas fa-file"></i> ${doc.fileType || 'Unknown'}</span>
      <span><i class="fas fa-eye"></i> ${doc.clicks || 0}</span>
      <span><i class="fas fa-tag"></i> ${doc.category || 'Uncategorized'}</span>
    </div>
    <p>${doc.institution || ''}</p>
    <div class="doc-actions">
      <button class="action-btn view-btn"><i class="fas fa-eye"></i> View</button>
      <button class="action-btn fav-btn ${doc.isFavorite ? 'active' : ''}">
        <i class="fas fa-star"></i>
      </button>
    </div>
  `;

  // Add event listeners
  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(doc.id, !doc.isFavorite);
  });

  const viewBtn = card.querySelector('.view-btn');
  viewBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await incrementViewCount(doc.id);
    openDocument(doc);
  });

  card.addEventListener('click', () => openDocument(doc));

  return card;
}

async function incrementViewCount(docId) {
    try {
      const docRef = doc(db, "constitutionalDocuments", docId);
      await updateDoc(docRef, {
        clicks: increment(1),
        lastViewed: new Date().toISOString()
      });
      
      updateStats(); // Update stats after incrementing view count
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
}

function openDocument(doc) {
    console.log(`Opening document: ${doc.title}`);
    window.open(doc.downloadURL || '#', '_blank');//update time here?
    // Implement actual document opening logic here
}

// Render documents to a specific section
function renderDocuments(sectionSelector, docs) {
    const container = document.querySelector(sectionSelector);
    if (!container) return;
  
    container.innerHTML = '';
  
    if (!docs || docs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No documents found</p>
        </div>
      `;
      return;
    }
  
    docs.forEach(doc => {
      container.appendChild(createDocCard(doc));
    });
}

// Toggle favorite status in Firestore
async function toggleFavorite(docId, isFavorite) {
  try {
    const docRef = doc(db, "constitutionalDocuments", docId);
    await updateDoc(docRef, { isFavorite });

    updateStats(); // Update stats after toggling favorite
  } catch (error) {
    console.error("Error updating favorite:", error);
  }
}

// Render all document sections
function renderAllSections() {
    // Render suggestions (first 3 documents)
    const mostClicked = [...loadedDocuments].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 3);
    renderDocuments('.suggestions', mostClicked);

    // Render favorites
    renderDocuments('.favorites', loadedDocuments.filter(doc => doc.isFavorite));
  
    // Render all documents
    renderAllDocuments();

    //update stats
    updateStats();
}

// Apply filters to documents
function applyFilters() {
    const categoryFilter = document.querySelector('.filter-dropdown:nth-of-type(1)')?.value;
    const typeFilter = document.querySelector('.filter-dropdown:nth-of-type(2)')?.value;
    const searchTerm = document.querySelector('.view-all-container .search-input')?.value.toLowerCase();
  
    let filtered = [...documents];
  
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'All Categories') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }
  
    // Apply type filter
    if (typeFilter && typeFilter !== 'All Types') {
      filtered = filtered.filter(doc => doc.fileType === typeFilter);
    }
  
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        (doc.title?.toLowerCase().includes(searchTerm) ||
        doc.description?.toLowerCase().includes(searchTerm) ||
        doc.category?.toLowerCase().includes(searchTerm))
      );
    }
  
    // Re-render with filtered documents
    const container = document.getElementById('all-documents-grid');
    if (!container) return;
  
    container.innerHTML = '';
  
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <i class="fas fa-search"></i>
          <p>No documents match your filters</p>
        </div>
      `;
      return;
    }
  
    filtered.forEach(doc => {
      container.appendChild(createDocCard(doc));
    });
  }
  
  // Set up all event listeners
  function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length > 2) {
          const filtered = documents.filter(doc =>
            doc.title?.toLowerCase().includes(searchTerm) ||
            doc.description?.toLowerCase().includes(searchTerm) ||
            doc.category?.toLowerCase().includes(searchTerm)
          );
          renderDocuments('.suggestions', filtered.slice(0, 3));
        } else {
          renderDocuments('.suggestions', documents.slice(0, 3));
        }
      });
    }
  
    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(action => {
      action.addEventListener('click', () => {
        const actionText = action.querySelector('h4')?.textContent;
        console.log(`${actionText} clicked`);
      });
    });
  
    // Filter event listeners
    document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', applyFilters);
    });
  
    const viewAllSearch = document.querySelector('.view-all-container .search-input');
    if (viewAllSearch) {
      viewAllSearch.addEventListener('input', applyFilters);
    }
  
    // Pagination buttons (simplified example)
    document.querySelectorAll('.page-btn').forEach(btn => {
      if (!btn.querySelector('i')) { // Skip arrow buttons
        btn.addEventListener('click', function() {
          document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          console.log(`Loading page ${this.textContent}`);
        });
      }
    });
  }
  
  // UI Helper functions
  function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = show ? 'block' : 'none';
  }
  
  function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  }

  function updateStats(){
    const totalDocs = loadedDocuments.length;
    const totalViews = loadedDocuments.filter(doc => doc.viewed || 0).length;
    const totalFav = loadedDocuments.filter(doc => doc.isFavorite).length;
    const totalShares = loadedDocuments.filter(doc => doc.shared || 0).length;

    const stat = document.querySelectorAll('.stat-card');

    stat.forEach((card) => {
        const label = card.querySelector('.stat-label')?.textContent;
        const value = card.querySelector('.stat-value');

        if(!value) return;
        switch (label) {
            case 'Total Documents':
                value.textContent = totalDocs;
                break;
            case 'Viewed':
                value.textContent = totalViews;
                break;
            case 'Favorites':
                value.textContent = totalFav;
                break;
            case 'Shared':
                value.textContent = totalShares;
                break;
            default:
                break;
        }
    });
  }
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', initApp);