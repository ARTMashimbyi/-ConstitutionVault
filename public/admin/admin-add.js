import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
       import { 
         getFirestore, 
         collection, 
         addDoc, 
         getDocs, 
         query, 
         where
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

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      const uploadForm = document.getElementById("uploadForm");
      const uploadStatus = document.getElementById("uploadStatus");
      const directoryInput = document.getElementById("directory");
      const dateInput = document.getElementById("date");

      // Set current date in the date field
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      dateInput.value = formattedDate;

      // Check if directory parameter exists in URL and fill it
      document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const directoryParam = urlParams.get('directory');
        
        if (directoryParam && directoryInput) {
          directoryInput.value = directoryParam;
        }
      });

      uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);
        
        // Ensure directory exists or create it
        const directoryPath = formData.get("directory");
        try {
          // Check if this directory already exists
          let directoryExists = false;
          const directoriesSnapshot = await getDocs(
            query(collection(db, "directories"), where("path", "==", directoryPath))
          );
          
          directoryExists = !directoriesSnapshot.empty;
          
          // If directory doesn't exist, create it
          if (!directoryExists && directoryPath !== "/") {
            // Split path into segments
            const pathSegments = directoryPath.split('/').filter(segment => segment !== '');
            let currentPath = "";
            
            // Ensure each segment exists as a directory
            for (let i = 0; i < pathSegments.length; i++) {
              const segment = pathSegments[i];
              currentPath += `/${segment}`;
              
              // Check if this segment exists
              const segmentQuery = await getDocs(
                query(collection(db, "directories"), where("path", "==", currentPath))
              );
              
              if (segmentQuery.empty) {
                // Create this directory segment
                await addDoc(collection(db, "directories"), {
                  name: segment,
                  path: currentPath,
                  description: "",
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
          
          // Now that we've ensured the directory exists, save the document
          const metadata = {
            fileType: formData.get("fileType"),
            title: formData.get("title"),
            date: formData.get("date"),
            institution: formData.get("institution"),
            author: formData.get("author"),
            category: formData.get("category"),
            keywords: formData.get("keywords") ? formData.get("keywords").split(",").map(kw => kw.trim()) : [],
            directory: formData.get("directory"),
            uploadedAt: new Date().toISOString()
          };

          await addDoc(collection(db, "constitutionalDocuments"), metadata);
          uploadStatus.style.display = "block";
          uploadStatus.textContent = "Document uploaded successfully! Redirecting...";
          
          // Redirect to hierarchy.html after successful upload (with a slight delay)
          setTimeout(() => {
            window.location.href = "hierarcy.html";
          }, 1500);
          
        } catch (error) {
          console.error("Upload failed:", error);
          uploadStatus.style.display = "block";
          uploadStatus.style.color = "red";
          uploadStatus.textContent = "Upload failed. Please try again.";
        }
      });