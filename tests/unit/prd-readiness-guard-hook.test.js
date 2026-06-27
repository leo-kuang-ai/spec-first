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

const REASON_CODES_LIB = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'lib', 'reason-codes.js');

function installRuntimeScripts(projectRoot) {
  const scriptsDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
  fs.mkdirSync(path.join(scriptsDir, 'lib'), { recursive: true });
  fs.copyFileSync(CHECKER_SCRIPT, path.join(scriptsDir, 'check-prd-artifact.js'));
  fs.copyFileSync(FINALIZE_SCRIPT, path.join(scriptsDir, 'finalize-prd-artifact.js'));
  fs.copyFileSync(REASON_CODES_LIB, path.join(scriptsDir, 'lib', 'reason-codes.js'));
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
  test('source_inputs as last frontmatter field does not treat body bullets as input paths', () => {
    // 回归：source_inputs 是 frontmatter 最后一项时，--- 后的正文 bullet
    // 不应被误读为 input path，否则会产生假的 input_scan_degraded
    const projectRoot = makeTempDir();
    try {
      installRuntimeScripts(projectRoot);
      // PRD：source_inputs 是 frontmatter 最后一项，其后紧跟 --- 和带 bullet 的正文
      // source_inputs 无实际 item（空列表），正文有 bullet；
      // 旧代码会把正文 bullet 当 input path → input_scan_degraded；修复后不会
      const prdContent = `---
artifact_kind: prd-requirements
spec_id: frontmatter-last-input
title: Frontmatter Last Input Test
date: 2026-06-27
write_mode: checkpoint-prd
can_enter_spec_plan: no
source_inputs:
---

# 需求

- 目标：展示市场页
- **NG-1**：不实现交易功能
`;
      write(path.join(projectRoot, 'docs', 'brainstorms', 'frontmatter-last-input-requirements.md'), prdContent);

      const init = spawnSync('git', ['init', '-q'], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: path.join(projectRoot, 'home') },
      });
      expect(init.status).toBe(0);

      const result = spawnSync(HOOK_TEMPLATE, {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 8000,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectRoot },
      });

      // 无论阻断与否，reason 里不能出现 input_scan_degraded
      // （只有正文 bullet 被误读为不存在的路径才会触发该 code）
      if (result.stdout) {
        const payload = JSON.parse(result.stdout);
        if (payload.decision === 'block') {
          expect(payload.reason).not.toContain('input_scan_degraded');
        }
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

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

  test('reports finalize_check_timeout instead of finalize_check_failed when finalize exceeds the hook budget', () => {
    // 回归:spawnSync 超时(status===null)退化为通用 finalize_check_failed,agent 无法区分超时与真实 gap。
    // 修复:超时分支 emit finalize_check_timeout。
    const projectRoot = makeTempDir();
    try {
      installRuntimeScripts(projectRoot);
      // 装一个会 sleep 超过 5000ms 预算的 finalize stub
      const scriptsDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
      fs.writeFileSync(
        path.join(scriptsDir, 'finalize-prd-artifact.js'),
        "require('node:timers').setTimeout(() => process.exit(0), 6000);\n",
      );
      write(path.join(projectRoot, 'docs', 'brainstorms', 'timeout-requirements.md'),
        '---\nartifact_kind: prd-requirements\n---\n# x\n');

      const init = spawnSync('git', ['init', '-q'], {
        cwd: projectRoot, encoding: 'utf8',
        env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: path.join(projectRoot, 'home') },
      });
      expect(init.status).toBe(0);

      const result = spawnSync(HOOK_TEMPLATE, {
        cwd: projectRoot, encoding: 'utf8', timeout: 15000,
        env: { ...process.env, CLAUDE_PROJECT_DIR: projectRoot },
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.decision).toBe('block');
      expect(payload.reason).toContain('finalize_check_timeout');
      expect(payload.reason).not.toContain('finalize_check_failed');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
