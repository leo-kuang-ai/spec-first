import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyProjectMaturity,
  detectPlatformType,
} from '../../src/core/skill-runtime/first-platform-detector.js';

const TEST_DIR = join(import.meta.dirname, '../fixtures/first-platform-detector');

describe('first-platform-detector', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('detect backend via go.mod', () => {
    writeFileSync(join(TEST_DIR, 'go.mod'), 'module example.com/demo\n', 'utf-8');
    const result = detectPlatformType(TEST_DIR);
    expect(result.type).toBe('backend');
  });

  it('detect frontend/admin via package.json deps', () => {
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify({
        name: 'web-admin',
        dependencies: { react: '^18.0.0', antd: '^5.0.0' },
      }),
      'utf-8',
    );
    const result = detectPlatformType(TEST_DIR);
    expect(result.type).toBe('frontend');
    expect(result.subType).toBe('admin');
  });

  it('detect mixed when backend and frontend coexist', () => {
    writeFileSync(join(TEST_DIR, 'pom.xml'), '<project/>', 'utf-8');
    writeFileSync(
      join(TEST_DIR, 'package.json'),
      JSON.stringify({ dependencies: { vue: '^3.0.0' } }),
      'utf-8',
    );
    const result = detectPlatformType(TEST_DIR);
    expect(result.type).toBe('mixed');
  });

  it('detect monorepo via pnpm-workspace.yaml', () => {
    writeFileSync(join(TEST_DIR, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n', 'utf-8');
    const result = detectPlatformType(TEST_DIR);
    expect(result.type).toBe('monorepo');
  });

  it('classify greenfield for readme-only project', () => {
    writeFileSync(join(TEST_DIR, 'README.md'), '# hello\n', 'utf-8');
    expect(classifyProjectMaturity(TEST_DIR)).toBe('greenfield');
  });

  it('classify brownfield when code files are abundant', () => {
    const src = join(TEST_DIR, 'src');
    mkdirSync(src, { recursive: true });
    for (let i = 0; i < 55; i += 1) {
      writeFileSync(join(src, `f${i}.ts`), `export const n${i} = ${i};\n`, 'utf-8');
    }
    expect(classifyProjectMaturity(TEST_DIR)).toBe('brownfield');
  });
});
