'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const HOOK_TEMPLATE = path.join(REPO_ROOT, 'templates', 'claude', 'hooks', 'prd-prewrite-guard');
const CHECKER_SCRIPT = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'check-prd-artifact.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-prewrite-'));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function installRuntimeChecker(projectRoot) {
  const scriptsDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(CHECKER_SCRIPT, path.join(scriptsDir, 'check-prd-artifact.js'));
}

function runHook(projectRoot, filePath, content, toolName = 'Write') {
  return spawnSync('bash', [HOOK_TEMPLATE], {
    cwd: projectRoot,
    encoding: 'utf8',
    input: JSON.stringify({
      tool_name: toolName,
      cwd: projectRoot,
      tool_input: {
        file_path: filePath,
        content,
      },
    }),
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: projectRoot,
    },
  });
}

function prdWithReadiness(readinessLines = []) {
  return `---
artifact_kind: prd-requirements
spec_id: prewrite-guard
title: Prewrite Guard
date: 2026-06-27
---

# Prewrite Guard

## Summary

Test PRD.

## Change Delta

add test behavior.

## Requirements

| ID | Priority | Requirement |
|---|---|---|
| R-01 | P0 | 展示测试页面 |

## Acceptance Examples

| ID | Covers | Example |
|---|---|---|
| AE-01 | R-01 | 打开后展示测试页面 |

## Scope Boundaries

In scope: test.

## Evidence And Assumptions

| Type | Item | Evidence |
|---|---|---|
| confirmed-source | test | test |

## Readiness Declarations

${readinessLines.map((line) => `- ${line}`).join('\n')}
`;
}

describe('Claude PRD prewrite guard hook', () => {
  test('blocks first PRD Write when durable write_mode path is missing', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        'docs/brainstorms/missing-write-mode-requirements.md',
        prdWithReadiness([
          'clarification_evidence: skipped',
          'can_enter_spec_plan: no',
        ]),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('must declare a durable-write path in `write_mode`');
      expect(result.stderr).toContain('write_mode: checkpoint-prd');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks first PRD Write when write_mode token is invalid', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        'docs/brainstorms/invalid-write-mode-requirements.md',
        prdWithReadiness([
          'write_mode: create',
          'clarification_evidence: skipped',
          'can_enter_spec_plan: no',
        ]),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('must declare a durable-write path in `write_mode`');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks first PRD Write when write_mode is still not-run', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        'docs/brainstorms/not-run-write-mode-requirements.md',
        prdWithReadiness([
          'write_mode: not-run',
          'clarification_evidence: skipped',
          'can_enter_spec_plan: no',
        ]),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('must declare a durable-write path in `write_mode`');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each([
    ['ask-owner-first'],
    ['checkpoint-prd'],
    ['route-out'],
  ])('allows first PRD Write with durable write_mode path %s', (writeMode) => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        `docs/brainstorms/${writeMode}-requirements.md`,
        prdWithReadiness([
          `write_mode: ${writeMode}`,
          'clarification_evidence: skipped',
          'can_enter_spec_plan: no',
        ]),
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('does not apply missing-write-mode guard to existing PRD edits', () => {
    const projectRoot = makeTempDir();
    const prdPath = path.join(projectRoot, 'docs', 'brainstorms', 'existing-requirements.md');

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness(['write_mode: checkpoint-prd']));

      const result = runHook(
        projectRoot,
        'docs/brainstorms/existing-requirements.md',
        prdWithReadiness([
          'clarification_evidence: skipped',
          'can_enter_spec_plan: no',
        ]),
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('fails open for missing write_mode when runtime checker is unavailable', () => {
    const projectRoot = makeTempDir();

    try {
      const result = runHook(
        projectRoot,
        'docs/brainstorms/no-runtime-checker-requirements.md',
        prdWithReadiness(['can_enter_spec_plan: no']),
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps non-PRD and non-Write early exits unchanged', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const nonPrd = runHook(projectRoot, 'docs/notes.md', prdWithReadiness([]));
      expect(nonPrd.status).toBe(0);

      const nonWrite = runHook(
        projectRoot,
        'docs/brainstorms/non-write-requirements.md',
        prdWithReadiness([]),
        'Edit',
      );
      expect(nonWrite.status).toBe(0);

      const missingArtifactKind = runHook(
        projectRoot,
        'docs/brainstorms/missing-kind-requirements.md',
        '# Missing artifact kind\n',
      );
      expect(missingArtifactKind.status).toBe(0);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps ready and machine-receipt blocking behavior', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const ready = runHook(
        projectRoot,
        'docs/brainstorms/ready-requirements.md',
        prdWithReadiness([
          'status: ready-for-planning',
          'write_mode: final-prd',
          'clarification_evidence: asked-owner',
          'can_enter_spec_plan: yes',
        ]),
      );
      expect(ready.status).toBe(2);

      const receipt = runHook(
        projectRoot,
        'docs/brainstorms/receipt-requirements.md',
        prdWithReadiness([
          'write_mode: checkpoint-prd',
          'can_enter_spec_plan: no',
        ]).replace('date: 2026-06-27\n---', 'date: 2026-06-27\nreadiness_verified_by: spec-prd\n---'),
      );
      expect(receipt.status).toBe(2);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  // 路口路由矩阵:首次写带"该 grill"信号却直写 final-prd → 拦,逼 ask-owner-first/checkpoint-prd。
  function buildSignalPrd({ writeMode, sourceInputs, designLink, oqSection, oqText }) {
    const fm = [
      '---',
      'artifact_kind: prd-requirements',
      'spec_id: grill-signal',
      'title: Grill Signal',
      'date: 2026-06-27',
    ];
    if (sourceInputs && sourceInputs.length > 0) {
      fm.push('source_inputs:');
      for (const s of sourceInputs) fm.push(`  - ${s}`);
    }
    fm.push('---', '');
    const body = ['# Grill Signal', '', '## Summary', '', 'Test PRD for grill-signal routing.'];
    if (designLink) body.push('', `Design: ${designLink}`);
    body.push('', '## Requirements', '', '| ID | Priority | Requirement |', '|---|---|---|', '| R-01 | P0 | test |');
    body.push('', '## Acceptance Examples', '', '| ID | Covers | Example |', '|---|---|---|', '| AE-01 | R-01 | test |');
    body.push('', '## Scope Boundaries', '', 'In scope: test.', '', '## Evidence And Assumptions', '', '| Type | Item | Evidence |', '|---|---|---|', '| confirmed-source | test | test |');
    body.push('', '## Readiness Declarations', '', `- write_mode: ${writeMode}`, '- can_enter_spec_plan: no');
    if (oqSection) {
      body.push('', '## Outstanding Questions', '');
      if (oqText) body.push(oqText);
    }
    body.push('');
    return [...fm, ...body].join('\n');
  }

  test('blocks first final-prd write when PRD carries a design source signal', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/design-signal-requirements.md',
        buildSignalPrd({ writeMode: 'final-prd', designLink: 'https://www.figma.com/file/abc/market?node-id=1-2' }),
      );
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('grill signal');
      expect(result.stderr).toContain('ask-owner-first');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks first final-prd write when source_inputs are multi-source', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/multi-source-requirements.md',
        buildSignalPrd({
          writeMode: 'final-prd',
          sourceInputs: ['docs/prd-draft.md', 'docs/api-spec.md'],
        }),
      );
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('grill signal');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks first final-prd write when Outstanding Questions carry an owner-owned gap keyword', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/owner-gap-requirements.md',
        buildSignalPrd({
          writeMode: 'final-prd',
          oqSection: true,
          oqText: '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |\n|---|---|---|---|---|---|---|---|\n| OQ-01 | 中台持仓接口何时就绪 | R-06 | yes | unclosed | yes | unclosed | 无 |',
        }),
      );
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('grill signal');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks first final-prd write when Outstanding Questions are present without owner-owned keywords', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/oq-present-requirements.md',
        buildSignalPrd({
          writeMode: 'final-prd',
          oqSection: true,
          oqText: '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |\n|---|---|---|---|---|---|---|---|\n| OQ-01 | 文案语气用哪种 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
        }),
      );
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('grill signal');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('allows first write with ask-owner-first when a grill signal is present', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/ask-owner-signal-requirements.md',
        buildSignalPrd({ writeMode: 'ask-owner-first', designLink: 'https://www.figma.com/file/abc/market' }),
      );
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('allows first write with checkpoint-prd when a grill signal is present', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/checkpoint-signal-requirements.md',
        buildSignalPrd({ writeMode: 'checkpoint-prd', designLink: 'https://www.figma.com/file/abc/market' }),
      );
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('allows first final-prd write when no grill signal is present', () => {
    const projectRoot = makeTempDir();
    try {
      installRuntimeChecker(projectRoot);
      const result = runHook(
        projectRoot,
        'docs/brainstorms/no-signal-final-requirements.md',
        buildSignalPrd({ writeMode: 'final-prd' }),
      );
      // final-prd 首次写被 Codex 现有 readyIntent 全禁(checker 把 final-prd 当 claimsReady),
      // 路口路由(Y)不改这个语义,只给命中信号加 grill 路由文案;故无信号 final 仍被拦,
      // 但 stderr 不含"grill signal"路由文案(走通用 ready 文案)。
      expect(result.status).toBe(2);
      expect(result.stderr).not.toContain('grill signal');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
