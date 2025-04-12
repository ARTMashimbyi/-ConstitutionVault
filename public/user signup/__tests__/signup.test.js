// __tests__/signup.test.js
/**
 * @jest-environment jsdom
 */

describe("Signup Page", () => {
    beforeEach(() => {
      document.body.innerHTML = `<button id="google-signup">Sign up with Google</button>`;
      // Mock window.location.href
      delete window.location;
      window.location = { href: "" };
  
      // Load the script
      require('../signup.js');
    });
  
    it("redirects to Google OAuth when button is clicked", () => {
      const btn = document.getElementById("google-signup");
      btn.click();
  
      expect(window.location.href).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      expect(window.location.href).toContain("client_id=271321648137");
      expect(window.location.href).toContain("redirect_uri=http://localhost:3000/oauth-callback.html");

      expect(window.location.href).toContain("response_type=code");
      expect(window.location.href).toContain("scope=openid%20email%20profile");
    });
  });
  