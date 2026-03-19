import { beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerAIHooks } from '../../src/core/tool-integration/ai-runtime-hook.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-ai-hook-extension-security');

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, '.claude'), { recursive: true });
});

describe('ai runtime hook extension security', () => {
  it('should register extension hooks through managed script instead of inline shell interpolation', () => {
    const extDir = join(TMP, '.spec-first', 'extensions', 'qa-pack');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(
      join(extDir, 'extension.yaml'),
      `
namespace: qa
version: 1.0.0
enabled: true
hooks:
  - type: Stop
    command: echo ext-stop
`,
      'utf-8'
    );

    registerAIHooks(TMP);

    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    const stopEntries = settings.hooks.Stop as Array<{ hooks: Array<{ command: string }> }>;
    const extCommand = stopEntries.find((entry) =>
      entry.hooks[0].command.includes('extension-hook')
    )?.hooks[0].command;

    expect(extCommand).toBeTruthy();
    expect(extCommand).not.toContain('SPEC_FIRST_EXTENSION_NAMESPACE=qa');
    expect(extCommand).not.toContain('echo ext-stop');
    expect(readFileSync(join(TMP, '.spec-first', 'hooks', 'extension-hook.mjs'), 'utf-8')).toContain(
      'SPEC_FIRST_EXTENSION_NAMESPACE'
    );
  });
});
