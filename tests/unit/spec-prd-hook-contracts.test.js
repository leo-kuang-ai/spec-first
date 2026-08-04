'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const HOSTS = {
  claude: {
    prewrite: path.join(REPO_ROOT, 'templates/claude/hooks/prd-prewrite-guard'),
    readiness: path.join(REPO_ROOT, 'templates/claude/hooks/prd-readiness-guard'),
    envKey: 'CLAUDE_PROJECT_DIR',
    finalizeRelative: '.claude/spec-first/workflows/spec-prd/scripts/finalize-prd-artifact.js',
  },
  qoder: {
    prewrite: path.join(REPO_ROOT, 'templates/qoder/hooks/prd-prewrite-guard'),
    readiness: path.join(REPO_ROOT, 'templates/qoder/hooks/prd-readiness-guard'),
    envKey: 'QODER_PROJECT_DIR',
    finalizeRelative: '.qoder/skills/spec-prd/scripts/finalize-prd-artifact.js',
  },
};

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function checkpointPrd() {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'status: draft',
    'write_mode: checkpoint-prd',
    'can_enter_spec_plan: no',
    '---',
    '# Hook Fixture',
    '',
  ].join('\n');
}

function readyPrd() {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'status: ready-for-planning',
    'write_mode: final-prd',
    'can_enter_spec_plan: yes',
    'readiness_verified_by: check-prd-artifact.js',
    'readiness_verified_at: 2026-07-11T00:00:00.000Z',
    'readiness_checker_schema: spec-prd-artifact-report.v1',
    'readiness_finding_count: 0',
    'readiness_blocking_count: 0',
    'readiness_prd_hash: sha256:prd',
    'readiness_inputs_hash: sha256:inputs',
    '---',
    '# Hook Fixture',
    '',
    'Body v1',
    '',
  ].join('\n');
}

function withoutReadyReceipt(text) {
  return text
    .replace('status: ready-for-planning', 'status: draft')
    .replace(/^readiness_.*\n/gm, '');
}

function mutationPayload(toolName, target, currentText, nextText) {
  if (toolName === 'Write') {
    return { file_path: target, content: nextText };
  }
  if (toolName === 'Edit') {
    return { file_path: target, old_string: currentText, new_string: nextText };
  }
  return {
    file_path: target,
    edits: [{ old_string: currentText, new_string: nextText }],
  };
}

function runGit(projectRoot, args) {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: path.join(projectRoot, 'home') },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `git ${args.join(' ')} failed`);
  }
}

function initGit(projectRoot) {
  runGit(projectRoot, ['init', '-q']);
  runGit(projectRoot, ['config', 'user.name', 'Spec First Test']);
  runGit(projectRoot, ['config', 'user.email', 'spec-first@example.test']);
}

function runPrewrite(host, projectRoot, payload) {
  const config = HOSTS[host];
  return spawnSync(process.execPath, [config.prewrite], {
    cwd: projectRoot,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, [config.envKey]: projectRoot },
  });
}

function runReadiness(host, projectRoot) {
  const config = HOSTS[host];
  return spawnSync(process.execPath, [config.readiness], {
    cwd: projectRoot,
    input: '{}',
    encoding: 'utf8',
    env: { ...process.env, [config.envKey]: projectRoot },
  });
}

function readinessDecision(host, result) {
  if (host === 'claude') {
    const payload = result.stdout ? JSON.parse(result.stdout) : {};
    return {
      blocked: payload.decision === 'block',
      message: payload.reason || '',
    };
  }
  return {
    blocked: result.status === 2,
    message: result.stderr || '',
  };
}

describe('spec-prd Claude and Qoder hook parity', () => {
  test.each(Object.keys(HOSTS))('%s allows LLM-owned final intent while keeping receipt fields machine-owned', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-final-intent-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    try {
      write(target, checkpointPrd());
      const result = runPrewrite(host, projectRoot, {
        tool_name: 'Edit',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          old_string: 'write_mode: checkpoint-prd\ncan_enter_spec_plan: no',
          new_string: 'write_mode: final-prd\ncan_enter_spec_plan: yes',
        },
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS))('%s blocks degraded Edit reconstruction that touches a receipt field', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-edit-receipt-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    try {
      write(target, checkpointPrd());
      const result = runPrewrite(host, projectRoot, {
        tool_name: 'Edit',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          old_string: 'not present',
          new_string: 'readiness_prd_hash: forged',
        },
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('readiness_');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS))('%s blocks degraded MultiEdit reconstruction that touches ready status', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-multi-receipt-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    try {
      write(target, checkpointPrd());
      const result = runPrewrite(host, projectRoot, {
        tool_name: 'MultiEdit',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          edits: [{ old_string: 'not present', new_string: 'status: ready-for-planning' }],
        },
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('ready');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS).flatMap((host) => (
    ['Write', 'Edit', 'MultiEdit'].map((toolName) => [host, toolName])
  )))('%s %s blocks machine ready/receipt field addition', (host, toolName) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-${toolName}-add-receipt-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const currentText = checkpointPrd();
    const nextText = currentText
      .replace('status: draft', 'status: ready-for-planning')
      .replace('write_mode: checkpoint-prd', 'write_mode: final-prd')
      .replace('can_enter_spec_plan: no', 'can_enter_spec_plan: yes')
      .replace('---\n# Hook Fixture', 'readiness_verified_by: check-prd-artifact.js\n---\n# Hook Fixture');
    try {
      write(target, currentText);
      const result = runPrewrite(host, projectRoot, {
        tool_name: toolName,
        cwd: projectRoot,
        tool_input: mutationPayload(toolName, target, currentText, nextText),
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toMatch(/ready|readiness_/i);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS).flatMap((host) => (
    ['Write', 'Edit', 'MultiEdit'].map((toolName) => [host, toolName])
  )))('%s %s blocks machine receipt field modification', (host, toolName) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-${toolName}-modify-receipt-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const currentText = readyPrd();
    const nextText = currentText.replace('readiness_finding_count: 0', 'readiness_finding_count: 1');
    try {
      write(target, currentText);
      const result = runPrewrite(host, projectRoot, {
        tool_name: toolName,
        cwd: projectRoot,
        tool_input: mutationPayload(toolName, target, currentText, nextText),
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toContain('readiness_');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS).flatMap((host) => (
    ['Write', 'Edit', 'MultiEdit'].map((toolName) => [host, toolName])
  )))('%s %s blocks machine ready/receipt field deletion', (host, toolName) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-${toolName}-delete-receipt-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const currentText = readyPrd();
    const nextText = withoutReadyReceipt(currentText);
    try {
      write(target, currentText);
      const result = runPrewrite(host, projectRoot, {
        tool_name: toolName,
        cwd: projectRoot,
        tool_input: mutationPayload(toolName, target, currentText, nextText),
      });

      expect(result.status).toBe(2);
      expect(result.stderr).toMatch(/ready|readiness_/i);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS).flatMap((host) => (
    ['Write', 'Edit', 'MultiEdit'].map((toolName) => [host, toolName])
  )))('%s %s allows body refinement when machine fields stay unchanged', (host, toolName) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-${toolName}-body-refine-`));
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const currentText = readyPrd();
    const nextText = currentText.replace('Body v1', 'Body v2');
    try {
      write(target, currentText);
      const result = runPrewrite(host, projectRoot, {
        tool_name: toolName,
        cwd: projectRoot,
        tool_input: mutationPayload(toolName, target, currentText, nextText),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS))('%s readiness hook fails closed when git status is unavailable', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-git-failure-`));
    try {
      const decision = readinessDecision(host, runReadiness(host, projectRoot));

      expect(decision.blocked).toBe(true);
      expect(decision.message).toContain('git_status_unavailable');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS))('%s readiness hook allows a non-Git parent that contains a child Git repo', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-workspace-parent-`));
    try {
      const child = path.join(projectRoot, 'api');
      fs.mkdirSync(child, { recursive: true });
      initGit(child);
      const decision = readinessDecision(host, runReadiness(host, projectRoot));
      expect(decision.blocked).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test.each(Object.keys(HOSTS))('%s readiness hook checks the destination of a renamed ready PRD', (host) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-${host}-rename-`));
    const oldPath = 'docs/brainstorms/old-requirements.md';
    const newPath = 'docs/brainstorms/new-requirements.md';
    try {
      initGit(projectRoot);
      write(path.join(projectRoot, oldPath), checkpointPrd()
        .replace('write_mode: checkpoint-prd', 'write_mode: final-prd')
        .replace('can_enter_spec_plan: no', 'can_enter_spec_plan: yes'));
      runGit(projectRoot, ['add', oldPath]);
      runGit(projectRoot, ['commit', '-m', 'test: add ready prd']);
      runGit(projectRoot, ['mv', oldPath, newPath]);
      write(path.join(projectRoot, HOSTS[host].finalizeRelative), [
        "process.stdout.write(JSON.stringify({ blocking_reason_codes: ['ready_receipt_absent'] }));",
        'process.exit(1);',
        '',
      ].join('\n'));

      const decision = readinessDecision(host, runReadiness(host, projectRoot));

      expect(decision.blocked).toBe(true);
      expect(decision.message).toContain(newPath);
      expect(decision.message).not.toContain(oldPath);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('hosts without confirmed hard enforcement are described as degraded', () => {
    const skill = fs.readFileSync('skills/spec-prd/SKILL.md', 'utf8');

    expect(skill).toContain('Claude is the only host with confirmed managed hard enforcement');
    expect(skill).toContain('Qoder hook projection is present but activation remains unverified');
    expect(skill).toContain('Codex, Cursor, and Kiro remain loud degraded');
  });
});
