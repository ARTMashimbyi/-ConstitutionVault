// public/common/authUtils.js

/**
 * Check if a user is authenticated and (optionally) is an admin.
 * Redirects to the login page if not authenticated,
 * and to the home page if not authorized.
 *
 * @param {Object} [options]
 * @param {boolean} [options.requireAdmin=false] - If true, checks admin status.
 * @param {string} [options.loginPage] - Path to login page.
 * @param {string} [options.homePage] - Path to home page.
 * @returns {Promise<{uid: string, isAdmin?: boolean}>}
 */
export async function requireAuth(options = {}) {
    const {
      requireAdmin = false,
      loginPage = '/admin sign in/admin_sign_in.html',
      homePage = '/index.html'
    } = options;
  
    const idToken = localStorage.getItem('firebase_id_token');
    if (!idToken) {
      alert('Please login to access this page.');
      window.location.href = loginPage;
      throw new Error('Not authenticated');
    }
  
    if (!requireAdmin) {
      // Just need authentication
      return { uid: null }; // Or parse token if you want UID
    }
  
    // If admin required, check with backend
    try {
      const res = await fetch('http://localhost:4000/api/auth/admin-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (!data.isAdmin) {
        alert('Access denied: Admins only.');
        window.location.href = homePage;
        throw new Error('Not authorized');
      }
      return { uid: data.uid, isAdmin: true };
    } catch (err) {
      alert('Error checking admin status. Please log in again.');
      window.location.href = loginPage;
      throw err;
    }
  }
  