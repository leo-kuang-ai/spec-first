param(
  [string]$Only,
  [string]$Repo = '',
  [string]$Folder = '',
  [switch]$AllRepos,
  [switch]$Plan,
  [switch]$Refresh,
  [switch]$UserScope,
  [string]$RequirementWorkspace = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
. (Join-Path $ScriptDir 'lib-template.ps1')
if ($UserScope) {
  $env:KIRO_USER_SCOPE = '1'
  $env:QODER_USER_SCOPE = '1'
  $env:CURSOR_USER_SCOPE = '1'
}
if ($env:MCP_SETUP_HOST -notin @('claude', 'codex', 'kiro', 'qoder', 'cursor')) {
  throw '错误：install/configure/uninstall 写入宿主 MCP 配置必须显式设置 MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor；不会根据 PATH、环境变量或历史 facts 推断 mutation target。'
}
$ToolsJsonPath = Join-Path $SkillDir 'mcp-tools.json'
$ProviderToolsJsonPath = Join-Path $SkillDir 'provider-tools.json'
$ToolsJson = Read-McpToolsJson -Path $ToolsJsonPath
$ProviderToolsJson = Get-Content -Raw -LiteralPath $ProviderToolsJsonPath | ConvertFrom-Json
Assert-McpToolsSchemaVersion -ToolsJson $ToolsJson
$HostInfo = & (Join-Path $ScriptDir 'detect-host.ps1') | ConvertFrom-Json
$DetectedHost = $HostInfo.host
$HostDisplayName = $HostInfo.display_name
$Platform = $HostInfo.platform

function Get-NonNegativeIntEnv {
  param(
    [string]$Name,
    [int]$Default
  )
  $raw = [Environment]::GetEnvironmentVariable($Name)
  [int]$parsed = 0
  if ([int]::TryParse($raw, [ref]$parsed) -and $parsed -ge 0) { return $parsed }
  return $Default
}

$script:StageTimeoutSeconds = Get-NonNegativeIntEnv -Name 'SPEC_FIRST_STAGE_TIMEOUT_SECONDS' -Default 900
$script:WarmupCacheRoot = if (-not [string]::IsNullOrWhiteSpace($env:SPEC_FIRST_WARMUP_CACHE_DIR)) { $env:SPEC_FIRST_WARMUP_CACHE_DIR } else { '' }
$script:WarmupLatestTtlSeconds = Get-NonNegativeIntEnv -Name 'SPEC_FIRST_WARMUP_LATEST_TTL_SECONDS' -Default 86400
$resolverParams = @{ Format = 'json' }
if (-not $AllRepos -and -not [string]::IsNullOrWhiteSpace($Repo)) { $resolverParams.Repo = $Repo }
if (-not $AllRepos -and -not [string]::IsNullOrWhiteSpace($Folder)) { $resolverParams.Folder = $Folder }
if (-not [string]::IsNullOrWhiteSpace($Repo) -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'install-mcp.ps1: use either -Repo or -Folder, not both'
}
if ($AllRepos -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'install-mcp.ps1: use either -AllRepos or -Folder, not both'
}
$TargetFacts = (& (Join-Path $ScriptDir 'resolve-project-target.ps1') @resolverParams) | ConvertFrom-Json
$ResolvedRepoRoot = if (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.target_root)) {
  [string]$TargetFacts.target_root
} elseif (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.selected_repo_root)) {
  [string]$TargetFacts.selected_repo_root
} elseif (-not [string]::IsNullOrWhiteSpace([string]$TargetFacts.selected_folder_root)) {
  [string]$TargetFacts.selected_folder_root
} else {
  [string]$TargetFacts.workspace_root
}
if ([string]::IsNullOrWhiteSpace($script:WarmupCacheRoot)) {
  $script:WarmupCacheRoot = [System.IO.Path]::Combine($ResolvedRepoRoot, '.spec-first', 'cache', 'mcp-warmup')
}
if ([string]::IsNullOrWhiteSpace($env:NPM_CONFIG_CACHE) -and [string]::IsNullOrWhiteSpace($env:npm_config_cache)) {
  $workspaceNpmCache = [System.IO.Path]::Combine($ResolvedRepoRoot, '.spec-first', 'cache', 'npm')
  $env:NPM_CONFIG_CACHE = $workspaceNpmCache
  $env:npm_config_cache = $workspaceNpmCache
}

if ($Plan) {
  $planArgs = @('--mode', 'plan', '--repo-root', $ResolvedRepoRoot)
  if (-not [string]::IsNullOrWhiteSpace($Only)) { $planArgs += @('--only', $Only) }
  if (-not [string]::IsNullOrWhiteSpace($RequirementWorkspace)) { $planArgs += @('--requirement-workspace', $RequirementWorkspace) }
  & node (Join-Path $ScriptDir 'setup-plan-renderer.cjs') @planArgs
  exit $LASTEXITCODE
}

function Parse-List {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return @() }
  @($Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
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

function Invoke-ChildJsonScript {
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

  $diagnosticParts = @($stderrText, $informationText, $exceptionText) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
  [pscustomobject]@{
    stdout = ($stdout -join "`n")
    stderr = $stderrText
    information = $informationText
    diagnostic = ($diagnosticParts -join "`n").Trim()
    exit_code = $exitCode
  }
}

function Write-WorkspaceMcpSetupSummaryAndExit {
  param(
    [object]$TargetFacts,
    [string]$SelectionSource = 'explicit-all-repos'
  )

  $workspaceRoot = [string]$TargetFacts.workspace_root
  if (-not [string]::IsNullOrWhiteSpace($Repo)) {
    [pscustomobject]@{
      schema_version = 'workspace-mcp-setup-summary.v1'
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
      schema_version = 'workspace-mcp-setup-summary.v1'
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
      schema_version = 'workspace-mcp-setup-summary.v1'
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
    $childParams = @{ Repo = [string]$child.workspace_relative_path }
    if (-not [string]::IsNullOrWhiteSpace($Only)) { $childParams.Only = $Only }
    if ($Refresh) { $childParams.Refresh = $true }
    if (-not [string]::IsNullOrWhiteSpace($RequirementWorkspace)) { $childParams.RequirementWorkspace = $RequirementWorkspace }
    $childRun = Invoke-ChildJsonScript -ScriptPath $PSCommandPath -Arguments $childParams
    $childStatus = [int]$childRun.exit_code
    $childText = [string]$childRun.stdout
    try {
      $childResult = $childText | ConvertFrom-Json
    } catch {
      $diagnostic = (@($childText, [string]$childRun.diagnostic) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }) -join "`n"
      $childResult = [pscustomobject]@{ host = 'unknown'; display_name = 'unknown'; platform = 'unknown'; results = @(); diagnostic = $diagnostic }
    }
    $childResults = @($childResult.results)
    $providerApplyStatus = if ($null -ne $childResult.provider_apply) { [string]$childResult.provider_apply.status } else { '' }
    $providerApplyReason = if ($null -ne $childResult.provider_apply) { [string]$childResult.provider_apply.reason_code } else { '' }
    $childOverall = if ($childStatus -ne 0) {
      'action-required'
    } elseif (@($childResults | Where-Object { $_.status -eq 'action-required' }).Count -gt 0) {
      'action-required'
    } elseif ($providerApplyStatus -eq 'action-required') {
      'action-required'
    } elseif (@($childResults | Where-Object { $_.status -ne 'ready' }).Count -gt 0) {
      'partial'
    } elseif ($childResults.Count -eq 0 -and $providerApplyStatus -eq 'ready') {
      'ready'
    } elseif ($childResults.Count -eq 0) {
      'action-required'
    } else {
      'ready'
    }
    $childReason = @($childResults | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_.reason_code) } | Select-Object -First 1 | ForEach-Object { [string]$_.reason_code })
    if ($childReason.Count -eq 0 -and -not [string]::IsNullOrWhiteSpace($providerApplyReason)) {
      $childReason = @($providerApplyReason)
    }
    $results += [pscustomobject][ordered]@{
      repo_label = [string]$child.repo_label
      workspace_relative_path = [string]$child.workspace_relative_path
      exit_code = $childStatus
      overall_status = $childOverall
      reason_code = if ($childReason.Count -gt 0) { $childReason[0] } else { $null }
      result = $childResult
    }
  }

  $readyCount = @($results | Where-Object { $_.overall_status -eq 'ready' }).Count
  $partialCount = @($results | Where-Object { $_.overall_status -eq 'partial' }).Count
  $actionRequiredCount = @($results | Where-Object { $_.overall_status -eq 'action-required' }).Count
  $overallStatus = if ($results.Count -eq 0) { 'action-required' } elseif ($actionRequiredCount -gt 0 -and ($readyCount + $partialCount) -eq 0) { 'action-required' } elseif (($partialCount + $actionRequiredCount) -gt 0) { 'partial' } else { 'ready' }
  $summary = [ordered]@{
    schema_version = 'workspace-mcp-setup-summary.v1'
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
      partial = $partialCount
      action_required = $actionRequiredCount
    }
    overall_status = $overallStatus
    reason_code = if (($partialCount + $actionRequiredCount) -eq 0) { $null } else { 'all-repos-partial-or-action-required' }
    next_action = if (($partialCount + $actionRequiredCount) -gt 0) { 'Inspect per-child reason_code and rerun setup for action-required repos.' } else { 'All child repos completed MCP setup.' }
  }

  try {
    Write-JsonFileAtomic -Path (Join-Path $workspaceRoot '.spec-first/workspace/mcp-setup-summary.json') -Payload ([pscustomobject]$summary) -Depth 30
  } catch {
    [pscustomobject]@{
      schema_version = 'workspace-mcp-setup-summary.v1'
      overall_status = 'action-required'
      workflow_mode = 'blocked'
      reason_code = 'workspace-summary-symlink-escape'
      workspace_root = $workspaceRoot
      advisory = $true
      next_action = 'Replace symlinked .spec-first/workspace with a real workspace-local directory and rerun setup.'
    } | ConvertTo-Json -Compress
    exit 1
  }
  [pscustomobject]$summary | ConvertTo-Json -Depth 30 -Compress
  if ($overallStatus -ne 'ready') { exit 1 }
  exit 0
}

$OnlyArray = @(Parse-List $Only)

function Test-SelectionContains {
  param([string]$Id)
  return ($OnlyArray -contains $Id)
}

function Assert-OnlyFilterKnown {
  if ($OnlyArray.Count -eq 0) { return }
  $validIds = @($ToolsJson.tools | ForEach-Object { [string]$_.id }) + @($ProviderToolsJson.providers | ForEach-Object { [string]$_.id })
  $unknown = @($OnlyArray | Where-Object { $validIds -notcontains $_ })
  if ($unknown.Count -eq 0) { return }
  [pscustomobject]@{
    host = $DetectedHost
    display_name = $HostDisplayName
    platform = $Platform
    results = @()
    overall_status = 'action-required'
    reason_code = 'unknown-optional-provider-selection'
    unknown_ids = @($unknown)
    next_action = 'Use one of: codegraph,graphify'
  } | ConvertTo-Json -Compress
  exit 1
}

Assert-OnlyFilterKnown

if ($AllRepos) {
  Write-WorkspaceMcpSetupSummaryAndExit -TargetFacts $TargetFacts -SelectionSource 'explicit-all-repos'
}

$defaultChildren = @($TargetFacts.candidates)
if (-not $AllRepos -and [string]::IsNullOrWhiteSpace($Repo) -and $TargetFacts.mode -ne 'git-repo' -and $defaultChildren.Count -gt 0) {
  Write-WorkspaceMcpSetupSummaryAndExit -TargetFacts $TargetFacts -SelectionSource 'workspace-default-all-repos'
}

function Should-Install {
  param([object]$Tool)
  if ($OnlyArray.Count -gt 0) { return $OnlyArray -contains $Tool.id }
  return $true
}

function Test-OptionalToolAllowed {
  param([object]$Tool)
  if ([bool]$Tool.required) { return $true }
  if ($OnlyArray.Count -eq 0) { return $false }
  if ($null -eq $Tool.PSObject.Properties['opt_in']) { return $false }
  if ($null -eq $Tool.opt_in.PSObject.Properties['explicit_consent_required']) { return $false }
  return [bool]$Tool.opt_in.explicit_consent_required
}

function Get-ProjectBootstrapState {
  param([object]$Tool)
  if ($null -eq $Tool.PSObject.Properties['project_bootstrap']) { return 'not-applicable' }
  if ($Tool.project_bootstrap.kind -eq 'none' -or -not [bool]$Tool.project_bootstrap.required) {
    return 'not-applicable'
  }
  if (-not [bool]$TargetFacts.state_write_allowed) {
    return 'target-action-required'
  }
  $projectFile = [string]$Tool.project_bootstrap.project_file
  if (-not [string]::IsNullOrWhiteSpace($projectFile) -and (Test-Path -LiteralPath (Join-Path $ResolvedRepoRoot $projectFile) -PathType Leaf)) {
    return 'ready'
  }
  return 'pending'
}

function Get-Sha256Hex {
  param([string]$Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-WarmupCommandHash {
  param(
    [string]$Command,
    [string[]]$Arguments
  )
  $payload = New-Object System.Text.StringBuilder
  [void]$payload.AppendLine("command=$Command")
  foreach ($argument in @($Arguments)) {
    [void]$payload.AppendLine("arg=$argument")
  }
  Get-Sha256Hex -Text $payload.ToString()
}

function Get-WarmupCachePath {
  param([object]$Tool)
  [System.IO.Path]::Combine($script:WarmupCacheRoot, [string]$DetectedHost, [string]$Platform, "$($Tool.id).json")
}

function Get-WarmupCacheTtlSeconds {
  param(
    [string]$Command,
    [string[]]$Arguments
  )
  $joined = (@($Command) + @($Arguments)) -join ' '
  if ($joined.Contains('@latest') -or $joined.Contains(' --upgrade ')) {
    return $script:WarmupLatestTtlSeconds
  }
  0
}

function Test-WarmupCacheHit {
  param(
    [object]$Tool,
    [string]$CommandHash,
    [int]$TtlSeconds
  )
  if ($env:SPEC_FIRST_FORCE_WARMUP -eq '1' -or $env:SPEC_FIRST_DISABLE_WARMUP_CACHE -eq '1') { return $false }
  $cachePath = Get-WarmupCachePath -Tool $Tool
  if (-not (Test-Path -LiteralPath $cachePath -PathType Leaf)) { return $false }
  try {
    $cache = Get-Content -Raw $cachePath | ConvertFrom-Json
  } catch {
    return $false
  }
  if ([string](Get-ToolField -Tool $cache -Name 'schema_version') -ne 'mcp-warmup-cache.v1') { return $false }
  if ([string](Get-ToolField -Tool $cache -Name 'tool_id') -ne [string]$Tool.id) { return $false }
  if ([string](Get-ToolField -Tool $cache -Name 'host') -ne [string]$DetectedHost) { return $false }
  if ([string](Get-ToolField -Tool $cache -Name 'platform') -ne [string]$Platform) { return $false }
  if ([string](Get-ToolField -Tool $cache -Name 'command_hash') -ne [string]$CommandHash) { return $false }
  [int]$exitCode = 1
  $exitCodeValue = Get-ToolField -Tool $cache -Name 'exit_code'
  if (-not [int]::TryParse([string]$exitCodeValue, [ref]$exitCode)) { return $false }
  if ($exitCode -ne 0) { return $false }
  if ($TtlSeconds -gt 0) {
    [int64]$lastSuccessEpoch = 0
    $lastSuccessEpochValue = Get-ToolField -Tool $cache -Name 'last_success_epoch'
    if ($null -ne $lastSuccessEpochValue) {
      if (-not [int64]::TryParse([string]$lastSuccessEpochValue, [ref]$lastSuccessEpoch)) { return $false }
    }
    $now = [int64]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
    if (($lastSuccessEpoch + $TtlSeconds) -lt $now) { return $false }
  }
  $true
}

function Write-WarmupCache {
  param(
    [object]$Tool,
    [string]$Command,
    [string[]]$Arguments,
    [string]$CommandHash
  )
  $tmp = $null
  try {
    $cachePath = Get-WarmupCachePath -Tool $Tool
    $cacheDir = Split-Path -Parent $cachePath
    if (-not (Test-Path -LiteralPath $cacheDir)) {
      New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
    }
    $packageSpec = ''
    if ($null -ne $Tool.PSObject.Properties['package'] -and $null -ne $Tool.PSObject.Properties['version']) {
      if (-not [string]::IsNullOrWhiteSpace([string]$Tool.package) -and -not [string]::IsNullOrWhiteSpace([string]$Tool.version)) {
        $packageSpec = "$($Tool.package)@$($Tool.version)"
      }
    }
    $tmp = '{0}.{1}.tmp' -f $cachePath, ([guid]::NewGuid().ToString('N'))
    [ordered]@{
      schema_version = 'mcp-warmup-cache.v1'
      tool_id = $Tool.id
      host = $DetectedHost
      platform = $Platform
      command = $Command
      args = @($Arguments)
      command_hash = $CommandHash
      package_spec = $packageSpec
      last_success_at = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
      last_success_epoch = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      exit_code = 0
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath $tmp
    Move-Item -Force -LiteralPath $tmp -Destination $cachePath
  } catch {
    if (-not [string]::IsNullOrWhiteSpace([string]$tmp)) {
      Remove-Item -Force -LiteralPath $tmp -ErrorAction SilentlyContinue
    }
  }
}

function Redact-Diagnostic {
  param([string]$Value)
  $text = [string]$Value
  $text = $text -replace '(?i)(https?://[^:/\s?]+):[^@\s/?]+@', '$1:<redacted>@'
  $text = $text -replace '(?i)([?&](?:token|access_token|api[_-]?key|key|secret|password)=)[^&\s]+', '$1<redacted>'
  $text = $text -replace '(?i)(authorization\s*:\s*(?:Bearer|Basic)\s+)[^,;\s]+', '$1<redacted>'
  $text = $text -replace '(?i)\b(Bearer|Basic)\s+[A-Za-z0-9._~+/\-]+=*', '$1 <redacted>'
  $text = $text -replace '(?i)\b((?:authorization|api[_-]?key|access[_-]?token|token|secret|password)\s*[:=]\s*)[^,;\s]+', '$1<redacted>'
  $text = $text -replace '(?i)(--?(?:token|api-key|api_key|secret|password|access-token|access_token)(?:=|\s+))\S+', '$1<redacted>'
  return $text
}

function Invoke-Captured {
  param(
    [scriptblock]$Script,
    [int]$Limit = 1000
  )

  $output = New-Object System.Collections.Generic.List[string]
  $exitCode = 0
  $captured = @()
  try {
    $global:LASTEXITCODE = 0
    $captured = & $Script 2>&1
    if ($null -ne $captured) {
      foreach ($line in @($captured)) {
        $output.Add([string]$line)
      }
    }
    if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) {
      $exitCode = $LASTEXITCODE
      throw "Command exited with code $exitCode"
    }
  } catch {
    if ($exitCode -eq 0) {
      $exitCode = if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) { $LASTEXITCODE } else { 1 }
    }
    $output.Add([string]$_.Exception.Message)
    $summary = Redact-Diagnostic ((($output -join ' ') -replace '\s+', ' ').Trim())
    if ($summary.Length -gt $Limit) { $summary = $summary.Substring(0, $Limit) }
    return [pscustomobject]@{ ok = $false; exit_code = $exitCode; stdout = ($captured -join "`n"); diagnostic_summary = $summary }
  }

  $summary = Redact-Diagnostic ((($output -join ' ') -replace '\s+', ' ').Trim())
  if ($summary.Length -gt $Limit) { $summary = $summary.Substring(0, $Limit) }
  [pscustomobject]@{ ok = $true; exit_code = 0; stdout = ($captured -join "`n"); diagnostic_summary = $summary }
}

function Test-VersionOutputMatchesExpected {
  param(
    [string]$Expected,
    [string]$Output
  )
  if ([string]::IsNullOrWhiteSpace($Expected)) { return $true }
  return ([string]$Output -match "(^|[^0-9A-Za-z.])$([regex]::Escape($Expected))([^0-9A-Za-z.]|$)")
}

function Test-CodeGraphStatusRequestsFullReindex {
  param([string]$Output)
  return ([string]$Output -match 'codegraph index -f')
}

function Join-WindowsProcessArguments {
  param([object[]]$Arguments)

  $quoted = foreach ($argument in @($Arguments)) {
    $value = [string]$argument
    if ($value.Length -eq 0) { '""'; continue }
    if ($value -notmatch '[\s"]') { $value; continue }

    $builder = New-Object System.Text.StringBuilder
    [void]$builder.Append('"')
    $backslashes = 0
    foreach ($char in $value.ToCharArray()) {
      if ($char -eq '\') {
        $backslashes += 1
        continue
      }
      if ($char -eq '"') {
        if ($backslashes -gt 0) { [void]$builder.Append(('\' * ($backslashes * 2))) }
        [void]$builder.Append('\"')
        $backslashes = 0
        continue
      }
      if ($backslashes -gt 0) {
        [void]$builder.Append(('\' * $backslashes))
        $backslashes = 0
      }
      [void]$builder.Append($char)
    }
    if ($backslashes -gt 0) { [void]$builder.Append(('\' * ($backslashes * 2))) }
    [void]$builder.Append('"')
    $builder.ToString()
  }

  return ($quoted -join ' ')
}

function Set-ProcessArgumentsCompat {
  param(
    [System.Diagnostics.ProcessStartInfo]$ProcessInfo,
    [object[]]$Arguments
  )

  if ($ProcessInfo.PSObject.Properties.Name -contains 'ArgumentList') {
    foreach ($argument in @($Arguments)) {
      [void]$ProcessInfo.ArgumentList.Add([string]$argument)
    }
    return
  }

  $ProcessInfo.Arguments = Join-WindowsProcessArguments -Arguments $Arguments
}

function Invoke-Warmup {
  param([object]$Tool)
  $platformKey = if ($Platform -eq 'windows') { 'windows' } else { 'unix' }
  $step = $Tool.installation.$platformKey
  if ($null -eq $step) { return }
  $command = $step.command
  $args = @(Expand-ToolArgs -Tool $Tool -Args $step.args)
  $exe = $command
  $commandArgs = @($args)
  if ($Platform -eq 'windows' -and $command -eq 'npx') {
    $exe = if (-not [string]::IsNullOrWhiteSpace($env:ComSpec)) { $env:ComSpec } else { 'cmd.exe' }
    $commandArgs = @('/d', '/c', $command) + @($args)
  }

  $processInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $processInfo.FileName = $exe
  Set-ProcessArgumentsCompat -ProcessInfo $processInfo -Arguments $commandArgs
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true
  $processInfo.UseShellExecute = $false

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $processInfo
  try {
    [void]$process.Start()
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $timedOut = -not $process.WaitForExit($script:StageTimeoutSeconds * 1000)
    if ($timedOut) {
      try {
        $process.Kill($true)
      } catch {
        try { $process.Kill() } catch {}
      }
      $process.WaitForExit()
    }
    $stdoutTask.Wait()
    $stderrTask.Wait()
    $outputParts = @($stdoutTask.Result, $stderrTask.Result) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }
    if ($timedOut) {
      $outputParts += "timed out after $($script:StageTimeoutSeconds)s"
    }
    foreach ($line in @($outputParts)) {
      Write-Output $line
    }
    $global:LASTEXITCODE = if ($timedOut) { 124 } else { [int]$process.ExitCode }
  } catch {
    Write-Output ([string]$_.Exception.Message)
    $global:LASTEXITCODE = 127
  } finally {
    $process.Dispose()
  }
}

$results = New-Object System.Collections.Generic.List[object]
foreach ($tool in @($ToolsJson.tools)) {
  if (-not (Should-Install $tool)) { continue }

  if (-not [bool]$tool.required -and $OnlyArray.Count -eq 0) {
    continue
  }

  if (-not [bool]$tool.required -and -not (Test-OptionalToolAllowed -Tool $tool)) {
    $results.Add([pscustomobject]@{
      tool_id = $tool.id
      status = 'action-required'
      last_action = 'failed'
      install_kind = $tool.installation.kind
      reason_code = 'registry_not_required'
      next_action = 'optional MCP tools require explicit opt-in metadata and -Only <tool-id>'
      configured_path = ''
      selected_scope = ''
      fallback_applied = $false
      exit_code = $null
      diagnostic_summary = ''
      repair_diagnostic_summary = ''
    })
    continue
  }

  $status = 'ready'
  $lastAction = 'installed'
  $reasonCode = ''
  $nextAction = ''
  $configuredPath = ''
  $selectedScope = ''
  $fallbackApplied = $false
  $exitCode = $null
  $diagnosticSummary = ''
  $repairDiagnosticSummary = ''

  foreach ($dep in @($tool.dependencies)) {
    if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
      $status = 'action-required'
      $lastAction = 'failed'
      $reasonCode = 'missing_dependency'
      $nextAction = "安装依赖: $dep"
      $diagnosticSummary = "missing dependency: $dep"
      break
    }
  }

  if ($status -eq 'ready' -and $tool.installation.kind -eq 'warmup') {
    $platformKey = if ($Platform -eq 'windows') { 'windows' } else { 'unix' }
    $warmupStep = $tool.installation.$platformKey
    $warmupArgs = @(Expand-ToolArgs -Tool $tool -Args $warmupStep.args)
    $warmupHash = Get-WarmupCommandHash -Command $warmupStep.command -Arguments $warmupArgs
    $warmupTtlSeconds = Get-WarmupCacheTtlSeconds -Command $warmupStep.command -Arguments $warmupArgs
    if (Test-WarmupCacheHit -Tool $tool -CommandHash $warmupHash -TtlSeconds $warmupTtlSeconds) {
      $lastAction = 'warmup-cache-hit'
    } else {
      $warmupResult = Invoke-Captured { Invoke-Warmup -Tool $tool }
      if (-not $warmupResult.ok) {
        $status = 'action-required'
        $lastAction = 'failed'
        $reasonCode = 'warmup_failed'
        $nextAction = '检查工具 warmup 命令与网络可达性'
        $exitCode = $warmupResult.exit_code
        $diagnosticSummary = $warmupResult.diagnostic_summary
      } else {
        Write-WarmupCache -Tool $tool -Command $warmupStep.command -Arguments $warmupArgs -CommandHash $warmupHash
      }
    }
    if ($status -ne 'ready') {
      $status = 'action-required'
      $lastAction = 'failed'
      $reasonCode = 'warmup_failed'
      $nextAction = '检查工具 warmup 命令与网络可达性'
    }
  } elseif ($status -eq 'ready' -and $tool.installation.kind -eq 'global-npm') {
    $platformKey = if ($Platform -eq 'windows') { 'windows' } else { 'unix' }
    $installStep = $tool.installation.$platformKey
    $installArgs = @(Expand-ToolArgs -Tool $tool -Args $installStep.args)
    $verifyCommand = ''
    $verifyArgs = @()
    if ($null -ne $tool.installation.PSObject.Properties['verify_command']) {
      $verifyCommand = [string]$tool.installation.verify_command.command
      $verifyArgs = @(Expand-ToolArgs -Tool $tool -Args @($tool.installation.verify_command.args))
    }
    $expectedVersion = [string]$tool.version
    $verifyBefore = $null
    if (-not [string]::IsNullOrWhiteSpace($verifyCommand)) {
      $verifyBefore = Invoke-Captured { & $verifyCommand @verifyArgs }
    }
    if ($null -ne $verifyBefore -and $verifyBefore.ok -and (Test-VersionOutputMatchesExpected -Expected $expectedVersion -Output "$($verifyBefore.stdout) $($verifyBefore.diagnostic_summary)")) {
      $lastAction = 'global-install-cache-hit'
    } else {
      $installRun = Invoke-Captured {
        if ($Platform -eq 'windows' -and $installStep.command -eq 'npm') {
          & cmd.exe /d /c $installStep.command @installArgs
        } else {
          & $installStep.command @installArgs
        }
      }
      if (-not $installRun.ok) {
        $status = 'action-required'
        $lastAction = 'failed'
        $reasonCode = 'install_failed'
        $nextAction = '检查 npm 全局安装权限、网络和 registry 配置'
        $exitCode = $installRun.exit_code
        $diagnosticSummary = $installRun.diagnostic_summary
      } elseif (-not [string]::IsNullOrWhiteSpace($verifyCommand)) {
        $verifyAfter = Invoke-Captured { & $verifyCommand @verifyArgs }
        if (-not $verifyAfter.ok) {
          $status = 'action-required'
          $lastAction = 'failed'
          $reasonCode = 'install_verify_failed'
          $nextAction = "确认安装后的 CLI 在 PATH 上可用: $verifyCommand"
          $exitCode = $verifyAfter.exit_code
          $diagnosticSummary = $verifyAfter.diagnostic_summary
        } elseif (-not (Test-VersionOutputMatchesExpected -Expected $expectedVersion -Output "$($verifyAfter.stdout) $($verifyAfter.diagnostic_summary)")) {
          $status = 'action-required'
          $lastAction = 'failed'
          $reasonCode = 'install_verify_version_mismatch'
          $nextAction = "确认 PATH 上的 $verifyCommand 来自 pinned package version $expectedVersion，而不是其他同名 CLI"
          $diagnosticSummary = $verifyAfter.diagnostic_summary
        } else {
          $lastAction = 'global-installed'
        }
      } else {
        $lastAction = 'global-installed'
      }
    }
  }

  $hostConfigRequired = if ($null -ne $tool.PSObject.Properties['host_config_required']) { [bool]$tool.host_config_required } else { $true }

  if ($status -eq 'ready' -and $hostConfigRequired) {
    $configureParams = @{ Tool = $tool.id }
    if ($UserScope) { $configureParams.UserScope = $true }
    $configureRun = Invoke-Captured { & (Join-Path $ScriptDir 'configure-host.ps1') @configureParams }
    if ($configureRun.ok) {
      $configureResult = $configureRun.stdout | ConvertFrom-Json
      $configuredPath = $configureResult.configured_path
      $selectedScope = $configureResult.selected_scope
      $fallbackApplied = [bool]$configureResult.fallback_applied
    } else {
      $exitCode = $configureRun.exit_code
      $diagnosticSummary = $configureRun.diagnostic_summary
      $repairRun = Invoke-Captured { & (Join-Path $ScriptDir 'repair-install.ps1') @configureParams }
      if ($repairRun.ok) {
        $repairResult = $repairRun.stdout | ConvertFrom-Json
        $lastAction = 'repaired'
        $configuredPath = $repairResult.configured_path
        $selectedScope = $repairResult.selected_scope
        $fallbackApplied = [bool]$repairResult.fallback_applied
      } else {
        $status = 'action-required'
        $lastAction = 'failed'
        $reasonCode = 'configure_failed'
        $nextAction = '检查宿主 CLI、依赖与配置写入权限'
        $repairDiagnosticSummary = $repairRun.diagnostic_summary
      }
    }
  } elseif ($status -eq 'ready') {
    $lastAction = 'host-config-skipped'
    $nextAction = ''
    $diagnosticSummary = 'host MCP config is not required for this tool'
  }

  $projectState = Get-ProjectBootstrapState -Tool $tool
  if ($status -eq 'ready' -and $projectState -eq 'target-action-required') {
    $status = 'action-required'
    $lastAction = 'failed'
    $reasonCode = 'project_target_required'
    $nextAction = if ([string]::IsNullOrWhiteSpace([string]$TargetFacts.next_action)) { '选择目标 repo 后重跑 setup' } else { [string]$TargetFacts.next_action }
    $diagnosticSummary = 'project bootstrap requires a writable target repo'
  } elseif ($status -eq 'ready' -and $projectState -eq 'pending') {
    $platformKey = if ($Platform -eq 'windows') { 'windows' } else { 'unix' }
    $bootstrapStep = $tool.project_bootstrap.$platformKey
    $bootstrapArgs = @(Expand-ToolArgs -Tool $tool -Args $bootstrapStep.args)
    $bootstrapRun = Invoke-Captured {
      Push-Location $ResolvedRepoRoot
      try {
        if ($Platform -eq 'windows' -and $bootstrapStep.command -eq 'npx') {
          & cmd.exe /d /c $bootstrapStep.command @bootstrapArgs
        } else {
          & $bootstrapStep.command @bootstrapArgs
        }
      } finally {
        Pop-Location
      }
    }
    if ($bootstrapRun.ok) {
      $lastAction = 'project-bootstrapped'
    } else {
      $status = 'action-required'
      $lastAction = 'failed'
      $reasonCode = 'project_bootstrap_failed'
      $nextAction = '检查 project_bootstrap 命令、网络和 repo 写入权限'
      $exitCode = $bootstrapRun.exit_code
      $diagnosticSummary = $bootstrapRun.diagnostic_summary
    }
  } elseif ($status -eq 'ready' -and $projectState -eq 'ready') {
    $lastAction = 'project-bootstrap-cache-hit'
  }

  if ($status -eq 'ready' -and $null -ne $tool.PSObject.Properties['project_bootstrap'] -and $null -ne $tool.project_bootstrap.PSObject.Properties['status_probe']) {
    $probeStep = $tool.project_bootstrap.status_probe
    $probeArgs = @(Expand-ToolArgs -Tool $tool -Args @($probeStep.args))
    $probeRun = Invoke-Captured {
      Push-Location $ResolvedRepoRoot
      try {
        & $probeStep.command @probeArgs
      } finally {
        Pop-Location
      }
    }
    if ($probeRun.ok) {
      $probeOutput = "$($probeRun.stdout) $($probeRun.diagnostic_summary)"
      if ($tool.id -eq 'codegraph' -and (($probeOutput -match 'Pending Changes') -or (Test-CodeGraphStatusRequestsFullReindex -Output $probeOutput))) {
        $syncRun = Invoke-Captured {
          Push-Location $ResolvedRepoRoot
          try {
            & codegraph sync
          } finally {
            Pop-Location
          }
        }
        if ($syncRun.ok) {
          $probeAfterSync = Invoke-Captured {
            Push-Location $ResolvedRepoRoot
            try {
              & $probeStep.command @probeArgs
            } finally {
              Pop-Location
            }
          }
          if ($probeAfterSync.ok) {
            $probeAfterOutput = "$($probeAfterSync.stdout) $($probeAfterSync.diagnostic_summary)"
            if ($probeAfterOutput -match 'Pending Changes') {
              $status = 'action-required'
              $lastAction = 'failed'
              $reasonCode = 'project_status_pending_changes'
              $nextAction = 'Run codegraph sync from the project root and inspect pending changes.'
              $diagnosticSummary = $probeAfterSync.diagnostic_summary
            } elseif (Test-CodeGraphStatusRequestsFullReindex -Output $probeAfterOutput) {
              $fullReindexRun = Invoke-Captured {
                Push-Location $ResolvedRepoRoot
                try {
                  & codegraph index -f
                } finally {
                  Pop-Location
                }
              }
              if ($fullReindexRun.ok) {
                $probeAfterFullReindex = Invoke-Captured {
                  Push-Location $ResolvedRepoRoot
                  try {
                    & $probeStep.command @probeArgs
                  } finally {
                    Pop-Location
                  }
                }
                if ($probeAfterFullReindex.ok) {
                  $probeAfterFullOutput = "$($probeAfterFullReindex.stdout) $($probeAfterFullReindex.diagnostic_summary)"
                  if (Test-CodeGraphStatusRequestsFullReindex -Output $probeAfterFullOutput) {
                    $status = 'degraded'
                    $lastAction = 'project-full-reindex-still-required'
                    $reasonCode = 'project_full_reindex_still_required'
                    $nextAction = 'Run codegraph status and inspect why codegraph index -f did not clear the advisory.'
                    $diagnosticSummary = $probeAfterFullReindex.diagnostic_summary
                  } else {
                    $lastAction = 'project-status-full-reindexed'
                    $reasonCode = 'codegraph-full-reindex-used'
                  }
                } else {
                  $status = 'degraded'
                  $lastAction = 'project-full-reindex-status-failed'
                  $reasonCode = 'project_status_failed_after_full_reindex'
                  $nextAction = 'Run codegraph status from the project root and inspect local index state.'
                  $exitCode = $probeAfterFullReindex.exit_code
                  $diagnosticSummary = $probeAfterFullReindex.diagnostic_summary
                }
              } else {
                $status = 'degraded'
                $lastAction = 'project-full-reindex-failed'
                $reasonCode = 'project_full_reindex_failed'
                $nextAction = 'Run codegraph index -f from the project root and inspect rebuild errors.'
                $exitCode = $fullReindexRun.exit_code
                $diagnosticSummary = $fullReindexRun.diagnostic_summary
              }
            } elseif ($lastAction -eq 'project-bootstrap-cache-hit') {
              $lastAction = 'project-status-synced'
            } elseif ($lastAction -eq 'project-bootstrapped') {
              $lastAction = 'project-bootstrapped-status-synced'
            }
          } else {
            $status = 'action-required'
            $lastAction = 'failed'
            $reasonCode = 'project_status_failed_after_sync'
            $nextAction = 'Run codegraph status from the project root and inspect local index state.'
            $exitCode = $probeAfterSync.exit_code
            $diagnosticSummary = $probeAfterSync.diagnostic_summary
          }
        } else {
          $status = 'action-required'
          $lastAction = 'failed'
          $reasonCode = 'project_sync_failed'
          $nextAction = 'Run codegraph sync from the project root and inspect sync errors.'
          $exitCode = $syncRun.exit_code
          $diagnosticSummary = $syncRun.diagnostic_summary
        }
      }
      if ($lastAction -eq 'project-bootstrap-cache-hit') {
        $lastAction = 'project-status-cache-hit'
      } elseif ($lastAction -eq 'project-bootstrapped') {
        $lastAction = 'project-bootstrapped-status-checked'
      }
    } else {
      $status = 'action-required'
      $lastAction = 'failed'
      $reasonCode = 'project_status_failed'
      $nextAction = '检查 provider-native project status 命令和本地索引产物'
      $exitCode = $probeRun.exit_code
      $diagnosticSummary = $probeRun.diagnostic_summary
    }
  }

  $results.Add([pscustomobject]@{
    tool_id = $tool.id
    status = $status
    last_action = $lastAction
    install_kind = $tool.installation.kind
    reason_code = $reasonCode
    next_action = $nextAction
    configured_path = $configuredPath
    selected_scope = $selectedScope
    fallback_applied = [bool]$fallbackApplied
    exit_code = $exitCode
    diagnostic_summary = $diagnosticSummary
    repair_diagnostic_summary = $repairDiagnosticSummary
  })
}

$output = [ordered]@{
  host = $DetectedHost
  display_name = $HostDisplayName
  platform = $Platform
  results = @($results.ToArray())
}

if ($OnlyArray.Count -gt 0 -and (Test-SelectionContains -Id 'graphify')) {
  $previousConsent = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT')
  $previousProviderHost = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_HOST')
  $previousRepoRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_REPO_ROOT')
  $previousToolRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_TOOL_ROOT')
  $previousCacheRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_CACHE_ROOT')
  $previousArtifactRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT')
  try {
    $env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT = 'approved'
    $env:SPEC_FIRST_PROVIDER_HOST = $DetectedHost
    $env:SPEC_FIRST_PROVIDER_REPO_ROOT = $ResolvedRepoRoot
    $env:SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT = '.graphify'
    $helperParams = @{ Install = $true }
    if ($Refresh) { $helperParams.Refresh = $true }
    if (-not [string]::IsNullOrWhiteSpace($RequirementWorkspace)) { $helperParams.RequirementWorkspace = $RequirementWorkspace }
    $helperRun = Invoke-ChildJsonScript -ScriptPath (Join-Path $ScriptDir 'install-helpers.ps1') -Arguments $helperParams
    try {
      $helperPayload = [string]$helperRun.stdout | ConvertFrom-Json
      $output.helper_tools = $helperPayload.helper_tools
      $output.provider_readiness = @($helperPayload.provider_readiness)
      $output.provider_apply = [ordered]@{
        selected = @('graphify')
        route = 'install-helpers'
        status = if ([int]$helperRun.exit_code -eq 0) { 'ready' } else { 'action-required' }
        exit_code = [int]$helperRun.exit_code
      }
    } catch {
      $output.provider_apply = [ordered]@{
        selected = @('graphify')
        route = 'install-helpers'
        status = 'action-required'
        exit_code = [int]$helperRun.exit_code
        reason_code = 'graphify-helper-output-invalid'
        diagnostic_summary = Redact-Diagnostic ([string]$helperRun.stdout)
      }
    }
  } finally {
    if ($null -eq $previousConsent) { Remove-Item env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT = $previousConsent }
    if ($null -eq $previousProviderHost) { Remove-Item env:SPEC_FIRST_PROVIDER_HOST -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_HOST = $previousProviderHost }
    if ($null -eq $previousRepoRoot) { Remove-Item env:SPEC_FIRST_PROVIDER_REPO_ROOT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_REPO_ROOT = $previousRepoRoot }
    if ($null -eq $previousToolRoot) { Remove-Item env:SPEC_FIRST_PROVIDER_TOOL_ROOT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_TOOL_ROOT = $previousToolRoot }
    if ($null -eq $previousCacheRoot) { Remove-Item env:SPEC_FIRST_PROVIDER_CACHE_ROOT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_CACHE_ROOT = $previousCacheRoot }
    if ($null -eq $previousArtifactRoot) { Remove-Item env:SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT -ErrorAction SilentlyContinue } else { $env:SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT = $previousArtifactRoot }
  }
}

[pscustomobject]$output | ConvertTo-Json -Depth 8 -Compress
