import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  arrayUnion, arrayRemove, increment
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
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
let currentDoc = null;
const currentUserId = localStorage.getItem("currentUserId") || null;
const currentDocId = localStorage.getItem("currentDoc") || null;
const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");
console.log("settings", settings);


if (!currentUserId) {
  Notification.show("Please login to view documents.");
  window.location.href = "../user%20signup/index.html";
}

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
  logOut();
});

async function initApp() {
  try {
    setupSearchBtn();
    await loadAllDocuments();
    await loadUserInteractions(currentUserId);
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to load documents");
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
    applyFilters();
    renderAllSections();
  });
}

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
    updateStats();
  } else {
    console.error("User document does not exist.");
  }
}

function isDocumentNew(uploadDate) {
  if (!uploadDate) return false;
  const uploadTime = new Date(uploadDate).getTime();
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return uploadTime > weekAgo;
}

function createDocCard(doc) {
  const card = document.createElement('article');
  card.className = 'document-card';

  if (doc.isNew) {
    const badge = document.createElement('mark');
    badge.className = 'doc-badge';
    badge.textContent = 'NEW';
    card.appendChild(badge);
  }

  const fig = document.createElement('figure');
  let previewEl;

  switch (doc.fileType) {
    case "image":
      previewEl = document.createElement("img");
      previewEl.src = doc.downloadURL;
      previewEl.alt = doc.title || 'Image preview';
      break;
    case "audio":
      previewEl = document.createElement("audio");
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    case "video":
      previewEl = document.createElement("video");
      previewEl.controls = true;
      previewEl.src = doc.downloadURL;
      break;
    case "document":
    default:
      if (doc.downloadURL && doc.downloadURL.endsWith(".pdf")) {
        previewEl = document.createElement("embed");
        previewEl.src = `${doc.downloadURL}#page=1&view=FitH`;
        previewEl.type = "application/pdf";
        previewEl.width = "100%";
        previewEl.height = "400px";
      } else {
        previewEl = document.createElement("p");
        previewEl.textContent = "Preview not available for this file type.";
      }
      break;
  }

  if (previewEl && (previewEl.tagName === 'IMG' || previewEl.tagName === 'IFRAME')) {
    previewEl.loading = "lazy";
  }
  if (previewEl) fig.appendChild(previewEl);
  card.appendChild(fig);

  card.innerHTML += `
    <h3>${doc.title || 'Untitled Document'}</h3>
    <menu class="doc-meta">
      <li><i class="fas fa-file"></i> ${doc.fileType || 'Unknown'}</li>
      <li><i class="fas fa-eye"></i> ${doc.clicks || 0}</li>
      <li><i class="fas fa-tag"></i> ${doc.category || 'Uncategorized'}</li>
    </menu>
    ${doc.institution ? `<p>${doc.institution}</p>` : ''}
    <menu class="doc-actions">
      <li><button class="action-btn view-btn"><i class="fas fa-eye"></i> View All</button></li>
      <li>
        <button class="action-btn fav-btn ${doc.isFavorite ? 'active' : ''}" 
                aria-label="${doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="fas fa-star"></i>
        </button>
      </li>
      <li>
        <button class="action-btn share-btn" aria-label="Share document"><i class="fas fa-share-alt"></i></button>
      </li>
    </menu>
  `;

  card.querySelector('.fav-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(doc.id, !doc.isFavorite);
  });

  card.querySelector('.view-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    await incrementViewCount(doc.id);
    await ViewCount(doc.id);
    openDocument(doc);
  });

  card.querySelector('.share-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const shareData = {
      title: doc.title || 'Untitled',
      text: doc.description || 'Check this out!',
      url: `${window.location.origin}/delete/viewer.html?id=${doc.id}` || '#'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        await incrementShareCount(doc.id);
        updateStats();
      } catch (error) {
        console.error('Error sharing document:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
      } catch (error) {
        console.error('Error sharing document:', error);
      }
    }
  });

  return card;
}

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
  docs.forEach(doc => container.appendChild(createDocCard(doc)));
}

function renderAllDocuments() {
  renderDocuments('#all-documents-grid', applyFilters());
}

async function renderAllSections() {
  await loadUserInteractions(currentUserId);
  loadedDocuments.forEach(doc => {
    doc.isFavorite = userInteractions.isFavorite?.includes(doc.id);
  });

  const preference = await preferences();
  const isEmpty = Object.values(preference).every(
    prefCategory => Object.keys(prefCategory).length === 0
  );
  const suggested = isEmpty
    ? popularSuggestions()
    : suggestionsByPreference(preference, loadedDocuments, currentDocId);

  renderDocuments('.suggestions', suggested);
  renderDocuments('.favorites', loadedDocuments.filter(doc => doc.isFavorite));
  renderAllDocuments();
  updateStats();
}

function applyFilters() {
  const userSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
  console.log("userSettings", userSettings);
  console.log("loadedDocuments", loadedDocuments);

  if (!Array.isArray(loadedDocuments)) {
    console.warn("loadedDocuments is not defined or not an array.");
    return [];
  }
   
  let filtered;
  if(userSettings){
    filtered = loadedDocuments.filter(doc => {
      const normalize = str => str?.toLowerCase().trim();
      const authorMatch = !Array.isArray(userSettings.author) || 
        userSettings.author
        .map(normalize)
        .includes(normalize(doc.author));

      const categoryMatch = !Array.isArray(userSettings.category) || 
        userSettings.category.map(normalize).includes(normalize(doc.category));

      const institutionMatch = !Array.isArray(userSettings.institution) || 
        userSettings.institution.map(normalize).includes(normalize(doc.institution));

      let keywordsMatch = true;

      if (Array.isArray(userSettings.keywords)) {
      const wanted = userSettings.keywords
          .map(k => k.trim().toLowerCase())
          .filter(k => k); // remove empty strings

          if (Array.isArray(doc.keywords)) {
            keywordsMatch = doc.keywords.some(kw =>
            wanted.includes(kw.toLowerCase())
          );
      } else {
          keywordsMatch = false;
        }   
      }


      const match = authorMatch && categoryMatch && institutionMatch;

      console.log(authorMatch, categoryMatch, institutionMatch, keywordsMatch);

      return match;
    });
  }
  console.log("filtered", filtered);
  
  return filtered;

}

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

function updateStats() {
  const totalDocs = loadedDocuments.length;
  const totalViews = userInteractions.viewed?.length || 0;
  const totalFav = userInteractions.isFavorite?.length || 0;
  const totalShares = userInteractions.shared?.length || 0;
  document.querySelectorAll('.stat-card').forEach(card => {
    const label = card.querySelector('.stat-label')?.textContent;
    const value = card.querySelector('.stat-value');
    if (!value) return;
    switch (label) {
      case 'Total Documents': value.textContent = totalDocs; break;
      case 'Viewed': value.textContent = totalViews; break;
      case 'Favorites': value.textContent = totalFav; break;
      case 'Shared': value.textContent = totalShares; break;
    }
  });
}

function setupSearchBtn() {
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      window.location.href = "../user-interface/user-filtered.html";
    });
  }
}

function logOut() {
  const logOutBtn = document.querySelector('a[href="#"] .fa-sign-out-alt')?.parentElement;
  if (logOutBtn) {
    logOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }
}

function openDocument(doc) {
  currentDoc = doc.id;
  localStorage.setItem("currentDoc", currentDoc);
  window.location.href = doc.downloadURL || "#";
}

function popularSuggestions() {
  return loadedDocuments
    .filter(doc => doc.id)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);
}

async function preferences() {
  const myhistory = userInteractions.viewed || [];
  const getHistory = myhistory.map(docId => getDoc(doc(db, "constitutionalDocuments", docId)));
  const docSnap = await Promise.all(getHistory);
  const preference = { category: {}, author: {}, institution: {}, fileType: {}, keywords: {} };
  docSnap.forEach(doc => {
    if (!doc.exists()) return;
    const data = doc.data();
    ['category', 'author', 'institution', 'fileType'].forEach(key => {
      if (data[key]) preference[key][data[key]] = (preference[key][data[key]] || 0) + 1;
    });
    (data.keywords || []).forEach(keyword => {
      preference.keywords[keyword] = (preference.keywords[keyword] || 0) + 1;
    });
  });
  return preference;
}

function suggestionsByPreference(preference, allDocs, currentDocId) {
  return allDocs
    .filter(doc => doc.id !== currentDocId)
    .map(doc => {
      let value = 0;
      value += (preference.category[doc.category] || 0) * 2;
      value += (preference.author[doc.author] || 0) * 2;
      value += (preference.institution[doc.institution] || 0) * 2;
      value += (preference.fileType[doc.fileType] || 0) * 2;
      (doc.keywords || []).forEach(keyword => {
        value += (preference.keywords[keyword] || 0) * 2;
      });
      return { doc, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(item => item.doc);
}

async function toggleFavorite(docId, shouldFavorite) {
  try {
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    await updateDoc(userRef, {
      [`userInteractions.isFavorite`]: shouldFavorite ? arrayUnion(docId) : arrayRemove(docId)
    });
    await loadUserInteractions(currentUserId);
    renderAllSections();
    updateStats();
  } catch (error) {
    console.error("Error updating favorite:", error);
  }
}

async function incrementShareCount(docId) {
  try {
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        userInteractions: { shared: [docId] }
      }, { merge: true });
    }
    await updateDoc(userRef, {
      [`userInteractions.shared`]: arrayUnion(docId)
    }, { merge: true });
    await loadUserInteractions(currentUserId);
    updateStats();
  } catch (error) {
    console.error("Error incrementing share count:", error);
  }
}

export async function updateSharedStat(docId) {
  const docRef = doc(db, "constitutionalDocuments", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const sharedCount = data.shares || 0;
    document.getElementById("shared-count").textContent = sharedCount;
  }
}

export async function incrementViewCount(docId) {
  try {
    const docRef = doc(db, "constitutionalDocuments", docId);
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    await Promise.all([
      updateDoc(docRef, {
        clicks: increment(1),
        lastViewed: new Date().toISOString()
      }),
      updateDoc(userRef, {
        [`userInteractions.clicks.${docId}`]: increment(1),
        [`userInteractions.viewed`]: arrayUnion(docId)
      }, { merge: true })
    ]);
    await loadUserInteractions(currentUserId);
    updateStats();
  } catch (error) {
    console.error("Error incrementing view count:", error);
  }
}

export async function ViewCount(docId) {
  try {
    const userRef = doc(db, "user_history", currentUserId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, { viewed: arrayUnion(docId) }, { merge: true });
      return;
    }
    await updateDoc(userRef, { viewed: arrayRemove(docId) });
    await updateDoc(userRef, { viewed: arrayUnion(docId) }, { merge: true });
  } catch (error) {
    console.error("Error incrementing view count:", error);
  }
}
