// public/shared/utils.js

// Base URL for your API
export const API_BASE = window.location.hostname.includes("azurewebsites.net")
  ? "https://constitutionvaultapi-acatgth5g9ekg5fv.southafricanorth-01.azurewebsites.net/api"
  : "http://localhost:4000/api";

/**
 * Fetch the latest interactions for a given user.
 * @param {string} userId
 */
export async function getUserInteractions(userId) {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`Failed to load interactions: ${res.statusText}`);
  const data = await res.json();
  return data.userInteractions || { clicks: {}, viewed: [], isFavorite: [], shared: [] };
}

/**
 * Toggle a document as favorite/unfavorite for a user.
 * @param {string} userId
 * @param {string} docId
 * @param {boolean} makeFav
 */
export async function toggleFavorite(userId, docId, makeFav) {
  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(userId)}/favorite`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, favorite: makeFav })
    }
  );
  if (!res.ok) throw new Error(`Favorite update failed: ${res.statusText}`);
  const { userInteractions } = await res.json();
  return userInteractions;
}

/**
 * Record a “view” both on the file and on the user’s history.
 * @param {string} userId
 * @param {string} docId
 */
export async function recordView(userId, docId) {
  // 1) bump the file’s click counter
  let res = await fetch(
    `${API_BASE}/files/${encodeURIComponent(docId)}/view`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error(`File view update failed: ${res.statusText}`);

  // 2) record the view in the user profile
  res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(userId)}/view`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId })
    }
  );
  if (!res.ok) throw new Error(`User view update failed: ${res.statusText}`);

  const { userInteractions } = await res.json();
  return userInteractions;
}

/**
 * Record a “share” both on the file and on the user’s profile.
 * @param {string} userId
 * @param {string} docId
 */
export async function recordShare(userId, docId) {
  // 1) bump the file’s share counter
  let res = await fetch(
    `${API_BASE}/files/${encodeURIComponent(docId)}/share`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error(`File share update failed: ${res.statusText}`);

  // 2) record the share in the user profile
  res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(userId)}/share`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId })
    }
  );
  if (!res.ok) throw new Error(`User share update failed: ${res.statusText}`);

  const { userInteractions } = await res.json();
  return userInteractions;
}
