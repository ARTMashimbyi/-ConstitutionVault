# -ConstitutionVault

# 📚 Constitution Vault - Frontend

This is the frontend for **Constitution Vault**, a document management web application

---

## 🚀 Features

- 📂 Upload documents with metadata (name, writer, year, subject)
- 🔍 Search documents by title, writer, or subject
- 📄 View documents inline (PDF rendering)
- 🗑️ Select and delete one or more documents
- 🎨 Clean, modern UI with sidebar navigation

---

## 🧱 Folder Structure

```
public/
├── index.html         # Main homepage
├── add.html           # Upload document page
├── read.html          # Inline PDF viewer
├── style.css          # UI styles
├── index.js           # Logic for fetching, searching, deleting
├── add.js             # Handles file uploads
├── read.js            # Displays PDFs
└── assets/            # (Optional) UI images, logos
```

---

## 🔧 Requirements

- A running backend API (`http://localhost:3000`) connected to your Azure SQL database.
- PDF documents are uploaded and stored as binary in the backend.

---

## 🛠️ Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/your-username/constitution-vault-frontend.git
cd constitution-vault-frontend
```

## 📁 Pages

- `index.html` – Lists all uploaded books and allows searching & deleting.
- `add.html` – Form to upload a new book and PDF file.
- `read.html?id=1` – View PDF inline based on book ID from URL.

---

## 🔄 API Endpoints Used

The frontend makes requests to the following backend routes:

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/books`              | Fetch all books      |
| POST   | `/upload`             | Upload new document  |
| GET    | `/books/:id/document` | Fetch PDF for a book |
| DELETE | `/books/:id`          | Delete a book by ID  |

---

## ✨
