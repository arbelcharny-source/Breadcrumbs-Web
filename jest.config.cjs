/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
      }
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};