'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const HOOK_TEMPLATE = path.join(REPO_ROOT, 'templates', 'claude', 'hooks', 'prd-readiness-guard');
const CHECKER_SCRIPT = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'check-prd-artifact.js');
const FINALIZE_SCRIPT = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'finalize-prd-artifact.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-guard-'));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function installRuntimeScripts(projectRoot) {
  const scriptsDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(CHECKER_SCRIPT, path.join(scriptsDir, 'check-prd-artifact.js'));
  fs.copyFileSync(FINALIZE_SCRIPT, path.join(scriptsDir, 'finalize-prd-artifact.js'));
}

function readyIntentPrd(inputField) {
  return `---
artifact_kind: prd-requirements
spec_id: input-side-design
title: Input Side Design
date: 2026-06-25
${inputField}:
  - source_docs/Figma-market.md
---

# Input Side Design

## Summary

页面需求正文不包含设计链接或节点字面。

## Change Delta

replace 当前页面。

## Requirements

| ID | Priority | Requirement |
|---|---|---|
| R-1 | P0 | 展示页面 |

## Acceptance Examples

| ID | Covers | Example |
|---|---|---|
| AE-1 | R-1 | 打开页面后展示内容 |

## Scope Boundaries

In scope: 页面。

## Evidence And Assumptions

| Type | Item | Evidence |
|---|---|---|
| confirmed-source | source | source |

## Readiness Self-Check

- write_mode: final-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: yes
- preflight_sweep_closure: closed
`;
}

describe('Claude PRD readiness guard hook', () => {
  test.each(['source_inputs', 'prd_input'])('passes %s into finalize so input-only Figma refs block ready closeout', (inputField) => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeScripts(projectRoot);
      write(
        path.join(projectRoot, 'source_docs', 'Figma-market.md'),
        'Figma design: https://www.figma.com/file/abc/Market?node-id=114-17842\n',
      );
      write(
        path.join(projectRoot, 'docs', 'brainstorms', 'input-side-design-requirements.md'),
        readyIntentPrd(inputField),
      );

      const init = spawnSync('git', ['init', '-q'], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          GIT_CONFIG_NOSYSTEM: '1',
          HOME: path.join(projectRoot, 'home'),
        },
      });
      expect(init.status).toBe(0);

      const result = spawnSync(HOOK_TEMPLATE, {
        cwd: projectRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: projectRoot,
        },
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.decision).toBe('block');
      expect(payload.reason).toContain('design_source_unaccounted');
      expect(payload.reason).toContain('docs/brainstorms/input-side-design-requirements.md');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
