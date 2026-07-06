'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const verifyToolsSh = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/verify-tools.sh');
const verifyToolsPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/verify-tools.ps1');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, contents, mode) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  if (mode) {
    fs.chmodSync(filePath, mode);
  }
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyExecutable(source, target) {
  writeFile(target, read(source), 0o755);
}

describe('spec-mcp-setup verify host propagation contract', () => {
  test('bash verify passes detected host and repo into helper provider readiness', () => {
    const source = read(verifyToolsSh);

    expect(source.indexOf('RECONCILIATION_HOST="$(jq -r')).toBeGreaterThan(
      source.indexOf('FACTS_JSON="$(bash "$SCRIPT_DIR/detect-tools.sh"'),
    );
    expect(source.indexOf('HELPER_JSON="$(')).toBeGreaterThan(
      source.indexOf('RECONCILIATION_REPO_ROOT="$(jq -r'),
    );
    expect(source).toContain('SPEC_FIRST_PROVIDER_HOST="$RECONCILIATION_HOST" \\');
    expect(source).toContain('SPEC_FIRST_PROVIDER_REPO_ROOT="$RECONCILIATION_REPO_ROOT" \\');
    expect(source).toContain('SPEC_FIRST_PROVIDER_HOST="$RECONCILIATION_HOST" node "$SCRIPT_DIR/provider-readiness-renderer.cjs"');
  });

  test('powershell verify passes detected host and repo into helper provider readiness', () => {
    const source = read(verifyToolsPs1);

    expect(source.indexOf('$reconciliationHost = $Facts.host')).toBeGreaterThan(
      source.indexOf("$Facts = & (Join-Path $ScriptDir 'detect-tools.ps1')"),
    );
    expect(source.indexOf("$HelperFacts = & (Join-Path $ScriptDir 'install-helpers.ps1')")).toBeGreaterThan(
      source.indexOf('$reconciliationRepoRoot = if'),
    );
    expect(source).toContain("$env:SPEC_FIRST_PROVIDER_HOST = $reconciliationHost");
    expect(source).toContain("$env:SPEC_FIRST_PROVIDER_REPO_ROOT = $reconciliationRepoRoot");
    expect(source).toContain("$env:SPEC_FIRST_PROVIDER_HOST = $reconciliationHost");
    expect(source).toContain("$mcpProviderRaw = & node (Join-Path $ScriptDir 'provider-readiness-renderer.cjs')");
  });

  test('verify outputs generated runtime manifest freshness separately from dependency readiness', () => {
    const bashSource = read(verifyToolsSh);
    const powerShellSource = read(verifyToolsPs1);

    for (const source of [bashSource, powerShellSource]) {
      expect(source).toContain('generated_runtime_manifest');
      expect(source).toContain('state.manifestVersion vs bundled manifest.version');
      expect(source).toContain('Required MCP/helper dependencies');
      expect(source).toContain('Generated runtime manifest');
      expect(source).toContain('Host setup facts pointer');
      expect(source).toContain('Host runtime readiness');
      expect(source).not.toContain('"Harness runtime"');
      expect(source).not.toContain("'Harness runtime'");
    }
  });

  test('verify suggests explicit host init flags for Kiro stale runtime manifests', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-verify-kiro-runtime-'));
    try {
      const scriptsDir = path.join(tmp, 'scripts');
      const repo = path.join(tmp, 'repo');
      const markerPath = path.join(tmp, 'marker', 'readiness-ledger.json');
      fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
      writeJson(path.join(repo, '.kiro/spec-first/state.json'), { manifestVersion: '1.0.0' });

      copyExecutable(verifyToolsSh, path.join(scriptsDir, 'verify-tools.sh'));
      writeFile(path.join(scriptsDir, 'detect-host.sh'), [
        '#!/bin/bash',
        'cat <<JSON',
        JSON.stringify({ host: 'kiro', marker_path: markerPath }),
        'JSON',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'detect-tools.sh'), [
        '#!/bin/bash',
        'set -euo pipefail',
        'repo=""',
        'while [ "$#" -gt 0 ]; do',
        '  case "$1" in',
        '    --repo) repo="$2"; shift 2 ;;',
        '    *) shift ;;',
        '  esac',
        'done',
        'jq -n --arg repo "$repo" \'{',
        '  host:"kiro",',
        '  platform:"macos",',
        '  repo_root:$repo,',
        '  repo_status:"git-repo",',
        '  target_mode:"git-repo",',
        '  target_kind:"child_git_repo",',
        '  workspace_root:$repo,',
        '  selected_repo_root:$repo,',
        '  target:{target_root:$repo,state_write_allowed:true,selection_source:"explicit-repo",repo_label:"repo"},',
        '  tools:{',
        '    context7:{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"},',
        '    "sequential-thinking":{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"}',
        '  },',
        '  next_actions:[]',
        '}\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'install-helpers.sh'), [
        '#!/bin/bash',
        'printf \'{"helper_tools":{},"provider_readiness":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'scan-configured-deps.sh'), [
        '#!/bin/bash',
        'printf \'{"configured_dependencies":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'write-setup-facts.sh'), [
        '#!/bin/bash',
        'printf \'{"tool_facts_status":"ready","runtime_capabilities_status":"ready"}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'provider-readiness-renderer.cjs'), 'process.stdout.write("[]");\n');
      writeFile(path.join(scriptsDir, 'render-status-block.cjs'), 'process.stdin.resume();\n');

      const result = spawnSync('bash', [path.join(scriptsDir, 'verify-tools.sh'), '--repo', repo], {
        cwd: repo,
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          SPEC_FIRST_BUNDLED_VERSION: '2.0.0',
          HOME: path.join(tmp, 'home'),
          PATH: process.env.PATH,
        },
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stderr).not.toContain('syntax error');
      const ledger = JSON.parse(read(markerPath));
      expect(ledger.overall_status).toBe('action-required');
      expect(ledger.reason_code).toBe('generated-runtime-manifest-refresh-required');
      expect(ledger.generated_runtime_manifest.status).toBe('stale');
      expect(ledger.generated_runtime_manifest.next_action).toBe('spec-first init --kiro --repo repo -y -u <name>');
      expect(ledger.next_actions).toContain('spec-first init --kiro --repo repo -y -u <name>');
      expect(ledger.host_runtime_ready).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('all-repos verify propagates generated runtime manifest counts and stale refresh action', () => {
    const bashSource = read(verifyToolsSh);
    const powerShellSource = read(verifyToolsPs1);

    for (const source of [bashSource, powerShellSource]) {
      expect(source).toContain('spec-first init -y -u <name>');
      expect(source).toContain('--repo <child> -y -u <name>');
      expect(source).toContain('--all-repos -y -u <name>');
      expect(source).toContain('Generated runtime manifest stale or missing in the parent workspace or one or more child repos');
      expect(source).toContain('current');
      expect(source).toContain('stale');
      expect(source).toContain('missing');
      expect(source).toContain('unknown');
    }
  });

  test('bash all-repos verify treats stale child runtime manifest as action-required', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-verify-all-repos-'));
    try {
      const scriptsDir = path.join(tmp, 'scripts');
      const workspace = path.join(tmp, 'workspace');
      const repoA = path.join(workspace, 'repo-a');
      const repoB = path.join(workspace, 'repo-b');
      const markerPath = path.join(tmp, 'marker', 'readiness-ledger.json');
      fs.mkdirSync(path.join(repoA, '.git'), { recursive: true });
      fs.mkdirSync(path.join(repoB, '.git'), { recursive: true });
      writeJson(path.join(workspace, '.codex/spec-first/state.json'), { manifestVersion: '2.0.0' });
      writeJson(path.join(repoA, '.codex/spec-first/state.json'), { manifestVersion: '1.0.0' });
      writeJson(path.join(repoB, '.codex/spec-first/state.json'), { manifestVersion: '2.0.0' });

      copyExecutable(verifyToolsSh, path.join(scriptsDir, 'verify-tools.sh'));
      writeFile(path.join(scriptsDir, 'detect-host.sh'), [
        '#!/bin/bash',
        'cat <<JSON',
        JSON.stringify({ host: 'codex', marker_path: markerPath }),
        'JSON',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'resolve-project-target.sh'), [
        '#!/bin/bash',
        'cat <<JSON',
        JSON.stringify({
          mode: 'parent-workspace',
          repo_status: 'parent-workspace',
          target_kind: 'parent-workspace',
          workspace_root: workspace,
          candidates: [
            { repo_label: 'repo-a', git_root: repoA, workspace_relative_path: 'repo-a' },
            { repo_label: 'repo-b', git_root: repoB, workspace_relative_path: 'repo-b' },
          ],
          git_health: { status: 'ok', reason_code: 'git-ok' },
        }),
        'JSON',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'detect-tools.sh'), [
        '#!/bin/bash',
        'set -euo pipefail',
        'repo=""',
        'while [ "$#" -gt 0 ]; do',
        '  case "$1" in',
        '    --repo) repo="$2"; shift 2 ;;',
        '    *) shift ;;',
        '  esac',
        'done',
        'jq -n --arg repo "$repo" \'{',
        '  host:"codex",',
        '  platform:"macos",',
        '  repo_root:$repo,',
        '  repo_status:"git-repo",',
        '  target_mode:"git-repo",',
        '  target_kind:"child_git_repo",',
        '  workspace_root:$repo,',
        '  selected_repo_root:$repo,',
        '  target:{target_root:$repo,state_write_allowed:true,git_health:{status:"ok"}},',
        '  tools:{',
        '    context7:{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"},',
        '    "sequential-thinking":{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"}',
        '  },',
        '  next_actions:[]',
        '}\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'install-helpers.sh'), [
        '#!/bin/bash',
        'printf \'{"helper_tools":{},"provider_readiness":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'scan-configured-deps.sh'), [
        '#!/bin/bash',
        'printf \'{"configured_dependencies":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'write-setup-facts.sh'), [
        '#!/bin/bash',
        'printf \'{"tool_facts_status":"ready","runtime_capabilities_status":"ready"}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'provider-readiness-renderer.cjs'), 'process.stdout.write("[]");\n');
      writeFile(path.join(scriptsDir, 'render-status-block.cjs'), 'process.stdin.resume();\n');

      const result = spawnSync('bash', [path.join(scriptsDir, 'verify-tools.sh'), '--all-repos'], {
        cwd: workspace,
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'codex',
          SPEC_FIRST_BUNDLED_VERSION: '2.0.0',
          HOME: path.join(tmp, 'home'),
          PATH: process.env.PATH,
        },
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).not.toContain('syntax error');
      const summary = JSON.parse(result.stdout);
      expect(summary.overall_status).toBe('partial');
      expect(summary.reason_code).toBe('generated-runtime-manifest-refresh-required');
      expect(summary.parent_generated_runtime_manifest.status).toBe('current');
      expect(summary.counts.generated_runtime_manifest.stale).toBe(1);
      const repoAResult = summary.results.find((entry) => entry.repo_label === 'repo-a');
      const repoBResult = summary.results.find((entry) => entry.repo_label === 'repo-b');
      expect(repoAResult).toMatchObject({
        overall_status: 'action-required',
        reason_code: 'generated-runtime-manifest-refresh-required',
      });
      expect(repoAResult.result.generated_runtime_manifest.status).toBe('stale');
      expect(repoAResult.result.generated_runtime_manifest.next_action).toBe('spec-first init --codex --repo repo-a -y -u <name>');
      expect(repoAResult.result.next_actions).toContain('spec-first init --codex --repo repo-a -y -u <name>');
      expect(repoAResult.result.next_actions).not.toContain('spec-first init -y');
      expect(repoBResult.overall_status).toBe('ready');
      expect(summary.runtime_hints.join('\n')).toContain('spec-first init --codex -y -u <name>');
      expect(summary.runtime_hints.join('\n')).toContain('spec-first init --codex --repo <child> -y -u <name>');
      expect(summary.next_action).toContain('spec-first init --codex -y -u <name>');
      expect(summary.next_action).toContain('spec-first init --codex --repo <child> -y -u <name>');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('bash all-repos verify suggests explicit Kiro init flags for parent and child runtime manifests', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-verify-all-repos-kiro-'));
      try {
        const scriptsDir = path.join(tmp, 'scripts');
        const workspace = path.join(tmp, 'workspace');
        const repoA = path.join(workspace, 'repo a');
        const repoB = path.join(workspace, 'repo-b');
      const markerPath = path.join(tmp, 'marker', 'readiness-ledger.json');
      fs.mkdirSync(path.join(repoA, '.git'), { recursive: true });
      fs.mkdirSync(path.join(repoB, '.git'), { recursive: true });
      writeJson(path.join(workspace, '.kiro/spec-first/state.json'), { manifestVersion: '1.0.0' });
      writeJson(path.join(repoA, '.kiro/spec-first/state.json'), { manifestVersion: '1.0.0' });
      writeJson(path.join(repoB, '.kiro/spec-first/state.json'), { manifestVersion: '2.0.0' });

      copyExecutable(verifyToolsSh, path.join(scriptsDir, 'verify-tools.sh'));
      writeFile(path.join(scriptsDir, 'detect-host.sh'), [
        '#!/bin/bash',
        'cat <<JSON',
        JSON.stringify({ host: 'kiro', marker_path: markerPath }),
        'JSON',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'resolve-project-target.sh'), [
        '#!/bin/bash',
        'cat <<JSON',
        JSON.stringify({
          mode: 'parent-workspace',
          repo_status: 'parent-workspace',
          target_kind: 'parent-workspace',
          workspace_root: workspace,
          candidates: [
            { repo_label: 'repo a', git_root: repoA, workspace_relative_path: 'repo a' },
            { repo_label: 'repo-b', git_root: repoB, workspace_relative_path: 'repo-b' },
          ],
          git_health: { status: 'ok', reason_code: 'git-ok' },
        }),
        'JSON',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'detect-tools.sh'), [
        '#!/bin/bash',
        'set -euo pipefail',
        'repo=""',
        'while [ "$#" -gt 0 ]; do',
        '  case "$1" in',
        '    --repo) repo="$2"; shift 2 ;;',
        '    *) shift ;;',
        '  esac',
        'done',
        'jq -n --arg repo "$repo" \'{',
        '  host:"kiro",',
        '  platform:"macos",',
        '  repo_root:$repo,',
        '  repo_status:"git-repo",',
        '  target_mode:"git-repo",',
        '  target_kind:"child_git_repo",',
        '  workspace_root:$repo,',
        '  selected_repo_root:$repo,',
        '  target:{target_root:$repo,state_write_allowed:true,git_health:{status:"ok"}},',
        '  tools:{',
        '    context7:{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"},',
        '    "sequential-thinking":{required:true,dependency_status:"ready",host_config_required:true,host_config_status:"ready",project_status:"ready"}',
        '  },',
        '  next_actions:[]',
        '}\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'install-helpers.sh'), [
        '#!/bin/bash',
        'printf \'{"helper_tools":{},"provider_readiness":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'scan-configured-deps.sh'), [
        '#!/bin/bash',
        'printf \'{"configured_dependencies":[]}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'write-setup-facts.sh'), [
        '#!/bin/bash',
        'printf \'{"tool_facts_status":"ready","runtime_capabilities_status":"ready"}\\n\'',
      ].join('\n'), 0o755);
      writeFile(path.join(scriptsDir, 'provider-readiness-renderer.cjs'), 'process.stdout.write("[]");\n');
      writeFile(path.join(scriptsDir, 'render-status-block.cjs'), 'process.stdin.resume();\n');

      const result = spawnSync('bash', [path.join(scriptsDir, 'verify-tools.sh'), '--all-repos'], {
        cwd: workspace,
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          SPEC_FIRST_BUNDLED_VERSION: '2.0.0',
          HOME: path.join(tmp, 'home'),
          PATH: process.env.PATH,
        },
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).not.toContain('syntax error');
      const summary = JSON.parse(result.stdout);
      const repoAResult = summary.results.find((entry) => entry.repo_label === 'repo a');
      expect(summary.parent_generated_runtime_manifest.status).toBe('stale');
      expect(summary.parent_generated_runtime_manifest.next_action).toBe('spec-first init --kiro -y -u <name>');
      expect(repoAResult.result.generated_runtime_manifest.next_action).toBe('spec-first init --kiro --repo "repo a" -y -u <name>');
      expect(repoAResult.result.next_actions).toContain('spec-first init --kiro --repo "repo a" -y -u <name>');
      expect(summary.runtime_hints.join('\n')).toContain('spec-first init --kiro -y -u <name>');
      expect(summary.runtime_hints.join('\n')).toContain('spec-first init --kiro --repo <child> -y -u <name>');
      expect(summary.runtime_hints.join('\n')).toContain('spec-first init --kiro --all-repos -y -u <name>');
      expect(summary.next_action).toContain('spec-first init --kiro -y -u <name>');
      expect(summary.next_action).toContain('spec-first init --kiro --repo <child> -y -u <name>');
      expect(summary.runtime_hints.join('\n')).not.toContain('Run `spec-first init -y -u <name>`');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
