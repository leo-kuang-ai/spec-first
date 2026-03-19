import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnabledExtensions } from '../../src/core/process-engine/extensions.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-extensions');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'extensions'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('loadEnabledExtensions', () => {
  it('should load enabled extension descriptors', () => {
    const extDir = join(TMP, '.spec-first', 'extensions', 'qa-pack');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'extension.yaml'), `
namespace: qa
version: 1.0.0
enabled: true
skills_dir: custom-skills
hooks:
  - type: Stop
    command: echo stop
`, 'utf-8');

    const items = loadEnabledExtensions(TMP);
    expect(items).toHaveLength(1);
    expect(items[0].namespace).toBe('qa');
    expect(items[0].version).toBe('1.0.0');
    expect(items[0].skillsDir).toContain('custom-skills');
    expect(items[0].hooks).toHaveLength(1);
  });

  it('should skip disabled or invalid extensions', () => {
    const disabledDir = join(TMP, '.spec-first', 'extensions', 'disabled-pack');
    mkdirSync(disabledDir, { recursive: true });
    writeFileSync(join(disabledDir, 'extension.yaml'), 'namespace: disabled\nversion: 1.0.0\nenabled: false\n', 'utf-8');

    const invalidDir = join(TMP, '.spec-first', 'extensions', 'invalid-pack');
    mkdirSync(invalidDir, { recursive: true });
    writeFileSync(join(invalidDir, 'extension.yaml'), 'namespace: ""\nversion: 1.0.0\n', 'utf-8');

    const items = loadEnabledExtensions(TMP);
    expect(items).toHaveLength(0);
  });
});

