// signup.js
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

  } catch (err) {
    console.error('Signup failed:', err);
    alert('Signup failed. Check the console.');
  }
});
