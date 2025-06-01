/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '\\.mock\\.ts$'
  ],
  moduleNameMapper: {
    // Handle module aliases (if you have any in tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Setup files if needed
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    // Transform TypeScript files with ts-jest
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
