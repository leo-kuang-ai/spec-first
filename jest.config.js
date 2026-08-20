'use strict';

module.exports = {
  setupFiles: ['<rootDir>/tests/jest-setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/.worktrees/',
    '<rootDir>/.agents/',
    '<rootDir>/.claude/',
    '<rootDir>/.codex/',
    '<rootDir>/.spec-first/',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.worktrees/',
    '<rootDir>/.agents/',
    '<rootDir>/.claude/',
    '<rootDir>/.codex/',
    '<rootDir>/.spec-first/',
    '<rootDir>/tests/fixtures/ai-dev-benchmarks/',
    '<rootDir>/skills/.*/evals/fixtures/repos/',
  ],
};
