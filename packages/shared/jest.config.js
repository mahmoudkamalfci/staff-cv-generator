import baseConfig from '@cv-generator/config/jest-config';

/** @type {import('jest').Config} */
export default {
  ...baseConfig,
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/**/*.d.ts'],
};
