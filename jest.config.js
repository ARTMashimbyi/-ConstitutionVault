module.exports = {
    testEnvironment: "jest-environment-jsdom",
   
    transform: {
        '^.+\\.js$': 'babel-jest', // Ensure Babel transforms JavaScript files
      },
      testEnvironment: 'jsdom', // Set the test environment to jsdom
  };
  