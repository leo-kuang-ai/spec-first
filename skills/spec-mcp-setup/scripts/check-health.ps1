param(
  [string]$Version = '',
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'lib-helper-registry.ps1')
$helperRegistry = Get-HelperRegistry

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-PlatformName {
  $hasIsWindows = $null -ne (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue)
  if ($hasIsWindows) {
    if ($IsWindows) { return 'windows' }
    if ($IsMacOS) { return 'macos' }
    if ($IsLinux) { return 'linux' }
  }

  switch ([System.Environment]::OSVersion.Platform) {
    ([System.PlatformID]::Win32NT) { return 'windows' }
    ([System.PlatformID]::MacOSX) { return 'macos' }
    ([System.PlatformID]::Unix) { return 'linux' }
    default { return 'unknown' }
  }
}

function Get-InstallCommand {
  param(
    [string]$Name,
    [string]$Platform
  )

  # check-health 只展示安装建议,不执行安装。agent-browser 与其他 helper 一样
  # 展示可复制命令;setup 默认不自动安装 browser helper。
  # jq/windows 是 native PowerShell 路径的有意提示(install-helpers.ps1 无此差异)。
  if ($Name -eq 'agent-browser') {
    foreach ($helper in @($helperRegistry.helpers)) {
      if ($helper.id -eq 'agent-browser' -and $helper.installation -and $helper.installation.commands) {
        $commandProperty = $helper.installation.commands.PSObject.Properties[$Platform]
        $command = if ($null -ne $commandProperty) { $commandProperty.Value } else { '' }
        if (-not [string]::IsNullOrWhiteSpace([string]$command)) {
          return [string]$command
        }
      }
    }
    return 'Run spec-mcp-setup to view the current agent-browser install command, then install it manually if browser automation is needed.'
  }
  if ($Name -eq 'jq' -and $Platform -eq 'windows') {
    return 'Not required for the native PowerShell setup path; install jqlang.jq only for Git Bash or WSL scripts.'
  }
  return (Get-HelperInstallCommandDisplay -Name $Name -Platform $Platform)
}

function Get-ProjectUrl {
  param([string]$Name)
  return (Get-HelperSourceRepo -Name $Name)
}

function Get-HelperEntry {
  param([string]$Id)
  foreach ($helper in @($helperRegistry.helpers)) {
    if ($helper.id -eq $Id) { return $helper }
  }
  return $null
}

function Get-HelperProfile {
  param([object]$Helper)
  if ($null -ne $Helper -and $Helper.profiles -and @($Helper.profiles).Count -gt 0) {
    return [string]@($Helper.profiles)[0]
  }
  return 'minimal'
}

function Test-EffectiveBaselineBlocking {
  param([object]$Helper)
  if ($null -eq $Helper) { return $true }
  if ([string]$Helper.id -eq 'jq' -and (Get-PlatformName) -eq 'windows') {
    return $false
  }
  return [bool]$Helper.baseline_blocking
}

function Test-GlobalSkillInstalled {
  param([string]$SkillName)
  $paths = @(
    [System.IO.Path]::Combine($HOME, '.agents', 'skills', $SkillName, 'SKILL.md'),
    [System.IO.Path]::Combine($HOME, '.codex', 'skills', $SkillName, 'SKILL.md'),
    [System.IO.Path]::Combine($HOME, '.claude', 'skills', $SkillName, 'SKILL.md'),
    [System.IO.Path]::Combine($HOME, '.kiro', 'skills', $SkillName, 'SKILL.md'),
    [System.IO.Path]::Combine($HOME, '.qoder', 'skills', $SkillName, 'SKILL.md')
  )
  foreach ($path in $paths) {
    if (Test-Path -LiteralPath $path -PathType Leaf) { return $true }
  }
  return $false
}

function Test-AgentBrowserReady {
  if (-not (Test-CommandExists 'agent-browser')) { return $false }
  if (-not (Test-Path -LiteralPath ([System.IO.Path]::Combine($HOME, '.agent-browser', 'spec-first-install.json')) -PathType Leaf)) { return $false }
  return (Test-GlobalSkillInstalled -SkillName 'agent-browser')
}

function Get-SetupSnapshot {
  param([string]$RepoRoot)

  if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    return [ordered]@{
      schema_version = 'spec-mcp-setup-diagnostic-snapshot.v1'
      setup_facts_status = 'skip'
      setup_facts_reason_code = 'not-inside-git-repo'
      generated_runtime_manifest = [ordered]@{ status = 'unknown'; reason_code = 'not-inside-git-repo' }
      baseline_ready = $null
      host_runtime_ready = $null
      provider_readiness = @()
      configured_dependencies = @()
    }
  }

  $factsPath = Join-Path $RepoRoot '.spec-first/config/tool-facts.json'
  $runtimePath = Join-Path $RepoRoot '.spec-first/config/runtime-capabilities.json'
  $facts = $null
  $runtime = $null
  $factsStatus = 'missing'
  $factsReason = 'setup-facts-missing'
  $runtimeStatus = 'missing'
  $runtimeReason = 'runtime-capabilities-missing'

  if (Test-Path -LiteralPath $factsPath -PathType Leaf) {
    try {
      $facts = Get-Content -Raw -LiteralPath $factsPath | ConvertFrom-Json -ErrorAction Stop
      $factsStatus = 'ready'
      $factsReason = 'setup-facts-present'
    } catch {
      $factsStatus = 'error'
      $factsReason = 'setup-facts-unreadable'
    }
  }
  if (Test-Path -LiteralPath $runtimePath -PathType Leaf) {
    try {
      $runtime = Get-Content -Raw -LiteralPath $runtimePath | ConvertFrom-Json -ErrorAction Stop
      $runtimeStatus = 'ready'
      $runtimeReason = 'runtime-capabilities-present'
    } catch {
      $runtimeStatus = 'error'
      $runtimeReason = 'runtime-capabilities-unreadable'
    }
  }

  $runtimeSummary = if ($null -ne $runtime -and $runtime.PSObject.Properties.Name -contains 'setup_summary') { $runtime.setup_summary } else { $null }
  $manifest = if ($null -ne $runtimeSummary -and $runtimeSummary.PSObject.Properties.Name -contains 'generated_runtime_manifest') {
    $runtimeSummary.generated_runtime_manifest
  } else {
    [ordered]@{
      status = 'unknown'
      reason_code = if ($runtimeStatus -eq 'missing') { 'runtime-capabilities-missing' } else { 'generated-runtime-manifest-not-reported' }
      next_action = 'spec-mcp-setup --verify-only'
    }
  }

  [ordered]@{
    schema_version = 'spec-mcp-setup-diagnostic-snapshot.v1'
    setup_facts_status = $factsStatus
    setup_facts_reason_code = $factsReason
    setup_facts_path = $factsPath
    runtime_capabilities_status = $runtimeStatus
    runtime_capabilities_reason_code = $runtimeReason
    runtime_capabilities_path = $runtimePath
    generated_at = if ($null -ne $facts -and $facts.PSObject.Properties.Name -contains 'generated_at') { $facts.generated_at } else { $null }
    generated_runtime_manifest = $manifest
    baseline_ready = if ($null -ne $runtimeSummary -and $runtimeSummary.PSObject.Properties.Name -contains 'baseline_ready') { $runtimeSummary.baseline_ready } else { $null }
    host_runtime_ready = if ($null -ne $runtimeSummary -and $runtimeSummary.PSObject.Properties.Name -contains 'host_runtime_ready') { $runtimeSummary.host_runtime_ready } else { $null }
    provider_readiness = if ($null -ne $facts -and $facts.PSObject.Properties.Name -contains 'provider_readiness') { @($facts.provider_readiness) } else { @() }
    configured_dependencies = if ($null -ne $facts -and $facts.PSObject.Properties.Name -contains 'configured_dependencies') { @($facts.configured_dependencies) } else { @() }
  }
}

function New-HealthItem {
  param(
    [object]$Helper,
    [bool]$Ready,
    [Nullable[bool]]$DependencyReady,
    [string]$InstallCommand,
    [string]$Url
  )

  $id = [string]$Helper.id
  $required = [bool]$Helper.required
  $baselineBlocking = Test-EffectiveBaselineBlocking -Helper $Helper
  $kind = [string]$Helper.kind
  $profile = Get-HelperProfile -Helper $Helper
  $result = if ($Ready) {
    'ready'
  } elseif ($id -eq 'agent-browser') {
    'skipped'
  } elseif ($id -eq 'ast-grep' -and (Test-CommandExists 'rg')) {
    'degraded'
  } elseif ($baselineBlocking) {
    'action-required'
  } else {
    'degraded'
  }
  $effectiveDependencyReady = if ($null -ne $DependencyReady) { [bool]$DependencyReady } else { [bool]$Ready }
  $dependencyStatus = if ($effectiveDependencyReady) { 'ready' } else { 'missing' }
  $nextAction = if ($Ready) {
    ''
  } elseif ($id -eq 'ast-grep' -and $result -eq 'degraded') {
    'ast-grep missing; falling back to rg'
  } elseif ($id -eq 'agent-browser') {
    $InstallCommand
  } else {
    $InstallCommand
  }
  $reasonCode = if ($result -eq 'ready') {
    'ready'
  } elseif ($result -eq 'skipped') {
    'optional-skipped'
  } elseif ($result -eq 'degraded') {
    'optional-capability-degraded'
  } else {
    'required-runtime-action-required'
  }
  return [ordered]@{
    id = $id
    kind = $kind
    profile = $profile
    required = $required
    baseline_blocking = $baselineBlocking
    dependency_status = $dependencyStatus
    host_config_status = 'not-applicable'
    project_status = 'not-applicable'
    configured_status = 'not-applicable'
    allowed = 'not-applicable'
    result = $result
    reason_code = $reasonCode
    next_action = $nextAction
    install_command = $InstallCommand
    url = $Url
  }
}

function Invoke-Git {
  param([string[]]$Arguments)
  if (-not (Test-CommandExists 'git')) { return $null }
  $output = @(& git @Arguments 2>$null)
  if ($LASTEXITCODE -ne 0) { return $null }
  return ($output -join "`n").Trim()
}

$platform = Get-PlatformName
$tools = @()
foreach ($helper in @($helperRegistry.helpers | Where-Object { $_.kind -eq 'cli' -or $_.kind -eq 'browser-helper' })) {
  $id = [string]$helper.id
  $installCommand = Get-InstallCommand -Name $id -Platform $platform
  if ($id -eq 'agent-browser') {
    $tools += New-HealthItem -Helper $helper -Ready (Test-AgentBrowserReady) -DependencyReady ([Nullable[bool]](Test-CommandExists 'agent-browser')) -InstallCommand $installCommand -Url (Get-ProjectUrl -Name $id)
  } elseif ($id -eq 'ast-grep') {
    $tools += New-HealthItem -Helper $helper -Ready (Test-CommandExists 'ast-grep') -DependencyReady ([Nullable[bool]](Test-CommandExists 'ast-grep')) -InstallCommand $installCommand -Url (Get-ProjectUrl -Name $id)
  } else {
    $tools += New-HealthItem -Helper $helper -Ready (Test-CommandExists $id) -DependencyReady $null -InstallCommand $installCommand -Url (Get-ProjectUrl -Name $id)
  }
}

$skills = @()
foreach ($helper in @($helperRegistry.helpers | Where-Object { $_.kind -eq 'global-skill' })) {
  $skillName = [string]$helper.detection.skill_name
  $skills += New-HealthItem -Helper $helper -Ready (Test-GlobalSkillInstalled -SkillName $skillName) -DependencyReady $null -InstallCommand (Get-InstallCommand -Name ([string]$helper.id) -Platform $platform) -Url (Get-ProjectUrl -Name ([string]$helper.id))
}

$repoRoot = Invoke-Git -Arguments @('rev-parse', '--show-toplevel')
$insideGitRepo = -not [string]::IsNullOrWhiteSpace($repoRoot)
$legacyMarkdown = 'skip'
$legacyConfig = 'skip'
$localConfig = 'skip'
$localConfigGitignore = 'skip'
$exampleConfig = 'skip'

if ($insideGitRepo) {
  $legacyMarkdown = if (Test-Path -LiteralPath (Join-Path $repoRoot 'compound-engineering.local.md') -PathType Leaf) { 'present' } else { 'missing' }
  $legacyConfig = 'retired'
  $localConfigPath = Join-Path $repoRoot '.spec-first/config.local.yaml'
  $localConfig = if (Test-Path -LiteralPath $localConfigPath -PathType Leaf) { 'ok' } else { 'missing' }
  if ($localConfig -eq 'ok' -and (Test-CommandExists 'git')) {
    & git check-ignore -q $localConfigPath 2>$null
    $localConfigGitignore = if ($LASTEXITCODE -eq 0) { 'ok' } else { 'missing' }
  }
  $template = Join-Path (Split-Path -Parent $PSScriptRoot) 'references/config-template.yaml'
  $example = Join-Path $repoRoot '.spec-first/config.local.example.yaml'
  if (-not (Test-Path -LiteralPath $example -PathType Leaf)) {
    $exampleConfig = 'missing'
  } elseif ((Test-Path -LiteralPath $template -PathType Leaf) -and ((Get-Content -Raw -LiteralPath $template) -ne (Get-Content -Raw -LiteralPath $example))) {
    $exampleConfig = 'outdated'
  } else {
    $exampleConfig = 'ok'
  }
}

$payload = [ordered]@{
  schema_version = 'spec-mcp-setup-preflight.v2'
  tools = $tools
  skills = $skills
  project = [ordered]@{
    inside_git_repo = $insideGitRepo
    local_config_status = $localConfig
    local_config_gitignore_status = $localConfigGitignore
    example_config_status = $exampleConfig
  }
  legacy = [ordered]@{
    legacy_markdown_status = $legacyMarkdown
    legacy_local_config_status = $legacyConfig
  }
}
$setupSnapshot = Get-SetupSnapshot -RepoRoot $(if ($insideGitRepo) { $repoRoot } else { '' })
$payload.runtime = $setupSnapshot
$payload.generated_runtime_manifest = $setupSnapshot.generated_runtime_manifest
$payload.provider_readiness = @($setupSnapshot.provider_readiness)
$payload.configured_dependencies = @($setupSnapshot.configured_dependencies)

if ($Json) {
  $payload | ConvertTo-Json -Depth 8
  exit 0
}

$readyTools = @($tools | Where-Object { $_.result -eq 'ready' }).Count
$readySkills = @($skills | Where-Object { $_.dependency_status -eq 'ready' }).Count

if (-not [string]::IsNullOrWhiteSpace($Version)) {
  Write-Host "Spec-First version v$Version"
}

Write-Host ''
Write-Host 'Stage 1: Diagnose'
$baselineReady = if ($null -eq $setupSnapshot.baseline_ready) { 'unknown' } else { ([string]$setupSnapshot.baseline_ready).ToLowerInvariant() }
$manifestStatus = if ($setupSnapshot.generated_runtime_manifest.PSObject.Properties.Name -contains 'status') { [string]$setupSnapshot.generated_runtime_manifest.status } else { 'unknown' }
$manifestReason = if ($setupSnapshot.generated_runtime_manifest.PSObject.Properties.Name -contains 'reason_code') { [string]$setupSnapshot.generated_runtime_manifest.reason_code } else { '' }
Write-Host "    Required MCP/runtime: baseline_ready=$baselineReady; run spec-mcp-setup --verify-only to refresh confirmed host/runtime facts"
Write-Host "    Generated runtime manifest: $manifestStatus$(if ([string]::IsNullOrWhiteSpace($manifestReason)) { '' } else { " ($manifestReason)" })"
Write-Host "    Helper tools: $readyTools/$($tools.Count) CLI capabilities ready; $readySkills/$($skills.Count) global skills ready"
if ($insideGitRepo) {
  $projectConfigSummary = 'ready'
  if ($exampleConfig -eq 'missing' -or $exampleConfig -eq 'outdated') {
    $projectConfigSummary = 'needs refresh'
  }
  if ($localConfigGitignore -eq 'missing' -or $legacyMarkdown -eq 'present') {
    $projectConfigSummary = 'action recommended'
  }
  Write-Host "    Project local config: $projectConfigSummary"
  Write-Host "    Optional providers: $(@($setupSnapshot.provider_readiness).Count) readiness fact(s); explicit setup only (spec-mcp-setup --only codegraph|graphify)"
  Write-Host "    Host configured dependencies: $(@($setupSnapshot.configured_dependencies).Count) fact(s)"
} else {
  Write-Host '    Project local config: not inside a git repository'
  Write-Host '    Optional providers: choose a target repo before provider setup'
}

Write-Host ''
Write-Host "Tool install status $readyTools/$($tools.Count)"
foreach ($tool in $tools) {
  $status = if ($tool.result -eq 'ready') {
    'installed'
  } elseif ($tool.result -eq 'skipped') {
    'skipped'
  } elseif ($tool.result -eq 'degraded') {
    'degraded'
  } else {
    'missing'
  }
  Write-Host ("  {0,-15} {1,-8} {2}" -f $tool.id, $(if ($tool.required) { 'yes' } else { 'no' }), $status)
  if ($status -ne 'installed' -and -not [string]::IsNullOrWhiteSpace($tool.next_action)) {
    Write-Host "    $($tool.next_action)"
  }
}

Write-Host ''
Write-Host "Skill install status $readySkills/$($skills.Count)"
foreach ($skill in $skills) {
  $status = if ($skill.result -eq 'ready') {
    'installed'
  } elseif ($skill.result -eq 'skipped') {
    'skipped'
  } elseif ($skill.result -eq 'degraded') {
    'degraded'
  } else {
    'missing'
  }
  Write-Host ("  {0,-15} {1,-8} {2}" -f $skill.id, $(if ($skill.required) { 'yes' } else { 'no' }), $status)
  if ($status -ne 'installed' -and -not [string]::IsNullOrWhiteSpace($skill.next_action)) {
    Write-Host "    $($skill.next_action)"
  }
}

Write-Host ''
$localConfigDisplay = if ($localConfig -eq 'missing') { 'optional-missing' } else { $localConfig }
Write-Host "Project local_config=$localConfigDisplay example_config=$exampleConfig gitignore=$localConfigGitignore"
if ($exampleConfig -eq 'missing' -or $exampleConfig -eq 'outdated') {
  $bootstrapScript = Join-Path $PSScriptRoot 'bootstrap-project-config.ps1'
  Write-Host "Project config next action: pwsh `"$bootstrapScript`" -Repo `"$repoRoot`" -RefreshExample"
}

Write-Host ''
Write-Host 'Next:'
if ($insideGitRepo) {
  if ($exampleConfig -eq 'missing' -or $exampleConfig -eq 'outdated' -or $localConfigGitignore -eq 'missing' -or $legacyMarkdown -eq 'present') {
    Write-Host '  1. spec-mcp-setup --project-config'
    Write-Host '  2. spec-mcp-setup --verify-only'
    Write-Host '  3. spec-mcp-setup --only graphify  # optional provider setup'
  } else {
    Write-Host '  1. spec-mcp-setup --verify-only'
    Write-Host '  2. Continue to the intended spec-* workflow'
    Write-Host '  3. spec-mcp-setup --only graphify  # optional provider setup'
  }
} else {
  Write-Host '  1. cd <git-repo> or run spec-mcp-setup --repo <path>'
  Write-Host '  2. spec-mcp-setup --verify-only'
}
