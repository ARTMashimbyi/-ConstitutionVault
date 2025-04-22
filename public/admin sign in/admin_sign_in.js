import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
        
        import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
        // TODO: Add SDKs for Firebase products that you want to use
        // https://firebase.google.com/docs/web/setup#available-libraries
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
        // Your web app's Firebase configuration
        import {
            collection,  // Used to reference a collection in Firestore
            getDocs      // Used to retrieve all documents from a collection
          } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
    
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
       const app = initializeApp(firebaseConfig);        
        const auth=getAuth();
        const provider=new GoogleAuthProvider();
        const db = getFirestore(app);
        // Display
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const message = document.getElementById('message');
    const adminLink=document.querySelector('.admin-in');
    const userButton =document.querySelector('.loggedIn');
signOutButton.style.display ="none";
message.style.display="none";


var Admin_status = false;

// signIn with google
const userSignIn =async() =>{
    signInWithPopup(auth, provider) 
    .then((result) =>{
        const user= result.user 
       // console.log(user.uid);
       // console.log(typeof(user.uid));
    }).catch((error)=>{
        const errorCode=error.code;
        const errorMessage=error.message;
    });
};
// sign out
const userSignOut = async() =>{
    signOut(auth).then(()=>{
        alert("You have signed out successfully");
    }).catch((error)=>{})
};


signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);


// Select the HTML element with the ID 'Admin_users' where the book links will be displayed
//const Admin_users = document.getElementById('Admin_users');

// Define an async function to fetch and display books

async function checkAdmin(user ) {
  
    //console.log("DB:", db); // this should NOT be undefined
   // console.log(user.uid);
    const booksRef = collection(db, "Admin_users");
    
    // Get all documents from the 'Books' collection in Firestore
    const querySnapshot = await getDocs(collection(db, "Admin_users"));
    querySnapshot.forEach((docSnap) => {
       const Admins = docSnap.data(); // Get the admin data
       if(Admins.UID==user.uid){
     Admin_status = true;
     console.log("Admin checked out");
     console.log(Admin_status);
     adminLink.style.display ="block";
        } 
        else{
            console.log("Admin did not check out");
        }
    });
   

};

console.log(Admin_status);
onAuthStateChanged(auth, (user)=>{
    if(user){
        
        signOutButton.style.display ="block";
        message.style.display="block";
        checkAdmin(user);
        userButton.style.display="block";
        signInButton.style.display="none";
    }
    else{
        signOutButton.style.display ="none";
        message.style.display="none"; 
        adminLink.style.display ="none";
        userButton.style.display="none";
        signInButton.style.display="block";
    }
})
//admin_portal();
// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
  
    var items = document.querySelectorAll('.collapsible');
    M.Collapsible.init(items);
  
  });