# Constitution Vault

[![codecov](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault/branch/main/graph/badge.svg)](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault)

Your project description goes here.

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

2. **Install Dependencies**

Make sure you have Node.js and npm installed. Then run:

```bash
npm install
```

3. **Run the Development Server**

To start the frontend application, run:

```bash
npm start
```

This will start the app on `http://localhost:3000`, assuming your backend is running on that address.

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

## ✨ Code Coverage

[![codecov](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault/branch/main/graph/badge.svg)](https://codecov.io/gh/ARTMashimbyi/-ConstitutionVault)

Coverage information is uploaded to Codecov, and you can view detailed reports there.
