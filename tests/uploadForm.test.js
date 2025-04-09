const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Admin Upload Form in admin-add.html', () => {
  let document;
  
  beforeEach(() => {
    // Adjusting the path to read admin-add.html from the project root
    const html = fs.readFileSync(path.resolve(__dirname, '../admin-add.html'), 'utf8');
    const dom = new JSDOM(html);
    document = dom.window.document;
  });

  test('renders a file input with label "Document"', () => {
    const label = document.querySelector('label[for="file"]');
    const input = document.getElementById('file');
    
    expect(label).toBeTruthy();
    expect(label.textContent).toMatch(/document/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('file');
  });

  test('renders a text input for Title with label "Title"', () => {
    const label = document.querySelector('label[for="title"]');
    const input = document.getElementById('title');
    
    expect(label).toBeTruthy();
    expect(label.textContent).toMatch(/title/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('text');
  });

  test('renders a date input with label "Date"', () => {
    const label = document.querySelector('label[for="date"]');
    const input = document.getElementById('date');
    
    expect(label).toBeTruthy();
    expect(label.textContent).toMatch(/date/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('date');
  });

  test('renders a text input for Region with label "Region"', () => {
    const label = document.querySelector('label[for="region"]');
    const input = document.getElementById('region');
    
    expect(label).toBeTruthy();
    expect(label.textContent).toMatch(/region/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('text');
  });

  test('renders a text input for Type with label "Type"', () => {
    const label = document.querySelector('label[for="type"]');
    const input = document.getElementById('type');
    
    expect(label).toBeTruthy();
    expect(label.textContent).toMatch(/type/i);
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('text');
  });

  test('renders a submit button with text "Upload"', () => {
    const button = document.querySelector('button[type="submit"]');
    
    expect(button).toBeTruthy();
    expect(button.textContent).toMatch(/upload/i);
  });
});
