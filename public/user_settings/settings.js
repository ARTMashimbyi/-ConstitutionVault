// public/user_settings/settings.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.appspot.com",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const modes = document.querySelectorAll(".mode-switcher button");
  const form = document.getElementById("filterForm");
  const resetBtn = document.getElementById("resetButton");
  const backBtn = document.getElementById("backButton");

  // Store last visited page (from referrer)
  const ref = document.referrer;
  let lastPage = "../user-interface/user-search.html";
  if (ref.includes("home.html")) lastPage = "../suggestions/home.html";
  else if (ref.includes("history.html")) lastPage = "../suggestions/history.html";
  localStorage.setItem("lastVisitedPage", lastPage);

  const saved = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const themeClass = saved.themeClass || "";

  if (themeClass) body.classList.add(themeClass);

  modes.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === themeClass);
    btn.addEventListener("click", () => {
      body.classList.remove("dark-mode", "solar-mode", "hc-mode");
      const cls = btn.dataset.mode;
      if (cls) body.classList.add(cls);
      modes.forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // Function to fetch unique values from Firestore
  async function fetchUniqueValues(field) {
    try {
      const querySnapshot = await getDocs(collection(db, "constitutionalDocuments"));
      const values = new Set();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data[field]) {
          if (Array.isArray(data[field])) {
            data[field].forEach(item => values.add(item));
          } else {
            values.add(data[field]);
          }
        }
      });
      
      return Array.from(values).sort();
    } catch (error) {
      console.error("Error fetching unique values:", error);
      return [];
    }
  }

  // Function to populate dropdown options
  async function populateDropdownOptions(field, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="loading-indicator">Loading...</div>';
    
    const values = await fetchUniqueValues(field);
    
    if (values.length === 0) {
      container.innerHTML = '<div class="loading-indicator">No options available</div>';
      return;
    }
    
    container.innerHTML = '';
    
    values.forEach(value => {
      const option = document.createElement('div');
      option.className = 'option-item';
      
      const checkboxId = `${field}-${value.replace(/\s+/g, '-').toLowerCase()}`;
      
      option.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="${checkboxId}" name="${field}" value="${value}">
          <span class="checkmark"></span>
          <span class="label-text">${value}</span>
        </label>
      `;
      
      container.appendChild(option);
      
      // Check if this option was previously selected
      if (saved[field] && (saved[field].includes(value) || saved[field] === value)) {
        option.querySelector('input').checked = true;
      }
    });
    
    // Setup search functionality
    const searchInput = document.querySelector(`.filter-search[data-target="${containerId}"]`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        Array.from(container.children).forEach(option => {
          const text = option.textContent.toLowerCase();
          option.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
      });
    }
    
    // Setup "Select All" functionality
    const toggleAllBtn = document.querySelector(`.toggle-all[data-target="${containerId}"]`);
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        
        checkboxes.forEach(checkbox => {
          checkbox.checked = !allChecked;
        });
      });
    }
  }

  // Populate all dropdowns
  await Promise.all([
    populateDropdownOptions('author', 'authorOptions'),
    populateDropdownOptions('category', 'categoryOptions'),
    populateDropdownOptions('keywords', 'keywordOptions'),
    populateDropdownOptions('institution', 'institutionOptions')
  ]);

  function setInput(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = !!value;
    } else {
      el.value = value ?? "";
    }
  }

  // Fill fields from saved settings
  setInput("sort", saved.sort);
  setInput("columns", saved.columns || "2");
  setInput("pageSize", saved.pageSize || "20");
  setInput("dateFrom", saved.dateFrom);
  setInput("dateTo", saved.dateTo);
  setInput("allTime", saved.allTime);
  setInput("snippetLength", saved.snippetLength || "100");

  // Set file type checkboxes
  if (saved.type) {
    const fileTypes = Array.isArray(saved.type) ? saved.type : [saved.type];
    document.querySelectorAll('input[name="fileTypes"]').forEach(checkbox => {
      checkbox.checked = fileTypes.includes(checkbox.value);
    });
  }

  // Save Settings
  form.addEventListener("submit", e => {
    e.preventDefault();

    const activeBtn = Array.from(modes).find(b => b.classList.contains("active"));
    const themeClass = activeBtn?.dataset.mode || "";
    const allTimeChecked = form.elements.allTime.checked;

    // Get selected authors
    const authorCheckboxes = document.querySelectorAll('#authorOptions input[type="checkbox"]:checked');
    const authors = Array.from(authorCheckboxes).map(cb => cb.value);

    // Get selected categories
    const categoryCheckboxes = document.querySelectorAll('#categoryOptions input[type="checkbox"]:checked');
    const categories = Array.from(categoryCheckboxes).map(cb => cb.value);

    // Get selected keywords
    const keywordCheckboxes = document.querySelectorAll('#keywordOptions input[type="checkbox"]:checked');
    const keywords = Array.from(keywordCheckboxes).map(cb => cb.value);

    // Get selected institutions
    const institutionCheckboxes = document.querySelectorAll('#institutionOptions input[type="checkbox"]:checked');
    const institutions = Array.from(institutionCheckboxes).map(cb => cb.value);

    // Get selected file types
    const fileTypeCheckboxes = document.querySelectorAll('input[name="fileTypes"]:checked');
    const fileTypes = Array.from(fileTypeCheckboxes).map(cb => cb.value);

    const newSettings = {
      themeClass: themeClass,
      author: authors.length > 0 ? authors : null,
      category: categories.length > 0 ? categories : null,
      keywords: keywords.length > 0 ? keywords : null,
      institution: institutions.length > 0 ? institutions : null,
      type: fileTypes.length > 0 ? (fileTypes.length === 5 ? null : fileTypes) : null,
      sort: form.elements.sort.value,
      columns: form.elements.columns.value,
      pageSize: form.elements.pageSize.value,
      dateFrom: allTimeChecked ? "" : form.elements.dateFrom.value,
      dateTo: allTimeChecked ? "" : form.elements.dateTo.value,
      allTime: allTimeChecked,
      snippetLength: form.elements.snippetLength.value
    };

    localStorage.setItem("userSettings", JSON.stringify(newSettings));
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Settings saved successfully!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
      const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
      window.location.href = back;
    }, 1500);
  });

  // Back button
  backBtn?.addEventListener("click", () => {
    const back = localStorage.getItem("lastVisitedPage") || "../user-interface/user-search.html";
    window.location.href = back;
  });

  // Reset button
  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("userSettings");
      window.location.reload();
    }
  });

  // Toggle date inputs based on "All Time" checkbox
  const allTimeCheckbox = document.getElementById("allTime");
  const dateFromInput = document.getElementById("dateFrom");
  const dateToInput = document.getElementById("dateTo");

  function toggleDateInputs() {
    const disabled = allTimeCheckbox.checked;
    dateFromInput.disabled = disabled;
    dateToInput.disabled = disabled;
  }

  allTimeCheckbox.addEventListener('change', toggleDateInputs);
  toggleDateInputs(); // Initialize state
});