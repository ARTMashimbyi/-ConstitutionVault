// Polyfill for TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }
  
  // Other necessary polyfills
  if (typeof window !== 'undefined') {
    global.window = window;
    global.document = window.document;
    global.navigator = window.navigator;
  }
  
  // Mock for window.matchMedia
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };