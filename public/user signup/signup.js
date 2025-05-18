import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { trackActivity } from "../admin sign in/trackUser.js";
import { app, auth, db } from "../path/firebaseInit.js"; // Correct centralized import


const provider = new GoogleAuthProvider();

document.getElementById("google-signup").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken();

    console.log("User signed in:", user.uid);
    localStorage.setItem("currentUserId", user.uid);//user id to be used for suggestions page

    // Check if user UID exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // New user — add UID only (no email or name)
      //replaced addDoc with setDoc, in case of error later
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      console.log("New user added with UID only.");
      //after user is added to the database
      await trackActivity(user.uid);
    } else {
      console.log("User already exists.");
    }

    // Redirect to landing page
    window.location.href = "landing.html";

  } catch (err) {
    console.error("Signup failed:", err);
    alert("Signup failed. Check the console.");
  }
});

// async function trackActivity(userId) {
//   try {
//     const userActivityRef = doc(db, "users", userId);
//     const userSnap = await getDoc(userActivityRef);

//     if(userSnap.exists()) {
//       const data = userSnap.data();
//       if(!data.userInteractions) {
//         await updateDoc(userActivityRef, {
//           userInteractions: {
//             clicks: {},
//             shared: [],
//             isFavorite: [],
//             viewed: []
//           }
//         });
//       }
//       console.log("New user activity tracked successfully.");
//     }
//   } catch (error) {
//     console.error("Error tracking user activity:", error);
    
//   }
// }
