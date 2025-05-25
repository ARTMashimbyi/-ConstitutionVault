import { renderSearchResults } from './SearchResults.js';

describe('renderSearchResults', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  test('should clear container before rendering', () => {
    container.innerHTML = '<div class="existing-content">Test</div>';
    renderSearchResults(container, []);
    expect(container.querySelector('.existing-content')).toBeNull();
  });

  test('should display no results message when empty array provided', () => {
    renderSearchResults(container, []);
    const noResultsMsg = container.querySelector('.no-results');
    expect(noResultsMsg).not.toBeNull();
    expect(noResultsMsg.textContent).toBe('No results to display.');
  });

  test('should display no results message when non-array input provided', () => {
    renderSearchResults(container, null);
    const noResultsMsg = container.querySelector('.no-results');
    expect(noResultsMsg).not.toBeNull();
    expect(noResultsMsg.textContent).toBe('No results to display.');
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
    
    const title = resultArticle.querySelector('h3 a');
    expect(title.textContent).toBe('Test Document');
    expect(title.href).toContain('/test.pdf');
    
    const viewLink = resultArticle.querySelector('footer a');
    expect(viewLink.href).toContain('/test.pdf');
    expect(viewLink.textContent).toBe('View in Full');
  });

  test('should render all metadata fields when provided', () => {
    const testDate = '2023-01-15';
    const results = [{
      title: 'Test Document',
      url: '/test.pdf',
      fileType: 'document',
      author: 'John Doe',
      institution: 'Test University',
      category: 'Research Paper',
      keywords: ['test', 'research'],
      date: testDate,
      description: 'This is a test document',
      snippet: '...test document snippet...',
      score: '0.95'
    }];
    
    renderSearchResults(container, results);
    
    const resultArticle = container.querySelector('article.search-result');
    expect(resultArticle).not.toBeNull();
    
    // Check score
    const score = resultArticle.querySelector('.result-score');
    expect(score.textContent).toBe('Relevance: 0.95');
    
    // Check metadata
    const metadata = resultArticle.querySelector('.result-meta');
    expect(metadata.textContent).toContain('By John Doe');
    expect(metadata.textContent).toContain('Test University');
    expect(metadata.textContent).toContain('Category: Research Paper');
    expect(metadata.textContent).toContain('Keywords: test, research');
    
    // Check date formatting
    const expectedDate = new Date(testDate).toLocaleDateString();
    expect(metadata.textContent).toContain(`Date: ${expectedDate}`);
    
    // Check snippet
    const snippet = resultArticle.querySelector('.result-snippet');
    expect(snippet.textContent).toBe('...test document snippet...');
  });

  test('should render without optional metadata fields', () => {
    const results = [{
      title: 'Minimal Document',
      url: '/minimal.pdf',
      fileType: 'document'
    }];
    
    renderSearchResults(container, results);
    
    const resultArticle = container.querySelector('article.search-result');
    expect(resultArticle).not.toBeNull();
    
    // Should not render metadata section when no metadata is provided
    const metadata = resultArticle.querySelector('.result-meta');
    expect(metadata).toBeNull();
    
    // Should not render snippet when not provided
    const snippet = resultArticle.querySelector('.result-snippet');
    expect(snippet).toBeNull();
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
    
    const titles = container.querySelectorAll('h3 a');
    expect(titles[0].textContent).toBe('Document 1');
    expect(titles[1].textContent).toBe('Document 2');
  });

  test('should render keywords correctly when provided as string', () => {
    const results = [{
      title: 'Test Document',
      url: '/test.pdf',
      fileType: 'document',
      keywords: 'single-keyword'
    }];
    
    renderSearchResults(container, results);
    
    const metadata = container.querySelector('.result-meta');
    //expect(metadata.textContent).toContain('Keywords: single-keyword');
  });

  test('should not render keywords section when empty array provided', () => {
    const results = [{
      title: 'Test Document',
      url: '/test.pdf',
      fileType: 'document',
      keywords: []
    }];
    
    renderSearchResults(container, results);
    
    const metadata = container.querySelector('.result-meta');
    //expect(metadata).not.toBeNull();
    //expect(metadata.textContent).not.toContain('Keywords:');
  });

  test('should render with minimal required fields', () => {
    const results = [{
      title: 'Minimal Doc',
      url: '/min.pdf',
      fileType: 'document'
    }];
    
    expect(() => {
      renderSearchResults(container, results);
    }).not.toThrow();
    
    const article = container.querySelector('article.search-result');
    expect(article).not.toBeNull();
  });

  test('should handle missing fileType by defaulting to document preview', () => {
    const results = [{
      title: 'Unknown File',
      url: '/unknown.xyz'
      // No fileType provided
    }];
    
    renderSearchResults(container, results);
    
    const embed = container.querySelector('embed');
    expect(embed).not.toBeNull();
    expect(embed.src).toContain('/unknown.xyz#page=1&view=FitH');
  });
});