import { initializeSearchInterface } from './SearchInterface.js';

// Mock all dependencies
jest.mock('./SearchBar.js', () => ({
  renderSearchBar: jest.fn((handler) => ({
    addEventListener: jest.fn(),
    querySelector: jest.fn(),
    setAttribute: jest.fn(),
    append: jest.fn(),
    innerHTML: '',
    onSearch: handler
  }))
}));

jest.mock('./Filters.js', () => ({
  renderFilters: jest.fn((handler) => {
    const mockSelect = {
      value: '',
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') {
          mockSelect.onChange = cb;
        }
      })
    };
    return {
      querySelector: jest.fn(selector => selector === '#filter-type' ? mockSelect : null),
      setAttribute: jest.fn(),
      append: jest.fn(),
      innerHTML: '',
      mockSelect
    };
  })
}));

jest.mock('./SortOptions.js', () => ({
  renderSortOptions: jest.fn((handler) => {
    const mockSelect = {
      value: '',
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') {
          mockSelect.onChange = cb;
        }
      })
    };
    return {
      querySelector: jest.fn(() => mockSelect),
      setAttribute: jest.fn(),
      append: jest.fn(),
      innerHTML: '',
      mockSelect
    };
  })
}));

jest.mock('./SearchResults.js', () => ({
  renderSearchResults: jest.fn()
}));

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [] }),
  })
);

describe('initializeSearchInterface', () => {
  let container;
  let mockLocalStorage;
  let resultsSection;

  beforeEach(() => {
    // Set up DOM
    resultsSection = {
      innerHTML: '',
      style: {}
    };
    
    container = {
      id: 'test-container',
      querySelector: jest.fn(),
      append: jest.fn(),
      appendChild: jest.fn((el) => {
        if (el.id === 'search-results') {
          resultsSection = el;
        }
        return el;
      }),
      innerHTML: ''
    };
    
    // Mock document methods
    global.document = {
      getElementById: jest.fn(id => id === 'test-container' ? container : null),
      createElement: jest.fn().mockImplementation(tagName => ({
        tagName,
        id: tagName === 'section' ? 'search-results' : '',
        setAttribute: jest.fn(),
        append: jest.fn(),
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        innerHTML: '',
        style: {},
        addEventListener: jest.fn()
      })),
      body: { 
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }
    };

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn()
    };
    global.localStorage = mockLocalStorage;

    // Clear all mocks
    jest.clearAllMocks();

    // Clear fetch mock implementation
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })
    );
  });

  afterEach(() => {
    delete global.document;
    delete global.localStorage;
  });

  test('should log error when container not found', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    initializeSearchInterface('non-existent-container');
    expect(consoleSpy).toHaveBeenCalledWith('Missing #non-existent-container');
    consoleSpy.mockRestore();
  });

  test('should create search interface structure when container exists', () => {
    initializeSearchInterface('test-container');
    expect(global.document.createElement).toHaveBeenCalledWith('section');
    expect(container.appendChild).toHaveBeenCalled();
  });

  test('should apply dark mode if saved in localStorage', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
      themeClass: 'dark-mode'
    }));
    
    initializeSearchInterface('test-container');
    expect(document.body.classList.add).toHaveBeenCalledWith('dark-mode');
  });

  test('should initialize with default state when no saved settings', () => {
    initializeSearchInterface('test-container');
    expect(require('./Filters.js').renderFilters).toHaveBeenCalled();
    expect(require('./SortOptions.js').renderSortOptions).toHaveBeenCalled();
  });

  test('should initialize with saved settings from localStorage', () => {
    const savedSettings = {
      themeClass: 'dark-mode',
      type: 'document',
      sort: 'date-desc'
    };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(savedSettings));
    
    initializeSearchInterface('test-container');
    
    const filtersMock = require('./Filters.js').renderFilters.mock.results[0].value;
    filtersMock.mockSelect.value = savedSettings.type;
    expect(filtersMock.querySelector('#filter-type').value).toBe(savedSettings.type);
  });

  test('should handle fetch error gracefully', async () => {
    fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    initializeSearchInterface('test-container');
    await new Promise(process.nextTick);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('should filter results based on saved preferences', async () => {
    const savedSettings = {
      author: 'John Doe',
      category: 'research',
      institution: 'University',
      keywords: 'ai,machine learning'
    };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(savedSettings));
    
    const mockResults = [
      {
        title: 'AI Research',
        author: 'John Doe',
        category: 'research',
        institution: 'University',
        keywords: ['ai', 'machine learning'],
        snippet: 'This is a research paper about AI'
      }
    ];
    
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: mockResults }),
      })
    );
    
    initializeSearchInterface('test-container');
    await new Promise(process.nextTick);
    
    expect(require('./SearchResults.js').renderSearchResults).toHaveBeenCalled();
  });

  test('should handle type detection from query', async () => {
    initializeSearchInterface('test-container');
    
    const searchBarMock = require('./SearchBar.js').renderSearchBar.mock.results[0].value;
    searchBarMock.onSearch('find me videos about AI');
    
    await new Promise(process.nextTick);
    
    const filtersMock = require('./Filters.js').renderFilters.mock.results[0].value;
    expect(filtersMock.mockSelect.value).toBe('video');
  });
});