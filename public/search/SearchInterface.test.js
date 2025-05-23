import { initializeSearchInterface } from './SearchInterface.js';
import { renderSearchResults } from './SearchResults.js';

// Mock dependencies
jest.mock('./SearchResults.js', () => ({
  renderSearchResults: jest.fn()
}));

jest.mock('./SearchBar.js', () => ({
  renderSearchBar: jest.fn(() => ({
    tagName: 'div',
    setAttribute: jest.fn(),
    append: jest.fn(),
    innerHTML: ''
  }))
}));

describe('initializeSearchInterface', () => {
  let container;
  let mockFetch;

  beforeEach(() => {
    // Set up DOM
    container = {
      id: 'test-container',
      querySelector: jest.fn(),
      append: jest.fn(),
      innerHTML: ''
    };
    
    // Mock document methods
    global.document = {
      getElementById: jest.fn(id => id === 'test-container' ? container : null),
      createElement: jest.fn().mockImplementation(tagName => ({
        tagName,
        setAttribute: jest.fn(),
        append: jest.fn(),
        innerHTML: ''
      })),
      body: { appendChild: jest.fn(), removeChild: jest.fn() }
    };

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.document;
  });

  test('should log error when container not found', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    initializeSearchInterface('non-existent-container');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Search container "non-existent-container" not found.'
    );
  });

  test('should create search interface structure', () => {
    initializeSearchInterface('test-container');
    expect(global.document.createElement).toHaveBeenCalledWith('section');
    expect(container.append).toHaveBeenCalled();
  });

  test('should render search bar with handler', () => {
    initializeSearchInterface('test-container');
    expect(require('./SearchBar.js').renderSearchBar).toHaveBeenCalled();
  });

  test('should fetch documents on initialization', () => {
    initializeSearchInterface('test-container');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/api/files');
  });

  test('should render all documents when empty query', async () => {
    const mockDocs = [
      { title: 'Doc 1', downloadURL: '/doc1.pdf', fileType: 'document' },
      { title: 'Doc 2', downloadURL: '/doc2.pdf', fileType: 'document' }
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocs)
    });

    initializeSearchInterface('test-container');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(renderSearchResults).toHaveBeenCalled();
    const [resultsContainer, results] = renderSearchResults.mock.calls[0];
    expect(results.length).toBe(2);
    expect(results[0].title).toBe('Doc 1');
    expect(results[1].title).toBe('Doc 2');
  });
});