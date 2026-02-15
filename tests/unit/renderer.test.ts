import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderTemplate, renderToString } from '../../src/core/template/renderer.js';
import type { TemplateContext } from '../../src/core/template/renderer.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-renderer');
const TPL_DIR = join(TMP, 'templates', 'init');

const CTX: TemplateContext = {
  featureId: 'FSREQ-20260211-AUTH-001',
  title: 'User Auth',
  mode: 'N',
  size: 'S',
  platforms: ['backend'],
  timestamp: '2026-02-11T00:00:00.000Z',
  author: 'Leo',
};

beforeEach(() => {
  mkdirSync(TPL_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('renderTemplate', () => {
  it('should render template and write to file', () => {
    writeFileSync(join(TPL_DIR, 'test.md.hbs'), '# {{title}}\nFeature: {{featureId}}\n', 'utf-8');
    const outPath = join(TMP, 'output', 'test.md');
    const written = renderTemplate('init/test.md', CTX, outPath, TMP);
    expect(written).toBe(true);
    const content = readFileSync(outPath, 'utf-8');
    expect(content).toContain('# User Auth');
    expect(content).toContain('FSREQ-20260211-AUTH-001');
  });

  it('should skip when file already exists', () => {
    writeFileSync(join(TPL_DIR, 'test.md.hbs'), '# {{title}}\n', 'utf-8');
    const outPath = join(TMP, 'output', 'test.md');
    mkdirSync(join(TMP, 'output'), { recursive: true });
    writeFileSync(outPath, 'existing content', 'utf-8');
    const written = renderTemplate('init/test.md', CTX, outPath, TMP);
    expect(written).toBe(false);
    expect(readFileSync(outPath, 'utf-8')).toBe('existing content');
  });

  it('should throw when template not found', () => {
    const outPath = join(TMP, 'output', 'missing.md');
    expect(() => renderTemplate('init/missing.md', CTX, outPath, TMP))
      .toThrow(/not found/);
  });
});

describe('renderToString', () => {
  it('should render template to string without writing', () => {
    writeFileSync(join(TPL_DIR, 'inline.hbs'), 'Hello {{author}}!', 'utf-8');
    const result = renderToString('init/inline', CTX, TMP);
    expect(result).toBe('Hello Leo!');
  });
});
