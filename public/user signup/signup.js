// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
  authDomain: "ConstitutionVault.firebaseapp.com",
  projectId: "constitutionvault-1b5d1",
  
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let auth0 = null;

async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: 'dev-gle8pp2yx6w48r1a.us.auth0.com',
    client_id: 'eCyqhVkWIJ4SCb2R3SbM5AkXSlfgVrQx',
    cacheLocation: 'localstorage',
  });
}

document.getElementById('google-signup').addEventListener('click', async () => {
  try {
    if (!auth0) {
      await initAuth0();
    }

    // Login using Google (popup)
    await auth0.loginWithPopup({
      connection: 'google-oauth2',
    });

    const idTokenClaims = await auth0.getIdTokenClaims();
    const idToken = idTokenClaims.__raw;

    console.log('ID Token:', idToken);

    // Send the token to the backend
    const response = await fetch('http://localhost:3000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id_token: idToken })
    });

    const result = await response.json();
    alert(result.message);

    // Check if user UID exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", idTokenClaims.sub));  // UID from token
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // New user — add UID only (no email or name)
      await addDoc(usersRef, {
        uid: idTokenClaims.sub,
        createdAt: new Date().toISOString()
      });
      console.log("New user added with UID only.");
    } else {
      console.log("User already exists.");
    }

    window.location.replace("landing.html");


  } catch (err) {
    console.error("Signup failed:", err);
    alert("Signup failed. Check the console.");
  }
});
