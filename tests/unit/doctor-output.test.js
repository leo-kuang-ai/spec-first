'use strict';

const {
  buildRuntimeStatusProjection,
  formatDoctorHumanReport,
} = require('../../src/cli/commands/doctor');

function createReport({
  platforms = ['claude', 'codex'],
  commonChecks = [],
  platformChecks = {},
  hostSupport = {},
  selectionMode = 'auto',
  hasError = false,
  decisionInputHealth,
  decisionInputHealthBasis,
  workflowRunnability,
  workflowRunnabilityBasis,
} = {}) {
  const resolvedPlatformChecks = Object.fromEntries(
    platforms.map((platform) => [platform, platformChecks[platform] || []]),
  );
  const checks = [
    ...commonChecks,
    ...Object.values(resolvedPlatformChecks).flat(),
  ];

  return {
    platforms,
    common_checks: commonChecks,
    platform_checks: resolvedPlatformChecks,
    host_support: hostSupport,
    selection_mode: selectionMode,
    checks,
    warnings: checks.filter((check) => check.level === 'WARNING'),
    has_error: hasError,
    decision_input_health: decisionInputHealth,
    decision_input_health_basis: decisionInputHealthBasis,
    workflow_runnability: workflowRunnability,
    workflow_runnability_basis: workflowRunnabilityBasis,
  };
}

describe('doctor human-readable output', () => {
  test('child workspace aggregation does not block a healthy current-target host', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const report = createReport({
      platforms: ['codex'],
      commonChecks: [{ level: 'WARNING', name: 'workspace projection',
        disposition: 'action_required', reasonCode: 'runtime-projection-incomplete',
        workspace_readiness_layer: { layer: 'projection', status: 'action_required' } }],
      platformChecks: { codex: [{ level: 'PASS', name: getAdapter('codex').skillsRoot }] },
    });
    const output = formatDoctorHumanReport(report, { target: '/tmp/workspace' }).join('\n');
    expect(output).toContain('[通用环境] workspace projection');
    expect(output).toContain('CODEX 主行动：在此目录打开或新开');
    expect(output).not.toContain('CODEX 主行动：先处理');
  });

  test('current-target common prerequisites still block host continuation', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const output = formatDoctorHumanReport(createReport({
      platforms: ['codex'],
      commonChecks: [{ level: 'ERROR', name: 'Node.js', reasonCode: 'node-version-unsupported' }],
      platformChecks: { codex: [{ level: 'PASS', name: getAdapter('codex').skillsRoot }] },
    }), { target: '/tmp/project' }).join('\n');
    expect(output).toContain('CODEX 主行动：先处理上述 [通用环境] Node.js');
  });

  test('restores a healthy projection without treating aggregated verification as first success', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const report = createReport({
      platforms: ['codex'],
      platformChecks: { codex: [{ level: 'PASS', name: getAdapter('codex').skillsRoot }] },
      workflowRunnability: 'verified',
      workflowRunnabilityBasis: { evidence_path: '/tmp/evidence.json', evidence_freshness: 'fresh' },
    });
    const lines = formatDoctorHumanReport(report, { target: '/tmp/project with spaces' });
    const output = lines.join('\n');
    expect(output).toContain('恢复目录：/tmp/project with spaces');
    expect(output).toContain('CODEX 主行动：在此目录打开或新开 Codex 会话');
    expect(output).toContain('配置检查不等于宿主已加载');
    expect(output).not.toContain('首次成功已确认');
    expect(output.split('\n').filter((line) => line.includes('主行动：'))).toHaveLength(1);
    // 默认摘要预算（U3）：证据上限声明一句、每 scope 一条主行动，
    // 证据细节进 verbose；健康单宿主基线为 10 行，允许小幅排版余量。
    expect(output.match(/证据上限：/g)).toHaveLength(1);
    expect(output.match(/恢复目录：/g)).toHaveLength(1);
    expect(lines.length).toBeLessThanOrEqual(12);
  });

  test('aggregated verified evidence does not spread per-host first-success or hide a failed host', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const output = formatDoctorHumanReport(createReport({
      platformChecks: {
        codex: [{ level: 'PASS', name: getAdapter('codex').skillsRoot }],
        claude: [{ level: 'WARNING', name: '.claude/skills', reasonCode: 'skills-missing', fix: 'Run spec-first init --claude' }],
      },
      workflowRunnability: 'verified',
      workflowRunnabilityBasis: { evidence_path: '/tmp/evidence.json', evidence_freshness: 'fresh' },
    }), { target: '/tmp/aggregated' }).join('\n');
    expect(output).toContain('CODEX 主行动：在此目录打开或新开');
    expect(output).toContain('CLAUDE 主行动：先处理上述 [CLAUDE]');
    expect(output).not.toContain('CLAUDE 主行动：在此目录打开或新开');
    expect(output).not.toContain('首次成功已确认');
  });

  test('keeps unknown scope unknown and preserves healthy host during partial failure', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const report = createReport({ platformChecks: {
      codex: [{ level: 'PASS', name: getAdapter('codex').skillsRoot }],
      claude: [{ level: 'WARNING', name: '.claude/skills', reasonCode: 'skills-missing', fix: 'Run spec-first init --claude' }],
    } });
    const output = formatDoctorHumanReport(report, { target: '/tmp/partial' }).join('\n');
    expect(output).toContain('CODEX 主行动：在此目录打开或新开');
    expect(output).toContain('CLAUDE 主行动：先处理上述 [CLAUDE]');
    expect(output).toContain('依据：skills-missing');
    expect(formatDoctorHumanReport(createReport({ platforms: ['codex'] })).join('\n')).toContain('continuation-facts-insufficient');
  });

  test.each(['missing', 'invalid', 'stale', 'fresh'])('keeps %s evidence scope explicit in verbose output', (freshness) => {
    const output = formatDoctorHumanReport(createReport({
      workflowRunnability: 'not_verified',
      workflowRunnabilityBasis: { evidence_freshness: freshness },
    }), { verbose: true }).join('\n');
    expect(output).toContain(`freshness=${freshness}`);
    expect(output).toContain('项目级聚合证据');
    expect(output).toContain('setup receipt 不证明每个宿主加载');
    // freshness 状态不改变证据上限：任何新鲜度都不显示已验证或首次成功结论。
    expect(output).not.toContain('首次成功');
    expect(output).not.toMatch(/workflow runnability[:：]?\s*verified/i);
  });

  test('projects machine statuses without collapsing optional, degraded, known limitation, or not-run', () => {
    const cases = [
      [{ level: 'PASS', reasonCode: 'ready' }, 'ready', 'ready'],
      [{ level: 'WARNING', reasonCode: 'would-change', runtimeStatus: 'would-change' }, 'would-change', 'action-required'],
      [{ level: 'ERROR', reasonCode: 'apply-failed', runtimeStatus: 'apply-failed' }, 'apply-failed', 'action-required'],
      [{ level: 'WARNING', reasonCode: 'optional', disposition: 'optional' }, 'optional', 'optional'],
      [{ level: 'WARNING', reasonCode: 'limited', disposition: 'known_limitation' }, 'known-limitation', 'known-limitation'],
      [{ level: 'WARNING', reasonCode: 'degraded', runtimeStatus: 'degraded' }, 'degraded', 'degraded'],
      [{ level: 'WARNING', reasonCode: 'not-run', runtimeStatus: 'not-run' }, 'not-run', 'not-run'],
    ];

    for (const [check, status, disposition] of cases) {
      expect(buildRuntimeStatusProjection(check, { scope: 'codex' })).toMatchObject({
        schema_version: 'runtime-status-projection/v1',
        status,
        disposition,
        scope: 'codex',
        reason_code: check.reasonCode,
      });
    }
  });

  test('keeps an all-pass default report concise while naming every host', () => {
    const output = formatDoctorHumanReport(createReport({
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{ level: 'PASS', name: '.codex', message: 'ready' }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：可用');
    expect(output).toContain('CLAUDE：正常');
    expect(output).toContain('CODEX：正常');
    expect(output).toContain('需要处理：无');
    expect(output).not.toContain('.claude: ready');
    expect(output).not.toContain('.codex: ready');
  });

  test('labels a producer-declared safe fix as a repair suggestion', () => {
    const output = formatDoctorHumanReport(createReport({
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{
          level: 'WARNING',
          name: 'Codex hook',
          message: 'duplicate hook',
          fixSafety: 'safe',
          fix: 'Run `codex --version`.',
        }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：可用，但需处理');
    expect(output).toContain('CODEX：需处理');
    expect(output).toContain('[CODEX] Codex hook: duplicate hook');
    expect(output).toContain('修复：Run `codex --version`.');
    expect(output).not.toContain('.claude: ready');
  });

  test('separates optional setup and known limitations from required work', () => {
    const output = formatDoctorHumanReport(createReport({
      platforms: ['cursor', 'qoder', 'opencode'],
      hostSupport: {
        cursor: { support_state: 'preview' },
        qoder: { support_state: 'active' },
        opencode: { support_state: 'preview' },
      },
      platformChecks: {
        cursor: [{
          level: 'WARNING',
          name: 'Cursor CLI',
          message: 'not found on PATH',
          reasonCode: 'cursor_cli_not_found',
          disposition: 'optional',
          fixSafety: 'safe',
          fix: 'Install Cursor CLI and restart your shell.',
        }],
        qoder: [{
          level: 'WARNING',
          name: '.qoder/settings.local.json',
          message: 'missing local MCP config',
          disposition: 'optional',
          fix: 'Run `spec-runtime-setup` when MCP setup is required.',
        }],
        opencode: [{
          level: 'WARNING',
          name: 'OpenCode generated-runtime preview',
          message: 'loader behavior is unverified',
          degradedByDesign: true,
          disposition: 'known_limitation',
        }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：可用');
    expect(output).toContain('CURSOR：未安装');
    expect(output).toContain('QODER：正常');
    expect(output).toContain('OPENCODE：预览/受限');
    expect(output).toContain('需要处理：无');
    expect(output).toContain('按需配置：');
    expect(output).toContain('按需操作：Install Cursor CLI and restart your shell.');
    expect(output).toContain('已知限制：');
    expect(output).toContain('说明：当前为已知限制，无需手工修改用户配置。');
    expect(output).not.toContain('需要人工处理：');
  });

  test('treats a missing CLI as required when the host was selected explicitly', () => {
    const output = formatDoctorHumanReport(createReport({
      platforms: ['cursor'],
      selectionMode: 'explicit',
      platformChecks: {
        cursor: [{
          level: 'WARNING',
          name: 'Cursor CLI',
          message: 'not found on PATH',
          reasonCode: 'cursor_cli_not_found',
          disposition: 'optional',
          fixSafety: 'safe',
          fix: 'Install Cursor CLI and restart your shell.',
        }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：可用，但需处理');
    expect(output).toContain('CURSOR：需处理');
    expect(output).toContain('[CURSOR] Cursor CLI: not found on PATH');
    expect(output).toContain('修复：Install Cursor CLI and restart your shell.');
  });

  test('keeps an unsafe error fix under the manual handling boundary', () => {
    const output = formatDoctorHumanReport(createReport({
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{
          level: 'ERROR',
          name: 'Codex runtime',
          message: 'managed file missing',
          fix: 'Run `spec-first init --codex`.',
        }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：不可用');
    expect(output).toContain('CODEX：有问题');
    expect(output).toContain('[CODEX] Codex runtime: managed file missing');
    expect(output).toContain('需要人工处理：Run `spec-first init --codex`.');
    expect(output).toContain('producer 未声明该建议可安全自动执行');
    expect(output).not.toContain('.claude: ready');
  });

  test('separates common errors and explains the manual boundary when no fix exists', () => {
    const output = formatDoctorHumanReport(createReport({
      commonChecks: [{ level: 'ERROR', name: 'Node.js', message: 'v18.0.0' }],
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{ level: 'PASS', name: '.codex', message: 'ready' }],
      },
      hasError: true,
    })).join('\n');

    expect(output).toContain('诊断结果：不可用');
    expect(output).toContain('[通用环境] Node.js: v18.0.0');
    expect(output).toContain('需要人工处理：此检查未提供可安全执行的修复建议');
  });

  test('adds complete check detail only in verbose mode', () => {
    const report = createReport({
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{ level: 'WARNING', name: 'Codex hook', message: 'duplicate hook' }],
      },
    });

    const output = formatDoctorHumanReport(report, { verbose: true }).join('\n');

    expect(output).toContain('详细检查：');
    expect(output).toContain('PASS    .claude: ready');
    expect(output).toContain('WARNING Codex hook: duplicate hook');
  });

  test('shows workflow and decision evidence dimensions in verbose mode', () => {
    const output = formatDoctorHumanReport(createReport({
      decisionInputHealth: 'missing',
      decisionInputHealthBasis: { reason_code: 'setup-facts-host-mismatch' },
      workflowRunnability: 'simulated',
      workflowRunnabilityBasis: { fallback_reason: 'verification_evidence_missing' },
    }), { verbose: true }).join('\n');

    expect(output).toContain('证据维度：');
    expect(output).toContain('decision_input_health: missing (reason=setup-facts-host-mismatch)');
    expect(output).toContain('workflow_runnability: simulated (reason=verification_evidence_missing)');
  });
});
