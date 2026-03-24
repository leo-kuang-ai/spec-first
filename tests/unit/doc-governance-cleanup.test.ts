import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../skills/spec-first');

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

describe('doc governance cleanup', () => {
  it('removes legacy skill names from governance docs', () => {
    const docs = [
      read('README.md'),
      read('SHARED.md'),
      read('AGENTS.md'),
      read('00-onboarding/references/scenario-mapping.md'),
      read('03-spec/references/constitution-authority.md'),
      read('01-init/references/prerequisites.md'),
      read('02-catchup/SKILL.md'),
      read('02-catchup/references/context-recovery-guide.md'),
    ].join('\n');

    expect(docs).not.toContain('/spec-first:test');
    expect(docs).not.toContain('08-code-review');
    expect(docs).not.toContain('17-feature-list');
    expect(docs).not.toContain('18-feature-switch');
    expect(docs).not.toContain('19-feature-current');
  });
});
