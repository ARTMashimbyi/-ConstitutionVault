// public/admin/admin_home.js

const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";

document.addEventListener('DOMContentLoaded', async function() {
    // Setup logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
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
            // Add any custom logic here
        });
    });

    try {
        // 1. Fetch all documents
        const docsRes = await fetch(`${API_BASE}/files`);
        if (!docsRes.ok) throw new Error("Failed to fetch documents");
        const docs = await docsRes.json();

        // 2. Fetch all directories
        const dirRes = await fetch(`${API_BASE}/directories`);
        if (!dirRes.ok) throw new Error("Failed to fetch directories");
        const dirs = await dirRes.json();

        // 3. Calculate stats
        const totalDocs = docs.length;
        const totalDirectories = dirs.length;

        // Collect file types
        const fileTypes = new Set();
        docs.forEach(doc => {
            if (doc.fileType) fileTypes.add(doc.fileType);
        });

        // Recent uploads (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentCount = 0;
        docs.forEach(doc => {
            if (doc.uploadedAt) {
                const uploadDate = new Date(doc.uploadedAt);
                if (uploadDate > thirtyDaysAgo) recentCount++;
            }
        });

        // Update stats in UI
        document.getElementById('totalDocs').textContent = totalDocs;
        document.getElementById('totalDirectories').textContent = totalDirectories;
        document.getElementById('recentUploads').textContent = recentCount;
        document.getElementById('fileTypes').textContent = fileTypes.size;

        // 4. Show recent documents (last 5 by date)
        const sortedDocs = docs
            .slice()
            .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
            .slice(0, 5);

        const recentDocsList = document.getElementById('recentDocumentsList');
        recentDocsList.innerHTML = '';

        if (sortedDocs.length === 0) {
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
            const fileTypeIcons = {
                document: '📄',
                video: '🎬',
                image: '🖼️',
                audio: '🔊',
                text: '📝'
            };

            sortedDocs.forEach(doc => {
                const icon = fileTypeIcons[doc.fileType] || '📄';
                const title = doc.title || 'Untitled Document';
                const date = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date';
                const directory = doc.directory || '/';

                const docItem = document.createElement('li');
                docItem.className = 'document-item';
                docItem.innerHTML = `
                    <span class="doc-icon">${icon}</span>
                    <article class="doc-info">
                        <h3 class="doc-title">${title}</h3>
                        <aside class="doc-meta">
                            <span>${doc.fileType || 'Unknown type'}</span>
                            <span>${directory}</span>
                            <span>Added: ${date}</span>
                        </aside>
                    </article>
                `;

                recentDocsList.appendChild(docItem);
            });
        }
    } catch (error) {
        console.error("Error fetching data from API:", error);

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
