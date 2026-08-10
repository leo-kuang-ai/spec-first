'use strict';

const { BrandColors } = require('../../src/cli/brand');
const {
  MAX_PREVIEW_DETAIL_LINES,
  MAX_PREVIEW_PATH_SAMPLES_PER_GROUP,
  printInitPreviews,
} = require('../../src/cli/commands/init-output');
const { printInitDiagnostics } = require('../../src/cli/commands/init-diagnostics');

function operationPlan(operations) {
  return {
    operations,
    summary: operations.reduce((summary, operation) => {
      summary[operation.kind] = (summary[operation.kind] || 0) + 1;
      return summary;
    }, {}),
  };
}

function projectPlan(platform, projectRoot, operations, options = {}) {
  return {
    mode: 'single-repo',
    platform,
    projectRoot,
    operationPlan: operationPlan(operations),
    legacyStateDetected: options.legacyStateDetected === true,
    destructiveResetReason: options.destructiveResetReason || '',
  };
}

function allReposPlan(platform, childCount) {
  const workspaceRoot = '/workspace/root';
  const generatedOperation = (target) => ({
    kind: 'write_file',
    path: `.runtime/${target}.md`,
    reason: 'managed_skill',
  });
  return {
    mode: 'all-repos',
    platform,
    workspaceRoot,
    selectionSource: 'explicit-all-repos',
    parentPlan: projectPlan(platform, workspaceRoot, [generatedOperation('parent')]),
    childPlans: Array.from({ length: childCount }, (_, index) => {
      const label = `child-${String(index + 1).padStart(2, '0')}`;
      const childRoot = `${workspaceRoot}/${label}`;
      return {
        candidate: {
          workspace_relative_path: label,
          git_root: childRoot,
        },
        plan: projectPlan(platform, childRoot, [generatedOperation(label)]),
      };
    }),
  };
}

function capturePreview(plans, options = {}) {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  printInitPreviews(plans, { lang: 'en', useColor: false, ...options });
  return logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('bounded init mutation preview', () => {
  test('renders a summary-first six-host preview without destructive path details', () => {
    const platforms = ['claude', 'codex', 'cursor', 'kiro', 'qoder', 'opencode'];
    const plans = platforms.map((platform, platformIndex) => {
      const operations = [
        ...Array.from({ length: 29 }, (_, index) => ({
          kind: 'remove_dir',
          path: `.${platform}/obsolete-${String(index + 1).padStart(2, '0')}`,
          reason: 'managed_runtime_cleanup',
        })),
        ...Array.from({ length: 503 + platformIndex }, (_, index) => ({
          kind: 'write_file',
          path: `.${platform}/generated-${String(index + 1).padStart(4, '0')}.md`,
          reason: 'managed_skill',
        })),
      ];
      return projectPlan(platform, '/workspace/app', operations);
    });

    const output = capturePreview(plans, {
      view: 'summary',
      effectiveGlobalDeveloperWrite: {
        action: 'overwrite',
        resolvedPath: '/home/tester/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
    });
    const lines = output.split('\n').filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(40);
    const labels = ['Claude Code', 'Codex', 'Cursor', 'Kiro', 'Qoder', 'OpenCode'];
    for (const [index, platform] of platforms.entries()) {
      expect(output).toContain(`${labels[index]}:`);
      expect(output).not.toContain(`.${platform}/obsolete-01`);
    }
    expect(output).toContain('174 risk path(s)');
    expect(output).toContain('spec-first init --dry-run');
    expect(output).toContain('Preview only; files change only after confirmation.');
    expect(output.indexOf('174 risk path(s)')).toBeLessThan(output.indexOf('Claude Code:'));
    expect(output).not.toContain('remove_dir:');
    expect(output).not.toContain('No files were changed.');
    expect(output).not.toContain('generated-0001.md');
    expect(output).not.toContain('target_host_groups=');
  });

  test('keeps managed reset disclosure prominent in the summary view', () => {
    const plan = projectPlan('codex', '/workspace/app', [{
      kind: 'remove_dir',
      path: '.agents/skills/spec-plan',
      reason: 'managed_runtime_cleanup',
    }]);
    plan.destructiveResetReason = 'current_runtime_drift';

    const output = capturePreview([plan], { view: 'summary' });

    expect(output).toContain('current runtime drift detected');
    expect(output).toContain('Destructive preview:');
    expect(output.indexOf('Destructive preview:')).toBeLessThan(output.indexOf('Codex:'));
    expect(output).not.toContain('.agents/skills/spec-plan');
  });

  test('deduplicates known host diagnostics and localizes them', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const plans = [
      {
        mode: 'single-repo',
        diagnostics: [{
          level: 'warn',
          code: 'cursor_generated_runtime_preview',
          message: 'raw cursor warning',
        }],
      },
      {
        mode: 'all-repos',
        parentPlan: {
          diagnostics: [{
            level: 'warn',
            code: 'cursor_generated_runtime_preview',
            message: 'raw cursor warning',
          }],
        },
        childPlans: [{
          plan: {
            diagnostics: [{
              level: 'warn',
              code: 'qoder_hook_activation_unverified',
              message: 'raw qoder warning',
            }],
          },
        }],
      },
    ];

    printInitDiagnostics(plans, { lang: 'zh' });

    const output = warnSpy.mock.calls.flat().join('\n');
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(output).toContain('Cursor');
    expect(output).toContain('本机尚未验证');
    expect(output).toContain('Qoder');
    expect(output).toContain('保持未启用');
    expect(output).not.toContain('raw cursor warning');
    expect(output).not.toContain('raw qoder warning');
  });

  test('prints the canonical global profile once with its resolved path', () => {
    const plans = [
      projectPlan('claude', '/workspace/app', []),
      projectPlan('codex', '/workspace/app', []),
    ];
    const resolvedPath = '/home/tester/.spec-first/.developer';

    const output = capturePreview(plans, {
      effectiveGlobalDeveloperWrite: {
        action: 'create',
        resolvedPath,
        globalPath: '~/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
    });

    expect(output.match(/Global developer profile preview:/g) || []).toHaveLength(1);
    expect(output.match(new RegExp(resolvedPath.replaceAll('/', '\\/'), 'g')) || []).toHaveLength(1);
    expect(output).toContain('action: create');
    expect(output).toContain('name: Ada');
    expect(output).toContain('lang: en');
  });

  test('marks preserve as no-op and reuses the resolved path for language-sync profile disclosure', () => {
    const resolvedPath = '/home/tester/.spec-first/.developer';
    const output = capturePreview([
      projectPlan('codex', '/workspace/app', []),
    ], {
      effectiveGlobalDeveloperWrite: {
        action: 'preserve',
        resolvedPath,
        globalPath: '~/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
      userLanguageSyncPlan: {
        mode: 'enabled',
        operations: [],
        profileOperation: {
          action: 'preserve',
          status: 'planned',
          globalPath: '~/.spec-first/.developer',
          value: true,
        },
      },
    });

    expect(output).toContain('action: preserve');
    expect(output).toContain('effect: no-op');
    expect(output.match(new RegExp(resolvedPath.replaceAll('/', '\\/'), 'g')) || [])
      .toHaveLength(2);
    expect(output).not.toContain('~/.spec-first/.developer');
  });

  test('prints destructive paths before write samples', () => {
    const output = capturePreview([
      projectPlan('codex', '/workspace/app', [
        { kind: 'write_file', path: 'AGENTS.md', reason: 'managed_instruction_file' },
        { kind: 'remove_file', path: '.codex/obsolete.md', reason: 'managed_runtime_cleanup' },
        { kind: 'remove_dir', path: '.codex/commands/spec', reason: 'retired_runtime_asset' },
        { kind: 'write_file', path: '.agents/skills/example/SKILL.md', reason: 'managed_skill' },
      ]),
    ]);

    const firstWriteIndex = output.indexOf('AGENTS.md');
    expect(firstWriteIndex).toBeGreaterThan(-1);
    for (const destructivePath of [
      '.codex/obsolete.md',
      '.codex/commands/spec',
    ]) {
      expect(output.indexOf(destructivePath)).toBeGreaterThan(-1);
      expect(output.indexOf(destructivePath)).toBeLessThan(firstWriteIndex);
    }
  });

  test('preserves reset reasons and semantic colors in the canonical bounded renderer', () => {
    const output = capturePreview([
      projectPlan('codex', '/workspace/legacy-app', [
        { kind: 'remove_file', path: '.codex/legacy-runtime.md' },
        { kind: 'write_file', path: 'AGENTS.md', reason: 'managed_instruction_file' },
      ], {
        legacyStateDetected: true,
      }),
      projectPlan('qoder', '/workspace/drift-app', [
        { kind: 'remove_dir', path: '.qoder/commands/spec' },
        { kind: 'write_file', path: '.gitignore', reason: 'managed_gitignore_policy' },
      ], {
        destructiveResetReason: 'current_runtime_drift',
      }),
    ], { useColor: true });

    expect(output).toContain('Would perform a managed hard reset before regenerating runtime assets.');
    expect(output).toContain('Would perform a managed hard reset before regenerating runtime assets (current runtime drift detected).');
    expect(output.match(/Destructive preview:/g) || []).toHaveLength(1);
    expect(output).toContain(
      `Destructive paths (${BrandColors.remove}2${BrandColors.reset}):`,
    );
    expect(output).toContain(
      `Critical write paths (${BrandColors.write}2${BrandColors.reset}):`,
    );
    expect(output).toContain(
      'Target detail: host=codex kind=project label=/workspace/legacy-app root=/workspace/legacy-app reset=legacy',
    );
    expect(output).toContain(
      'Target detail: host=qoder kind=project label=/workspace/drift-app root=/workspace/drift-app reset=current_runtime_drift',
    );
  });

  test('caps generated path samples at eight per target-host group', () => {
    const generatedOperations = Array.from({ length: 12 }, (_, index) => ({
      kind: 'write_file',
      path: `.agents/skills/example/generated-${String(index + 1).padStart(2, '0')}.md`,
      reason: 'managed_skill',
    }));

    const output = capturePreview([
      projectPlan('codex', '/workspace/app', generatedOperations),
    ]);

    expect(MAX_PREVIEW_PATH_SAMPLES_PER_GROUP).toBe(8);
    for (let index = 1; index <= 8; index += 1) {
      expect(output).toContain(`generated-${String(index).padStart(2, '0')}.md`);
    }
    expect(output).not.toContain('generated-09.md');
    expect(output).toContain('generated_paths_omitted: 4');
  });

  test('caps run-wide expandable detail at 100 rows and reports omitted targets and paths', () => {
    const plans = ['claude', 'codex', 'cursor', 'kiro', 'qoder']
      .map((platform) => allReposPlan(platform, 50));
    const lateGroup = plans[plans.length - 1].childPlans[49].plan;
    lateGroup.operationPlan = operationPlan([
      { kind: 'write_file', path: '.runtime/child-50.md', reason: 'managed_skill' },
      { kind: 'remove_file', path: '.qoder/obsolete-runtime.md' },
      { kind: 'remove_dir', path: '.qoder/commands/spec' },
      { kind: 'write_file', path: 'AGENTS.md', reason: 'managed_instruction_file' },
    ]);

    const output = capturePreview(plans);
    const lines = output.split('\n');
    const detailLines = lines.filter((line) => (
      line.startsWith('Target detail:') || line.startsWith('  - ')
    ));
    const targetDetails = lines.filter((line) => line.startsWith('Target detail:'));

    expect(MAX_PREVIEW_DETAIL_LINES).toBe(100);
    expect(detailLines.length).toBeGreaterThan(90);
    expect(detailLines.length).toBeLessThanOrEqual(MAX_PREVIEW_DETAIL_LINES);
    expect(targetDetails.every((line) => (
      line.includes('host=')
        && line.includes('kind=')
        && line.includes('label=')
        && line.includes('root=')
        && line.includes('reset=')
    ))).toBe(true);
    const destructivePaths = [
      '.qoder/obsolete-runtime.md',
      '.qoder/commands/spec',
    ];
    const criticalIndex = output.indexOf('AGENTS.md');
    const generatedIndex = output.indexOf('.runtime/parent.md');
    for (const destructivePath of destructivePaths) {
      expect(output.indexOf(destructivePath)).toBeGreaterThan(-1);
      expect(output.indexOf(destructivePath)).toBeLessThan(criticalIndex);
    }
    expect(criticalIndex).toBeGreaterThan(-1);
    expect(criticalIndex).toBeLessThan(generatedIndex);
    expect(output).toContain('targets=51 hosts=5 target_host_groups=255');
    expect(output).toContain('Preview omitted: targets=3 target_host_groups=207 paths=208');
  });
});
