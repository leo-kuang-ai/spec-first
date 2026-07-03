param(
  [string]$Repo = '',
  [string]$Folder = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-toml.ps1')
. (Join-Path $ScriptDir 'lib-template.ps1')
$ToolsJson = Read-McpToolsJson -Path (Join-Path $SkillDir 'mcp-tools.json')
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson
$HostInfo = & (Join-Path $ScriptDir 'detect-host.ps1') | ConvertFrom-Json
$DetectedHost = $HostInfo.host
$ConfigPath = $HostInfo.config_path
$ConfigFormat = $HostInfo.config_format
$Platform = $HostInfo.platform
$SelectedScope = $HostInfo.selected_scope

$resolverParams = @{ Format = 'json' }
if (-not [string]::IsNullOrWhiteSpace($Repo)) { $resolverParams.Repo = $Repo }
if (-not [string]::IsNullOrWhiteSpace($Folder)) { $resolverParams.Folder = $Folder }
if (-not [string]::IsNullOrWhiteSpace($Repo) -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'detect-tools.ps1: use either -Repo or -Folder, not both'
}
$targetJson = & (Join-Path $ScriptDir 'resolve-project-target.ps1') @resolverParams
$TargetFacts = $targetJson | ConvertFrom-Json
$RepoRoot = if (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.target_root)) {
  [string]$TargetFacts.target_root
} elseif (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.selected_repo_root)) {
  [string]$TargetFacts.selected_repo_root
} elseif (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.selected_folder_root)) {
  [string]$TargetFacts.selected_folder_root
} else {
  [string]$TargetFacts.workspace_root
}
$RepoStatus = [string]$TargetFacts.repo_status

function Get-DependencyStatus {
  param([string]$Name)
  if (Get-Command $Name -ErrorAction SilentlyContinue) { 'ready' } else { 'missing' }
}

function Test-HostConfigRequired {
  param([object]$Tool)
  if ($null -ne $Tool.PSObject.Properties['host_config_required']) {
    return [bool]$Tool.host_config_required
  }
  return $true
}

function Test-JsonHostConfig {
  return $ConfigFormat -eq 'json'
}

function Get-ClaudeMcpServer {
  param(
    [object]$Config,
    [string]$Key
  )

  if ($null -eq $Config) { return $null }
  if ($null -eq $Config.PSObject.Properties['mcpServers']) { return $null }
  $servers = $Config.PSObject.Properties['mcpServers'].Value
  if ($null -eq $servers) { return $null }
  if ($null -eq $servers.PSObject.Properties[$Key]) { return $null }
  return $servers.PSObject.Properties[$Key].Value
}

function Compare-ArgsExact {
  param(
    [object[]]$Actual,
    [object[]]$Expected
  )
  if (@($Actual).Count -ne @($Expected).Count) { return $false }
  for ($i = 0; $i -lt @($Expected).Count; $i++) {
    if ([string]$Actual[$i] -ne [string]$Expected[$i]) { return $false }
  }
  return $true
}

function Normalize-NpmLatestArgument {
  param([object]$Arg)
  if ($Arg -is [string] -and $Arg.EndsWith('@latest', [System.StringComparison]::Ordinal)) {
    return $Arg.Substring(0, $Arg.Length - 7)
  }
  return $Arg
}

function Test-RegistryArgsDrift {
  param(
    [object[]]$Actual,
    [object[]]$Expected
  )
  if (Compare-ArgsExact -Actual $Actual -Expected $Expected) { return $false }
  $normalizedActual = @($Actual | ForEach-Object { Normalize-NpmLatestArgument -Arg $_ })
  $normalizedExpected = @($Expected | ForEach-Object { Normalize-NpmLatestArgument -Arg $_ })
  return (Compare-ArgsExact -Actual $normalizedActual -Expected $normalizedExpected)
}

function Get-HostConfigStatus {
  param([object]$Tool)
  if (-not (Test-HostConfigRequired -Tool $Tool)) { return 'not-required' }
  if ([string]::IsNullOrWhiteSpace($SelectedScope)) { return 'action-required' }

  $hostConfig = $Tool.host_config.$DetectedHost
  if ($DetectedHost -eq 'codex') {
    $selectedProperty = $HostInfo.targets.PSObject.Properties[$SelectedScope]
    $selectedPrecedence = if ($null -ne $selectedProperty) { [int](Get-ToolField -Tool $selectedProperty.Value -Name 'precedence') } else { 0 }
    foreach ($entry in $HostInfo.targets.PSObject.Properties) {
      if ($entry.Name -eq $SelectedScope) { continue }
      $target = $entry.Value
      if (-not [bool](Get-ToolField -Tool $target -Name 'exists')) { continue }
      if ([int](Get-ToolField -Tool $target -Name 'precedence') -le $selectedPrecedence) { continue }
      $path = [string](Get-ToolField -Tool $target -Name 'config_path')
      if ([string]::IsNullOrWhiteSpace($path) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
      $section = Get-TomlMcpSection -Path $path -Key $Tool.detection.key
      if ([string]::IsNullOrWhiteSpace($section)) { continue }
      if (Test-TomlMcpSectionExact -Path $path -Key $Tool.detection.key -Command $hostConfig.command -Args @(Expand-ToolArgs -Tool $Tool -Args $hostConfig.args)) {
        return 'ready'
      }
      if (Test-TomlMcpSectionRegistryArgsDrift -Path $path -Key $Tool.detection.key -Command $hostConfig.command -Args @(Expand-ToolArgs -Tool $Tool -Args $hostConfig.args)) {
        return 'registry-args-drift'
      }
      return 'precedence-blocked'
    }
  }

  if (-not (Test-Path $ConfigPath)) { return 'action-required' }

  switch ($Tool.detection.kind) {
    'host_config_exact' {
      if (Test-JsonHostConfig) {
        $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        $server = Get-ClaudeMcpServer -Config $config -Key $Tool.detection.key
        if ($null -eq $server) { return 'action-required' }
        if ($server.command -ne $hostConfig.command) { return 'action-required' }
        $serverArgs = @($server.args)
        $expectedArgs = @(Expand-ToolArgs -Tool $Tool -Args $hostConfig.args)
        if ($null -ne $server.PSObject.Properties['scope']) { return 'action-required' }
        if (-not (Compare-ArgsExact -Actual $serverArgs -Expected $expectedArgs)) {
          if (Test-RegistryArgsDrift -Actual $serverArgs -Expected $expectedArgs) { return 'registry-args-drift' }
          return 'action-required'
        }
        if ($DetectedHost -eq 'claude' -and $SelectedScope -ne 'managed') { return 'fallback-active' }
        return 'ready'
      }

      if (-not (Test-TomlMcpSectionExact -Path $ConfigPath -Key $Tool.detection.key -Command $hostConfig.command -Args @(Expand-ToolArgs -Tool $Tool -Args $hostConfig.args))) {
        if (Test-TomlMcpSectionRegistryArgsDrift -Path $ConfigPath -Key $Tool.detection.key -Command $hostConfig.command -Args @(Expand-ToolArgs -Tool $Tool -Args $hostConfig.args)) {
          return 'registry-args-drift'
        }
        return 'action-required'
      }
      return 'ready'
    }
    'host_config_key_only' {
      if (Test-JsonHostConfig) {
        $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        if ($null -eq (Get-ClaudeMcpServer -Config $config -Key $Tool.detection.key)) { return 'action-required' }
        if ($DetectedHost -eq 'claude' -and $SelectedScope -ne 'managed') { return 'fallback-active' }
        return 'ready'
      }
      if (-not [string]::IsNullOrWhiteSpace((Get-TomlMcpSection -Path $ConfigPath -Key $Tool.detection.key))) { return 'ready' }
      return 'action-required'
    }
    default { return 'action-required' }
  }
}

function Get-ProjectStatus {
  param([object]$Tool)
  if ($Tool.project_bootstrap.kind -eq 'none' -or -not $Tool.project_bootstrap.required) {
    return 'not-applicable'
  }
  if (-not [bool]$TargetFacts.state_write_allowed) {
    if (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.reason_code)) { return [string]$TargetFacts.reason_code }
    return 'workspace-target-required'
  }

  $projectFile = Join-Path $RepoRoot $Tool.project_bootstrap.project_file
  if (-not (Test-Path $projectFile)) { return 'pending' }
  return 'ready'
}

$tools = [ordered]@{}
$nextActions = New-Object System.Collections.Generic.List[string]

function Add-NextAction {
  param([string]$Action)
  if ([string]::IsNullOrWhiteSpace($Action)) { return }
  if (-not $nextActions.Contains($Action)) { $nextActions.Add($Action) }
}

foreach ($tool in @($ToolsJson.tools)) {
  $dependencyStatus = 'ready'
  foreach ($dep in @($tool.dependencies)) {
    $current = Get-DependencyStatus -Name $dep
    if ($current -ne 'ready') { $dependencyStatus = $current; break }
  }

  $hostConfigStatus = Get-HostConfigStatus -Tool $tool
  $isRequired = [bool]$tool.required
  $projectStatus = if ((-not $isRequired) -and $hostConfigStatus -eq 'action-required') {
    'not-applicable'
  } else {
    Get-ProjectStatus -Tool $tool
  }
  $hostConfigRequired = Test-HostConfigRequired -Tool $tool
  $hostReady = (
    $hostConfigStatus -eq 'ready' -or
    $hostConfigStatus -eq 'fallback-active' -or
    $hostConfigStatus -eq 'registry-args-drift' -or
    ((-not $hostConfigRequired) -and $hostConfigStatus -eq 'not-required')
  )
  $type = if ($null -ne $tool.category) { $tool.category } else { 'mcp' }
  $configured = ($hostConfigStatus -eq 'ready' -or $hostConfigStatus -eq 'fallback-active' -or $hostConfigStatus -eq 'registry-args-drift')
  $nextAction = ''

  if ((-not $isRequired) -and $hostConfigStatus -eq 'action-required') {
    $nextAction = ''
  } elseif ($dependencyStatus -ne 'ready') {
    $nextAction = 'install dependency'
  } elseif ($hostConfigStatus -eq 'action-required') {
    $nextAction = 'configure host'
  } elseif ($hostConfigStatus -eq 'precedence-blocked') {
    $nextAction = 'review higher-precedence host config'
  } elseif ($projectStatus -eq 'workspace-target-required' -or $projectStatus -like 'repo-target-*' -or $projectStatus -eq 'workspace-no-git-candidates') {
    $nextAction = [string]$TargetFacts.next_action
  } elseif ($projectStatus -eq 'pending') {
    $nextAction = 'bootstrap project'
  } elseif ($projectStatus -eq 'failed') {
    $nextAction = 'repair project bootstrap'
  }

  $result = 'ready'
  $reasonCode = 'ready'
  if ((-not $isRequired) -and $hostConfigStatus -eq 'action-required') {
    $result = 'action-required'
    $reasonCode = 'optional-capability-not-selected'
  } elseif ($dependencyStatus -ne 'ready') {
    $result = 'action-required'
    $reasonCode = 'missing_dependency'
  } elseif ($hostConfigStatus -eq 'registry-args-drift') {
    $result = 'degraded'
    $reasonCode = 'host-config-version-drift'
  } elseif ($hostConfigStatus -eq 'action-required') {
    $result = 'action-required'
    $reasonCode = 'host-config-action-required'
  } elseif ($hostConfigStatus -eq 'precedence-blocked') {
    $result = 'action-required'
    $reasonCode = 'host-config-precedence-blocked'
  } elseif ($projectStatus -eq 'pending') {
    $result = 'action-required'
    $reasonCode = 'project-bootstrap-pending'
  } elseif ($projectStatus -eq 'failed') {
    $result = 'action-required'
    $reasonCode = 'project-bootstrap-failed'
  }

  Add-NextAction $nextAction

  $toolFact = [ordered]@{
    required = $isRequired
    baseline_blocking = $isRequired
    type = $type
    host_config_required = [bool]$hostConfigRequired
    dependency_status = $dependencyStatus
    host_config_status = $hostConfigStatus
    project_status = $projectStatus
    selected_scope = $SelectedScope
    result = $result
    reason_code = $reasonCode
    next_action = $nextAction
    configured = [bool]$configured
  }

  $tools[$tool.id] = $toolFact
}

[pscustomobject]@{
  schema_version = 'tool-facts.v2'
  host = $DetectedHost
  platform = $Platform
  repo_root = $RepoRoot
  repo_status = $RepoStatus
  target_kind = $TargetFacts.target_kind
  target = $TargetFacts
  target_mode = $TargetFacts.mode
  workspace_root = $TargetFacts.workspace_root
  selected_repo_root = $TargetFacts.selected_repo_root
  selected_folder_root = $TargetFacts.selected_folder_root
  target_root = $TargetFacts.target_root
  git_health = if ($TargetFacts.PSObject.Properties.Name -contains 'git_health') { $TargetFacts.git_health } else { $null }
  coverage_gap = if ($TargetFacts.PSObject.Properties.Name -contains 'coverage_gap') { $TargetFacts.coverage_gap } else { $null }
  candidates_diagnostics = if ($TargetFacts.PSObject.Properties.Name -contains 'candidates_diagnostics') { @($TargetFacts.candidates_diagnostics) } else { @() }
  target_candidate_count = @($TargetFacts.candidates).Count
  target_candidates = @($TargetFacts.candidates)
  reason_code = $TargetFacts.reason_code
  tools = $tools
  next_actions = @($nextActions)
} | ConvertTo-Json -Depth 10 -Compress
