// admin-add.test.js

// admin-add.test.js
import AdminAdd from '../admin/admin-add.js'; 

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
    // Manually trigger DOMContentLoaded since JSDOM doesn't do it automatically
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(document.getElementById('directory').value).toBe('test');
  });

  describe('Form Submission', () => {
    let form;

    beforeEach(() => {
      form = document.getElementById('uploadForm');
      // Ensure we're working with a fresh form state
      form.reset();
    });

    test('should validate text content when text type is selected', async () => {
      // Set form to text type but leave text content empty
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = '';
      
      // Create and dispatch submit event
      const submitEvent = new Event('submit', { cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
      
      // Trigger form submission
      form.dispatchEvent(submitEvent);
      
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify validation failed
      expect(preventDefaultSpy).toHaveBeenCalled();
      
      // Check error status is shown
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Please enter text content.');
      expect(status.style.color).toBe('red');
    });

    test('should submit valid text content', async () => {
      // Set up valid form data
      form.elements.fileType.value = 'text';
      form.elements.textContent.value = 'Sample text content';
      form.elements.title.value = 'Test Title';
      form.elements.date.value = '2025-01-01';
      form.elements.directory.value = 'test/dir';
      
      // Create and dispatch submit event
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for submission to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify fetch was called
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/files',
        expect.objectContaining({
          method: 'POST'
        })
      );
      
      // Check success status is shown
      const status = document.getElementById('uploadStatus');
      expect(status.textContent).toContain('Uploaded! Redirecting…');
      expect(status.style.color).toBe('green');
    });
  });
});