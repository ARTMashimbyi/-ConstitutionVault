console.log('page load');

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, collection, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// //DOM?
const titleElement = document.querySelector('.title') || {textContent: '', style: {}};
const authorElement = document.querySelector('.author') || {textContent: '', style: {}};
const publishDateElement = document.querySelector('.publishDate') || {textContent: '', style: {}};
const updatedElement = document.querySelector('.updated') || {textContent: '', style: {}};
const documentTypeElement = document.querySelector('.document') || {textContent: '', style: {}};
//const sizeElement = document.querySelector('.size');
//const descriptionElement = document.querySelector('.description');
const textContentElement = document.querySelector('.text-content') || {textContent: '', style: {}};
//const loadingElement = document.querySelector('.loading');
const errorElement = document.querySelector('.error-message') || {textContent: '', style: {}};
const editButton = document.querySelector('.btn-edit') || {textContent: '', style: {}};
const deleteButton = document.querySelector('.btn-delete') || {textContent: '', style: {}};

console.log('still okay^ ^');

const urlParams = new URLSearchParams(window.location.search);
const docId = urlParams.get('id');

//const docID = localStorage.getItem('selectedID');
//console.log('the ID is', docID);
console.log("i am working, my ID: ", docId);//on console

// //loading document?
async function loadDocument() {
    console.log(docId);
    
    try {
        const docRef = doc(collection(db, 'constitutionalDocuments'), docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists) {
            const docData = docSnap.data();
            displayDocument(docData);
            setupButtonActions(docId, docData);
        } else {
            throw new Error("Document not found");
        }
        //console.log(docRef);
        
    } catch (error) {
        console.error(error);
        errorElement.textContent = `Error: ${error.message}`;
        errorElement.style.display = 'block';
    }
}

function displayDocument(docData) {
    if(!docData) return

    titleElement.textContent = docData.title || 'Untitled Document';
    authorElement.textContent = docData.author || 'Unknown Author';
    publishDateElement.textContent = formatDate(docData.date) || 'Unknown Date';
    updatedElement.textContent = formatDate(docData.uploadedAt) || 'Unknown';
    documentTypeElement.textContent = docData.fileType || 'Unknown';
    //sizeElement.textContent = formatFileSize(docData.fileSize) || 'Unknown';
    //descriptionElement.textContent = docData.description || 'No description available';

    if (docData.content) {
        textContentElement.textContent = docData.content;
    } else {
        //textContentElement.style.display = 'none';
    }

    showContent();
}

// // Set up button event listeners
function setupButtonActions(docId, docData) {
    // Read button - open the actual file
    // readButton.addEventListener('click', () => {
    //     if (docData.fileUrl) {
    //         window.open(docData.fileUrl, '_blank');
    //     } else {
    //         alert('No file URL available');
    //     }
    // });

    // Edit button - redirect to edit page
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = `../edit/edit.html?id=${docId}`;
        });
    }

    // Delete button
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            try {
                // await db.collection("constitutionalDocuments").doc(docId).delete();
                // alert('Document deleted successfully');
                localStorage.setItem('deleteId', docId);
                window.location.href = 'deleteConfirm.html';
            } catch (error) {
                console.error("Error deleting document:", error);
                alert('Error deleting document');
            }
        });
    }
}

// // Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showContent() {
    document.querySelectorAll('article > section, article > menu').forEach(element => {
        element.style.display = 'block';
    });
}
console.log('finally works, YAAY (T^T)');

export {
    loadDocument,
    displayDocument,
    setupButtonActions,
    formatDate,
    showContent
};


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadDocument);