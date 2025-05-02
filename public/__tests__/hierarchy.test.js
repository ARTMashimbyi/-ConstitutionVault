// hierarchy.test.js
import { jest } from '@jest/globals';

// Mock Firebase modules
jest.mock('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js', () => ({
  initializeApp: jest.fn()
}));

jest.mock('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn()
}));

// Create DOM elements needed for tests
document.body.innerHTML = `
  <div id="root-directory"></div>
  <div id="path-navigation"></div>
  <div id="content-grid"></div>
  <div id="empty-state" style="display:none;"></div>
  <button id="new-dir-btn"></button>
  <div id="new-dir-modal" style="display:none;"></div>
  <form id="new-dir-form"></form>
  <input id="dir-name" value="Test Directory" />
  <input id="dir-description" value="Test Description" />
  <button id="cancel-dir-btn"></button>
`;

// Import the module to test (this will need to be adjusted based on your actual file structure)
// Note: For the test to work properly, you'll need to modify your original code to use ES modules export syntax
import {
  loadDataFromFirestore,
  addDirectoryToHierarchy,
  addDocumentToHierarchy,
  findDirectoryByPath,
  navigateToPath,
  updatePathNavigation,
  updateContentGrid,
  buildDirectoryTree,
  initializeUI,
  archiveData
} from './hierarcy.js';

describe('Constitutional Archive Admin Portal', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize archiveData to a known state
    global.archiveData = {
      root: {
        name: "Root",
        type: "directory",
        path: "/",
        children: []
      }
    };
    
    global.currentPath = "/";
    global.currentPathSegments = [];
  });

  test('findDirectoryByPath should return the correct directory', () => {
    // Setup test data
    archiveData.test_dir = {
      name: "Test Directory",
      type: "directory",
      path: "/test",
      children: []
    };
    
    // Test function
    const result = findDirectoryByPath('/test');
    
    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe("Test Directory");
    expect(result.path).toBe("/test");
  });

  test('addDirectoryToHierarchy should properly add a directory', () => {
    // Setup
    const id = 'test_dir_123';
    const directoryData = {
      name: 'Africa',
      path: '/Africa',
      description: 'African constitutions'
    };
    
    // Execute
    addDirectoryToHierarchy(id, directoryData);
    
    // Assert
    expect(archiveData.root.children).toContain(id);
    expect(archiveData[id]).toBeDefined();
    expect(archiveData[id].name).toBe('Africa');
    expect(archiveData[id].path).toBe('/Africa');
    expect(archiveData[id].type).toBe('directory');
  });

  test('addDocumentToHierarchy should add a document to the correct directory', () => {
    // Setup
    const dirId = 'africa_dir';
    archiveData[dirId] = {
      name: 'Africa',
      type: 'directory',
      path: '/Africa',
      children: []
    };
    archiveData.root.children.push(dirId);
    
    const docId = 'nigeria_constitution';
    const documentData = {
      title: 'Nigerian Constitution',
      directory: '/Africa',
      description: 'Constitution of Nigeria',
      author: 'Nigerian Government',
      date: '2023-01-01',
      country: 'Nigeria',
      continent: 'Africa'
    };
    
    // Execute
    addDocumentToHierarchy(docId, documentData);
    
    // Assert
    const fileId = `file_${docId}`;
    expect(archiveData[dirId].children).toContain(fileId);
    expect(archiveData[fileId]).toBeDefined();
    expect(archiveData[fileId].name).toBe('Nigerian Constitution');
    expect(archiveData[fileId].type).toBe('file');
    expect(archiveData[fileId].metadata.country).toBe('Nigeria');
  });

  test('navigateToPath should update current path and trigger UI updates', () => {
    // Mock the UI update functions
    global.updatePathNavigation = jest.fn();
    global.updateContentGrid = jest.fn();
    global.expandDirectoryPath = jest.fn();
    
    // Execute
    navigateToPath('/Africa/Nigeria');
    
    // Assert
    expect(global.currentPath).toBe('/Africa/Nigeria');
    expect(global.currentPathSegments).toEqual(['Africa', 'Nigeria']);
    expect(global.updatePathNavigation).toHaveBeenCalled();
    expect(global.updateContentGrid).toHaveBeenCalled();
    expect(global.expandDirectoryPath).toHaveBeenCalledWith('/Africa/Nigeria');
  });

  test('loadDataFromFirestore should fetch and process data from Firestore', async () => {
    // Mock Firestore response
    const dirMock = {
      forEach: jest.fn(callback => {
        callback({
          id: 'africa_dir',
          data: () => ({
            name: 'Africa',
            path: '/Africa',
            description: 'African constitutions'
          })
        });
      })
    };
    
    const docMock = {
      forEach: jest.fn(callback => {
        callback({
          id: 'nigeria_const',
          data: () => ({
            title: 'Nigerian Constitution',
            directory: '/Africa',
            description: 'Constitution of Nigeria'
          })
        });
      })
    };
    
    // Mock the Firebase functions
    const { getDocs } = require('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');
    getDocs.mockResolvedValueOnce(dirMock).mockResolvedValueOnce(docMock);
    
    global.addDirectoryToHierarchy = jest.fn();
    global.addDocumentToHierarchy = jest.fn();
    global.initializeUI = jest.fn();
    
    // Execute
    await loadDataFromFirestore();
    
    // Assert
    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(global.addDirectoryToHierarchy).toHaveBeenCalledWith(
      'africa_dir',
      expect.objectContaining({
        name: 'Africa',
        path: '/Africa'
      })
    );
    expect(global.addDocumentToHierarchy).toHaveBeenCalledWith(
      'nigeria_const',
      expect.objectContaining({
        title: 'Nigerian Constitution',
        directory: '/Africa'
      })
    );
    expect(global.initializeUI).toHaveBeenCalled();
  });

  test('buildDirectoryTree should create DOM elements for the directory structure', () => {
    // Setup test data
    archiveData.africa_dir = {
      name: 'Africa',
      type: 'directory',
      path: '/Africa',
      children: ['nigeria_dir']
    };
    
    archiveData.nigeria_dir = {
      name: 'Nigeria',
      type: 'directory',
      path: '/Africa/Nigeria',
      children: []
    };
    
    archiveData.root.children = ['africa_dir'];
    
    const rootElement = document.getElementById('root-directory');
    
    // Mock DOM functions to test event listeners
    document.querySelectorAll = jest.fn().mockReturnValue([]);
    
    // Execute
    buildDirectoryTree();
    
    // Assert
    expect(rootElement.innerHTML).toContain('Root');
    // More detailed DOM assertions could be added here
  });

  test('New directory modal should open when button is clicked', () => {
    // Setup
    const newDirBtn = document.getElementById('new-dir-btn');
    const newDirModal = document.getElementById('new-dir-modal');
    
    // Add event listeners
    newDirBtn.addEventListener = jest.fn((event, callback) => {
      if (event === 'click') callback();
    });
    
    // Execute - simulating event handler setup in initializeUI
    initializeUI();
    
    // Assert
    expect(newDirBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(newDirModal.style.display).toBe('flex');
  });
});