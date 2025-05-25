// public/delete/delete.js

const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api/files"
  : "http://localhost:4000/api/files";

document.addEventListener("DOMContentLoaded", () => {
  // 1) Read the document ID from the URL query string
  const params = new URLSearchParams(window.location.search);
  const docId  = params.get("id");

  // 2) Grab UI elements
  const statusMsg  = document.querySelector(".status-message");
  const spinner    = document.querySelector(".spinner");
  const successIcn = document.querySelector(".success-icon");
  const errorIcn   = document.querySelector(".error-icon");
  const confirmBtn = document.querySelector(".confirm-btn");
  const cancelBtn  = document.querySelector(".cancel-btn");
  const backBtn    = document.querySelector(".back-btn");

  // 3) Sanity‐checks
  if (!confirmBtn || !cancelBtn) {
    console.error("delete.js: Missing confirm or cancel buttons in deleteConfirm.html");
    return;
  }
  if (!docId) {
    statusMsg.textContent = "Error: No document ID provided.";
    statusMsg.style.color = "red";
    statusMsg.style.display = "block";
    return;
  }

  // 4) Confirm button: call DELETE /api/files/:id
  confirmBtn.addEventListener("click", async () => {
    spinner.style.display = "block";
    statusMsg.textContent  = "Deleting…";

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(docId)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }

      // 5) Show success, then redirect back to hierarchy
      spinner.style.display    = "none";
      successIcn.style.display = "block";
      statusMsg.textContent     = "Deleted successfully!";
      setTimeout(() => {
        window.location.href = "../admin/hierarcy.html";
      }, 1200);

    } catch (err) {
      console.error("Delete failed:", err);
      spinner.style.display   = "none";
      errorIcn.style.display  = "block";
      statusMsg.textContent   = `Error: ${err.message}`;
      backBtn.style.display   = "block";
    }
  });

  // 6) Cancel button goes back to hierarchy
  cancelBtn.addEventListener("click", () => {
    window.location.href = "../admin/hierarcy.html";
  });
});
