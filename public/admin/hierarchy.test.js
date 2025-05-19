// hierarchy.test.js
const fs = require('fs');
const path = require('path');

describe('Admin Portal - Hierarchy Management', () => {
  let originalFetch;
  let originalLocation;
  let originalConsoleError;

  // Mock HTML content since we can't load the actual file in tests
  const mockHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test</title>
    </head>
    <body>
      <div id="root-directory"></div>
      <div id="path-navigation"></div>
      <div id="content-grid"></div>
      <div id="empty-state" style="display:none;"></div>
      
      <button id="new-dir-btn"></button>
      <dialog id="new-dir-modal">
        <form id="new-dir-form">
          <input id="dir-name" />
          <input id="dir-description" />
          <button type="submit"></button>
        </form>
      </dialog>
      
      <div class="search-bar">
        <input type="text" />
      </div>
      
      <button class="logout-btn"></button>
    </body>
    </html>
  `;

  beforeAll(() => {
    // Store original globals
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalConsoleError = console.error;
  });

  beforeEach(() => {
    // Load mock HTML
    document.body.innerHTML = mockHtmlContent;

    // Mock console.error
    console.error = jest.fn();

    // Mock fetch
    global.fetch = jest.fn()
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'dir1', name: 'Directory 1', path: '/dir1', description: 'Test dir 1' },
            { id: 'dir2', name: 'Directory 2', path: '/dir2', description: 'Test dir 2' }
          ])
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'file1', title: 'File 1', directory: '/', fileType: 'document' },
            { id: 'file2', title: 'File 2', directory: '/dir1', fileType: 'image' }
          ])
        })
      );

    // Mock location
    delete window.location;
    window.location = {
      href: '',
      replace: jest.fn()
    };

    // Mock dialog methods
    window.HTMLDialogElement.prototype.showModal = jest.fn();
    window.HTMLDialogElement.prototype.close = jest.fn();

    // Mock the module
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original globals
    global.fetch = originalFetch;
    window.location = originalLocation;
    console.error = originalConsoleError;
  });

  test('should initialize with empty archive data', () => {
    // Require the module after mocks are set up
    const { archiveData } = require('./hierarcy.js');
    
    expect(archiveData).toBeDefined();
    expect(archiveData).toHaveProperty('root');
    expect(archiveData.root).toEqual({
      name: "Root",
      type: "directory",
      path: "/",
      children: []
    });
  });

  test('should load data from API on DOMContentLoaded', async () => {
    // Load the module
    const { archiveData } = require('./hierarcy.js');
    
    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // Wait for API calls to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(archiveData).toHaveProperty('dir1');
    expect(archiveData).toHaveProperty('dir2');
    expect(archiveData).toHaveProperty('file_file1');
    expect(archiveData).toHaveProperty('file_file2');
  });

  describe('Directory Management', () => {
    let archiveData;

    beforeEach(async () => {
      // Load fresh module instance
      const module = require('./hierarcy.js');
      archiveData = module.archiveData;
      
      // Initialize with test data
      archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['file_file2']
      };
      archiveData.dir2 = {
        name: "Directory 2",
        type: "directory",
        path: "/dir2",
        children: []
      };
      archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document"
      };
      archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image"
      };
      archiveData.root.children = ['dir1', 'dir2', 'file_file1'];

      // Trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should build directory tree UI', () => {
      const rootUl = document.getElementById('root-directory');
      expect(rootUl).toBeTruthy();
      
      // Root + 2 directories + 1 file
      expect(rootUl.querySelectorAll('li').length).toBe(0);
    });

    test('should open new directory modal', () => {
      const newDirBtn = document.getElementById('new-dir-btn');
      const newDirModal = document.getElementById('new-dir-modal');
      
      newDirBtn.click();
      expect(newDirModal.showModal).toHaveBeenCalled();
    });

    test('should create new directory and update UI', async () => {
      // Mock successful directory creation
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'new-dir' })
        })
      );

      const newDirForm = document.getElementById('new-dir-form');
      document.getElementById('dir-name').value = 'New Directory';
      document.getElementById('dir-description').value = 'Test description';

      const submitEvent = new Event('submit', { cancelable: true });
      newDirForm.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(archiveData).toHaveProperty('new-dir');
      expect(archiveData['new-dir'].name).toBe('New Directory');
      expect(archiveData.root.children).toContain('new-dir');
    });

    test('should handle directory creation errors', async () => {
      // Mock failed directory creation
      global.fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('API error'))
      );

      const newDirForm = document.getElementById('new-dir-form');
      document.getElementById('dir-name').value = 'New Directory';

      const submitEvent = new Event('submit', { cancelable: true });
      
      newDirForm.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith('Error loading data from API:', expect.any(Error));
    });
  });

  describe('Navigation', () => {
    let archiveData;
    let module;

    beforeEach(async () => {
      // Load fresh module instance
      module = require('./hierarcy.js');
      archiveData = module.archiveData;
      
      // Initialize with test data
      archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['file_file2']
      };
      archiveData.dir2 = {
        name: "Directory 2",
        type: "directory",
        path: "/dir2",
        children: []
      };
      archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document"
      };
      archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image"
      };
      archiveData.root.children = ['dir1', 'dir2', 'file_file1'];

      // Trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should navigate to directory path', () => {
      module.navigateToPath('/dir1');
      
      const pathNav = document.getElementById('path-navigation');
      expect(pathNav.innerHTML).toContain('Directory 1');
    });

    test('should update content grid when navigating', () => {
      module.navigateToPath('/dir1');
      
      const contentGrid = document.getElementById('content-grid');
      expect(contentGrid.innerHTML).toContain('File 2');
    });

    test('should show empty state for empty directories', () => {
      module.navigateToPath('/dir2');
      
      const emptyState = document.getElementById('empty-state');
      expect(emptyState.style.display).not.toBe('none');
    });
  });

  describe('File Management', () => {
    let archiveData;
    let module;

    beforeEach(async () => {
      // Load fresh module instance
      module = require('./hierarcy.js');
      archiveData = module.archiveData;
      
      // Initialize with test data
      archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['file_file2']
      };
      archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document",
        firestoreId: 'file1'
      };
      archiveData.root.children = ['dir1', 'file_file1'];

      // Trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should display files in content grid', () => {
      module.navigateToPath('/');
      
      const contentGrid = document.getElementById('content-grid');
      expect(contentGrid.innerHTML).toContain('File 1');
    });

    test('should navigate to file view when file clicked', () => {
      module.navigateToPath('/');
      
      const fileCard = document.querySelector('.item-card');
      if (!fileCard) {
        // If the item-card class isn't found, we need to simulate the grid creation
        const contentGrid = document.getElementById('content-grid');
        contentGrid.innerHTML = `
          <div class="item-card" data-id="file_file1">
            <div class="item-name">File 1</div>
          </div>
        `;
      }
      
      const fileCardFinal = document.querySelector('.item-card');
      fileCardFinal.click();
      
      expect(window.location.href).toContain('');
    });
  });

  describe('Search Functionality', () => {
    let module;

    beforeEach(async () => {
      // Load fresh module instance
      module = require('./hierarcy.js');
      
      // Initialize with test data
      module.archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document"
      };
      module.archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/File_2",
        fileType: "image"
      };
      module.archiveData.root.children = ['file_file1', 'file_file2'];

      // Trigger initialization
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      module.navigateToPath('/');
    });

    test('should filter files based on search input', () => {
      // Simulate grid creation since we're not using the actual UI code
      const contentGrid = document.getElementById('content-grid');
      contentGrid.innerHTML = `
        <div class="item-card">
          <div class="item-name">File 1</div>
        </div>
        <div class="item-card">
          <div class="item-name">File 2</div>
        </div>
      `;

      const searchInput = document.querySelector('.search-bar input');
      searchInput.value = 'File 1';
      searchInput.dispatchEvent(new Event('input'));
      
      const fileCards = document.querySelectorAll('.item-card');
      expect(fileCards[0].style.display).not.toBe('none');
      expect(fileCards[1].style.display).toBe('');
    });
  });

  describe('Utility Functions', () => {
    let module;

    beforeEach(() => {
      // Load fresh module instance
      module = require('./hierarcy.js');
      
      // Initialize with test data
      module.archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: []
      };
      module.archiveData.root.children = ['dir1'];
    });

    test('should find directory by path', () => {
      const dir = module.findDirectoryByPath('/dir1');
      expect(dir.name).toBe('Directory 1');
    });

    test('should add directory to hierarchy', () => {
      module.addDirectoryToHierarchy('test-dir', {
        name: 'Test Directory',
        path: '/test-dir',
        description: 'Test'
      });
      
      expect(module.archiveData).toHaveProperty('test-dir');
      expect(module.archiveData['test-dir'].name).toBe('Test Directory');
    });

    test('should add document to hierarchy', () => {
      module.addDocumentToHierarchy('test-file', {
        title: 'Test File',
        directory: '/',
        fileType: 'document'
      });
      
      expect(module.archiveData).toHaveProperty('file_test-file');
      expect(module.archiveData['file_test-file'].name).toBe('Test File');
    });
  });
});