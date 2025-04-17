document.addEventListener('DOMContentLoaded', () => {
    const documentViewer = document.getElementById('documentViewer');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const docTitle = document.getElementById('docTitle');
    const docBasicInfo = document.getElementById('docBasicInfo');
    const metadataGrid = document.getElementById('metadataGrid');
    const contentContainer = document.getElementById('contentContainer');
    const downloadButton = document.getElementById('downloadButton');
    const deleteButton = document.getElementById('deleteButton');
    
    // Get document ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('id');
    
    if (!documentId) {
      showError('No document ID specified');
      return;
    }
    
    // Load the document
    loadDocument(documentId);
    
    // Set up delete button
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        deleteDocument(documentId);
      }
    });
    
    // Load document details and content
    async function loadDocument(id) {
      try {
        loading.style.display = 'block';
        documentViewer.style.display = 'none';
        errorMessage.style.display = 'none';
        
        const response = await fetch(`/api/archives/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load document');
        }
        
        const document = await response.json();
        
        // Set document title
        docTitle.textContent = document.title;
        document.title = document.title; // Update page title
        
        // Set basic info
        docBasicInfo.innerHTML = `
          <div>${formatDate(document.date_created)}</div>
          <div>${document.country}${document.institution ? ` • ${document.institution}` : ''}</div>
        `;
        
        // Populate metadata grid
        populateMetadata(document);
        
        // Set up download button
        downloadButton.addEventListener('click', () => {
          window.location.href = `/api/archives/${id}/download`;
        });
        
        // Render document content based on type
        await renderDocumentContent(document);
        
        // Hide loading, show document
        loading.style.display = 'none';
        documentViewer.style.display = 'block';
        
      } catch (error) {
        console.error('Error loading document:', error);
        showError(`Error loading document: ${error.message}`);
      }
    }
    
    // Populate metadata grid
    function populateMetadata(document) {
      metadataGrid.innerHTML = '';
      
      // Define metadata fields to display
      const metadataFields = [
        { label: 'Category', value: document.category },
        { label: 'File Type', value: document.file_type },
        { label: 'Archival Level', value: document.archival_level },
        { label: 'Author', value: document.author },
        { label: 'Institution', value: document.institution },
        { label: 'Continent', value: document.continent },
        { label: 'Keywords', value: document.keywords },
        { label: 'Upload Date', value: formatDate(document.date_uploaded) },
        { label: 'File Size', value: formatFileSize(document.file_size) }
      ];
      
      // Add metadata items to grid
      metadataFields.forEach(field => {
        if (field.value) {
          const metadataItem = document.createElement('div');
          metadataItem.className = 'metadata-item';
          
          const label = document.createElement('div');
          label.className = 'metadata-label';
          label.textContent = field.label;
          
          const value = document.createElement('div');
          value.className = 'metadata-value';
          value.textContent = field.value;
          
          metadataItem.appendChild(label);
          metadataItem.appendChild(value);
          metadataGrid.appendChild(metadataItem);
        }
      });
    }
    
    // Render document content based on file type
    async function renderDocumentContent(document) {
      contentContainer.innerHTML = '';
      
      // Determine content type and render accordingly
      switch (document.file_type.toLowerCase()) {
        case 'pdf':
          renderPdfViewer(document);
          break;
          
        case 'image':
          renderImageViewer(document);
          break;
          
        case 'audio':
          renderAudioPlayer(document);
          break;
          
        case 'video':
          renderVideoPlayer(document);
          break;
          
        case 'text':
        case 'document':
          await renderTextContent(document);
          break;
          
        default:
          contentContainer.innerHTML = `
            <div class="no-preview">
              <p>Preview not available for this file type.</p>
              <p>You can download the file to view its contents.</p>
            </div>
          `;
      }
    }
    
    // Render PDF viewer
    function renderPdfViewer(document) {
      contentContainer.className = 'content-container pdf-viewer';
      
      const iframe = document.createElement('iframe');
      iframe.src = `/api/archives/${document.id}/view`;
      iframe.title = document.title;
      
      contentContainer.appendChild(iframe);
    }
    
    // Render image viewer
    function renderImageViewer(document) {
      contentContainer.className = 'content-container image-viewer';
      
      const img = document.createElement('img');
      img.src = `/api/archives/${document.id}/view`;
      img.alt = document.title;
      
      contentContainer.appendChild(img);
    }
    
    // Render audio player
    function renderAudioPlayer(document) {
      contentContainer.className = 'content-container audio-player';
      
      const audio = document.createElement('audio');
      audio.controls = true;
      
      const source = document.createElement('source');
      source.src = `/api/archives/${document.id}/view`;
      source.type = document.mime_type || 'audio/mpeg';
      
      audio.appendChild(source);
      contentContainer.appendChild(audio);
    }
    
    // Render video player
    function renderVideoPlayer(document) {
      contentContainer.className = 'content-container video-player';
      
      const video = document.createElement('video');
      video.controls = true;
      
      const source = document.createElement('source');
      source.src = `/api/archives/${document.id}/view`;
      source.type = document.mime_type || 'video/mp4';
      
      video.appendChild(source);
      contentContainer.appendChild(video);
    }
    
    // Render text content
    async function renderTextContent(document) {
      contentContainer.className = 'content-container text-content';
      
      try {
        const response = await fetch(`/api/archives/${document.id}/content`);
        
        if (!response.ok) {
          throw new Error('Failed to load text content');
        }
        
        const content = await response.text();
        contentContainer.innerHTML = `<div class="text-content">${content}</div>`;
        
      } catch (error) {
        console.error('Error loading text content:', error);
        contentContainer.innerHTML = `
          <div class="error-content">
            <p>Error loading text content: ${error.message}</p>
            <p>Please try downloading the file instead.</p>
          </div>
        `;
      }
    }
    
    // Delete document
    async function deleteDocument(id) {
      try {
        loading.style.display = 'block';
        documentViewer.style.display = 'none';
        
        const response = await fetch(`/api/archives/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete document');
        }
        
        // Redirect to browse page after successful deletion
        window.location.href = '/browse.html?deleted=true';
        
      } catch (error) {
        console.error('Error deleting document:', error);
        showError(`Error deleting document: ${error.message}`);
      }
    }
    
    // Show error message
    function showError(message) {
      loading.style.display = 'none';
      documentViewer.style.display = 'none';
      errorMessage.style.display = 'block';
      errorMessage.textContent = message;
    }
    
    // Helper function to format date
    function formatDate(dateString) {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
      if (!bytes) return 'N/A';
      
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
  });