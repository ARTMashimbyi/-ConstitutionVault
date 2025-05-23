import { renderSearchResults } from './SearchResults.js';

describe('renderSearchResults', () => {
  let container;

  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(container);
    container = null;
  });

  test('should clear container before rendering', () => {
    // Add some initial content
    container.innerHTML = '<div class="existing-content">Test</div>';
    
    renderSearchResults(container, []);
    
    expect(container.querySelector('.existing-content')).toBeNull();
  });

  test('should display no results message when empty array provided', () => {
    renderSearchResults(container, []);
    
    const noResultsMsg = container.querySelector('.no-results');
    expect(noResultsMsg).not.toBeNull();
    expect(noResultsMsg.textContent).toBe('No results found.');
  });

  test('should display no results message when non-array input provided', () => {
    renderSearchResults(container, null);
    
    const noResultsMsg = container.querySelector('.no-results');
    expect(noResultsMsg).not.toBeNull();
    expect(noResultsMsg.textContent).toBe('No results found.');
  });

  test('should render basic result with title', () => {
    const results = [{
      title: 'Test Document',
      url: '/test.pdf',
      fileType: 'document'
    }];
    
    renderSearchResults(container, results);
    
    const resultArticle = container.querySelector('article.search-result');
    expect(resultArticle).not.toBeNull();
    
    const title = resultArticle.querySelector('h3');
    expect(title.textContent).toBe('Test Document');
    
    const viewLink = resultArticle.querySelector('footer a');
    expect(viewLink.href).toContain('/test.pdf');
    expect(viewLink.textContent).toBe('View in Full');
  });

  test('should render all metadata fields when provided', () => {
    const results = [{
      title: 'Test Document',
      url: '/test.pdf',
      fileType: 'document',
      author: 'John Doe',
      institution: 'Test University',
      category: 'Research Paper',
      keywords: ['test', 'research'],
      description: 'This is a test document',
      snippet: '...test document snippet...'
    }];
    
    renderSearchResults(container, results);
    
    const resultArticle = container.querySelector('article.search-result');
    
    // Check metadata
    const metadata = resultArticle.querySelector('small');
    expect(metadata.textContent).toContain('By John Doe');
    expect(metadata.textContent).toContain('Test University');
    expect(metadata.textContent).toContain('Category: Research Paper');
    expect(metadata.textContent).toContain('Keywords: test, research');
    
    // Check description
    const description = resultArticle.querySelector('p:not(.result-snippet)');
    expect(description.textContent).toBe('This is a test document');
    
    // Check snippet
    const snippet = resultArticle.querySelector('.result-snippet');
    expect(snippet.textContent).toBe('...test document snippet...');
  });

  test('should render image preview correctly', () => {
    const results = [{
      title: 'Test Image',
      url: '/test.jpg',
      fileType: 'image'
    }];
    
    renderSearchResults(container, results);
    
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.src).toContain('/test.jpg');
    expect(img.alt).toBe('Test Image');
    expect(img.loading).toBe('lazy');
  });

  test('should render audio preview correctly', () => {
    const results = [{
      title: 'Test Audio',
      url: '/test.mp3',
      fileType: 'audio'
    }];
    
    renderSearchResults(container, results);
    
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio.src).toContain('/test.mp3');
    expect(audio.controls).toBe(true);
  });

  test('should render video preview correctly', () => {
    const results = [{
      title: 'Test Video',
      url: '/test.mp4',
      fileType: 'video'
    }];
    
    renderSearchResults(container, results);
    
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.src).toContain('/test.mp4');
    expect(video.controls).toBe(true);
  });

  test('should render document preview correctly', () => {
    const results = [{
      title: 'Test PDF',
      url: '/test.pdf',
      fileType: 'document'
    }];
    
    renderSearchResults(container, results);
    
    const embed = container.querySelector('embed');
    expect(embed).not.toBeNull();
    expect(embed.src).toContain('/test.pdf#page=1&view=FitH');
    expect(embed.type).toBe('application/pdf');
    expect(embed.width).toBe('100%');
    expect(embed.height).toBe('400px');
  });

  test('should render multiple results', () => {
    const results = [
      {
        title: 'Document 1',
        url: '/doc1.pdf',
        fileType: 'document'
      },
      {
        title: 'Document 2',
        url: '/doc2.pdf',
        fileType: 'document'
      }
    ];
    
    renderSearchResults(container, results);
    
    const articles = container.querySelectorAll('article.search-result');
    expect(articles.length).toBe(2);
    
    const titles = container.querySelectorAll('h3');
    expect(titles[0].textContent).toBe('Document 1');
    expect(titles[1].textContent).toBe('Document 2');
  });
});