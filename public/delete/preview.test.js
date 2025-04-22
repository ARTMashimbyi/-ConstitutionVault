import '@testing-library/jest-dom';
import { loadDocument, displayDocument, setupButtonActions } from './preview.js';
import { getDoc, doc } from 'firebase/firestore';

// Mock DOM elements
document.querySelector = jest.fn(selector => ({
  textContent: '',
  style: { display: '' },
  addEventListener: jest.fn()
}));

// Mock URLSearchParams
const mockUrlParams = new Map([['id', 'test-doc-id']]);
window.URLSearchParams = jest.fn(() => mockUrlParams);

// Mock localStorage
global.localStorage = {
  setItem: jest.fn(),
  getItem: jest.fn()
};

describe('preview.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDoc.mockResolvedValue({ 
      exists: true, 
      data: () => ({ 
        title: 'Test Doc',
        author: 'Test Author',
        date: '2023-01-01',
        content: 'Test content'
      }) 
    });
  });

  test('loadDocument fetches and displays document', async () => {
    await loadDocument();
    
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'constitutionalDocuments', 'test-doc-id');
    expect(document.querySelector('.title').textContent).toBe('Test Doc');
  });

  test('displayDocument renders data correctly', () => {
    const docData = {
      title: 'Constitution',
      author: 'Founders',
      date: '2023-01-01',
      content: 'We the People...'
    };
    
    displayDocument(docData);
    expect(document.querySelector('.title').textContent).toBe('Constitution');
    expect(document.querySelector('.author').textContent).toBe('Founders');
  });

  test('setupButtonActions configures delete button', () => {
    const mockDocData = { title: 'Test' };
    setupButtonActions('test-id', mockDocData);
    
    const clickEvent = new Event('click');
    document.querySelector('.btn-delete').addEventListener.mock.calls[0][1](clickEvent);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('deleteId', 'test-id');
  });

  test('handles document not found error', async () => {
    getDoc.mockResolvedValue({ exists: false });
    await loadDocument();
    expect(document.querySelector('.error-message').textContent).toContain('Document not found');
  });
});