param(
  [string]$Tool,
  [switch]$UserScope
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($Tool)) {
  throw '缺少 -Tool 参数'
}
if ($UserScope) {
  $env:KIRO_USER_SCOPE = '1'
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-toml.ps1')
. (Join-Path $ScriptDir 'lib-template.ps1')
$ToolsJson = Read-McpToolsJson -Path (Join-Path $SkillDir 'mcp-tools.json')
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson
$HostInfo = & (Join-Path $ScriptDir 'detect-host.ps1') | ConvertFrom-Json
$DetectedHost = $HostInfo.host
$SelectedScope = $HostInfo.selected_scope
$ConfigPath = $HostInfo.config_path
$ConfigFormat = $HostInfo.config_format
$ToolDef = @($ToolsJson.tools | Where-Object { $_.id -eq $Tool })[0]
if ($null -eq $ToolDef) {
  throw "未知工具: $Tool"
}
if ([string]::IsNullOrWhiteSpace($SelectedScope)) {
  throw '未找到可用宿主配置目标'
}
$HostConfig = $ToolDef.host_config.$DetectedHost
if ($null -eq $HostConfig) {
  throw "未找到 $Tool 的 host_config.$DetectedHost"
}

$resolvedArgs = @(Expand-ToolArgs -Tool $ToolDef -Args $HostConfig.args)
$ResolvedConfig = [ordered]@{ command = $HostConfig.command; args = $resolvedArgs }
if ($null -ne $HostConfig.PSObject.Properties['startup_timeout_sec']) {
  $ResolvedConfig['startup_timeout_sec'] = [int]$HostConfig.startup_timeout_sec
}
$FallbackApplied = ($DetectedHost -eq 'claude' -and $SelectedScope -ne 'managed')

function Test-JsonHostConfig {
  return $ConfigFormat -eq 'json'
}

function Get-CodexHigherPrecedenceStatus {
  if ($DetectedHost -ne 'codex') {
    return [pscustomobject]@{ status = 'none'; scope = ''; path = '' }
  }

  $selectedProperty = $HostInfo.targets.PSObject.Properties[$SelectedScope]
  $selectedPrecedence = if ($null -ne $selectedProperty) { [int](Get-ToolField -Tool $selectedProperty.Value -Name 'precedence') } else { 0 }
  foreach ($entry in $HostInfo.targets.PSObject.Properties) {
    if ($entry.Name -eq $SelectedScope) { continue }
    $target = $entry.Value
    if (-not [bool](Get-ToolField -Tool $target -Name 'exists')) { continue }
    if ([int](Get-ToolField -Tool $target -Name 'precedence') -le $selectedPrecedence) { continue }
    $path = [string](Get-ToolField -Tool $target -Name 'config_path')
    if ([string]::IsNullOrWhiteSpace($path) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
    $section = Get-TomlMcpSection -Path $path -Key $ToolDef.detection.key
    if ([string]::IsNullOrWhiteSpace($section)) { continue }
    if (Test-TomlMcpSectionExact -Path $path -Key $ToolDef.detection.key -Command $ResolvedConfig.command -Args @($ResolvedConfig.args)) {
      return [pscustomobject]@{ status = 'ready'; scope = $entry.Name; path = $path }
    }
    return [pscustomobject]@{ status = 'blocked'; scope = $entry.Name; path = $path }
  }

  [pscustomobject]@{ status = 'none'; scope = ''; path = '' }
}

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

function Test-ToolConfigured {
  if (-not (Test-Path $ConfigPath)) { return $false }
  switch ($ToolDef.detection.kind) {
    'host_config_exact' {
      if (Test-JsonHostConfig) {
        $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        $server = Get-ClaudeMcpServer -Config $config -Key $ToolDef.detection.key
        if ($null -eq $server) { return $false }
        if ($server.command -ne $ResolvedConfig.command) { return $false }
        $serverArgs = @($server.args)
        $expectedArgs = @($ResolvedConfig.args)
        if ($serverArgs.Count -ne $expectedArgs.Count) { return $false }
        for ($i = 0; $i -lt $expectedArgs.Count; $i++) {
          if ($serverArgs[$i] -ne $expectedArgs[$i]) { return $false }
        }
        if ($null -ne $server.PSObject.Properties['scope']) { return $false }
        return $true
      }
      return (Test-TomlMcpSectionExact -Path $ConfigPath -Key $ToolDef.detection.key -Command $ResolvedConfig.command -Args @($ResolvedConfig.args))
    }
    'host_config_key_only' {
      if (Test-JsonHostConfig) {
        $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        return $null -ne (Get-ClaudeMcpServer -Config $config -Key $ToolDef.detection.key)
      }
      return -not [string]::IsNullOrWhiteSpace((Get-TomlMcpSection -Path $ConfigPath -Key $ToolDef.detection.key))
    }
    default { return $false }
  }
}

function Test-OverwriteApproved {
  return @('approved', 'yes', 'true', '1') -contains ([string]$env:SPEC_FIRST_MCP_CONFIGURE_OVERWRITE).ToLowerInvariant()
}

function Test-SelectedConfigConflicts {
  if ($ToolDef.detection.kind -ne 'host_config_exact') { return $false }
  if (-not (Test-Path $ConfigPath)) { return $false }
  if (Test-JsonHostConfig) {
    $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
    $server = Get-ClaudeMcpServer -Config $config -Key $ToolDef.detection.key
    if ($null -eq $server) { return $false }
    if ($server.command -ne $ResolvedConfig.command) { return $true }
    $serverArgs = @($server.args)
    $expectedArgs = @($ResolvedConfig.args)
    if ($serverArgs.Count -ne $expectedArgs.Count) { return $true }
    for ($i = 0; $i -lt $expectedArgs.Count; $i++) {
      if ($serverArgs[$i] -ne $expectedArgs[$i]) { return $true }
    }
    return ($null -ne $server.PSObject.Properties['scope'])
  }
  $section = Get-TomlMcpSection -Path $ConfigPath -Key $ToolDef.detection.key
  if ([string]::IsNullOrWhiteSpace($section)) { return $false }
  return -not (Test-TomlMcpSectionExact -Path $ConfigPath -Key $ToolDef.detection.key -Command $ResolvedConfig.command -Args @($ResolvedConfig.args))
}

function Write-JsonMcpConfig {
  param([System.Collections.IDictionary]$FinalConfig)

  $config = if (Test-Path $ConfigPath) {
    $parsed = ConvertFrom-JsonCompat -Json (Get-Content -Raw $ConfigPath) -AsHashtable
    ConvertTo-MutableHashtable -Object $parsed
  } else {
    @{}
  }
  if (-not $config.Contains('mcpServers')) { $config['mcpServers'] = @{} }
  $config['mcpServers'][$ToolDef.detection.key] = $FinalConfig
  Set-TextFileAtomic -Path $ConfigPath -Value ($config | ConvertTo-Json -Depth 8)
}

function Assert-NoLiteralSecretValues {
  if ($DetectedHost -ne 'kiro') { return }
  if (-not (Test-Path $ConfigPath)) { return }
  $raw = Get-Content -Raw $ConfigPath
  $parsed = ConvertFrom-JsonCompat -Json $raw -AsHashtable
  $stack = New-Object System.Collections.Stack
  $stack.Push($parsed)
  while ($stack.Count -gt 0) {
    $current = $stack.Pop()
    if ($current -is [System.Collections.IDictionary]) {
      foreach ($key in $current.Keys) {
        $value = $current[$key]
        if ([string]$key -match '(?i)(token|secret|api[_-]?key|password)' -and $value -is [string] -and $value -notmatch '^\$\{[A-Za-z_][A-Za-z0-9_]*\}$') {
          throw 'Kiro config contains a literal secret-like value; use an env var reference such as ${TOKEN_NAME}'
        }
        if (($value -is [System.Collections.IDictionary]) -or ($value -is [pscustomobject]) -or ($value -is [System.Collections.IEnumerable] -and -not ($value -is [string]))) {
          $stack.Push($value)
        }
      }
    } elseif ($current -is [pscustomobject]) {
      foreach ($property in $current.PSObject.Properties) {
        $value = $property.Value
        if ([string]$property.Name -match '(?i)(token|secret|api[_-]?key|password)' -and $value -is [string] -and $value -notmatch '^\$\{[A-Za-z_][A-Za-z0-9_]*\}$') {
          throw 'Kiro config contains a literal secret-like value; use an env var reference such as ${TOKEN_NAME}'
        }
        if (($value -is [System.Collections.IDictionary]) -or ($value -is [pscustomobject]) -or ($value -is [System.Collections.IEnumerable] -and -not ($value -is [string]))) {
          $stack.Push($value)
        }
      }
    } elseif ($current -is [System.Collections.IEnumerable] -and -not ($current -is [string])) {
      foreach ($item in $current) {
        if (($item -is [System.Collections.IDictionary]) -or ($item -is [pscustomobject]) -or ($item -is [System.Collections.IEnumerable] -and -not ($item -is [string]))) {
          $stack.Push($item)
        }
      }
    }
  }
}

function Write-CodexConfig {
  param([System.Collections.IDictionary]$FinalConfig)
  $command = $FinalConfig.command
  $argsJson = @($FinalConfig.args) | ConvertTo-Json -Compress
  $timeoutLine = if ($FinalConfig.Contains('startup_timeout_sec')) { "`nstartup_timeout_sec = $($FinalConfig.startup_timeout_sec)" } else { '' }
  $sectionBody = "command = `"$command`"`nargs = $argsJson$timeoutLine"
  Write-TomlMcpSection -Path $ConfigPath -Key $ToolDef.detection.key -Body $sectionBody
}

function Restore-Backup {
  param([string]$BackupPath)
  if ([string]::IsNullOrWhiteSpace($BackupPath)) { return }
  if ($BackupPath -eq '__missing__') {
    if (Test-Path $ConfigPath) { Remove-Item -Force $ConfigPath }
    return
  }
  if (Test-Path $BackupPath) {
    Move-Item -Force $BackupPath $ConfigPath
  }
}

function Acquire-ConfigLock {
  $LockPath = "$ConfigPath.lock"
  $lockDir = Split-Path -Parent $LockPath
  if (-not (Test-Path $lockDir)) {
    New-Item -ItemType Directory -Force -Path $lockDir | Out-Null
  }

  $deadline = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $deadline) {
    try {
      return [System.IO.File]::Open($LockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }
  throw "无法获取配置锁: $LockPath"
}

function Release-ConfigLock {
  param($LockHandle)
  if ($null -ne $LockHandle) {
    $LockHandle.Dispose()
  }
}

$ConfigDir = Split-Path -Parent $ConfigPath
if (-not (Test-Path $ConfigDir)) {
  New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
}

$ConfigLock = $null
try {
  $ConfigLock = Acquire-ConfigLock

  $higherPrecedenceStatus = Get-CodexHigherPrecedenceStatus
  if ($higherPrecedenceStatus.status -eq 'ready') {
    [pscustomobject]@{
      tool_id = $Tool
      configured_path = $higherPrecedenceStatus.path
      selected_scope = $higherPrecedenceStatus.scope
      fallback_applied = [bool]$false
    } | ConvertTo-Json -Compress
    return
  }
  if ($higherPrecedenceStatus.status -eq 'blocked') {
    throw "$Tool 被更高优先级 Codex MCP 配置覆盖：$($higherPrecedenceStatus.scope) ($($higherPrecedenceStatus.path))"
  }

  if (Test-ToolConfigured) {
    [pscustomobject]@{
      tool_id = $Tool
      configured_path = $ConfigPath
      selected_scope = $SelectedScope
      fallback_applied = [bool]$FallbackApplied
    } | ConvertTo-Json -Compress
    return
  }

  if (-not [bool]$ToolDef.required -and (Test-SelectedConfigConflicts) -and -not (Test-OverwriteApproved)) {
    throw "$Tool 已存在同名但不同 command/args 的宿主 MCP 配置；如需覆盖，请设置 SPEC_FIRST_MCP_CONFIGURE_OVERWRITE=approved 后重跑"
  }

  $backupPath = if (Test-Path $ConfigPath) {
    $path = '{0}.backup.{1}' -f $ConfigPath, ([guid]::NewGuid().ToString('N'))
    Copy-Item $ConfigPath $path
    $path
  } else {
    '__missing__'
  }

  try {
    if ($DetectedHost -eq 'claude') {
      Write-JsonMcpConfig -FinalConfig $ResolvedConfig
    } elseif ($DetectedHost -eq 'codex') {
      Write-CodexConfig -FinalConfig $ResolvedConfig
    } elseif ($DetectedHost -eq 'kiro') {
      Write-JsonMcpConfig -FinalConfig $ResolvedConfig
      Assert-NoLiteralSecretValues
    } else {
      throw "无法识别宿主：$DetectedHost"
    }

    if (-not (Test-ToolConfigured)) {
      throw "$Tool 配置后仍未检测到有效宿主配置"
    }

    if ($backupPath -ne '__missing__' -and (Test-Path $backupPath)) {
      Remove-Item -Force $backupPath
    }

    [pscustomobject]@{
      tool_id = $Tool
      configured_path = $ConfigPath
      selected_scope = $SelectedScope
      fallback_applied = [bool]$FallbackApplied
    } | ConvertTo-Json -Compress
  } catch {
    Restore-Backup -BackupPath $backupPath
    throw
  }
} finally {
  Release-ConfigLock -LockHandle $ConfigLock
}
