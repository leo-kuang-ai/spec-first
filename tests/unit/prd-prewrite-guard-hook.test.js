'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const HOOK_TEMPLATE = path.join(REPO_ROOT, 'templates', 'claude', 'hooks', 'prd-prewrite-guard');
const CHECKER_SCRIPT = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'check-prd-artifact.js');
const REASON_CODES_LIB = path.join(REPO_ROOT, 'skills', 'spec-prd', 'scripts', 'lib', 'reason-codes.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-prewrite-'));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function installRuntimeChecker(projectRoot) {
  const scriptsDir = path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-prd', 'scripts');
  fs.mkdirSync(path.join(scriptsDir, 'lib'), { recursive: true });
  fs.copyFileSync(CHECKER_SCRIPT, path.join(scriptsDir, 'check-prd-artifact.js'));
  fs.copyFileSync(REASON_CODES_LIB, path.join(scriptsDir, 'lib', 'reason-codes.js'));
}

function runHook(projectRoot, filePath, content, toolName = 'Write', toolInputOverrides = {}) {
  return spawnSync(process.execPath, [HOOK_TEMPLATE, projectRoot], {
    cwd: projectRoot,
    encoding: 'utf8',
    input: JSON.stringify({
      tool_name: toolName,
      cwd: projectRoot,
      tool_input: {
        file_path: filePath,
        content,
        ...toolInputOverrides,
      },
    }),
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: projectRoot,
    },
  });
}

function runEditHook(projectRoot, filePath, oldString, newString, extra = {}) {
  return runHook(projectRoot, filePath, '', 'Edit', {
    old_string: oldString,
    new_string: newString,
    ...extra,
  });
}

function runMultiEditHook(projectRoot, filePath, edits) {
  return runHook(projectRoot, filePath, '', 'MultiEdit', { edits });
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

function runCheckerWithStdin(targetPath, content) {
  return spawnSync('node', [CHECKER_SCRIPT, targetPath, '--stdin'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    input: content,
  });
}

function extractYamlSkeleton(stderr) {
  const match = String(stderr || '').match(/```yaml\n([\s\S]*?)\n```/);
  return match ? match[1] : '';
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
      expect(result.stderr).toContain('node .claude/spec-first/workflows/spec-prd/scripts/check-prd-artifact.js');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('emits a skeleton whose machine declarations parse after placeholders are filled', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        'docs/brainstorms/skeleton-requirements.md',
        prdWithReadiness(['can_enter_spec_plan: no']),
      );

      expect(result.status).toBe(2);
      const skeleton = extractYamlSkeleton(result.stderr)
        .replace('spec_id: <YYYY-MM-DD-NNN-slug>', 'spec_id: 2026-06-30-001-skeleton')
        .replace('target_surface: <App|H5/PC|Admin|Backend/Java|CLI/DevTool|Mixed|Generic>', 'target_surface: App')
        .replace('created: <YYYY-MM-DD>', 'created: 2026-06-30')
        .replace('  - <path/to/original-input.md>', '  - docs/source.md')
        .replace(
          'clarification_evidence: <asked-owner | source-proven-no-ask | headless-degraded-logged>',
          'clarification_evidence: asked-owner',
        )
        .replace('preflight_sweep_closure: <closed | degraded | blocked>', 'preflight_sweep_closure: closed')
        .replace('next_owner_question: <one load-bearing question or none>', 'next_owner_question: none');

      const check = runCheckerWithStdin('docs/brainstorms/skeleton-requirements.md', skeleton);
      expect(check.status).toBe(0);
      const parsed = JSON.parse(check.stdout);
      expect(parsed.facts.write_mode).toBe('checkpoint-prd');
      expect(parsed.facts.write_mode_declared_valid).toBe(true);
      expect(parsed.facts.can_enter_spec_plan).toBe('no');
      expect(parsed.facts.can_enter_spec_plan_declared_valid).toBe(true);
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

  test('uses fallback facts for missing write_mode when runtime checker is unavailable', () => {
    const projectRoot = makeTempDir();

    try {
      const result = runHook(
        projectRoot,
        'docs/brainstorms/no-runtime-checker-requirements.md',
        prdWithReadiness(['can_enter_spec_plan: no']),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('must declare a durable-write path in `write_mode`');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('uses fallback facts for ready intent when runtime checker is unavailable', () => {
    const projectRoot = makeTempDir();

    try {
      const result = runHook(
        projectRoot,
        'docs/brainstorms/no-runtime-ready-requirements.md',
        prdWithReadiness([
          'write_mode: final-prd',
          'can_enter_spec_plan: yes',
        ]),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('ready/final state');
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

      const missingArtifactKindReady = runHook(
        projectRoot,
        'docs/brainstorms/missing-kind-ready-requirements.md',
        [
          '---',
          'status: ready-for-planning',
          'write_mode: final-prd',
          'can_enter_spec_plan: yes',
          '---',
          '',
          '## Summary',
          '',
        ].join('\n'),
      );
      expect(missingArtifactKindReady.status).toBe(2);
      expect(missingArtifactKindReady.stderr).toContain('ready/final state');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks Edit that mutates an existing PRD into ready status', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/edit-ready-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runEditHook(
        projectRoot,
        relativePath,
        'artifact_kind: prd-requirements',
        'artifact_kind: prd-requirements\nstatus: ready-for-planning',
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('PRD prewrite guard blocked Edit');
      expect(result.stderr).toContain('machine-owned');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('allows Edit that changes ordinary PRD prose without touching ready fields', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/edit-prose-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runEditHook(projectRoot, relativePath, 'Test PRD.', 'Updated test PRD.');

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks Edit that mutates an existing PRD into final write mode', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/edit-final-mode-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runEditHook(
        projectRoot,
        relativePath,
        'write_mode: checkpoint-prd',
        'write_mode: final-prd',
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('PRD prewrite guard blocked Edit');
      expect(result.stderr).toContain('ready/final state');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks MultiEdit that adds machine receipt fields', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/multiedit-receipt-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runMultiEditHook(projectRoot, relativePath, [
        {
          old_string: 'artifact_kind: prd-requirements',
          new_string: 'artifact_kind: prd-requirements\nreadiness_verified_by: check-prd-artifact.js',
        },
        {
          old_string: 'Test PRD.',
          new_string: 'Updated test PRD.',
        },
      ]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('PRD prewrite guard blocked MultiEdit');
      expect(result.stderr).toContain('readiness_*');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks MultiEdit that mutates an existing PRD into final planning intent', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/multiedit-final-pair-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runMultiEditHook(projectRoot, relativePath, [
        {
          old_string: 'write_mode: checkpoint-prd',
          new_string: 'write_mode: final-prd',
        },
        {
          old_string: 'can_enter_spec_plan: no',
          new_string: 'can_enter_spec_plan: yes',
        },
      ]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('PRD prewrite guard blocked MultiEdit');
      expect(result.stderr).toContain('ready/final state');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks reconstruction-degraded Edit when payload directly writes ready fields', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/edit-degraded-ready-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runEditHook(
        projectRoot,
        relativePath,
        'missing old string',
        'status: ready-for-planning',
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('reconstruction_status: degraded');
      expect(result.stderr).toContain('PRD prewrite guard blocked Edit');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('blocks reconstruction-degraded MultiEdit when payload directly writes final planning intent', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/multiedit-degraded-final-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runMultiEditHook(projectRoot, relativePath, [
        {
          old_string: 'missing old string',
          new_string: 'write_mode: final-prd',
        },
        {
          old_string: 'can_enter_spec_plan: no',
          new_string: 'can_enter_spec_plan: yes',
        },
      ]);

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('reconstruction_status: degraded');
      expect(result.stderr).toContain('PRD prewrite guard blocked MultiEdit');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('allows reconstruction-degraded Edit when payload does not touch ready fields', () => {
    const projectRoot = makeTempDir();
    const relativePath = 'docs/brainstorms/edit-degraded-prose-requirements.md';
    const prdPath = path.join(projectRoot, relativePath);

    try {
      installRuntimeChecker(projectRoot);
      write(prdPath, prdWithReadiness([
        'write_mode: checkpoint-prd',
        'can_enter_spec_plan: no',
      ]));

      const result = runEditHook(
        projectRoot,
        relativePath,
        'missing old string',
        'Updated ordinary prose.',
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
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

  test('prints checker remediation hints when blocking findings include them', () => {
    const projectRoot = makeTempDir();

    try {
      installRuntimeChecker(projectRoot);

      const result = runHook(
        projectRoot,
        'docs/brainstorms/remediation-hint-requirements.md',
        prdWithReadiness([
          'write_mode: final-prd',
          'clarification_evidence: asked-owner',
          'can_enter_spec_plan: yes',
          'preflight_sweep_closure: closed',
        ]),
      );

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('checker_remediation_hints:');
      expect(result.stderr).toContain('decision_card_undeclared');
      expect(result.stderr).toContain('Add the missing Decision Card fields');
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
