/**
 * @jest-environment jsdom
 */
require('@testing-library/jest-dom');
const { fireEvent } = require('@testing-library/dom');


// We'll mock the Auth0 client & Firebase Firestore
jest.mock('https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js', () => ({
  initializeApp: jest.fn()
}));
jest.mock('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true })),
  addDoc: jest.fn()
}));

// Mock Auth0
global.createAuth0Client = jest.fn(() =>
  Promise.resolve({
    loginWithPopup: jest.fn(),
    getIdTokenClaims: jest.fn(() =>
      Promise.resolve({
        __raw: 'mocked_id_token',
        sub: 'mocked_uid'
      })
    )
  })
);

beforeEach(() => {
  fetch.resetMocks();
  document.body.innerHTML = `<button id="google-signup">Sign Up</button>`;
  jest.resetModules();
});

test('clicking signup sends token to backend and adds user to Firestore', async () => {
  fetch.mockResponseOnce(JSON.stringify({ message: 'Signup successful' }));

  // Load the script
  await import('../signup.js');

  const button = document.getElementById('google-signup');
  fireEvent.click(button);

  // Wait a tick to allow async stuff to run
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:3000/api/signup',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ id_token: 'mocked_id_token' })
    })
  );
});
