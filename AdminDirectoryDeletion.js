// This file can be removed since we've integrated the deletion functionality
// directly into admin-directory.js, or keep it as a utility class if you prefer

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
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminDirectoryDeletion;
} else {
  window.AdminDirectoryDeletion = AdminDirectoryDeletion;
}
