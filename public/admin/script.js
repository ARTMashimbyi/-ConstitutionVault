// Import Firebase Firestore SDK
import { Timestamp } from "firebase-admin/firestore";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrVbgcQXVeGN4BtG3OoaXIqNUyRQiwWBY",
  authDomain: "constitutionvaultdb.firebaseapp.com",
  projectId: "constitutionvaultdb",
  storageBucket: "constitutionvaultdb.appspot.com", // fixed
  messagingSenderId: "452400699232",
  appId: "1:452400699232:web:bd6d67a4ad38a7e593b005"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
db.settings({TimestampsInSnapshort:true});
