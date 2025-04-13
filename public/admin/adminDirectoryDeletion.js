class AdminDirectoryDeletion {
    constructor(baseUrl) {
      this.baseUrl = baseUrl;
    }
  
    async deleteDocument(docId) {
      const response = await fetch(`${this.baseUrl}/${docId}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document.");
      }
  
      return true;
    }
  
    // 🔧 NEW METHOD you are calling in admin-directory.js
    attachDeleteHandler(buttonElement, docTitle, docId, onSuccessCallback) {
      buttonElement.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete "${docTitle}"?`)) {
          try {
            await this.deleteDocument(docId);
            alert("Document deleted successfully.");
            if (onSuccessCallback) onSuccessCallback(); // Refresh document list
          } catch (error) {
            console.error("Deletion failed:", error);
            alert(error.message);
          }
        }
      });
    }
  }
  
  if (typeof module !== "undefined" && module.exports) {
    module.exports = AdminDirectoryDeletion;
  } else {
    window.AdminDirectoryDeletion = AdminDirectoryDeletion;
  }