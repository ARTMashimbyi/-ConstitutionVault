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
    // Load HTML
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './preview.html'),
      'utf8'
    );

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

    // Mock URLSearchParams with proper implementation
    global.URLSearchParams = jest.fn((query) => ({
      get: jest.fn((param) => {
        const params = new URLSearchParams(query || window.location.search);
        return params.get(param);
      })
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
    test('should show error when no ID is provided', async () => {
      // Override URLSearchParams mock for this test
      window.location.search = '';
      global.URLSearchParams = jest.fn(() => ({
        get: jest.fn().mockReturnValue(null)
      }));

      // Reload module with new mocks
      jest.resetModules();
      require('./preview.js');

      // Need to wait for DOM updates
      await new Promise(resolve => setTimeout(resolve, 0));

      const errorEl = document.querySelector('.error-message');
      expect(errorEl.style.display).toBe('block');
      expect(errorEl.textContent).toContain('No document ID in URL');
    });

    test('should log error when required elements are missing', () => {
      // Remove a required element
      document.querySelector('.title').remove();

      const consoleSpy = jest.spyOn(console, 'error');

      // Reload module
      jest.resetModules();
      require('./preview.js');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("preview.js: missing element for selector '.title'")
      );
    });
  });

  describe('Document Loading', () => {
    test('should fetch documents from API', async () => {
      require('./preview.js');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/files');
    });

    test('should show error when fetch fails', async () => {
      // Mock failed fetch
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      // Reload module
      jest.resetModules();
      require('./preview.js');

      await new Promise(resolve => setTimeout(resolve, 0));

      const errorEl = document.querySelector('.error-message');
      expect(errorEl.style.display).toBe('block');
      expect(errorEl.textContent).toContain('Error: Network error');
    });

    test('should show error when document not found', async () => {
      // Mock fetch with different ID
      window.location.search = '?id=nonexistent';
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      // Reload module
      jest.resetModules();
      require('./preview.js');

      await new Promise(resolve => setTimeout(resolve, 0));

      const errorEl = document.querySelector('.error-message');
      expect(errorEl.style.display).toBe('block');
      expect(errorEl.textContent).toContain('Document not found');
    });
  });

  describe('Document Rendering', () => {
    test('should correctly render document data', async () => {
      require('./preview.js');
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.querySelector('.title').textContent).toBe('Test Document');
      expect(document.querySelector('.author').textContent).toBe('Test Author');
      expect(document.querySelector('.publishDate').textContent).toContain('January');
      expect(document.querySelector('.updated').textContent).toContain('January');
      expect(document.querySelector('.document').textContent).toBe('text');
      expect(document.querySelector('.text-content').textContent).toBe('Sample content');
    });

    test('should handle missing optional fields', async () => {
      // Mock fetch with incomplete data
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'test123',
              title: null,
              author: null,
              date: null,
              uploadedAt: null,
              fileType: null,
              textContent: null
            }
          ]),
        })
      );

      // Reload module
      jest.resetModules();
      require('./preview.js');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.querySelector('.title').textContent).toBe('Untitled');
      expect(document.querySelector('.author').textContent).toBe('Unknown');
      expect(document.querySelector('.publishDate').textContent).toBe('—');
      expect(document.querySelector('.updated').textContent).toBe('—');
      expect(document.querySelector('.document').textContent).toBe('—');
      expect(document.querySelector('.text-section').style.display).toBe('none');
    });
  });

  describe('Button Actions', () => {
    test('should open document when view button clicked', async () => {
      require('./preview.js');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const readBtn = document.querySelector('.btn-read');
      readBtn.click();
      
      expect(window.open).toHaveBeenCalledWith('http://example.com/doc.pdf', '_blank');
    });

    test('should navigate to edit page when edit button clicked', async () => {
      require('./preview.js');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const editBtn = document.querySelector('.btn-edit');
      editBtn.click();
      
      expect(window.location.href).toBe('../edit/edit.html?id=test123');
    });

    test('should navigate to delete page when delete button clicked', async () => {
      require('./preview.js');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const deleteBtn = document.querySelector('.btn-delete');
      deleteBtn.click();
      
      expect(window.location.href).toBe('../delete/deleteConfirm.html?id=test123');
    });

    test('should not wire up buttons when document lacks required data', async () => {
      // Mock fetch with no downloadURL
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'test123',
              title: 'Test',
              downloadURL: null
            }
          ]),
        })
      );

      // Reload module
      jest.resetModules();
      require('./preview.js');

      await new Promise(resolve => setTimeout(resolve, 0));

      const readBtn = document.querySelector('.btn-read');
      readBtn.click();
      
      expect(window.open).not.toHaveBeenCalled();
    });
  });
});