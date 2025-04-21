import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Delete confirmation page loaded (<> _ <>)');

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

    // Get the document ID from localStorage
    const docId = localStorage.getItem('deleteId');
    console.log('Document ID to delete:', docId);

    // UI Elements
    const statusMessage = document.querySelector('.status-message') || { textContent: '', style: {} };
    const spinner = document.querySelector('.spinner') || { textContent: '', style: {} };
    const successIcon = document.querySelector('.success-icon') || { textContent: '', style: {} };
    const errorIcon = document.querySelector('.error-icon') || { textContent: '', style: {} };
    const confirmBtn = document.querySelector('.confirm-btn') || { textContent: '', style: {} };
    const cancelBtn = document.querySelector('.cancel-btn') || { textContent: '', style: {} };
    const backBtn = document.querySelector('.back-btn') || { textContent: '', style: {} };

    console.log('who in the hell is NULL!!(~_~)',{
        confirmBtn,
        cancelBtn,
        backBtn,
        spinner
      });//who in the hell is NULL!!!!!(-_-)

    confirmBtn.addEventListener('click', async () => {
        deleteItem();   
    });

    cancelBtn.addEventListener('click', () => {
        window.location.href = "../admin/hierarcy.html";
    });

    async function deleteItem() {
        // Show loading state
        spinner.style.display = 'block';
        statusMessage.textContent = 'Deleting document...';
    
        try {
            if (!docId) {
                errorElement.textContent = 'No document ID provided';
                errorElement.style.display = 'block';
                return;
            }

            // Delete document using modular Firebase v9 syntax
            await deleteDoc(doc(db, "constitutionalDocuments", docId));
        
            // Show success state
            spinner.style.display = 'none';
            successIcon.style.display = 'block';
            statusMessage.textContent = 'Document deleted successfully!';
        
            // Clear the stored ID
            localStorage.removeItem('deleteId');
        
            // Redirect after 1.2 seconds
            const delay = 1200;
            setTimeout(() => {
                window.location.href = "../admin/hierarcy.html";
            }, delay);
        
        } catch (error) {
            console.error("Error deleting document:", error);
        
            // Show error state
            spinner.style.display = 'none';
            errorIcon.style.display = 'block';
            statusMessage.textContent = `Error: ${error.message}`;
        
            // Show back button
            backBtn.style.display = 'block';
        }   
    }
// document.addEventListener('DOMContentLoaded', deleteItem);
});

export { deleteItem };
