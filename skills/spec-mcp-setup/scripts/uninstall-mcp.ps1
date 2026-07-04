param(
  [string]$Tool,
  [switch]$UserScope
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-toml.ps1')
. (Join-Path $ScriptDir 'lib-template.ps1')
if ($UserScope) {
  $env:KIRO_USER_SCOPE = '1'
  $env:QODER_USER_SCOPE = '1'
}
$UserScopeValues = @('1', 'true', 'TRUE', 'yes', 'YES', 'approved', 'APPROVED')

function Test-HostUserScopeRequested {
  param([string]$HostName)
  if ($UserScope) { return $true }
  if ($HostName -eq 'kiro') {
    return $UserScopeValues -contains [string]$env:KIRO_USER_SCOPE
  }
  if ($HostName -eq 'qoder') {
    return $UserScopeValues -contains [string]$env:QODER_USER_SCOPE
  }
  return $false
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

$ToolsJson = Read-McpToolsJson -Path (Join-Path $SkillDir 'mcp-tools.json') -AsHashtable
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson
$HostInfo = & (Join-Path $ScriptDir 'detect-host.ps1') | ConvertFrom-Json
$DetectedHost = $HostInfo.host
$Platform = $HostInfo.platform
$HostUserScopeRequested = Test-HostUserScopeRequested -HostName $DetectedHost

function Resolve-PathTemplate {
  param([string]$Template)
  if ($Template.StartsWith('$HOME')) {
    return $HOME + $Template.Substring(5)
  }
  return $Template
}

function Remove-ClaudeEntry {
  param([string]$ConfigPath, [string]$ToolId)
  if (-not (Test-Path $ConfigPath)) { return }
  $backupPath = '{0}.backup.{1}' -f $ConfigPath, ([guid]::NewGuid().ToString('N'))
  Copy-Item -LiteralPath $ConfigPath -Destination $backupPath -Force
  try {
    $parsed = ConvertFrom-JsonCompat -Json (Get-Content -Raw $ConfigPath) -AsHashtable
    $config = ConvertTo-MutableHashtable -Object $parsed
    if ($config.Contains('mcpServers')) {
      $null = $config['mcpServers'].Remove($ToolId)
    }
    Set-TextFileAtomic -Path $ConfigPath -Value ($config | ConvertTo-Json -Depth 8)
    Remove-Item -Force $backupPath -ErrorAction SilentlyContinue
  } catch {
    Copy-Item -LiteralPath $backupPath -Destination $ConfigPath -Force
    Remove-Item -Force $backupPath -ErrorAction SilentlyContinue
    throw
  }
}

function Remove-CodexEntry {
  param([string]$ConfigPath, [string]$DetectKey)
  if (-not (Test-Path $ConfigPath)) { return }
  $backupPath = '{0}.backup.{1}' -f $ConfigPath, ([guid]::NewGuid().ToString('N'))
  Copy-Item -LiteralPath $ConfigPath -Destination $backupPath -Force
  try {
    $text = Get-Content -Raw $ConfigPath
    $text = Remove-TomlMcpSection -Text $text -Key $DetectKey
    Set-TextFileAtomic -Path $ConfigPath -Value ($(if ($text) { $text + "`n" } else { '' }))
    Remove-Item -Force $backupPath -ErrorAction SilentlyContinue
  } catch {
    Copy-Item -LiteralPath $backupPath -Destination $ConfigPath -Force
    Remove-Item -Force $backupPath -ErrorAction SilentlyContinue
    throw
  }
}

function Remove-JsonMcpEntry {
  param([string]$ConfigPath, [string]$ToolId)
  Remove-ClaudeEntry -ConfigPath $ConfigPath -ToolId $ToolId
}

$toolIds = if ([string]::IsNullOrWhiteSpace($Tool)) {
  @($ToolsJson.tools | ForEach-Object { $_.id })
} else {
  $requestedTool = @($ToolsJson.tools | Where-Object { $_.id -eq $Tool })[0]
  if ($null -eq $requestedTool) {
    Write-Error "错误：未找到 $Tool 的工具定义"
    exit 1
  }
  @($Tool)
}

foreach ($toolId in $toolIds) {
  $toolDef = @($ToolsJson.tools | Where-Object { $_.id -eq $toolId })[0]
  if ($null -eq $toolDef) { continue }
  $detectKey = $toolDef.detection.key
  foreach ($targetKey in @($toolDef.host_config[$DetectedHost].uninstall_targets)) {
    if (($DetectedHost -eq 'kiro' -or $DetectedHost -eq 'qoder') -and $targetKey -eq 'user' -and -not $HostUserScopeRequested) { continue }
    $target = $toolDef.host_config[$DetectedHost].targets[$targetKey]
    $configPathValue = Get-ToolField -Tool $target -Name 'config_path'
    $rawPath = if ($configPathValue -is [string]) { [string]$configPathValue } else { [string](Get-ToolField -Tool $configPathValue -Name $Platform) }
    if ([string]::IsNullOrWhiteSpace($rawPath)) { continue }
    $hostTarget = $HostInfo.targets.PSObject.Properties[$targetKey]
    $configPath = if ($null -ne $hostTarget -and -not [string]::IsNullOrWhiteSpace([string]$hostTarget.Value.config_path)) {
      [string]$hostTarget.Value.config_path
    } else {
      Resolve-PathTemplate $rawPath
    }
    if ($DetectedHost -eq 'claude') {
      Remove-ClaudeEntry -ConfigPath $configPath -ToolId $detectKey
    } elseif ($DetectedHost -eq 'kiro' -or $DetectedHost -eq 'qoder') {
      Remove-JsonMcpEntry -ConfigPath $configPath -ToolId $detectKey
    } elseif ($DetectedHost -eq 'codex') {
      Remove-CodexEntry -ConfigPath $configPath -DetectKey $detectKey
    } else {
      throw "错误：无法识别宿主：$DetectedHost"
    }
  }
}

$refreshStatus = 'ready'
try {
  & (Join-Path $ScriptDir 'verify-tools.ps1') *> $null
  if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) {
    $refreshStatus = 'failed'
  }
} catch {
  $refreshStatus = 'failed'
}

[pscustomobject]@{
  host = $DetectedHost
  platform = $Platform
  removed_tools = @($toolIds)
  readiness_refresh = $refreshStatus
} | ConvertTo-Json -Compress
