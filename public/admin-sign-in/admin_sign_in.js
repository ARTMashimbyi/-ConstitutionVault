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

// Just to verify you’re hitting the right backend:
console.log("→ Using API_BASE:", API_BASE);

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
const signInButton   = document.getElementById("signInButton");
const signOutButton  = document.getElementById("signOutButton");
const message        = document.getElementById("message");
const adminLink      = document.querySelector(".admin-in");
const userButton     = document.querySelector(".loggedIn");
const loadingSpinner = document.querySelector(".loading-spinner");
const portalOptions  = document.getElementById("portal-options");
const adminOption    = document.getElementById("admin-option");
const userOption     = document.getElementById("user-option");

let redirectTimer;

// ==========================
// Sign in with Google
// ==========================
const userSignIn = async () => {
  loadingSpinner.style.display = "block";
  try {
    await signInWithPopup(auth, provider);
    // auth state change will handle the rest
  } catch (error) {
    console.error("Sign-in error:", error);
    loadingSpinner.style.display = "none";
    M.toast({ html: "Sign-in failed. Please try again.", classes: "red" });
  }
};

// ==========================
// Sign out
// ==========================
const userSignOut = async () => {
  try {
    await signOut(auth);
    M.toast({ html: "You have signed out successfully", classes: "green" });
    clearTimeout(redirectTimer);
    portalOptions.style.display = "none";
    adminOption.style.display  = "none";
    userOption.style.display   = "none";
  } catch (error) {
    console.error("Sign-out error:", error);
    M.toast({ html: "Sign-out failed. Please try again.", classes: "red" });
  }
};

// ==========================
// Check admin status via your backend
// ==========================
async function checkAdmin(user) {
  try {
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

// ==========================
// Show the correct portal cards
// ==========================
function handleUserAccess(isAdmin) {
  portalOptions.style.display = "block";
  if (isAdmin) {
    // Admin users see both
    adminOption.style.display = "block";
    userOption.style.display  = "block";
    adminLink.style.display   = "block";
  } else {
    // Normal users only see user, and auto-redirect
    adminOption.style.display = "none";
    userOption.style.display  = "block";
    adminLink.style.display   = "none";
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

// ==========================
// Wire up your buttons
// ==========================
if (signInButton)  signInButton.addEventListener("click", userSignIn);
if (signOutButton) signOutButton.addEventListener("click", userSignOut);

// Initialize Materialize modals on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  M.Modal.init(document.querySelectorAll(".modal"));
  M.Tooltip.init(document.querySelectorAll(".tooltipped"));
  if (userButton) {
    userButton.addEventListener("click", () => {
      setTimeout(() => {
        window.location.href = "../suggestions/home.html";
      }, 1500);
    });
  }
});

// ==========================
// Auth state observer
// ==========================
onAuthStateChanged(auth, async (user) => {
  // Hide spinner once we know auth state
  loadingSpinner.style.display = "none";

  // <-- Place your UID log here -->
  if (user) {
    console.log("Signed in UID:", user.uid);
  }

  if (user) {
    signInButton.style.display  = "none";
    signOutButton.style.display = "block";
    message.style.display       = "block";

    const isAdmin = await checkAdmin(user);
    handleUserAccess(isAdmin);

    M.toast({
      html: `Welcome, ${user.displayName || "User"}!`,
      classes: "green",
    });
  } else {
    // Signed out UI reset
    signInButton.style.display  = "block";
    signOutButton.style.display = "none";
    message.style.display       = "none";
    adminLink.style.display     = "none";
    userButton.style.display    = "none";
    portalOptions.style.display = "none";
  }
});
