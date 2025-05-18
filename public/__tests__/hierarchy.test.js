import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Hierarchy Page', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Load the HTML file
    const html = fs.readFileSync(path.resolve(__dirname, '../admin/hierarcy.html'), 'utf8');
    
    // Initialize JSDOM   ../admin/home_page/admin_home.html
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
    global.window = window;
    global.document = document;
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('Constitution Vault - Admin Portal');
  });

  test('should have a header with admin controls', () => {
    const header = document.querySelector('header');
    expect(header).not.toBeNull();
    
    const title = header.querySelector('h1');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Constitution Vault Admin');
    
    const userControls = header.querySelector('.user-controls');
    expect(userControls).not.toBeNull();
    expect(userControls.textContent).toContain('Welcome, Admin');
    expect(userControls.querySelector('.logout-btn')).not.toBeNull();
    expect(userControls.querySelector('.logout-btn').textContent).toBe('home');
  });

  test('should have a sidebar with directory tree', () => {
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toBeNull();
    
    const treeTitle = sidebar.querySelector('h2');
    expect(treeTitle).not.toBeNull();
    expect(treeTitle.textContent).toBe('Archive Directory');
    
    const directoryTree = sidebar.querySelector('.directory-tree');
    expect(directoryTree).not.toBeNull();
    expect(directoryTree.querySelector('#root-directory')).not.toBeNull();
  });

  test('should have main content area with navigation and actions', () => {
    const mainContent = document.querySelector('.main-content');
    expect(mainContent).not.toBeNull();
    
    // Path navigation
    const pathNav = mainContent.querySelector('#path-navigation');
    expect(pathNav).not.toBeNull();
    expect(pathNav.querySelector('a')).not.toBeNull();
    
    // Actions section
    const actions = mainContent.querySelector('.actions');
    expect(actions).not.toBeNull();
    
    // Search bar
    const searchBar = actions.querySelector('.search-bar');
    expect(searchBar).not.toBeNull();
    expect(searchBar.querySelector('input[type="text"]')).not.toBeNull();
    expect(searchBar.querySelector('input').placeholder).toBe('Search in current directory...');
    
    // Action buttons
    const btnGroup = actions.querySelector('.btn-group');
    expect(btnGroup).not.toBeNull();
    expect(btnGroup.querySelector('#new-dir-btn')).not.toBeNull();
    expect(btnGroup.querySelector('#upload-btn')).not.toBeNull();
  });

  test('should have content display areas', () => {
    const mainContent = document.querySelector('.main-content');
    
    // Directory container
    const dirContainer = mainContent.querySelector('#directory-container');
    expect(dirContainer).not.toBeNull();
    
    // Content grid
    const contentGrid = mainContent.querySelector('#content-grid');
    expect(contentGrid).not.toBeNull();
    
    // Empty state
    const emptyState = mainContent.querySelector('#empty-state');
    expect(emptyState).not.toBeNull();
    expect(emptyState.style.display).toBe('none');
    expect(emptyState.querySelector('figure')).not.toBeNull();
    expect(emptyState.querySelector('p').textContent).toBe('This directory is empty.');
    expect(emptyState.querySelector('.btn')).not.toBeNull();
  });

  test('should have new directory modal', () => {
    const modal = document.getElementById('new-dir-modal');
    expect(modal).not.toBeNull();
    
    const modalContent = modal.querySelector('.modal');
    expect(modalContent).not.toBeNull();
    expect(modalContent.querySelector('h2').textContent).toBe('Create New Directory');
    
    const form = modalContent.querySelector('#new-dir-form');
    expect(form).not.toBeNull();
    
    const inputs = form.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(2);
    expect(inputs[0].id).toBe('dir-name');
    expect(inputs[0].placeholder).toBe('Enter directory name');
    expect(inputs[1].id).toBe('dir-description');
    expect(inputs[1].placeholder).toBe('Brief description of this directory');
    
    const buttons = form.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].id).toBe('cancel-dir-btn');
    expect(buttons[1].type).toBe('submit');
  });

  test('should have directory creation form', () => {
    const form = document.getElementById('create-directory-form');
    expect(form).not.toBeNull();
    
    const input = form.querySelector('input[type="text"]');
    expect(input).not.toBeNull();
    expect(input.id).toBe('directory-path');
    expect(input.placeholder).toBe('e.g., Africa/Nigeria/2023');
    
    const button = form.querySelector('button[type="submit"]');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Create Directory');
  });
});