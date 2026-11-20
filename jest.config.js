module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.superpowers/'],
};
