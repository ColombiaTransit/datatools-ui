module.exports = {
  testMatch: ['<rootDir>/__tests__/end-to-end.js'],
  testEnvironment: '<rootDir>/__tests__/test-utils/e2e-environment.js',
  transform: {
    '^.+\\.js$': '<rootDir>/__tests__/test-utils/transform-e2e.js'
  }
}
