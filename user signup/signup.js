const googleBtn = document.getElementById("google-signup");

googleBtn?.addEventListener("click", () => {
  const clientId = "271321648137-0atssob6ov56ctba0nuff6eocmgm2mdm.apps.googleusercontent.com"; // got this from OAuth
  const redirectUri = "http://localhost:3000/user%20signup/oauth-callback.html"; 
  const scope = "openid email profile";
  const responseType = "code"; 

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;

  window.location.href = authUrl;
});
