import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('Admin Upload Page', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Load the HTML file
    const html = fs.readFileSync(path.resolve(__dirname, '../admin/admin-add.html'), 'utf8');
    
    // Initialize JSDOM
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      url: 'http://localhost',
      beforeParse(window) {
        window.URL.createObjectURL = jest.fn();
        window.console.error = () => {};
      }
    });
    
    document = dom.window.document;
    window = dom.window;
    global.window = window;
    global.document = document;
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('ConstitutionVault | Admin Upload');
  });

  test('should have a header with back navigation', () => {
    const header = document.querySelector('header');
    expect(header).not.toBeNull();
    
    const backLink = header.querySelector('.back-arrow');
    expect(backLink).not.toBeNull();
    expect(backLink.getAttribute('href')).toBe('hierarcy.html');
    
    const title = header.querySelector('h1');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('ConstitutionVault Admin Portal');
  });

  test('should have the main upload form', () => {
    const form = document.getElementById('uploadForm');
    expect(form).not.toBeNull();
    expect(form.getAttribute('enctype')).toBe('multipart/form-data');
    
    const fieldset = form.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    expect(fieldset.querySelector('legend').textContent).toBe('Add File');
  });

  test('should have file type selection dropdown', () => {
    const select = document.getElementById('fileType');
    expect(select).not.toBeNull();
    expect(select.required).toBe(true);
    
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(5);
    expect(options[0].value).toBe('document');
    expect(options[0].textContent).toBe('Document/PDF');
    expect(options[4].value).toBe('text');
    expect(options[4].textContent).toBe('Text');
  });

  test('should have file upload controls', () => {
    const fileContainer = document.querySelector('.file-container');
    expect(fileContainer).not.toBeNull();
    
    const fileInput = document.getElementById('file');
    expect(fileInput).not.toBeNull();
    expect(fileInput.type).toBe('file');
    
    const maxSizeNote = document.querySelector('.max-size-note');
    expect(maxSizeNote).not.toBeNull();
    expect(maxSizeNote.textContent).toContain('Maximum file size allowed: 100 MB');
  });

  test('should have required metadata fields', () => {
    const requiredFields = [
      { id: 'title', type: 'text' },
      { id: 'directory', type: 'text' }
    ];
    
    requiredFields.forEach(field => {
      const input = document.getElementById(field.id);
      expect(input).not.toBeNull();
      expect(input.type).toBe(field.type);
      expect(input.required).toBe(true);
    });
  });

  test('should have optional metadata fields', () => {
    const optionalFields = [
      { id: 'institution', type: 'text' },
      { id: 'author', type: 'text' },
      { id: 'category', type: 'text' },
      { id: 'keywords', type: 'text' }
    ];
    
    optionalFields.forEach(field => {
      const input = document.getElementById(field.id);
      expect(input).not.toBeNull();
      expect(input.type).toBe(field.type);
      expect(input.required).toBe(false);
    });
  });

  test('should have upload status message area', () => {
    const status = document.getElementById('uploadStatus');
    expect(status).not.toBeNull();
    expect(window.getComputedStyle(status).display).toBe('none');
  });

  test('should have a footer', () => {
    const footer = document.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('© 2025 ConstitutionVault');
  });
});