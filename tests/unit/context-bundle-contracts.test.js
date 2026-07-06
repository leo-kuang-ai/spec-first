'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runCli } = require('../../src/cli');
const { buildContextBundle } = require('../../src/cli/helpers/context-bundle');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readPlanSurface() {
  return [
    read('skills/spec-plan/SKILL.md'),
    read('skills/spec-plan/references/governance-boundaries.md'),
  ].join('\n');
}

function jsonBlocks(markdown) {
  const blocks = [];
  const pattern = /```json\n([\s\S]*?)\n```/g;
  let match = pattern.exec(markdown);
  while (match) {
    blocks.push(JSON.parse(match[1]));
    match = pattern.exec(markdown);
  }
  return blocks;
}

function captureRunCli(args) {
  let stdout = '';
  let stderr = '';
  const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  const logSpy = jest.spyOn(console, 'log').mockImplementation((chunk = '') => {
    stdout += `${String(chunk)}\n`;
  });
  const errorSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });

  return runCli(args)
    .then((code) => ({ code, stdout, stderr }))
    .finally(() => {
      outputSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });
}

describe('context bundle and summary contracts', () => {
  test('contract docs define parseable v1 examples with light boundaries', () => {
    const contextBundle = read('docs/contracts/context-bundle.md');
    const artifactSummary = read('docs/contracts/artifact-summary.md');
    const reviewFinding = read('docs/contracts/workflows/review-finding.md');
    const governance = read('docs/contracts/context-governance.md');

    const [request, bundle] = jsonBlocks(contextBundle);
    const [summary] = jsonBlocks(artifactSummary);
    const [finding] = jsonBlocks(reviewFinding);

    expect(request.schema_version).toBe('spec-first.context-request.v1');
    expect(bundle.schema_version).toBe('spec-first.context-bundle.v1');
    expect(bundle.related_paths[0].path).toBe('skills/spec-work/SKILL.md');
    expect(bundle.artifact_summaries[0].reason).toBe('summary-first handoff');
    expect(bundle.evidence_paths[0].path).toBe('tests/unit/spec-work-contracts.test.js');
    expect(bundle.evidence_summaries[0].schema_version).toBe('direct-evidence-summary.v1');
    expect(bundle.full_read_triggers.length).toBeGreaterThan(0);
    expect(bundle.excluded_context[0].reason_code).toBe('runtime_audit_artifact_excluded');

    expect(summary.schema_version).toBe('spec-first.artifact-summary.v1');
    expect(summary.evidence_summaries[0].kind).toBe('direct-evidence');
    expect(summary.evidence_summaries[0].redaction_status).toBe('none-required');
    expect(summary.full_artifact_read_triggers.length).toBeGreaterThan(0);
    expect(finding.schema_version).toBe('spec-first.review-finding.v1');
    expect(finding.evidence[0].path).toBe('repo-relative/path');

    expect(contextBundle).toContain('不搜索 repo、不排序文件、不检查 provider internals，也不决定 semantic relevance');
    expect(artifactSummary).toContain('不是第二份完整报告');
    expect(reviewFinding).toContain('不是 `spec-code-review` reviewer JSON 返回 schema');
    expect(reviewFinding).toContain('skills/spec-code-review/references/findings-schema.json');
    expect(reviewFinding).toContain('不得静默丢弃 P0/P1 findings');
    expect(reviewFinding).toContain('External-tool evidence is supporting evidence');
    expect(reviewFinding).toContain('must not form a high-confidence finding');
    expect(governance).toContain('stable instruction prefix');
    expect(governance).toContain('dynamic suffix');
    expect(governance).toContain('External-tool results and session summaries');
    expect(governance).toContain('raw MCP dumps');
    expect(governance).toContain('compact facts, source-read requirements, limitations, and precise artifact paths');
    expect(governance).toContain('docs/contracts/context-bundle.md');
    expect(governance).toContain('docs/contracts/artifact-summary.md');
    expect(governance).toContain('`host_local_config_excluded`');
  });

  test('high-frequency workflows consume compact context contracts instead of full broadcast by default', () => {
    const codeReview = read('skills/spec-code-review/SKILL.md');
    const work = read('skills/spec-work/SKILL.md');
    const plan = readPlanSurface();
    const docReview = read('skills/spec-doc-review/SKILL.md');
    const compound = read('skills/spec-compound/SKILL.md');

    for (const content of [codeReview, work, plan]) {
      expect(content).toContain('stable instruction prefix');
      expect(content).toContain('dynamic suffix');
      expect(content).toContain('artifact-summary.v1');
      expect(content).toContain('context-bundle.v1');
      expect(content).toContain('docs/contracts/context-bundle.md');
    }

    for (const content of [codeReview, work, plan, docReview]) {
      expect(content).toContain('Maintain a run-local context ledger for this workflow');
      expect(content).toContain('paths read, reason, phase, and compact summary');
      expect(content).toContain('Reuse loaded summaries within the same workflow run');
      expect(content).toContain('Re-read only when exact wording is needed');
    }

    expect(codeReview).toContain('docs/contracts/workflows/review-finding.md');
    expect(codeReview).toContain('skills/spec-code-review/references/findings-schema.json');
    expect(codeReview).toContain('P0-P3 severity');
    expect(codeReview).toContain('0/25/50/75/100 confidence anchors');
    expect(codeReview).toContain('review-finding.v1` 仅用于 downstream / compact mapped summary');
    expect(docReview).toContain('selected document sections');
    expect(docReview).toContain('instead of an automatic full-document broadcast');
    expect(docReview).toContain('review-finding.v1');
    expect(docReview).toContain('finding caps');
    expect(compound).toContain('docs/contracts/artifact-summary.md');
    expect(compound).toContain('not copy full upstream reports or raw tool output');
  });

  test('internal context-bundle helper emits path-backed envelope and applies runtime exclusion', () => {
    const bundle = buildContextBundle({
      stage: 'work',
      intent: 'execute_minimal_context_governance',
      changedFiles: [
        'skills/spec-work/SKILL.md',
        '.spec-first/audits/old-run/summary.json',
        '.spec-first/governance/rule-maturity.json',
        '.spec-first/workspace/legacy-summary.json',
      ],
      relatedPaths: ['docs/contracts/context-bundle.md'],
      artifactSummaries: ['docs/contracts/artifact-summary.md'],
      evidencePaths: [
        '.spec-first/workspace/scenario-fingerprint-setup.json',
        '.spec-first/app-audit/latest/summary.json',
        '.spec-first/workflows/spec-work/run.json',
        '.spec-first/sessions/session-a.json',
        '.agents/skills/spec-work/SKILL.md',
        '.cursor/skills/spec-work/SKILL.md',
        '.cursor/spec-first/state.json',
        '.cursor/mcp.json',
        '.cursor/rules/product.mdc',
        '.cursor/agents/custom-agent.md',
        '.kiro/skills/spec-work/SKILL.md',
        '.kiro/agents/spec-security-reviewer.agent.md',
        '.kiro/spec-first/state.json',
        '.kiro/settings/mcp.json',
        '.qoder/commands/spec-work.md',
        '.qoder/settings.local.json',
        '.kiro/specs/feature-a/requirements.md',
        'tests/unit/context-bundle-contracts.test.js',
      ],
      fullReadTriggers: ['summary_missing'],
      maxFiles: 10,
      maxTokens: 1000000,
      allowRuntimeContext: false,
    }, { cwd: REPO_ROOT });

    expect(bundle.schema_version).toBe('spec-first.context-bundle.v1');
    expect(bundle.request.schema_version).toBe('spec-first.context-request.v1');
    expect(bundle.related_paths.map((entry) => entry.path)).toContain('skills/spec-work/SKILL.md');
    expect(bundle.related_paths.map((entry) => entry.path)).toContain('docs/contracts/context-bundle.md');
    expect(bundle.artifact_summaries.map((entry) => entry.path)).toContain('docs/contracts/artifact-summary.md');
    expect(bundle.evidence_paths.map((entry) => entry.path)).toContain('tests/unit/context-bundle-contracts.test.js');
    expect(bundle.evidence_paths.map((entry) => entry.path)).toContain('.kiro/specs/feature-a/requirements.md');
    expect(bundle.evidence_paths.map((entry) => entry.path)).toContain('.cursor/rules/product.mdc');
    expect(bundle.evidence_paths.map((entry) => entry.path)).toContain('.cursor/agents/custom-agent.md');
    expect(bundle.excluded_context).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '.spec-first/audits/old-run/summary.json',
        reason_code: 'runtime_audit_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/governance/rule-maturity.json',
        reason_code: 'runtime_governance_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/workspace/legacy-summary.json',
        reason_code: 'runtime_context_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/workspace/scenario-fingerprint-setup.json',
        reason_code: 'runtime_context_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/app-audit/latest/summary.json',
        reason_code: 'runtime_context_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/workflows/spec-work/run.json',
        reason_code: 'runtime_context_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.spec-first/sessions/session-a.json',
        reason_code: 'runtime_context_artifact_excluded',
      }),
      expect.objectContaining({
        path: '.agents/skills/spec-work/SKILL.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.cursor/skills/spec-work/SKILL.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.cursor/spec-first/state.json',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        kind: 'host_local_config',
        path: '.cursor/mcp.json',
        reason_code: 'host_local_config_excluded',
      }),
      expect.objectContaining({
        path: '.kiro/skills/spec-work/SKILL.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.kiro/agents/spec-security-reviewer.agent.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.kiro/spec-first/state.json',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.kiro/settings/mcp.json',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.qoder/commands/spec-work.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        kind: 'host_local_config',
        path: '.qoder/settings.local.json',
        reason_code: 'host_local_config_excluded',
      }),
    ]));
    expect(bundle.full_read_triggers).toEqual(['summary_missing']);
    expect(bundle.degraded).toBe(false);
  });

  test('internal context-bundle helper canonicalizes paths before exclusion', () => {
    const bundle = buildContextBundle({
      stage: 'code-review',
      intent: 'block_runtime_traversal',
      changedFiles: ['skills/../.codex/spec-first/.developer'],
      relatedPaths: ['../spec-first/.agents/skills/spec-work/SKILL.md'],
      artifactSummaries: ['./docs/contracts/../contracts/artifact-summary.md'],
      evidencePaths: ['../outside-context.md'],
      fullReadTriggers: [],
      maxFiles: 10,
      maxTokens: 1000000,
      allowRuntimeContext: false,
    }, { cwd: REPO_ROOT });

    expect(bundle.request.changed_files).toEqual(['.codex/spec-first/.developer']);
    expect(bundle.artifact_summaries.map((entry) => entry.path)).toEqual([
      'docs/contracts/artifact-summary.md',
    ]);
    expect(bundle.related_paths).toEqual([]);
    expect(bundle.evidence_paths).toEqual([]);
    expect(bundle.excluded_context).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '.codex/spec-first/.developer',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '.agents/skills/spec-work/SKILL.md',
        reason_code: 'generated_runtime_mirror_excluded',
      }),
      expect.objectContaining({
        path: '../outside-context.md',
        reason_code: 'outside_repo_context_excluded',
      }),
    ]));
  });

  test('internal context-bundle helper resolves repo root from invocation subdirectories', () => {
    const bundle = buildContextBundle({
      stage: 'code-review',
      intent: 'subdir_invocation',
      changedFiles: ['skills/spec-code-review/SKILL.md'],
      relatedPaths: ['../../skills/spec-work/SKILL.md'],
      artifactSummaries: [],
      evidencePaths: [],
      fullReadTriggers: [],
      maxFiles: 10,
      maxTokens: 1000000,
      allowRuntimeContext: false,
    }, { cwd: path.join(REPO_ROOT, 'src', 'cli') });

    expect(bundle.request.changed_files).toEqual(['skills/spec-code-review/SKILL.md']);
    expect(bundle.related_paths).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'skills/spec-code-review/SKILL.md',
        tokens_estimated: expect.any(Number),
      }),
      expect.objectContaining({
        path: 'skills/spec-work/SKILL.md',
        tokens_estimated: expect.any(Number),
      }),
    ]));
    expect(bundle.related_paths.every((entry) => entry.tokens_estimated > 0)).toBe(true);
    expect(bundle.excluded_context).toEqual([]);
  });

  test('internal context-bundle helper excludes symlink escapes from ordinary context', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'context-bundle-symlink-'));
    const repoRoot = path.join(tempRoot, 'repo');
    const outsideRoot = path.join(tempRoot, 'outside');
    fs.mkdirSync(repoRoot);
    fs.mkdirSync(outsideRoot);
    const outsideFile = path.join(outsideRoot, 'secret.txt');
    const linkPath = path.join(repoRoot, 'linked-secret.txt');
    fs.writeFileSync(outsideFile, 'secret');
    try {
      fs.symlinkSync(outsideFile, linkPath);
    } catch (_error) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      return;
    }

    try {
      const bundle = buildContextBundle({
        stage: 'code-review',
        intent: 'symlink_escape',
        changedFiles: [],
        relatedPaths: ['linked-secret.txt'],
        artifactSummaries: [],
        evidencePaths: [],
        fullReadTriggers: [],
        maxFiles: 10,
        maxTokens: 1000000,
        allowRuntimeContext: false,
      }, { cwd: repoRoot, repoRoot });

      expect(bundle.related_paths).toEqual([]);
      expect(bundle.excluded_context).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: 'linked-secret.txt',
          reason_code: 'outside_repo_context_excluded',
        }),
      ]));
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('internal context-bundle helper excludes missing files under symlinked directories', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'context-bundle-symlink-dir-'));
    const repoRoot = path.join(tempRoot, 'repo');
    const outsideRoot = path.join(tempRoot, 'outside');
    fs.mkdirSync(repoRoot);
    fs.mkdirSync(outsideRoot);
    const linkPath = path.join(repoRoot, 'linked-dir');
    try {
      fs.symlinkSync(outsideRoot, linkPath, 'dir');
    } catch (_error) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      return;
    }

    try {
      const bundle = buildContextBundle({
        stage: 'code-review',
        intent: 'symlink_dir_escape',
        changedFiles: [],
        relatedPaths: ['linked-dir/future.txt'],
        artifactSummaries: [],
        evidencePaths: [],
        fullReadTriggers: [],
        maxFiles: 10,
        maxTokens: 1000000,
        allowRuntimeContext: false,
      }, { cwd: repoRoot, repoRoot });

      expect(bundle.related_paths).toEqual([]);
      expect(bundle.excluded_context).toEqual(expect.arrayContaining([
        expect.objectContaining({
          path: 'linked-dir/future.txt',
          reason_code: 'outside_repo_context_excluded',
        }),
      ]));
      expect(fs.existsSync(path.join(outsideRoot, 'future.txt'))).toBe(false);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('internal context-bundle helper records budget pressure and bounded exclusions', () => {
    const maxFilesBundle = buildContextBundle({
      stage: 'work',
      intent: 'budget_check',
      changedFiles: ['skills/spec-work/SKILL.md'],
      relatedPaths: ['docs/contracts/context-bundle.md'],
      artifactSummaries: ['docs/contracts/artifact-summary.md'],
      evidencePaths: [],
      fullReadTriggers: [],
      maxFiles: 1,
      maxTokens: 1000000,
      allowRuntimeContext: false,
    }, { cwd: REPO_ROOT });

    expect(maxFilesBundle.degraded).toBe(true);
    expect(maxFilesBundle.reason_code).toBe('context_budget_exceeded');
    expect(maxFilesBundle.related_paths.map((entry) => entry.path)).toEqual(['skills/spec-work/SKILL.md']);
    expect(maxFilesBundle.excluded_context).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'docs/contracts/context-bundle.md',
        reason_code: 'context_budget_exceeded',
      }),
      expect.objectContaining({
        path: 'docs/contracts/artifact-summary.md',
        reason_code: 'context_budget_exceeded',
      }),
    ]));

    const maxTokensBundle = buildContextBundle({
      stage: 'work',
      intent: 'token_budget_check',
      changedFiles: ['skills/spec-work/SKILL.md'],
      relatedPaths: [],
      artifactSummaries: [],
      evidencePaths: [],
      fullReadTriggers: [],
      maxFiles: 10,
      maxTokens: 0,
      allowRuntimeContext: false,
    }, { cwd: REPO_ROOT });

    expect(maxTokensBundle.budget_used.estimated_tokens).toBeGreaterThan(0);
    expect(maxTokensBundle.degraded).toBe(true);
    expect(maxTokensBundle.reason_code).toBe('context_budget_exceeded');
  });

  test('internal context-bundle helper can explicitly include runtime context', () => {
    const bundle = buildContextBundle({
      stage: 'skill-audit',
      intent: 'runtime_drift_check',
      changedFiles: [],
      relatedPaths: ['.spec-first/workspace/scenario-fingerprint-setup.json', '.agents/skills/spec-work/SKILL.md'],
      artifactSummaries: [],
      evidencePaths: [],
      fullReadTriggers: [],
      maxFiles: 10,
      maxTokens: 1000000,
      allowRuntimeContext: true,
    }, { cwd: REPO_ROOT });

    expect(bundle.related_paths).toEqual([
      expect.objectContaining({
        path: '.spec-first/workspace/scenario-fingerprint-setup.json',
        reason: 'explicitly provided related path; runtime context explicitly allowed',
      }),
      expect.objectContaining({
        path: '.agents/skills/spec-work/SKILL.md',
        reason: 'explicitly provided related path; runtime context explicitly allowed',
      }),
    ]);
    expect(bundle.excluded_context).toEqual([]);
  });

  test('internal CLI keeps context-bundle hidden from public help and returns JSON', async () => {
    const help = await captureRunCli(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).not.toContain('context-bundle');

    const internalHelp = await captureRunCli([
      'internal',
      'context-bundle',
      '--help',
    ]);
    expect(internalHelp.code).toBe(0);
    expect(internalHelp.stdout).toContain('Usage: spec-first internal context-bundle');
    expect(internalHelp.stdout).toContain('--allow-runtime-context');

    const result = await captureRunCli([
      'internal',
      'context-bundle',
      '--json',
      '--stage', 'code-review',
      '--intent', 'review_diff',
      '--changed-file', 'skills/spec-code-review/SKILL.md',
      '--artifact-summary', 'docs/contracts/artifact-summary.md',
      '--evidence-path', 'tests/unit/context-bundle-contracts.test.js',
      '--full-read-trigger', 'actionable finding needs exact evidence',
    ]);

    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.context_bundle.schema_version).toBe('spec-first.context-bundle.v1');
    expect(payload.context_bundle.related_paths[0].path).toBe('skills/spec-code-review/SKILL.md');
    expect(payload.context_bundle.artifact_summaries[0].path).toBe('docs/contracts/artifact-summary.md');
    expect(payload.context_bundle.evidence_paths[0].path).toBe('tests/unit/context-bundle-contracts.test.js');
  });

  test('internal CLI context-bundle canonicalizes repo paths when invoked below repo root', async () => {
    const originalCwd = process.cwd();
    process.chdir(path.join(REPO_ROOT, 'src', 'cli'));
    try {
      const result = await captureRunCli([
        'internal',
        'context-bundle',
        '--json',
        '--stage', 'code-review',
        '--changed-file', 'skills/spec-code-review/SKILL.md',
        '--related-path', '../../skills/spec-work/SKILL.md',
      ]);

      expect(result.code).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.context_bundle.request.changed_files).toEqual(['skills/spec-code-review/SKILL.md']);
      expect(payload.context_bundle.related_paths.map((entry) => entry.path)).toEqual([
        'skills/spec-code-review/SKILL.md',
        'skills/spec-work/SKILL.md',
      ]);
      expect(payload.context_bundle.excluded_context).toEqual([]);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('internal CLI returns JSON errors for invalid context-bundle arguments', async () => {
    const missingStage = await captureRunCli([
      'internal',
      'context-bundle',
      '--json',
    ]);

    expect(missingStage.code).toBe(2);
    expect(JSON.parse(missingStage.stdout)).toEqual({
      ok: false,
      error: {
        code: 'missing_required_option',
        message: 'Missing required option: --stage',
      },
    });

    const invalidMaxFiles = await captureRunCli([
      'internal',
      'context-bundle',
      '--json',
      '--stage', 'work',
      '--max-files', 'NaN',
    ]);

    expect(invalidMaxFiles.code).toBe(2);
    expect(JSON.parse(invalidMaxFiles.stdout).error).toEqual({
      code: 'invalid_option',
      message: '--max-files must be a non-negative integer',
    });

    const invalidMaxTokens = await captureRunCli([
      'internal',
      'context-bundle',
      '--json',
      '--stage', 'work',
      '--max-tokens', '-1',
    ]);

    expect(invalidMaxTokens.code).toBe(2);
    expect(JSON.parse(invalidMaxTokens.stdout).error).toEqual({
      code: 'invalid_option',
      message: '--max-tokens must be a non-negative integer',
    });
  });
});
