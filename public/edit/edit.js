// public/admin/edit.js

const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net"
  : "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
  // grab the ID from ?id=…
  const params = new URLSearchParams(window.location.search);
  const docId  = params.get("id");

  // form fields
  const editForm          = document.getElementById("editDocForm");
  const titleInput        = document.getElementById("docTitle");
  const institutionInput  = document.getElementById("docInstitution");
  const authorInput       = document.getElementById("docAuthor");
  const categoryInput     = document.getElementById("docCategory");
  const keywordsInput     = document.getElementById("docKeywords");
  const dateInput         = document.getElementById("docDate");
  const statusMsg         = document.getElementById("message");
  const cancelButton      = document.getElementById("cancelButton");

  if (!docId) {
    statusMsg.textContent = "Invalid document ID.";
    statusMsg.style.color = "red";
    return;
  }

  // 1) load existing data via your API
  fetch(API_BASE)
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(files => {
      const doc = files.find(f => f.id === docId);
      if (!doc) throw new Error("Document not found");
      // populate form
      titleInput.value       = doc.title || "";
      institutionInput.value = doc.institution || "";
      authorInput.value      = doc.author || "";
      categoryInput.value    = doc.category || "";
      keywordsInput.value    = Array.isArray(doc.keywords)
                                ? doc.keywords.join(", ")
                                : "";
      if (doc.date) {
        dateInput.value = new Date(doc.date).toISOString().split("T")[0];
      }
    })
    .catch(err => {
      console.error("Error loading document:", err);
      statusMsg.textContent = `Failed to load: ${err.message}`;
      statusMsg.style.color = "red";
    });

  // 2) submit updates via PATCH to your API
  editForm.addEventListener("submit", async e => {
    e.preventDefault();
    statusMsg.textContent = "";
    const keywordsArray = keywordsInput.value
      .split(",")
      .map(k => k.trim())
      .filter(k => k);

    const payload = {
      title:       titleInput.value,
      institution: institutionInput.value,
      author:      authorInput.value,
      category:    categoryInput.value,
      keywords:    keywordsArray,
      date:        dateInput.value,
      updatedAt:   new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(docId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || res.statusText);
      }
      statusMsg.textContent = "✅ Document updated!";
      statusMsg.style.color = "green";

      setTimeout(() => {
        window.location.href = `../admin/hierarcy.html`;
      }, 1200);
    } catch (err) {
      console.error("Error updating:", err);
      statusMsg.textContent = `❌ ${err.message}`;
      statusMsg.style.color = "red";
    }
  });

  // 3) cancel goes back
  cancelButton.addEventListener("click", () => {
    window.location.href = `../admin/hierarcy.html`;
  });
});
