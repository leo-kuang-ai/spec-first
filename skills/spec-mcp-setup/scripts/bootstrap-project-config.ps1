#!/usr/bin/env pwsh
# bootstrap-project-config.ps1 - Apply explicit project-local setup actions.

param(
  [switch]$RefreshExample,
  [switch]$CreateLocal,
  [switch]$EnsureGitignore,
  [switch]$DeleteLegacyMarkdown,
  [string]$Repo = '',
  [string]$Folder = '',
  [switch]$AllRepos,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
if (-not [string]::IsNullOrWhiteSpace($Repo) -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'bootstrap-project-config.ps1: use either -Repo or -Folder, not both'
}
if ($AllRepos -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'bootstrap-project-config.ps1: use either -AllRepos or -Folder, not both'
}

function Write-Result {
  param(
    [string]$OverallStatus,
    [string]$Reason,
    [string]$RepoRoot,
    [string]$ExampleStatus,
    [string]$LocalStatus,
    [string]$GitignoreStatus,
    [string]$LegacyMarkdownStatus,
    [string]$LegacyConfigStatus
  )

  $payload = [ordered]@{
    schema_version = 'project-config-bootstrap.v1'
    overall_status = $OverallStatus
    reason = $Reason
    repo_root = $RepoRoot
    target_kind = if ($script:targetKind) { $script:targetKind } else { '' }
    project = [ordered]@{
      example_config_status = $ExampleStatus
      local_config_status = $LocalStatus
      local_config_gitignore_status = $GitignoreStatus
    }
    legacy = [ordered]@{
      legacy_markdown_status = $LegacyMarkdownStatus
      legacy_local_config_status = $LegacyConfigStatus
    }
  }

  if ($Json) {
    $payload | ConvertTo-Json -Compress
  } else {
    Write-Output "Project config bootstrap complete."
    Write-Output "  example_config: $ExampleStatus"
    Write-Output "  local_config: $LocalStatus"
    Write-Output "  local_config_gitignore: $GitignoreStatus"
    Write-Output "  legacy_markdown: $LegacyMarkdownStatus"
    Write-Output "  legacy_config: $LegacyConfigStatus"
  }
}

function Write-JsonFileAtomic {
  param(
    [string]$Path,
    [object]$Payload,
    [int]$Depth = 30
  )
  function Test-SymlinkPath {
    param([string]$CandidatePath)
    if ([string]::IsNullOrWhiteSpace($CandidatePath)) { return $false }
    $item = Get-Item -LiteralPath $CandidatePath -Force -ErrorAction SilentlyContinue
    return ($null -ne $item -and (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0))
  }
  $dir = Split-Path -Parent $Path
  $specDir = Split-Path -Parent $dir
  if ((Split-Path -Leaf $dir) -ne 'workspace' -or (Split-Path -Leaf $specDir) -ne '.spec-first') {
    throw 'workspace-summary-path-outside-contract'
  }
  if ((Test-SymlinkPath $specDir) -or (Test-SymlinkPath $dir)) {
    throw 'workspace-summary-symlink-escape'
  }
  [System.IO.Directory]::CreateDirectory($dir) | Out-Null
  if ((Test-SymlinkPath $specDir) -or (Test-SymlinkPath $dir) -or (Test-SymlinkPath $Path)) {
    throw 'workspace-summary-symlink-escape'
  }
  $tmp = Join-Path $dir ('.{0}.{1}.tmp' -f (Split-Path -Leaf $Path), ([guid]::NewGuid().ToString('N')))
  try {
    $Payload | ConvertTo-Json -Depth $Depth | Set-Content -Encoding utf8 -LiteralPath $tmp
    if ((Test-SymlinkPath $specDir) -or (Test-SymlinkPath $dir) -or (Test-SymlinkPath $Path)) {
      throw 'workspace-summary-symlink-escape'
    }
    Move-Item -Force -LiteralPath $tmp -Destination $Path
  } catch {
    Remove-Item -Force -LiteralPath $tmp -ErrorAction SilentlyContinue
    throw
  }
}

function Test-SymlinkPath {
  param([string]$CandidatePath)
  if ([string]::IsNullOrWhiteSpace($CandidatePath)) { return $false }
  $item = Get-Item -LiteralPath $CandidatePath -Force -ErrorAction SilentlyContinue
  return ($null -ne $item -and (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0))
}

function Stop-ProjectConfigBlocked {
  param(
    [string]$Reason,
    [string]$ExampleStatus = 'skipped',
    [string]$LocalStatus = 'skipped',
    [string]$GitignoreStatus = 'skipped'
  )
  Write-Result `
    -OverallStatus 'action-required' `
    -Reason $Reason `
    -RepoRoot $repoRoot `
    -ExampleStatus $ExampleStatus `
    -LocalStatus $LocalStatus `
    -GitignoreStatus $GitignoreStatus `
    -LegacyMarkdownStatus $legacyMarkdownStatus `
    -LegacyConfigStatus $legacyConfigStatus
  exit 1
}

function Ensure-SafeSpecFirstProjectDir {
  if (Test-SymlinkPath $specDir) { return $false }
[System.IO.Directory]::CreateDirectory($specDir) | Out-Null
  return -not (Test-SymlinkPath $specDir)
}

function Invoke-ChildJsonScript {
  param(
    [string]$ScriptPath,
    [hashtable]$Arguments
  )

  $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ('spec-first-child-stderr-{0}.log' -f ([guid]::NewGuid().ToString('N')))
  $stdout = @()
  $exitCode = 0
  $exceptionText = ''
  try {
    $global:LASTEXITCODE = 0
    $stdout = @(& $ScriptPath @Arguments 2> $stderrPath)
    if ($LASTEXITCODE -is [int]) { $exitCode = $LASTEXITCODE }
  } catch {
    $exitCode = if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) { $LASTEXITCODE } else { 1 }
    $exceptionText = [string]$_.Exception.Message
  }

  $stderrText = if (Test-Path -LiteralPath $stderrPath -PathType Leaf) { Get-Content -Raw -LiteralPath $stderrPath } else { '' }
  Remove-Item -Force -ErrorAction SilentlyContinue -LiteralPath $stderrPath
  $diagnosticParts = @($stderrText, $exceptionText) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
  [pscustomobject]@{
    stdout = ($stdout -join "`n")
    diagnostic = ($diagnosticParts -join "`n").Trim()
    exit_code = $exitCode
  }
}

function Write-WorkspaceProjectConfigSummaryAndExit {
  param(
    [object]$TargetFacts,
    [string]$SelectionSource = 'explicit-all-repos'
  )

  $workspaceRoot = [string]$TargetFacts.workspace_root
  if (-not [string]::IsNullOrWhiteSpace($Repo)) {
    [pscustomobject]@{
      schema_version = 'workspace-project-config-bootstrap-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = 'all-repos-conflicts-with-repo'
      workspace_root = $workspaceRoot
      advisory = $true
      next_action = 'Use either -AllRepos from a parent workspace or -Repo <child>, not both.'
    } | ConvertTo-Json -Compress
    exit 1
  }

  if ($TargetFacts.mode -eq 'git-repo') {
    [pscustomobject]@{
      schema_version = 'workspace-project-config-bootstrap-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = 'all-repos-requires-parent-workspace'
      workspace_root = $workspaceRoot
      advisory = $true
      next_action = 'Run -AllRepos from a parent workspace containing child Git repos, or omit -AllRepos in a single Git repo.'
    } | ConvertTo-Json -Compress
    exit 1
  }

  $children = @($TargetFacts.candidates)
  if ($children.Count -eq 0) {
    [pscustomobject]@{
      schema_version = 'workspace-project-config-bootstrap-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = if ([string]::IsNullOrWhiteSpace([string]$TargetFacts.reason_code)) { 'workspace-no-git-candidates' } else { [string]$TargetFacts.reason_code }
      workspace_root = $workspaceRoot
      candidates = @($TargetFacts.candidates)
      advisory = $true
      next_action = if ([string]::IsNullOrWhiteSpace([string]$TargetFacts.next_action)) { 'Run from a parent workspace containing child Git repos.' } else { [string]$TargetFacts.next_action }
    } | ConvertTo-Json -Compress
    exit 1
  }

  $results = @()
  foreach ($child in $children) {
    $childParams = @{ Repo = [string]$child.workspace_relative_path; Json = $true }
    if ($RefreshExample) { $childParams.RefreshExample = $true }
    if ($CreateLocal) { $childParams.CreateLocal = $true }
    if ($EnsureGitignore) { $childParams.EnsureGitignore = $true }
    if ($DeleteLegacyMarkdown) { $childParams.DeleteLegacyMarkdown = $true }
    $childRun = Invoke-ChildJsonScript -ScriptPath $PSCommandPath -Arguments $childParams
    $childStatus = [int]$childRun.exit_code
    try {
      $childResult = [string]$childRun.stdout | ConvertFrom-Json
    } catch {
      $childResult = [pscustomobject]@{
        schema_version = 'project-config-bootstrap.v1'
        overall_status = 'action-required'
        reason = 'child-output-unparseable'
        diagnostic = (@([string]$childRun.stdout, [string]$childRun.diagnostic) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }) -join "`n"
      }
    }
    $childOverallStatus = [string]$childResult.overall_status
    if ([string]::IsNullOrWhiteSpace($childOverallStatus)) { $childOverallStatus = 'unknown' }
    $results += [pscustomobject][ordered]@{
      repo_label = [string]$child.repo_label
      workspace_relative_path = [string]$child.workspace_relative_path
      exit_code = $childStatus
      overall_status = $childOverallStatus
      reason_code = if ([string]::IsNullOrWhiteSpace([string]$childResult.reason)) { $null } else { [string]$childResult.reason }
      result = $childResult
    }
  }

  $readyCount = @($results | Where-Object { $_.overall_status -eq 'ready' }).Count
  $actionRequiredCount = @($results | Where-Object { $_.overall_status -ne 'ready' }).Count
  $overallStatus = if ($results.Count -eq 0) { 'action-required' } elseif ($actionRequiredCount -eq 0) { 'ready' } elseif ($readyCount -gt 0) { 'partial' } else { 'action-required' }
  $summary = [ordered]@{
    schema_version = 'workspace-project-config-bootstrap-summary.v1'
    generated_at = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    advisory = $true
    workflow_mode = 'all-repos'
    selection_source = $SelectionSource
    workspace_root = $workspaceRoot
    parent_writes_repo_local_artifacts = $false
    results = @($results)
    counts = [ordered]@{
      total = $results.Count
      ready = $readyCount
      action_required = $actionRequiredCount
    }
    overall_status = $overallStatus
    reason_code = if ($actionRequiredCount -eq 0) { $null } else { 'all-repos-partial-or-action-required' }
    next_action = if ($actionRequiredCount -eq 0) { 'All child repos completed project config bootstrap.' } else { 'Inspect per-child reason_code and rerun project config bootstrap for action-required repos.' }
  }

  try {
    Write-JsonFileAtomic -Path (Join-Path $workspaceRoot '.spec-first/workspace/project-config-bootstrap-summary.json') -Payload ([pscustomobject]$summary) -Depth 30
  } catch {
    [pscustomobject]@{
      schema_version = 'workspace-project-config-bootstrap-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = 'workspace-summary-symlink-escape'
      workspace_root = $workspaceRoot
      advisory = $true
      next_action = 'Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun project config bootstrap.'
    } | ConvertTo-Json -Compress
    exit 1
  }
  [pscustomobject]$summary | ConvertTo-Json -Depth 30 -Compress
  if ($overallStatus -ne 'ready') { exit 1 }
  exit 0
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$resolverParams = @{ Format = 'json' }
if (-not $AllRepos -and -not [string]::IsNullOrWhiteSpace($Repo)) { $resolverParams.Repo = $Repo }
if (-not $AllRepos -and -not [string]::IsNullOrWhiteSpace($Folder)) { $resolverParams.Folder = $Folder }
$targetFacts = (& (Join-Path $scriptDir 'resolve-project-target.ps1') @resolverParams) | ConvertFrom-Json
$script:targetKind = if ($targetFacts.PSObject.Properties.Name -contains 'target_kind') { [string]$targetFacts.target_kind } else { '' }

if ($AllRepos) {
  Write-WorkspaceProjectConfigSummaryAndExit -TargetFacts $targetFacts -SelectionSource 'explicit-all-repos'
}

$defaultChildren = @($targetFacts.candidates)
if (-not $AllRepos -and [string]::IsNullOrWhiteSpace($Repo) -and [string]::IsNullOrWhiteSpace($Folder) -and $targetFacts.mode -ne 'git-repo' -and $defaultChildren.Count -gt 0) {
  Write-WorkspaceProjectConfigSummaryAndExit -TargetFacts $targetFacts -SelectionSource 'workspace-default-all-repos'
}

if (-not [bool]$targetFacts.state_write_allowed) {
  Write-Result `
    -OverallStatus 'action-required' `
    -Reason $(if ([string]::IsNullOrWhiteSpace([string]$targetFacts.reason_code)) { 'workspace-target-required' } else { [string]$targetFacts.reason_code }) `
    -RepoRoot '' `
    -ExampleStatus 'not-applicable' `
    -LocalStatus 'not-applicable' `
    -GitignoreStatus 'not-applicable' `
    -LegacyMarkdownStatus 'not-applicable' `
    -LegacyConfigStatus 'not-applicable'
  exit 0
}

$repoRoot = if (-not [string]::IsNullOrWhiteSpace([string]$targetFacts.target_root)) {
  [string]$targetFacts.target_root
} elseif (-not [string]::IsNullOrWhiteSpace([string]$targetFacts.selected_repo_root)) {
  [string]$targetFacts.selected_repo_root
} else {
  [string]$targetFacts.selected_folder_root
}
$template = Join-Path (Split-Path -Parent $scriptDir) 'references/config-template.yaml'
$specDir = Join-Path $repoRoot '.spec-first'
$exampleConfig = Join-Path $specDir 'config.local.example.yaml'
$localConfig = Join-Path $specDir 'config.local.yaml'
$gitignore = Join-Path $repoRoot '.gitignore'
$legacyMarkdown = Join-Path $repoRoot 'compound-engineering.local.md'

if (-not (Test-Path -LiteralPath $template -PathType Leaf)) {
  Write-Result `
    -OverallStatus 'action-required' `
    -Reason 'missing-template' `
    -RepoRoot $repoRoot `
    -ExampleStatus 'missing-template' `
    -LocalStatus 'skipped' `
    -GitignoreStatus 'skipped' `
    -LegacyMarkdownStatus 'skipped' `
    -LegacyConfigStatus 'skipped'
  exit 1
}

$exampleStatus = 'skipped'
$localStatus = 'skipped'
$gitignoreStatus = 'skipped'
$legacyMarkdownStatus = if (Test-Path -LiteralPath $legacyMarkdown -PathType Leaf) { 'present' } else { 'missing' }
$legacyConfigStatus = 'retired'

if ($RefreshExample) {
  if (-not (Ensure-SafeSpecFirstProjectDir)) { Stop-ProjectConfigBlocked -Reason 'project-config-symlink-escape' }
  if (Test-SymlinkPath $exampleConfig) { Stop-ProjectConfigBlocked -Reason 'project-config-symlink-escape' }
  Copy-Item -LiteralPath $template -Destination $exampleConfig -Force
  $exampleStatus = 'refreshed'
}

if ($CreateLocal) {
  if (-not (Ensure-SafeSpecFirstProjectDir)) { Stop-ProjectConfigBlocked -Reason 'project-config-symlink-escape' -ExampleStatus $exampleStatus }
  if (Test-SymlinkPath $localConfig) { Stop-ProjectConfigBlocked -Reason 'project-config-symlink-escape' -ExampleStatus $exampleStatus }
  if (Test-Path -LiteralPath $localConfig -PathType Leaf) {
    $localStatus = 'already-exists'
  } else {
    Copy-Item -LiteralPath $template -Destination $localConfig
    $localStatus = 'created'
  }
}

if ($EnsureGitignore) {
  $line = '.spec-first/*.local.yaml'
  if ($script:targetKind -eq 'non-git-folder') {
    $gitignoreStatus = 'not-applicable-non-git-folder'
  } elseif (Test-SymlinkPath $gitignore) {
    Stop-ProjectConfigBlocked -Reason 'gitignore-symlink-escape' -ExampleStatus $exampleStatus -LocalStatus $localStatus -GitignoreStatus 'blocked'
  } else {
    if (-not (Test-Path -LiteralPath $gitignore -PathType Leaf)) {
      New-Item -ItemType File -LiteralPath $gitignore | Out-Null
    }
    $content = Get-Content -LiteralPath $gitignore -ErrorAction SilentlyContinue
    if ($content -contains $line) {
      $gitignoreStatus = 'already-present'
    } else {
      Add-Content -LiteralPath $gitignore -Value $line
      $gitignoreStatus = 'added'
    }
  }
}

if ($DeleteLegacyMarkdown) {
  if (Test-Path -LiteralPath $legacyMarkdown -PathType Leaf) {
    Remove-Item -LiteralPath $legacyMarkdown
    $legacyMarkdownStatus = 'deleted'
  } else {
    $legacyMarkdownStatus = 'missing'
  }
}

Write-Result `
  -OverallStatus 'ready' `
  -Reason '' `
  -RepoRoot $repoRoot `
  -ExampleStatus $exampleStatus `
  -LocalStatus $localStatus `
  -GitignoreStatus $gitignoreStatus `
  -LegacyMarkdownStatus $legacyMarkdownStatus `
  -LegacyConfigStatus $legacyConfigStatus
