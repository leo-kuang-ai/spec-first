import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleIntegrateSkill } from '../../src/cli/commands/integrate-skill.js';
import { runIntegrateSkill } from '../../src/core/skill-integration/service.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-integrate-skill');
const SOURCE_DIR = join(TMP, 'external-skills', 'frontend-design');
const HOME_ROOT = join(TMP, 'home');
const INSTALLED_SOURCE_DIR = join(HOME_ROOT, '.spec-first', 'skills', 'frontend-design');
const REPORT_DATE = new Date().toISOString().slice(0, 10);

const origCwd = process.cwd;
const origHome = process.env.HOME;

beforeEach(() => {
  mkdirSync(SOURCE_DIR, { recursive: true });
  mkdirSync(INSTALLED_SOURCE_DIR, { recursive: true });
  writeFileSync(
    join(SOURCE_DIR, 'SKILL.md'),
    `---
name: frontend-design
description: Use when integrating a frontend design skill into spec-first.
---

# Skill: frontend-design

- P0: 生成 report-only 集成报告并检查冲突
- Command: \`/spec-first:integrate-skill frontend-design\`
`,
    'utf-8'
  );
  writeFileSync(
    join(INSTALLED_SOURCE_DIR, 'SKILL.md'),
    `---
name: frontend-design
description: Use when integrating a frontend design skill into spec-first.
---

# Skill: frontend-design

- P0: 生成 report-only 集成报告并检查冲突
- Command: \`/spec-first:integrate-skill frontend-design\`
`,
    'utf-8'
  );
  process.cwd = () => TMP;
  process.env.HOME = HOME_ROOT;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  if (origHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = origHome;
  }
  vi.restoreAllMocks();
});

describe('runIntegrateSkill', () => {
  it('should create a report-only plan and write the integration report', () => {
    const result = runIntegrateSkill(
      {
        skillName: 'frontend-design',
        source: SOURCE_DIR,
        target: 'guideline',
        category: 'frontend',
        reportOnly: true,
        dryRun: false,
      },
      TMP
    );

    expect(result.exitCode).toBe(0);
    expect(result.reportPath).toBe(
      join(TMP, 'docs', 'reports', 'skill-integrations', `${REPORT_DATE}-frontend-design.md`)
    );
    expect(result.output).toContain('Integration Result: SUCCESS');

    const reportPath = result.reportPath as string;
    expect(existsSync(reportPath)).toBe(true);
    expect(readFileSync(reportPath, 'utf-8')).toContain('Skill Integration Report');
  });
});

describe('handleIntegrateSkill', () => {
  it('should accept --yes and run the report-only MVP', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const code = handleIntegrateSkill([
        'frontend-design',
        '--source',
        SOURCE_DIR,
        '--report-only',
        '--yes',
      ]);

      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Integration Result: SUCCESS'));
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should reject non report-only usage', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const code = handleIntegrateSkill(['frontend-design', '--source', SOURCE_DIR]);

      expect(code).toBe(2);
      expect(errSpy).toHaveBeenCalledWith(
        'integrate-skill 当前仅支持 report-only MVP；请补 `--report-only`'
      );
    } finally {
      errSpy.mockRestore();
    }
  });

  it('should resolve from ~/.spec-first/skills when --source is omitted', () => {
    const result = runIntegrateSkill(
      {
        skillName: 'frontend-design',
        target: 'guideline',
        category: 'frontend',
        reportOnly: true,
        dryRun: true,
      },
      TMP
    );

    expect(result.exitCode).toBe(0);
    expect(result.sourceResolution?.kind).toBe('resolved');
    expect(result.plan?.requestedName).toBe('frontend-design');
  });
});
