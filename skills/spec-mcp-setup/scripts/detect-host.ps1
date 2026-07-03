param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-template.ps1')

function ConvertFrom-JsonCompat {
  param(
    [string]$Json,
    [switch]$AsHashtable
  )
  if ($AsHashtable -and $PSVersionTable.PSVersion.Major -ge 6) {
    return $Json | ConvertFrom-Json -AsHashtable
  }
  return $Json | ConvertFrom-Json
}

function Get-PlatformName {
  $hasIsWindows = $null -ne (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue)
  $hasIsLinux = $null -ne (Get-Variable -Name IsLinux -ErrorAction SilentlyContinue)
  $hasIsMacOS = $null -ne (Get-Variable -Name IsMacOS -ErrorAction SilentlyContinue)
  if ($hasIsWindows) {
    if ($IsWindows) { return 'windows' }
    if ($IsMacOS) { return 'macos' }
    if ($IsLinux) { return 'linux' }
    return 'unknown'
  }
  switch ([System.Environment]::OSVersion.Platform) {
    ([System.PlatformID]::Win32NT) { return 'windows' }
    ([System.PlatformID]::Unix) { return 'linux' }
    ([System.PlatformID]::MacOSX) { return 'macos' }
  }
  return 'unknown'
}

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-MapValue {
  param(
    [object]$Object,
    [string]$Name,
    [object]$Default = $null
  )

  if ($null -eq $Object) { return $Default }
  if ($Object -is [System.Collections.IDictionary]) {
    foreach ($key in $Object.Keys) {
      if ([string]$key -eq $Name) {
        return $Object[$key]
      }
    }
    return $Default
  }

  $property = $Object.PSObject.Properties[$Name]
  if ($null -ne $property) {
    return $property.Value
  }
  return $Default
}

function ConvertTo-BoolValue {
  param([object]$Value)

  if ($null -eq $Value) { return $false }
  if ($Value -is [bool]) { return $Value }
  return ([string]$Value).Equals('true', [System.StringComparison]::OrdinalIgnoreCase)
}

$ToolsJson = Read-McpToolsJson -Path (Join-Path $SkillDir 'mcp-tools.json') -AsHashtable
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson

function Get-DetectedHost {
  if ($env:MCP_SETUP_HOST -in @('claude', 'codex', 'kiro')) {
    return $env:MCP_SETUP_HOST
  }

  if (-not [string]::IsNullOrEmpty($env:CODEX_CI) -or
      -not [string]::IsNullOrEmpty($env:CODEX_MANAGED_BY_NPM) -or
      -not [string]::IsNullOrEmpty($env:CODEX_THREAD_ID) -or
      -not [string]::IsNullOrEmpty($env:CODEX_SANDBOX)) {
    return 'codex'
  }

  if (-not [string]::IsNullOrEmpty($env:CLAUDE_CODE_SSE_PORT) -or
      -not [string]::IsNullOrEmpty($env:CLAUDE_CODE_SESSION_ID) -or
      -not [string]::IsNullOrEmpty($env:CLAUDE_PROJECT_DIR)) {
    return 'claude'
  }

  if ((Test-CommandExists 'codex') -and -not (Test-CommandExists 'claude')) {
    return 'codex'
  }

  if ((Test-CommandExists 'claude') -and -not (Test-CommandExists 'codex')) {
    return 'claude'
  }

  throw '错误：无法自动识别宿主。请显式设置 MCP_SETUP_HOST=claude、MCP_SETUP_HOST=codex 或 MCP_SETUP_HOST=kiro 后再运行。'
}

function Test-KiroUserScopeRequested {
  return @('1', 'true', 'TRUE', 'yes', 'YES', 'approved', 'APPROVED') -contains [string]$env:KIRO_USER_SCOPE
}

function Resolve-PathTemplate {
  param([string]$Template)
  if ($Template.StartsWith('$HOME')) {
    return $HOME + $Template.Substring(5)
  }
  return $Template
}

function Resolve-TargetPathOverride {
  param(
    [string]$HostName,
    [string]$TargetKey,
    [string]$ResolvedPath
  )

  if ($HostName -eq 'claude' -and $TargetKey -eq 'managed' -and -not [string]::IsNullOrWhiteSpace($env:MCP_SETUP_CLAUDE_MANAGED_PATH_OVERRIDE)) {
    return $env:MCP_SETUP_CLAUDE_MANAGED_PATH_OVERRIDE
  }
  if ($HostName -eq 'codex' -and $TargetKey -eq 'system' -and -not [string]::IsNullOrWhiteSpace($env:MCP_SETUP_CODEX_SYSTEM_PATH_OVERRIDE)) {
    return $env:MCP_SETUP_CODEX_SYSTEM_PATH_OVERRIDE
  }
  if ($HostName -eq 'kiro' -and $TargetKey -eq 'workspace' -and -not [string]::IsNullOrWhiteSpace($env:MCP_SETUP_KIRO_WORKSPACE_PATH_OVERRIDE)) {
    return $env:MCP_SETUP_KIRO_WORKSPACE_PATH_OVERRIDE
  }
  if ($HostName -eq 'kiro' -and $TargetKey -eq 'user' -and -not [string]::IsNullOrWhiteSpace($env:MCP_SETUP_KIRO_USER_PATH_OVERRIDE)) {
    return $env:MCP_SETUP_KIRO_USER_PATH_OVERRIDE
  }
  return $ResolvedPath
}

function Get-ExistingParent {
  param([string]$Path)
  $current = $Path
  while (-not [string]::IsNullOrWhiteSpace($current) -and -not (Test-Path $current)) {
    $next = Split-Path -Parent $current
    if ($next -eq $current) { break }
    $current = $next
  }
  return $current
}

function Test-TargetWritable {
  param(
    [string]$Path,
    [string]$CheckMode
  )

  if (Test-Path $Path) {
    try {
      $item = Get-Item $Path -ErrorAction Stop
      if (-not $item.PSIsContainer) {
        $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
        $stream.Dispose()
        return $true
      }
    } catch {
      if ($CheckMode -ne 'parent-or-file') { return $false }
    }
  }

  if ($CheckMode -eq 'file-only' -and -not (Test-Path $Path)) {
    return $false
  }

  $parent = Split-Path -Parent $Path
  $existingParent = Get-ExistingParent $parent
  if ([string]::IsNullOrWhiteSpace($existingParent) -or -not (Test-Path $existingParent)) {
    return $false
  }

  $probe = Join-Path $existingParent ('.write-test-' + [guid]::NewGuid().ToString('N'))
  try {
    [System.IO.File]::WriteAllText($probe, '')
    Remove-Item -Force $probe -ErrorAction SilentlyContinue
    return $true
  } catch {
    return $false
  }
}

function Get-HostContract {
  param([string]$HostName)
  $contracts = @($ToolsJson.tools | ForEach-Object {
    $hostConfig = Get-MapValue -Object $_ -Name 'host_config'
    $cfg = Get-MapValue -Object $hostConfig -Name $HostName
    [ordered]@{
      scope = Get-MapValue -Object $cfg -Name 'scope'
      targets = Get-MapValue -Object $cfg -Name 'targets'
      fallback_order = Get-MapValue -Object $cfg -Name 'fallback_order'
      uninstall_targets = Get-MapValue -Object $cfg -Name 'uninstall_targets'
    } | ConvertTo-Json -Depth 20 -Compress
  })
  $uniqueContracts = @($contracts | Select-Object -Unique)
  if ($uniqueContracts.Count -ne 1) {
    throw "错误：$HostName 宿主配置元数据在不同工具之间不一致，请先统一 mcp-tools.json"
  }
  return (ConvertFrom-JsonCompat -Json $uniqueContracts[0] -AsHashtable)
}

function Get-TargetFact {
  param(
    [System.Collections.IDictionary]$McpHostContract,
    [string]$Platform,
    [string]$TargetKey
  )

  $targets = Get-MapValue -Object $McpHostContract -Name 'targets'
  $target = Get-MapValue -Object $targets -Name $TargetKey
  $configPath = Get-MapValue -Object $target -Name 'config_path'
  $rawPath = if ($configPath -is [string]) { $configPath } else { Get-MapValue -Object $configPath -Name $Platform }
  $resolvedPath = Resolve-PathTemplate $rawPath
  $resolvedPath = Resolve-TargetPathOverride -HostName $detectedHost -TargetKey $TargetKey -ResolvedPath $resolvedPath
  $exists = Test-Path $resolvedPath
  $writableCheck = Get-MapValue -Object $target -Name 'writable_check' -Default 'parent-or-file'
  $writable = Test-TargetWritable -Path $resolvedPath -CheckMode $writableCheck

  return [ordered]@{
    key = $TargetKey
    config_path = $resolvedPath
    config_format = Get-MapValue -Object $target -Name 'config_format'
    precedence = [int](Get-MapValue -Object $target -Name 'precedence' -Default 0)
    writable_check = $writableCheck
    exists = [bool]$exists
    writable = [bool]$writable
  }
}

$detectedHost = Get-DetectedHost
$platform = Get-PlatformName

switch ($detectedHost) {
  'claude' {
    $cliCommand = 'claude'
    $displayName = 'Claude Code'
    $markerPath = [System.IO.Path]::Combine($HOME, '.claude', 'spec-first', 'host-setup.json')
    $configFormat = 'json'
  }
  'codex' {
    $cliCommand = 'codex'
    $displayName = 'Codex'
    $markerPath = [System.IO.Path]::Combine($HOME, '.codex', 'spec-first', 'host-setup.json')
    $configFormat = 'toml'
  }
  'kiro' {
    $cliCommand = 'kiro'
    $displayName = 'Kiro'
    $markerPath = [System.IO.Path]::Combine($HOME, '.kiro', 'spec-first', 'host-setup.json')
    $configFormat = 'json'
  }
  default {
    throw "错误：无法识别宿主：$detectedHost"
  }
}

$mcpHostContract = Get-HostContract $detectedHost
$primaryScope = Get-MapValue -Object $mcpHostContract -Name 'scope'
$fallbackOrder = @(Get-MapValue -Object $mcpHostContract -Name 'fallback_order')
$uninstallTargets = @(Get-MapValue -Object $mcpHostContract -Name 'uninstall_targets')
if ($detectedHost -eq 'kiro' -and (Test-KiroUserScopeRequested)) {
  $primaryScope = 'user'
  $fallbackOrder = @('user')
}
$targets = [ordered]@{}
$contractTargets = Get-MapValue -Object $mcpHostContract -Name 'targets'
if ($null -ne $contractTargets) {
  $targetKeys = if ($contractTargets -is [System.Collections.IDictionary]) { @($contractTargets.Keys) } else { @($contractTargets.PSObject.Properties.Name) }
  foreach ($targetKey in $targetKeys) {
    $targets[$targetKey] = Get-TargetFact -McpHostContract $mcpHostContract -Platform $platform -TargetKey $targetKey
  }
}

$selectedScope = ''
$selectedTarget = $null
foreach ($scopeKey in $fallbackOrder) {
  $candidate = $targets[$scopeKey]
  if ($null -ne $candidate -and (ConvertTo-BoolValue -Value (Get-MapValue -Object $candidate -Name 'writable'))) {
    $selectedScope = $scopeKey
    $selectedTarget = $candidate
    break
  }
}
if ([string]::IsNullOrWhiteSpace($selectedScope) -and $fallbackOrder.Count -gt 0) {
  $selectedScope = $fallbackOrder[0]
  $selectedTarget = $targets[$selectedScope]
}

$precedenceBlocked = $false
$precedenceBlockingScope = ''
$precedenceBlockingPath = ''
$higherPrecedenceTargets = New-Object System.Collections.Generic.List[object]
if ($detectedHost -eq 'codex' -and $null -ne $selectedTarget) {
  foreach ($entry in $targets.GetEnumerator()) {
    if ($entry.Key -eq $selectedScope) { continue }
    $entryExists = ConvertTo-BoolValue -Value (Get-MapValue -Object $entry.Value -Name 'exists')
    $entryPrecedence = [int](Get-MapValue -Object $entry.Value -Name 'precedence' -Default 0)
    $selectedPrecedence = [int](Get-MapValue -Object $selectedTarget -Name 'precedence' -Default 0)
    if ($entryExists -and $entryPrecedence -gt $selectedPrecedence) {
      $higherPrecedenceTargets.Add([ordered]@{
        key = $entry.Key
        config_path = Get-MapValue -Object $entry.Value -Name 'config_path'
        precedence = $entryPrecedence
      })
    }
  }
}

if ($higherPrecedenceTargets.Count -gt 0) {
  $precedenceBlocked = $true
  $precedenceBlockingScope = $higherPrecedenceTargets[0].key
  $precedenceBlockingPath = $higherPrecedenceTargets[0].config_path
}

$selectedConfigPath = if ($null -ne $selectedTarget) { [string](Get-MapValue -Object $selectedTarget -Name 'config_path' -Default '') } else { '' }
$selectedWritable = if ($null -ne $selectedTarget) { ConvertTo-BoolValue -Value (Get-MapValue -Object $selectedTarget -Name 'writable') } else { $false }
$selectedExists = if ($null -ne $selectedTarget) { ConvertTo-BoolValue -Value (Get-MapValue -Object $selectedTarget -Name 'exists') } else { $false }

[pscustomobject]@{
  host = $detectedHost
  display_name = $displayName
  cli_command = $cliCommand
  config_path = $selectedConfigPath
  marker_path = $markerPath
  config_format = $configFormat
  platform = $platform
  primary_scope = $primaryScope
  selected_scope = $selectedScope
  selected_writable = $selectedWritable
  selected_exists = $selectedExists
  fallback_order = @($fallbackOrder)
  uninstall_targets = @($uninstallTargets)
  targets = $targets
  precedence_blocked = [bool]$precedenceBlocked
  precedence_blocking_scope = $precedenceBlockingScope
  precedence_blocking_path = $precedenceBlockingPath
  higher_precedence_targets = @($higherPrecedenceTargets.ToArray())
} | ConvertTo-Json -Depth 8 -Compress
