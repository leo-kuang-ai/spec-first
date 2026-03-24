import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dispatch, registerCommand } from '../../src/cli/router.js';
import { handleIntegrateSkill } from '../../src/cli/commands/integrate-skill.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-integrate-skill-e2e');
const SOURCE_DIR = join(TMP, 'external-skills', 'mcp-builder');
const REPORT_DATE = new Date().toISOString().slice(0, 10);

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(SOURCE_DIR, { recursive: true });
  writeFileSync(
    join(SOURCE_DIR, 'SKILL.md'),
    `---
name: mcp-builder
description: Use when integrating an MCP builder skill into spec-first.
---

# Skill: mcp-builder

- P0: 生成 report-only 集成报告并检查能力冲突
- Command: \`/spec-first:integrate-skill mcp-builder\`
`,
    'utf-8'
  );
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  vi.restoreAllMocks();
});

describe('integrate-skill command smoke test', () => {
  it('should execute through the router and write the report artifact', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCommand('integrate-skill-smoke', 'Integrate external skill', handleIntegrateSkill, {
      requiresConfirmation: true,
    });

    try {
      const code = await dispatch([
        'integrate-skill-smoke',
        'mcp-builder',
        '--source',
        SOURCE_DIR,
        '--report-only',
        '--yes',
      ]);

      expect(code).toBe(0);
      expect(errSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Integration Result: SUCCESS'));

      const reportPath = join(
        TMP,
        'docs',
        'reports',
        'skill-integrations',
        `${REPORT_DATE}-mcp-builder.md`
      );
      expect(existsSync(reportPath)).toBe(true);
      expect(readFileSync(reportPath, 'utf-8')).toContain('Skill Integration Report');
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});
