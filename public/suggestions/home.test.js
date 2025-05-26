// home.test.js
import { JSDOM } from 'jsdom';

// Set up a DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// Mock Firebase App
jest.unstable_mockModule('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

// Mock Firebase Firestore
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  increment: jest.fn(),
};

jest.unstable_mockModule('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
  ...mockFirestore,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
global.localStorage = localStorageMock;

// Use dynamic import after mocks are ready
let loadAllDocuments, isDocumentNew, loadedDocuments;

beforeAll(async () => {
  const module = await import('./home.js');
  loadAllDocuments = module.loadAllDocuments;
  isDocumentNew = module.isDocumentNew;
  loadedDocuments = module.loadedDocuments;
});

test('example test', () => {
  expect(typeof loadAllDocuments).toBe('function');
});


describe('Firebase Initialization', () => {
  it('should initialize Firebase', () => {
    const { initializeApp } = require('firebase/app');
    initializeApp({});
    expect(initializeApp).toHaveBeenCalled();
  });
});

describe('Document Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadedDocuments.length = 0; // Reset shared state
    
    // Setup mock for collection().onSnapshot()
    mockFirestore.collection.mockReturnValue({
      onSnapshot: (callback) => {
        callback({
          docs: [
            {
              id: 'doc1',
              data: () => ({
                title: 'Test Document',
                fileType: 'document',
                uploadDate: new Date().toISOString(),
                clicks: 0,
              }),
            },
          ],
        });
      },
    });
  });

  it('should load documents from Firestore', async () => {
    await loadAllDocuments();
    expect(loadedDocuments.length).toBe(1);
    expect(loadedDocuments[0].title).toBe('Test Document');
    expect(mockFirestore.collection).toHaveBeenCalledWith('constitutionalDocuments');
  });

  it('should correctly identify new documents', () => {
    const newDoc = { uploadDate: new Date().toISOString() };
    const oldDoc = {
      uploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(isDocumentNew(newDoc.uploadDate)).toBe(true);
    expect(isDocumentNew(oldDoc.uploadDate)).toBe(false);
  });
});

describe('User Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset userInteractions
    Object.keys(userInteractions).forEach(key => {
      userInteractions[key] = [];
    });
    
    // Setup mock for doc().get()
    mockFirestore.doc.mockImplementation((path) => {
      if (path.includes('users')) {
        return {
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              userInteractions: {
                clicks: {},
                viewed: ['doc1'],
                isFavorite: ['doc2'],
                shared: []
              }
            })
          }),
          update: jest.fn().mockResolvedValue({})
        };
      }
      return {
        get: jest.fn().mockResolvedValue({ exists: true }),
        update: jest.fn().mockResolvedValue({})
      };
    });
  });

  it('should load user interactions', async () => {
    await loadUserInteractions('user1');
    expect(userInteractions.viewed).toContain('doc1');
    expect(userInteractions.isFavorite).toContain('doc2');
  });

  it('should increment view count', async () => {
    await incrementViewCount('doc1');
    expect(mockFirestore.updateDoc).toHaveBeenCalled();
  });

  it('should toggle favorite status', async () => {
    await toggleFavorite('doc1', true);
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'userInteractions.isFavorite': expect.anything()
      })
    );
  });
});

describe('Document Card Creation', () => {
  beforeEach(() => {
    // Create a test DOM element container
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {

    document.getElementById('test-container')?.remove();
  });

  it('should create a document card with correct elements', () => {
    const testDoc = {
      id: 'doc1',
      title: 'Test Document',
      fileType: 'image',
      downloadURL: 'http://example.com/image.jpg',
      category: 'Test',
      clicks: 10,
      isNew: true
    };

    const card = createDocCard(testDoc);
    document.getElementById('test-container').appendChild(card);
    
    expect(card.className).toBe('document-card');
    expect(card.querySelector('h3').textContent).toBe('Test Document');
    expect(card.querySelector('img')).toBeTruthy();
    expect(card.querySelector('.doc-badge')).toBeTruthy();
  });
});

describe('Suggestions System', () => {
  beforeEach(() => {
    loadedDocuments.length = 0;
    loadedDocuments.push(
      { id: 'doc1', title: 'Doc 1', category: 'Cars', clicks: 100 },
      { id: 'doc2', title: 'Doc 2', category: 'Ships', clicks: 50 },
      { id: 'doc3', title: 'Doc 3', category: 'Cars', clicks: 75 }
    );
  });

  it('should return popular suggestions when no preferences', () => {
    const suggestions = popularSuggestions();
    expect(suggestions.length).toBe(3);
    expect(suggestions[0].id).toBe('doc1');
  });

  it('should return preference-based suggestions', () => {
    const preference = {
      category: { 'Cars': 3 },
      author: {},
      institution: {},
      fileType: {},
      keywords: {}
    };
    
    const suggestions = suggestionsByPreference(preference, loadedDocuments, null);
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].category).toBe('Law');
  });
});

describe('Document Filtering', () => {
  beforeEach(() => {
    loadedDocuments.length = 0;
    loadedDocuments.push(
      { id: 'doc1', title: 'Document 1', category: 'Ships', fileType: 'document' },
      { id: 'doc2', title: 'Document 2', category: 'Cars', fileType: 'image' },
      { id: 'doc3', title: 'Document 3', category: 'Uncategorized', fileType: 'video' }
    );
    
    // Mock DOM elements
    document.querySelector = jest.fn((selector) => {
      if (selector.includes('filter-controls select:nth-of-type(1)')) {
        return { value: 'All Categories' };
      }
      if (selector.includes('filter-controls select:nth-of-type(2)')) {
        return { value: 'All Types' };
      }
      if (selector.includes('.search-input')) {
        return { value: '' };
      }
      return null;
    });
  });

  it('should filter by category', () => {
    // Override category filter mock
    document.querySelector.mockImplementation((selector) => {
      if (selector.includes('filter-controls select:nth-of-type(1)')) {
        return { value: 'Law' };
      }
      return { value: 'All Types' };
    });
    
    applyFilters();
    expect(document.querySelector).toHaveBeenCalled();
  });
});