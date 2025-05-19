module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy'
  },

  
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'clover'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.{js,jsx}',
      'public/**/*.{js,jsx}',
      '!src/**/*.test.{js,jsx}',
      '!src/setupTests.js',
      '!src/serviceWorker.js'
    ],
    coverageThreshold: {
      global: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
      }
    }
  
};