# Constitution Vault

[![codecov](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault/branch/main/graph/badge.svg)](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault)

# Constitutional Vault

Project Description:
Constitutional Vault is a comprehensive digital archive system designed for managing and accessing historical constitutional documents. The platform features:

- Secure admin portal for authorized users to upload, organize, and manage documents in hierarchical structures
- Public search interface with natural language processing capabilities
- Support for various file types (PDFs, text, multimedia) with rich metadata
- RESTful API designed for future extensibility (e.g., chatbot integration)

## 🚀 Key Features

📂 Advanced Document Management:

- File upload, supporting multiple formats (PDF, DOCX, TXT, JPG, PNG, Audio and Video )
- Structured metadata fields including:
  - Title, Author/Writer, Publication Year
  - Subject/Category with hierarchical tagging
  - Institution/Organization
  - Custom keywords and tags
- Automatic metadata extraction from supported file types
- Editing and Deleting capabilities

🔍 Intelligent Search System:

- Natural language processing for conversational queries
- Advanced search filters by:
  - Date ranges (year, decade, century)
  - Document type (text, audio, video)
  - Subject categories and subcategories
  - Institution/organization
  - Geographic region
- Voice search capability with speech-to-text
- Saved searches and View history

📄 Document Viewing & Annotation:

- Online PDF rendering with text selection
- Multi-page document viewer with thumbnail navigation
- Download options in multiple formats

🛠️ Administrative Tools:

- Bulk document operations (move, delete and edit)
- Hierarchical directory management:
  - Create nested folder structures
  - Drag-and-drop reorganization
  - Batch metadata editing
- User access controls with role-based permissions
- Activity logs and audit trails
- Data import/export functionality

🎨 User Experience:

- Responsive design supporting desktop/tablet/mobile
- Dark/light mode theming
- Customizable dashboard with:
  - Recently viewed documents
  - Favorite/bookmarked items
  - Personalized recommendations
- Accessibility features:
  - Screen reader support
  - High contrast mode

🔗 Integration Capabilities:

- RESTful API for third-party integrations
- Webhooks for event notifications
- Export to common formats (BibTeX, RIS, CSV)
- Social media sharing options
- Future-ready architecture for:
  - Chatbot integration (WhatsApp, Telegram)

⚙️ System Features:

- Secure authentication with:
  - Email/password login

🔐 Demo Admin Access:
For testing purposes, you can use the following admin credentials:

- Email: constitution682@gmail.com
- Password: CodeCrusaders25!

* Social login (Google)

## Installation & Setup Guide

Prerequisites:

- Node.js (v16+)
- npm (v8+)
- Firebase account
- Google Cloud account
- Azure account (for deployment)

Installation Steps:

1. Clone the repository:
   git clone https://github.com/ARTMashimbyi/-ConstitutionVault.git
   cd constitutional-vault

2. Install server dependencies:
   cd server
   npm install

Configuration:

1. Create .env file in server directory with:

2. Place Firebase service account JSON in server/key directory

Running the Application:
Development Mode:

1. Start server:
   npm install -g nodemon
   cd server
   npm install
   npm install firebase-admin
   npm install @google-cloud/aiplatform
   npm start

Project Structure:
CONSTITUTIONALVAULT/
├── public/ # Client code
│ ├── admin/ # Admin portal
│ ├── delete_edit/ # Document management
│ ├── user_search/ # Search interface
│ ├── suggestions/ # User dashboard
│ └── user_settings/ # User preferences
├── server/ # Server code
│ ├── config/ # Configuration
│ ├── routes/ # API routes
│ └── app.js # Main server

API Endpoints:
Admin:

- POST /api/admin/upload # Upload document
- PUT /api/admin/document/:id # Update document
- DELETE /api/admin/document/:id # Delete document
- POST /api/admin/directory # Create directory

Search:

- GET /api/search?q=query # Search documents
- GET /api/search/suggestions # Get suggestions

User:

- POST /api/user/signup # User registration
- POST /api/user/login # User login
- GET /api/user/history # Search history
- POST /api/user/favorite # Toggle favorites

---

## 🧪 Running Tests

This project uses **Jest** for testing. Follow the steps below to run the tests:

1. **Install Testing Dependencies**

Make sure you have Jest installed by running:

```bash
npm install --save-dev jest jest-environment-jsdom
```

2. **Run Tests**

To run tests with code coverage, run:

```bash
npx jest --coverage
```

This will run all the tests and generate a code coverage report.

3. **View the Test Results**

Once the tests complete, you'll see the output in your terminal, indicating whether the tests passed and the coverage details.

---

Troubleshooting:

- Firebase errors: Verify credentials
- Vertex AI issues: Check API access
- CORS errors: Verify server configuration

Contributing:

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

🔐 Demo Admin Access:
For testing purposes, you can use the following admin credentials:

- Email: constitution682@gmail.com
- Password: CodeCrusaders25!

---

## ✨ Code Coverage

[![codecov](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault/branch/main/graph/badge.svg)](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault)
