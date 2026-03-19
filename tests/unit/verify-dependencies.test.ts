import { describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

describe('verify existing dependencies for init refactoring', () => {
  describe('classifyProjectMaturity function', () => {
    it('should exist in first-platform-detector.ts', async () => {
      const detectorModule = await import('../../src/core/skill-runtime/first-platform-detector.js');

      expect(typeof detectorModule.classifyProjectMaturity).toBe('function');

      // Call with real path to verify it doesn't throw
      const result = detectorModule.classifyProjectMaturity('/tmp');
      expect(['greenfield', 'brownfield']).toContain(result);
    });

    it('should handle empty directory as greenfield', async () => {
      const detectorModule = await import('../../src/core/skill-runtime/first-platform-detector.js');
      const emptyDir = join(os.tmpdir(), `test-greenfield-${Date.now()}`);
      mkdirSync(emptyDir, { recursive: true });

      try {
        const result = detectorModule.classifyProjectMaturity(emptyDir);
        expect(result).toBe('greenfield');
      } finally {
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('handleFirst function', () => {
    it('should exist in first.ts', async () => {
      const firstModule = await import('../../src/cli/commands/first.js');

      expect(firstModule.handleFirst).toBeDefined();
      expect(typeof firstModule.handleFirst).toBe('function');
    });
  });

  describe('detectPlatformType function', () => {
    it('should exist and return PlatformType detection result', async () => {
      const detectorModule = await import('../../src/core/skill-runtime/first-platform-detector.js');

      expect(typeof detectorModule.detectPlatformType).toBe('function');

      const result = detectorModule.detectPlatformType('/tmp');
      expect(result).toHaveProperty('type');
    });
  });
});
