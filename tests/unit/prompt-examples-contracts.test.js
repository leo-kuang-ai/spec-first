'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { buildBootstrapBlock } = require('../../src/cli/instruction-bootstrap');
const {
  normalizeFixtureFile,
  validateNormalizedCases,
} = require('../../skills/spec-skill-audit/scripts/eval-fixture-normalizer');

const REPO_ROOT = path.join(__dirname, '..', '..');
const USING_SPEC_FIRST_EXAMPLES = path.join(
  REPO_ROOT,
  'skills',
  'using-spec-first',
  'evals',
  'examples.json',
);
const EXAMPLE_FILES = [
  ['using-spec-first', USING_SPEC_FIRST_EXAMPLES, 'skills/using-spec-first/evals/examples.json'],
  ['spec-work', path.join(REPO_ROOT, 'skills', 'spec-work', 'evals', 'examples.json'), 'skills/spec-work/evals/examples.json'],
  ['spec-doc-review', path.join(REPO_ROOT, 'skills', 'spec-doc-review', 'evals', 'examples.json'), 'skills/spec-doc-review/evals/examples.json'],
];
const USING_SPEC_FIRST_ROUTING_CASES = path.join(
  REPO_ROOT,
  'skills',
  'using-spec-first',
  'evals',
  'routing-cases.json',
);
const USING_SPEC_FIRST_ROUTING_DISCIPLINE_CASES = path.join(
  REPO_ROOT,
  'skills',
  'using-spec-first',
  'evals',
  'routing-discipline-cases.json',
);
const PLACEHOLDER_PATTERN = /\b(?:TODO|TBD|foo|bar)\b|example 1/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('prompt examples baseline contracts', () => {
  test.each(EXAMPLE_FILES)('%s examples file follows prompt-examples/v1 shape', (skill, filePath) => {
    expect(fs.existsSync(filePath)).toBe(true);
    const payload = readJson(filePath);

    expect(payload.schema_version).toBe('prompt-examples/v1');
    expect(payload.skill).toBe(skill);
    expect(Array.isArray(payload.examples)).toBe(true);
    expect(payload.examples.length).toBeGreaterThanOrEqual(4);
    expect(payload.examples.length).toBeLessThanOrEqual(6);

    const seenNames = new Set();
    for (const example of payload.examples) {
      expect(typeof example.name).toBe('string');
      expect(example.name.trim()).toBe(example.name);
      expect(example.name.length).toBeGreaterThan(0);
      expect(seenNames.has(example.name)).toBe(false);
      seenNames.add(example.name);

      for (const field of ['user_intent', 'expected_posture', 'boundary_note', 'source_note']) {
        expect(typeof example[field]).toBe('string');
        expect(example[field].trim().length).toBeGreaterThan(0);
      }

      for (const field of ['negative_signal', 'context_snippets']) {
        if (example[field] === undefined) continue;
        if (Array.isArray(example[field])) {
          expect(example[field].length).toBeGreaterThan(0);
          for (const item of example[field]) {
            expect(typeof item).toBe('string');
            expect(item.trim().length).toBeGreaterThan(0);
          }
        } else {
          expect(typeof example[field]).toBe('string');
          expect(example[field].trim().length).toBeGreaterThan(0);
        }
      }

      const serialized = JSON.stringify(example);
      expect(serialized).not.toMatch(PLACEHOLDER_PATTERN);
    }
  });

  test.each(EXAMPLE_FILES)('%s skill prompt references examples as context', (skill, _filePath, relativeExamplePath) => {
    const skillPrompt = fs.readFileSync(path.join(REPO_ROOT, 'skills', skill, 'SKILL.md'), 'utf8');

    expect(skillPrompt).toContain(relativeExamplePath);
    expect(skillPrompt).toContain('examples-as-context');
    expect(skillPrompt).toContain('not');
  });

  test('using-spec-first routing cases pin lightweight direct outcomes without becoming a router', () => {
    const payload = readJson(USING_SPEC_FIRST_ROUTING_CASES);
    const skillPrompt = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md'), 'utf8');
    const docReviewSkill = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-doc-review', 'SKILL.md'), 'utf8');
    const examplesPayload = readJson(USING_SPEC_FIRST_EXAMPLES);
    const codexBootstrap = buildBootstrapBlock('codex', 'en');

    expect(payload.schema_version).toBe('using-spec-first-routing-cases/v1');
    expect(payload.skill).toBe('using-spec-first');
    expect(Array.isArray(payload.cases)).toBe(true);
    expect(payload.cases.length).toBeGreaterThanOrEqual(5);
    // R-11: 上限留 breathing margin。当前 14 条;上限设 20 仍防无限膨胀,
    // 但补 routing case 时不再触顶破测。
    expect(payload.cases.length).toBeLessThanOrEqual(20);
    expect(skillPrompt).toContain('skills/using-spec-first/evals/routing-cases.json');
    expect(skillPrompt).toContain('not a deterministic router');
    expect(skillPrompt).toContain('External issue or PR material is an input surface, not a separate public workflow.');
    expect(skillPrompt).toContain('Do not invent an external issue/PR-specific `/spec:*` or `$spec-*` entrypoint');

    const casesById = new Map(payload.cases.map((entry) => [entry.id, entry]));
    for (const id of [
      'greeting-direct-answer',
      'current-context-explanation-direct',
      'narrow-where-used-bounded-read',
      'current-document-summary-direct',
    ]) {
      const entry = casesById.get(id);
      expect(entry).toBeDefined();
      expect(entry.public_workflow_required).toBe(false);
      expect(entry.expected_entrypoint).toBeNull();
      expect(entry.graphify_required).toBe(false);
      expect(entry.artifact_expected).toBe(false);
      expect(['direct_answer', 'bounded_read']).toContain(entry.expected_outcome);
      expect(entry.expected_outcome).not.toBe('public_workflow');
    }

    expect(casesById.get('small-low-risk-edit-stays-direct')).toMatchObject({
      expected_outcome: 'normal_execution',
      public_workflow_required: false,
      expected_entrypoint: null,
      artifact_expected: false,
    });
    expect(casesById.get('small-low-risk-edit-stays-direct').boundary_note).toContain('changelog');
    expect(casesById.get('small-low-risk-edit-stays-direct').boundary_note).toContain('narrow verification');
    expect(casesById.get('small-low-risk-edit-stays-direct').boundary_note).toContain('source/runtime boundaries');

    expect(casesById.get('cross-file-contract-change-routes-work')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-work',
      artifact_expected: true,
    });
    expect(casesById.get('cross-file-contract-change-routes-work').boundary_note).toContain('contract/runtime delivery changes');

    expect(casesById.get('external-bug-issue-routes-debug')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-debug',
      artifact_expected: true,
    });
    expect(casesById.get('external-bug-issue-routes-debug').boundary_note).toContain('current source, tests, logs, or owner evidence');

    expect(casesById.get('external-enhancement-issue-routes-prd')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-prd',
      artifact_expected: true,
    });
    expect(casesById.get('external-enhancement-issue-routes-prd').boundary_note).toContain('not directly to implementation');

    expect(casesById.get('external-pr-diff-routes-code-review')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-code-review',
      artifact_expected: true,
    });
    expect(casesById.get('external-pr-diff-routes-code-review').boundary_note).toContain('untrusted inputs');

    expect(casesById.get('external-ready-brief-routes-work')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-work',
      artifact_expected: true,
    });
    expect(casesById.get('external-ready-brief-routes-work').boundary_note).toContain('ordinary execution input');

    expect(casesById.get('explicit-spec-plan-honored')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-plan',
      artifact_expected: true,
    });

    expect(casesById.get('codex-doc-review-no-subagents-fallback')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-doc-review',
      dispatch_decision: 'fallback',
      fallback_reason: 'dispatch_authorization_missing',
    });
    expect(casesById.get('codex-doc-review-no-subagents-fallback').boundary_note).toContain('Codex');

    expect(casesById.get('skill-agent-asset-audit-routes-skill-audit')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-skill-audit',
    });

    expect(casesById.get('codex-spec-plan-explicit-research-personas-dispatch')).toMatchObject({
      expected_outcome: 'public_workflow',
      public_workflow_required: true,
      expected_entrypoint: '$spec-plan',
      dispatch_decision: 'dispatch',
    });
    expect(casesById.get('codex-spec-plan-explicit-research-personas-dispatch').boundary_note).toContain('Codex');

    for (const entry of payload.cases) {
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.user_intent).toBe('string');
      expect(typeof entry.boundary_note).toBe('string');
      expect(entry.name.trim()).toBe(entry.name);
      expect(entry.user_intent.trim().length).toBeGreaterThan(0);
      expect(entry.boundary_note.trim().length).toBeGreaterThan(0);
      expect(JSON.stringify(entry)).not.toMatch(PLACEHOLDER_PATTERN);

      if (entry.dispatch_decision !== undefined) {
        expect(['dispatch', 'fallback', 'none']).toContain(entry.dispatch_decision);
      }
      if (entry.dispatch_decision === 'fallback') {
        expect(entry.fallback_reason).toBe('dispatch_authorization_missing');
      } else {
        expect(entry.fallback_reason).toBeUndefined();
      }
    }

    expect(docReviewSkill).toContain('dispatch_authorization_missing');
    expect(docReviewSkill).toContain('for multi-persona or subagent review in Codex, ask for `subagents`, `personas`');
    expect(codexBootstrap).toContain('dispatch_authorization_missing');
    expect(codexBootstrap).toContain('ask for `subagents` or `personas` in the request');
    expect(JSON.stringify(examplesPayload)).toContain('dispatch_authorization_missing');
    expect(JSON.stringify(examplesPayload)).toContain('not host-level subagent tools');
  });

  test('using-spec-first routing discipline cases are canonical output-eval fixtures', () => {
    const payload = readJson(USING_SPEC_FIRST_ROUTING_DISCIPLINE_CASES);
    const skillPrompt = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md'), 'utf8');
    const normalized = normalizeFixtureFile({
      repoRoot: REPO_ROOT,
      filePath: 'skills/using-spec-first/evals/routing-discipline-cases.json',
      skillId: 'using-spec-first',
    });
    const errors = validateNormalizedCases(normalized, { repoRoot: REPO_ROOT });

    expect(payload.schema_version).toBe('spec-first.workflow-eval-fixtures.v1');
    expect(payload.skill).toBe('using-spec-first');
    expect(skillPrompt).toContain('skills/using-spec-first/evals/routing-discipline-cases.json');
    expect(errors).toEqual([]);
    expect(normalized.length).toBeGreaterThanOrEqual(6);

    const casesById = new Map(normalized.map((entry) => [entry.id, entry]));
    expect(casesById.get('automatic-chain-pressure-stays-single-entrypoint').forbidden_signals)
      .toEqual(expect.arrayContaining(['Automatically chains multiple workflows']));
    expect(casesById.get('codex-doc-review-admission-not-dispatch-authorization').coverage_tags)
      .toEqual(expect.arrayContaining(['dispatch-boundary']));
    expect(casesById.get('codex-doc-review-admission-not-dispatch-authorization').extensions)
      .toMatchObject({
        dispatch_decision: 'fallback',
        fallback_reason: 'dispatch_authorization_missing',
      });
    expect(casesById.get('stale-setup-does-not-hijack-lightweight-docs-work').forbidden_signals)
      .toEqual(expect.arrayContaining(['Forces $spec-mcp-setup before answering a lightweight docs question']));
  });
});
