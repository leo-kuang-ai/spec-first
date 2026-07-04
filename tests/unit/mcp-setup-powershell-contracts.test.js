const fs = require('fs');
const os = require('node:os');
const path = require('path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const configureHostPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/configure-host.ps1');
const detectHostPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/detect-host.ps1');
const detectToolsPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/detect-tools.ps1');
const installHelpersPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-helpers.ps1');
const installMcpPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-mcp.ps1');
const verifyToolsPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/verify-tools.ps1');
const writeSetupFactsPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/write-setup-facts.ps1');
const mcpToolsJsonPath = path.join(repoRoot, 'skills/spec-mcp-setup/mcp-tools.json');
const helperToolsJsonPath = path.join(repoRoot, 'skills/spec-mcp-setup/helper-tools.json');
const mcpSetupSkillPath = path.join(repoRoot, 'skills/spec-mcp-setup/SKILL.md');
const helperRegistryPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/lib-helper-registry.ps1');
const checkHealthPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/check-health.ps1');

function spawnPwsh(args, options = {}) {
  const result = spawnSync('pwsh', args, options);
  if (result.error && result.error.code === 'ENOENT') {
    return null;
  }
  return result;
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-mcp-setup PowerShell setup facts contract', () => {
  test('host config writes remain atomic and rollback guarded', () => {
    const source = read(configureHostPs1);

    expect(source).toContain('function Acquire-ConfigLock');
    expect(source).toContain('function Release-ConfigLock');
    expect(source).toContain('$LockPath = "$ConfigPath.lock"');
    expect(source).toContain('[System.IO.FileShare]::None');
    expect(source).toContain('function Restore-Backup');
    expect(source).toContain('Restore-Backup -BackupPath $backupPath');
    expect(source).toContain('Set-TextFileAtomic -Path $ConfigPath -Value ($config | ConvertTo-Json -Depth 8)');
    expect(source).toContain('function Test-SelectedConfigConflicts');
    expect(source).toContain('SPEC_FIRST_MCP_CONFIGURE_OVERWRITE');
    expect(source).toContain("} elseif ($DetectedHost -eq 'kiro' -or $DetectedHost -eq 'qoder') {");
    expect(source).toContain('Assert-NoLiteralSecretValues');
    expect(source).toContain('$value -is [pscustomobject]');
  });

  test('detect-host recognizes qoder and qodercli as Qoder CLI aliases without silent mixed-host selection', () => {
    const source = read(detectHostPs1);

    expect(source).toContain("$hasQoderCli = (Test-CommandExists 'qodercli') -or (Test-CommandExists 'qoder')");
    expect(source).toContain('if ($hasQoderCli -and -not $hasClaudeCli -and -not $hasCodexCli)');
    expect(source).toContain("if (Test-CommandExists 'qodercli')");
    expect(source).toContain("} elseif (Test-CommandExists 'qoder') {");
    expect(source).toContain("$cliCommand = 'qoder'");
  });

  test('kiro host config writes workspace json by default and user json only with opt-in when PowerShell is available', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-setup-kiro-'));
    try {
      const repo = path.join(tmp, 'repo');
      const home = path.join(tmp, 'home');
      fs.mkdirSync(repo, { recursive: true });
      fs.mkdirSync(home, { recursive: true });
      fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"fixture"}\n');

      const defaultResult = spawnPwsh(['-NoProfile', '-File', configureHostPs1, '-Tool', 'sequential-thinking'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      if (defaultResult === null) {
        return;
      }

      expect(defaultResult.status).toBe(0);
      const defaultPayload = JSON.parse(defaultResult.stdout);
      const workspaceConfigPath = path.join(repo, '.kiro/settings/mcp.json');
      const userConfigPath = path.join(home, '.kiro/settings/mcp.json');
      expect(defaultPayload.selected_scope).toBe('workspace');
      expect(fs.existsSync(workspaceConfigPath)).toBe(true);
      expect(fs.existsSync(userConfigPath)).toBe(false);
      expect(JSON.parse(read(workspaceConfigPath)).mcpServers['sequential-thinking']).toMatchObject({
        command: 'npx',
      });

      const userResult = spawnPwsh(['-NoProfile', '-File', configureHostPs1, '-Tool', 'context7', '-UserScope'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      expect(userResult.status).toBe(0);
      const userPayload = JSON.parse(userResult.stdout);
      expect(userPayload.selected_scope).toBe('user');
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toMatchObject({
        command: 'npx',
      });

      const workspaceContext7Result = spawnPwsh(['-NoProfile', '-File', configureHostPs1, '-Tool', 'context7'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      expect(workspaceContext7Result.status).toBe(0);

      const detectResult = spawnPwsh(['-NoProfile', '-File', detectToolsPs1, '-Repo', repo], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      expect(detectResult.status).toBe(0);
      const detectPayload = JSON.parse(detectResult.stdout);
      expect(detectPayload.tools['sequential-thinking'].host_config_status).toBe('ready');
      expect(detectPayload.tools.context7.host_config_status).toBe('ready');

      const uninstallWorkspaceResult = spawnPwsh(['-NoProfile', '-File', path.join(repoRoot, 'skills/spec-mcp-setup/scripts/uninstall-mcp.ps1'), '-Tool', 'context7'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      expect(uninstallWorkspaceResult.status).toBe(0);
      expect(JSON.parse(read(workspaceConfigPath)).mcpServers.context7).toBeUndefined();
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toMatchObject({
        command: 'npx',
      });

      const uninstallWrongEnvResult = spawnPwsh(['-NoProfile', '-File', path.join(repoRoot, 'skills/spec-mcp-setup/scripts/uninstall-mcp.ps1'), '-Tool', 'context7'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          QODER_USER_SCOPE: '1',
          HOME: home,
        },
      });
      expect(uninstallWrongEnvResult.status).toBe(0);
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toMatchObject({
        command: 'npx',
      });

      const uninstallUserResult = spawnPwsh(['-NoProfile', '-File', path.join(repoRoot, 'skills/spec-mcp-setup/scripts/uninstall-mcp.ps1'), '-Tool', 'context7', '-UserScope'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'kiro',
          HOME: home,
        },
      });
      expect(uninstallUserResult.status).toBe(0);
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toBeUndefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('kiro literal secret guard walks PSCustomObject graphs', () => {
    expect(read(configureHostPs1)).toContain('$current -is [pscustomobject]');
    expect(read(configureHostPs1)).toContain('$property.Name');
    expect(read(configureHostPs1)).toContain('config contains a literal secret-like value');
    expect(read(configureHostPs1)).toContain("$DetectedHost -ne 'kiro' -and $DetectedHost -ne 'qoder'");
  });

  test('qoder host config writes local json by default and user json only with opt-in when PowerShell is available', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-setup-qoder-'));
    try {
      const repo = path.join(tmp, 'repo');
      const home = path.join(tmp, 'home');
      fs.mkdirSync(repo, { recursive: true });
      fs.mkdirSync(home, { recursive: true });
      fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"fixture"}\n');

      const defaultResult = spawnPwsh(['-NoProfile', '-File', configureHostPs1, '-Tool', 'sequential-thinking'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'qoder',
          HOME: home,
        },
      });
      if (defaultResult === null) {
        return;
      }

      expect(defaultResult.status).toBe(0);
      const defaultPayload = JSON.parse(defaultResult.stdout);
      const localConfigPath = path.join(repo, '.qoder/settings.local.json');
      const userConfigPath = path.join(home, '.qoder/settings.json');
      expect(defaultPayload.selected_scope).toBe('local');
      expect(fs.existsSync(localConfigPath)).toBe(true);
      expect(fs.existsSync(userConfigPath)).toBe(false);
      expect(JSON.parse(read(localConfigPath)).mcpServers['sequential-thinking']).toMatchObject({
        command: 'npx',
      });

      const userResult = spawnPwsh(['-NoProfile', '-File', configureHostPs1, '-Tool', 'context7', '-UserScope'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'qoder',
          HOME: home,
        },
      });
      expect(userResult.status).toBe(0);
      const userPayload = JSON.parse(userResult.stdout);
      expect(userPayload.selected_scope).toBe('user');
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toMatchObject({
        command: 'npx',
      });
      expect(JSON.parse(read(localConfigPath)).mcpServers.context7).toBeUndefined();

      const uninstallWrongEnvResult = spawnPwsh(['-NoProfile', '-File', path.join(repoRoot, 'skills/spec-mcp-setup/scripts/uninstall-mcp.ps1'), '-Tool', 'context7'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'qoder',
          KIRO_USER_SCOPE: '1',
          HOME: home,
        },
      });
      expect(uninstallWrongEnvResult.status).toBe(0);
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toMatchObject({
        command: 'npx',
      });

      const uninstallUserEnvResult = spawnPwsh(['-NoProfile', '-File', path.join(repoRoot, 'skills/spec-mcp-setup/scripts/uninstall-mcp.ps1'), '-Tool', 'context7'], {
        cwd: repo,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'qoder',
          QODER_USER_SCOPE: '1',
          HOME: home,
        },
      });
      expect(uninstallUserEnvResult.status).toBe(0);
      expect(JSON.parse(read(userConfigPath)).mcpServers.context7).toBeUndefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('setup sources use direct setup facts only', () => {
    const toolsJson = JSON.parse(read(mcpToolsJsonPath));
    const combined = [
      read(detectToolsPs1),
      read(verifyToolsPs1),
      read(writeSetupFactsPs1),
      read(mcpSetupSkillPath),
    ].join('\n');

    expect(toolsJson.schema_version).toBe('7');
    expect(toolsJson.external_dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'codegraph',
        package: '@colbymchenry/codegraph',
        version: expect.any(String),
      }),
      expect.objectContaining({
        id: 'graphify',
        package: 'graphifyy',
        version: expect.any(String),
      }),
    ]));
    expect(toolsJson.external_dependencies.every((dependency) => dependency.version.length > 0)).toBe(true);
    expect(toolsJson.tools.map((tool) => tool.id)).toEqual(['sequential-thinking', 'context7', 'codegraph']);
    expect(toolsJson.tools.filter((tool) => tool.required).map((tool) => tool.id)).toEqual(['sequential-thinking', 'context7']);
    expect(toolsJson.tools.find((tool) => tool.id === 'codegraph')).toMatchObject({
      required: false,
      opt_in: {
        explicit_consent_required: true,
      },
      project_bootstrap: {
        kind: 'command',
        required: true,
        project_file: '.codegraph/codegraph.db',
        unix: {
          command: 'codegraph',
          args: ['init'],
        },
        status_probe: {
          command: 'codegraph',
          args: ['status'],
        },
      },
      provider_readiness: {
        kind: 'code-structure',
        profile: 'optional',
        first_generation: {
          owner: 'runtime-setup',
          scope: 'project',
          requires_explicit_gate: true,
        },
      },
    });
    expect(toolsJson.tools.find((tool) => tool.id === 'codegraph')).toMatchObject({
      dependency_ref: 'codegraph',
      installation: {
        kind: 'global-npm',
        unix: {
          command: 'npm',
        },
        verify_command: {
          command: 'codegraph',
        },
      },
      host_config: {
        codex: {
          command: 'codegraph',
          args: ['serve', '--mcp'],
        },
        kiro: {
          command: 'codegraph',
          args: ['serve', '--mcp'],
          targets: {
            workspace: {
              config_path: '.kiro/settings/mcp.json',
              config_format: 'json',
            },
            user: {
              config_path: '$HOME/.kiro/settings/mcp.json',
              config_format: 'json',
              requires_user_scope_opt_in: true,
            },
          },
          fallback_order: ['workspace'],
        },
        qoder: {
          command: 'codegraph',
          args: ['serve', '--mcp'],
          targets: {
            local: {
              config_path: '.qoder/settings.local.json',
              config_format: 'json',
            },
            user: {
              config_path: '$HOME/.qoder/settings.json',
              config_format: 'json',
              requires_user_scope_opt_in: true,
            },
          },
          fallback_order: ['local'],
        },
      },
    });
    expect(toolsJson.tools.every((tool) => tool.category === 'mcp')).toBe(true);
    expect(toolsJson.tools.every((tool) => !Object.prototype.hasOwnProperty.call(tool, 'provider_config'))).toBe(true);
    expect(toolsJson.tools.every((tool) => !Object.prototype.hasOwnProperty.call(tool, 'provider_role'))).toBe(true);
    expect(combined).toContain("schema_version = 'tool-facts.v2'");
    expect(combined).toContain('configured_dependencies');
    expect(combined).toContain('schema_capabilities');
    expect(combined).toContain("schema_version = 'runtime-capabilities.v1'");
    expect(combined).toContain("reason_code = 'setup-facts-ready'");
    expect(combined).toContain('tool-facts.json');
    expect(combined).toContain('runtime-capabilities.json');
    expect(read(detectToolsPs1)).toContain('$ConfigFormat = $HostInfo.config_format');
    expect(read(detectToolsPs1)).toContain('function Test-JsonHostConfig');
    expect(read(installMcpPs1)).toContain('function Test-OptionalToolAllowed');
    expect(read(installMcpPs1)).toContain('[switch]$Plan');
    expect(read(installMcpPs1)).toContain('[string]$RequirementWorkspace');
    expect(read(installMcpPs1)).toContain('SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT');
    expect(read(installMcpPs1)).toContain('setup-plan-renderer.cjs');
    expect(read(installMcpPs1)).toContain("reason_code = 'registry_not_required'");
    expect(read(installMcpPs1)).toContain('optional MCP tools require explicit opt-in metadata');
    expect(read(installHelpersPs1)).toContain('[string]$RequirementWorkspace');
    expect(read(installHelpersPs1)).toContain('Resolve-RequirementWorkspace');
    expect(read(installHelpersPs1)).toContain('SPEC_FIRST_PROVIDER_ORIGINAL_PATH');
    expect(read(installHelpersPs1)).toContain('Resolve-GraphifyCli');
    expect(read(installHelpersPs1)).toContain('Resolve-GraphifyCliMatchingPin');
    expect(read(installHelpersPs1)).toContain('Invoke-GraphifyCommand');
    expect(read(installHelpersPs1)).toContain('Invoke-GraphifyCommandWithTimeout');
    expect(read(installHelpersPs1)).toContain('Get-GraphifyVersionOutputWithTimeout');
    expect(read(installHelpersPs1)).toContain('Test-GraphifyCommandVersionMatchesPin');
    expect(read(installHelpersPs1)).toContain('Normalize-GraphifyInstructionSection');
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommand @('extract', '.')");
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommandCapture -Arguments @('update', '.')");
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommandCapture -Arguments @('update', '.', '--force')");
    expect(read(installHelpersPs1)).toContain('Test-GraphifyOutputRequestsForceOverwrite');
    expect(read(installHelpersPs1)).toContain('Get-ExternalDependencyField');
    expect(read(installHelpersPs1)).toContain('$mcpToolsJson = Read-McpToolsJson -Path $mcpToolsPath');
    expect(read(installHelpersPs1)).toContain('Assert-McpToolsSchemaVersion -ToolsJson $mcpToolsJson');
    expect(read(installHelpersPs1)).toContain("Get-ExternalDependencyField -DependencyId 'graphify' -Field 'version'");
    expect(read(installHelpersPs1)).toContain('uv tool install --force "$graphifyPackage==$graphifyVersionPin"');
    expect(read(installHelpersPs1)).toContain('pipx install --force "$graphifyPackage==$graphifyVersionPin"');
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommand @('install', '--project', '--platform', $platformName)");
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommand @('hook', 'install')");
    expect(read(installHelpersPs1)).toContain('Repair-GraphifyHookPathVisibility -RepoRoot $RepoRoot');
    expect(read(installHelpersPs1)).toContain('# spec-first graphify path repair start');
    expect(read(installHelpersPs1)).toContain('Installed by: graphify hook install');
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommand @('hook', 'status')");
    expect(read(installHelpersPs1)).toContain('Test-GraphifyFirstGenerationReadyForHook');
    expect(read(installHelpersPs1)).toContain('Set-GraphifyHookSkipped');
    expect(read(installHelpersPs1)).toContain("Invoke-GraphifyCommand -Arguments @('query', 'spec-first setup readiness', '--graph', $graphJson) -TimeoutSeconds $probeTimeoutSeconds");
    expect(read(installHelpersPs1)).toContain("$probeTimeoutSeconds = Get-NonNegativeIntEnv -Name 'SPEC_FIRST_PROBE_TIMEOUT_SECONDS' -Default 30");
    expect(read(installHelpersPs1)).toContain('Invoke-GraphifyQueryProbeForExistingArtifactIfAvailable');
    expect(read(installHelpersPs1)).toContain("SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED'))) { return }");
    expect(read(installHelpersPs1)).toContain('if ([string]::IsNullOrWhiteSpace((Resolve-GraphifyCliMatchingPin))) { return }');
    expect(read(installHelpersPs1)).toContain('Ordinary workflows do not refresh project graphs after code changes');
    expect(read(installHelpersPs1)).toContain("'.kiro/skills/graphify/SKILL.md'");
    expect(read(installHelpersPs1)).toContain("'.qoder/skills/graphify/SKILL.md'");
    expect(read(installHelpersPs1)).toContain("@('claude', 'codex', 'kiro', 'qoder')");
    expect(read(checkHealthPs1)).toContain("'.kiro', 'skills', $SkillName, 'SKILL.md'");
    expect(read(checkHealthPs1)).toContain("'.qoder', 'skills', $SkillName, 'SKILL.md'");
    for (const token of [
      'Use Graphify as exploration-tier orientation',
      'architecture relationships',
      'cross-file relationships',
      'impact analysis',
      'broad codebase navigation',
      'reading source first is always valid',
      'Use `query` for broad orientation',
      'scoped candidate subgraph',
      'Do not use Graphify by default',
      'simple factual Q&A',
      'current conversation or context summaries',
      'single-document summarization/editing',
      'already-scoped file reads',
      'provider_untrusted',
    ]) {
      expect(read(installHelpersPs1)).toContain(token);
    }
    expect(read(installHelpersPs1)).not.toContain('Use Graphify first only');
    expect(read(installHelpersPs1)).not.toContain('For codebase questions, first use Graphify');
    expect(read(installHelpersPs1)).not.toContain('After modifying code, run `"<resolved-graphify>" update .`');
    expect(read(installHelpersPs1)).not.toContain('--no-cluster');
    expect(read(installHelpersPs1)).not.toContain('.spec-first/workspace/providers/graphify/graphify-out');
    expect(read(installHelpersPs1)).not.toContain('uvx --from graphifyy==');
    expect(read(installHelpersPs1)).not.toContain('graphify .');
    expect(read(installMcpPs1)).toContain('codegraph sync');
    expect(read(installMcpPs1)).toContain('Test-CodeGraphStatusRequestsFullReindex');
    expect(read(installMcpPs1)).toContain('& codegraph index -f');
    expect(read(installMcpPs1)).toContain("Where-Object { $_.status -ne 'ready' }");
    for (const section of [
      'Execution result',
      'MCP servers',
      'Helper tools',
      'Provider tools',
      'Host configured dependencies',
      'Install safety',
      'Project setup facts',
      'Verification profile',
      'Next steps',
    ]) {
      expect(read(verifyToolsPs1)).toContain(`title = '${section}'`);
    }
  });

  test('check-health project URLs come from helper registry source_repo', () => {
    const registry = JSON.parse(read(helperToolsJsonPath));
    const helperLib = read(helperRegistryPs1);
    const checkHealth = read(checkHealthPs1);

    expect(helperLib).toContain('function Get-HelperSourceRepo');
    expect(checkHealth).toContain('return (Get-HelperSourceRepo -Name $Name)');
    expect(checkHealth).not.toMatch(/https:\/\/cli\.github\.com|https:\/\/jqlang\.github\.io\/jq\/|https:\/\/ffmpeg\.org\/download\.html/);
    expect(registry.helpers.every((helper) => helper.safety.source_repo && helper.safety.source_repo.length > 0)).toBe(true);

    const psScript = [
      `. '${helperRegistryPs1}'`,
      'foreach ($h in @((Get-HelperRegistry).helpers)) {',
      '  Write-Output ("{0}|{1}" -f $h.id, (Get-HelperSourceRepo -Name $h.id))',
      '}',
    ].join('\n');
    const psResult = spawnPwsh(['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
    if (psResult === null) {
      return;
    }
    expect(psResult.status).toBe(0);
    const sourceRepoById = Object.fromEntries(
      psResult.stdout.split('\n').filter(Boolean).map((line) => {
        const [id, ...rest] = line.split('|');
        return [id, rest.join('|').trim()];
      }),
    );
    for (const helper of registry.helpers) {
      expect(sourceRepoById[helper.id]).toBe(helper.safety.source_repo);
    }
  });

  test('PowerShell helper verification keeps registry baseline semantics', () => {
    const installHelpersPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-helpers.ps1');
    const result = spawnPwsh(['-NoProfile', '-File', installHelpersPs1, '-VerifyOnly'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (result === null) {
      return;
    }

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.helper_tools['agent-browser']).toMatchObject({
      required: true,
      baseline_blocking: false,
      kind: 'browser-helper',
    });
    expect(payload.helper_tools['ast-grep']).toMatchObject({
      required: true,
      baseline_blocking: false,
      kind: 'cli',
    });
    expect(payload.helper_tools['ast-grep-skill']).toMatchObject({
      required: true,
      baseline_blocking: true,
      kind: 'global-skill',
    });
    expect(Array.isArray(payload.provider_readiness)).toBe(true);
    expect(Object.values(payload.helper_tools).every((helper) => helper.profile && helper.kind && helper.safety && helper.reason_code)).toBe(true);
  });

  test('write-setup-facts writes setup facts when PowerShell is available', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-setup-'));
    try {
      const repo = path.join(tmp, 'repo');
      fs.mkdirSync(repo, { recursive: true });
      fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"fixture"}\n');
      const factsPath = path.join(tmp, 'facts.json');
      fs.writeFileSync(factsPath, JSON.stringify({
        repo_status: 'git-repo',
        repo_root: repo,
        host: 'codex',
        baseline_ready: true,
        generated_runtime_manifest: {
          status: 'current',
          recorded_manifest_version: '1.11.0',
          bundled_manifest_version: '1.11.0',
          evidence_basis: 'state.manifestVersion vs bundled manifest.version',
        },
        tools: {
          context7: { status: 'ready' },
        },
        provider_readiness: [
          {
            provider: 'graphify',
            kind: 'project-graph',
            profile: 'optional',
            readiness_status: 'stale',
            lifecycle: {
              installed: true,
              configured: false,
              initialized: false,
              indexed: true,
              server_reachable: false,
              artifact_exists: true,
              query_verified: false,
              fallback_used: false,
            },
            repo_aligned: 'unknown',
            capabilities: ['project-graph'],
            limitations: ['fixture'],
            source_read_required: true,
            fallback: {
              available: true,
              methods: ['rg'],
              reason_code: 'project-graph-provider-unavailable',
            },
            next_actions: [],
            native_interfaces: ['cli'],
            first_generation: {
              owner: 'runtime-setup',
              status: 'completed',
              scope: 'project',
              requires_explicit_gate: true,
              requirement_workspace_path: '.spec-first/workspace/requirements/demo',
              artifact_root: 'graphify-out',
              artifact_refs: ['graphify-out/graph.json'],
              next_action: null,
            },
            steady_state: {
              refresh_owner: 'provider-native',
              refresh_mode: 'skill-cli-hook-on-demand',
              hook_default: true,
              usage_owner: 'downstream-skill',
              hook_installed: true,
              hook_verified: true,
              hook_status: 'verified',
              hook_skipped_reason: null,
            },
            usage_note: 'Use Graphify CLI query/path/explain for project-graph candidates.',
          },
        ],
        target: {
          target_kind: 'child_git_repo',
          target_root: repo,
          state_write_allowed: true,
          reason_code: 'explicit-repo-target',
        },
      }));

      const result = spawnPwsh(['-NoProfile', '-File', writeSetupFactsPs1, '-FactsFile', factsPath], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      if (result === null) {
        return;
      }

      expect(result.status).toBe(0);
      const stdout = JSON.parse(result.stdout);
      const toolFacts = JSON.parse(read(path.join(repo, '.spec-first/config/tool-facts.json')));
      const runtimeCapabilities = JSON.parse(read(path.join(repo, '.spec-first/config/runtime-capabilities.json')));

      expect(stdout.reason_code).toBe('setup-facts-ready');
      expect(stdout.tool_facts_path).toContain('tool-facts.json');
      expect(stdout.runtime_capabilities_path).toContain('runtime-capabilities.json');
      expect(toolFacts.schema_version).toBe('tool-facts.v2');
      expect(toolFacts.tools.context7.status).toBe('ready');
      expect(toolFacts.items.some((item) => item.id === 'context7')).toBe(true);
      expect(Array.isArray(toolFacts.configured_dependencies)).toBe(true);
      expect(toolFacts.schema_capabilities).toContain('items');
      expect(toolFacts.schema_capabilities).toContain('configured_dependencies');
      expect(toolFacts.provider_readiness).toHaveLength(1);
      expect(toolFacts.provider_readiness[0]).toMatchObject({
        provider: 'graphify',
        profile: 'optional',
        readiness_status: 'stale',
        native_interfaces: ['cli'],
        first_generation: {
          owner: 'runtime-setup',
          status: 'completed',
        },
        steady_state: {
          refresh_mode: 'skill-cli-hook-on-demand',
          hook_installed: true,
          hook_verified: true,
          hook_status: 'verified',
        },
      });
      expect(runtimeCapabilities.schema_version).toBe('runtime-capabilities.v1');
      expect(runtimeCapabilities.direct_evidence.bounded_source_reads).toBe(true);
      expect(runtimeCapabilities.setup_summary.generated_runtime_manifest.status).toBe('current');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('write-setup-facts repairs contradictory ready item projection when PowerShell is available', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-setup-conflict-'));
    try {
      const repo = path.join(tmp, 'repo');
      fs.mkdirSync(repo, { recursive: true });
      fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"fixture"}\n');
      const factsPath = path.join(tmp, 'facts.json');
      fs.writeFileSync(factsPath, JSON.stringify({
        repo_status: 'git-repo',
        repo_root: repo,
        host: 'claude',
        tools: {
          context7: {
            dependency_status: 'ready',
            host_config_status: 'action-required',
            result: 'ready',
            reason_code: 'ready',
            next_action: 'configure host',
          },
        },
        target: {
          target_kind: 'child_git_repo',
          target_root: repo,
          state_write_allowed: true,
          reason_code: 'explicit-repo-target',
        },
      }));

      const result = spawnPwsh(['-NoProfile', '-File', writeSetupFactsPs1, '-FactsFile', factsPath], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      if (result === null) {
        return;
      }

      expect(result.status).toBe(0);
      const toolFacts = JSON.parse(read(path.join(repo, '.spec-first/config/tool-facts.json')));
      expect(toolFacts.items.find((item) => item.id === 'context7')).toMatchObject({
        configured_status: 'action-required',
        result: 'action-required',
        reason_code: 'host-config-action-required',
      });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('detect-tools treats npm @latest host config drift as non-blocking when PowerShell is available', () => {
    if (process.platform === 'win32') {
      return;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-setup-drift-'));
    const managedParent = path.join(tmp, 'managed-readonly');
    try {
      const repo = path.join(tmp, 'repo');
      const home = path.join(tmp, 'home');
      fs.mkdirSync(repo, { recursive: true });
      fs.mkdirSync(home, { recursive: true });
      fs.mkdirSync(managedParent, { recursive: true });
      fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"fixture"}\n');
      spawnSync('git', ['init'], { cwd: repo, encoding: 'utf8' });
      fs.writeFileSync(path.join(home, '.claude.json'), JSON.stringify({
        mcpServers: {
          'sequential-thinking': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          },
          context7: {
            command: 'npx',
            args: ['-y', '@upstash/context7-mcp'],
          },
        },
      }));
      const managedPath = path.join(managedParent, 'managed-mcp.json');
      fs.writeFileSync(managedPath, '{}\n');
      fs.chmodSync(managedParent, 0o500);
      fs.chmodSync(managedPath, 0o400);

      const result = spawnPwsh(['-NoProfile', '-File', detectToolsPs1, '-Repo', repo], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          MCP_SETUP_HOST: 'claude',
          HOME: home,
          MCP_SETUP_CLAUDE_MANAGED_PATH_OVERRIDE: managedPath,
        },
      });
      if (result === null) {
        return;
      }

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.tools.context7).toMatchObject({
        host_config_status: 'registry-args-drift',
        result: 'degraded',
        reason_code: 'host-config-version-drift',
        next_action: '',
      });
      expect(payload.tools['sequential-thinking']).toMatchObject({
        host_config_status: 'registry-args-drift',
        result: 'degraded',
        reason_code: 'host-config-version-drift',
        next_action: '',
      });
      expect(payload.tools.codegraph).toMatchObject({
        required: false,
        baseline_blocking: false,
        result: 'action-required',
        reason_code: 'optional-capability-not-selected',
        next_action: '',
      });
    } finally {
      try { fs.chmodSync(managedParent, 0o700); } catch (_error) {}
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // 回归(M1):bash 与 PowerShell 的展示命令生成器收敛到各自 lib 的共享函数后,
  // 对同一 helper×OS 必须给出一致的展示命令(消除双宿主 + 双脚本三方漂移)。
  // Test-CommandExists/command -v 都按「全部存在」模拟,确保比较的是同一确定性分支。
  test('bash and PowerShell share one install-command display generator (no drift)', () => {
    const scriptsDir = path.join(repoRoot, 'skills/spec-mcp-setup/scripts');
    const libSh = path.join(scriptsDir, 'lib-helper-registry.sh');
    const libPs1 = path.join(scriptsDir, 'lib-helper-registry.ps1');
    const helpers = ['gh', 'jq', 'vhs', 'silicon', 'ffmpeg', 'ast-grep', 'ast-grep-skill'];
    const platforms = ['macos', 'linux', 'windows'];

    // PowerShell 侧:dot-source lib + 桩 Test-CommandExists=true,逐组合输出。
    const psScript = [
      `. '${libPs1}'`,
      'function Test-CommandExists { param([string]$Name) return $true }',
      `foreach ($h in @(${helpers.map((h) => `'${h}'`).join(',')})) {`,
      `  foreach ($p in @(${platforms.map((p) => `'${p}'`).join(',')})) {`,
      '    Write-Output ("{0}|{1}|{2}" -f $h, $p, (Get-HelperInstallCommandDisplay -Name $h -Platform $p))',
      '  }',
      '}',
    ].join('\n');
    const psResult = spawnPwsh(['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
    if (psResult === null) {
      return; // pwsh 不可用,跳过(与本套件其他 pwsh 测试一致)
    }
    expect(psResult.status).toBe(0);
    const psByKey = {};
    for (const line of psResult.stdout.split('\n').filter(Boolean)) {
      const [h, p, ...rest] = line.split('|');
      psByKey[`${h}|${p}`] = rest.join('|').trim();
    }

    // bash 侧:source lib + 桩 command(让所有 command -v 命中),逐组合输出比较。
    for (const h of helpers) {
      for (const p of platforms) {
        const bashScript = `command() { return 0; }; source '${libSh}'; helper_registry_install_command_display '${h}' '${p}'`;
        const shResult = spawnSync('bash', ['-c', bashScript], { encoding: 'utf8' });
        expect(shResult.status).toBe(0);
        const bashCmd = shResult.stdout.trim();
        expect(`${h}|${p}=>${psByKey[`${h}|${p}`]}`).toBe(`${h}|${p}=>${bashCmd}`);
      }
    }
  });

  // 回归(M1 parity 盲区补充):同时校验「工具缺失」分支的双宿主一致性。
  // 已知 pre-existing 平台差异(非本次 M1 引入,M1 只忠实搬运):vhs/silicon 在 windows
  // 缺 go/cargo 时,bash 给官网 URL(诚实,因命令会失败),PowerShell 无条件给 go/cargo
  // install。此处显式登记为 KNOWN_ABSENT_DIVERGENCE,使该差异被测试可见而非静默掩盖;
  // 其余 helper 在工具缺失时必须双宿主一致。彻底对齐需连带 executor 侧,留待后续切片。
  test('bash and PowerShell install-command display parity in absent-tools branch (known divergences tracked)', () => {
    const scriptsDir = path.join(repoRoot, 'skills/spec-mcp-setup/scripts');
    const libSh = path.join(scriptsDir, 'lib-helper-registry.sh');
    const libPs1 = path.join(scriptsDir, 'lib-helper-registry.ps1');
    const helpers = ['gh', 'jq', 'vhs', 'silicon', 'ffmpeg', 'ast-grep', 'ast-grep-skill'];
    const platforms = ['macos', 'linux', 'windows'];
    // 已登记的 pre-existing 平台差异(key: `${helper}|${platform}`)。
    const KNOWN_ABSENT_DIVERGENCE = new Set(['vhs|windows', 'silicon|windows']);

    const psScript = [
      `. '${libPs1}'`,
      'function Test-CommandExists { param([string]$Name) return $false }',
      `foreach ($h in @(${helpers.map((h) => `'${h}'`).join(',')})) {`,
      `  foreach ($p in @(${platforms.map((p) => `'${p}'`).join(',')})) {`,
      '    Write-Output ("{0}|{1}|{2}" -f $h, $p, (Get-HelperInstallCommandDisplay -Name $h -Platform $p))',
      '  }',
      '}',
    ].join('\n');
    const psResult = spawnPwsh(['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
    if (psResult === null) {
      return;
    }
    expect(psResult.status).toBe(0);
    const psByKey = {};
    for (const line of psResult.stdout.split('\n').filter(Boolean)) {
      const [h, p, ...rest] = line.split('|');
      psByKey[`${h}|${p}`] = rest.join('|').trim();
    }

    for (const h of helpers) {
      for (const p of platforms) {
        const key = `${h}|${p}`;
        // bash 桩 command 全失败(command -v 返回非零),触发工具缺失分支。
        const bashScript = `command() { return 1; }; source '${libSh}'; helper_registry_install_command_display '${h}' '${p}'`;
        const shResult = spawnSync('bash', ['-c', bashScript], { encoding: 'utf8' });
        expect(shResult.status).toBe(0);
        const bashCmd = shResult.stdout.trim();
        if (KNOWN_ABSENT_DIVERGENCE.has(key)) {
          // 已登记差异:断言它「仍然不同」,一旦未来对齐(变相同)此处会失败,提醒更新登记。
          expect(psByKey[key]).not.toBe(bashCmd);
        } else {
          expect(`${key}=>${psByKey[key]}`).toBe(`${key}=>${bashCmd}`);
        }
      }
    }
  });

  // 回归(P2-2):PowerShell install safety 分类必须与 Node setup-plan-renderer.cjs 一致。
  // 曾因 install-helpers.ps1 的 Get-HelperSafetyResult 用 `$pinStatus -eq 'latest'` 一刀切,
  // 使 gh/jq/ffmpeg(review_required=false)被判 review-required、safe 分支不可达,与 Node 不一致。
  test('PowerShell helper safety classification matches the Node install-plan renderer', () => {
    const installHelpersPs1 = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-helpers.ps1');
    const rendererCjs = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs');

    const psResult = spawnPwsh(['-NoProfile', '-File', installHelpersPs1, '-VerifyOnly'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (psResult === null) {
      return; // pwsh 不可用,跳过
    }
    expect(psResult.status).toBe(0);
    const psHelpers = JSON.parse(psResult.stdout).helper_tools;

    const nodeResult = spawnSync('node', [rendererCjs], { cwd: repoRoot, encoding: 'utf8' });
    expect(nodeResult.status).toBe(0);
    const nodeSafety = {};
    for (const op of JSON.parse(nodeResult.stdout).planned_operations) {
      nodeSafety[op.id] = op.safety_result;
    }

    // 每个 helper 的 PS safety 必须等于 Node safety_result;并显式校验关键 case 已脱离 review-required。
    for (const [id, helper] of Object.entries(psHelpers)) {
      expect(`${id}=>${helper.safety}`).toBe(`${id}=>${nodeSafety[id]}`);
    }
    for (const id of ['gh', 'jq', 'ffmpeg']) {
      expect(psHelpers[id].safety).toBe('safe');
    }
  });
});
