'use strict';

const path = require('node:path');
const {
  analyzeContent,
  buildRules,
  collectFiles,
  loadConfig,
} = require('../../scripts/lint-skill-entrypoints');

function testConfig() {
  return {
    scanRoots: [],
    markdownExtensions: ['.md'],
    ignoredLineContains: [],
    blockedPatterns: [],
    warnPatterns: [],
  };
}

function testGovernance() {
  return {
    skills: [
      {
        skill_name: 'using-spec-first',
        entry_surface: 'standalone_skill',
      },
      {
        skill_name: 'spec-write-tasks',
        entry_surface: 'workflow_command',
      },
      {
        skill_name: 'spec-work',
        entry_surface: 'workflow_command',
      },
    ],
  };
}

describe('lint skill entrypoints', () => {
  test('allows guardrail prose that forbids standalone command aliases', () => {
    const config = testConfig();
    const governance = testGovernance();
    const rules = buildRules(config, governance);
    const forbiddenCommand = '/spec:using-spec-first';

    const findings = analyzeContent(
      `Do not route users to \`${forbiddenCommand}\`.`,
      'fixture.md',
      { config, governance, rules },
    );

    expect(findings).toEqual([]);
  });

  test('blocks using-spec-first when written as a positive spec slash command', () => {
    const config = testConfig();
    const governance = testGovernance();
    const rules = buildRules(config, governance);
    const forbiddenCommand = '/spec:using-spec-first';

    const findings = analyzeContent(
      `Route users to \`${forbiddenCommand}\`.`,
      'fixture.md',
      { config, governance, rules },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        ruleId: 'standalone-command-entrypoint',
        severity: 'error',
        line: 1,
      }),
    ]);
  });

  test('allows spec-write-tasks public workflow entrypoint', () => {
    const config = testConfig();
    const governance = testGovernance();
    const rules = buildRules(config, governance);
    const command = 'spec-write-tasks';

    const findings = analyzeContent(
      `Route users to \`${command}\`.`,
      'fixture.md',
      { config, governance, rules },
    );

    expect(findings).toEqual([]);
  });

  test('allows public workflow command prose for workflow-command skills', () => {
    const config = testConfig();
    const governance = testGovernance();
    const rules = buildRules(config, governance);

    const findings = analyzeContent(
      'Route implementation work to `spec-work`.',
      'fixture.md',
      { config, governance, rules },
    );

    expect(findings).toEqual([]);
  });

  // R-12: scanRoots 必须覆盖 CLAUDE.md/AGENTS.md host 入口文档,
  // 且 collectFiles 必须支持文件级 scanRoot(不只是目录递归)。
  test('scanRoots cover host entry docs and file-level scanRoot is collected', () => {
    const config = loadConfig();

    expect(config.scanRoots).toContain('CLAUDE.md');
    expect(config.scanRoots).toContain('AGENTS.md');

    const files = collectFiles(config);
    const collected = files.map((f) => path.basename(f));
    expect(collected).toContain('CLAUDE.md');
    expect(collected).toContain('AGENTS.md');
  });
});
