'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const packages = [
  {
    name: 'spec-app-consistency-audit',
    sources: ['skills/spec-app-consistency-audit/SKILL.md'],
  },
  {
    name: 'spec-brainstorm',
    sources: ['skills/spec-brainstorm/SKILL.md'],
  },
  {
    name: 'spec-compound',
    sources: ['skills/spec-compound/SKILL.md'],
  },
  {
    name: 'spec-compound-refresh',
    sources: ['skills/spec-compound-refresh/SKILL.md'],
  },
  {
    name: 'spec-explain',
    sources: ['skills/spec-explain/SKILL.md'],
  },
  {
    name: 'spec-ideate',
    sources: [
      'skills/spec-ideate/SKILL.md',
      'skills/spec-ideate/references/post-ideation-workflow.md',
      'skills/spec-ideate/references/universal-ideation.md',
    ],
  },
  {
    name: 'spec-optimize',
    sources: ['skills/spec-optimize/SKILL.md'],
  },
  {
    name: 'spec-pov',
    sources: ['skills/spec-pov/SKILL.md'],
  },
  {
    name: 'spec-resolve-pr-feedback',
    sources: [
      'skills/spec-resolve-pr-feedback/SKILL.md',
      'skills/spec-resolve-pr-feedback/references/full-mode.md',
      'skills/spec-resolve-pr-feedback/references/targeted-mode.md',
    ],
  },
  {
    name: 'spec-riffrec-feedback-analysis',
    sources: [
      'skills/spec-riffrec-feedback-analysis/SKILL.md',
      'skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md',
    ],
  },
  {
    name: 'spec-simplify-code',
    sources: ['skills/spec-simplify-code/SKILL.md'],
  },
  {
    name: 'spec-sweep',
    sources: ['skills/spec-sweep/SKILL.md'],
  },
];

const existingQualifiedPackages = [
  {
    name: 'spec-code-review',
    sources: ['skills/spec-code-review/SKILL.md'],
  },
  {
    name: 'spec-debug',
    sources: ['skills/spec-debug/SKILL.md'],
  },
  {
    name: 'spec-doc-review',
    sources: ['skills/spec-doc-review/SKILL.md'],
  },
  {
    name: 'spec-plan',
    sources: [
      'skills/spec-plan/SKILL.md',
      'skills/spec-plan/references/deepening-workflow.md',
    ],
  },
  {
    name: 'spec-prd',
    sources: ['skills/spec-prd/references/product-expert-lens.md'],
  },
  {
    name: 'spec-work',
    sources: [
      'skills/spec-work/SKILL.md',
      'skills/spec-work/references/execution-strategy.md',
    ],
  },
];

describe('generic dispatch authorization matrix', () => {
  test.each(packages)('$name has package-local authorization and fallback', ({ sources }) => {
    const source = sources.map(read).join('\n');

    expect(source).toContain('worker_dispatch_authorization');
    expect(source).toContain('worker_dispatch_capability');
    expect(source).toContain('dispatch_authorization_missing');
    expect(source).toContain('subagent_capability_missing');
    expect(source).toContain('workflow invocation does not authorize dispatch');
    expect(source).toMatch(/inline|serial/i);
  });

  test.each(existingQualifiedPackages)('$name retains the qualified authorization baseline', ({ sources }) => {
    const source = sources.map(read).join('\n');

    expect(source).toContain('dispatch_authorization_missing');
    expect(source).toMatch(/subagent_capability_missing|dispatch_unavailable|capability failure/i);
    expect(source).toMatch(/explicit.*(?:user|current-user|upstream|parent-workflow).*authoriz/is);
    expect(source).toMatch(/inline|serial|sequential/i);
  });

  test('all 18 generic-dispatch packages are covered by the qualified matrix', () => {
    const names = [...existingQualifiedPackages, ...packages].map((entry) => entry.name);

    expect(names).toHaveLength(18);
    expect(new Set(names).size).toBe(18);
  });

  test('code review keeps pre-roster trivial-PR classification inline and behind no hidden dispatch', () => {
    const source = read('skills/spec-code-review/SKILL.md');
    const trivialPrSection = source.match(/\*\*Trivial-PR judgment\*\*:[\s\S]*?(?=\n\nWhen any skip rule fires)/);
    const dispatchGateIndex = source.indexOf('### Stage 1c: Dispatch gate and inline fallback');
    const profileDispatchIndex = source.indexOf('On `MISS`, dispatch a generic subagent');

    expect(trivialPrSection).not.toBeNull();
    expect(trivialPrSection[0]).toContain('orchestrator inline');
    expect(trivialPrSection[0]).toContain('does not dispatch');
    expect(trivialPrSection[0]).not.toMatch(/spawn a .*sub-agent/i);
    expect(dispatchGateIndex).toBeGreaterThanOrEqual(0);
    expect(profileDispatchIndex).toBeGreaterThan(dispatchGateIndex);
    expect(source.slice(dispatchGateIndex, profileDispatchIndex)).toContain(
      'enforce the Phase 0 dispatch policy before profile derivation',
    );
  });

  test('mutating resolver no longer treats invocation or silence as dispatch authority', () => {
    const source = packages
      .find((entry) => entry.name === 'spec-resolve-pr-feedback')
      .sources
      .map(read)
      .join('\n');

    expect(source).not.toMatch(/Direct invocation.*authorizes resolver dispatch/is);
    expect(source).not.toMatch(/user has not forbidden delegation/is);
  });

  test('POV preserves a bounded inline path when dispatch is unavailable or unauthorized', () => {
    const source = read('skills/spec-pov/SKILL.md');

    expect(source).not.toMatch(/dispatch scouts, never inline/i);
    expect(source).toMatch(/bounded inline/i);
    expect(source).toMatch(/must not claim independent scout coverage/i);
  });

  test('high-risk packages do not smuggle dispatch or tracked-write authority through modes and config', () => {
    const optimize = read('skills/spec-optimize/SKILL.md');
    const sweep = read('skills/spec-sweep/SKILL.md');
    const refresh = [
      read('skills/spec-compound-refresh/SKILL.md'),
      read('skills/spec-compound-refresh/references/per-action-flows.md'),
    ].join('\n');
    const resolver = read('skills/spec-resolve-pr-feedback/SKILL.md');

    expect(optimize).toMatch(/Approved optimization spec.*都不是派发授权/is);
    expect(optimize).toMatch(/judge sub-agents.*Otherwise evaluate.*serially inline/is);
    expect(optimize).toMatch(/Codex failure cascade.*authorization.*serial inline\/local/is);
    expect(sweep).toMatch(/mode:headless.*scheduled run.*都不构成派发授权/is);
    expect(sweep).toMatch(/sensitive.*delegated handling/is);
    expect(refresh).toMatch(/never write.*tracked successor/is);
    expect(refresh).toMatch(/must not write.*stage.*commit/is);
    expect(resolver).toContain('Resolver worker 永远不得 stage、commit、push');
  });

  test('inline fallback labels stay honest in downstream workflow text', () => {
    const brainstorm = read('skills/spec-brainstorm/SKILL.md');
    const compound = read('skills/spec-compound/SKILL.md');
    const dogfood = read('skills/spec-dogfood/SKILL.md');
    const ideate = read('skills/spec-ideate/SKILL.md');

    expect(brainstorm).not.toContain('A fresh-context verifier replaces self-graded verification');
    expect(brainstorm).toMatch(/inline fallback.*author self-check.*coverage limitation/is);
    expect(compound).toContain('Research Results:');
    expect(compound).not.toContain('Subagent Results:');
    expect(compound).not.toContain('Specialized Agent Reviews');
    expect(compound).not.toContain('<parallel_tasks>');
    expect(dogfood).not.toContain('Fix Loop (Autonomous)');
    expect(dogfood).not.toMatch(/Auto-fix when/i);
    expect(ideate).toContain('Authorized-dispatch examples');
    expect(ideate).toMatch(/role lenses inline\/serial.*dispatch_authorization_missing/is);
    const ideatePost = read('skills/spec-ideate/references/post-ideation-workflow.md');
    const ideateUniversal = read('skills/spec-ideate/references/universal-ideation.md');
    expect(ideatePost).toMatch(/dispatch.*only.*worker_dispatch_authorization.*worker_dispatch_capability/is);
    expect(ideatePost).toMatch(/inline.*do not describe.*independent or fresh-context/is);
    expect(ideateUniversal).toMatch(/Dispatch.*only when.*authorization and capability boundary permits/is);
  });
});
