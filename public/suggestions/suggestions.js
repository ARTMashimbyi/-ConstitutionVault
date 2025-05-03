console.log('im in the suggestions.js file!');

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, increment, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
//import { db } from "./initializeClick";
//import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const docCardsContainer = document.querySelector("#popular-documents .doc-cards");
console.log(docCardsContainer);//check if not null

async function loadDocuments() {
    try {
    docCardsContainer.innerHTML = '<p>Loading documents...😀</p>';//load state
    const docQuery = query(
        collection(db, "constitutionalDocuments"),
        orderBy("clicks", "desc"),
        limit(10)
    );//display 10 most clicked documents
    const querySnapshot = await getDocs(docQuery);
    docCardsContainer.innerHTML = '';//clear loading state

    if (querySnapshot.empty) {//failed ferching documents
        docCardsContainer.innerHTML = '<p>No documents found😭.</p>';
        return;
    }

    const section = document.createElement('section');
    section.className = 'document-scroll';

    querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        console.log(docData);//check if not null
        section.append(createCard({...docData, id: docSnap.id }));//create card for each document
    });
    docCardsContainer.append(section);
    
    } catch (error) {
        console.error("Error loading popular documents:", error);
        docCardsContainer.innerHTML = '<p>Error loading documents. Please try again later.</p>';
    }

}

function createCard(docData) {
    const card = document.createElement('article');
  
    card.innerHTML = `
      <h3>${docData.title || 'Untitled Document'}</h3>
      <p>${docData.description || 'No description available.'}</p>
      <p><small>Category: ${docData.category || 'Uncategorized'}</small></p>
      <a href="#" class="view-doc">View Document</a>
    `;
  
    card.querySelector('.view-doc').addEventListener('click', async (e) => {
      e.preventDefault();
  
      try {
        // Increment clicks in Firestore
        const docRef = doc(db, "constitutionalDocuments", docData.id);
        await updateDoc(docRef, {
          clicks: increment(1)
        });
  
        // Open document in new tab
        if (docData.downloadURL) {
          window.open(docData.downloadURL, '_blank');
        }
      } catch (err) {
        console.error("Error updating click count:", err);
      }
    });
  
    return card;
  }

document.addEventListener('DOMContentLoaded',loadDocuments);