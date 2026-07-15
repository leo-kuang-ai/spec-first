'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { resolveWorkflowArtifactDir } = require('../src/verification/artifact-paths');
const { buildQualityFeedbackTopics } = require('../src/verification/quality-feedback');
const GATE_ID = 'ai-dev-quality-gate';
const QUALITY_FEEDBACK_FILE = 'quality-feedback-topics.json';
const WORKFLOW_RUNTIME_CONTRACT_TESTS = [
  'tests/unit/changelog-format.test.js',
  'tests/unit/mcp-setup-config-consumers.test.js',
  'tests/unit/mcp-setup-entrypoint.test.js',
  'tests/unit/mcp-setup-facts-renderer.test.js',
  'tests/unit/mcp-setup-node-contracts.test.js',
  'tests/unit/mcp-setup-providers.test.js',
  'tests/unit/mcp-setup-registry.test.js',
  'tests/unit/platform-registry-patterns.test.js',
  'tests/unit/plugin-modules.test.js',
  'tests/unit/pipeline-mode-contracts.test.js',
  'tests/unit/plan-status-helper.test.js',
  'tests/unit/plans-command.test.js',
  'tests/unit/plan-status-taxonomy.test.js',
  'tests/unit/requirements-rendering-parity.test.js',
  'tests/unit/repo-profile-cache-parity.test.js',
  'tests/unit/secret-deny-patterns-contracts.test.js',
  'tests/unit/spec-plan-contracts.test.js',
  'tests/unit/spec-brainstorm-contracts.test.js',
  'tests/unit/spec-lfg-contracts.test.js',
  'tests/unit/task-pack-command.test.js',
  'tests/unit/spec-write-tasks-contracts.test.js',
  'tests/unit/spec-work-contracts.test.js',
  'tests/unit/spec-doc-review-contracts.test.js',
  'tests/unit/spec-code-review-contracts.test.js',
  'tests/unit/test-inventory-contracts.test.js',
  'tests/integration/plan-status-closeout.integration.test.js',
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function relativeArtifactPath(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function buildGateResult({ generatedAt, workflowRuntimeContracts }) {
  const checks = [workflowRuntimeContracts];
  return {
    schema_version: 'v1',
    generated_at: generatedAt,
    gate_id: GATE_ID,
    passed: checks.every((check) => check.passed),
    checks,
    failures: checks.filter((check) => !check.passed).map((check) => check.check_id),
    advisory_failures: [],
  };
}

function runWorkflowRuntimeContractsSuite({ repoRoot, artifactDir }) {
  const jestBin = require.resolve('jest/bin/jest');
  const outputPath = path.join(artifactDir, 'workflow-runtime-contracts.junit.json');
  const result = spawnSync(process.execPath, [
    jestBin,
    ...WORKFLOW_RUNTIME_CONTRACT_TESTS,
    '--runInBand',
    '--json',
    `--outputFile=${outputPath}`,
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    : null;

  return {
    check_id: 'workflow-runtime-contracts',
    kind: 'unit-suite',
    passed: result.status === 0 && output && output.success === true,
    summary: {
      test_suites_total: output ? output.numTotalTestSuites : null,
      test_suites_failed: output ? output.numFailedTestSuites : null,
      tests_total: output ? output.numTotalTests : null,
      tests_failed: output ? output.numFailedTests : null,
    },
    artifact_path: fs.existsSync(outputPath) ? relativeArtifactPath(repoRoot, outputPath) : null,
  };
}

function runAiDevQualityGate({ repoRoot = process.cwd() } = {}) {
  const generatedAt = new Date().toISOString();
  const artifactDir = resolveWorkflowArtifactDir(repoRoot, 'quality-gates', GATE_ID);
  ensureDir(artifactDir);

  const workflowRuntimeContracts = runWorkflowRuntimeContractsSuite({ repoRoot, artifactDir });
  const gateResult = buildGateResult({ generatedAt, workflowRuntimeContracts });
  const resultPath = path.join(artifactDir, 'ai-dev-quality-gate-result.json');
  writeJson(resultPath, gateResult);
  const feedbackTopics = buildQualityFeedbackTopics({
    generatedAt,
    aiDevQualityGateResult: gateResult,
    gateArtifactPath: relativeArtifactPath(repoRoot, resultPath),
  });
  const feedbackPath = path.join(artifactDir, QUALITY_FEEDBACK_FILE);
  writeJson(feedbackPath, feedbackTopics);

  return {
    ...gateResult,
    artifact_path: relativeArtifactPath(repoRoot, resultPath),
    feedback_artifact_path: relativeArtifactPath(repoRoot, feedbackPath),
  };
}

if (require.main === module) {
  const result = runAiDevQualityGate({ repoRoot: process.cwd() });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.passed) {
    process.exitCode = 1;
  }
}

module.exports = {
  GATE_ID,
  QUALITY_FEEDBACK_FILE,
  WORKFLOW_RUNTIME_CONTRACT_TESTS,
  buildGateResult,
  runAiDevQualityGate,
};
