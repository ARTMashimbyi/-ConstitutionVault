import '@testing-library/jest-dom';
import { deleteItem } from './delete.js';
import { deleteDoc, doc } from 'firebase/firestore';

// Mock DOM elements
document.querySelector = jest.fn(selector => ({
  textContent: '',
  style: { display: 'none' }
}));

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(() => 'test-delete-id'),
  removeItem: jest.fn()
};

// Mock timers and window.location
jest.useFakeTimers();
delete window.location;
window.location = { href: '' };

describe('delete.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue('test-delete-id');
  });

  test('deleteItem shows loading state', async () => {
    await deleteItem();
    expect(document.querySelector('.spinner').style.display).toBe('block');
    expect(document.querySelector('.status-message').textContent).toBe('Deleting document...');
  });

  test('successful deletion flow', async () => {
    await deleteItem();
    
    expect(deleteDoc).toHaveBeenCalled();
    expect(document.querySelector('.success-icon').style.display).toBe('block');
    expect(localStorage.removeItem).toHaveBeenCalledWith('deleteId');
    
    jest.advanceTimersByTime(1200);
    expect(window.location.href).toBe('../admin/hierarcy.html');
  });

  test('handles missing document ID', async () => {
    localStorage.getItem.mockReturnValue(null);
    await deleteItem();
    
    expect(document.querySelector('.error-icon').style.display).toBe('block');
    expect(document.querySelector('.status-message').textContent).toContain('No document ID provided');
  });

  test('handles deletion errors', async () => {
    deleteDoc.mockRejectedValue(new Error('Firebase error'));
    await deleteItem();
    
    expect(document.querySelector('.error-icon').style.display).toBe('block');
    expect(document.querySelector('.back-btn').style.display).toBe('block');
  });
});