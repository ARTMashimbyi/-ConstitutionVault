console.log('im in the suggestions.js file!');

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, updateDoc, increment, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

async function loadDocuments() {
    try {
        docCardsContainer.innerHTML = '<p>Loading documents... 😀</p>';

        const docQuery = query(
            collection(db, "constitutionalDocuments"),
            orderBy("clicks", "desc"),
            limit(10) // Top 10 most clicked
        );

        const querySnapshot = await getDocs(docQuery);
        docCardsContainer.innerHTML = ''; // Clear loading state

        if (querySnapshot.empty) {
            docCardsContainer.innerHTML = '<p>No documents found 😭.</p>';
            return;
        }

        const section = document.createElement('section');
        section.className = 'document-scroll';

        querySnapshot.forEach((docSnap) => {
            const docData = docSnap.data();
            console.log(docData);
            section.append(createCard({ ...docData, id: docSnap.id }));
        });

        docCardsContainer.append(section);

    } catch (error) {
        console.error("Error loading popular documents:", error);
        docCardsContainer.innerHTML = '<p>Error loading documents. Please try again later.</p>';
    }
}

function createCard(docData) {
    const card = document.createElement('article');
    card.className = 'doc-card'; // Add styling class if needed

    card.innerHTML = `
        <h3>${docData.title || 'Untitled Document'}</h3>
        <p>${docData.description || 'No description available.'}</p>
        <p><small>Category: ${docData.category || 'Uncategorized'}</small></p>
        <p><small>Clicks: ${docData.clicks || 0}</small></p>
        <a href="#" class="view-doc">View Document</a>
    `;

    card.querySelector('.view-doc').addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            const docRef = doc(db, "constitutionalDocuments", docData.id);
            await updateDoc(docRef, {
                clicks: increment(1)
            });

            if (docData.downloadURL) {
                window.open(docData.downloadURL, '_blank');
            }
        } catch (err) {
            console.error("Error updating click count:", err);
        }
    });

    return card;
}

document.addEventListener('DOMContentLoaded', loadDocuments);
