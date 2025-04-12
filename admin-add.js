document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const statusElem = document.getElementById('uploadStatus');
  const fileInput = document.getElementById('document');

  // Maximum file size in bytes (100 MB)
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  // Utility function to show a notification message for a specified duration (default: 5000ms)
  function showNotification(message, duration = 5000) {
    statusElem.innerText = message;
    statusElem.style.display = "block";
    setTimeout(() => {
      statusElem.style.display = "none";
    }, duration);
  }

  // Optional: Verify file size when a file is selected.
  fileInput.addEventListener('change', function () {
    const file = fileInput.files[0];
    if (file && file.size > MAX_FILE_SIZE) {
      showNotification("Error: The selected file exceeds 100 MB. Please choose a smaller file.", 7000);
      // Clear the file input so that the file won't be submitted.
      fileInput.value = "";
    }
  });

  uploadForm.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the default form submission

    // Before submitting, double-check that the file is within allowed limits.
    const file = fileInput.files[0];
    if (!file) {
      showNotification("Error: Please select a file to upload.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showNotification("Error: The selected file exceeds 100 MB. Please choose a smaller file.");
      return;
    }

    // Create FormData from the form; all input fields, including the new "fileType" dropdown, are captured automatically.
    const formData = new FormData(uploadForm);

    // Immediately show "Uploading..." message.
    statusElem.style.display = "block";
    statusElem.innerText = "Uploading...";

    try {
      // Wait 2 seconds so that "Uploading..." is visible.
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send the form data via fetch to your backend endpoint.
      const response = await fetch(uploadForm.action, {
        method: uploadForm.method,
        body: formData
      });
      const result = await response.json();

      if (response.ok) {
        // Display the final success message for 5 seconds.
        showNotification(result.message, 5000);
        // Optionally reset the form upon successful upload.
        uploadForm.reset();
      } else {
        showNotification(result.error || "Upload failed.", 5000);
      }
    } catch (error) {
      showNotification("Error: " + error.message, 5000);
    }
  });
});
