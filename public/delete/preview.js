// public/admin/preview.js


  const hostname = window.location.hostname;
const API_BASE =
  hostname === "localhost" || hostname.startsWith("127.0.0.1")
    ? "http://localhost:4000/api/files"
    : "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net";


document.addEventListener("DOMContentLoaded", () => {
  // 1) Grab all required elements
  const titleEl    = document.querySelector(".title");
  const authorEl   = document.querySelector(".author");
  const dateEl     = document.querySelector(".publishDate");
  const updatedEl  = document.querySelector(".updated");
  const typeEl     = document.querySelector(".document");
  const textEl     = document.querySelector(".text-content");
  const readBtn    = document.querySelector(".btn-read");
  const editBtn    = document.querySelector(".btn-edit");
  const deleteBtn  = document.querySelector(".btn-delete");
  const errorEl    = document.querySelector(".error-message");
  const backBtn    = document.getElementById("backButton");

  // Wire up Back button
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../admin/hierarcy.html";
    });
  }

  // 2) Sanity-check
  for (const [el, sel] of [
    [titleEl,    ".title"],
    [authorEl,   ".author"],
    [dateEl,     ".publishDate"],
    [updatedEl,  ".updated"],
    [typeEl,     ".document"],
    [errorEl,    ".error-message"]
  ]) {
    if (!el) {
      console.error(`preview.js: missing element for selector '${sel}'`);
      return;
    }
  }

  // 3) Read the ID from the URL
  const docId = new URLSearchParams(window.location.search).get("id");
  if (!docId) {
    errorEl.textContent = "No document ID in URL.";
    errorEl.style.display = "block";
    return;
  }

  // 4) Fetch & render the single doc via API
  fetch(`${API_BASE}/${encodeURIComponent(docId)}`)
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(doc => {
      render(doc);
      wireActions(doc);
    })
    .catch(err => {
      console.error("Error loading document:", err);
      errorEl.textContent = `Error: ${err.message}`;
      errorEl.style.display = "block";
    });

  // 5) Populate fields
  function render(doc) {
    titleEl.textContent   = doc.title       || "Untitled";
    authorEl.textContent  = doc.author      || "Unknown";
    dateEl.textContent    = formatDate(doc.date);
    updatedEl.textContent = formatDate(doc.updatedAt || doc.uploadedAt);
    typeEl.textContent    = doc.fileType    || "—";

    if (textEl) {
      if (doc.textContent) {
        textEl.textContent    = doc.textContent;
        textEl.style.display  = "block";
      } else {
        textEl.style.display  = "none";
      }
    }

    // Un-hide content sections
    document
      .querySelectorAll("article > section, article > menu")
      .forEach(el => el.style.display = "block");
  }

  // 6) Wire up buttons
  function wireActions(doc) {
    if (readBtn && doc.downloadURL) {
      readBtn.addEventListener("click", () =>
        window.open(doc.downloadURL, "_blank")
      );
    }

    if (editBtn) {
      editBtn.addEventListener("click", () =>
        window.location.href = `../edit/edit.html?id=${encodeURIComponent(doc.id)}`
      );
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () =>
        window.location.href = `../delete/deleteConfirm.html?id=${encodeURIComponent(doc.id)}`
      );
    }
  }

  // 7) Date formatter
  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      year:  "numeric",
      month: "long",
      day:   "numeric"
    });
  }
});
