'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  CANONICAL_SCHEMA_VERSION,
  normalizeFixtureFile,
  normalizeFixturePayload,
  validateNormalizedCases,
} = require('../../skills/spec-skill-audit/scripts/eval-fixture-normalizer');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'eval-fixture-contract.md');
const PACKAGE_PATH = path.join(REPO_ROOT, 'package.json');

function listEvalJsonFiles(rootPath = path.join(REPO_ROOT, 'skills')) {
  const files = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && entryPath.includes(`${path.sep}evals${path.sep}`) && entry.name.endsWith('.json')) {
        files.push(path.relative(REPO_ROOT, entryPath).split(path.sep).join('/'));
      }
    }
  }

  walk(rootPath);
  return files.sort();
}

describe('eval fixture normalizer contract', () => {
  test('documents the canonical fixture envelope and declared structural coverage boundary', () => {
    const contract = fs.readFileSync(CONTRACT_PATH, 'utf8');

    expect(contract).toContain(CANONICAL_SCHEMA_VERSION);
    expect(contract).toContain('source-owned normalizer');
    expect(contract).toContain('declared structural coverage');
    expect(contract).toContain('do not prove semantic quality');
    expect(contract).toContain('single-shot expected-match');
    expect(contract).toContain('trigger` and `expected` cases require non-empty `expected_outcome`');
    expect(contract).toContain('`boundary` cases may omit `expected_outcome`');
    expect(contract).toContain('`.claude/**`');
    expect(contract).toContain('`.codex/**`');
    expect(contract).toContain('`.agents/skills/**`');
    expect(contract).toContain('`docs/plans/**`');
    expect(contract).toContain('`docs/validation/**`');
  });

  test('canonical v1 file normalizes inherited source refs and coverage tags', () => {
    const normalized = normalizeFixturePayload({
      schema_version: CANONICAL_SCHEMA_VERSION,
      skill: 'example-skill',
      source_refs: ['skills/spec-work/SKILL.md'],
      coverage_tags: ['routing'],
      cases: [
        {
          id: 'clear-trigger',
          input: 'Run the work plan.',
          coverage_tags: ['trigger'],
          expected_outcome: 'Use spec-work.',
        },
      ],
    }, {
      repoRoot: REPO_ROOT,
      filePath: path.join(REPO_ROOT, 'skills', 'example-skill', 'evals', 'examples.json'),
    });

    expect(normalized).toEqual([
      expect.objectContaining({
        schema_version: CANONICAL_SCHEMA_VERSION,
        skill: 'example-skill',
        id: 'clear-trigger',
        input: 'Run the work plan.',
        expected_outcome: 'Use spec-work.',
        coverage_tags: ['routing', 'trigger'],
        source_refs: ['skills/spec-work/SKILL.md'],
        source_ref_authority: 'source',
        normalized_from: 'canonical',
        coverage_basis: 'declared_coverage_tags',
      }),
    ]);
    expect(validateNormalizedCases(normalized, { repoRoot: REPO_ROOT })).toEqual([]);
  });

  test('legacy prompt examples normalize name and user_intent without a second adapter', () => {
    const normalized = normalizeFixturePayload({
      schema_version: 'prompt-examples/v1',
      skill: 'example-skill',
      source_refs: ['skills/spec-work/SKILL.md'],
      examples: [
        {
          name: 'Plan target repo missing blocks writes',
          user_intent: 'A plan lacks target_repo.',
          expected_posture: 'Ask for repo scope.',
          coverage_tags: ['boundary'],
          boundary_note: 'Writes need an explicit repo scope.',
        },
      ],
    }, { repoRoot: REPO_ROOT });

    expect(normalized[0]).toMatchObject({
      id: 'plan-target-repo-missing-blocks-writes',
      input: 'A plan lacks target_repo.',
      expected_outcome: 'Ask for repo scope.',
      normalized_from: 'legacy_adapter',
    });
    expect(validateNormalizedCases(normalized, { repoRoot: REPO_ROOT })).toEqual([]);
  });

  test('all source eval JSON files normalize and validate with unique ids per skill', () => {
    const files = listEvalJsonFiles();
    expect(files.length).toBeGreaterThanOrEqual(14);

    const cases = files.flatMap((filePath) => normalizeFixtureFile({
      repoRoot: REPO_ROOT,
      filePath,
    }));
    const errors = validateNormalizedCases(cases, { repoRoot: REPO_ROOT });

    expect(cases.length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test('source authority rejects generated mirrors and historical artifacts', () => {
    const normalized = normalizeFixturePayload({
      schema_version: CANONICAL_SCHEMA_VERSION,
      skill: 'bad-skill',
      cases: [
        {
          id: 'bad-runtime-ref',
          input: 'Patch a runtime mirror.',
          coverage_tags: ['boundary'],
          boundary_note: 'Runtime mirrors are not source.',
          source_refs: ['.agents/skills/spec-work/SKILL.md'],
        },
        {
          id: 'bad-plan-ref',
          input: 'Treat a plan as current source.',
          coverage_tags: ['boundary'],
          boundary_note: 'Plans are historical evidence.',
          source_refs: ['docs/plans/example-plan.md'],
        },
      ],
    }, { repoRoot: REPO_ROOT });

    expect(validateNormalizedCases(normalized, { repoRoot: REPO_ROOT }).map((entry) => entry.reason_code)).toEqual(
      expect.arrayContaining(['source_ref_not_source_authority']),
    );
  });

  test('source refs must be repo-relative POSIX paths, not external URLs', () => {
    const normalized = normalizeFixturePayload({
      schema_version: CANONICAL_SCHEMA_VERSION,
      skill: 'bad-skill',
      cases: [
        {
          id: 'external-url-ref',
          input: 'Use an external doc as fixture source.',
          coverage_tags: ['boundary'],
          boundary_note: 'External docs are advisory pressure, not repo source refs.',
          source_refs: ['https://example.invalid/spec-first-contract'],
        },
      ],
    }, { repoRoot: REPO_ROOT });

    expect(validateNormalizedCases(normalized, { repoRoot: REPO_ROOT })).toContainEqual(expect.objectContaining({
      reason_code: 'invalid_source_ref',
      id: 'external-url-ref',
    }));
  });

  test('tag-dependent expected outcome checks stay structural only', () => {
    const normalized = normalizeFixturePayload({
      schema_version: CANONICAL_SCHEMA_VERSION,
      skill: 'bad-skill',
      source_refs: ['skills/spec-work/SKILL.md'],
      cases: [
        {
          id: 'trigger-missing-expected',
          input: 'Execute this.',
          coverage_tags: ['trigger'],
        },
        {
          id: 'boundary-with-note',
          input: 'Do not execute this.',
          coverage_tags: ['boundary'],
          boundary_note: 'A boundary note is enough for LLM-judged boundary cases.',
        },
      ],
    }, { repoRoot: REPO_ROOT });

    const errors = validateNormalizedCases(normalized, { repoRoot: REPO_ROOT });

    expect(errors).toContainEqual(expect.objectContaining({
      reason_code: 'missing_expected_outcome',
      id: 'trigger-missing-expected',
    }));
    expect(errors).not.toContainEqual(expect.objectContaining({
      id: 'boundary-with-note',
    }));
  });

  test('duplicate ids across files for one skill report both id and path', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-fixtures-'));
    try {
      const firstPath = path.join(repoRoot, 'skills', 'dup-skill', 'evals', 'a.json');
      const secondPath = path.join(repoRoot, 'skills', 'dup-skill', 'evals', 'b.json');
      fs.mkdirSync(path.dirname(firstPath), { recursive: true });
      fs.writeFileSync(firstPath, JSON.stringify({
        schema_version: CANONICAL_SCHEMA_VERSION,
        skill: 'dup-skill',
        source_refs: ['skills/dup-skill/SKILL.md'],
        cases: [{
          id: 'same',
          input: 'A',
          coverage_tags: ['trigger'],
          expected_outcome: 'A',
        }],
      }), 'utf8');
      fs.writeFileSync(secondPath, JSON.stringify({
        schema_version: CANONICAL_SCHEMA_VERSION,
        skill: 'dup-skill',
        source_refs: ['skills/dup-skill/SKILL.md'],
        cases: [{
          id: 'same',
          input: 'B',
          coverage_tags: ['trigger'],
          expected_outcome: 'B',
        }],
      }), 'utf8');
      fs.writeFileSync(path.join(repoRoot, 'skills', 'dup-skill', 'SKILL.md'), '# Dup Skill\n', 'utf8');

      const cases = [
        ...normalizeFixtureFile({ repoRoot, filePath: firstPath }),
        ...normalizeFixtureFile({ repoRoot, filePath: secondPath }),
      ];

      expect(validateNormalizedCases(cases, { repoRoot })).toContainEqual(expect.objectContaining({
        reason_code: 'duplicate_case_id',
        id: 'same',
        source_file: 'skills/dup-skill/evals/b.json',
        previous_source_file: 'skills/dup-skill/evals/a.json',
      }));
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  test('package script and CI run deterministic eval fixture checks', () => {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

    expect(packageJson.scripts['test:eval-fixtures']).toContain('tests/unit/eval-fixture-contracts.test.js');
    expect(packageJson.scripts['test:eval-fixtures']).toContain('tests/unit/skill-audit-scripts.test.js');
  });
});
