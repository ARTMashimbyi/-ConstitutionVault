// // Import Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { db, app} from "../path/firebaseInit.js"; // Import the initialized Firebase app and Firestore instance
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
    authDomain: "constitutionvault-1b5d1.firebaseapp.com",
    projectId: "constitutionvault-1b5d1",
    storageBucket: "constitutionvault-1b5d1.firebasestorage.app",
    messagingSenderId: "616111688261",
    appId: "1:616111688261:web:97cc0a35c8035c0814312c",
    measurementId: "G-YJEYZ85T3S"
};    

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const db = getFirestore(app);

export async function trackActivity(user) {
    if(!user || !user.uid) return;

    const usersRef = collection(db, "users");
    const userRef = doc(db, "users", user.uid);

    try {
        const q = query(usersRef, where("uid", "==", user.uid));
        const qSnap = await getDocs(q);

        if(qSnap.empty){
            await setDoc(userRef, {
                uid: user.uid,
                createdAt: new Date().toISOString()
            });
            console.log("User added to Firestore.");
        } else{
            console.log("User already exists in Firestore.");
        }

        const uSnap = await getDoc(userRef);
        const data = uSnap.data();

        if(!data.userInteractions){
            await setDoc(userRef, {
                userInteractions: {
                    clicks: {},
                    shared: [],
                    isFavorite: [],
                    viewed: []
                }
            }, { merge: true });
            console.log("User interactions initialized.");
        }

    } catch (error) {
        console.error("Error tracking user activity:", error);
    }
}
