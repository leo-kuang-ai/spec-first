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
  $env:QODER_USER_SCOPE = '1'
  $env:CURSOR_USER_SCOPE = '1'
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-template.ps1')
$ToolsJson = Read-McpToolsJson -Path (Join-Path $SkillDir 'mcp-tools.json')
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson
$ToolDef = @($ToolsJson.tools | Where-Object { $_.id -eq $Tool })[0]
if ($null -eq $ToolDef) {
  throw "未知工具: $Tool"
}

foreach ($dep in @($ToolDef.dependencies)) {
  if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
    throw "repair_failed:missing_dependency:$dep"
  }
}

& (Join-Path $ScriptDir 'configure-host.ps1') -Tool $Tool -UserScope:$UserScope
