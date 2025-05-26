// ==========================
// Import Firebase modules
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";

// ==========================
// Firebase configuration
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId: "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId: "G-YJEYZ85T3S",
};

// ==========================
// API base (local or Azure)
// ==========================

const hostname = window.location.hostname;
const API_BASE =
  hostname === "localhost" || hostname.startsWith("127.0.0.1")
    ? "http://localhost:4000/api"
    : "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api";



// ==========================
// Initialize Firebase
// ==========================
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// ==========================
// DOM Elements
// ==========================
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const message = document.getElementById("message");
const adminLink = document.querySelector(".admin-in");
const userButton = document.querySelector(".loggedIn");
const loadingSpinner = document.querySelector(".loading-spinner");
const portalOptions = document.getElementById("portal-options");
const adminOption = document.getElementById("admin-option");
const userOption = document.getElementById("user-option");
const userModal = document.getElementById("modal-users");

let redirectTimer;

/**
 * Sign in with Google
 */
const userSignIn = async () => {
  loadingSpinner.style.display = "block";
  try {
    await signInWithPopup(auth, provider);
    // The rest is handled by onAuthStateChanged
  } catch (error) {
    console.error("Sign-in error:", error);
    loadingSpinner.style.display = "none";
    M.toast({ html: "Sign-in failed. Please try again.", classes: "red" });
  }
};

/**
 * Sign out function
 */
const userSignOut = async () => {
  try {
    await signOut(auth);
    M.toast({ html: "You have signed out successfully", classes: "green" });
    clearTimeout(redirectTimer);

    // Reset UI elements
    portalOptions.style.display = "none";
    adminOption.style.display = "none";
    userOption.style.display = "none";
  } catch (error) {
    console.error("Sign-out error:", error);
    M.toast({ html: "Sign-out failed. Please try again.", classes: "red" });
  }
};

/**
 * Check if user has admin privileges using backend API and ID token (SECURE!)
 * @param {Object} user - The Firebase user object
 * @returns {Promise<boolean>}
 */
async function checkAdmin(user) {
  try {
    // Get Firebase ID token for the user (secure, can't spoof)
    const idToken = await user.getIdToken();
    const res = await fetch(`${API_BASE}/auth/admin-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error("API error while checking admin status:", error);
    return false;
  }
}

/**
 * Direct user to appropriate portal based on role
 * @param {boolean} isAdmin - Whether the user is an admin
 */
function handleUserAccess(isAdmin) {
  portalOptions.style.display = "block";
  if (isAdmin) {
    // Admin users: show both options
    adminOption.style.display = "block";
    userOption.style.display = "block";
    adminLink.style.display = "block";
  } else {
    // Regular users: only show user option, auto-redirect after 2s
    adminOption.style.display = "none";
    userOption.style.display = "block";
    adminLink.style.display = "none";
    redirectTimer = setTimeout(() => {
      window.location.href = "../suggestions/home.html";
    }, 2000);
    M.toast({
      html: "Redirecting to user portal...",
      classes: "blue",
      displayLength: 2000,
    });
  }
}

// Event listeners
signInButton.addEventListener("click", userSignIn);
signOutButton.addEventListener("click", userSignOut);

// Initialize Materialize components and modal behavior
document.addEventListener("DOMContentLoaded", function () {
  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  const tooltips = document.querySelectorAll(".tooltipped");
  M.Tooltip.init(tooltips);

  // Open the user modal and redirect when clicked
  userButton.addEventListener("click", () => {
    // Fallback: just redirect after click
    setTimeout(() => {
      window.location.href = "../suggestions/home.html";
    }, 1500);
  });
});

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
  loadingSpinner.style.display = "none";

  if (user) {
    // User is signed in
    signInButton.style.display = "none";
    signOutButton.style.display = "block";
    message.style.display = "block";
    userButton.style.display = "block";

    // Check admin status using API (with ID token)
    const isAdmin = await checkAdmin(user);

    // Update UI
    handleUserAccess(isAdmin);

    // Show welcome toast
    M.toast({
      html: `Welcome, ${user.displayName || "User"}!`,
      classes: "green",
    });
  } else {
    // User is signed out
    signInButton.style.display = "block";
    signOutButton.style.display = "none";
    message.style.display = "none";
    adminLink.style.display = "none";
    userButton.style.display = "none";
    portalOptions.style.display = "none";
  }
});
