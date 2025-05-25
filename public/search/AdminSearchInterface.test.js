import { initializeSearchInterface } from './SearchInterface.js';

// Mock all child components with proper implementations
jest.mock('./SearchBar.js', () => ({
  renderSearchBar: jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    querySelector: jest.fn(() => ({
      addEventListener: jest.fn(),
      value: ''
    })),
    onSearch: jest.fn()
  })
}));

jest.mock('./Filters.js', () => ({
  renderFilters: jest.fn().mockReturnValue({
    querySelector: jest.fn(selector => selector === '#filter-type' ? {
      value: '',
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') cb({ target: { value: 'document' } });
      })
    } : null)
  })
}));

jest.mock('./SortOptions.js', () => ({
  renderSortOptions: jest.fn().mockReturnValue({
    querySelector: jest.fn(() => ({
      value: 'date-desc',
      addEventListener: jest.fn((event, cb) => {
        if (event === 'change') cb({ target: { value: 'date-asc' } });
      })
    }))
  })
}));

jest.mock('./SearchResults.js', () => ({
  renderSearchResults: jest.fn()
}));

describe('SearchInterface', () => {
  let mockContainer;
  let mockResultsSection;
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  beforeEach(() => {
    // Setup DOM elements
    mockResultsSection = {
      innerHTML: '',
      style: {},
      appendChild: jest.fn()
    };

    mockContainer = {
      id: 'test-container',
      appendChild: jest.fn(element => {
        if (element.id === 'search-results') {
          mockResultsSection = element;
        }
        return element;
      }),
      querySelector: jest.fn()
    };

    // Mock document methods
    global.document = {
      getElementById: jest.fn(id => id === 'test-container' ? mockContainer : null),
      createElement: jest.fn(tagName => ({
        tagName,
        id: tagName === 'section' ? 'search-results' : '',
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        innerHTML: '',
        style: {}
      })),
      body: {
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }
    };

    // Mock fetch
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      })
    );

    // Mock localStorage with proper jest mock functions
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('Initialization', () => {
    test('should log error when container not found', () => {
      initializeSearchInterface('non-existent-container');
      expect(console.error).toHaveBeenCalledWith('Missing #non-existent-container');
    });

    test('should create UI structure when container exists', () => {
      // First mock the document.getElementById to be a jest.fn()
      document.getElementById = jest.fn(id => id === 'test-container' ? mockContainer : null);
      
      initializeSearchInterface('test-container');
      expect(document.getElementById).toHaveBeenCalledWith('test-container');
      expect(document.createElement).toHaveBeenCalledWith('section');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    test('should apply dark mode if saved in localStorage', () => {
      localStorage.getItem.mockImplementation(() => JSON.stringify({ themeClass: 'dark-mode' }));
      initializeSearchInterface('test-container');
      expect(document.body.classList.add).toHaveBeenCalledWith('dark-mode');
    });

    test('should initialize with light mode by default', () => {
      localStorage.getItem.mockImplementation(() => null);
      initializeSearchInterface('test-container');
      expect(document.body.classList.add).not.toHaveBeenCalledWith('dark-mode');
    });
  });

  describe('Data Loading', () => {
    test('should fetch documents on initialization', async () => {
      initializeSearchInterface('test-container');
      await Promise.resolve();
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/search?query='));
    });

    test('should handle fetch errors gracefully', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      initializeSearchInterface('test-container');
      await Promise.resolve();
      expect(console.error).toHaveBeenCalled();
      expect(mockResultsSection.innerHTML).toBe('');
    });

    test('should display results after successful fetch', async () => {
      const mockResults = [{ id: 1, title: 'Test Document' }];
      fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: mockResults })
        })
      );
      
      initializeSearchInterface('test-container');
      await Promise.resolve();
      
      const { renderSearchResults } = require('./SearchResults.js');
      expect(renderSearchResults).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'search-results' }),
        mockResults
      );
    });
  });

  describe('Search Functionality', () => {
    test('should trigger search when search bar is used', async () => {
      const mockSearchHandler = jest.fn();
      require('./SearchBar.js').renderSearchBar.mockImplementation((handler) => {
        return {
          onSearch: handler,
          querySelector: jest.fn(),
          addEventListener: jest.fn()
        };
      });

      initializeSearchInterface('test-container');
      const { renderSearchBar } = require('./SearchBar.js');
      const searchBarInstance = renderSearchBar.mock.results[0].value || 
                               renderSearchBar.mock.calls[0][0](mockSearchHandler);
      
      searchBarInstance.onSearch('test query');
      await Promise.resolve();
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('query=test+query'));
    });

    test('should detect document type from query', async () => {
      initializeSearchInterface('test-container');
      const { renderFilters } = require('./Filters.js');
      const filtersInstance = renderFilters.mock.results[0].value || renderFilters();
      const typeFilter = filtersInstance.querySelector('#filter-type');
      
      // Simulate a search that should trigger video type detection
      const { renderSearchBar } = require('./SearchBar.js');
      const searchBarInstance = renderSearchBar.mock.results[0].value || renderSearchBar();
      searchBarInstance.onSearch('find videos about AI');
      await Promise.resolve();
      
      expect(typeFilter.value).toBe('video');
    });
  });

  describe('Filtering', () => {
    test('should apply filters when changed', async () => {
      initializeSearchInterface('test-container');
      const { renderFilters } = require('./Filters.js');
      const filtersInstance = renderFilters.mock.results[0].value || renderFilters();
      const typeFilter = filtersInstance.querySelector('#filter-type');
      
      // Simulate filter change
      typeFilter.addEventListener.mock.calls[0][1]({ target: { value: 'video' } });
      await Promise.resolve();
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('type=video'));
    });
  });

  describe('Sorting', () => {
    test('should apply sort when changed', async () => {
      initializeSearchInterface('test-container');
      const { renderSortOptions } = require('./SortOptions.js');
      const sortOptionsInstance = renderSortOptions.mock.results[0].value || renderSortOptions();
      const sortSelect = sortOptionsInstance.querySelector();
      
      // Simulate sort change
      sortSelect.addEventListener.mock.calls[0][1]({ target: { value: 'date-asc' } });
      await Promise.resolve();
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('sort=date-asc'));
    });
  });
});