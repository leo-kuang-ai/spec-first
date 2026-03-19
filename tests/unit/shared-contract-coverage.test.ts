import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHARED_CONTRACT_COVERAGE } from './shared-contract-coverage.data.js';

const ROOT = join(import.meta.dirname, '../../');

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf-8');
}

describe('shared contract coverage registry', () => {
  it('should not contain duplicate contract-target pairs', () => {
    const keys = SHARED_CONTRACT_COVERAGE.map(item => `${item.contractName}:${item.targetPath}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('should point only to existing contracts and targets', () => {
    for (const item of SHARED_CONTRACT_COVERAGE) {
      expect(existsSync(join(ROOT, item.contractPath)), item.contractPath).toBe(true);
      expect(existsSync(join(ROOT, item.targetPath)), item.targetPath).toBe(true);
    }
  });

  it('should keep declared consumers aligned with shared contracts', () => {
    for (const item of SHARED_CONTRACT_COVERAGE) {
      const content = read(item.targetPath);
      for (const token of item.mustContain) {
        expect(content, `${item.targetPath} should contain ${token}`).toContain(token);
      }
    }
  });
});
