import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async function() {
    // Setup logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                // Redirect to login page (or index)
                window.location.href = '../../index.html';
            }
        });
    }
    
    // Add click event listeners to upload type elements
    const uploadTypes = document.querySelectorAll('.upload-type');
    uploadTypes.forEach(element => {
        element.addEventListener('click', function() {
            const fileType = this.getAttribute('data-file-type');
            console.log(`Selected file type: ${fileType}`);
            // You can add logic here to handle the file type selection
            // For example, redirect to an upload page with the file type as a parameter
        });
    });
    
    // Firebase initialization
    const firebaseConfig = {
        apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
        authDomain: "constitutionvault-1b5d1.firebaseapp.com",
        projectId: "constitutionvault-1b5d1",
        storageBucket: "constitutionvault-1b5d1.appspot.com",
        messagingSenderId: "616111688261",
        appId: "1:616111688261:web:97cc0a35c8035c0814312c",
        measurementId: "G-YJEYZ85T3S"
    };

    try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Fetch statistics
        const docsSnapshot = await getDocs(collection(db, "constitutionalDocuments"));
        const dirSnapshot = await getDocs(collection(db, "directories"));
        
        // Calculate statistics
        const totalDocs = docsSnapshot.size;
        const totalDirectories = dirSnapshot.size;
        
        // Get file types
        const fileTypes = new Set();
        docsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fileType) fileTypes.add(data.fileType);
        });
        
        // Get recent uploads (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentCount = 0;
        
        docsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.uploadedAt) {
                const uploadDate = new Date(data.uploadedAt);
                if (uploadDate > thirtyDaysAgo) {
                    recentCount++;
                }
            }
        });
        
        // Update stats in UI
        document.getElementById('totalDocs').textContent = totalDocs;
        document.getElementById('totalDirectories').textContent = totalDirectories;
        document.getElementById('recentUploads').textContent = recentCount;
        document.getElementById('fileTypes').textContent = fileTypes.size;
        
        // Fetch recent documents
        const recentDocsQuery = query(
            collection(db, "constitutionalDocuments"),
            orderBy("uploadedAt", "desc"),
            limit(5)
        );
        
        const recentDocsSnapshot = await getDocs(recentDocsQuery);
        const recentDocsList = document.getElementById('recentDocumentsList');
        
        // Clear loading message
        recentDocsList.innerHTML = '';
        
        if (recentDocsSnapshot.empty) {
            recentDocsList.innerHTML = `
                <li class="document-item">
                    <span class="doc-icon">📄</span>
                    <article class="doc-info">
                        <h3 class="doc-title">No documents yet</h3>
                        <aside class="doc-meta">
                            <span>Use the upload section to add documents</span>
                        </aside>
                    </article>
                </li>
            `;
        } else {
            recentDocsSnapshot.forEach(doc => {
                const data = doc.data();
                const fileTypeIcons = {
                    document: '📄',
                    video: '🎬',
                    image: '🖼️',
                    audio: '🔊',
                    text: '📝'
                };
                
                const icon = fileTypeIcons[data.fileType] || '📄';
                const title = data.title || 'Untitled Document';
                const date = data.uploadedAt ? new Date(data.uploadedAt).toLocaleDateString() : 'Unknown date';
                const directory = data.directory || '/';
                
                const docItem = document.createElement('li');
                docItem.className = 'document-item';
                docItem.innerHTML = `
                    <span class="doc-icon">${icon}</span>
                    <article class="doc-info">
                        <h3 class="doc-title">${title}</h3>
                        <aside class="doc-meta">
                            <span>${data.fileType || 'Unknown type'}</span>
                            <span>${directory}</span>
                            <span>Added: ${date}</span>
                        </aside>
                    </article>
                `;
                
                recentDocsList.appendChild(docItem);
            });
        }
        
    } catch (error) {
        console.error("Error initializing Firebase or fetching data:", error);
        
        // Show error message in stats
        document.getElementById('totalDocs').textContent = '?';
        document.getElementById('totalDirectories').textContent = '?';
        document.getElementById('recentUploads').textContent = '?';
        document.getElementById('fileTypes').textContent = '?';
        
        // Show error in recent documents
        const recentDocsList = document.getElementById('recentDocumentsList');
        recentDocsList.innerHTML = `
            <li class="document-item">
                <span class="doc-icon">❌</span>
                <article class="doc-info">
                    <h3 class="doc-title">Error loading documents</h3>
                    <aside class="doc-meta">
                        <span>Check console for details</span>
                    </aside>
                </article>
            </li>
        `;
    }
});
