const fs = require('fs');
const path = require('path');

describe('Preview Page', () => {
  let originalFetch;
  let originalLocation;
  let originalURLSearchParams;
  let originalOpen;

  beforeAll(() => {
    // Store original globals
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalURLSearchParams = global.URLSearchParams;
    originalOpen = window.open;
  });

  beforeEach(() => {
    // Load HTML with proper structure
    document.body.innerHTML = `
      <div class="title">Title</div>
      <div class="author">Author</div>
      <div class="publishDate">Date</div>
      <div class="updated">Updated</div>
      <div class="document">Type</div>
      <div class="text-content">Content</div>
      <div class="error-message" style="display:none;"></div>
      <button class="btn-read">Read</button>
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Delete</button>
    `;

    // Mock fetch with default implementation
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 'test123',
            title: 'Test Document',
            author: 'Test Author',
            date: '2025-01-01T00:00:00Z',
            uploadedAt: '2025-01-02T00:00:00Z',
            fileType: 'text',
            textContent: 'Sample content',
            downloadURL: 'http://example.com/doc.pdf'
          }
        ]),
      })
    );

    // Mock location with full implementation
    delete window.location;
    window.location = {
      href: '',
      search: '?id=test123',
      replace: jest.fn(),
    };

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn(() => ({
      get: jest.fn().mockReturnValue('test123')
    }));

    // Mock window.open
    window.open = jest.fn();

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original globals
    global.fetch = originalFetch;
    window.location = originalLocation;
    global.URLSearchParams = originalURLSearchParams;
    window.open = originalOpen;
  });

  describe('Initialization', () => {
    test('should log error when required elements are missing', () => {
      // Remove a required element
      document.querySelector('.title').remove();

      const consoleSpy = jest.spyOn(console, 'error');

      // Reload module
      jest.resetModules();
      const previewModule = require('./preview.js');
      
      // Trigger DOMContentLoaded manually
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("preview.js: missing element for selector '.title'")
      );
    });
  });

  describe('Document Loading', () => {
    test('should fetch documents from API', async () => {
      // Reload module
      jest.resetModules();
      const previewModule = require('./preview.js');
      
      // Trigger DOMContentLoaded manually
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/files');
    });
  });

  describe('Document Rendering', () => {
    test('should correctly render document data', async () => {
      // Reload module
      jest.resetModules();
      const previewModule = require('./preview.js');
      
      // Trigger DOMContentLoaded manually
      document.dispatchEvent(new Event('DOMContentLoaded'));

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.querySelector('.title').textContent).toBe('Test Document');
      expect(document.querySelector('.author').textContent).toBe('Test Author');
      expect(document.querySelector('.publishDate').textContent).toContain('January');
      expect(document.querySelector('.updated').textContent).toContain('January');
      expect(document.querySelector('.document').textContent).toBe('text');
      expect(document.querySelector('.text-content').textContent).toBe('Sample content');
    });
  });
});