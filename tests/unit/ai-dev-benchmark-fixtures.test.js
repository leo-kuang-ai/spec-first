'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  BENCHMARK_SUITE_ID,
  DEFAULT_FIXTURE_ROOT,
  isSafeRepoRelativePath,
  runAiDevBenchmarkFixtures,
  validateBenchmarkResult,
} = require('../../scripts/run-ai-dev-benchmark-fixtures');

const REPO_ROOT = path.join(__dirname, '..', '..');
const MANIFEST_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'docs',
  'contracts',
  'quality-gates',
  'ai-dev-benchmark-fixture.schema.json'
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-benchmark-fixtures-'));
}

function createFixture(root, fixtureId, overrides = {}) {
  const fixtureDir = path.join(root, 'tests', 'fixtures', 'ai-dev-benchmarks', fixtureId);
  writeFile(path.join(fixtureDir, 'prompt.md'), '# Prompt\n');
  writeFile(path.join(fixtureDir, 'repo', 'README.md'), '# Fixture Repo\n');
  writeJson(path.join(fixtureDir, 'manifest.json'), {
    schema_version: 'v1',
    fixture_id: fixtureId,
    scenario_type: 'docs-only',
    prompt_path: 'prompt.md',
    repo_path: 'repo',
    expected_workflows: ['spec-work'],
    expected_changed_paths: ['README.md'],
    expected_artifacts: [
      {
        path: 'README.md',
        kind: 'doc',
        owner: 'spec-work',
      },
    ],
    validation_commands: ['node definitely-not-executed.js'],
    quality_signals: ['Fixture input is consumable.'],
    ...overrides,
  });
}

function runTempFixtures(root) {
  return runAiDevBenchmarkFixtures({
    repoRoot: root,
    fixturesRoot: path.join(root, 'tests', 'fixtures', 'ai-dev-benchmarks'),
    generatedAt: '2026-05-11T12:00:00.000Z',
  });
}

function schemaResult(result) {
  const { artifact_path: artifactPath, ...contract } = result;
  expect(typeof artifactPath).toBe('string');
  return contract;
}

describe('ai dev benchmark fixture suite', () => {
  test('manifest schema validates the checked-in v1 fixtures', () => {
    const schema = readJson(MANIFEST_SCHEMA_PATH);
    const fixtureIds = fs.readdirSync(DEFAULT_FIXTURE_ROOT).sort();

    expect(fixtureIds).toEqual([
      'api-contract',
      'cli-bugfix',
      'docs-only',
      'multi-module-refactor',
    ]);

    for (const fixtureId of fixtureIds) {
      const manifest = readJson(path.join(DEFAULT_FIXTURE_ROOT, fixtureId, 'manifest.json'));
      expect(validateAgainstSchema(schema, manifest).errors).toEqual([]);
      expect(manifest.fixture_id).toBe(fixtureId);
    }
  });

  test('runner emits a valid advisory result for checked-in fixtures', () => {
    const result = runAiDevBenchmarkFixtures({
      repoRoot: REPO_ROOT,
      generatedAt: '2026-05-11T12:00:00.000Z',
    });

    expect(result.suite_id).toBe(BENCHMARK_SUITE_ID);
    expect(result.passed).toBe(true);
    expect(result.advisory).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.fixtures).toHaveLength(4);
    expect(result.fixtures).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fixture_id: 'api-contract',
        status: 'passed',
        semantic_review: {
          artifact_path: 'expected/semantic-review.md',
          review_mode: 'llm-review-pass',
          status: 'recorded',
        },
      }),
      expect.objectContaining({
        fixture_id: 'docs-only',
        status: 'passed',
        reason_code: 'fixture-valid',
        advisory: true,
        validation_commands_status: 'declared_only',
      }),
      expect.objectContaining({
        fixture_id: 'cli-bugfix',
        status: 'passed',
      }),
      expect.objectContaining({
        fixture_id: 'multi-module-refactor',
        status: 'passed',
      }),
    ]));
    expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    expect(fs.existsSync(path.join(REPO_ROOT, result.artifact_path))).toBe(true);
  });

  test('path validator rejects absolute, parent, normalized, and Windows paths', () => {
    expect(isSafeRepoRelativePath('docs/example.md')).toBe(true);
    expect(isSafeRepoRelativePath('/tmp/example.md')).toBe(false);
    expect(isSafeRepoRelativePath('docs/../example.md')).toBe(false);
    expect(isSafeRepoRelativePath('docs//example.md')).toBe(false);
    expect(isSafeRepoRelativePath('docs\\example.md')).toBe(false);
    expect(isSafeRepoRelativePath('C:\\tmp\\example.md')).toBe(false);
  });

  test('runner accepts full-closure scenario types without executing declared commands', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'api-contract', {
        scenario_type: 'api-contract',
      });
      createFixture(root, 'multi-module-refactor', {
        scenario_type: 'multi-module-refactor',
      });

      const result = runTempFixtures(root);

      expect(result.passed).toBe(true);
      expect(result.fixtures).toEqual(expect.arrayContaining([
        expect.objectContaining({
          fixture_id: 'api-contract',
          validation_commands_status: 'declared_only',
        }),
        expect.objectContaining({
          fixture_id: 'multi-module-refactor',
          validation_commands_status: 'declared_only',
        }),
      ]));
      expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('runner reports unknown scenario types without executing declared commands', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'unsupported-scenario', {
        scenario_type: 'unsupported-scenario',
      });

      const result = runTempFixtures(root);

      expect(result.passed).toBe(false);
      expect(result.fixtures[0].validation_commands_status).toBe('declared_only');
      expect(result.failures.map((failure) => failure.reason_code)).toContain('unknown-scenario-type');
      expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('runner links semantic review evidence without turning it into executed validation', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'semantic-review', {
        semantic_review: {
          artifact_path: 'expected/semantic-review.md',
          review_mode: 'llm-review-pass',
          status: 'recorded',
        },
      });
      writeFile(
        path.join(root, 'tests', 'fixtures', 'ai-dev-benchmarks', 'semantic-review', 'expected', 'semantic-review.md'),
        '# Semantic Review\n'
      );

      const result = runTempFixtures(root);

      expect(result.passed).toBe(true);
      expect(result.fixtures).toEqual([
        expect.objectContaining({
          fixture_id: 'semantic-review',
          artifact_paths: expect.arrayContaining([
            'tests/fixtures/ai-dev-benchmarks/semantic-review/expected/semantic-review.md',
          ]),
          semantic_review: {
            artifact_path: 'expected/semantic-review.md',
            review_mode: 'llm-review-pass',
            status: 'recorded',
          },
          validation_commands_status: 'declared_only',
        }),
      ]);
      expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('runner reports missing semantic review evidence as deterministic fixture drift', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'missing-semantic-review', {
        semantic_review: {
          artifact_path: 'expected/semantic-review.md',
          review_mode: 'llm-review-pass',
          status: 'recorded',
        },
      });

      const result = runTempFixtures(root);

      expect(result.passed).toBe(false);
      expect(result.failures.map((failure) => failure.reason_code)).toContain('missing-semantic-review-artifact');
      expect(result.fixtures[0]).toEqual(expect.objectContaining({
        fixture_id: 'missing-semantic-review',
        semantic_review: {
          artifact_path: 'expected/semantic-review.md',
          review_mode: 'llm-review-pass',
          status: 'recorded',
        },
      }));
      expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('runner reports unsafe paths and missing artifact expectations', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'unsafe-path', {
        prompt_path: '../prompt.md',
        expected_artifacts: [],
      });

      const result = runTempFixtures(root);
      const reasonCodes = result.failures.map((failure) => failure.reason_code);

      expect(result.passed).toBe(false);
      expect(reasonCodes).toContain('unsafe-path');
      expect(reasonCodes).toContain('missing-artifact-expectation');
      expect(validateBenchmarkResult({ result: schemaResult(result) }).errors).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('declared validation commands are not executed by the v1 runner', () => {
    const root = createTempRoot();
    try {
      createFixture(root, 'declared-only');

      const result = runTempFixtures(root);

      expect(result.passed).toBe(true);
      expect(result.fixtures).toEqual([
        expect.objectContaining({
          fixture_id: 'declared-only',
          validation_commands_status: 'declared_only',
          validation_commands: ['node definitely-not-executed.js'],
        }),
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
