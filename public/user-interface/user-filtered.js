// public/user-interface/user-search.js

import { initializeUserFilteredSearch } from "../search/UserFilteredSearchInterface.js";

document.addEventListener("DOMContentLoaded", () => {
  // This will mount your search bar + results into the <section id="search-container">
  
  initializeUserFilteredSearch("search-container");

});
