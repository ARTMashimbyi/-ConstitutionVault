const googleBtn = document.getElementById("google-signup");

googleBtn?.addEventListener("click", () => {
  const clientId = "271321648137-cuohkf3httmdgvgv256jm5hlkbj1kenu.apps.googleusercontent.com"; // Your OAuth client ID
  const redirectUri = "http://localhost:3000/oauth-callback.html"; // Change to your frontend domain
  const scope = "openid email profile"; // Define the permissions you need
  const responseType = "code"; // The response type for OAuth2 flow

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  // Redirect to Google sign-in screen
  window.location.href = authUrl;
});

