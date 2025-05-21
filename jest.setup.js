import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder polyfills
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add other missing browser APIs
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();