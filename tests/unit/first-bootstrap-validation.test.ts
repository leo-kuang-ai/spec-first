import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
import { seedFirstRuntimeOutputs } from '../helpers/first-runtime-fixture.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-bootstrap-validation');

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('first bootstrap validation', () => {
  it('validates final runtime and docs outputs', () => {
    seedFirstRuntimeOutputs(TMP, 'bootstrap-validation');

    const result = bootstrapFirstRuntime(TMP);

    expect(result.source).toBe('validated');
    expect(result.summary.project.name).toBe('bootstrap-validation');
    expect(result.runtimeArtifacts).toContain('summary.json');
    expect(result.docsOutputs).toContain('docs/first/README.md');
  });

  it('fails when final runtime outputs are missing', () => {
    expect(() => bootstrapFirstRuntime(TMP)).toThrow('first runtime 校验失败');
  });
});
