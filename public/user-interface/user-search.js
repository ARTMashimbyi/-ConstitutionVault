// public/user-interface/user-search.js

import { initializeSearchInterface } from "../search/SearchInterface.js";

document.addEventListener("DOMContentLoaded", () => {
  // The SearchInterface will itself read userSettings from localStorage
  initializeSearchInterface("search-container");
});
