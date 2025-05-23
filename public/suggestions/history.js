

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, increment, doc, onSnapshot, arrayUnion, arrayRemove,getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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
let userInteractions = {};

const currentUserId = localStorage.getItem("currentUserId") || null;//retrieve uid from local storage(sign in)
console.log("Current User ID:", currentUserId);
loadAllDocuments(currentUserId);


if(!currentUserId){
    alert("Please login to view documents.");
    window.location.href = "../user%20signup/index.html";
}

async function initApp() {
    try {
      showLoading(true);
     await  loadAllDocuments();
      await loadUserInteractions(currentUserId);
      setupEventListeners();
      renderAllSections(); //since in loadAllDocuments
    } catch (error) {
      console.error("Initialization error:", error);
      showError("Failed to load documents");
    } finally {
      showLoading(false);
    }
}
async function loadAllDocuments(){
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
function isDocumentNew(uploadDate) {
    if (!uploadDate) return false;
    const uploadTime = new Date(uploadDate).getTime();
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return uploadTime > weekAgo;
}

const arr1 =[]; //update history to show latest first
async function loadAllHistory(user) {            
    const userRef = doc(db, "user_history", user);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const history = userSnap.data().viewed;
        history.forEach(doc=>{
        arr1.unshift(doc);
        
      });   
    }
      else{
        console.log("no user snap");
      }

try{
        arr1.forEach(doc=>{
          getTitle(doc);
          console.log(doc);
        });
      }
      catch{
        console.log("no history");
      }    
console.log(arr1[0]);
}
loadAllHistory(currentUserId);
async function loadUserInteractions(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        userInteractions = userSnap.data().userInteractions || {
            clicks: {},
            viewed: [],
            isFavorite: [],
            shared: []
        };
        console.log("User interactions loaded:", userInteractions);
        updateStats(userInteractions);
    } else {
        console.error("User document does not exist.");
    }
}

let history_array =[];
async function getTitle(data){ 
  if(data.length){
        //const container = document.getElementById('all-documents-grid');
       const docID = data;
       loadedDocuments.forEach(doc=>{
        if(doc.id==data){
          history_array.push(doc);
        }
       })
        //const docRef = loadedDocuments.find(data);
        //console.log(loadedDocuments[0]);
       // const docSnap1 = await getDoc(docRef);
    //     if (docSnap1.exists()) {
    //       const docData = docSnap1.data();
    //       //console.log(docData);
    //     history_array.push(docData);
        
    // }
    //  else {
    //   console.log("no recent documents_GetTitle");
    // }
  }
}

// Render all documents in the main grid
function renderAllDocuments() {
  const container = document.getElementById('all-documents-grid');
  if (!container) return;

  container.innerHTML = '';

  if (loadedDocuments.length === 0) {
    container.innerHTML = `
      <article class="empty-state" style="grid-column: 1/-1">
        <i class="fas fa-folder-open"></i>
        <p>No documents found</p>
      </article>
    `;
    console.log("no documents loaded");
    return;
  }

  history_array.forEach(doc => {
    container.appendChild(createDocCard(doc));
  });
}
// renderAllDocuments();
// console.log("rendered docs");

// Create semantic document card element
function createDocCard(doc) {
  
  const card = document.createElement('article');
  card.className = 'doc-card';
  
  if (doc.isNew) {
    const badge = document.createElement('mark');
    badge.className = 'doc-badge';
    badge.textContent = 'NEW';
    card.appendChild(badge);
  }
  
  card.innerHTML = `
    <h3>${doc.title || 'Untitled Document'}</h3>
    <menu class="doc-meta">
      <li><i class="fas fa-file"></i> ${doc.fileType || 'Unknown'}</li>
      <li><i class="fas fa-eye"></i> ${doc.clicks || 0}</li>
      <li><i class="fas fa-tag"></i> ${doc.category || 'Uncategorized'}</li>
    </menu>
    ${doc.institution ? `<p>${doc.institution}</p>` : ''}
    <menu class="doc-actions">
      <li><button class="action-btn view-btn"><i class="fas fa-eye"></i> View</button></li>
      <li>
        <button class="action-btn fav-btn ${doc.isFavorite ? 'active' : ''}" 
                aria-label="${doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="fas fa-star"></i>
        </button>
      </li>
    </menu>
  `;
  
  // Add event listeners
  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(doc.id, !doc.isFavorite);
  });
  console.log(doc.id);
  const viewBtn = card.querySelector('.view-btn');
  viewBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await incrementViewCount(doc.id);
    console.log(doc.id);
    openDocument(doc);
    console.log(doc);
    console.log(typeof(doc));
  });
  
  //card.addEventListener('click', () => openDocument(doc));
  console.log("card loaded");
  return card;
  }
  

async function incrementViewCount(docId) {
      console.log("ViewCount called");
        try {
          console.log("in id:", currentUserId);
          
         const docRef = doc(db, "constitutionalDocuments", docId);
          const userRef = doc(db, "user_history", currentUserId);
          console.log(userRef);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            console.error("Document does not exist.");
            let user = currentUserId;
            //await setDoc(doc(db, "user_history", user));
            await setDoc(doc(db, "user_history", user), {
              [`viewed`]: arrayUnion(docId)}, { merge: true }
                );
            return;
          }
          
          await Promise.all([
            updateDoc(userRef, {
            [`viewed`]: arrayRemove(docId)},
            { merge: true }),
             
          updateDoc(userRef, {
              
              [`viewed`]: arrayUnion(docId)
            }, { merge: true })
          ]);
          
         // await loadUserInteractions(currentUserId); // Reload user interactions
          //updateStats(); // Update stats after incrementing view count
        } catch (error) {
          console.error("Error incrementing view count:", error);
        }
        
    }

function openDocument(doc) {
    console.log(`Opening document: ${doc.title}`);
    window.open(doc.downloadURL || '#', '_blank');//update time here?
    // Implement actual document opening logic here
    console.log(doc.id);
    console.log(currentUserId);
}

// Render documents to a specific section
function renderDocuments(sectionSelector, docs) {
  const container = document.querySelector(sectionSelector);
  if (!container) return;

  container.innerHTML = '';

  if (!docs || docs.length === 0) {
    container.innerHTML = `
      <article class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No documents found</p>
      </article>
    `;
    return;
  }

  docs.forEach(doc => {
    container.appendChild(createDocCard(doc));
  });
}


// Toggle favorite status in Firestore
async function toggleFavorite(docId, shouldFavorite) {
  try {
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()) {
        console.error("User document does not exist.");
        return;
    }

    await updateDoc(userRef, {
      [`userInteractions.isFavorite`]: shouldFavorite ? arrayUnion(docId) : arrayRemove(docId)
    });  

    await loadUserInteractions(currentUserId);
    renderAllSections(); // Re-render sections after toggling favorite
    updateStats(); // Update stats after toggling favorite
  } catch (error) {
    console.error("Error updating favorite:", error);
  }
}

// Render all document sections
async function renderAllSections() {
    await loadUserInteractions(currentUserId); // Reload user interactions
    // Render suggestions ad favorites(first 3 documents)
    loadedDocuments.forEach(doc => {
      doc.isFavorite = userInteractions.isFavorite?.includes(doc.id);
    });

    const mostClicked = Object.entries(userInteractions.clicks || {})
        .sort(([, aClicks], [, bClicks]) => bClicks - aClicks)
        .slice(0, 3)
        .map(([docId]) => docId);
    console.log("mostClicked:", mostClicked);
    const suggested = loadedDocuments.filter(doc => mostClicked.includes(doc.id));
    
    
    renderDocuments('.suggestions', suggested);


    // Render favorites
    const favorites = loadedDocuments.filter(doc => doc.isFavorite);
    renderDocuments('.favorites', favorites);
  
    // Render all documents
    renderAllDocuments();

    //update stats
    updateStats();
}

// Apply filters to documents
function applyFilters() {
  const categoryFilter = document.querySelector('.filter-controls select:nth-of-type(1)')?.value;
  const typeFilter = document.querySelector('.filter-controls select:nth-of-type(2)')?.value;
  const searchTerm = document.querySelector('.view-all-container .search-input')?.value.toLowerCase();

  let filtered = [...loadedDocuments];

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
      <article class="empty-state" style="grid-column: 1/-1">
        <i class="fas fa-search"></i>
        <p>No documents match your filters</p>
      </article>
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
          const filtered = loadedDocuments.filter(doc =>
            doc.title?.toLowerCase().includes(searchTerm) ||
            doc.description?.toLowerCase().includes(searchTerm) ||
            doc.category?.toLowerCase().includes(searchTerm)
          );
          renderDocuments('.suggestions', filtered.slice(0, 3));
        } else {
          renderDocuments('.suggestions', loadedDocuments.slice(0, 3));
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

  function updateStats(user){
    const totalDocs = loadedDocuments.length;
    const totalViews = userInteractions.viewed?.length || 0;
    const totalFav = userInteractions.isFavorite?.length || 0;
    const totalShares = userInteractions.shared?.length || 0;

    // console.log("viewed:", totalViews);
    // console.log("favorites:", totalFav);
    // console.log("userInteractions:", userInteractions);
    
    

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