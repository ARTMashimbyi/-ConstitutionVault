import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Add this at the beginning of your test file if you're still having issues
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Admin Home Page', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Load the HTML file
    const html = fs.readFileSync(path.resolve(__dirname, '../admin/home_page/admin_home.html'), 'utf8');
    
    // Initialize JSDOM with proper options
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true, // Add this for requestAnimationFrame support
      url: 'http://localhost' // Add this for proper URL resolution
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Add any missing globals
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('Constitution Vault - Admin Home');
  });

  test('should have a header with logo and user controls', () => {
    const header = document.querySelector('header');
    expect(header).not.toBeNull();
    
    const logo = document.querySelector('.logo');
    expect(logo).not.toBeNull();
    expect(logo.textContent).toContain('Constitution Vault');
    
    const userControls = document.querySelector('.user-controls');
    expect(userControls).not.toBeNull();
    expect(userControls.textContent).toContain('Admin');
    expect(userControls.querySelector('.logout-btn')).not.toBeNull();
  });

  test('should have a welcome banner with correct content', () => {
    const banner = document.querySelector('.welcome-banner');
    expect(banner).not.toBeNull();
    expect(banner.querySelector('h1').textContent).toBe('Welcome to Constitution Vault');
    expect(banner.querySelector('p').textContent).toContain('Manage your constitutional document collection');
    expect(banner.querySelector('.btn')).not.toBeNull();
  });

  test('should have an archive overview section with stat cards', () => {
    const statsContainer = document.querySelector('.stats-container');
    expect(statsContainer).not.toBeNull();
    
    const statCards = statsContainer.querySelectorAll('.stat-card');
    expect(statCards.length).toBe(4);
    
    const expectedStats = ['Total Documents', 'Directories', 'Recent Uploads', 'Document Types'];
    statCards.forEach((card, index) => {
      expect(card.querySelector('.stat-label').textContent).toBe(expectedStats[index]);
    });
  });

  test('should have upload type sections with correct options', () => {
    const uploadTypes = document.querySelectorAll('.upload-type');
    expect(uploadTypes.length).toBe(5);
    
    const expectedTypes = [
      { icon: '📄', title: 'Document', desc: 'PDF, DOC, DOCX, TXT, RTF' },
      { icon: '🎬', title: 'Video', desc: 'MP4, MOV, AVI, WEBM' },
      { icon: '🖼️', title: 'Image', desc: 'JPG, PNG, GIF, SVG' },
      { icon: '🔊', title: 'Audio', desc: 'MP3, WAV, OGG, M4A' },
      { icon: '📝', title: 'Text', desc: 'Enter text content directly' }
    ];
    
    uploadTypes.forEach((type, index) => {
      const icon = type.querySelector('.upload-icon');
      const title = type.querySelector('.upload-type-title');
      const desc = type.querySelector('.upload-type-desc');
      
      expect(icon.textContent).toBe(expectedTypes[index].icon);
      expect(title.textContent).toBe(expectedTypes[index].title);
      expect(desc.textContent).toContain(expectedTypes[index].desc);
    });
  });
});




describe('Admin Home JavaScript', () => {
    let dom;
    let document;
    let window;
    let mockFirebase;
  
    beforeEach(() => {
      // Mock Firebase functions
      mockFirebase = {
        initializeApp: jest.fn(),
        getFirestore: jest.fn(),
        collection: jest.fn(),
        getDocs: jest.fn(),
        query: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn()
      };
  
      // Mock the global Firebase object
      global.firebase = {
        initializeApp: mockFirebase.initializeApp,
        firestore: {
          getFirestore: mockFirebase.getFirestore,
          collection: mockFirebase.collection,
          getDocs: mockFirebase.getDocs,
          query: mockFirebase.query,
          orderBy: mockFirebase.orderBy,
          limit: mockFirebase.limit
        }
      };
  
      // Load the HTML file
      const html = fs.readFileSync(path.resolve(__dirname, '../admin/home_page/admin_home.html'), 'utf8');
      
      // Initialize JSDOM with our mock Firebase
      dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        beforeParse(window) {
          window.firebase = {
            initializeApp: mockFirebase.initializeApp,
            firestore: {
              getFirestore: mockFirebase.getFirestore,
              collection: mockFirebase.collection,
              getDocs: mockFirebase.getDocs,
              query: mockFirebase.query,
              orderBy: mockFirebase.orderBy,
              limit: mockFirebase.limit
            }
          };
        }
      });
      
      document = dom.window.document;
      window = dom.window;
      
      // Mock the admin_home.js script
      window.initializeApp = mockFirebase.initializeApp;
      window.getFirestore = mockFirebase.getFirestore;
      window.collection = mockFirebase.collection;
      window.getDocs = mockFirebase.getDocs;
      window.query = mockFirebase.query;
      window.orderBy = mockFirebase.orderBy;
      window.limit = mockFirebase.limit;
    });
  
    test('should set up logout button click handler', () => {
      const logoutBtn = document.querySelector('.logout-btn');
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);
      
      logoutBtn.click();
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
      
      window.confirm = originalConfirm;
    });
  
    test('should set up upload type click handlers', () => {
      const uploadTypes = document.querySelectorAll('.upload-type');
      const consoleSpy = jest.spyOn(console, 'log');
      
      uploadTypes[0].click();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Selected file type: document'));
      
      uploadTypes[1].click();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Selected file type: video'));
      
      consoleSpy.mockRestore();
    });
  
    test('should initialize Firebase with correct config', async () => {
      // Mock the getDocs responses
      const mockDocsSnapshot = {
        size: 10,
        forEach: jest.fn(),
        empty: false
      };
      
      const mockDirSnapshot = {
        size: 5
      };
      
      mockFirebase.getDocs.mockImplementation((collectionRef) => {
        if (collectionRef.id === 'constitutionalDocuments') {
          return Promise.resolve(mockDocsSnapshot);
        } else if (collectionRef.id === 'directories') {
          return Promise.resolve(mockDirSnapshot);
        }
        return Promise.reject(new Error('Unknown collection'));
      });
      
      // Mock the query response for recent documents
      const mockRecentDocsSnapshot = {
        empty: false,
        forEach: jest.fn(callback => {
          // Simulate 2 documents
          callback({
            data: () => ({
              title: 'Test Document',
              fileType: 'document',
              uploadedAt: new Date().toISOString(),
              directory: '/test'
            })
          });
          callback({
            data: () => ({
              title: 'Test Video',
              fileType: 'video',
              uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              directory: '/videos'
            })
          });
        })
      };
      
      mockFirebase.query.mockReturnValue('mock-query');
      mockFirebase.getDocs.mockResolvedValueOnce(mockDocsSnapshot); // For stats
      mockFirebase.getDocs.mockResolvedValueOnce(mockDirSnapshot); // For stats
      mockFirebase.getDocs.mockResolvedValueOnce(mockRecentDocsSnapshot); // For recent docs
      
      // Trigger the DOMContentLoaded event
      window.dispatchEvent(new window.Event('DOMContentLoaded'));
      
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify Firebase was initialized with correct config
      expect(mockFirebase.initializeApp).toHaveBeenCalledWith({
        apiKey: "AIzaSyAU_w_Oxi6noX_A1Ma4XZDfpIY-jkoPN-c",
        authDomain: "constitutionvault-1b5d1.firebaseapp.com",
        projectId: "constitutionvault-1b5d1",
        storageBucket: "constitutionvault-1b5d1.appspot.com",
        messagingSenderId: "616111688261",
        appId: "1:616111688261:web:97cc0a35c8035c0814312c",
        measurementId: "G-YJEYZ85T3S"
      });
      
      // Verify stats were updated
      expect(document.getElementById('totalDocs').textContent).toBe('10');
      expect(document.getElementById('totalDirectories').textContent).toBe('5');
      
      // Verify recent documents were rendered
      const recentDocsList = document.getElementById('recentDocumentsList');
      expect(recentDocsList.children.length).toBe(2);
      expect(recentDocsList.textContent).toContain('Test Document');
      expect(recentDocsList.textContent).toContain('Test Video');
    });
  
    test('should handle Firebase errors gracefully', async () => {
      // Mock a Firebase error
      mockFirebase.getDocs.mockRejectedValue(new Error('Firebase error'));
      
      // Trigger the DOMContentLoaded event
      window.dispatchEvent(new window.Event('DOMContentLoaded'));
      
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify error state in UI
      expect(document.getElementById('totalDocs').textContent).toBe('?');
      expect(document.getElementById('totalDirectories').textContent).toBe('?');
      
      const recentDocsList = document.getElementById('recentDocumentsList');
      expect(recentDocsList.textContent).toContain('Error loading documents');
    });
  });