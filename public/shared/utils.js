// public/shared/utils.js

// Determine API root based on hostname
const hostname = window.location.hostname;
export const API_BASE =
  hostname === "localhost" || hostname.startsWith("127.0.0.1")
    ? "http://localhost:4000/api"
    : "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net";

// Helper: centralize JSON fetch + error handling
async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * Fetch the latest interactions for a given user.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getUserInteractions(userId) {
  const data = await fetchJson(`/users/${encodeURIComponent(userId)}`);
  return data.userInteractions || { clicks: {}, viewed: [], isFavorite: [], shared: [] };
}

/**
 * Toggle a document as favorite/unfavorite for a user.
 * @param {string} userId
 * @param {string} docId
 * @param {boolean} makeFav
 * @returns {Promise<Object>}
 */
export async function toggleFavorite(userId, docId, makeFav) {
  const payload = { docId, favorite: makeFav };
  const data = await fetchJson(
    `/users/${encodeURIComponent(userId)}/favorite`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return data.userInteractions;
}

/**
 * Record a “view” both on the file and on the user’s history.
 * @param {string} userId
 * @param {string} docId
 * @returns {Promise<Object>}
 */
export async function recordView(userId, docId) {
  // 1) bump the file’s view counter
  await fetchJson(`/files/${encodeURIComponent(docId)}/view`, { method: "PATCH" });
  // 2) record it on the user
  const data = await fetchJson(
    `/users/${encodeURIComponent(userId)}/view`,
    {
      method: "PATCH",
      body: JSON.stringify({ docId }),
    }
  );
  return data.userInteractions;
}

/**
 * Record a “share” both on the file and on the user’s profile.
 * @param {string} userId
 * @param {string} docId
 * @returns {Promise<Object>}
 */
export async function recordShare(userId, docId) {
  // 1) bump the file’s share counter
  await fetchJson(`/files/${encodeURIComponent(docId)}/share`, { method: "PATCH" });
  // 2) record it on the user
  const data = await fetchJson(
    `/users/${encodeURIComponent(userId)}/share`,
    {
      method: "PATCH",
      body: JSON.stringify({ docId }),
    }
  );
  return data.userInteractions;
}
