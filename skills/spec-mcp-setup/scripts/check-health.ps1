param(
  [string]$Version = '',
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$browserHelperOptInAction = 'set SPEC_FIRST_BROWSER_HELPER_REQUIRED=1 and rerun the host setup workflow (`$spec-mcp-setup` or `/spec:mcp-setup`)'
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

  # agent-browser 在 check-health 视角是 opt-in 提示;jq/windows 是 native PowerShell 路径
  # 的有意提示(install-helpers.ps1 无此差异)。这两处保留本脚本自有语义;其余 helper
  # 委派到 lib-helper-registry.ps1 的共享展示生成器,消除与 install-helpers.ps1 的双份维护漂移。
  if ($Name -eq 'agent-browser') {
    return $browserHelperOptInAction
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
    [System.IO.Path]::Combine($HOME, '.kiro', 'skills', $SkillName, 'SKILL.md')
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
    $browserHelperOptInAction
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
  $legacyConfig = if (Test-Path -LiteralPath (Join-Path $repoRoot '.compound-engineering/config.local.yaml') -PathType Leaf) { 'present' } else { 'missing' }
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
    compound_engineering_markdown_status = $legacyMarkdown
    compound_engineering_config_status = $legacyConfig
  }
}

if ($Json) {
  $payload | ConvertTo-Json -Depth 8
  exit 0
}

if (-not [string]::IsNullOrWhiteSpace($Version)) {
  Write-Host "Spec-First version v$Version"
}

$readyTools = @($tools | Where-Object { $_.dependency_status -eq 'ready' }).Count
Write-Host ''
Write-Host "Tool install status $readyTools/$($tools.Count)"
foreach ($tool in $tools) {
  $status = if ($tool.dependency_status -eq 'ready') { 'installed' } else { 'missing' }
  Write-Host ("  {0,-15} {1,-8} {2}" -f $tool.id, $(if ($tool.required) { 'yes' } else { 'no' }), $status)
  if ($status -eq 'missing' -and -not [string]::IsNullOrWhiteSpace($tool.next_action)) {
    Write-Host "    $($tool.next_action)"
  }
}

$readySkills = @($skills | Where-Object { $_.dependency_status -eq 'ready' }).Count
Write-Host ''
Write-Host "Skill install status $readySkills/$($skills.Count)"
foreach ($skill in $skills) {
  $status = if ($skill.dependency_status -eq 'ready') { 'installed' } else { 'missing' }
  Write-Host ("  {0,-15} {1,-8} {2}" -f $skill.id, $(if ($skill.required) { 'yes' } else { 'no' }), $status)
  if ($status -eq 'missing' -and -not [string]::IsNullOrWhiteSpace($skill.next_action)) {
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
