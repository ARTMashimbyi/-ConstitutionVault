/**
 * @jest-environment jsdom
 */
import { uploadFormHandler } from "../admin/admin-add";
import { addDoc, collection, getDocs, query, where, getFirestore } from "firebase/firestore";

// Mock Firebase functions
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ empty: true })),
  addDoc: jest.fn(() => Promise.resolve({ id: "mock-id" })),
}));

// Mock FormData and related elements
const createMockEvent = () => {
  const mockFormData = {
    get: jest.fn((key) => {
      switch (key) {
        case "title": return "Test Document";
        case "fileType": return "PDF";
        case "author": return "Jane Doe";
        case "institution": return "Test University";
        case "keywords": return "constitution, law";
        case "category": return "Law";
        case "directory": return "/test/path"; // ✅ Critical fix
        case "file": return new File(["dummy content"], "test.pdf", { type: "application/pdf" });
        default: return "";
      }
    })
  };

  const mockEvent = {
    preventDefault: jest.fn(),
    target: {
      reset: jest.fn(),
    },
  };

  // Mock global FormData to return our mockFormData
  global.FormData = jest.fn(() => mockFormData);

  return { mockEvent, mockFormData };
};

describe("uploadFormHandler", () => {
  it("should create missing directories and upload metadata", async () => {
    // Mock the date input element before test execution
    const dateInput = document.createElement('input');
    dateInput.setAttribute('type', 'date');
    document.body.appendChild(dateInput); // Append it to the DOM for the test

    // Simulate setting the date input value
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    dateInput.value = formattedDate; // Safely set the value

    const { mockEvent } = createMockEvent();
    
    await uploadFormHandler(mockEvent);

    // Wait for all async operations to finish
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check that the addDoc function was called with the correct arguments
    expect(addDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      title: "Test Document",
      fileType: "PDF",
      author: "Jane Doe",
      institution: "Test University",
      keywords: ["constitution", "law"],
      category: "Law",
      directory: "/test/path",
    }));
  });
});
