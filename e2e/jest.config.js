module.exports = {
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testRunner: 'jest-circus/runner',
  maxWorkers: 1,
  testTimeout: 120000,
  testMatch: ['**/*.e2e.js'],
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
};
