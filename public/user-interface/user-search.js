// public/user-interface/user-search.js
console.log("user-search.js loaded")

import { initializeSearchInterface } from "../search/SearchInterface.js";

document.addEventListener("DOMContentLoaded", () => {
  // This will mount your search bar + results into the <section id="search-container">
  initializeSearchInterface("search-container");
});