import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let fileToMove = null;
let moveMode = false;
let statusMsg = null;

window.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM Loaded for File Mover");
  
  statusMsg = document.createElement('div');
  statusMsg.id = 'moveStatus';
  statusMsg.className = 'move-status';
  document.querySelector('.main-content').appendChild(statusMsg);
  
  const urlParams = new URLSearchParams(window.location.search);
  const moveId = urlParams.get('move');
  
  if (moveId) {
    activateMoveMode(moveId);
  }
  
  enhanceContentGrid();
});

async function activateMoveMode(docId) {
  try {
    const docRef = doc(collection(db, "constitutionalDocuments"), docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      fileToMove = {
        id: docId,
        data: docSnap.data()
      };
      
      moveMode = true;
      
      const container = document.getElementById('directory-container');
      container.innerHTML = `
        <div class="move-banner">
          <p>Moving file: <strong>${fileToMove.data.title}</strong></p>
          <p>Select a destination folder and click "Move Here"</p>
          <div class="move-actions">
            <button id="moveHereBtn" class="btn move-here-btn">Move Here</button>
            <button id="cancelMoveBtn" class="btn cancel-move-btn">Cancel</button>
          </div>
        </div>
      `;
      
      document.getElementById('moveHereBtn').addEventListener('click', moveFileHere);
      document.getElementById('cancelMoveBtn').addEventListener('click', cancelMove);
      
      const uploadBtn = document.getElementById('upload-btn');
      if (uploadBtn) uploadBtn.disabled = true;
      
      showStatus(`Select destination folder for "${fileToMove.data.title}"`, 'info');
    } else {
      showStatus("File not found.", 'error');
    }
  } catch (err) {
    console.error("Error activating move mode:", err);
    showStatus("Failed to get file information.", 'error');
  }
}

async function moveFileHere() {
  if (!fileToMove) return;
  
  try {
    const docRef = doc(collection(db, "constitutionalDocuments"), fileToMove.id);
    const currentPath = getCurrentPath();
    
    await updateDoc(docRef, {
      directory: currentPath,
      updatedAt: new Date().toISOString()
    });
    
    showStatus("✅ File moved successfully!", 'success');
    
    setTimeout(() => {
      window.location.href = `hierarcy.html`;
    }, 1500);
  } catch (err) {
    console.error("Error moving file:", err);
    showStatus("❌ Failed to move file.", 'error');
  }
}

function cancelMove() {
  window.location.href = 'hierarcy.html';
}

function getCurrentPath() {
  const pathSegments = [];
  const pathNav = document.getElementById('path-navigation');
  const pathLinks = pathNav.querySelectorAll('a, span:not(:first-child)');
  
  for (let i = 1; i < pathLinks.length; i++) {
    if (pathLinks[i].tagName === 'A' || (pathLinks[i].tagName === 'SPAN' && pathLinks[i].textContent !== '/')) {
      pathSegments.push(pathLinks[i].textContent);
    }
  }
  
  let path = '/' + pathSegments.join('/');
  if (path === '/') {
    return '/';
  }
  
  return path;
}

function enhanceContentGrid() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        addMoveButtonsToItems();
      }
    });
  });
  
  const contentGrid = document.getElementById('content-grid');
  observer.observe(contentGrid, { childList: true });
  
  addMoveButtonsToItems();
}

function addMoveButtonsToItems() {
  if (moveMode) return;
  
  const items = document.querySelectorAll('.item-card');
  
  items.forEach(item => {
    const itemMeta = item.querySelector('.item-meta');
    if (itemMeta && !itemMeta.textContent.includes('Directory') && !item.querySelector('.move-btn')) {
      const itemId = item.getAttribute('data-id');
      const firestoreId = itemId.replace('file_', '');
      
      const moveBtn = document.createElement('button');
      moveBtn.className = 'move-btn';
      moveBtn.textContent = 'Move';
      moveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `hierarcy.html?move=${firestoreId}`;
      });
      
      item.appendChild(moveBtn);
    }
  });
}

function showStatus(message, type = 'info') {
  if (!statusMsg) return;
  
  statusMsg.textContent = message;
  statusMsg.className = `move-status ${type}`;
  statusMsg.style.display = 'block';
  
  if (type !== 'error' && type !== 'success') {
    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 5000);
  }
}
