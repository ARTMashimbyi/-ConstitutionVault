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

// Firestore imports
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ==========================
// Firebase configuration
// ==========================
const firebaseConfig = {
  apiKey:       "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain:   "constitutionvault-1b5d1.firebaseapp.com",
  projectId:    "constitutionvault-1b5d1",
  storageBucket:"constitutionvault-1b5d1.firebasestorage.app",
  messagingSenderId: "616111688261",
  appId:        "1:616111688261:web:97cc0a35c8035c0814312c",
  measurementId:"G-YJEYZ85T3S",
};

// ==========================
// Initialize Firebase & Firestore
// ==========================
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);
const provider  = new GoogleAuthProvider();

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
async function userSignIn() {
  loadingSpinner.style.display = "block";
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will handle the rest
  } catch (err) {
    console.error("Sign-in error:", err);
    loadingSpinner.style.display = "none";
    M.toast({ html: "Sign-in failed. Please try again.", classes: "red" });
  }
}

// ==========================
// Sign out
// ==========================
async function userSignOut() {
  try {
    await signOut(auth);
    M.toast({ html: "You have signed out successfully", classes: "green" });
    clearTimeout(redirectTimer);
    portalOptions.style.display = "none";
    adminOption.style.display  = "none";
    userOption.style.display   = "none";
  } catch (err) {
    console.error("Sign-out error:", err);
    M.toast({ html: "Sign-out failed. Please try again.", classes: "red" });
  }
}

// Expose for onclick in index.html if you need it:
window.userSignIn  = userSignIn;
window.userSignOut = userSignOut;

// ==========================
// Check admin status directly in Firestore
// ==========================
async function checkAdmin(user) {
  try {
    const q = query(
      collection(db, "Admin_users"),
      where("UID", "==", user.uid)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error("Error checking admin in Firestore:", err);
    return false;
  }
}

// ==========================
// Show Admin vs User portal cards
// ==========================
function handleUserAccess(isAdmin) {
  portalOptions.style.display = "block";

  if (isAdmin) {
    adminOption.style.display = "block";
    userOption.style.display  = "block";
    adminLink.style.display   = "block";
  } else {
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
// Wire up buttons if they exist
// ==========================
if (signInButton)  signInButton.addEventListener("click", userSignIn);
if (signOutButton) signOutButton.addEventListener("click", userSignOut);

// Initialize Materialize components
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
  loadingSpinner.style.display = "none";

  if (user) {
    console.log("Signed in UID:", user.uid);
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
    // Signed out
    signInButton.style.display  = "block";
    signOutButton.style.display = "none";
    message.style.display       = "none";
    adminLink.style.display     = "none";
    userButton.style.display    = "none";
    portalOptions.style.display = "none";
  }
});
