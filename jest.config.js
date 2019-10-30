module.exports = {
  'testEnvironment': 'node',
  verbose: true,
  'collectCoverageFrom': [
    'src/**/*.js',
    '!**/migrations/**'
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
    '<rootDir>/integration-tests',
    '<rootDir>/e2e'
  ],
  'testMatch': [
    '**/?(*.)(spec|test).js?(x)',
    '**/tests/**'
  ],
}
