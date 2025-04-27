// public/search/SearchInterface.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getStorage,
  ref   as storageRef,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

import { renderSearchBar }     from "./SearchBar.js";
import { renderSearchResults } from "./SearchResults.js";

// ── 1) Use the exact bucket name from your console (note the .firebasestorage.app) ──
const firebaseConfig = {
  apiKey:            "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:        "constitutionvault-1b5d1.firebaseapp.com",
  projectId:         "constitutionvault-1b5d1",
  storageBucket:     "constitutionvault-1b5d1.firebasestorage.app",  // ← corrected
  messagingSenderId: "616111688261",
  appId:             "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:     "G-YJEYZ85T3S"
};

// Initialize Firebase
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);

export function initializeSearchInterface(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Search container "${containerId}" not found.`);
    return;
  }

  const wrapper          = document.createElement("section");
  wrapper.id             = "search-interface";
  const searchBar        = renderSearchBar(handleSearch);
  const resultsContainer = document.createElement("div");
  resultsContainer.id    = "search-results";
  wrapper.append(searchBar, resultsContainer);
  container.appendChild(wrapper);

  // kick off the first load
  handleSearch("");

  async function handleSearch(query) {
    resultsContainer.innerHTML = "🔄 Loading…";
    try {
      const snapshot = await getDocs(
        collection(db, "constitutionalDocuments")
      );

      const lower = query.trim().toLowerCase();
      const hits  = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (
          !lower ||
          data.title?.toLowerCase().includes(lower) ||
          data.description?.toLowerCase().includes(lower)
        ) {
          hits.push(data);
        }
      });
      hits.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );

      // ── 2) Guard against missing storagePath so you never reference the root ──
      const hitsWithUrls = await Promise.all(
        hits.map(async (docData) => {
          const p = docData.storagePath;
          if (!p) {
            console.error("⚠️  Missing storagePath for doc", docData.id);
            return { ...docData, url: null };
          }

          // strip any leading slash
          const normalized = p.startsWith("/") ? p.slice(1) : p;
          const fileRef    = storageRef(storage, normalized);

          try {
            const url = await getDownloadURL(fileRef);
            return { ...docData, url };
          } catch (err) {
            console.warn("Failed to get URL for", normalized, err);
            return { ...docData, url: null };
          }
        })
      );

      renderSearchResults(resultsContainer, hitsWithUrls);
    } catch (err) {
      console.error("Error fetching documents:", err);
      resultsContainer.innerHTML = "<p>❌ Failed to load results.</p>";
    }
  }
}
