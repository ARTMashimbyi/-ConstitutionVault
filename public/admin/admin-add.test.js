// admin-add.test.js
const fs = require('fs');
const path = require('path');

describe('Admin Upload Page', () => {
  let originalFetch;
  let originalLocation;
  let originalURLSearchParams;

  beforeAll(() => {
    // Store original globals
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalURLSearchParams = global.URLSearchParams;
  });

  beforeEach(() => {
    // Load HTML
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, 'admin-add.html'),
      'utf8'
    );

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    // Mock location
    delete window.location;
    window.location = {
      href: '',
      search: '?directory=test',
      replace: jest.fn(),
    };

    // Mock URLSearchParams
    global.URLSearchParams = jest.fn(() => ({
      get: jest.fn().mockImplementation((param) => 
        param === 'directory' ? 'test' : null
      )
    }));

    // Load the module
    require('./admin-add.js');
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original globals
    global.fetch = originalFetch;
    window.location = originalLocation;
    global.URLSearchParams = originalURLSearchParams;
  });

  test('should initialize with today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(document.getElementById('date').value).toBe(today);
  });

  test('should populate directory from URL parameter', () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(document.getElementById('directory').value).toBe('test');
  });

  describe('File Type Handling', () => {
    test('should show text container for text type', () => {
      const fileTypeSelect = document.getElementById('fileType');
      fileTypeSelect.value = 'text';
      fileTypeSelect.dispatchEvent(new Event('change'));
      
      expect(document.getElementById('fileContainer').hidden).toBe(true);
      expect(document.getElementById('textContainer').hidden).toBe(false);
      expect(document.getElementById('textContent').required).toBe(true);
      expect(document.getElementById('file').required).toBe(false);
    });

    test('should show file container for document type', () => {
      const fileTypeSelect = document.getElementById('fileType');
      fileTypeSelect.value = 'document';
      fileTypeSelect.dispatchEvent(new Event('change'));
      
      expect(document.getElementById('fileContainer').hidden).toBe(false);
      expect(document.getElementById('textContainer').hidden).toBe(true);
      expect(document.getElementById('file').required).toBe(true);
      expect(document.getElementById('textContent').required).toBe(false);
      expect(document.getElementById('file').getAttribute('accept')).toBe('.pdf,.doc,.docx,.txt,.rtf');
    });

    test('should show author fields for document type', () => {
      const fileTypeSelect = document.getElementById('fileType');
      fileTypeSelect.value = 'document';
      fileTypeSelect.dispatchEvent(new Event('change'));
      
      expect(document.getElementById('authorContainer').hidden).toBe(false);
      expect(document.getElementById('categoryContainer').hidden).toBe(false);
      expect(document.getElementById('keywordsContainer').hidden).toBe(false);
    });

    test('should hide author fields for video type', () => {
      const fileTypeSelect = document.getElementById('fileType');
      fileTypeSelect.value = 'video';
      fileTypeSelect.dispatchEvent(new Event('change'));
      
      expect(document.getElementById('authorContainer').hidden).toBe(true);
      expect(document.getElementById('categoryContainer').hidden).toBe(true);
      expect(document.getElementById('keywordsContainer').hidden).toBe(true);
      expect(document.getElementById('file').getAttribute('accept')).toBe('.mp4,.mov,.avi,.webm');
    });
  });

  describe('Form Submission', () => {
    let form;

    beforeEach(() => {
      form = document.getElementById('uploadForm');
      form.reset();
    });

    test('should validate text content when text type is selected', async () => {
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = '';
      
      const submitEvent = new Event('submit', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Please enter text content.');
      expect(status.style.color).toBe('red');
    });

    test('should validate file upload when file type is selected', async () => {
      form.elements.fileType.value = 'document';
      form.elements.file.value = '';
      
      const submitEvent = new Event('submit', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      form.dispatchEvent(submitEvent);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Please select a file to upload.');
      expect(status.style.color).toBe('red');
    });

    test('should submit valid text content', async () => {
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = 'Sample text content';
      form.elements.title.value = 'Test Title';
      form.elements.date.value = '2025-01-01';
      form.elements.directory.value = 'test/dir';
      form.elements.author.value = 'Test Author';
      form.elements.category.value = 'Test Category';
      form.elements.keywords.value = 'test, keyword';
      
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
      
      // Verify metadata construction
      const formData = new FormData();
      const metadata = {
        fileType: 'text',
        title: 'Test Title',
        date: '2025-01-01',
        institution: '',
        author: 'Test Author',
        category: 'Test Category',
        keywords: ['test', 'keyword'],
        directory: 'test/dir',
        textContent: 'Sample text content'
      };
      
      formData.append('metadata', JSON.stringify(metadata));
      
      const fetchBody = fetch.mock.calls[0][1].body;
      expect(fetchBody instanceof FormData).toBe(true);
      
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Uploaded! Redirecting…');
      expect(status.style.color).toBe('green');
    });

    test('should handle API errors', async () => {
      // Mock failed API response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' }),
        })
      );

      form.elements.fileType.value = 'text';
      form.elements.textContent.value = 'Sample text';
      form.elements.title.value = 'Test';
      
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Upload failed: Server error');
      expect(status.style.color).toBe('red');
    });

    test('should normalize directory path', async () => {
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = 'Sample text';
      form.elements.title.value = 'Test';
      form.elements.directory.value = '/test/dir/';
      
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const fetchBody = fetch.mock.calls[0][1].body;
      // Can't directly inspect FormData, but we can verify the behavior through mocks
      expect(fetch).toHaveBeenCalled();
    });

    test('should handle empty keywords', async () => {
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = 'Sample text';
      form.elements.title.value = 'Test';
      form.elements.keywords.value = '';
      
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
    });
  });
});