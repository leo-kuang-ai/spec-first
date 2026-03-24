import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleId } from '../../src/cli/commands/id.js';
import { handleAnalyze } from '../../src/cli/commands/analyze.js';
import { handleDocsLinks } from '../../src/cli/commands/docs-links.js';
import { handleTrace } from '../../src/cli/commands/trace.js';
import { handleIntegrateSkill } from '../../src/cli/commands/integrate-skill.js';
import { dispatch, registerCommand } from '../../src/cli/router.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-cmd');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

const DOCUMENT_LINKS = `version: 1
featureId: ${FEAT_ID}
documents:
  - path: spec.md
    kind: requirements
    stage: 01_specify
    references: []
  - path: design.md
    kind: design
    stage: 02_design
    references:
      - spec.md
`;

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
  writeFileSync(join(SPEC_DIR, 'document-links.yaml'), DOCUMENT_LINKS, 'utf-8');
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('handleId', () => {
  it('should validate a valid ID', () => {
    expect(handleId(['validate', 'FR-AUTH-001'])).toBe(0);
  });

  it('should reject invalid ID', () => {
    expect(handleId(['validate', 'INVALID'])).toBe(2);
  });

  it('should return error for missing subcommand', () => {
    expect(handleId(['unknown'])).toBe(2);
  });

  it('should generate next ID', () => {
    const code = handleId(['next', 'FR', 'AUTH', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should search IDs', () => {
    const code = handleId(['search', 'AUTH', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should list IDs', () => {
    const code = handleId(['list', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });
});

describe('handleDocsLinks', () => {
  it('should validate document links', () => {
    const code = handleDocsLinks(['validate', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should show document links', () => {
    const code = handleDocsLinks(['show', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should return validation error when references are broken', () => {
    writeFileSync(
      join(SPEC_DIR, 'document-links.yaml'),
      DOCUMENT_LINKS.replace('      - spec.md', '      - missing.md'),
      'utf-8'
    );
    const code = handleDocsLinks(['validate', FEAT_ID]);
    expect(code).toBe(2);
  });

  it('should return error for missing featureId', () => {
    expect(handleDocsLinks(['validate'])).toBe(2);
  });

  it('should return error for unknown subcommand', () => {
    expect(handleDocsLinks(['unknown'])).toBe(2);
  });
});

describe('handleTrace', () => {
  it('should validate document links through trace validate', () => {
    expect(handleTrace(['validate', FEAT_ID])).toBe(0);
  });

  it('should reject trace fix because auto repair was removed', () => {
    expect(handleTrace(['fix', FEAT_ID])).toBe(2);
  });
});

describe('handleAnalyze', () => {
  it('should return GATE_FAILED when CRITICAL findings exist', () => {
    const code = handleAnalyze([FEAT_ID]);
    expect(code).toBe(1);
  });

  it('should return SUCCESS when no CRITICAL findings', () => {
    writeFileSync(join(SPEC_DIR, 'spec.md'), '# Spec\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'prd.md'), '# PRD\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'design.md'), '# Design\nConstitution Clause P1\n', 'utf-8');
    writeFileSync(join(SPEC_DIR, 'task_plan.md'), '# Task Plan\n', 'utf-8');
    const code = handleAnalyze([FEAT_ID]);
    expect(code).toBe(0);
  });
});

describe('handleIntegrateSkill', () => {
  it('should dispatch integrate-skill through the router with confirmation', async () => {
    const sourceDir = join(TMP, 'external-skills', 'frontend-design');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'SKILL.md'),
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

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCommand('integrate-skill-router', 'Integrate external skill', handleIntegrateSkill, {
      requiresConfirmation: true,
    });

    try {
      const code = await dispatch([
        'integrate-skill-router',
        'frontend-design',
        '--source',
        sourceDir,
        '--report-only',
        '--yes',
      ]);

      expect(code).toBe(0);
      expect(errSpy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Integration Result: SUCCESS'));
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
  });
});
