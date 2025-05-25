const fs = require('fs');
require('./edit.js');

/**
 * Jest test for edit.js DOM behavior and API interaction
 */
describe('Edit Page', () => {
  let originalFetch;
  let originalLocation;
  let originalURLSearchParams;

  beforeAll(() => {
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalURLSearchParams = global.URLSearchParams;
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="editDocForm">
        <input id="docTitle" />
        <input id="docInstitution" />
        <input id="docAuthor" />
        <input id="docCategory" />
        <input id="docKeywords" />
        <input id="docDate" />
        <div id="message"></div>
        <button id="cancelButton">Cancel</button>
      </form>
    `;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 'doc123',
            title: 'Existing Title',
            institution: 'Test Institution',
            author: 'Test Author',
            category: 'Test Category',
            keywords: ['alpha', 'beta'],
            date: '2025-01-01T00:00:00Z'
          }
        ])
      })
    );

    delete window.location;
    window.location = {
      search: '?id=doc123',
      href: '',
    };

    global.URLSearchParams = jest.fn(() => ({
      get: jest.fn().mockReturnValue('doc123')
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
    global.URLSearchParams = originalURLSearchParams;
  });

  describe('Data Loading', () => {
    test('should populate form with document data', async () => {
      jest.resetModules();
      require('./edit.js');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(r => setTimeout(r, 0));

      expect(document.getElementById('docTitle').value).toBe('Existing Title');
      expect(document.getElementById('docInstitution').value).toBe('Test Institution');
      expect(document.getElementById('docAuthor').value).toBe('Test Author');
      expect(document.getElementById('docCategory').value).toBe('Test Category');
      expect(document.getElementById('docKeywords').value).toBe('alpha, beta');
      expect(document.getElementById('docDate').value).toBe('2025-01-01');
    });
  });

  describe('Form Submission', () => {
    test('should submit updated document data via PATCH', async () => {
      const mockPatch = jest.fn(() => Promise.resolve({ ok: true }));
      global.fetch = jest.fn((url, options) => {
        if (options?.method === 'PATCH') {
          return mockPatch();
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'doc123',
              title: 'Old Title',
              keywords: []
            }
          ])
        });
      });

      jest.resetModules();
      require('./edit.js');

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(r => setTimeout(r, 0));

      document.getElementById('docTitle').value = 'Updated Title';
      document.getElementById('docKeywords').value = 'new, tags';

      document.getElementById('editDocForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 10));

      expect(mockPatch).toHaveBeenCalled();

      // Find PATCH call dynamically
      const patchCall = global.fetch.mock.calls.find(
        ([, options]) => options?.method === 'PATCH'
      );

      expect(patchCall).toBeDefined();

      const patchOptions = patchCall[1];
      const patchBody = JSON.parse(patchOptions.body);

      expect(patchBody.title).toBe('Updated Title');
      expect(patchBody.keywords).toEqual(['new', 'tags']);
    });
  });
});
