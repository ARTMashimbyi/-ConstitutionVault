// public/user-sign-up/signup.js

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
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
// Initialize Firebase & Firestore
// ==========================
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();
const db       = getFirestore(app);

// ==========================
// DOM Elements
// ==========================
const signUpButton   = document.getElementById("google-signup");
const message        = document.getElementById("message");
const loadingSpinner = document.querySelector(".loading-spinner");

let redirectTimer;

// ==========================
// Helper: create user doc if missing
// ==========================
async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    // first time signup: create the doc
    await setDoc(userRef, {
      uid:         user.uid,
      displayName: user.displayName || null,
      email:       user.email || null,
      createdAt:   new Date().toISOString(),
    });
    console.log("Created new user document in Firestore.");
  } else {
    console.log("User document already exists in Firestore.");
  }
}

// ==========================
// Handle Google Sign-Up
// ==========================
async function handleGoogleSignup() {
  if (loadingSpinner) loadingSpinner.style.display = "block";
  try {
    // 1) Sign in via popup
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

    // 2) Ensure Firestore user doc exists
    await ensureUserDoc(user);

    // 3) Show welcome message
    if (message) {
      message.textContent = `Welcome, ${user.displayName || "User"}!`;
      message.style.display = "block";
    }

    // 4) After a brief pause, redirect home
    redirectTimer = setTimeout(() => {
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

// Wire up the button
if (signUpButton) {
  signUpButton.addEventListener("click", handleGoogleSignup);
}

// ==========================
// Update UI on auth state
// ==========================
onAuthStateChanged(auth, user => {
  if (user) {
    // already signed in → hide the signup button
    if (signUpButton) signUpButton.style.display = "none";
    if (message) {
      message.textContent = `Welcome back, ${user.displayName || "User"}!`;
      message.style.display = "block";
    }
  } else {
    // not signed in → show the button
    if (signUpButton) signUpButton.style.display = "block";
    if (message) message.style.display = "none";
  }
});
