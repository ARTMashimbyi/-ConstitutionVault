export const initializeApp = jest.fn(() => ({}));
export const getFirestore = jest.fn(() => ({}));
export const doc = jest.fn((db, col, id) => ({ db, col, id }));
export const collection = jest.fn();
export const getDoc = jest.fn();
export const deleteDoc = jest.fn(() => Promise.resolve());