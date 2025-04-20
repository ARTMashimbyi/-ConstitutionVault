// __tests__/oauth-callback.test.js
/**
 * @jest-environment jsdom
 */

describe("OAuth Callback Page", () => {
    function runInlineOAuthScript(search) {
      // Simulate URL with search params
      delete window.location;
      window.location = { search };
  
      document.body.innerHTML = `<h2>Logging you in...</h2>`;
  
      // Inline script simulation
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
  
      if (code) {
        document.body.innerHTML += `<p>Code: ${code}</p>`;
      } else {
        document.body.innerHTML += "<p>Something went wrong. No code found.</p>";
      }
    }
  
    it("displays the code when present", () => {
      runInlineOAuthScript("?code=test123");
      expect(document.body.innerHTML).toContain("Code: test123");
    });
  
    it("displays an error if no code found", () => {
      runInlineOAuthScript("");
      expect(document.body.innerHTML).toContain("Something went wrong");
    });
  });
  