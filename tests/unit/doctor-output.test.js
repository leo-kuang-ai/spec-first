'use strict';

const { formatDoctorHumanReport } = require('../../src/cli/commands/doctor');

function createReport({
  platforms = ['claude', 'codex'],
  commonChecks = [],
  platformChecks = {},
  hasError = false,
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
    checks,
    warnings: checks.filter((check) => check.level === 'WARNING'),
    has_error: hasError,
  };
}

describe('doctor human-readable output', () => {
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
    expect(output).toContain('待处理项：无');
    expect(output).not.toContain('.claude: ready');
    expect(output).not.toContain('.codex: ready');
  });

  test('attributes warnings to the affected host and preserves the safe fix', () => {
    const output = formatDoctorHumanReport(createReport({
      platformChecks: {
        claude: [{ level: 'PASS', name: '.claude', message: 'ready' }],
        codex: [{
          level: 'WARNING',
          name: 'Codex hook',
          message: 'duplicate hook',
          fix: 'Run `spec-first clean --codex`.',
        }],
      },
    })).join('\n');

    expect(output).toContain('诊断结果：可用，但需关注');
    expect(output).toContain('CODEX：需关注');
    expect(output).toContain('[CODEX] Codex hook: duplicate hook');
    expect(output).toContain('修复：Run `spec-first clean --codex`.');
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
});
