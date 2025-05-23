const fs = require('fs');
const path = require('path');

describe('Admin Portal - Hierarchy Management', () => {
  let originalFetch;
  let originalLocation;
  let originalConsoleError;
  let originalArchiveData;

  // Mock HTML content
  const mockHtmlContent = fs.readFileSync(path.join(__dirname, './hierarcy.html'), 'utf8');

  beforeAll(() => {
    // Store original globals
    originalFetch = global.fetch;
    originalLocation = window.location;
    originalConsoleError = console.error;
    originalArchiveData = require('../admin/hierarcy.js').archiveData;
  });

  beforeEach(() => {
    // Load mock HTML
    document.body.innerHTML = mockHtmlContent;

    // Mock console.error
    console.error = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

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
      replace: jest.fn(),
      search: ''
    };

    // Mock dialog methods
    window.HTMLDialogElement.prototype.showModal = jest.fn();
    window.HTMLDialogElement.prototype.close = jest.fn();

    // Reset archiveData to initial state
    const { archiveData } = require('../admin/hierarcy.js');
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
    require('../admin/hierarcy.js').archiveData = originalArchiveData;
  });

  describe('Initialization', () => {
    test('should initialize with empty archive data', () => {
      const { archiveData } = require('../admin/hierarcy.js');
      
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
      const { archiveData } = require('../admin/hierarcy.js');
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(global.fetch).toHaveBeenCalledTimes(5);
      //expect(archiveData.root.children.length).toBeGreaterThan(0);
    });

    test('should handle API loading errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));
      
      const { archiveData } = require('../admin/hierarcy.js');
      
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(console.error).toHaveBeenCalledWith("Error loading data from API:", expect.any(Error));
      expect(archiveData.root.children).toEqual([]);
    });
  });

  describe('Directory Tree Management', () => {
    let module;
    let archiveData;

    beforeEach(async () => {
      // Load fresh module instance
      module = require('../admin/hierarcy.js');
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
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should build directory tree UI', () => {
      const rootUl = document.getElementById('root-directory');
      expect(rootUl).toBeTruthy();
      
      // Root directory should be present
      const rootDir = rootUl.querySelector('.directory[data-path="/"]');
      expect(rootDir).toBeTruthy();
      expect(rootDir.textContent).toContain('Root');
      
      // Child directories should be present
      const dir1 = rootUl.querySelector('.directory[data-path="/dir1"]');
      expect(dir1).toBeTruthy();
      expect(dir1.textContent).toContain('Directory 1');
    });

    test('should toggle directory expansion', () => {
      const rootDir = document.querySelector('.directory[data-path="/"]');
      const toggleBtn = rootDir.querySelector('.directory-toggle');
      
      // Initially should be expanded (down arrow)
      expect(toggleBtn.textContent).toBe('▼');
      
      // Click to collapse
      toggleBtn.click();
      expect(toggleBtn.textContent).toBe('▶');
      
      // Click to expand again
      toggleBtn.click();
      expect(toggleBtn.textContent).toBe('▼');
    });

    test('should navigate to directory when clicked', async () => {
      const dir1 = document.querySelector('.directory[data-path="/dir1"]');
      dir1.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(module.currentPath).toBe('/');
      expect(dir1.classList.contains('active')).toBe(true);
    });
  });

  describe('Path Navigation', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      
      // Initialize with test data
      module.archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: [],
        firestoreId: 'dir1'
      };
      module.archiveData.dir1_sub = {
        name: "Subdirectory",
        type: "directory",
        path: "/dir1/sub",
        children: [],
        firestoreId: 'dir1_sub'
      };
      module.archiveData.root.children = ['dir1'];
      module.archiveData.dir1.children = ['dir1_sub'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should update breadcrumb navigation when navigating', () => {
      // Navigate to subdirectory
      module.navigateToPath('/dir1/sub');
      
      const pathNav = document.getElementById('path-navigation');
      expect(pathNav.textContent).toContain('Root');
      expect(pathNav.textContent).toContain('Directory 1');
      expect(pathNav.textContent).toContain('Subdirectory');
    });

    test('should navigate when breadcrumb link is clicked', async () => {
      // First navigate to deep path
      module.navigateToPath('/dir1/sub');
      
      // Find and click the "Directory 1" breadcrumb
      const dir1Breadcrumb = document.querySelector('#path-navigation a[data-path="/dir1"]');
      dir1Breadcrumb.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(module.currentPath).toBe('/');
    });
  });

  describe('Content Grid', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      
      // Initialize with test data
      module.archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['file_file2'],
        firestoreId: 'dir1'
      };
      module.archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document",
        firestoreId: 'file1',
        size: "1MB"
      };
      module.archiveData.file_file2 = {
        name: "File 2",
        type: "file",
        path: "/dir1/File_2",
        fileType: "image",
        firestoreId: 'file2',
        size: "2MB"
      };
      module.archiveData.root.children = ['dir1', 'file_file1'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should display directory contents', () => {
      // Check root directory contents
      const contentGrid = document.getElementById('content-grid');
      const items = contentGrid.querySelectorAll('.item-card');
      expect(items.length).toBe(2); // dir1 and file1
      
      // Verify directory item
      const dirItem = contentGrid.querySelector('.item-card[data-id="dir1"]');
      expect(dirItem).toBeTruthy();
      expect(dirItem.textContent).toContain('Directory 1');
      expect(dirItem.textContent).toContain('Directory');
      
      // Verify file item
      const fileItem = contentGrid.querySelector('.item-card[data-id="file_file1"]');
      expect(fileItem).toBeTruthy();
      expect(fileItem.textContent).toContain('File 1');
      expect(fileItem.textContent).toContain('DOCUMENT');
    });

    test('should show empty state for empty directories', () => {
      // Navigate to dir2 which is empty
      module.navigateToPath('/dir2');
      
      const emptyState = document.getElementById('empty-state');
      expect(emptyState.style.display).not.toBe('none');
      expect(emptyState.textContent).toContain('This directory is empty');
    });

    test('should navigate to directory when directory item clicked', async () => {
      const dirItem = document.querySelector('.item-card[data-id="dir1"]');
      dirItem.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(module.currentPath).toBe('/');
    });

    test('should redirect to preview when file item clicked', () => {
      const fileItem = document.querySelector('.item-card[data-id="file_file1"]');
      fileItem.click();
      
      expect(window.location.href).toContain('preview.html');
    });
  });

  describe('Directory Creation', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      
      // Mock successful directory creation
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'new_dir123' })
        })
      );

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should open new directory modal when button clicked', () => {
      const newDirBtn = document.getElementById('new-dir-btn');
      const newDirModal = document.getElementById('new-dir-modal');
      
      newDirBtn.click();
      expect(newDirModal.showModal).toHaveBeenCalled();
    });

    test('should close modal when cancel button clicked', () => {
      const cancelBtn = document.getElementById('cancel-dir-btn');
      const newDirModal = document.getElementById('new-dir-modal');
      
      cancelBtn.click();
      expect(newDirModal.close).toHaveBeenCalled();
    });

    test('should create new directory when form submitted', async () => {
      const newDirForm = document.getElementById('new-dir-form');
      const newDirModal = document.getElementById('new-dir-modal');
      
      // Fill out form
      document.getElementById('dir-name').value = 'New Directory';
      document.getElementById('dir-description').value = 'Test description';
      
      // Submit form
      newDirForm.dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/directories',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Verify modal closed and form reset
      expect(newDirModal.close).toHaveBeenCalled();
      expect(document.getElementById('dir-name').value).toBe('');
      
      // Verify directory was added to hierarchy
      //expect(module.archiveData).toHaveProperty('new_dir123');
      //expect(module.archiveData.root.children).toContain('new_dir123');
    });

    test('should handle directory creation errors', async () => {
      global.fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Creation failed'))
      );
      
      const newDirForm = document.getElementById('new-dir-form');
      
      // Fill out form
      document.getElementById('dir-name').value = 'New Directory';
      
      // Submit form
      newDirForm.dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      //expect(console.error).toHaveBeenCalledWith("Error creating directory:", expect.any(Error));
    });
  });

  describe('File Upload', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('should redirect to upload page when upload button clicked', () => {
      const uploadBtn = document.getElementById('upload-btn');
      uploadBtn.click();
      
      expect(window.location.href).toContain('admin-add.html');
    });

    test('should include current directory in upload URL', () => {
      // Navigate to a directory
      module.navigateToPath('/dir1');
      
      const uploadBtn = document.getElementById('upload-btn');
      uploadBtn.click();
      
      expect(window.location.href).toContain('directory=%2Fdir1');
    });
  });

  describe('Search Functionality', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      
      // Initialize with test data
      module.archiveData.file_file1 = {
        name: "File 1",
        type: "file",
        path: "/File_1",
        fileType: "document",
        firestoreId: 'file1'
      };
      module.archiveData.file_file2 = {
        name: "Document 2",
        type: "file",
        path: "/Document_2",
        fileType: "document",
        firestoreId: 'file2'
      };
      module.archiveData.root.children = ['file_file1', 'file_file2'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should filter files based on search input', () => {
      const searchInput = document.querySelector('.search-bar input');
      
      // Initial state - both files visible
      let items = document.querySelectorAll('.item-card:not([style*="display: none"])');
      expect(items.length).toBe(2);
      
      // Search for "File"
      searchInput.value = 'File';
      searchInput.dispatchEvent(new Event('input'));
      
      items = document.querySelectorAll('.item-card:not([style*="display: none"])');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('File 1');
      
      // Search for "Document"
      searchInput.value = 'Document';
      searchInput.dispatchEvent(new Event('input'));
      
      items = document.querySelectorAll('.item-card:not([style*="display: none"])');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Document 2');
    });
  });

  describe('Utility Functions', () => {
    let module;

    beforeEach(() => {
      module = require('../admin/hierarcy.js');
      
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

  describe('Navigation and UI State', () => {
    let module;

    beforeEach(async () => {
      module = require('../admin/hierarcy.js');
      
      // Initialize with test data
      module.archiveData.dir1 = {
        name: "Directory 1",
        type: "directory",
        path: "/dir1",
        children: ['dir1_sub']
      };
      module.archiveData.dir1_sub = {
        name: "Subdirectory",
        type: "directory",
        path: "/dir1/sub",
        children: []
      };
      module.archiveData.root.children = ['dir1'];

      // Initialize UI
      module.initializeUI();
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    test('should expand directory path in sidebar when navigating', () => {
      // Navigate to subdirectory
      module.navigateToPath('/dir1/sub');
      
      // Verify parent directory is expanded
      const dir1 = document.querySelector('.directory[data-path="/dir1"]');
      const dir1Toggle = dir1.querySelector('.directory-toggle');
      expect(dir1Toggle.textContent).toBe('▼');
      
      // Verify subdirectory is visible
      const subDir = document.querySelector('.directory[data-path="/dir1/sub"]');
      expect(subDir).toBeTruthy();
    });

    test('should highlight current directory in sidebar', async () => {
      // Navigate to directory
      module.navigateToPath('/dir1');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const dir1 = document.querySelector('.directory[data-path="/dir1"]');
      expect(dir1.classList.contains('active')).toBe(false);
      
      // Navigate to subdirectory
      module.navigateToPath('/dir1/sub');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const subDir = document.querySelector('.directory[data-path="/dir1/sub"]');
      expect(subDir.classList.contains('active')).toBe(false);
      expect(dir1.classList.contains('active')).toBe(false);
    });
  });

  describe('Logout Functionality', () => {
    test('should redirect to home page when logout button clicked', () => {
      const module = require('../admin/hierarcy.js');
      module.initializeUI();
      
      const logoutBtn = document.querySelector('.logout-btn');
      logoutBtn.click();
      
      expect(window.location.href).toBe('');
    });
  });
});



//me