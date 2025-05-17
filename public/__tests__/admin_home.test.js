import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfills for TextEncoder/TextDecoder
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
      pretendToBeVisual: true,
      url: 'http://localhost',
      beforeParse(window) {
        window.console.error = () => {}; // Silence resource loading errors
      }
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