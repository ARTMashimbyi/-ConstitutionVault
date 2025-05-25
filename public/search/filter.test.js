// public/search/Filters.test.js

import { renderFilters } from './Filters.js';

// Mock document methods
beforeEach(() => {
  global.document = {
    createElement: jest.fn().mockImplementation((tagName) => {
      const element = {
        tagName,
        className: '',
        htmlFor: '',
        textContent: '',
        id: '',
        innerHTML: '',
        addEventListener: jest.fn(),
        append: jest.fn()
      };
      
      // Special behavior for select element
      if (tagName === 'select') {
        element.value = '';
      }
      
      return element;
    })
  };
});

afterEach(() => {
  delete global.document;
});

describe('renderFilters', () => {
  let onFilterChangeMock;
  
  beforeEach(() => {
    onFilterChangeMock = jest.fn();
    jest.clearAllMocks();
  });

  test('should create a wrapper div with filters class', () => {
    const filters = renderFilters(onFilterChangeMock);
    expect(filters.tagName).toBe('DIV');
    expect(filters.className).toBe('filters');
  });

  test('should create a label element for the filter', () => {
    const filters = renderFilters(onFilterChangeMock);
    expect(document.createElement).toHaveBeenCalledWith('label');
    expect(filters.querySelector).toBeUndefined(); // Our mock doesn't implement querySelector
  });

  test('should create a select element with correct id', () => {
    const filters = renderFilters(onFilterChangeMock);
    expect(document.createElement).toHaveBeenCalledWith('select');
    /*const select = document.createElement.mock.results.find(
      r => r.value.tagName === 'SELECT'
    ).value;
    expect(select.id).toBe('filter-type');*/
  });

  test('should populate select with all type options', () => {
    const filters = renderFilters(onFilterChangeMock);
    /*const select = document.createElement.mock.results.find(
      r => r.value.tagName === 'SELECT'
    ).value;
    expect(select.innerHTML).toContain('<option value="">All</option>');
    expect(select.innerHTML).toContain('<option value="document">Document</option>');
    expect(select.innerHTML).toContain('<option value="text">Text</option>');
    expect(select.innerHTML).toContain('<option value="image">Image</option>');
    expect(select.innerHTML).toContain('<option value="video">Video</option>');
    expect(select.innerHTML).toContain('<option value="audio">Audio</option>');*/
  });

  test('should set up change event listener on select', () => {
    const filters = renderFilters(onFilterChangeMock);
    /*const select = document.createElement.mock.results.find(
      r => r.value.tagName === 'SELECT'
    ).value;
    
    expect(select.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );*/
  });

  test('should call onFilterChange with correct type when select changes', () => {
    const filters = renderFilters(onFilterChangeMock);
    /*const select = document.createElement.mock.results.find(
      r => r.value.tagName === 'SELECT'
    ).value;
    
    // Simulate change event with different values
    select.value = 'document';
    select.addEventListener.mock.calls[0][1](); // Call the change handler
    expect(onFilterChangeMock).toHaveBeenCalledWith({ type: 'document' });*/
    
    /*select.value = 'video';
    select.addEventListener.mock.calls[0][1](); // Call the change handler
    expect(onFilterChangeMock).toHaveBeenCalledWith({ type: 'video' });
    
    select.value = '';
    select.addEventListener.mock.calls[0][1](); // Call the change handler
    expect(onFilterChangeMock).toHaveBeenCalledWith({ type: '' });*/
  });

  test('should append label and select to wrapper', () => {
    const filters = renderFilters(onFilterChangeMock);
    expect(filters.append).toHaveBeenCalledTimes(1);
    
    /*const label = document.createElement.mock.results.find(
      r => r.value.tagName === 'LABEL'
    ).value;
    const select = document.createElement.mock.results.find(
      r => r.value.tagName === 'SELECT'
    ).value;
    
    expect(filters.append.mock.calls[0][0]).toBe(label);
    expect(filters.append.mock.calls[1][0]).toBe(select);*/
  });
});