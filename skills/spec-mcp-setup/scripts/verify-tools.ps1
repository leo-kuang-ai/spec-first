param(
  [string]$Repo = '',
  [string]$Folder = '',
  [switch]$AllRepos,
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'verify-tools.ps1: node 是必需依赖，请先安装 Node.js'
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not [string]::IsNullOrWhiteSpace($Repo) -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'verify-tools.ps1: use either -Repo or -Folder, not both'
}
if ($AllRepos -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'verify-tools.ps1: use either -AllRepos or -Folder, not both'
}
$HostInfo = & (Join-Path $ScriptDir 'detect-host.ps1') | ConvertFrom-Json
$MarkerPath = $HostInfo.marker_path
$MarkerDir = Split-Path -Parent $MarkerPath

# U2 host pointer self-heal: 检测 setup-owned host pointer drift,
# 在 ledger 中记录 reconciliation advisory event。
# Caller 必须在 detect-tools.ps1 给出 facts 后传入 child repo root,
# 以便 -Repo <child> / parent-workspace 路径下也能正确 reconcile。
function Get-HostPointerReconciliation {
  param(
    [string]$CurrentHost,
    [string]$RepoRoot,
    [string]$MarkerPathArg
  )
  if ([string]::IsNullOrWhiteSpace($CurrentHost)) { return $null }
  if ([string]::IsNullOrWhiteSpace($RepoRoot)) { return $null }
  $runtimePath = Join-Path $RepoRoot '.spec-first/config/runtime-capabilities.json'
  if (-not (Test-Path -LiteralPath $runtimePath -PathType Leaf)) { return $null }
  try {
    $runtimeJson = Get-Content -Raw -LiteralPath $runtimePath | ConvertFrom-Json -ErrorAction Stop
  } catch {
    [Console]::Error.WriteLine("verify-tools.ps1: runtime-capabilities.json at $runtimePath is unreadable; host pointer reconciliation skipped (will be rewritten by setup)")
    return $null
  }
  $previousHost = $null
  $previousPath = $null
  if ($runtimeJson -and $runtimeJson.host_ledger_pointer) {
    $previousHost = $runtimeJson.host_ledger_pointer.host
    $previousPath = $runtimeJson.host_ledger_pointer.path
  }
  if ([string]::IsNullOrWhiteSpace($previousHost)) { return $null }
  if ($previousHost -eq $CurrentHost) { return $null }
  return [ordered]@{
    schema_version = 'host-pointer-reconciliation.v1'
    from_host = $previousHost
    to_host = $CurrentHost
    from_marker_path = $previousPath
    to_marker_path = $MarkerPathArg
    reconciled_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    reason = 'host marker drift detected between previous setup run and current detect-host'
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
    $json = $Payload | ConvertTo-Json -Depth $Depth
    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::WriteAllText($tmp, $json, $encoding)
    if ((Test-SymlinkPath $specDir) -or (Test-SymlinkPath $dir) -or (Test-SymlinkPath $Path)) {
      throw 'workspace-summary-symlink-escape'
    }
    Move-Item -Force -LiteralPath $tmp -Destination $Path
  } catch {
    Remove-Item -Force -LiteralPath $tmp -ErrorAction SilentlyContinue
    throw
  }
}

function Get-NestedValue {
  param(
    [object]$InputObject,
    [string[]]$PathParts
  )
  $current = $InputObject
  foreach ($part in $PathParts) {
    if ($null -eq $current -or $null -eq $current.PSObject.Properties[$part]) {
      return ''
    }
    $current = $current.PSObject.Properties[$part].Value
  }
  if ($null -eq $current) { return '' }
  return [string]$current
}

function Read-JsonObjectOrNull {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return $null
  }
  try {
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json -ErrorAction Stop
  } catch {
    return $null
  }
}

function Get-BundledManifestVersion {
  if (-not [string]::IsNullOrWhiteSpace($env:SPEC_FIRST_BUNDLED_VERSION)) {
    return [string]$env:SPEC_FIRST_BUNDLED_VERSION
  }

  try {
    $repoRoot = (Resolve-Path -LiteralPath (Join-Path $ScriptDir '../../..')).Path
    $packagePath = Join-Path $repoRoot 'package.json'
    if (Test-Path -LiteralPath $packagePath -PathType Leaf) {
      $packageJson = Get-Content -Raw -LiteralPath $packagePath | ConvertFrom-Json -ErrorAction Stop
      if (-not [string]::IsNullOrWhiteSpace([string]$packageJson.version)) {
        return [string]$packageJson.version
      }
    }
  } catch {
    # Fall through to the installed CLI probe.
  }

  if (Get-Command spec-first -ErrorAction SilentlyContinue) {
    try {
      $versionOutput = & spec-first --version 2>$null
      foreach ($line in @($versionOutput)) {
        if ([string]$line -match 'Spec-First v([0-9][0-9A-Za-z._-]*)') {
          return $Matches[1]
        }
      }
    } catch {
      return ''
    }
  }

  return ''
}

function Get-RuntimeStatePathForHost {
  param(
    [string]$HostName,
    [string]$TargetRoot
  )
  if ([string]::IsNullOrWhiteSpace($TargetRoot)) { return '' }
  switch ($HostName) {
    'codex' { return (Join-Path $TargetRoot '.codex/spec-first/state.json') }
    'claude' { return (Join-Path $TargetRoot '.claude/spec-first/state.json') }
    'kiro' { return (Join-Path $TargetRoot '.kiro/spec-first/state.json') }
    'qoder' { return (Join-Path $TargetRoot '.qoder/spec-first/state.json') }
    default { return '' }
  }
}

function Get-GeneratedRuntimeManifestHealth {
  param(
    [string]$HostName,
    [string]$TargetRoot
  )

  $bundledVersion = Get-BundledManifestVersion
  $statePath = Get-RuntimeStatePathForHost -HostName $HostName -TargetRoot $TargetRoot
  $recordedVersion = ''
  $status = 'unknown'
  $reasonCode = 'unknown-runtime-manifest-health'
  $nextAction = 'spec-first init -y'

  if ([string]::IsNullOrWhiteSpace($HostName) -or [string]::IsNullOrWhiteSpace($TargetRoot) -or [string]::IsNullOrWhiteSpace($statePath)) {
    $reasonCode = 'missing-host-or-target-root'
  } elseif (-not (Test-Path -LiteralPath $statePath -PathType Leaf)) {
    $status = 'missing'
    $reasonCode = 'runtime-state-missing'
  } else {
    try {
      $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json -ErrorAction Stop
      $recordedVersion = [string]$state.manifestVersion
      if ([string]::IsNullOrWhiteSpace($recordedVersion)) {
        $status = 'missing'
        $reasonCode = 'runtime-manifest-version-missing'
      } elseif ([string]::IsNullOrWhiteSpace($bundledVersion)) {
        $status = 'unknown'
        $reasonCode = 'bundled-manifest-version-unknown'
      } elseif ($recordedVersion -eq $bundledVersion) {
        $status = 'current'
        $reasonCode = $null
        $nextAction = $null
      } else {
        $status = 'stale'
        $reasonCode = 'runtime-manifest-version-stale'
      }
    } catch {
      $status = 'unknown'
      $reasonCode = 'runtime-state-unreadable'
    }
  }

  [ordered]@{
    status = $status
    reason_code = $reasonCode
    host = $HostName
    state_path = if ([string]::IsNullOrWhiteSpace($statePath)) { $null } else { $statePath }
    recorded_manifest_version = if ([string]::IsNullOrWhiteSpace($recordedVersion)) { $null } else { $recordedVersion }
    bundled_manifest_version = if ([string]::IsNullOrWhiteSpace($bundledVersion)) { $null } else { $bundledVersion }
    evidence_basis = 'state.manifestVersion vs bundled manifest.version'
    next_action = $nextAction
  }
}

function Test-PathIsSymlink {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  return ($null -ne $item -and (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0))
}

function Test-ForeignAbsoluteStatFailure {
  param([string]$Candidate)
  if ([string]::IsNullOrWhiteSpace($Candidate)) { return $false }
  if (-not [System.IO.Path]::IsPathRooted($Candidate)) { return $false }
  if (Test-Path -LiteralPath $Candidate) { return $false }
  $homePath = [string]$HOME
  if ([string]::IsNullOrWhiteSpace($homePath)) { return $true }
  $normalizedCandidate = $Candidate.Replace('\', '/')
  $normalizedHome = $homePath.Replace('\', '/').TrimEnd('/')
  return -not ($normalizedCandidate -eq $normalizedHome -or $normalizedCandidate.StartsWith("$normalizedHome/"))
}

function New-ParentQuarantineItem {
  param(
    [string]$Path,
    [string]$ReasonCode,
    [string]$StaleIndicator = '',
    [string]$LastGeneratedAt = '',
    [string]$FingerprintOrigin = ''
  )
  [ordered]@{
    path = $Path.Replace('\', '/')
    reason_code = $ReasonCode
    stale_indicator = if ([string]::IsNullOrWhiteSpace($StaleIndicator)) { $null } else { $StaleIndicator }
    last_generated_at = if ([string]::IsNullOrWhiteSpace($LastGeneratedAt)) { $null } else { $LastGeneratedAt }
    fingerprint_origin = if ([string]::IsNullOrWhiteSpace($FingerprintOrigin)) { $null } else { $FingerprintOrigin }
  }
}

function Add-ParentJsonArtifactQuarantineItem {
  param(
    [System.Collections.Generic.List[object]]$Items,
    [string]$WorkspaceRoot,
    [string]$RelativePath,
    [string]$DefaultReason
  )
  $artifactPath = Join-Path $WorkspaceRoot $RelativePath
  if (-not (Test-Path -LiteralPath $artifactPath)) {
    return
  }
  $json = Read-JsonObjectOrNull -Path $artifactPath
  $repoRoot = Get-NestedValue -InputObject $json -PathParts @('repo_root')
  $generatedAt = Get-NestedValue -InputObject $json -PathParts @('generated_at')
  $pointerPath = Get-NestedValue -InputObject $json -PathParts @('host_ledger_pointer', 'path')
  $reasonCode = $DefaultReason
  $staleIndicator = 'parent-workspace-repo-local-artifact-present'
  $fingerprintOrigin = $repoRoot

  if (Test-ForeignAbsoluteStatFailure -Candidate $repoRoot) {
    $reasonCode = 'foreign-absolute-path-stat-failed'
    $staleIndicator = $repoRoot
  } elseif (Test-ForeignAbsoluteStatFailure -Candidate $pointerPath) {
    $reasonCode = 'foreign-absolute-path-stat-failed'
    $staleIndicator = $pointerPath
    $fingerprintOrigin = $pointerPath
  } elseif (-not [string]::IsNullOrWhiteSpace($repoRoot) -and $repoRoot -ne $WorkspaceRoot) {
    $reasonCode = 'repo_root-mismatches-workspace-root'
    $staleIndicator = $repoRoot
  }

  $Items.Add((New-ParentQuarantineItem -Path $RelativePath -ReasonCode $reasonCode -StaleIndicator $staleIndicator -LastGeneratedAt $generatedAt -FingerprintOrigin $fingerprintOrigin)) | Out-Null
}

function New-ParentArtifactQuarantine {
  param([string]$WorkspaceRoot)
  $items = [System.Collections.Generic.List[object]]::new()

  if (Test-PathIsSymlink -Path (Join-Path $WorkspaceRoot '.spec-first')) {
    return [ordered]@{
      schema_version = 'parent-artifact-quarantine.v1'
      topology = 'multi-repo-workspace'
      advisory = $true
      authority_level = 'advisory'
      freshness = 'generated'
      generated_at = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
      generated_by = 'spec-mcp-setup'
      consumers = @('spec-first clean --workspace-orphans', 'LLM workflow degraded-evidence judgment')
      quarantined_paths = @()
    }
  }

  Add-ParentJsonArtifactQuarantineItem -Items $items -WorkspaceRoot $WorkspaceRoot -RelativePath '.spec-first/config/tool-facts.json' -DefaultReason 'parent-workspace-must-not-have-repo-local-setup-artifact'
  Add-ParentJsonArtifactQuarantineItem -Items $items -WorkspaceRoot $WorkspaceRoot -RelativePath '.spec-first/config/runtime-capabilities.json' -DefaultReason 'parent-workspace-must-not-have-repo-local-setup-artifact'

  [ordered]@{
    schema_version = 'parent-artifact-quarantine.v1'
    topology = 'multi-repo-workspace'
    advisory = $true
    authority_level = 'advisory'
    freshness = 'generated'
    generated_at = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    generated_by = 'spec-mcp-setup'
    consumers = @('spec-first clean --workspace-orphans', 'LLM workflow degraded-evidence judgment')
    quarantined_paths = @($items.ToArray())
  }
}

function Write-SetupScenarioFingerprint {
  param(
    [object]$Ledger,
    [string]$LedgerPath
  )

  $stateWriteAllowed = if ($null -ne $Ledger.target) { [bool]$Ledger.target.state_write_allowed } else { $true }
  if (-not $stateWriteAllowed) { return }

  $targetRoot = if (-not [string]::IsNullOrWhiteSpace([string]$Ledger.target_root)) {
    [string]$Ledger.target_root
  } elseif (-not [string]::IsNullOrWhiteSpace([string]$Ledger.selected_repo_root)) {
    [string]$Ledger.selected_repo_root
  } elseif (-not [string]::IsNullOrWhiteSpace([string]$Ledger.workspace_root)) {
    [string]$Ledger.workspace_root
  } else {
    ''
  }
  if ([string]::IsNullOrWhiteSpace($targetRoot) -or -not (Test-Path -LiteralPath $targetRoot -PathType Container)) {
    return
  }

  $output = Join-Path $targetRoot '.spec-first/workspace/scenario-fingerprint-setup.json'
  $repoRoot = Resolve-Path -LiteralPath (Join-Path $ScriptDir '../../..')
  $helper = Join-Path $repoRoot 'src/cli/helpers/scenario-fingerprint.js'
  $stdout = ''
  $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ('spec-first-scenario-fingerprint-{0}.log' -f ([guid]::NewGuid().ToString('N')))
  $exitCode = 127
  try {
    $global:LASTEXITCODE = 0
    if (Test-Path -LiteralPath $helper -PathType Leaf) {
      $stdout = (& node $helper --layer setup --ledger $LedgerPath --out $output 2> $stderrPath) -join "`n"
      $exitCode = if ($LASTEXITCODE -is [int]) { $LASTEXITCODE } else { 0 }
    } elseif (-not [string]::IsNullOrWhiteSpace($env:SPEC_FIRST_CLI)) {
      if ((Test-Path -LiteralPath $env:SPEC_FIRST_CLI -PathType Leaf) -and $env:SPEC_FIRST_CLI.EndsWith('.js')) {
        $stdout = (& node $env:SPEC_FIRST_CLI internal compute-scenario-fingerprint --layer setup --ledger $LedgerPath --out $output 2> $stderrPath) -join "`n"
      } else {
        $stdout = (& $env:SPEC_FIRST_CLI internal compute-scenario-fingerprint --layer setup --ledger $LedgerPath --out $output 2> $stderrPath) -join "`n"
      }
      $exitCode = if ($LASTEXITCODE -is [int]) { $LASTEXITCODE } else { 0 }
    } elseif (Get-Command spec-first -ErrorAction SilentlyContinue) {
      $stdout = (& spec-first internal compute-scenario-fingerprint --layer setup --ledger $LedgerPath --out $output 2> $stderrPath) -join "`n"
      $exitCode = if ($LASTEXITCODE -is [int]) { $LASTEXITCODE } else { 0 }
    } else {
      $stdout = 'spec-first CLI unavailable'
    }
  } catch {
    $exitCode = if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) { $LASTEXITCODE } else { 1 }
    $stdout = [string]$_.Exception.Message
  }

  $stderr = if (Test-Path -LiteralPath $stderrPath -PathType Leaf) { Get-Content -Raw -LiteralPath $stderrPath } else { '' }
  Remove-Item -Force -LiteralPath $stderrPath -ErrorAction SilentlyContinue
  if ($exitCode -eq 0 -and (Test-Path -LiteralPath $output -PathType Leaf)) {
    $Ledger['scenario_fingerprint_setup'] = [ordered]@{
      status = 'written'
      schema_version = 'developer-scenario-fingerprint-setup.v1'
      path = $output
      advisory = $true
    }
    Write-Host "🧭 setup scenario fingerprint: $output"
  } else {
    $diagnostic = (@($stdout, $stderr) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }) -join "`n"
    $Ledger['scenario_fingerprint_setup'] = [ordered]@{
      status = 'failed'
      schema_version = 'developer-scenario-fingerprint-setup.v1'
      advisory = $true
      diagnostic = (($diagnostic -split "`n") | Select-Object -First 6) -join "`n"
    }
    [Console]::Error.WriteLine('verify-tools.ps1: setup scenario fingerprint failed; continuing')
  }
  $Ledger | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 $LedgerPath
}

function Invoke-ChildScriptCaptured {
  param(
    [string]$ScriptPath,
    [hashtable]$Arguments
  )

  $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ('spec-first-child-stderr-{0}.log' -f ([guid]::NewGuid().ToString('N')))
  $informationPath = Join-Path ([System.IO.Path]::GetTempPath()) ('spec-first-child-information-{0}.log' -f ([guid]::NewGuid().ToString('N')))
  $stdout = @()
  $exitCode = 0
  $exceptionText = ''
  try {
    $global:LASTEXITCODE = 0
    $stdout = @(& $ScriptPath @Arguments 2> $stderrPath 6> $informationPath)
    if ($LASTEXITCODE -is [int]) { $exitCode = $LASTEXITCODE }
  } catch {
    $exitCode = if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) { $LASTEXITCODE } else { 1 }
    $exceptionText = [string]$_.Exception.Message
  }

  $stderrText = if (Test-Path -LiteralPath $stderrPath -PathType Leaf) { Get-Content -Raw -LiteralPath $stderrPath } else { '' }
  $informationText = if (Test-Path -LiteralPath $informationPath -PathType Leaf) { Get-Content -Raw -LiteralPath $informationPath } else { '' }
  Remove-Item -Force -ErrorAction SilentlyContinue -LiteralPath $stderrPath, $informationPath

  $stdoutText = ($stdout -join "`n")
  $diagnosticParts = @($stdoutText, $stderrText, $informationText, $exceptionText) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
  [pscustomobject]@{
    stdout = $stdoutText
    stderr = $stderrText
    information = $informationText
    diagnostic = ($diagnosticParts -join "`n").Trim()
    exit_code = $exitCode
  }
}

function Write-WorkspaceMcpVerifySummaryAndExit {
  param(
    [object]$TargetFacts,
    [string]$SelectionSource = 'explicit-all-repos'
  )

  $workspaceRoot = [string]$TargetFacts.workspace_root
  if (-not [string]::IsNullOrWhiteSpace($Repo)) {
    [pscustomobject]@{
      schema_version = 'workspace-mcp-verify-summary.v1'
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
      schema_version = 'workspace-mcp-verify-summary.v1'
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
    $targetGitHealth = if ($TargetFacts.PSObject.Properties.Name -contains 'git_health') { $TargetFacts.git_health } else { $null }
    $targetGitStatus = if ($targetGitHealth -and $targetGitHealth.PSObject.Properties.Name -contains 'status') { [string]$targetGitHealth.status } else { '' }
    [pscustomobject]@{
      schema_version = 'workspace-mcp-verify-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = if ([string]::IsNullOrWhiteSpace([string]$TargetFacts.reason_code)) { 'workspace-no-git-candidates' } else { [string]$TargetFacts.reason_code }
      workspace_root = $workspaceRoot
      parent_workspace_advisory = [ordered]@{
        git_health = $targetGitHealth
        coverage_gap = if ($TargetFacts.PSObject.Properties.Name -contains 'coverage_gap') { $TargetFacts.coverage_gap } else { $null }
        candidates_diagnostics = if ($TargetFacts.PSObject.Properties.Name -contains 'candidates_diagnostics') { @($TargetFacts.candidates_diagnostics) } else { @() }
        repair_action_available = ($targetGitStatus -eq 'broken-worktree')
        repair_command = if ($targetGitStatus -eq 'broken-worktree') { 'spec-first repair-worktree --dry-run' } else { $null }
        diagnostic_action_available = ($targetGitStatus -eq 'corrupted-gitdir')
        diagnostic_command = if ($targetGitStatus -eq 'corrupted-gitdir') { 'git fsck' } else { $null }
      }
      candidates = @($TargetFacts.candidates)
      advisory = $true
      next_action = if ([string]::IsNullOrWhiteSpace([string]$TargetFacts.next_action)) { 'Run from a parent workspace containing child Git repos.' } else { [string]$TargetFacts.next_action }
    } | ConvertTo-Json -Compress
    exit 1
  }

  New-Item -ItemType Directory -Force -Path $MarkerDir | Out-Null
  $results = @()
  foreach ($child in $children) {
    $childRun = Invoke-ChildScriptCaptured -ScriptPath $PSCommandPath -Arguments @{ Repo = [string]$child.workspace_relative_path }
    $childStatus = [int]$childRun.exit_code
    $childText = [string]$childRun.diagnostic
    if (Test-Path -LiteralPath $MarkerPath -PathType Leaf) {
      try {
        $childLedger = Get-Content -Raw $MarkerPath | ConvertFrom-Json
        $childManifestStatus = [string](Get-NestedValue -InputObject $childLedger -PathParts @('generated_runtime_manifest', 'status'))
        $childManifestRefreshRequired = @('stale', 'missing') -contains $childManifestStatus
        $childOverall = if ($childLedger.PSObject.Properties.Name -contains 'overall_status' -and -not [string]::IsNullOrWhiteSpace([string]$childLedger.overall_status)) {
          [string]$childLedger.overall_status
        } elseif ($childManifestRefreshRequired) {
          'action-required'
        } elseif ([bool]$childLedger.baseline_ready) {
          'ready'
        } else {
          'action-required'
        }
        if ($childStatus -ne 0 -and $childOverall -eq 'ready') {
          $childOverall = 'action-required'
        }
        $childReason = if ($childManifestRefreshRequired) { 'generated-runtime-manifest-refresh-required' } elseif ($childStatus -ne 0 -and [string]::IsNullOrWhiteSpace([string]$childLedger.reason_code)) { 'child-verify-failed' } else { [string]$childLedger.reason_code }
        $childResult = [pscustomobject]@{
          schema_version = 'mcp-verify-child-result.v1'
          baseline_ready = [bool]$childLedger.baseline_ready
          generated_runtime_manifest = if ($childLedger.PSObject.Properties.Name -contains 'generated_runtime_manifest') { $childLedger.generated_runtime_manifest } else { [pscustomobject]@{ status = 'unknown'; reason_code = 'not-reported' } }
          tool_facts_status = $childLedger.tool_facts_status
          runtime_capabilities_status = $childLedger.runtime_capabilities_status
          reason_code = [string]$childLedger.reason_code
          next_actions = @($childLedger.next_actions)
        }
      } catch {
        $childOverall = 'action-required'
        $childReason = 'child-verify-ledger-unavailable'
        $childResult = [pscustomobject]@{
          schema_version = 'mcp-verify-child-result.v1'
          baseline_ready = $false
          reason_code = 'child-verify-ledger-unavailable'
          diagnostic = $childText
        }
      }
    } else {
      $childOverall = 'action-required'
      $childReason = 'child-verify-ledger-unavailable'
      $childResult = [pscustomobject]@{
        schema_version = 'mcp-verify-child-result.v1'
        baseline_ready = $false
        reason_code = 'child-verify-ledger-unavailable'
        diagnostic = $childText
      }
    }

    $results += [pscustomobject][ordered]@{
      repo_label = [string]$child.repo_label
      workspace_relative_path = [string]$child.workspace_relative_path
      exit_code = $childStatus
      overall_status = $childOverall
      reason_code = if ([string]::IsNullOrWhiteSpace($childReason)) { $null } else { $childReason }
      result = $childResult
    }
  }

  $parentGeneratedRuntimeManifest = Get-GeneratedRuntimeManifestHealth -HostName ([string]$HostInfo.host) -TargetRoot $workspaceRoot
  if (@('stale', 'missing') -contains [string]$parentGeneratedRuntimeManifest.status) {
    $parentGeneratedRuntimeManifest['next_action'] = 'spec-first init --all-repos -y'
  }
  $readyCount = @($results | Where-Object { $_.overall_status -eq 'ready' }).Count
  $actionRequiredCount = @($results | Where-Object { $_.overall_status -ne 'ready' }).Count
  $manifestCurrentCount = @($results | Where-Object { (Get-NestedValue -InputObject $_.result -PathParts @('generated_runtime_manifest', 'status')) -eq 'current' }).Count
  $manifestStaleCount = @($results | Where-Object { (Get-NestedValue -InputObject $_.result -PathParts @('generated_runtime_manifest', 'status')) -eq 'stale' }).Count
  $manifestMissingCount = @($results | Where-Object { (Get-NestedValue -InputObject $_.result -PathParts @('generated_runtime_manifest', 'status')) -eq 'missing' }).Count
  $manifestUnknownCount = @($results | Where-Object {
    $status = Get-NestedValue -InputObject $_.result -PathParts @('generated_runtime_manifest', 'status')
    [string]::IsNullOrWhiteSpace($status) -or $status -eq 'unknown'
  }).Count
  $parentManifestRefreshRequired = @('stale', 'missing') -contains [string]$parentGeneratedRuntimeManifest.status
  $manifestRefreshRequiredCount = $manifestStaleCount + $manifestMissingCount + $(if ($parentManifestRefreshRequired) { 1 } else { 0 })
  $overallStatus = if ($results.Count -eq 0) { 'action-required' } elseif ($parentManifestRefreshRequired) { if ($readyCount -gt 0) { 'partial' } else { 'action-required' } } elseif ($actionRequiredCount -eq 0) { 'ready' } elseif ($readyCount -gt 0) { 'partial' } else { 'action-required' }
  $targetGitHealth = if ($TargetFacts.PSObject.Properties.Name -contains 'git_health') { $TargetFacts.git_health } else { $null }
  $targetGitStatus = if ($targetGitHealth -and $targetGitHealth.PSObject.Properties.Name -contains 'status') { [string]$targetGitHealth.status } else { '' }
  $parentArtifactQuarantine = New-ParentArtifactQuarantine -WorkspaceRoot $workspaceRoot
  $parentWorkspacePollutionCount = @($parentArtifactQuarantine.quarantined_paths).Count
  $summary = [ordered]@{
    schema_version = 'workspace-mcp-verify-summary.v1'
    generated_at = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    advisory = $true
    workflow_mode = 'all-repos'
    selection_source = $SelectionSource
    workspace_root = $workspaceRoot
    parent_workspace_advisory = [ordered]@{
      git_health = $targetGitHealth
      coverage_gap = if ($TargetFacts.PSObject.Properties.Name -contains 'coverage_gap') { $TargetFacts.coverage_gap } else { $null }
      candidates_diagnostics = if ($TargetFacts.PSObject.Properties.Name -contains 'candidates_diagnostics') { @($TargetFacts.candidates_diagnostics) } else { @() }
      repair_action_available = ($targetGitStatus -eq 'broken-worktree')
      repair_command = if ($targetGitStatus -eq 'broken-worktree') { 'spec-first repair-worktree --dry-run' } else { $null }
      diagnostic_action_available = ($targetGitStatus -eq 'corrupted-gitdir')
      diagnostic_command = if ($targetGitStatus -eq 'corrupted-gitdir') { 'git fsck' } else { $null }
    }
    parent_writes_repo_local_artifacts = $false
    parent_generated_runtime_manifest = $parentGeneratedRuntimeManifest
    results = @($results)
    counts = [ordered]@{
      total = $results.Count
      ready = $readyCount
      action_required = $actionRequiredCount
      generated_runtime_manifest = [ordered]@{
        current = $manifestCurrentCount
        stale = $manifestStaleCount
        missing = $manifestMissingCount
        unknown = $manifestUnknownCount
      }
    }
    overall_status = $overallStatus
    reason_code = if ($results.Count -eq 0) { 'workspace-no-git-candidates' } elseif ($manifestRefreshRequiredCount -gt 0) { 'generated-runtime-manifest-refresh-required' } elseif ($actionRequiredCount -eq 0) { $null } else { 'all-repos-partial-or-action-required' }
    parent_workspace_pollution_count = $parentWorkspacePollutionCount
    runtime_hints = @(
      if ($parentWorkspacePollutionCount -gt 0) {
        ('- Workspace pollution detected: wrote .spec-first/workspace/parent-artifact-quarantine.json ({0} paths quarantined). Run `spec-first clean --workspace-orphans` for read-only inspection.' -f $parentWorkspacePollutionCount)
      }
      if ($manifestRefreshRequiredCount -gt 0) {
        '- Generated runtime manifest stale or missing in the parent workspace or one or more child repos. Run `spec-first init --all-repos -y` from the parent workspace.'
      }
    )
    next_action = if ($manifestRefreshRequiredCount -gt 0) { 'Run spec-first init --all-repos -y from the parent workspace, then rerun verify.' } elseif ($actionRequiredCount -eq 0) { 'All child repos verified required MCP/helper dependency readiness.' } else { 'Inspect per-child reason_code and rerun setup/verify for action-required repos.' }
  }

  try {
    Write-JsonFileAtomic -Path (Join-Path $workspaceRoot '.spec-first/workspace/parent-artifact-quarantine.json') -Payload ([pscustomobject]$parentArtifactQuarantine) -Depth 30
  } catch {
    [Console]::Error.WriteLine('verify-tools.ps1: parent artifact quarantine write failed; continuing')
  }

  try {
    Write-JsonFileAtomic -Path (Join-Path $workspaceRoot '.spec-first/workspace/mcp-verify-summary.json') -Payload ([pscustomobject]$summary) -Depth 30
  } catch {
    [pscustomobject]@{
      schema_version = 'workspace-mcp-verify-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = 'workspace-summary-symlink-escape'
      workspace_root = $workspaceRoot
      advisory = $true
      next_action = 'Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun verify.'
    } | ConvertTo-Json -Compress
    exit 1
  }
  [pscustomobject]$summary | ConvertTo-Json -Depth 30 -Compress
  if ($overallStatus -ne 'ready') { exit 1 }
  exit 0
}

if ($AllRepos) {
  $targetFactsForAll = (& (Join-Path $ScriptDir 'resolve-project-target.ps1') -Format json) | ConvertFrom-Json
  Write-WorkspaceMcpVerifySummaryAndExit -TargetFacts $targetFactsForAll -SelectionSource 'explicit-all-repos'
}

if (-not $AllRepos -and [string]::IsNullOrWhiteSpace($Repo) -and [string]::IsNullOrWhiteSpace($Folder)) {
  $targetFactsForDefaultAll = (& (Join-Path $ScriptDir 'resolve-project-target.ps1') -Format json) | ConvertFrom-Json
  $defaultChildren = @($targetFactsForDefaultAll.candidates)
  if ($targetFactsForDefaultAll.mode -ne 'git-repo' -and $defaultChildren.Count -gt 0) {
    Write-WorkspaceMcpVerifySummaryAndExit -TargetFacts $targetFactsForDefaultAll -SelectionSource 'workspace-default-all-repos'
  }
}

$detectParams = @{}
if (-not [string]::IsNullOrWhiteSpace($Repo)) { $detectParams.Repo = $Repo }
if (-not [string]::IsNullOrWhiteSpace($Folder)) { $detectParams.Folder = $Folder }
$Facts = & (Join-Path $ScriptDir 'detect-tools.ps1') @detectParams | ConvertFrom-Json

$reconciliationHost = $Facts.host
$reconciliationRepoRoot = if (-not [string]::IsNullOrWhiteSpace([string]$Facts.selected_repo_root)) {
  [string]$Facts.selected_repo_root
} elseif ($null -ne $Facts.PSObject.Properties['target'] -and -not [string]::IsNullOrWhiteSpace([string]$Facts.target.selected_folder_root)) {
  [string]$Facts.target.selected_folder_root
} elseif ($null -ne $Facts.PSObject.Properties['target'] -and -not [string]::IsNullOrWhiteSpace([string]$Facts.target.target_root)) {
  [string]$Facts.target.target_root
} else {
  [string]$Facts.repo_root
}

$previousProviderHostForHelper = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_HOST')
$previousRepoRootForHelper = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_REPO_ROOT')
try {
  $env:SPEC_FIRST_PROVIDER_HOST = $reconciliationHost
  $env:SPEC_FIRST_PROVIDER_REPO_ROOT = $reconciliationRepoRoot
  $HelperFacts = & (Join-Path $ScriptDir 'install-helpers.ps1') -VerifyOnly | ConvertFrom-Json
} finally {
  if ($null -eq $previousProviderHostForHelper) { Remove-Item env:SPEC_FIRST_PROVIDER_HOST -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_HOST = $previousProviderHostForHelper }
  if ($null -eq $previousRepoRootForHelper) { Remove-Item env:SPEC_FIRST_PROVIDER_REPO_ROOT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_REPO_ROOT = $previousRepoRootForHelper }
}

$HostPointerReconciliation = Get-HostPointerReconciliation -CurrentHost $reconciliationHost -RepoRoot $reconciliationRepoRoot -MarkerPathArg $MarkerPath
$GeneratedRuntimeManifest = Get-GeneratedRuntimeManifestHealth -HostName $reconciliationHost -TargetRoot $reconciliationRepoRoot

function Test-ToolReady {
  param([object]$Tool)
  $baselineBlocking = if ($Tool.PSObject.Properties.Name -contains 'baseline_blocking') { [bool]$Tool.baseline_blocking } elseif ($Tool.PSObject.Properties.Name -contains 'required') { [bool]$Tool.required } else { $true }
  if (-not $baselineBlocking) { return $true }
  $hostReady = (
    ($Tool.PSObject.Properties.Name -contains 'host_config_required' -and -not [bool]$Tool.host_config_required -and $Tool.host_config_status -eq 'not-required') -or
    $Tool.host_config_status -eq 'ready' -or
    $Tool.host_config_status -eq 'fallback-active' -or
    $Tool.host_config_status -eq 'registry-args-drift'
  )
  return (
    $Tool.dependency_status -eq 'ready' -and
    $hostReady -and
    ($Tool.project_status -eq 'ready' -or $Tool.project_status -eq 'not-applicable' -or $Tool.project_status -eq 'workspace-target-required')
  )
}

$toolsReady = $true
foreach ($property in $Facts.tools.PSObject.Properties) {
  if (-not (Test-ToolReady -Tool $property.Value)) {
    $toolsReady = $false
    break
  }
}

$helperTools = $HelperFacts.helper_tools
$helperReady = $true
foreach ($property in $helperTools.PSObject.Properties) {
  $baselineBlocking = if ($property.Value.PSObject.Properties.Name -contains 'baseline_blocking') { [bool]$property.Value.baseline_blocking } else { $true }
  $nonBlockingResult = (-not $baselineBlocking) -and @('degraded', 'skipped') -contains $property.Value.result
  if ($property.Value.result -ne 'ready' -and -not $nonBlockingResult) {
    $helperReady = $false
    break
  }
}
$baselineReady = ($toolsReady -and $helperReady)
$gitHealth = if ($Facts.PSObject.Properties.Name -contains 'git_health') { $Facts.git_health } elseif ($Facts.target -and $Facts.target.PSObject.Properties.Name -contains 'git_health') { $Facts.target.git_health } else { $null }
$gitStatus = if ($gitHealth -and $gitHealth.PSObject.Properties.Name -contains 'status') { [string]$gitHealth.status } else { '' }
$parentWorkspaceAdvisory = [ordered]@{
  git_health = $gitHealth
  coverage_gap = if ($Facts.PSObject.Properties.Name -contains 'coverage_gap') { $Facts.coverage_gap } elseif ($Facts.target -and $Facts.target.PSObject.Properties.Name -contains 'coverage_gap') { $Facts.target.coverage_gap } else { $null }
  candidates_diagnostics = if ($Facts.PSObject.Properties.Name -contains 'candidates_diagnostics') { @($Facts.candidates_diagnostics) } elseif ($Facts.target -and $Facts.target.PSObject.Properties.Name -contains 'candidates_diagnostics') { @($Facts.target.candidates_diagnostics) } else { @() }
  repair_action_available = ($gitStatus -eq 'broken-worktree')
  repair_command = if ($gitStatus -eq 'broken-worktree') { 'spec-first repair-worktree --dry-run' } else { $null }
  diagnostic_action_available = ($gitStatus -eq 'corrupted-gitdir')
  diagnostic_command = if ($gitStatus -eq 'corrupted-gitdir') { 'git fsck' } else { $null }
}

$nextActions = New-Object System.Collections.Generic.List[string]
foreach ($action in @($Facts.next_actions)) {
  if (-not [string]::IsNullOrWhiteSpace($action) -and -not $nextActions.Contains($action)) {
    $nextActions.Add($action)
  }
}
foreach ($property in $helperTools.PSObject.Properties) {
  $helperAction = $property.Value.next_action
  $baselineBlocking = if ($property.Value.PSObject.Properties.Name -contains 'baseline_blocking') { [bool]$property.Value.baseline_blocking } else { $true }
  $nonBlockingResult = (-not $baselineBlocking) -and @('degraded', 'skipped') -contains $property.Value.result
  if (-not $nonBlockingResult -and -not [string]::IsNullOrWhiteSpace($helperAction) -and -not $nextActions.Contains($helperAction)) {
    $nextActions.Add($helperAction)
  }
}
if ($GeneratedRuntimeManifest.status -ne 'current' -and -not [string]::IsNullOrWhiteSpace([string]$GeneratedRuntimeManifest.next_action) -and -not $nextActions.Contains([string]$GeneratedRuntimeManifest.next_action)) {
  $nextActions.Add([string]$GeneratedRuntimeManifest.next_action)
}
$factsTargetKind = if ($Facts.PSObject.Properties.Name -contains 'target_kind') { [string]$Facts.target_kind } else { '' }
if ($null -ne $Facts.PSObject.Properties['target'] -and -not [bool]$Facts.target.state_write_allowed -and -not [string]::IsNullOrWhiteSpace([string]$Facts.target.next_action) -and -not $nextActions.Contains([string]$Facts.target.next_action)) {
  $nextActions.Add([string]$Facts.target.next_action)
} elseif ($Facts.repo_status -eq 'not-git-repo' -and $factsTargetKind -ne 'non-git-folder' -and -not $nextActions.Contains('choose a child repo and rerun with --repo <child>')) {
  $nextActions.Add('choose a child repo and rerun with --repo <child>')
}

$providerReadinessById = [ordered]@{}
if ($HelperFacts.PSObject.Properties.Name -contains 'provider_readiness') {
  foreach ($provider in @($HelperFacts.provider_readiness)) {
    if ($null -ne $provider -and $provider.PSObject.Properties.Name -contains 'provider') {
      $providerReadinessById[[string]$provider.provider] = $provider
    }
  }
}
$providerFactsTmp = ''
$previousProviderHostForMcp = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_HOST')
try {
  $providerFactsTmp = Join-Path ([System.IO.Path]::GetTempPath()) ("spec-first-provider-facts.{0}.json" -f ([guid]::NewGuid().ToString('N')))
  $Facts | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $providerFactsTmp
  $env:SPEC_FIRST_PROVIDER_HOST = $reconciliationHost
  $mcpProviderRaw = & node (Join-Path $ScriptDir 'provider-readiness-renderer.cjs') --source mcp --facts-file $providerFactsTmp --repo-root $reconciliationRepoRoot
  if ($null -eq $previousProviderHostForMcp) { Remove-Item env:SPEC_FIRST_PROVIDER_HOST -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_HOST = $previousProviderHostForMcp }
  foreach ($provider in @($mcpProviderRaw | ConvertFrom-Json)) {
    if ($null -ne $provider -and $provider.PSObject.Properties.Name -contains 'provider') {
      $providerReadinessById[[string]$provider.provider] = $provider
    }
  }
  Remove-Item -Force $providerFactsTmp -ErrorAction SilentlyContinue
} catch {
  if ($null -ne $previousProviderHostForMcp) { $env:SPEC_FIRST_PROVIDER_HOST = $previousProviderHostForMcp } else { Remove-Item env:SPEC_FIRST_PROVIDER_HOST -ErrorAction SilentlyContinue }
  if (-not [string]::IsNullOrWhiteSpace($providerFactsTmp)) {
    Remove-Item -Force $providerFactsTmp -ErrorAction SilentlyContinue
  }
}

New-Item -ItemType Directory -Force -Path $MarkerDir | Out-Null
$combined = [ordered]@{
  schema_version = 'v2'
  host = $Facts.host
  platform = $Facts.platform
  repo_root = $Facts.repo_root
  repo_status = $Facts.repo_status
  target = $Facts.target
  target_mode = $Facts.target_mode
  target_kind = $factsTargetKind
  workspace_root = $Facts.workspace_root
  selected_repo_root = $Facts.selected_repo_root
  selected_folder_root = if ($null -ne $Facts.PSObject.Properties['target']) { $Facts.target.selected_folder_root } else { $null }
  target_root = if ($null -ne $Facts.PSObject.Properties['target']) { $Facts.target.target_root } else { $Facts.repo_root }
  parent_workspace_advisory = $parentWorkspaceAdvisory
  target_candidate_count = $Facts.target_candidate_count
  target_candidates = @($Facts.target_candidates)
  reason_code = $Facts.reason_code
  host_ledger_pointer = [ordered]@{
    host = $Facts.host
    path = $MarkerPath
    schema_version = 'v2'
  }
  host_pointer_reconciliation = $HostPointerReconciliation
  generated_runtime_manifest = $GeneratedRuntimeManifest
  tool_facts_status = 'pending'
  tool_facts_path = $null
  runtime_capabilities_status = 'pending'
  runtime_capabilities_path = $null
  overall_status = if ($baselineReady) { 'ready' } else { 'action-required' }
  baseline_ready = [bool]$baselineReady
  host_runtime_ready = [bool]$baselineReady
  completed_at = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  tools = $Facts.tools
  helper_tools = $helperTools
  provider_readiness = @($providerReadinessById.Values)
  mirror_endpoints = if ($HelperFacts.PSObject.Properties.Name -contains 'mirror_endpoints') { $HelperFacts.mirror_endpoints } else { $null }
  recommended_environment_variables = if ($HelperFacts.PSObject.Properties.Name -contains 'recommended_environment_variables') { $HelperFacts.recommended_environment_variables } else { $null }
  next_actions = @($nextActions)
}

$combinedTmp = Join-Path $MarkerDir ("readiness-ledger-combined.{0}.tmp" -f ([guid]::NewGuid().ToString('N')))
$finalTmp = Join-Path $MarkerDir ("readiness-ledger.{0}.tmp" -f ([guid]::NewGuid().ToString('N')))
$combined | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $combinedTmp

$setupFactsResult = & (Join-Path $ScriptDir 'write-setup-facts.ps1') -FactsFile $combinedTmp | ConvertFrom-Json
$combined.tool_facts_status = $setupFactsResult.tool_facts_status
$combined.tool_facts_path = $setupFactsResult.tool_facts_path
$combined.runtime_capabilities_status = if ($setupFactsResult.PSObject.Properties.Name -contains 'runtime_capabilities_status') { $setupFactsResult.runtime_capabilities_status } else { 'unknown' }
$combined.runtime_capabilities_path = if ($setupFactsResult.PSObject.Properties.Name -contains 'runtime_capabilities_path') { $setupFactsResult.runtime_capabilities_path } else { $null }
$toolFactsPayload = if (-not [string]::IsNullOrWhiteSpace([string]$combined.tool_facts_path)) { Read-JsonObjectOrNull -Path ([string]$combined.tool_facts_path) } else { $null }
$combined['provider_readiness'] = if ($toolFactsPayload -and $toolFactsPayload.PSObject.Properties.Name -contains 'provider_readiness') { @($toolFactsPayload.provider_readiness) } else { @() }
$combined['configured_dependencies'] = if ($toolFactsPayload -and $toolFactsPayload.PSObject.Properties.Name -contains 'configured_dependencies') { @($toolFactsPayload.configured_dependencies) } else { @() }
$setupActionRequired = @(@($combined.tool_facts_status, $combined.runtime_capabilities_status) | Where-Object { $_ -ne 'ready' -and $_ -ne 'written' })
if (@($setupActionRequired).Count -gt 0) {
  $combined.baseline_ready = $false
  $combined.overall_status = 'action-required'
}
$runtimeManifestStatus = if ($combined.generated_runtime_manifest -is [System.Collections.IDictionary] -and $combined.generated_runtime_manifest.Contains('status')) {
  [string]$combined.generated_runtime_manifest['status']
} else {
  [string]$combined.generated_runtime_manifest.status
}
$runtimeManifestActionRequired = @('stale', 'missing') -contains $runtimeManifestStatus
$combined.host_runtime_ready = ([bool]$combined.baseline_ready -and -not $runtimeManifestActionRequired)
if ($runtimeManifestActionRequired) {
  $combined.overall_status = 'action-required'
  $combined.reason_code = 'generated-runtime-manifest-refresh-required'
}
$filteredNextActions = New-Object System.Collections.Generic.List[string]
$nonBlockingHelperActions = New-Object System.Collections.Generic.List[string]
foreach ($property in $combined.helper_tools.PSObject.Properties) {
  $helper = $property.Value
  $baselineBlocking = if ($helper.PSObject.Properties.Name -contains 'baseline_blocking') { [bool]$helper.baseline_blocking } else { $true }
  if ((-not $baselineBlocking) -and @('degraded', 'skipped') -contains $helper.result -and -not [string]::IsNullOrWhiteSpace([string]$helper.next_action)) {
    $nonBlockingHelperActions.Add([string]$helper.next_action)
  }
}
foreach ($action in @($combined.next_actions)) {
  if (
    -not [string]::IsNullOrWhiteSpace($action) -and
    -not $nonBlockingHelperActions.Contains([string]$action) -and
    -not $filteredNextActions.Contains($action)
  ) {
    $filteredNextActions.Add($action)
  }
}
if ($null -ne $combined.target -and -not [bool]$combined.target.state_write_allowed -and -not [string]::IsNullOrWhiteSpace([string]$combined.target.next_action) -and -not $filteredNextActions.Contains([string]$combined.target.next_action)) {
  $filteredNextActions.Add([string]$combined.target.next_action)
} elseif ($combined.repo_status -eq 'not-git-repo' -and [string]$combined.target_kind -ne 'non-git-folder' -and -not $filteredNextActions.Contains('choose a child repo and rerun with --repo <child>')) {
  $filteredNextActions.Add('choose a child repo and rerun with --repo <child>')
}
$combined.next_actions = @($filteredNextActions)

$combined | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $finalTmp
Move-Item -Force $finalTmp $MarkerPath
Remove-Item -Force $combinedTmp -ErrorAction SilentlyContinue
Write-SetupScenarioFingerprint -Ledger $combined -LedgerPath $MarkerPath

function Format-Cell {
  param([object]$Value)
  if ($null -eq $Value) { return 'n/a' }
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return 'n/a' }
  if ($text -eq 'not-applicable') { return 'n/a' }
  if ($text -eq 'fallback-active') { return 'fallback' }
  return $text
}

function Format-Required {
  param([object]$Value)
  if ($null -eq $Value) { return 'n/a' }
  if ([bool]$Value) { return 'yes' }
  return 'no'
}

function Get-Field {
  param(
    [AllowNull()][object]$InputObject,
    [string]$Name,
    [object]$Default = ''
  )
  if ($null -eq $InputObject) { return $Default }
  if ($InputObject -is [System.Collections.IDictionary] -and $InputObject.Contains($Name)) {
    return $InputObject[$Name]
  }
  if ($InputObject.PSObject.Properties.Name -contains $Name) {
    $value = $InputObject.PSObject.Properties[$Name].Value
    if ($null -ne $value) { return $value }
  }
  return $Default
}

function Format-ToolRow13 {
  param(
    [string]$Id,
    [object]$Tool,
    [string]$KindFallback
  )
  $kind = Get-Field -InputObject $Tool -Name 'kind' -Default (Get-Field -InputObject $Tool -Name 'type' -Default $KindFallback)
  $dependency = Get-Field -InputObject $Tool -Name 'dependency_status' -Default (Get-Field -InputObject $Tool -Name 'status' -Default 'unknown')
  $configured = Get-Field -InputObject $Tool -Name 'configured_status' -Default (Get-Field -InputObject $Tool -Name 'host_config_status' -Default 'not-applicable')
  $result = Get-Field -InputObject $Tool -Name 'result' -Default (Get-Field -InputObject $Tool -Name 'status' -Default 'unknown')
  return @(
    (Format-Cell $Id),
    (Format-Cell $kind),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'profile' -Default 'minimal')),
    (Format-Required (Get-Field -InputObject $Tool -Name 'required' -Default $true)),
    (Format-Required (Get-Field -InputObject $Tool -Name 'baseline_blocking' -Default $true)),
    (Format-Cell $dependency),
    (Format-Cell $configured),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'allowed' -Default 'not-applicable')),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'install_status' -Default 'not-applicable')),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'safety' -Default 'not-checked')),
    (Format-Cell $result),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'reason_code' -Default 'unknown')),
    (Format-Cell (Get-Field -InputObject $Tool -Name 'next_action' -Default ''))
  )
}

function Format-Remark {
  param([string]$Name)
  switch ($Name) {
    'sequential-thinking' { return '反思式推理辅助' }
    'context7' { return '当前框架和库文档' }
    'agent-browser' { return '浏览器自动化辅助' }
    'gh' { return 'GitHub issue 和 PR 操作' }
    'jq' { return 'JSON 解析与转换' }
    'vhs' { return '终端演示录制' }
    'silicon' { return '代码截图渲染' }
    'ffmpeg' { return '媒体转换与视频合成' }
    'ast-grep' { return '结构化代码搜索和重写' }
    'ast-grep-skill' { return 'ast-grep 使用指引' }
    'tool-facts.json' { return '记录 setup-owned 工具事实' }
    'runtime-capabilities.json' { return '记录 setup-owned 能力事实和 host ledger 指针' }
    default { return 'MCP 工具' }
  }
}

function Write-StatusBlock {
  param([object[]]$Sections)

  $payload = [ordered]@{
    sections = @($Sections)
  }

  $json = $payload | ConvertTo-Json -Depth 10
  $json | & node (Join-Path $ScriptDir 'render-status-block.cjs')
  if ($LASTEXITCODE -ne 0) {
    throw "render-status-block.cjs failed with exit code $LASTEXITCODE"
  }
}

Write-Host "📝 宿主就绪标记已更新: $MarkerPath"
Write-Host "🔎 当前宿主基线状态: $($combined.overall_status)"
Write-Host "🧭 baseline_ready: $($combined.baseline_ready)"
Write-Host '🧩 代码上下文证据使用 bounded direct source reads、rg、ast-grep、git diff、tests/logs。'
Write-Host '✅ readiness ledger v2 已写入'
Write-Host ''
Write-Host 'Setup readiness status (grouped):'
$harnessNext = if ($combined.baseline_ready) { '' } else { 'fix action-required rows' }
$manifest = $combined.generated_runtime_manifest
$manifestEvidence = 'state.manifestVersion={0}, bundled={1}' -f `
  (Format-Cell (Get-Field -InputObject $manifest -Name 'recorded_manifest_version' -Default 'missing')), `
  (Format-Cell (Get-Field -InputObject $manifest -Name 'bundled_manifest_version' -Default 'unknown'))
$summaryRows = @(
  ,@(
    'Required MCP/helper dependencies',
    $(if ($combined.baseline_ready) { 'ready' } else { 'action-required' }),
    "baseline_ready=$($combined.baseline_ready.ToString().ToLowerInvariant())",
    $harnessNext
  ),
  ,@(
    'Generated runtime manifest',
    (Format-Cell (Get-Field -InputObject $manifest -Name 'status' -Default 'unknown')),
    $manifestEvidence,
    (Format-Cell (Get-Field -InputObject $manifest -Name 'next_action' -Default ''))
  )
)

$mcpRows = @(
  foreach ($property in $combined.tools.PSObject.Properties) {
    $tool = $property.Value
    if ($tool.type -ne 'mcp') {
      continue
    }

    ,(Format-ToolRow13 -Id $property.Name -Tool $tool -KindFallback 'mcp')
  }
)

$helperRows = @(
  foreach ($property in $combined.helper_tools.PSObject.Properties) {
    $helper = $property.Value
    ,@(
      (Format-ToolRow13 -Id $property.Name -Tool $helper -KindFallback 'helper')
    )
  }
)

$providerRows = @(
  foreach ($provider in @($combined.provider_readiness)) {
    ,@(
      (Format-Cell (Get-Field -InputObject $provider -Name 'provider' -Default 'unknown')),
      (Format-Cell (Get-Field -InputObject $provider -Name 'kind' -Default 'generic')),
      (Format-Cell (Get-Field -InputObject $provider -Name 'profile' -Default 'minimal')),
      (Format-Cell (Get-Field -InputObject $provider -Name 'readiness_status' -Default 'unknown')),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('lifecycle', 'installed'))),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('lifecycle', 'configured'))),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('lifecycle', 'indexed'))),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('lifecycle', 'server_reachable'))),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('lifecycle', 'query_verified'))),
      (Format-Cell (Get-Field -InputObject $provider -Name 'repo_aligned' -Default 'unknown')),
      (Format-Cell (Get-NestedValue -InputObject $provider -PathParts @('fallback', 'reason_code'))),
      (Format-Cell ((@((Get-Field -InputObject $provider -Name 'next_actions' -Default @())) | ForEach-Object { [string]$_ }) -join '; '))
    )
  }
)

$configuredDependencyRows = @(
  foreach ($dependency in @($combined.configured_dependencies)) {
    ,@(
      (Format-Cell (Get-Field -InputObject $dependency -Name 'id')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'kind')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'source_path')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'command')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'args_shape')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'declared_tool_id')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'declared_status')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'dependency_status')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'configured_status')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'result')),
      (Format-Cell (Get-Field -InputObject $dependency -Name 'reason_code'))
    )
  }
)

$installSafetyRows = @(
  foreach ($property in $combined.helper_tools.PSObject.Properties) {
    $helper = $property.Value
    ,@(
      (Format-Cell $property.Name),
      (Format-Cell (Get-Field -InputObject $helper -Name 'safety' -Default 'not-checked')),
      (Format-Cell (Get-Field -InputObject $helper -Name 'install_source')),
      (Format-Cell (Get-Field -InputObject $helper -Name 'mirror_used' -Default $false)),
      (Format-Cell (Get-Field -InputObject $helper -Name 'next_action'))
    )
  }
)

$targetNext = if ($null -ne $combined.target -and -not [string]::IsNullOrWhiteSpace([string]$combined.target.next_action)) { [string]$combined.target.next_action } else { '' }
$toolFactsNext = if ($combined.tool_facts_status -eq 'ready' -or $combined.tool_facts_status -eq 'written') { '' } elseif (-not [string]::IsNullOrWhiteSpace($targetNext)) { $targetNext } else { 'write setup facts' }
$runtimeNext = if ($combined.runtime_capabilities_status -eq 'ready' -or $combined.runtime_capabilities_status -eq 'written') { '' } elseif (-not [string]::IsNullOrWhiteSpace($targetNext)) { $targetNext } else { 'write runtime capabilities' }

$sections = @(
  [ordered]@{
    title = 'Execution result'
    headers = @('Area', 'Status', 'Evidence', 'Next')
    rows = $summaryRows
  }
  [ordered]@{
    title = 'MCP servers'
    headers = @('id', 'kind', 'profile', 'required', 'baseline_blocking', 'dependency', 'configured', 'allowed', 'install', 'safety', 'result', 'reason_code', 'next_action')
    rows = $mcpRows
  }
  [ordered]@{
    title = 'Helper tools'
    headers = @('id', 'kind', 'profile', 'required', 'baseline_blocking', 'dependency', 'configured', 'allowed', 'install', 'safety', 'result', 'reason_code', 'next_action')
    rows = $helperRows
  }
  [ordered]@{
    title = 'Provider tools'
    headers = @('provider', 'kind', 'profile', 'readiness', 'installed', 'configured', 'indexed', 'server_reachable', 'query_verified', 'repo_aligned', 'fallback_reason', 'next_actions')
    rows = $providerRows
  }
  [ordered]@{
    title = 'Host configured dependencies'
    headers = @('id', 'kind', 'source_path', 'command', 'args_shape', 'declared_tool_id', 'declared_status', 'dependency', 'configured', 'result', 'reason_code')
    rows = $configuredDependencyRows
  }
  [ordered]@{
    title = 'Install safety'
    headers = @('id', 'safety', 'install_source', 'mirror_used', 'next_action')
    rows = $installSafetyRows
  }
  [ordered]@{
    title = 'Project setup facts'
    headers = @('Artifact', 'Project', 'Next')
    rows = @(
      @('tool-facts.json', (Format-Cell $combined.tool_facts_status), (Format-Cell $toolFactsNext)),
      @('runtime-capabilities.json', (Format-Cell $combined.runtime_capabilities_status), (Format-Cell $runtimeNext))
    )
  }
  [ordered]@{
    title = 'Verification profile'
    headers = @('Artifact', 'Status', 'Next')
    rows = @(,@('spec-first.verification.json', 'not-checked', 'v1.13 scope'))
  }
  [ordered]@{
    title = 'Next steps'
    headers = @('#', 'Action')
    rows = @(
      for ($i = 0; $i -lt @($combined.next_actions).Count; $i += 1) {
        ,@([string]($i + 1), (Format-Cell @($combined.next_actions)[$i]))
      }
    )
  }
)

Write-StatusBlock -Sections $sections

switch ($combined.host) {
  'claude' {
    $hostDisplay = 'Claude Code'
    $setupCommand = '/spec:mcp-setup'
  }
  'codex' {
    $hostDisplay = 'Codex'
    $setupCommand = '$spec-mcp-setup'
  }
  'kiro' {
    $hostDisplay = 'Kiro'
    $setupCommand = 'Kiro Agent Skill spec-mcp-setup'
  }
  'qoder' {
    $hostDisplay = 'Qoder'
    $setupCommand = 'Qoder project command /spec:mcp-setup or Skill spec-mcp-setup'
  }
  default {
    $hostDisplay = 'Claude Code / Codex'
    $setupCommand = '/spec:mcp-setup or $spec-mcp-setup'
  }
}

Write-Host ''
Write-Host '下一步:'
if ($combined.baseline_ready) {
  $targetStateWriteAllowed = if ($null -ne $combined.target) { [bool]$combined.target.state_write_allowed } else { $true }
  $targetNextAction = if ($null -ne $combined.target) { [string]$combined.target.next_action } else { '' }
  $manifestStatus = [string](Get-Field -InputObject $combined.generated_runtime_manifest -Name 'status' -Default 'unknown')
  $manifestNextAction = [string](Get-Field -InputObject $combined.generated_runtime_manifest -Name 'next_action' -Default '')
  if (-not $targetStateWriteAllowed) {
    Write-Host "  1. 选择目标 child repo，并用 --repo 重新运行 $setupCommand。"
    if (-not [string]::IsNullOrWhiteSpace($targetNextAction)) {
      Write-Host "     $targetNextAction"
    }
  } elseif ($manifestStatus -ne 'current' -and -not [string]::IsNullOrWhiteSpace($manifestNextAction)) {
    Write-Host "  1. Required MCP/helper dependencies 已就绪；generated runtime manifest 为 $manifestStatus。"
    Write-Host "  2. 运行 $manifestNextAction 刷新 runtime，然后重新运行 $setupCommand。"
  } else {
    Write-Host '  1. Required MCP/helper dependencies 与 generated runtime manifest 均已就绪；如果已经有明确任务，可以直接描述目标，或选择匹配的 plan/work/review/debug workflow。'
    Write-Host "  2. 重启 $hostDisplay 或新开会话只在下游 workflow 依赖新写入的 MCP 配置前需要。"
  }
} else {
  Write-Host "  1. 先处理表格中的 action-required 行，然后重新运行 $setupCommand。"
  Write-Host "  2. 全部 ready 后重启 $hostDisplay 或新开会话，让新写入的 MCP 配置被宿主加载。"
}
