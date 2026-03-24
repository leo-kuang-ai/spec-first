import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_REFS = join(import.meta.dirname, '../../skills/00-first/references');
const BUNDLE_README = join(
  import.meta.dirname,
  '../../docs/review-bundles/2026-03-20-first-subagent/README.md'
);

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-first evidence pack and bundle contract', () => {
  it('describes the evidence pack as a structured handoff', () => {
    const spec = read(join(FIRST_REFS, 'main-thread-and-evidence-contract.md'));
    expect(spec).toContain('manifest.json');
    expect(spec).toContain('shared/');
    expect(spec).toContain('runtime/');
    expect(spec).toContain('docs/');
    expect(spec).toContain('主线程只发包,不发长证据');
  });

  it('defines shared summary as a skill-layer execution artifact', () => {
    const spec = read(join(FIRST_REFS, 'main-thread-and-evidence-contract.md'));
    expect(spec).toContain('shared/summary.json');
    expect(spec).toContain('serena_available');
    expect(spec).toContain('Skill 层执行产物');
  });

  it('keeps the review bundle focused on design and implementation only', () => {
    const readme = read(BUNDLE_README);
    expect(readme).toContain('设计与实施说明');
    expect(readme).toContain('canonical source');
    expect(readme).toContain('skills/00-first/references/main-thread-and-evidence-contract.md');
    expect(readme).toContain('skills/00-first/references/execution-and-agent-architecture.md');
  });
});
