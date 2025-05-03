import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
        
        import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
        // TODO: Add SDKs for Firebase products that you want to use
        // https://firebase.google.com/docs/web/setup#available-libraries
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
        // Your web app's Firebase configuration
        import {
            collection,  // Used to reference a collection in Firestore
            getDocs,     // Used to retrieve all documents from a collection
            doc,
            getDoc
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
    



onAuthStateChanged(auth, (user)=>{
    if(user){       
        userHistory(user); //get user history using user ID
    }
    else{ 
       console.log("Auth no user");
    }
})
async function userHistory(user){  
const usersRef = collection(db, "user_history");
const querySnapshot = await getDocs(usersRef); // there was an await here
//getTitle(querySnapshot);
    querySnapshot.forEach((docSnap) => {
      const history = docSnap.data(); // Get the user data
      if(history.User==user.uid){
      // setupHistory(querySnapshot);
          getTitle(history.ID); //getting documentID to show titles
       }
      //console.log(docSnap)
    });
    //historyList.innerText = html
}
let html='';
async function getTitle(data){ 
  if(data.length){
    
    //data.forEach(docSnap =>{
      //const history=docSnap.data();
      //if(history.User==user.uid){
       const docID = data;
        const docRef = doc(collection(db, 'constitutionalDocuments'), docID );
        const docSnap1 = await getDoc(docRef);
        if (docSnap1.exists()) {
          const docData = docSnap1.data();
          console.log(docData.title)
          const li=`
          <li>
          <section >${docData.title}</section>
          </li>
          `;
         html +=li;
        }
    
    
  // Now we can access the #test element on the other page        
      const historyList=document.getElementById('history');
     // historyList.textContent = docData.title;
      historyList.innerHTML=html;
      }
      
     else {
      console.log("no document");
    }
  }

document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});