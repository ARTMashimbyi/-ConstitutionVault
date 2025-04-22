import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';
import { addDoc, getDocs, collection, query, where } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn()
}));

// Mock DOM elements before each test
beforeEach(() => {
  document.body.innerHTML = `
    <form id="uploadForm">
      <input name="fileType" value="PDF" />
      <input name="title" value="Test Title" />
      <input id="date" name="date" />
      <input name="institution" value="Test Institution" />
      <input name="author" value="Test Author" />
      <input name="category" value="History" />
      <input name="keywords" value="law, rights" />
      <input id="directory" name="directory" value="/folderA/folderB" />
      <button type="submit">Upload</button>
    </form>
    <div id="uploadStatus" style="display: none;"></div>
  `;

  jest.clearAllMocks();
  jest.useFakeTimers();
  global.window.location = { href: '' };
});

test('uploads document and creates directories if they do not exist', async () => {
  // Simulate empty directory response (directory doesn’t exist)
  getDocs.mockResolvedValueOnce({ empty: true }) // overall path
    .mockResolvedValueOnce({ empty: true }) // /folderA
    .mockResolvedValueOnce({ empty: true }); // /folderA/folderB

  // Mock addDoc for directory and document creation
  addDoc.mockResolvedValue({ id: 'doc1' });

  // Import and trigger the form submission
  require('./yourUploadFile.js'); // Replace with your actual file

  const form = document.getElementById('uploadForm');
  fireEvent.submit(form);

  // Let async finish
  await Promise.resolve();

  // Check that directories and document were added
  expect(addDoc).toHaveBeenCalledTimes(3); // folderA, folderB, and the final document
  expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    title: 'Test Title',
    fileType: 'PDF'
  }));

  // Check for upload success message
  const status = document.getElementById('uploadStatus');
  expect(status).toBeVisible();
  expect(status.textContent).toContain('Document uploaded successfully');

  // Check redirect after timeout
  jest.advanceTimersByTime(1500);
  expect(window.location.href).toBe('hierarcy.html');
});

test('shows error message on upload failure', async () => {
  getDocs.mockResolvedValueOnce({ empty: true });
  addDoc.mockRejectedValue(new Error('Firestore error'));

  require('../admin-add.js'); 
  const form = document.getElementById('uploadForm');
  fireEvent.submit(form);

  await Promise.resolve();

  const status = document.getElementById('uploadStatus');
  expect(status).toBeVisible();
  expect(status.textContent).toBe('Upload failed. Please try again.');
  expect(status.style.color).toBe('red');
});
