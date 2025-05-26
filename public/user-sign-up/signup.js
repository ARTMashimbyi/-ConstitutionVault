// public/user signup/signup.js

// ==========================
// Import Firebase modules
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ==========================
// Firebase configuration
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "constitutionvault-1b5d1.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  storageBucket: "constitutionvault-1b5d1.appspot.com",
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==========================
// DOM Elements
// ==========================
const signUpButton   = document.getElementById("google-signup");
const message        = document.getElementById("message");
const loadingSpinner = document.querySelector(".loading-spinner");

let redirectTimer;

// ===============
// Sign up logic
// ===============
async function handleGoogleSignup() {
  if (loadingSpinner) loadingSpinner.style.display = "block";

  try {
    // 1) Google popup
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;
    const idToken = await user.getIdToken();

    // 2) Persist in localStorage (so login page can pick it up if needed)
    localStorage.setItem("currentUserId", user.uid);

    // 3) Tell your backend to create or fetch this user
    const res = await fetch(`${API_BASE}/auth/user-signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ idToken })
    });
    if (!res.ok) throw new Error("Failed to register user via API");
    const data = await res.json();

    // 4) Show a little welcome
    if (message) {
      message.textContent = `Welcome, ${user.displayName || "User"}!`;
      message.style.display = "block";
    }

    // 5) After a short pause, send them back to your login page
    redirectTimer = setTimeout(() => {
      // adjust the path if your index.html lives elsewhere
      window.location.href = "../../index.html";
    }, 1200);

  } catch (err) {
    console.error("Signup failed:", err);
    if (message) {
      message.textContent = "Signup failed. Please try again.";
      message.style.display = "block";
    }
  } finally {
    if (loadingSpinner) loadingSpinner.style.display = "none";
  }
}

signUpButton.addEventListener("click", handleGoogleSignup);

// ===============
// Keep the button state in sync
// ===============
onAuthStateChanged(auth, user => {
  if (user) {
    // if they're signed in, hide the signup button
    signUpButton.style.display = "none";
    if (message) {
      message.textContent = `Welcome, ${user.displayName || "User"}!`;
      message.style.display = "block";
    }
  } else {
    // otherwise show it
    signUpButton.style.display = "block";
    if (message) message.style.display = "none";
  }
});
