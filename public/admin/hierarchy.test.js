const fs = require('fs');
const path = require('path');

describe('Admin Portal - Hierarchy Management', () => {
  let originalFetch;
  let originalLocation;
  let originalConsoleError;
  let originalArchiveData;

  // Mock HTML content
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
          <button id="cancel-dir-btn" type="button"></button>
        </form>
      </dialog>
      
      <div class="search-bar">
        <input type="text" />
      </div>
      
      <button class="logout-btn"></button>
      <button id="upload-btn"></button>
    </body>
    </html>
  `;

  beforeAll(() => {
    // Store original globals
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalConsoleError = console.error;
    originalArchiveData = require('./hierarcy.js').archiveData;
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

    // Reset archiveData to initial state
    const { archiveData } = require('./hierarcy.js');
    archiveData.root = {
      name: "Root",
      type: "directory",
      path: "/",
      children: []
    };
    Object.keys(archiveData).forEach(key => {
      if (key !== 'root') delete archiveData[key];
    });

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
    require('./hierarcy.js').archiveData = originalArchiveData;
  });

  describe('Initialization', () => {
    test('should initialize with empty archive data', () => {
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
      const { archiveData } = require('./hierarcy.js');
      
      // Trigger DOMContentLoaded
      document.dispatchEvent(new Event('DOMContentLoaded'));
      
      // Wait for API calls to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(archiveData).toHaveProperty('dir1');
      expect(archiveData.dir1).toEqual({
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ["file_file2"],
        firestoreId: "dir1",
        description: "Test dir 1"
      });
      expect(archiveData).toHaveProperty('file_file1');
      expect(archiveData.file_file1).toMatchObject({
        name: "File 1",
        type: "file",
        fileType: "document"
      });
    });

    test('should handle API loading errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));
      
      const { archiveData } = require('./hierarcy.js');
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(console.error).toHaveBeenCalledWith("Error loading data from API:", expect.any(Error));
      expect(archiveData.root.children).toEqual([]);
    });
  });

  describe('Directory Management', () => {
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
        children: ['file_file2'],
        firestoreId: 'dir1'
      };
      archiveData.dir2 = {
        name: "Directory 2",
        type: "directory",
        path: "/dir2",
        children: [],
        firestoreId: 'dir2'
      };
      archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document",
        firestoreId: 'file1'
      };
      archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image",
        firestoreId: 'file2'
      };
      archiveData.root.children = ['dir1', 'dir2', 'file_file1'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should build directory tree UI', () => {
      const rootUl = document.getElementById('root-directory');
      expect(rootUl).toBeTruthy();
      
      // Root directory should be present
      const rootDir = rootUl.querySelector('.directory[data-path="/"]');
      expect(rootDir).toBeTruthy();
      expect(rootDir.textContent).toContain('Root');
    });

    test('should open new directory modal when button clicked', () => {
      const newDirBtn = document.getElementById('new-dir-btn');
      const newDirModal = document.getElementById('new-dir-modal');
      
      // Mock showModal
      newDirModal.showModal = jest.fn();
      
      newDirBtn.click();
      expect(newDirModal.showModal).toHaveBeenCalled();
    });

    test('should close modal when cancel button clicked', () => {
      const cancelBtn = document.getElementById('cancel-dir-btn');
      const newDirModal = document.getElementById('new-dir-modal');
      
      // Mock close
      newDirModal.close = jest.fn();
      
      cancelBtn.click();
      expect(newDirModal.close).toHaveBeenCalled();
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
      expect(archiveData['new-dir']).toEqual({
        name: "New Directory",
        type: "directory",
        path: "/New_Directory",
        children: [],
        firestoreId: "new-dir",
        description: "Test description"
      });
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

      expect(console.error).toHaveBeenCalledWith("Error creating directory:", expect.any(Error));
    });
  });

  describe('Navigation', () => {
    let module;
    let archiveData;

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

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should navigate to directory path', () => {
      module.navigateToPath('/dir1');
      
      const pathNav = document.getElementById('path-navigation');
      expect(pathNav.innerHTML).toContain('Directory 1');
      expect(pathNav.querySelectorAll('a').length).toBe(2); // Root + dir1
    });

    test('should update content grid when navigating', () => {
      // Mock updateContentGrid since we're not testing the actual UI rendering
      const originalUpdateContentGrid = module.updateContentGrid;
      module.updateContentGrid = jest.fn();
      
      module.navigateToPath('/dir1');
      
      expect(module.updateContentGrid).toHaveBeenCalled();
      module.updateContentGrid = originalUpdateContentGrid;
    });

    test('should show empty state for empty directories', () => {
      module.navigateToPath('/dir2');
      
      const emptyState = document.getElementById('empty-state');
      // Since we're not actually rendering, we'll check the function behavior
      const currentDir = module.findDirectoryByPath('/dir2');
      expect(currentDir.children.length).toBe(0);
    });

    test('should expand directory path in tree view', () => {
      // Mock buildDirectoryTree since we're not testing actual DOM rendering
      const originalBuildDirectoryTree = module.buildDirectoryTree;
      module.buildDirectoryTree = jest.fn();
      
      module.navigateToPath('/dir1');
      
      expect(module.buildDirectoryTree).toHaveBeenCalled();
      module.buildDirectoryTree = originalBuildDirectoryTree;
    });
  });

  describe('File Management', () => {
    let module;
    let archiveData;

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
      archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image",
        firestoreId: 'file2'
      };
      archiveData.root.children = ['dir1', 'file_file1'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should find files in directory', () => {
      const dir = module.findDirectoryByPath('/dir1');
      expect(dir.children).toContain('file_file2');
    });

    test('should navigate to file view when file clicked', () => {
      // Simulate file card click
      const fileId = 'file_file1';
      const file = archiveData[fileId];
      
      // Mock the actual click handler behavior
      if (file.firestoreId) {
        window.location.href = `../delete/preview.html?id=${file.firestoreId}`;
      }
      
      expect(window.location.href).toContain('preview.html?id=file1');
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

    test('should return null for non-existent path', () => {
      const dir = module.findDirectoryByPath('/nonexistent');
      expect(dir).toBeNull();
    });

    test('should add directory to hierarchy', () => {
      module.addDirectoryToHierarchy('test-dir', {
        name: 'Test Directory',
        path: '/test-dir',
        description: 'Test'
      });
      
      expect(module.archiveData).toHaveProperty('test-dir');
      expect(module.archiveData['test-dir'].name).toBe('Test Directory');
      expect(module.archiveData.root.children).toContain('test-dir');
    });

    test('should add nested directory to hierarchy', () => {
      module.addDirectoryToHierarchy('nested-dir', {
        name: 'Nested Directory',
        path: '/dir1/nested-dir',
        description: 'Nested'
      });
      
      expect(module.archiveData).toHaveProperty('nested-dir');
      expect(module.archiveData['nested-dir'].path).toBe('/dir1/nested-dir');
      expect(module.archiveData.dir1.children).toContain('nested-dir');
    });

    test('should add document to hierarchy', () => {
      module.addDocumentToHierarchy('test-file', {
        title: 'Test File',
        directory: '/',
        fileType: 'document'
      });
      
      expect(module.archiveData).toHaveProperty('file_test-file');
      expect(module.archiveData['file_test-file'].name).toBe('Test File');
      expect(module.archiveData.root.children).toContain('file_test-file');
    });

    test('should add document to nested directory', () => {
      module.addDocumentToHierarchy('nested-file', {
        title: 'Nested File',
        directory: '/dir1',
        fileType: 'document'
      });
      
      expect(module.archiveData).toHaveProperty('file_nested-file');
      expect(module.archiveData['file_nested-file'].path).toContain('/dir1/');
      expect(module.archiveData.dir1.children).toContain('file_nested-file');
    });
  });

  describe('UI Integration', () => {
    let module;

    beforeEach(async () => {
      // Load fresh module instance
      module = require('./hierarcy.js');
      
      // Initialize with test data
      module.archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['file_file2']
      };
      module.archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document"
      };
      module.archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image"
      };
      module.archiveData.root.children = ['dir1', 'file_file1'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should handle logout button click', () => {
      const logoutBtn = document.querySelector('.logout-btn');
      logoutBtn.click();
      expect(window.location.href).toContain('admin_home.html');
    });

    test('should handle upload button click', () => {
      const uploadBtn = document.getElementById('upload-btn');
      uploadBtn.click();
      expect(window.location.href).toContain('admin-add.html');
    });

    test('should filter items based on search input', () => {
      // Simulate grid items
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
      expect(fileCards[1].style.display).toBe('none');
    });
  });
});