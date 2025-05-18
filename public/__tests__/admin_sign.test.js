import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Authentication Page Structure', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Load the HTML file
    const html = fs.readFileSync(path.resolve(__dirname, '../admin sign in/admin_sign_in.html'), 'utf8');
    
    // Initialize JSDOM
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      url: 'http://localhost',
      beforeParse(window) {
        window.console.error = () => {};
        // Mock Materialize functions
        window.M = {
          Modal: { init: jest.fn() },
          Tooltip: { init: jest.fn() },
          toast: jest.fn()
        };
      }
    });
    
    document = dom.window.document;
    window = dom.window;
    global.window = window;
    global.document = document;
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('Constitution Vault - Authentication');
  });

  test('should have a navigation header', () => {
    const nav = document.querySelector('nav.blue.darken-3');
    expect(nav).not.toBeNull();
    
    const brandLogo = document.querySelector('.brand-logo');
    expect(brandLogo).not.toBeNull();
    expect(brandLogo.textContent).toBe('Constitution Vault');
    
    const adminLink = document.querySelector('.admin-in');
    expect(adminLink).not.toBeNull();
    expect(window.getComputedStyle(adminLink).display).toBe('none');
    
    const userLink = document.querySelector('.loggedIn');
    expect(userLink).not.toBeNull();
    expect(window.getComputedStyle(userLink).display).toBe('none');
  });

  test('should have the main authentication container', () => {
    const authContainer = document.querySelector('.auth-container');
    expect(authContainer).not.toBeNull();
    
    const logo = document.querySelector('.logo');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('alt')).toBe('Constitution Vault Logo');
    
    const title = document.querySelector('.auth-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Welcome to Constitution Vault');
  });

  test('should have authentication buttons', () => {
    const signInButton = document.getElementById('signInButton');
    expect(signInButton).not.toBeNull();
    expect(signInButton.textContent).toContain('Sign In with Google');
    expect(window.getComputedStyle(signInButton).display).not.toBe('none');
    
    const signOutButton = document.getElementById('signOutButton');
    expect(signOutButton).not.toBeNull();
    expect(signOutButton.textContent).toContain('Sign Out');
    expect(window.getComputedStyle(signOutButton).display).toBe('none');
  });

  test('should have loading spinner', () => {
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).not.toBeNull();
    expect(spinner.tagName).toBe('PROGRESS');
  });

  test('should have welcome message', () => {
    const message = document.getElementById('message');
    expect(message).not.toBeNull();
    expect(message.textContent).toContain('You have successfully signed in!');
    expect(window.getComputedStyle(message).display).toBe('none');
  });

  test('should have portal options section', () => {
    const portalOptions = document.getElementById('portal-options');
    expect(portalOptions).not.toBeNull();
    expect(window.getComputedStyle(portalOptions).display).toBe('none');
    
    const adminOption = document.getElementById('admin-option');
    expect(adminOption).not.toBeNull();
    expect(window.getComputedStyle(adminOption).display).toBe('none');
    expect(adminOption.querySelector('h5').textContent).toBe('Admin Portal');
    
    const userOption = document.getElementById('user-option');
    expect(userOption).not.toBeNull();
    expect(window.getComputedStyle(userOption).display).toBe('none');
    expect(userOption.querySelector('h5').textContent).toBe('User Portal');
  });

  test('should have admin modal dialog', () => {
    const adminModal = document.getElementById('modal-admin');
    expect(adminModal).not.toBeNull();
    expect(adminModal.classList.contains('modal')).toBe(true);
    
    const adminTitle = adminModal.querySelector('h4');
    expect(adminTitle).not.toBeNull();
    expect(adminTitle.textContent).toContain('Admin Access');
    
    const adminLinks = adminModal.querySelectorAll('a.btn-large');
    expect(adminLinks.length).toBe(2);
    expect(adminLinks[0].textContent).toContain('Admin Portal');
    expect(adminLinks[1].textContent).toContain('User Portal');
  });

  test('should have user modal dialog', () => {
    const userModal = document.getElementById('modal-users');
    expect(userModal).not.toBeNull();
    expect(userModal.classList.contains('modal')).toBe(true);
    
    const userTitle = userModal.querySelector('h4');
    expect(userTitle).not.toBeNull();
    expect(userTitle.textContent).toContain('User Portal');
  });

  test('should have a footer with copyright information', () => {
    const footer = document.querySelector('footer.page-footer');
    expect(footer).not.toBeNull();
    
    const copyright = footer.querySelector('.footer-copyright');
    expect(copyright).not.toBeNull();
    expect(copyright.textContent).toContain('© 2025 Constitution Vault');
  });

  test('should load required scripts', () => {
    const materializeScript = document.querySelector('script[src*="materialize.min.js"]');
    expect(materializeScript).not.toBeNull();
    
    const authScript = document.querySelector('script[src*="admin_sign_in.js"]');
    expect(authScript).not.toBeNull();
    expect(authScript.getAttribute('type')).toBe('module');
  });
});