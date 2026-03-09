import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256Hex } from '../../src/shared/crypto-utils.js';

const PROJECT_ROOT = join(import.meta.dirname, '../..');

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(join(PROJECT_ROOT, relativePath), 'utf8'));
}

describe('checked-in first runtime assets', () => {
  it('keeps summary, role views, and stage views in canonical shape', () => {
    const summary = readJson('.spec-first/runtime/first/summary.json');
    const roleViews = readJson('.spec-first/runtime/first/role-views.json');
    const stageViews = readJson('.spec-first/runtime/first/stage-views.json');

    expect(summary.generatedAt).toBeTypeOf('string');
    expect(summary.techStack).toEqual(expect.any(Array));

    expect(roleViews).toHaveProperty('product');
    expect(roleViews).toHaveProperty('dev');
    expect(roleViews).not.toHaveProperty('roles');
    expect(roleViews).not.toHaveProperty('generated_at');
    expect(roleViews).not.toHaveProperty('healthy');

    expect(stageViews).toHaveProperty('spec');
    expect(stageViews).toHaveProperty('design');
    expect(stageViews).not.toHaveProperty('stages');
    expect(stageViews).not.toHaveProperty('generated_at');
    expect(stageViews).not.toHaveProperty('healthy');
  });

  it('keeps runtime index hashes aligned with checked-in files', () => {
    const index = readJson('.spec-first/runtime/first/index.json');

    expect(index.summary.fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, '.spec-first/runtime/first/summary.json'), 'utf8')));
    expect(index.roleViews.fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, '.spec-first/runtime/first/role-views.json'), 'utf8')));
    expect(index.stageViews.fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, '.spec-first/runtime/first/stage-views.json'), 'utf8')));
    expect(index.docsProjection['docs/first/README.md'].fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, 'docs/first/README.md'), 'utf8')));
    expect(index.docsProjection['docs/first/summary.md'].fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, 'docs/first/summary.md'), 'utf8')));
    expect(index.docsProjection['docs/first/role-views.md'].fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, 'docs/first/role-views.md'), 'utf8')));
    expect(index.docsProjection['docs/first/stage-views.md'].fileHash).toBe(sha256Hex(readFileSync(join(PROJECT_ROOT, 'docs/first/stage-views.md'), 'utf8')));
  });
});
