'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'npm-install-matrix-smoke.js');
const WORKFLOW_PATH = path.join(REPO_ROOT, '.github', 'workflows', 'npm-install-matrix.yml');
const RELEASE_EVIDENCE_SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'release-package-evidence.schema.json');
const KNOWLEDGE_HARNESS_CONTRACT_PATH = 'docs/contracts/knowledge/knowledge-harness.md';

const {
  buildInitProgrammaticEvidence,
  buildPackageContentManifest,
  buildCmdCommandLine,
  buildCursorCleanProgrammaticEvidence,
  buildCursorDoctorProgrammaticEvidence,
  buildCursorLoaderEvidence,
  buildReleaseArtifactSummary,
  checkFromCursorProgrammaticEvidence,
  checkFromCursorLoaderEvidence,
  createArtifactWriter,
  CURSOR_CLEAN_PROGRAMMATIC_LOG_FILE,
  CURSOR_DOCTOR_PROGRAMMATIC_LOG_FILE,
  getEnvValue,
  normalizeArtifactFileName,
  resolveNpmCliPath,
  runWindowsCmdShim,
} = require('../../scripts/npm-install-matrix-smoke');

const VALID_PACK_FILES = [
  'bin/spec-first.js',
  'src/cli/index.js',
  'skills/spec-work/SKILL.md',
  'skills/spec-plan/SKILL.md',
  'scripts/npm-install-matrix-smoke.js',
  'templates/claude/commands/spec/work.md',
  KNOWLEDGE_HARNESS_CONTRACT_PATH,
  'README.md',
].map((filePath, index) => ({
  path: filePath,
  size: index + 1,
  mode: 420,
}));

function packJson(files = VALID_PACK_FILES) {
  return JSON.stringify([
    {
      name: 'spec-first',
      version: '1.8.1',
      filename: 'spec-first-1.8.1.tgz',
      files,
    },
  ]);
}

const REQUIRED_RELEASE_CHECK_IDS = [
  'package-content-manifest',
  'init-claude-programmatic',
  'init-codex-programmatic',
  'init-cursor-programmatic',
  'init-kiro-programmatic',
  'init-qoder-programmatic',
  'cursor-doctor-programmatic',
  'cursor-clean-programmatic',
  'cursor-loader-evidence',
];

function releaseCheck(checkId, status = 'passed') {
  return {
    check_id: checkId,
    status,
    reason_code: `${checkId}-${status}`,
    summary: `${checkId} ${status}`,
    artifact_path: `${checkId}.log`,
  };
}

describe('npm install matrix smoke script', () => {
  test('reads Windows-style environment keys case-insensitively', () => {
    expect(getEnvValue({ COMSPEC: 'C:\\Windows\\System32\\cmd.exe' }, 'ComSpec')).toBe('C:\\Windows\\System32\\cmd.exe');
    expect(getEnvValue({ NPM_EXECPATH: 'C:\\npm\\bin\\npm-cli.js' }, 'npm_execpath')).toBe('C:\\npm\\bin\\npm-cli.js');
  });

  test('resolves npm CLI JavaScript entrypoint without shelling out to npm.cmd', () => {
    const existing = new Set([
      '/opt/node/lib/node_modules/npm/bin/npm-cli.js',
      'C:\\hostedtoolcache\\node\\20\\x64\\node_modules\\npm\\bin\\npm-cli.js',
      'C:\\npm\\bin\\npm-cli.js',
    ]);
    const existsSync = (candidate) => existing.has(candidate);

    expect(resolveNpmCliPath({
      env: {},
      execPath: '/opt/node/bin/node',
      existsSync,
    })).toBe('/opt/node/lib/node_modules/npm/bin/npm-cli.js');

    expect(resolveNpmCliPath({
      env: {},
      execPath: 'C:\\hostedtoolcache\\node\\20\\x64\\node.exe',
      existsSync,
    })).toBe('C:\\hostedtoolcache\\node\\20\\x64\\node_modules\\npm\\bin\\npm-cli.js');

    expect(resolveNpmCliPath({
      env: { NPM_EXECPATH: 'C:\\npm\\bin\\npm-cli.js' },
      execPath: 'C:\\hostedtoolcache\\node\\20\\x64\\node.exe',
      existsSync,
    })).toBe('C:\\npm\\bin\\npm-cli.js');
  });

  test('builds Windows cmd call line for a shim path with spaces', () => {
    expect(buildCmdCommandLine('C:\\Temp\\prefix with spaces\\spec-first.cmd', ['--help'])).toBe('call "C:\\Temp\\prefix with spaces\\spec-first.cmd" "--help"');
  });

  test('runs Windows cmd shim through cmd /d /c call without /s', () => {
    if (process.platform === 'win32') return;

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-cmd-shim-'));
    const fakeComspec = path.join(tempDir, 'fake-cmd.js');
    const argsPath = path.join(tempDir, 'args.json');

    try {
      fs.writeFileSync(fakeComspec, [
        '#!/usr/bin/env node',
        'const fs = require("node:fs");',
        'fs.writeFileSync(process.env.SPEC_FIRST_CAPTURE_ARGS, JSON.stringify(process.argv.slice(2)));',
        '',
      ].join('\n'));
      fs.chmodSync(fakeComspec, 0o755);

      runWindowsCmdShim('C:\\Temp\\prefix with spaces\\spec-first.cmd', ['--help'], {
        env: {
          ...process.env,
          ComSpec: fakeComspec,
          SPEC_FIRST_CAPTURE_ARGS: argsPath,
        },
        stdio: 'pipe',
      });

      expect(JSON.parse(fs.readFileSync(argsPath, 'utf8'))).toEqual([
        '/d',
        '/c',
        'call "C:\\Temp\\prefix with spaces\\spec-first.cmd" "--help"',
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('optional CI artifact writer stores JSON summaries in a workspace directory', () => {
    const previous = process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
    const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-smoke-artifacts-'));

    try {
      process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR = artifactDir;
      const writer = createArtifactWriter();
      writer.write('summary.json', { status: 'passed' });

      expect(writer.dir).toBe(path.resolve(artifactDir));
      expect(JSON.parse(fs.readFileSync(path.join(artifactDir, 'summary.json'), 'utf8'))).toEqual({
        status: 'passed',
      });
    } finally {
      if (previous === undefined) {
        delete process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
      } else {
        process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR = previous;
      }
      fs.rmSync(artifactDir, { recursive: true, force: true });
    }
  });

  test('CI artifact writer rejects path traversal and Windows-invalid file names', () => {
    expect(normalizeArtifactFileName('summary.json')).toBe('summary.json');
    expect(normalizeArtifactFileName('pack-output.log')).toBe('pack-output.log');
    expect(normalizeArtifactFileName('package-content-manifest.json')).toBe('package-content-manifest.json');
    expect(normalizeArtifactFileName('release-artifact-summary.json')).toBe('release-artifact-summary.json');
    expect(normalizeArtifactFileName('init-claude-programmatic.log')).toBe('init-claude-programmatic.log');
    expect(normalizeArtifactFileName('init-codex-programmatic.log')).toBe('init-codex-programmatic.log');
    expect(normalizeArtifactFileName('init-cursor-programmatic.log')).toBe('init-cursor-programmatic.log');
    expect(normalizeArtifactFileName('init-kiro-programmatic.log')).toBe('init-kiro-programmatic.log');
    expect(normalizeArtifactFileName('init-qoder-programmatic.log')).toBe('init-qoder-programmatic.log');
    expect(normalizeArtifactFileName('cursor-doctor-programmatic.log')).toBe('cursor-doctor-programmatic.log');
    expect(normalizeArtifactFileName('cursor-clean-programmatic.log')).toBe('cursor-clean-programmatic.log');
    expect(normalizeArtifactFileName('cursor-loader-evidence.log')).toBe('cursor-loader-evidence.log');

    for (const unsafe of ['../summary.json', '..\\summary.json', '/tmp/summary.json', 'C:\\tmp\\summary.json', 'bad:name.log', '']) {
      expect(() => normalizeArtifactFileName(unsafe)).toThrow(/Unsafe smoke artifact file name/);
    }
  });

  test('package content manifest records npm pack dry-run file facts and required paths', () => {
    const manifest = buildPackageContentManifest(packJson(), {
      generatedAt: '2026-05-11T12:00:00.000Z',
    });

    expect(manifest).toEqual(expect.objectContaining({
      schema_version: 'package-content-manifest.v1',
      source: 'npm pack --dry-run --json',
      file_count: VALID_PACK_FILES.length,
      passed: true,
      failures: [],
    }));
    expect(manifest.package).toEqual({
      name: 'spec-first',
      version: '1.8.1',
      filename: 'spec-first-1.8.1.tgz',
    });
    expect(manifest.files.map((file) => file.path)).toEqual([
      'bin/spec-first.js',
      KNOWLEDGE_HARNESS_CONTRACT_PATH,
      'README.md',
      'scripts/npm-install-matrix-smoke.js',
      'skills/spec-plan/SKILL.md',
      'skills/spec-work/SKILL.md',
      'src/cli/index.js',
      'templates/claude/commands/spec/work.md',
    ].sort((a, b) => a.localeCompare(b)));
    // required_paths 顺序无语义(脚本未对其排序),断言用排序对齐避免耦合插入顺序
    expect(manifest.required_paths.map((item) => item.path).sort((a, b) => a.localeCompare(b))).toEqual([
      'bin/spec-first.js',
      'src/cli/index.js',
      'skills/spec-work/SKILL.md',
      'skills/spec-plan/SKILL.md',
      'scripts/npm-install-matrix-smoke.js',
      'templates/claude/commands/spec/work.md',
      KNOWLEDGE_HARNESS_CONTRACT_PATH,
      'README.md',
    ].sort((a, b) => a.localeCompare(b)));
    expect(manifest.required_paths.every((item) => item.present)).toBe(true);
    expect(manifest.checks.every((check) => check.passed)).toBe(true);
  });

  test('package content manifest fails with reason codes for missing required and forbidden paths', () => {
    const files = [
      ...VALID_PACK_FILES.filter((file) => !['README.md', KNOWLEDGE_HARNESS_CONTRACT_PATH].includes(file.path)),
      { path: '.claude/commands/spec-work.md', size: 12, mode: 420 },
      { path: 'skills/spec-work/scripts/__pycache__/tool.pyc', size: 13, mode: 420 },
    ];
    const manifest = buildPackageContentManifest(packJson(files), {
      generatedAt: '2026-05-11T12:00:00.000Z',
    });

    expect(manifest.passed).toBe(false);
    expect(manifest.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'required-package-path-missing',
        paths: ['README.md'],
      }),
      expect.objectContaining({
        reason_code: 'required-package-path-missing',
        paths: [KNOWLEDGE_HARNESS_CONTRACT_PATH],
      }),
      expect.objectContaining({
        reason_code: 'forbidden-package-path-present',
        paths: ['.claude/commands/spec-work.md'],
      }),
      expect.objectContaining({
        reason_code: 'forbidden-package-path-present',
        paths: ['skills/spec-work/scripts/__pycache__/tool.pyc'],
      }),
    ]));
  });

  test('package content manifest rejects unsafe package paths', () => {
    expect(() => buildPackageContentManifest(packJson([
      ...VALID_PACK_FILES,
      { path: '../outside.js', size: 1, mode: 420 },
    ]))).toThrow(/Unsafe package content path/);

    expect(() => buildPackageContentManifest(packJson([
      ...VALID_PACK_FILES,
      { path: 'C:\\tmp\\outside.js', size: 1, mode: 420 },
    ]))).toThrow(/Unsafe package content path/);
  });

  test('release artifact summary follows the consumer schema and rejects absolute public artifact paths', () => {
    const schema = JSON.parse(fs.readFileSync(RELEASE_EVIDENCE_SCHEMA_PATH, 'utf8'));
    const summary = buildReleaseArtifactSummary({
      generatedAt: '2026-05-11T12:00:00.000Z',
      status: 'passed',
      packageInfo: {
        name: 'spec-first',
        version: '1.8.1',
      },
      tarballName: 'spec-first-1.8.1.tgz',
      platform: 'darwin',
      node: 'v24.0.0',
      checks: REQUIRED_RELEASE_CHECK_IDS.map((checkId) => releaseCheck(checkId, checkId === 'cursor-loader-evidence' ? 'skipped' : 'passed')),
      failures: [],
    });

    expect(validateAgainstSchema(schema, summary).errors).toEqual([]);
    expect(summary.artifacts).toEqual({
      summary: 'summary.json',
      pack_output: 'pack-output.log',
      package_content_manifest: 'package-content-manifest.json',
      init_claude_programmatic_log: 'init-claude-programmatic.log',
      init_codex_programmatic_log: 'init-codex-programmatic.log',
      init_cursor_programmatic_log: 'init-cursor-programmatic.log',
      init_kiro_programmatic_log: 'init-kiro-programmatic.log',
      init_qoder_programmatic_log: 'init-qoder-programmatic.log',
      cursor_doctor_programmatic_log: 'cursor-doctor-programmatic.log',
      cursor_clean_programmatic_log: 'cursor-clean-programmatic.log',
      cursor_loader_evidence_log: 'cursor-loader-evidence.log',
      release_artifact_summary: 'release-artifact-summary.json',
    });

    const invalid = {
      ...summary,
      artifacts: {
        ...summary.artifacts,
        package_content_manifest: '/tmp/package-content-manifest.json',
      },
    };
    expect(validateAgainstSchema(schema, invalid).errors).toContain('root.artifacts.package_content_manifest: value "/tmp/package-content-manifest.json" does not equal const "package-content-manifest.json"');
    expect(Object.values(invalid.artifacts).some((artifactPath) => path.isAbsolute(artifactPath))).toBe(true);
    expect(Object.values(summary.artifacts).some((artifactPath) => path.isAbsolute(artifactPath))).toBe(false);
  });

  test('release artifact summary schema requires every release evidence check id', () => {
    const schema = JSON.parse(fs.readFileSync(RELEASE_EVIDENCE_SCHEMA_PATH, 'utf8'));
    const invalid = buildReleaseArtifactSummary({
      generatedAt: '2026-05-11T12:00:00.000Z',
      status: 'passed',
      checks: [releaseCheck('package-content-manifest')],
      failures: [],
    });

    const errors = validateAgainstSchema(schema, invalid).errors;
    expect(errors).toEqual(expect.arrayContaining([
      'root.checks: expected array to contain matching item',
    ]));
  });

  test('failed release artifact summary requires a failure entry', () => {
    const schema = JSON.parse(fs.readFileSync(RELEASE_EVIDENCE_SCHEMA_PATH, 'utf8'));
    const invalid = buildReleaseArtifactSummary({
      generatedAt: '2026-05-11T12:00:00.000Z',
      status: 'failed',
      failures: [],
    });

    expect(validateAgainstSchema(schema, invalid).errors).toContain('root.failures: expected at least 1 item(s), received 0');
  });

  test('programmatic init evidence detects expected writes', () => {
    const passed = buildInitProgrammaticEvidence({
      host: 'claude',
      result: {
        status: 0,
        stdout: 'Generated 19 command file(s)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: [
        'CLAUDE.md:content',
        '.claude/spec-first/state.json:content',
        '.claude/commands/spec-work.md:content',
        '.claude/spec-first/workflows/spec-work/SKILL.md:content',
        '.claude/skills/using-spec-first/SKILL.md:content',
      ],
    });

    expect(passed).toEqual(expect.objectContaining({
      host: 'claude',
      status: 0,
      passed: true,
      reason_code: 'init-programmatic-passed',
      has_state: true,
      has_instruction: true,
      mutated: true,
      missing_runtime_paths: [],
    }));

    const failed = buildInitProgrammaticEvidence({
      host: 'codex',
      result: {
        status: 0,
        stdout: 'Generated 40 skill directory(ies)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: ['AGENTS.md:changed'],
    });

    expect(failed).toEqual(expect.objectContaining({
      host: 'codex',
      passed: false,
      reason_code: 'init-programmatic-failed',
      has_instruction: true,
      has_state: false,
      mutated: true,
    }));

    const kiroPassed = buildInitProgrammaticEvidence({
      host: 'kiro',
      result: {
        status: 0,
        stdout: 'Generated skill directory(ies)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: [
        'AGENTS.md:content',
        '.kiro/spec-first/state.json:content',
        '.kiro/skills/spec-work/SKILL.md:content',
        '.kiro/skills/spec-mcp-setup/SKILL.md:content',
      ],
    });
    expect(kiroPassed).toEqual(expect.objectContaining({
      host: 'kiro',
      passed: true,
      expected_state_path: '.kiro/spec-first/state.json',
      expected_instruction_path: 'AGENTS.md',
    }));

    const qoderPassed = buildInitProgrammaticEvidence({
      host: 'qoder',
      result: {
        status: 0,
        stdout: 'Generated command file(s)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: [
        'AGENTS.md:content',
        '.qoder/spec-first/state.json:content',
        '.qoder/commands/spec-work.md:content',
        '.qoder/skills/spec-work/SKILL.md:content',
        '.qoder/skills/spec-mcp-setup/SKILL.md:content',
      ],
    });
    expect(qoderPassed).toEqual(expect.objectContaining({
      host: 'qoder',
      passed: true,
      expected_state_path: '.qoder/spec-first/state.json',
      expected_instruction_path: 'AGENTS.md',
    }));

    const cursorPassed = buildInitProgrammaticEvidence({
      host: 'cursor',
      result: {
        status: 0,
        stdout: 'Generated skill directory(ies)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: [
        'AGENTS.md:content',
        '.cursor/spec-first/state.json:content',
        '.cursor/skills/spec-work/SKILL.md:content',
        '.cursor/skills/spec-mcp-setup/SKILL.md:content',
      ],
    });
    expect(cursorPassed).toEqual(expect.objectContaining({
      host: 'cursor',
      passed: true,
      expected_state_path: '.cursor/spec-first/state.json',
      expected_instruction_path: 'AGENTS.md',
      missing_runtime_paths: [],
    }));

    const cursorMissingSkills = buildInitProgrammaticEvidence({
      host: 'cursor',
      result: {
        status: 0,
        stdout: 'Generated skill directory(ies)',
        stderr: '',
      },
      beforeSnapshot: [],
      afterSnapshot: [
        'AGENTS.md:content',
        '.cursor/spec-first/state.json:content',
      ],
    });
    expect(cursorMissingSkills).toEqual(expect.objectContaining({
      host: 'cursor',
      passed: false,
      reason_code: 'init-programmatic-failed',
      missing_runtime_paths: [
        '.cursor/skills/spec-work/SKILL.md',
        '.cursor/skills/spec-mcp-setup/SKILL.md',
      ],
    }));
  });

  test('Cursor doctor and clean programmatic evidence validates generated runtime assets', () => {
    const doctorEvidence = buildCursorDoctorProgrammaticEvidence({
      packageRoot: REPO_ROOT,
      cwd: REPO_ROOT,
      result: {
        status: 0,
        stdout: JSON.stringify({
          platforms: ['cursor'],
          platform_checks: {
            cursor: [
              { name: 'Cursor generated-runtime preview' },
              { name: '.cursor/skills' },
            ],
          },
        }),
        stderr: '',
      },
    });
    expect(doctorEvidence).toEqual(expect.objectContaining({
      schema_version: 'cursor-doctor-programmatic.v1',
      passed: true,
      reason_code: 'cursor-doctor-programmatic-passed',
      has_cursor_platform: true,
      has_preview_check: true,
      has_skill_root_check: true,
    }));

    const cleanEvidence = buildCursorCleanProgrammaticEvidence({
      packageRoot: REPO_ROOT,
      cwd: REPO_ROOT,
      result: {
        status: 0,
        stdout: [
          'Dry run: spec-first clean (cursor)',
          '.cursor/skills/spec-work',
          '.cursor/spec-first/state.json',
          'No files were changed.',
        ].join('\n'),
        stderr: '',
      },
    });
    expect(cleanEvidence).toEqual(expect.objectContaining({
      schema_version: 'cursor-clean-programmatic.v1',
      passed: true,
      reason_code: 'cursor-clean-programmatic-passed',
      missing_fragments: [],
      forbidden_matches: [],
    }));

    const doctorCheck = checkFromCursorProgrammaticEvidence({
      evidence: {
        passed: true,
        reason_code: 'cursor-doctor-programmatic-passed',
      },
      checkId: 'cursor-doctor-programmatic',
      artifactPath: CURSOR_DOCTOR_PROGRAMMATIC_LOG_FILE,
      label: 'Cursor doctor programmatic evidence',
    });
    expect(doctorCheck).toEqual({
      check_id: 'cursor-doctor-programmatic',
      status: 'passed',
      reason_code: 'cursor-doctor-programmatic-passed',
      summary: 'Cursor doctor programmatic evidence passed against Cursor generated-runtime preview assets.',
      artifact_path: 'cursor-doctor-programmatic.log',
    });

    const cleanCheck = checkFromCursorProgrammaticEvidence({
      evidence: {
        passed: false,
        reason_code: 'cursor-clean-programmatic-failed',
      },
      checkId: 'cursor-clean-programmatic',
      artifactPath: CURSOR_CLEAN_PROGRAMMATIC_LOG_FILE,
      label: 'Cursor clean dry-run programmatic evidence',
    });
    expect(cleanCheck).toEqual(expect.objectContaining({
      check_id: 'cursor-clean-programmatic',
      status: 'failed',
      artifact_path: 'cursor-clean-programmatic.log',
    }));
    expect(typeof buildCursorCleanProgrammaticEvidence).toBe('function');
  });

  test('Cursor loader evidence stays degraded until a real Cursor user journey is recorded', () => {
    const evidence = buildCursorLoaderEvidence({
      generatedAt: '2026-07-05T12:00:00.000Z',
    });
    expect(evidence).toEqual({
      schema_version: 'cursor-loader-evidence.v1',
      generated_at: '2026-07-05T12:00:00.000Z',
      status: 'skipped',
      support_status: 'generated_runtime_preview',
      reason_code: 'cursor_loader_validation_unavailable',
      summary: expect.stringContaining('generated-runtime preview assets only'),
      artifact_path: 'cursor-loader-evidence.log',
    });
    expect(checkFromCursorLoaderEvidence(evidence)).toEqual({
      check_id: 'cursor-loader-evidence',
      status: 'skipped',
      reason_code: 'cursor_loader_validation_unavailable',
      summary: evidence.summary,
      artifact_path: 'cursor-loader-evidence.log',
    });
  });

  test('workflow uses reusable smoke script and avoids shell true fallback', () => {
    const script = fs.readFileSync(SCRIPT_PATH, 'utf8');
    const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

    expect(workflow).toContain('run: node scripts/npm-install-matrix-smoke.js');
    expect(workflow).toContain('os: [ubuntu-latest, macos-latest, windows-latest]');
    expect(workflow).toContain('node: [20, 22, 24]');
    expect(workflow).toContain("if: runner.os != 'Windows'");
    expect(workflow).toContain('shell: pwsh');
    expect(workflow).toContain('shell: cmd');
    expect(workflow).toContain('run: node scripts\\npm-install-matrix-smoke.js');
    expect(workflow).toContain('SPEC_FIRST_SMOKE_ARTIFACT_DIR');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('if-no-files-found: ignore');
    for (const filter of [
      'agents/**',
      'docs/contracts/verifiers/**',
      'skills/**',
      'templates/**',
      'README.md',
      '.npmignore',
      'docs/contracts/release-package-evidence.schema.json',
      'scripts/generate-runtime-capability-catalog.js',
      'scripts/npm-install-matrix-smoke.js',
      'scripts/run-test-suite.cjs',
      'scripts/typecheck-js.js',
      'tests/unit/npm-install-matrix-smoke.test.js',
    ]) {
      expect(workflow).toContain(`- '${filter}'`);
    }
    expect(workflow).not.toContain('shell: node {0}');
    expect(workflow).not.toContain('shell: process.platform ===');
    expect(script).not.toContain('shell: process.platform ===');
    expect(script).toContain('shell: false');
    expect(script).toContain("['/d', '/c', buildCmdCommandLine(shim, args)]");
    expect(script).toContain("return ['call', command, ...args]");
    expect(script).toContain('prefix with spaces');
    expect(script).toContain('workspace [win64] 中文 (paren)');
    expect(script).toContain('runInstalledProgrammaticInitResult');
    expect(script).toContain("target: { mode: 'single-repo', projectRoot }");
    expect(script).toContain("['doctor', '--json']");
    expect(script).toContain('minimal git repo [win64] 中文');
    expect(script).toContain("runGit(['init']");
    expect(script).toContain('summary.json');
    expect(script).toContain('pack-output.log');
    expect(script).toContain('package-content-manifest.json');
    expect(script).toContain('release-artifact-summary.json');
    expect(script).toContain('init-claude-programmatic.log');
    expect(script).toContain('init-codex-programmatic.log');
    expect(script).toContain('init-cursor-programmatic.log');
    expect(script).toContain('init-kiro-programmatic.log');
    expect(script).toContain('init-qoder-programmatic.log');
    expect(script).toContain('cursor-loader-evidence.log');
    expect(script).toContain("['claude', 'codex', 'cursor', 'kiro', 'qoder']");
    expect(script).not.toContain("['init', '--claude'");
    expect(script).not.toContain("['init', '--codex'");
    expect(script).toContain('cmd.exe');
  });
});
