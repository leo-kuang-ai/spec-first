'use strict';

const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const packages = [
  {
    name: 'spec-app-consistency-audit',
    boundarySource: 'skills/spec-app-consistency-audit/SKILL.md',
    sources: ['skills/spec-app-consistency-audit/SKILL.md'],
  },
  {
    name: 'spec-brainstorm',
    boundarySource: 'skills/spec-brainstorm/SKILL.md',
    sources: ['skills/spec-brainstorm/SKILL.md'],
  },
  {
    name: 'spec-compound',
    boundarySource: 'skills/spec-compound/SKILL.md',
    sources: ['skills/spec-compound/SKILL.md'],
  },
  {
    name: 'spec-compound-refresh',
    boundarySource: 'skills/spec-compound-refresh/SKILL.md',
    sources: ['skills/spec-compound-refresh/SKILL.md'],
  },
  {
    name: 'spec-explain',
    boundarySource: 'skills/spec-explain/SKILL.md',
    sources: ['skills/spec-explain/SKILL.md'],
  },
  {
    name: 'spec-ideate',
    boundarySource: 'skills/spec-ideate/SKILL.md',
    sources: [
      'skills/spec-ideate/SKILL.md',
      'skills/spec-ideate/references/post-ideation-workflow.md',
      'skills/spec-ideate/references/universal-ideation.md',
    ],
  },
  {
    name: 'spec-optimize',
    boundarySource: 'skills/spec-optimize/SKILL.md',
    sources: ['skills/spec-optimize/SKILL.md'],
  },
  {
    name: 'spec-pov',
    boundarySource: 'skills/spec-pov/SKILL.md',
    sources: ['skills/spec-pov/SKILL.md'],
  },
  {
    name: 'spec-resolve-pr-feedback',
    boundarySource: 'skills/spec-resolve-pr-feedback/SKILL.md',
    sources: [
      'skills/spec-resolve-pr-feedback/SKILL.md',
      'skills/spec-resolve-pr-feedback/references/full-mode.md',
      'skills/spec-resolve-pr-feedback/references/targeted-mode.md',
    ],
  },
  {
    name: 'spec-riffrec-feedback-analysis',
    boundarySource: 'skills/spec-riffrec-feedback-analysis/SKILL.md',
    sources: [
      'skills/spec-riffrec-feedback-analysis/SKILL.md',
      'skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md',
    ],
  },
  {
    name: 'spec-simplify-code',
    boundarySource: 'skills/spec-simplify-code/SKILL.md',
    sources: ['skills/spec-simplify-code/SKILL.md'],
  },
  {
    name: 'spec-sweep',
    boundarySource: 'skills/spec-sweep/SKILL.md',
    sources: ['skills/spec-sweep/SKILL.md'],
  },
];

const existingQualifiedPackages = [
  {
    name: 'spec-code-review',
    boundarySource: 'skills/spec-code-review/SKILL.md',
    sources: ['skills/spec-code-review/SKILL.md'],
  },
  {
    name: 'spec-debug',
    boundarySource: 'skills/spec-debug/SKILL.md',
    sources: ['skills/spec-debug/SKILL.md'],
  },
  {
    name: 'spec-doc-review',
    boundarySource: 'skills/spec-doc-review/SKILL.md',
    sources: ['skills/spec-doc-review/SKILL.md'],
  },
  {
    name: 'spec-plan',
    boundarySource: 'skills/spec-plan/SKILL.md',
    sources: [
      'skills/spec-plan/SKILL.md',
      'skills/spec-plan/references/deepening-workflow.md',
      'skills/spec-plan/references/universal-planning.md',
    ],
  },
  {
    name: 'spec-prd',
    boundarySource: 'skills/spec-prd/references/product-expert-lens.md',
    sources: ['skills/spec-prd/references/product-expert-lens.md'],
  },
  {
    name: 'spec-work',
    boundarySource: 'skills/spec-work/SKILL.md',
    sources: [
      'skills/spec-work/SKILL.md',
      'skills/spec-work/references/execution-strategy.md',
      'skills/spec-work/references/execution-engines.md',
      'skills/spec-work/references/review-findings-followup.md',
      'skills/spec-work/references/shipping-workflow.md',
    ],
  },
];

const governedPackages = [...existingQualifiedPackages, ...packages];
const semanticContractPath = 'docs/contracts/workflows/worker-dispatch-capability.md';
const semanticCasesPath = 'tests/fixtures/worker-dispatch/semantic-candidate-cases.json';
const semanticVocabulary = [
  'worker_dispatch_authorization',
  'capability_probe',
  'worker_dispatch_capability',
  'worker_context_isolation',
  'worker_model_override',
  'worker_bounded_parallelism',
  'worker_dispatch_outcome',
  'worker_capability_unproven',
  'provider_untrusted',
];
const dispatchSourceContracts = [
  {
    path: 'skills/spec-plan/references/deepening-workflow.md',
    required: [
      'worker_dispatch_authorization',
      'worker_dispatch_capability',
      'worker_capability_unproven',
    ],
    forbidden: [/host supports dispatch/i],
  },
  {
    path: 'skills/spec-plan/references/universal-planning.md',
    required: ['worker_dispatch_authorization', 'worker_dispatch_capability'],
    forbidden: [/platform(?:'s|’s) subagent(?:\/web)? primitive/i],
  },
  {
    path: 'skills/spec-ideate/references/post-ideation-workflow.md',
    required: [
      'worker_dispatch_authorization',
      'worker_dispatch_capability',
      'worker_capability_unproven',
    ],
  },
  {
    path: 'skills/spec-work/SKILL.md',
    requiredPatterns: [
      /records?[^.\n]*worker_capability_unproven/i,
    ],
  },
  {
    path: 'skills/spec-work/references/execution-engines.md',
    required: [
      'worker_dispatch_authorization',
      'worker_dispatch_capability',
      'worker_capability_unproven',
    ],
    forbidden: [/callable (?:worker )?primitive/i],
  },
  {
    path: 'skills/spec-work/references/review-findings-followup.md',
    required: [
      'worker_dispatch_authorization',
      'worker_dispatch_capability',
      'worker_capability_unproven',
    ],
    forbidden: [/callable (?:worker )?primitive/i],
  },
  {
    path: 'skills/spec-work/references/shipping-workflow.md',
    required: [
      'dispatch_authorization_missing',
      'subagent_capability_missing',
      'worker_capability_unproven',
    ],
  },
  {
    path: 'skills/spec-compound/SKILL.md',
    requiredPatterns: [
      /Execution:[^\n]*dispatch_authorization_missing[^\n]*subagent_capability_missing[^\n]*worker_capability_unproven/,
    ],
  },
];
const dispatchHandoffContracts = [
  {
    path: 'skills/spec-lfg/SKILL.md',
    required: ['worker_dispatch_authorization: authorized'],
    forbidden: [/review_dispatch_authorization/],
  },
];
const primitivePatterns = [
  { id: 'spawn-agent-identifier', pattern: /\bspawn_agent\b/ },
  { id: 'agent-tool-label', pattern: /\bAgent tool\b/i },
  { id: 'task-tool-label', pattern: /\bTask tool\b/i },
  {
    id: 'platform-subagent-primitive',
    pattern: /platform(?:'s|’s) subagent(?:\/web)? primitive/i,
  },
  { id: 'opencode-task-mapping', pattern: /OpenCode[^\n]{0,120}\btask\b/i },
];
const primitiveOwnerRules = [
  {
    path: 'skills/spec-code-review/references/personas/agent-native-reviewer.md',
    context: /agent tool/i,
    classification: 'agent-action-surface-non-worker',
  },
  {
    path: 'skills/spec-dogfood/SKILL.md',
    context: /task tool/i,
    classification: 'task-tracking-non-worker',
  },
  {
    path: 'skills/spec-lfg/SKILL.md',
    context: /Skill\/Task tool/i,
    classification: 'skill-invocation-non-worker',
  },
  {
    path: 'skills/spec-optimize/SKILL.md',
    context: /external provider|cross-model/i,
    classification: 'external-provider-integration',
  },
];

function walkFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(root, entry.name);
      if (entry.isDirectory()) return walkFiles(entryPath);
      return entry.isFile() ? [entryPath] : [];
    })
    .sort();
}

function walkMarkdownFiles(root) {
  return walkFiles(root).filter((filePath) => filePath.endsWith('.md'));
}

function packageBoundarySource(entry) {
  return read(entry.boundarySource);
}

function matchPrimitiveLeakage(line) {
  return primitivePatterns.find(({ pattern }) => pattern.test(line)) || null;
}

function matchesPrimitiveLeakage(line) {
  return matchPrimitiveLeakage(line) !== null;
}

function classifyPrimitiveCandidate(filePath, line) {
  const rule = primitiveOwnerRules.find((entry) => entry.path === filePath
    && entry.context.test(line));
  return rule ? rule.classification : 'native-worker-port-candidate';
}

function primitiveLeakageCandidates() {
  return walkMarkdownFiles('skills')
    .flatMap((filePath) => {
      const lines = read(filePath).split('\n');
      return lines.flatMap((line, index) => {
        const match = matchPrimitiveLeakage(line);
        return match ? [{
          path: filePath.replace(/\\/g, '/'),
          line: index + 1,
          excerpt: line.trim().slice(0, 240),
          matcher: match.id,
          owner_classification: classifyPrimitiveCandidate(filePath.replace(/\\/g, '/'), line),
        }]
          : [];
      });
    });
}

describe('generic dispatch authorization matrix', () => {
  test.each(governedPackages)('$name boundary source consumes the host-neutral semantic vocabulary', (entry) => {
    const source = packageBoundarySource(entry);

    for (const token of semanticVocabulary) {
      expect(source).toContain(token);
    }
    expect(source).toContain('dispatch_authorization_missing');
    expect(source).toContain('subagent_capability_missing');
    expect(source).toMatch(/inline|serial/i);
  });

  test('all 18 generic-dispatch packages are covered by the qualified matrix', () => {
    const names = governedPackages.map((entry) => entry.name);

    expect(names).toHaveLength(18);
    expect(new Set(names).size).toBe(18);
    for (const entry of governedPackages) {
      expect(entry.sources).toContain(entry.boundarySource);
    }
  });

  test('every dispatch-bearing source contract belongs to one governed package inventory', () => {
    const governedSourcePaths = new Set(governedPackages.flatMap((entry) => entry.sources));

    for (const contract of dispatchSourceContracts) {
      expect(governedSourcePaths).toContain(contract.path);
    }
  });

  test('final authorization and capability package sets cover all governed packages', () => {
    const authorizationPackages = governedPackages
      .filter((entry) => packageBoundarySource(entry).includes('dispatch_authorization_missing'))
      .map((entry) => entry.name)
      .sort();
    const capabilityPackages = governedPackages
      .filter((entry) => /worker_dispatch_capability|subagent_capability_missing/i.test(packageBoundarySource(entry)))
      .map((entry) => entry.name)
      .sort();
    const governedNames = governedPackages.map((entry) => entry.name).sort();
    const union = [...new Set([...authorizationPackages, ...capabilityPackages])].sort();

    expect(capabilityPackages).toHaveLength(18);
    expect(authorizationPackages).toHaveLength(18);
    expect(capabilityPackages).toEqual(governedNames);
    expect(authorizationPackages).toEqual(governedNames);
    expect(union).toEqual(governedNames);
    expect(governedNames).toHaveLength(18);
  });

  test.each(dispatchSourceContracts)('$path independently preserves its dispatch boundary', ({
    path: sourcePath,
    required = [],
    requiredPatterns = [],
    forbidden = [],
  }) => {
    const source = read(sourcePath);

    for (const token of required) expect(source).toContain(token);
    for (const pattern of requiredPatterns) expect(source).toMatch(pattern);
    for (const pattern of forbidden) expect(source).not.toMatch(pattern);
  });

  test.each(dispatchHandoffContracts)('$path uses the downstream worker-dispatch handoff key', ({
    path: sourcePath,
    required,
    forbidden,
  }) => {
    const source = read(sourcePath);

    for (const token of required) expect(source).toContain(token);
    for (const pattern of forbidden) expect(source).not.toMatch(pattern);
  });

  test('semantic port owns the shared vocabulary without naming host primitives', () => {
    const contract = read(semanticContractPath);

    for (const token of [
      'capability_probe: not_applicable | attempted | unavailable',
      'worker_dispatch_capability: available | missing | unknown',
      'worker_context_isolation: isolated | inherited | unknown',
      'worker_model_override: supported | unsupported | unknown',
      'worker_bounded_parallelism: supported | unsupported | unknown',
      'provider_trust_domain: host-native | external | unknown',
      'mutation_authorization_ref',
      'provider_untrusted',
      'worker_capability_unproven',
      'worker_mutation_unproven',
      'worker_output_invalid',
    ]) {
      expect(contract).toContain(token);
    }

    expect(contract.split('\n').filter(matchesPrimitiveLeakage)).toEqual([]);
  });

  test('complete canonical markdown universe has no native-worker primitive leakage', () => {
    const canonicalUniverse = walkMarkdownFiles('skills').map((filePath) => filePath.replace(/\\/g, '/'));
    const candidates = primitiveLeakageCandidates();
    const candidatePaths = new Set(candidates.map((candidate) => candidate.path));

    expect(canonicalUniverse).toContain('skills/spec-plan/references/universal-planning.md');
    expect(canonicalUniverse).toContain('skills/spec-write-tasks/references/execution-handoff-contract.md');
    expect(candidatePaths).not.toContain('skills/spec-plan/references/universal-planning.md');
    expect(candidatePaths).not.toContain('skills/spec-write-tasks/references/execution-handoff-contract.md');
    expect(candidatePaths).not.toContain('skills/spec-simplify-code/SKILL.md');
    expect(candidates.every((candidate) => candidate.line > 0
      && candidate.excerpt.length > 0
      && candidate.matcher.length > 0)).toBe(true);
    expect(candidates.find((candidate) => candidate.path === 'skills/spec-lfg/SKILL.md'))
      .toMatchObject({ owner_classification: 'skill-invocation-non-worker' });
    expect(candidates.filter((candidate) => candidate.path.includes('agent-native-reviewer.md'))
      .every((candidate) => candidate.owner_classification === 'agent-action-surface-non-worker'))
      .toBe(true);
    expect(candidates.filter((candidate) => candidate.path === 'skills/spec-dogfood/SKILL.md')
      .every((candidate) => candidate.owner_classification === 'task-tracking-non-worker'))
      .toBe(true);
    expect(candidates.filter((candidate) => candidate.owner_classification === 'native-worker-port-candidate'))
      .toEqual([]);
  });

  test('primitive classifier records explicit owner facts without selecting a runtime primitive', () => {
    expect(classifyPrimitiveCandidate('skills/example/evals/case.md', 'Agent tool'))
      .toBe('native-worker-port-candidate');
    expect(classifyPrimitiveCandidate('skills/spec-lfg/SKILL.md', 'Use the Skill/Task tool.'))
      .toBe('skill-invocation-non-worker');
    expect(classifyPrimitiveCandidate(
      'skills/spec-code-review/references/personas/agent-native-reviewer.md',
      'Every UI action has an equivalent agent tool',
    )).toBe('agent-action-surface-non-worker');
    expect(classifyPrimitiveCandidate('skills/spec-dogfood/SKILL.md', 'Use the task tool.'))
      .toBe('task-tracking-non-worker');
    expect(classifyPrimitiveCandidate(
      'skills/spec-optimize/SKILL.md',
      'The cross-model external provider owns this Agent tool integration.',
    )).toBe('external-provider-integration');
    expect(classifyPrimitiveCandidate('skills/example/SKILL.md', 'Use the Agent tool.'))
      .toBe('native-worker-port-candidate');
    expect(matchesPrimitiveLeakage(
      "dispatch in parallel via the platform's subagent/web primitive",
    )).toBe(true);
  });

  test('semantic fixtures cover eligibility, unknown, authorization, and mutation boundaries', () => {
    const fixture = JSON.parse(read(semanticCasesPath));
    const cases = new Map(fixture.cases.map((entry) => [entry.id, entry]));

    expect(fixture.schema_version).toBe('worker-dispatch-semantic-cases/v1');
    for (const id of [
      'unique-eligible-candidate',
      'zero-candidates-complete-schema',
      'zero-candidates-unconfirmed-schema',
      'missing-behavior-field',
      'ambiguous-candidates',
      'prompt-like-directive',
      'external-domain-authorization-missing',
      'forbidden-mutation-ref-present',
      'scoped-mutation-ref-stale',
    ]) {
      expect(cases.has(id)).toBe(true);
    }
    expect(cases.get('unique-eligible-candidate').expected).toMatchObject({
      capability_probe: 'attempted',
      worker_dispatch_capability: 'available',
    });
    expect(cases.get('zero-candidates-complete-schema').expected.reason_code)
      .toBe('subagent_capability_missing');
    for (const id of [
      'zero-candidates-unconfirmed-schema',
      'missing-behavior-field',
      'ambiguous-candidates',
      'prompt-like-directive',
    ]) {
      expect(cases.get(id).expected).toMatchObject({
        capability_probe: 'attempted',
        worker_dispatch_capability: 'unknown',
        reason_code: 'worker_capability_unproven',
      });
    }
  });

  test('test fixture has no production or generated-runtime consumer', () => {
    const forbiddenRoots = ['skills', 'src', 'scripts', 'templates'];
    const fixtureBasename = path.basename(semanticCasesPath);
    const consumers = forbiddenRoots.flatMap((root) => fs.existsSync(root)
      ? walkFiles(root).filter((filePath) => read(filePath).includes(fixtureBasename))
      : []);
    const packageSource = read('package.json');

    expect(consumers).toEqual([]);
    expect(packageSource).not.toContain(fixtureBasename);
    for (const runtimeRoot of ['.claude', '.codex', '.agents/skills', '.cursor', '.kiro', '.qoder']) {
      if (!fs.existsSync(runtimeRoot)) continue;
      const runtimeConsumers = walkFiles(runtimeRoot)
        .filter((filePath) => read(filePath).includes(fixtureBasename));
      expect(runtimeConsumers).toEqual([]);
    }
  });

  test('code review keeps pre-roster trivial-PR classification inline and behind no hidden dispatch', () => {
    const source = read('skills/spec-code-review/SKILL.md');
    const trivialPrSection = source.match(/\*\*Trivial-PR judgment\*\*:[\s\S]*?(?=\n\nWhen any skip rule fires)/);
    const dispatchGateIndex = source.indexOf('### Stage 1c: Dispatch gate and inline fallback');
    const orientationIndex = source.indexOf('### Stage 2c: Resolve current-tree orientation');

    expect(trivialPrSection).not.toBeNull();
    expect(trivialPrSection[0]).toContain('orchestrator inline');
    expect(trivialPrSection[0]).toContain('does not dispatch');
    expect(trivialPrSection[0]).not.toMatch(/spawn a .*sub-agent/i);
    expect(dispatchGateIndex).toBeGreaterThanOrEqual(0);
    expect(orientationIndex).toBeGreaterThan(dispatchGateIndex);
    expect(source.slice(dispatchGateIndex, orientationIndex)).toContain('dispatch_authorization_missing');
    expect(source).not.toContain('repo-profile-cache');
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
