module.exports = {
  // Use jsdom so DOM APIs are available in tests
  testEnvironment: "jest-environment-jsdom",

  // Transpile ES‑module syntax (import/export) with Babel
  transform: {
    "^.+\\.js$": "babel-jest"
  },

  // Allow importing from these folders without relative paths
  moduleDirectories: ["node_modules", "public", "tests"],

  // Map the Firebase CDN imports in your code to local mock files
  moduleNameMapper: {
    "^https://www\\.gstatic\\.com/firebasejs/11\\.6\\.0/firebase-app\\.js$":
      "<rootDir>/tests/__mocks__/firebase-app.js",
    "^https://www\\.gstatic\\.com/firebasejs/11\\.6\\.0/firebase-firestore\\.js$":
      "<rootDir>/tests/__mocks__/firebase-firestore.js"
  }
};
