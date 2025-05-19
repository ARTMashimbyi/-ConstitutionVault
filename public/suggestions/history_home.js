
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, increment, doc, onSnapshot, arrayUnion, arrayRemove,getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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


if(!currentUserId){
    alert("Please login to view documents.");
    window.location.href = "../user%20signup/index.html";
}

async function initApp() {
    try {
      showLoading(true);
      search();
      //await loadAllDocuments();
      await loadUserInteractions(currentUserId);
      await userHistory(currentUserId);
      //setupEventListeners();
      //renderAllSections(); //since in loadAllDocuments
    } catch (error) {
      console.error("Initialization error:", error);
      showError("Failed to load documents");
    } finally {
      showLoading(false);
    }
}


async function loadUserInteractions(userId) {
    const userRef = doc(db, "user_history", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        userInteractions = userSnap.data().userInteractions || {
            clicks: {},
            viewed: [],
            isFavorite: [],
            shared: []
        };
        //console.log("User interactions loaded:", userInteractions);
        updateStats(userInteractions);
    } else {
       // console.error("User document does not exist.");
    }
}
// Mukondi
const arr1=[];
async function userHistory(user){
  console.log("user history in function");
  console.log(user);
  const userRef = doc(db, "user_history", user);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      console.log(userSnap);
      try{
        const history = userSnap.data().viewed;
      history.forEach(doc=>{
        arr1.unshift(doc);
       console.log(doc);
      });     
        var copiedarray = arr1.slice(0,5);
        
        copiedarray.forEach(doc=>{
          getTitle(doc);
          //console.log(doc);
       });
      }
   catch{ 
    console.log("catching");
  // const historyList = document.getElementById('history');
  // const li=`
  //         No user history
  //         `;
  //         historyList.innerHTML=li;
}
}
else{
  const historyList = document.getElementById('history');
  const li=`
          No user history
          `;
          historyList.innerHTML=li;
}
}

//userHistory(currentUserId);

const historyList=document.getElementById('history');
historyList.innerHTML = '';
async function getTitle(data){ 
  if(data.length){
       const docID = data;
        const docRef = doc(collection(db, 'constitutionalDocuments'), docID );
        const docSnap1 = await getDoc(docRef);
        if (docSnap1.exists()) {
          const docData = docSnap1.data();
          console.log(docData.title)
          const fileTypeIcons = {
                    document: '📄',
                    video: '🎬',
                    image: '🖼️',
                    audio: '🔊',
                    text: '📝'
                };
                
         const icon = fileTypeIcons[docData.fileType] || '📄';
         const title = docData.title || 'Untitled Document';
         const docItem = document.createElement('li');
         docItem.className = 'document-item';
         docItem.innerHTML = `
                    <span class="doc-icon">${icon}</span>
                    <article class="doc-info">
                    <h3 class="doc-title">${title}</h3>
                    <aside class="doc-meta">
                      <span>${docData.fileType || 'Unknown type'}</span> 
                      </aside>
                    </article>
                `;
                
                
         historyList.appendChild(docItem);
        }      
      
      
      }
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

  async function search() {
    const searchBtn = document.querySelector('.search-btn');
        searchBtn.addEventListener('click', () => {
            window.location.href = "../user-interface/user-search.html";
    });
}
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', initApp);