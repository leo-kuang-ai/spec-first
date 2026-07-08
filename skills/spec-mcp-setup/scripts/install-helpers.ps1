param(
  [switch]$Install,
  [switch]$VerifyOnly,
  [switch]$Refresh,
  [string]$RequirementWorkspace = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. (Join-Path $PSScriptRoot 'lib-helper-registry.ps1')
. (Join-Path $PSScriptRoot 'lib-template.ps1')
$mcpToolsPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'mcp-tools.json'
$mcpToolsJson = Read-McpToolsJson -Path $mcpToolsPath
Assert-McpToolsSchemaVersion -ToolsJson $mcpToolsJson

function Get-ExternalDependencyField {
  param(
    [string]$DependencyId,
    [string]$Field
  )
  if ($null -eq $mcpToolsJson -or $mcpToolsJson.PSObject.Properties.Name -notcontains 'external_dependencies') { return '' }
  foreach ($dependency in @($mcpToolsJson.external_dependencies)) {
    if ([string]$dependency.id -eq $DependencyId -and $dependency.PSObject.Properties.Name -contains $Field) {
      return [string]$dependency.$Field
    }
  }
  return ''
}

$mode = if ($VerifyOnly) { 'verify-only' } else { 'install' }
if ([string]::IsNullOrWhiteSpace($RequirementWorkspace)) {
  $RequirementWorkspace = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE')
}
if ([string]::IsNullOrWhiteSpace($RequirementWorkspace)) {
  $RequirementWorkspace = [Environment]::GetEnvironmentVariable('SPEC_FIRST_REQUIREMENT_WORKSPACE')
}
$graphifyRefreshRequested = $Refresh
if (-not $graphifyRefreshRequested) {
  $refreshEnv = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_REFRESH')
  $graphifyRefreshRequested = @('approved', 'yes', 'true', '1') -contains ([string]$refreshEnv).ToLowerInvariant()
}

$providerRepoRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_REPO_ROOT')
if ([string]::IsNullOrWhiteSpace($providerRepoRoot)) { $providerRepoRoot = (Get-Location).Path }
$providerToolRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_TOOL_ROOT')
if ([string]::IsNullOrWhiteSpace($providerToolRoot)) { $providerToolRoot = Join-Path $providerRepoRoot '.spec-first/tools' }
$providerCacheRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_CACHE_ROOT')
if ([string]::IsNullOrWhiteSpace($providerCacheRoot)) { $providerCacheRoot = Join-Path $providerRepoRoot '.spec-first/cache' }
$graphifyArtifactRootDefault = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT')
if ([string]::IsNullOrWhiteSpace($graphifyArtifactRootDefault)) { $graphifyArtifactRootDefault = '.graphify' }
$graphifyPackage = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_PACKAGE')
if ([string]::IsNullOrWhiteSpace($graphifyPackage)) { $graphifyPackage = Get-ExternalDependencyField -DependencyId 'graphify' -Field 'package' }
$graphifyVersionPin = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_VERSION_PIN')
if ([string]::IsNullOrWhiteSpace($graphifyVersionPin)) { $graphifyVersionPin = Get-ExternalDependencyField -DependencyId 'graphify' -Field 'version' }
if ([string]::IsNullOrWhiteSpace($graphifyPackage)) { throw 'mcp-tools.json missing graphify package pin' }
if ([string]::IsNullOrWhiteSpace($graphifyVersionPin)) { throw 'mcp-tools.json missing graphify version pin' }
$homeLocalBin = Join-Path $HOME '.local/bin'
$homeCargoBin = Join-Path $HOME '.cargo/bin'
$graphifyOriginalPath = $env:PATH
if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_ORIGINAL_PATH'))) {
  Set-Item -Path env:SPEC_FIRST_PROVIDER_ORIGINAL_PATH -Value $graphifyOriginalPath
}
$script:GraphifyResolvedCommand = ''
$script:GraphifyResolvedOnPath = ''
$script:GraphifyRunDiagnostic = ''
$script:GraphifyRunOutput = ''
$script:GraphifyRunExitCode = 0
$env:PATH = "$homeLocalBin$([System.IO.Path]::PathSeparator)$homeCargoBin$([System.IO.Path]::PathSeparator)$providerToolRoot$([System.IO.Path]::PathSeparator)$env:PATH"

$script:MirrorEndpoints = [ordered]@{
  npm    = 'https://registry.npmmirror.com'
  uv     = 'https://mirrors.tuna.tsinghua.edu.cn/pypi/simple'
  chrome = 'https://npmmirror.com/mirrors/chrome-for-testing'
}

$script:LastInstallProvenance = $null
$helperRegistry = Get-HelperRegistry

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

$probeTimeoutSeconds = Get-NonNegativeIntEnv -Name 'SPEC_FIRST_PROBE_TIMEOUT_SECONDS' -Default 30

function Reset-InstallProvenance {
  $script:LastInstallProvenance = $null
}

function Get-InstallProvenance {
  if ($null -eq $script:LastInstallProvenance) {
    return [ordered]@{ install_source = 'official'; mirror_used = $false }
  }
  return $script:LastInstallProvenance
}

function Invoke-WithMirrorFallback {
  param(
    [scriptblock]$Action,
    [hashtable]$MirrorEnv
  )

  $official = & $Action
  if ($official) {
    $script:LastInstallProvenance = [ordered]@{ install_source = 'official'; mirror_used = $false }
    return $true
  }

  if ($null -eq $MirrorEnv -or $MirrorEnv.Count -eq 0) {
    $script:LastInstallProvenance = [ordered]@{ install_source = 'both-failed'; mirror_used = $false }
    return $false
  }

  $previous = @{}
  foreach ($key in $MirrorEnv.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key)
    Set-Item -Path "env:$key" -Value $MirrorEnv[$key]
  }
  try {
    $mirror = & $Action
  } finally {
    foreach ($key in $MirrorEnv.Keys) {
      if ($null -eq $previous[$key]) {
        Remove-Item -Path "env:$key" -ErrorAction SilentlyContinue
      } else {
        Set-Item -Path "env:$key" -Value $previous[$key]
      }
    }
  }
  if ($mirror) {
    $script:LastInstallProvenance = [ordered]@{ install_source = 'mirror'; mirror_used = $true }
    return $true
  }
  $script:LastInstallProvenance = [ordered]@{ install_source = 'both-failed'; mirror_used = $true }
  return $false
}

function Get-NpmMirrorEnv {
  $value = $script:MirrorEndpoints.npm
  return @{
    NPM_CONFIG_REGISTRY = $value
  }
}

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
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

function Get-HelperSafetyResult {
  param([object]$Helper)
  if ($null -eq $Helper -or $null -eq $Helper.safety) { return 'blocked' }
  $flags = @($Helper.safety.risk_flags)
  $pinStatus = if ($Helper.safety.version_policy) { [string]$Helper.safety.version_policy.pin_status } else { '' }
  if ([string]::IsNullOrWhiteSpace([string]$Helper.safety.source) -or [string]::IsNullOrWhiteSpace($pinStatus)) { return 'blocked' }
  if ($flags -contains 'installer-script' -or $flags -contains 'unknown-source') { return 'blocked' }
  if ($Helper.installation -and [string]$Helper.installation.strategy -eq 'manual') { return 'unsupported' }
  # review-required 由 registry 显式 review_required 或具体高风险 flag 决定;pin_status 的风险
  # 已由各 helper 的 unpinned-* flag 显式编码,不用 latest 一刀切(否则 safe 分支永不可达,
  # 与 Node setup-plan-renderer.cjs 不一致)。与 Node 真相源对齐(REVIEW_RISK_FLAGS 同集)。
  $reviewRiskFlags = @('unpinned-npx', 'global-npm-install', 'global-cargo-install', 'global-install', 'browser-runtime-install', 'unpinned-latest')
  $matchedFlag = $reviewRiskFlags | Where-Object { $flags -contains $_ } | Select-Object -First 1
  if ([bool]$Helper.safety.review_required -or $matchedFlag) {
    return 'review-required'
  }
  return 'safe'
}

function Invoke-HelperCommand {
  param([scriptblock]$Script)
  try {
    $global:LASTEXITCODE = 0
    & $Script *> $null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

function Invoke-NpmGlobalInstallWithOptionalSudo {
  param([string[]]$Packages)

  $previousCi = $env:CI
  $env:CI = 'true'
  try {
    $action = {
      if (Invoke-HelperCommand { npm install -g @Packages --no-audit --no-fund --loglevel=error --fetch-timeout=30000 --fetch-retries=1 }) {
        return $true
      }
      if (Test-CommandExists 'sudo') {
        $forwardEnv = @()
        foreach ($name in @(
          'NPM_CONFIG_REGISTRY',
          'npm_config_registry',
          'HTTPS_PROXY',
          'https_proxy',
          'HTTP_PROXY',
          'http_proxy',
          'NO_PROXY',
          'no_proxy'
        )) {
          $value = [Environment]::GetEnvironmentVariable($name)
          if (-not [string]::IsNullOrWhiteSpace($value)) {
            $forwardEnv += "$name=$value"
          }
        }

        if ($forwardEnv.Count -gt 0) {
          return (Invoke-HelperCommand { sudo -n env CI=true @forwardEnv npm install -g @Packages --no-audit --no-fund --loglevel=error --fetch-timeout=30000 --fetch-retries=1 })
        }
        return (Invoke-HelperCommand { sudo -n env CI=true npm install -g @Packages --no-audit --no-fund --loglevel=error --fetch-timeout=30000 --fetch-retries=1 })
      }
      return $false
    }.GetNewClosure()
    return (Invoke-WithMirrorFallback -Action $action -MirrorEnv (Get-NpmMirrorEnv))
  } finally {
    $env:CI = $previousCi
  }
}

function Write-AgentBrowserInstallMarker {
  param([string]$InstallCommand)
  $markerDir = Split-Path -Parent $agentBrowserInstallMarker
  New-Item -ItemType Directory -Force -Path $markerDir | Out-Null
  [pscustomobject]@{
    schema_version = 'agent-browser-install.v1'
    installed_by = 'spec-mcp-setup'
    installed_at = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    install_command = $InstallCommand
  } | ConvertTo-Json -Compress | Set-Content -Encoding utf8 $agentBrowserInstallMarker
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

function Get-HelperInstallCommand {
  param(
    [string]$Name,
    [string]$Platform
  )

  function Get-AgentBrowserInstallCommand {
    param([bool]$WithDeps)
    $browserInstall = if ($WithDeps) { 'agent-browser install --with-deps' } else { 'agent-browser install' }
    return '$env:CI=''true''; npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error; if ($LASTEXITCODE -eq 0) { ' + $browserInstall + ' }; if ($LASTEXITCODE -eq 0) { npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y }'
  }

  # agent-browser 的展示命令是真实安装命令(本脚本是 installer);其余 helper 委派到
  # lib-helper-registry.ps1 的共享展示生成器,消除与 check-health.ps1 的双份维护漂移。
  if ($Name -eq 'agent-browser') {
    if ($Platform -eq 'linux') {
      return (Get-AgentBrowserInstallCommand -WithDeps $true)
    }
    return (Get-AgentBrowserInstallCommand -WithDeps $false)
  }
  return (Get-HelperInstallCommandDisplay -Name $Name -Platform $Platform)
}

function Invoke-HelperInstall {
  param(
    [string]$Name,
    [string]$Platform
  )

  function Invoke-WithOptionalSudo {
    param(
      [string]$Command,
      [object[]]$Arguments
    )

    if (Test-CommandExists 'sudo') {
      & sudo -n $Command @Arguments
    } else {
      & $Command @Arguments
    }
  }

  function Invoke-LinuxPackageInstall {
    param(
      [string]$AptPackage,
      [string]$DnfPackage,
      [string]$YumPackage,
      [string]$PacmanPackage,
      [string]$ApkPackage
    )

    if (Test-CommandExists 'apt-get') { return ((Invoke-HelperCommand { Invoke-WithOptionalSudo 'apt-get' @('update') }) -and (Invoke-HelperCommand { Invoke-WithOptionalSudo 'apt-get' @('install', '-y', $AptPackage) })) }
    if (Test-CommandExists 'dnf') { return ((Invoke-HelperCommand { Invoke-WithOptionalSudo 'dnf' @('upgrade', '-y', $DnfPackage) }) -or (Invoke-HelperCommand { Invoke-WithOptionalSudo 'dnf' @('install', '-y', $DnfPackage) })) }
    if (Test-CommandExists 'yum') { return ((Invoke-HelperCommand { Invoke-WithOptionalSudo 'yum' @('update', '-y', $YumPackage) }) -or (Invoke-HelperCommand { Invoke-WithOptionalSudo 'yum' @('install', '-y', $YumPackage) })) }
    if (Test-CommandExists 'pacman') { return (Invoke-HelperCommand { Invoke-WithOptionalSudo 'pacman' @('-Syu', '--needed', '--noconfirm', $PacmanPackage) }) }
    if (Test-CommandExists 'apk') { return ((Invoke-HelperCommand { Invoke-WithOptionalSudo 'apk' @('update') }) -and (Invoke-HelperCommand { Invoke-WithOptionalSudo 'apk' @('add', '--upgrade', $ApkPackage) })) }
    return $false
  }

  function Invoke-BrewLatestInstall {
    param([string]$Package)
    Invoke-HelperCommand { brew update } | Out-Null
    if (Invoke-HelperCommand { brew list --formula $Package }) {
      Invoke-HelperCommand { brew upgrade -q $Package } | Out-Null
      return $true
    }
    return (Invoke-HelperCommand { brew install -q $Package })
  }

  function Invoke-WingetLatestInstall {
    param([string]$PackageId)
    return (
      (Invoke-HelperCommand { winget upgrade --id $PackageId -e --silent --accept-package-agreements --accept-source-agreements }) -or
      (Invoke-HelperCommand { winget install --id $PackageId -e --silent --accept-package-agreements --accept-source-agreements })
    )
  }

  switch ($Name) {
    'gh' {
      if ($Platform -eq 'windows') { if (-not (Test-CommandExists 'winget')) { return $false }; return (Invoke-WingetLatestInstall -PackageId 'GitHub.cli') }
      if ($Platform -eq 'linux') { return (Invoke-LinuxPackageInstall -AptPackage 'gh' -DnfPackage 'gh' -YumPackage 'gh' -PacmanPackage 'github-cli' -ApkPackage 'github-cli') }
      return (Invoke-BrewLatestInstall -Package 'gh')
    }
    'jq' {
      if ($Platform -eq 'windows') { if (-not (Test-CommandExists 'winget')) { return $false }; return (Invoke-WingetLatestInstall -PackageId 'jqlang.jq') }
      if ($Platform -eq 'linux') { return (Invoke-LinuxPackageInstall -AptPackage 'jq' -DnfPackage 'jq' -YumPackage 'jq' -PacmanPackage 'jq' -ApkPackage 'jq') }
      return (Invoke-BrewLatestInstall -Package 'jq')
    }
    'vhs' {
      if ($Platform -eq 'windows') { return (Invoke-HelperCommand { go install github.com/charmbracelet/vhs@latest }) }
      if ($Platform -eq 'linux') { if (-not (Test-CommandExists 'go')) { return $false }; return (Invoke-HelperCommand { go install github.com/charmbracelet/vhs@latest }) }
      return (Invoke-BrewLatestInstall -Package 'vhs')
    }
    'silicon' {
      if ($Platform -eq 'windows') { return (Invoke-HelperCommand { cargo install silicon --force }) }
      if ($Platform -eq 'linux') { if (-not (Test-CommandExists 'cargo')) { return $false }; return (Invoke-HelperCommand { cargo install silicon --force }) }
      return (Invoke-BrewLatestInstall -Package 'silicon')
    }
    'ffmpeg' {
      if ($Platform -eq 'windows') { if (-not (Test-CommandExists 'winget')) { return $false }; return (Invoke-WingetLatestInstall -PackageId 'Gyan.FFmpeg') }
      if ($Platform -eq 'linux') { return (Invoke-LinuxPackageInstall -AptPackage 'ffmpeg' -DnfPackage 'ffmpeg' -YumPackage 'ffmpeg' -PacmanPackage 'ffmpeg' -ApkPackage 'ffmpeg') }
      return (Invoke-BrewLatestInstall -Package 'ffmpeg')
    }
    'ast-grep' {
      if ($Platform -eq 'windows') { return (Invoke-NpmGlobalInstallWithOptionalSudo -Packages @('@ast-grep/cli@latest')) }
      if ($Platform -eq 'linux') {
        if (Test-CommandExists 'cargo') { return (Invoke-HelperCommand { cargo install ast-grep --locked --force }) }
        if (Test-CommandExists 'npm') { return (Invoke-NpmGlobalInstallWithOptionalSudo -Packages @('@ast-grep/cli@latest')) }
        return $false
      }
      return (Invoke-BrewLatestInstall -Package 'ast-grep')
    }
    'ast-grep-skill' {
      return (Invoke-WithMirrorFallback -Action { Invoke-HelperCommand { npx -y skills@latest add ast-grep/agent-skill -g -y } } -MirrorEnv (Get-NpmMirrorEnv))
    }
    default { return $false }
  }
}

function Test-GlobalSkill {
  param([string]$Name)
  return (
    (Test-Path (Join-Path $HOME ".agents/skills/$Name/SKILL.md")) -or
    (Test-Path (Join-Path $HOME ".claude/skills/$Name/SKILL.md")) -or
    (Test-Path (Join-Path $HOME ".codex/skills/$Name/SKILL.md")) -or
    (Test-Path (Join-Path $HOME ".kiro/skills/$Name/SKILL.md")) -or
    (Test-Path (Join-Path $HOME ".qoder/skills/$Name/SKILL.md"))
  )
}

function Get-BrowserDemandSignals {
  $signals = New-Object System.Collections.Generic.List[string]

  if (Test-Path -LiteralPath 'package.json' -PathType Leaf) {
    try {
      $package = Get-Content -Raw -LiteralPath 'package.json' | ConvertFrom-Json -ErrorAction Stop
      foreach ($section in @('dependencies', 'devDependencies', 'optionalDependencies')) {
        if ($package.PSObject.Properties.Name -contains $section) {
          foreach ($property in $package.$section.PSObject.Properties) {
            if ($property.Name -match '(@playwright/test|playwright|cypress|puppeteer|storybook|@storybook/)') {
              $signals.Add("package.json:dependency:$($property.Name)")
            }
          }
        }
      }
      if ($package.PSObject.Properties.Name -contains 'scripts') {
        foreach ($property in $package.scripts.PSObject.Properties) {
          $scriptText = "$($property.Name) $($property.Value)"
          if ($scriptText -match 'playwright|cypress|puppeteer|storybook|vite|next|nuxt|astro|remix|svelte-kit|sveltekit') {
            $signals.Add("package.json:scripts.$($property.Name)")
          }
        }
      }
    } catch {
      # Keep setup deterministic: unreadable package.json simply contributes no demand signal.
    }
  }

  foreach ($file in @('next.config.js', 'next.config.mjs', 'vite.config.js', 'vite.config.ts', 'nuxt.config.js', 'nuxt.config.ts', 'astro.config.mjs', 'remix.config.js', 'svelte.config.js', 'config/routes.rb', 'manage.py', 'mix.exs', 'artisan', 'storybook.config.js', '.storybook/main.js', '.storybook/main.ts')) {
    if (Test-Path -LiteralPath $file) { $signals.Add("config-file:$file") }
  }

  foreach ($dir in @('src/app', 'pages', 'app/views', 'templates', 'public', 'storybook', '.storybook')) {
    if ((Test-Path -LiteralPath $dir -PathType Container) -and (@(Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue | Select-Object -First 1).Count -gt 0)) {
      $signals.Add("dir:$dir")
    }
  }

  return @($signals | Sort-Object -Unique)
}

function Add-HelperFact {
  param(
    [System.Collections.IDictionary]$HelperTools,
    [string]$Id,
    [string]$Type,
    [string]$DependencyStatus,
    [string]$InstallStatus,
    [string]$SkillStatus,
    [string]$Result,
    [string]$NextAction,
    [bool]$BaselineBlocking = $true,
    [string]$InstallSource = 'official',
    [bool]$MirrorUsed = $false,
    [string[]]$BrowserCapabilityDemandSignals = @()
  )

  $helper = Get-HelperEntry -Id $Id
  $required = if ($null -ne $helper -and $helper.PSObject.Properties.Name -contains 'required') { [bool]$helper.required } else { $true }
  $effectiveBaselineBlocking = if ($PSBoundParameters.ContainsKey('BaselineBlocking')) { [bool]$BaselineBlocking } else { Test-EffectiveBaselineBlocking -Helper $helper }
  $profile = Get-HelperProfile -Helper $helper
  $kind = if ($null -ne $helper -and -not [string]::IsNullOrWhiteSpace([string]$helper.kind)) { [string]$helper.kind } else { $Type }
  $safety = Get-HelperSafetyResult -Helper $helper
  $reasonCode = switch ($Result) {
    'ready' { 'ready' }
    'skipped' { 'optional-skipped' }
    'degraded' { 'optional-capability-degraded' }
    'action-required' { 'required-runtime-action-required' }
    default { 'unknown' }
  }

  $HelperTools[$Id] = [ordered]@{
    required = $required
    baseline_blocking = $effectiveBaselineBlocking
    profile = $profile
    kind = $kind
    type = $Type
    dependency_status = $DependencyStatus
    configured_status = 'not-applicable'
    host_config_status = 'not-applicable'
    allowed = 'not-applicable'
    install_status = $InstallStatus
    safety = $safety
    skill_status = $SkillStatus
    project_status = 'not-applicable'
    result = $Result
    reason_code = $reasonCode
    next_action = $NextAction
    install_source = $InstallSource
    mirror_used = [bool]$MirrorUsed
    browser_capability_demand_signals = @($BrowserCapabilityDemandSignals)
  }
}

function Start-ParallelCommandTask {
  param(
    [string]$Name,
    [scriptblock]$ScriptBlock,
    [System.Collections.IDictionary]$Tasks
  )

  $statusPath = [System.IO.Path]::GetTempFileName()
  $job = Start-Job -ScriptBlock {
    param($InnerScriptBlock, $StatusPath)

    try {
      $global:LASTEXITCODE = 0
      & $InnerScriptBlock *> $null
      $exitCode = $LASTEXITCODE
    } catch {
      $exitCode = 1
    }

    Set-Content -Encoding ascii -NoNewline -Path $StatusPath -Value $exitCode
  } -ArgumentList $ScriptBlock, $statusPath

  $Tasks[$Name] = [ordered]@{
    job = $job
    status_path = $statusPath
  }
}

function Wait-ParallelCommandTasks {
  param(
    [System.Collections.IDictionary]$Tasks,
    [int]$TimeoutSeconds
  )

  $results = [ordered]@{}
  foreach ($entry in $Tasks.GetEnumerator()) {
    $completed = Wait-Job -Job $entry.Value.job -Timeout $TimeoutSeconds
    $exitCode = 1
    if (-not $completed) {
      Stop-Job -Job $entry.Value.job -Force | Out-Null
      $exitCode = 124
    }

    Receive-Job $entry.Value.job -ErrorAction SilentlyContinue | Out-Null
    if ($exitCode -ne 124 -and (Test-Path $entry.Value.status_path)) {
      $raw = Get-Content -Raw -Path $entry.Value.status_path
      if (-not [string]::IsNullOrWhiteSpace($raw)) {
        $exitCode = [int]$raw
      }
    }
    $results[$entry.Key] = $exitCode
    Remove-Job $entry.Value.job -Force | Out-Null
    Remove-Item $entry.Value.status_path -ErrorAction SilentlyContinue
  }

  return $results
}

$helperTools = [ordered]@{}
$providerReadiness = @()
$parallelTasks = [ordered]@{}
$platform = Get-PlatformName
$agentBrowserInstallMarker = Join-Path $HOME '.agent-browser/spec-first-install.json'
$stageTimeoutSeconds = Get-NonNegativeIntEnv -Name 'SPEC_FIRST_STAGE_TIMEOUT_SECONDS' -Default 900

$agentBrowserStatus = 'ready'
$agentBrowserDependencyStatus = 'ready'
$agentBrowserInstallStatus = 'ready'
$agentBrowserSkillStatus = 'ready'
$agentBrowserNextAction = ''
$agentBrowserBaselineBlocking = $false
$agentBrowserInstallSource = 'official'
$agentBrowserMirrorUsed = $false
$agentBrowserDemandSignals = Get-BrowserDemandSignals
$agentBrowserInstallCommand = 'agent-browser install'
if ($platform -eq 'linux') {
  $agentBrowserInstallCommand = 'agent-browser install --with-deps'
}
$agentBrowserFullInstallCommand = Get-HelperInstallCommand -Name 'agent-browser' -Platform $platform

$agentBrowserBrowserInstallQueued = $false
$agentBrowserSkillInstallQueued = $false
$astGrepSkillInstallQueued = $false

if (-not (Test-GlobalSkill 'agent-browser')) {
  $agentBrowserSkillStatus = 'action-required'
  $agentBrowserStatus = 'skipped'
  $agentBrowserNextAction = $agentBrowserFullInstallCommand
  if ($mode -eq 'install') {
    $agentBrowserSkillInstallQueued = $true
    Start-ParallelCommandTask -Name 'agent-browser-skill-install' -ScriptBlock {
      $global:LASTEXITCODE = 0
      npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y
      if ($LASTEXITCODE -eq 0) { return }
      $previousRegistry = [Environment]::GetEnvironmentVariable('NPM_CONFIG_REGISTRY')
      try {
        Set-Item -Path env:NPM_CONFIG_REGISTRY -Value 'https://registry.npmmirror.com'
        npx -y skills@latest add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y
      } finally {
        if ($null -eq $previousRegistry) {
          Remove-Item -Path env:NPM_CONFIG_REGISTRY -ErrorAction SilentlyContinue
        } else {
          Set-Item -Path env:NPM_CONFIG_REGISTRY -Value $previousRegistry
        }
      }
    } -Tasks $parallelTasks
  }
}

if (-not (Test-CommandExists 'agent-browser')) {
  $agentBrowserDependencyStatus = 'missing'
  $agentBrowserInstallStatus = 'action-required'
  $agentBrowserStatus = 'skipped'
  $agentBrowserNextAction = $agentBrowserFullInstallCommand
  if ($mode -eq 'install') {
    $agentBrowserBrowserInstallQueued = $true
    if ($platform -eq 'linux') {
      Start-ParallelCommandTask -Name 'agent-browser-browser-install' -ScriptBlock {
        $previousCi = $env:CI
        $env:CI = 'true'
        try {
          npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error
          if ($LASTEXITCODE -ne 0) {
            $previousRegistry = [Environment]::GetEnvironmentVariable('NPM_CONFIG_REGISTRY')
            try {
              Set-Item -Path env:NPM_CONFIG_REGISTRY -Value 'https://registry.npmmirror.com'
              npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error
            } finally {
              if ($null -eq $previousRegistry) {
                Remove-Item -Path env:NPM_CONFIG_REGISTRY -ErrorAction SilentlyContinue
              } else {
                Set-Item -Path env:NPM_CONFIG_REGISTRY -Value $previousRegistry
              }
            }
          }
          if ($LASTEXITCODE -eq 0) { agent-browser install --with-deps }
        } finally {
          $env:CI = $previousCi
        }
      } -Tasks $parallelTasks
    } else {
      Start-ParallelCommandTask -Name 'agent-browser-browser-install' -ScriptBlock {
        $previousCi = $env:CI
        $env:CI = 'true'
        try {
          npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error
          if ($LASTEXITCODE -ne 0) {
            $previousRegistry = [Environment]::GetEnvironmentVariable('NPM_CONFIG_REGISTRY')
            try {
              Set-Item -Path env:NPM_CONFIG_REGISTRY -Value 'https://registry.npmmirror.com'
              npm install -g agent-browser@latest --no-audit --no-fund --loglevel=error
            } finally {
              if ($null -eq $previousRegistry) {
                Remove-Item -Path env:NPM_CONFIG_REGISTRY -ErrorAction SilentlyContinue
              } else {
                Set-Item -Path env:NPM_CONFIG_REGISTRY -Value $previousRegistry
              }
            }
          }
          if ($LASTEXITCODE -eq 0) { agent-browser install }
        } finally {
          $env:CI = $previousCi
        }
      } -Tasks $parallelTasks
    }
  }
}

if ($agentBrowserDependencyStatus -eq 'ready' -and -not (Test-Path $agentBrowserInstallMarker)) {
  $agentBrowserInstallStatus = 'action-required'
  $agentBrowserStatus = 'skipped'
  $agentBrowserNextAction = $agentBrowserFullInstallCommand
  if ($mode -eq 'install') {
    $agentBrowserBrowserInstallQueued = $true
    if ($platform -eq 'linux') {
      Start-ParallelCommandTask -Name 'agent-browser-browser-install' -ScriptBlock {
        agent-browser install --with-deps
      } -Tasks $parallelTasks
    } else {
      Start-ParallelCommandTask -Name 'agent-browser-browser-install' -ScriptBlock {
        agent-browser install
      } -Tasks $parallelTasks
    }
  }
}

Add-HelperFact -HelperTools $helperTools -Id 'agent-browser' -Type 'helper' -DependencyStatus $agentBrowserDependencyStatus -InstallStatus $agentBrowserInstallStatus -SkillStatus $agentBrowserSkillStatus -Result $agentBrowserStatus -NextAction $agentBrowserNextAction -BaselineBlocking $agentBrowserBaselineBlocking -InstallSource $agentBrowserInstallSource -MirrorUsed $agentBrowserMirrorUsed -BrowserCapabilityDemandSignals $agentBrowserDemandSignals

foreach ($helperEntry in @($helperRegistry.helpers | Where-Object { ($_.kind -eq 'cli' -or $_.kind -eq 'browser-helper') -and $_.id -ne 'agent-browser' })) {
  $helper = [string]$helperEntry.id
  $status = 'ready'
  $dependencyStatus = 'ready'
  $installStatus = 'ready'
  $nextAction = ''
  $baselineBlocking = Test-EffectiveBaselineBlocking -Helper $helperEntry
  $installSource = 'official'
  $mirrorUsed = $false

  if (-not (Test-CommandExists $helper)) {
    $dependencyStatus = 'missing'
    $installStatus = 'action-required'
    $installCommand = Get-HelperInstallCommand -Name $helper -Platform $platform
    if ($helper -eq 'ast-grep' -and (Test-CommandExists 'rg') -and $mode -ne 'install') {
      $status = 'degraded'
      $nextAction = "ast-grep missing; falling back to rg. Install via: $installCommand"
    } elseif ($mode -eq 'install') {
      Reset-InstallProvenance
      if ((Invoke-HelperInstall -Name $helper -Platform $platform) -and (Test-CommandExists $helper)) {
        $dependencyStatus = 'ready'
        $installStatus = 'ready'
        $status = 'ready'
        $nextAction = ''
        $provenance = Get-InstallProvenance
        $installSource = $provenance.install_source
        $mirrorUsed = [bool]$provenance.mirror_used
      } else {
        if (-not $baselineBlocking) {
          $status = 'degraded'
          $nextAction = "optional helper; install via: $installCommand"
        } else {
          $status = 'action-required'
          $nextAction = $installCommand
        }
      }
    } else {
      if (-not $baselineBlocking) {
        $status = 'degraded'
        $nextAction = "optional helper; install via: $installCommand"
      } else {
        $status = 'action-required'
        $nextAction = $installCommand
      }
    }
  }

  Add-HelperFact -HelperTools $helperTools -Id $helper -Type 'helper' -DependencyStatus $dependencyStatus -InstallStatus $installStatus -SkillStatus 'not-applicable' -Result $status -NextAction $nextAction -BaselineBlocking $baselineBlocking -InstallSource $installSource -MirrorUsed $mirrorUsed
}

$astGrepSkillStatus = 'ready'
$astGrepSkillDependencyStatus = 'ready'
$astGrepSkillInstallStatus = 'ready'
$astGrepSkillNextAction = ''

if (-not (Test-GlobalSkill 'ast-grep')) {
  $astGrepSkillDependencyStatus = 'missing'
  $astGrepSkillInstallStatus = 'action-required'
  $astGrepSkillStatus = 'action-required'
  $astGrepSkillNextAction = Get-HelperInstallCommand -Name 'ast-grep-skill' -Platform $platform
  if ($mode -eq 'install') {
    $astGrepSkillInstallQueued = $true
    Start-ParallelCommandTask -Name 'ast-grep-skill-install' -ScriptBlock { npx -y skills@latest add ast-grep/agent-skill -g -y } -Tasks $parallelTasks
  }
}

$parallelResults = Wait-ParallelCommandTasks -Tasks $parallelTasks -TimeoutSeconds $stageTimeoutSeconds

  if ($agentBrowserSkillInstallQueued -or $agentBrowserBrowserInstallQueued) {
  if ($agentBrowserBrowserInstallQueued) {
    if (($parallelResults['agent-browser-browser-install'] -eq 0) -and (Test-CommandExists 'agent-browser')) {
      Write-AgentBrowserInstallMarker -InstallCommand $agentBrowserInstallCommand
      $agentBrowserInstallStatus = 'ready'
    } else {
      $agentBrowserInstallStatus = 'action-required'
      $agentBrowserStatus = 'degraded'
      $agentBrowserBaselineBlocking = $false
      $agentBrowserNextAction = "agent-browser browser runtime install failed; browser automation may be unavailable. Rerun $agentBrowserInstallCommand or set AGENT_BROWSER_EXECUTABLE_PATH to an existing Chrome/Chromium/Brave executable."
    }
  }

  if ($agentBrowserSkillInstallQueued) {
    if (($parallelResults['agent-browser-skill-install'] -eq 0) -and (Test-GlobalSkill 'agent-browser')) {
      $agentBrowserSkillStatus = 'ready'
    } else {
      $agentBrowserSkillStatus = 'action-required'
      $agentBrowserStatus = 'degraded'
      $agentBrowserBaselineBlocking = $false
      if ($agentBrowserDependencyStatus -eq 'ready' -and $agentBrowserInstallStatus -eq 'ready') {
        $agentBrowserNextAction = 'install global agent-browser skill manually'
      }
    }
  }

  if (($agentBrowserDependencyStatus -eq 'ready') -and ($agentBrowserInstallStatus -eq 'ready') -and ($agentBrowserSkillStatus -eq 'ready')) {
    $agentBrowserStatus = 'ready'
    $agentBrowserBaselineBlocking = $false
    $agentBrowserNextAction = ''
  }

  Add-HelperFact -HelperTools $helperTools -Id 'agent-browser' -Type 'helper' -DependencyStatus $agentBrowserDependencyStatus -InstallStatus $agentBrowserInstallStatus -SkillStatus $agentBrowserSkillStatus -Result $agentBrowserStatus -NextAction $agentBrowserNextAction -BaselineBlocking $agentBrowserBaselineBlocking -InstallSource $agentBrowserInstallSource -MirrorUsed $agentBrowserMirrorUsed -BrowserCapabilityDemandSignals $agentBrowserDemandSignals
}

if ($astGrepSkillInstallQueued) {
    if (($parallelResults['ast-grep-skill-install'] -eq 0) -and (Test-GlobalSkill 'ast-grep')) {
      $astGrepSkillDependencyStatus = 'ready'
      $astGrepSkillInstallStatus = 'ready'
      $astGrepSkillStatus = 'ready'
      $astGrepSkillNextAction = ''
    } else {
      $astGrepSkillDependencyStatus = 'missing'
      $astGrepSkillInstallStatus = 'action-required'
      $astGrepSkillStatus = 'action-required'
      if ($parallelResults['ast-grep-skill-install'] -eq 124) {
        $astGrepSkillNextAction = "global ast-grep skill install timed out after ${stageTimeoutSeconds}s"
      } else {
        $astGrepSkillNextAction = 'install global ast-grep skill manually'
      }
  }

  Add-HelperFact -HelperTools $helperTools -Id 'ast-grep-skill' -Type 'global-skill' -DependencyStatus $astGrepSkillDependencyStatus -InstallStatus $astGrepSkillInstallStatus -SkillStatus $astGrepSkillStatus -Result $astGrepSkillStatus -NextAction $astGrepSkillNextAction
} elseif (-not (Test-GlobalSkill 'ast-grep')) {
  Add-HelperFact -HelperTools $helperTools -Id 'ast-grep-skill' -Type 'global-skill' -DependencyStatus $astGrepSkillDependencyStatus -InstallStatus $astGrepSkillInstallStatus -SkillStatus $astGrepSkillStatus -Result $astGrepSkillStatus -NextAction $astGrepSkillNextAction
} else {
  Add-HelperFact -HelperTools $helperTools -Id 'ast-grep-skill' -Type 'global-skill' -DependencyStatus $astGrepSkillDependencyStatus -InstallStatus $astGrepSkillInstallStatus -SkillStatus $astGrepSkillStatus -Result $astGrepSkillStatus -NextAction $astGrepSkillNextAction
}

function Test-ProviderConsentApproved {
  param([string]$Provider)
  $value = [Environment]::GetEnvironmentVariable("SPEC_FIRST_PROVIDER_${Provider}_CONSENT")
  if ([string]::IsNullOrWhiteSpace($value)) { return $false }
  return @('approved', 'yes', 'true', '1') -contains $value.ToLowerInvariant()
}

function Set-GraphifyFirstGenerationFact {
  param(
    [string]$Status,
    [string]$WorkspacePath = '',
    [string]$ArtifactRoot = '',
    [string]$ArtifactRef = '',
    [string]$NextAction = ''
  )

  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS -Value $Status
  if (-not [string]::IsNullOrWhiteSpace($WorkspacePath)) {
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_REQUIREMENT_WORKSPACE_PATH -Value $WorkspacePath
  }
  if (-not [string]::IsNullOrWhiteSpace($ArtifactRoot)) {
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT -Value $ArtifactRoot
  }
  if (-not [string]::IsNullOrWhiteSpace($ArtifactRef)) {
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_REF -Value $ArtifactRef
  }
  if (-not [string]::IsNullOrWhiteSpace($NextAction)) {
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_NEXT_ACTION -Value $NextAction
  }
}

function Reset-GraphifyResolver {
  $script:GraphifyResolvedCommand = ''
  $script:GraphifyResolvedOnPath = ''
  Remove-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND -ErrorAction SilentlyContinue
  Remove-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH -ErrorAction SilentlyContinue
}

function Resolve-GraphifyOnOriginalPath {
  $originalPath = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_ORIGINAL_PATH')
  if ([string]::IsNullOrWhiteSpace($originalPath)) {
    $originalPath = $graphifyOriginalPath
  }

  $previousPath = $env:PATH
  try {
    $env:PATH = $originalPath
    $command = Get-Command -Name 'graphify' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command -and -not [string]::IsNullOrWhiteSpace([string]$command.Source)) {
      return [string]$command.Source
    }
  } finally {
    $env:PATH = $previousPath
  }
  return ''
}

function Get-GraphifyKnownCliCandidates {
  $candidates = @()
  foreach ($name in @('graphify', 'graphify.exe', 'graphify.cmd')) {
    $candidates += (Join-Path $homeLocalBin $name)
  }
  if (Test-CommandExists 'npm') {
    $npmPrefix = ''
    try {
      $npmPrefix = (& npm prefix -g 2>$null | Select-Object -First 1)
    } catch {
      $npmPrefix = ''
    }
    if (-not [string]::IsNullOrWhiteSpace($npmPrefix)) {
      foreach ($name in @('graphify', 'graphify.exe', 'graphify.cmd')) {
        $candidates += (Join-Path (Join-Path $npmPrefix 'bin') $name)
      }
    }
  }
  return $candidates
}

function Set-GraphifyResolvedCommand {
  param(
    [string]$Command,
    [bool]$OnPath
  )
  $script:GraphifyResolvedCommand = $Command
  $script:GraphifyResolvedOnPath = if ($OnPath) { 'true' } else { 'false' }
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_COMMAND -Value $script:GraphifyResolvedCommand
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_RESOLVED_ON_PATH -Value $script:GraphifyResolvedOnPath
}

function Resolve-GraphifyCli {
  if (-not [string]::IsNullOrWhiteSpace($script:GraphifyResolvedCommand)) {
    return $script:GraphifyResolvedCommand
  }

  $pathCommand = Resolve-GraphifyOnOriginalPath
  if (-not [string]::IsNullOrWhiteSpace($pathCommand)) {
    Set-GraphifyResolvedCommand -Command $pathCommand -OnPath $true
    return $script:GraphifyResolvedCommand
  }

  foreach ($candidate in Get-GraphifyKnownCliCandidates) {
    $command = Get-Command -Name $candidate -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command -and -not [string]::IsNullOrWhiteSpace([string]$command.Source)) {
      Set-GraphifyResolvedCommand -Command ([string]$command.Source) -OnPath $false
      return $script:GraphifyResolvedCommand
    }
  }

  return ''
}

function Invoke-GraphifyCommandWithTimeout {
  param(
    [string]$Command,
    [string[]]$Arguments,
    [int]$TimeoutSeconds = $stageTimeoutSeconds
  )

  $job = Start-Job -ScriptBlock {
    param($InnerCommand, $InnerArguments)
    try {
      $global:LASTEXITCODE = 0
      & $InnerCommand @InnerArguments *> $null
      return $LASTEXITCODE
    } catch {
      return 1
    }
  } -ArgumentList $Command, $Arguments

  $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds
  if (-not $completed) {
    Stop-Job -Job $job -Force | Out-Null
    Remove-Job -Job $job -Force | Out-Null
    return $false
  }

  $result = Receive-Job -Job $job -ErrorAction SilentlyContinue | Select-Object -Last 1
  Remove-Job -Job $job -Force | Out-Null
  return ([int]$result -eq 0)
}

function Get-GraphifyVersionOutputWithTimeout {
  param(
    [string]$Command,
    [int]$TimeoutSeconds = 30
  )

  $job = Start-Job -ScriptBlock {
    param($InnerCommand)
    try {
      & $InnerCommand --version 2>$null
    } catch {
      ''
    }
  } -ArgumentList $Command

  $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds
  if (-not $completed) {
    Stop-Job -Job $job -Force | Out-Null
    Remove-Job -Job $job -Force | Out-Null
    return ''
  }

  $output = (Receive-Job -Job $job -ErrorAction SilentlyContinue) -join "`n"
  Remove-Job -Job $job -Force | Out-Null
  return $output
}

function Test-GraphifyCommandVersionMatchesPin {
  param([string]$Command)
  if ([string]::IsNullOrWhiteSpace($Command)) { return $false }
  $output = Get-GraphifyVersionOutputWithTimeout -Command $Command
  return ($output -match "(^|[^0-9A-Za-z.])$([regex]::Escape($graphifyVersionPin))([^0-9A-Za-z.]|$)")
}

function Resolve-GraphifyCliMatchingPin {
  Reset-GraphifyResolver

  $pathCommand = Resolve-GraphifyOnOriginalPath
  if ((-not [string]::IsNullOrWhiteSpace($pathCommand)) -and (Test-GraphifyCommandVersionMatchesPin -Command $pathCommand)) {
    Set-GraphifyResolvedCommand -Command $pathCommand -OnPath $true
    return $script:GraphifyResolvedCommand
  }

  foreach ($candidate in Get-GraphifyKnownCliCandidates) {
    $command = Get-Command -Name $candidate -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command -and -not [string]::IsNullOrWhiteSpace([string]$command.Source)) {
      $source = [string]$command.Source
      if (Test-GraphifyCommandVersionMatchesPin -Command $source) {
        Set-GraphifyResolvedCommand -Command $source -OnPath $false
        return $script:GraphifyResolvedCommand
      }
    }
  }

  return ''
}

function Repair-GraphifyPathSymlinkIfSafe {
  $repairSetting = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_REPAIR_PATH_SYMLINK')
  if ($repairSetting -in @('false', 'FALSE', 'no', 'NO', '0')) { return }

  $pathCommand = Resolve-GraphifyOnOriginalPath
  if ([string]::IsNullOrWhiteSpace($pathCommand)) { return }
  if (Test-GraphifyCommandVersionMatchesPin -Command $pathCommand) { return }

  $pathItem = Get-Item -LiteralPath $pathCommand -Force -ErrorAction SilentlyContinue
  if ($null -eq $pathItem) { return }
  if ($pathItem.LinkType -notin @('SymbolicLink', 'Junction')) { return }

  $pinnedCommand = Resolve-GraphifyCliMatchingPin
  if ([string]::IsNullOrWhiteSpace($pinnedCommand)) { return }
  if ($pinnedCommand -eq $pathCommand) { return }
  if (-not (Test-Path -LiteralPath $pinnedCommand -PathType Leaf)) { return }

  $backupPath = "$pathCommand.old"
  $index = 1
  while ((Test-Path -LiteralPath $backupPath) -or ((Get-Item -LiteralPath $backupPath -Force -ErrorAction SilentlyContinue) -ne $null)) {
    $backupPath = "$pathCommand.old.$index"
    $index += 1
  }

  try {
    Move-Item -LiteralPath $pathCommand -Destination $backupPath -ErrorAction Stop
    try {
      New-Item -ItemType SymbolicLink -Path $pathCommand -Target $pinnedCommand -Force -ErrorAction Stop | Out-Null
    } catch {
      if (-not (Test-Path -LiteralPath $pathCommand)) {
        Move-Item -LiteralPath $backupPath -Destination $pathCommand -ErrorAction SilentlyContinue
      }
      throw
    }
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_PATH_SYMLINK_REPAIRED -Value 'true'
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_PATH_SYMLINK_REPAIRED_FROM -Value $pathCommand
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_PATH_SYMLINK_REPAIRED_TO -Value $pinnedCommand
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_PATH_SYMLINK_BACKUP -Value $backupPath
    Write-StageLog 'provider:graphify' "repaired stale PATH symlink $pathCommand -> $pinnedCommand (backup: $backupPath)"
    Reset-GraphifyResolver
  } catch {
    Write-StageLog 'provider:graphify' "stale PATH symlink repair skipped"
  }
}

function Invoke-GraphifyCommand {
  param(
    [string[]]$Arguments,
    [int]$TimeoutSeconds = $stageTimeoutSeconds
  )
  $graphifyCommand = Resolve-GraphifyCli
  if ([string]::IsNullOrWhiteSpace($graphifyCommand)) { return $false }
  $graphifyArguments = @($Arguments)
  return (Invoke-GraphifyCommandWithTimeout -Command $graphifyCommand -Arguments $graphifyArguments -TimeoutSeconds $TimeoutSeconds)
}

function Join-WindowsProcessArguments {
  param([object[]]$Arguments)

  $quoted = foreach ($argument in @($Arguments)) {
    $value = [string]$argument
    if ($value.Length -eq 0) { '""'; continue }
    if ($value -notmatch '[\s"]') { $value; continue }
    '"' + $value.Replace('\', '\\').Replace('"', '\"') + '"'
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

function Invoke-GraphifyCommandCapture {
  param(
    [string[]]$Arguments,
    [int]$TimeoutSeconds = $stageTimeoutSeconds
  )

  $graphifyCommand = Resolve-GraphifyCli
  if ([string]::IsNullOrWhiteSpace($graphifyCommand)) {
    $script:GraphifyRunDiagnostic = 'graphify CLI not found'
    $script:GraphifyRunOutput = ''
    $script:GraphifyRunExitCode = 127
    return [pscustomobject]@{ ok = $false; exit_code = 127; stdout = ''; diagnostic_summary = $script:GraphifyRunDiagnostic }
  }

  $processInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $processInfo.FileName = $graphifyCommand
  Set-ProcessArgumentsCompat -ProcessInfo $processInfo -Arguments @($Arguments)
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true
  $processInfo.UseShellExecute = $false

  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $processInfo
  try {
    [void]$process.Start()
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $timedOut = -not $process.WaitForExit($TimeoutSeconds * 1000)
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
    $stdout = [string]$stdoutTask.Result
    $stderr = [string]$stderrTask.Result
    $exitCode = if ($timedOut) { 124 } else { [int]$process.ExitCode }
    $diagnostic = (@($stderr, $stdout) | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) }) -join ' '
    if ($diagnostic.Length -gt 1000) { $diagnostic = $diagnostic.Substring(0, 1000) }
    $script:GraphifyRunDiagnostic = $diagnostic
    $script:GraphifyRunOutput = $stdout
    $script:GraphifyRunExitCode = $exitCode
    return [pscustomobject]@{ ok = ($exitCode -eq 0); exit_code = $exitCode; stdout = $stdout; diagnostic_summary = $diagnostic }
  } catch {
    $script:GraphifyRunDiagnostic = [string]$_.Exception.Message
    $script:GraphifyRunOutput = ''
    $script:GraphifyRunExitCode = 1
    return [pscustomobject]@{ ok = $false; exit_code = 1; stdout = ''; diagnostic_summary = $script:GraphifyRunDiagnostic }
  } finally {
    $process.Dispose()
  }
}

function Test-GraphifyOutputRequestsForceOverwrite {
  param([string]$Output)
  return ($Output -match 'Refusing to overwrite' -and $Output -match '--force')
}

function Repair-GraphifyHookPathVisibility {
  param([string]$RepoRoot)
  if ($script:GraphifyResolvedOnPath -ne 'false') { return }

  $graphifyCommand = Resolve-GraphifyCli
  if ([string]::IsNullOrWhiteSpace($graphifyCommand)) { return }
  $graphifyBinDir = Split-Path -Parent $graphifyCommand
  if ([string]::IsNullOrWhiteSpace($graphifyBinDir) -or -not (Test-Path -LiteralPath $graphifyBinDir -PathType Container)) { return }

  $hooksDir = Join-Path $RepoRoot '.git/hooks'
  if (-not (Test-Path -LiteralPath $hooksDir -PathType Container)) { return }

  $escapedBinDir = $graphifyBinDir.Replace("'", "'\''")
  $repairBlock = "# spec-first graphify path repair start`nexport PATH='$escapedBinDir':`"`$PATH`"`n# spec-first graphify path repair end`n"

  foreach ($hookName in @('post-commit', 'post-checkout')) {
    $hookPath = Join-Path $hooksDir $hookName
    if (-not (Test-Path -LiteralPath $hookPath -PathType Leaf)) { continue }
    $text = Get-Content -LiteralPath $hookPath -Raw
    if ($text -notlike '*Installed by: graphify hook install*') { continue }
    if (($text -like '*# spec-first graphify path repair start*') -and ($text -like '*# spec-first graphify path repair end*')) {
      $newText = [regex]::Replace(
        $text,
        '# spec-first graphify path repair start[\s\S]*?# spec-first graphify path repair end\s*',
        [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $repairBlock },
        1
      )
    } else {
      $lines = $text -split "(`r`n|`n)", 2
      if ($lines.Count -ge 3 -and $lines[0].StartsWith('#!')) {
        $newText = $lines[0] + $lines[1] + $repairBlock + $lines[2]
      } else {
        $newText = $repairBlock + $text
      }
    }
    if ($newText -ne $text) {
      Set-Content -LiteralPath $hookPath -Value $newText -NoNewline
    }
  }

  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_PATH_REPAIRED -Value 'true'
}

function Resolve-RequirementWorkspace {
  param(
    [string]$RepoRoot,
    [string]$Candidate,
    [string]$ArtifactRoot
  )

  if ([string]::IsNullOrWhiteSpace($Candidate)) {
    $Candidate = '.'
  } else {
    if ([System.IO.Path]::IsPathRooted($Candidate)) {
      return [ordered]@{ ok = $false; reason_code = 'requirement-workspace-absolute' }
    }
    $parts = $Candidate -split '[\\/]+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    if ($parts -contains '..') {
      return [ordered]@{ ok = $false; reason_code = 'requirement-workspace-escape' }
    }
  }

  $repoFull = [System.IO.Path]::GetFullPath($RepoRoot)
  $workspaceFull = [System.IO.Path]::GetFullPath((Join-Path $repoFull $Candidate))
  if (-not $workspaceFull.StartsWith($repoFull, [System.StringComparison]::Ordinal)) {
    return [ordered]@{ ok = $false; reason_code = 'requirement-workspace-escape' }
  }
  if (-not (Test-Path -LiteralPath $workspaceFull -PathType Container)) {
    return [ordered]@{ ok = $false; reason_code = 'requirement-workspace-missing' }
  }
  $resolvedWorkspace = (Resolve-Path -LiteralPath $workspaceFull).Path
  if (-not $resolvedWorkspace.StartsWith($repoFull, [System.StringComparison]::Ordinal)) {
    return [ordered]@{ ok = $false; reason_code = 'requirement-workspace-escape' }
  }

  if ([string]::IsNullOrWhiteSpace($ArtifactRoot)) {
    $ArtifactRoot = '.graphify'
  }
  if ([System.IO.Path]::IsPathRooted($ArtifactRoot)) {
    return [ordered]@{ ok = $false; reason_code = 'graphify-artifact-root-absolute' }
  }
  $artifactParts = $ArtifactRoot -split '[\\/]+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  if ($artifactParts -contains '..') {
    return [ordered]@{ ok = $false; reason_code = 'graphify-artifact-root-escape' }
  }

  $artifactFull = [System.IO.Path]::GetFullPath((Join-Path $repoFull $ArtifactRoot))
  if (-not $artifactFull.StartsWith($repoFull, [System.StringComparison]::Ordinal)) {
    return [ordered]@{ ok = $false; reason_code = 'graphify-artifact-root-escape' }
  }
  $workspaceRel = [System.IO.Path]::GetRelativePath($repoFull, $resolvedWorkspace).Replace('\', '/')
  $artifactRel = [System.IO.Path]::GetRelativePath($repoFull, $artifactFull).Replace('\', '/')
  return [ordered]@{
    ok = $true
    workspace_abs = $resolvedWorkspace
    workspace_rel = $workspaceRel
    artifact_abs = $artifactFull
    artifact_rel = $artifactRel
  }
}

function Invoke-GraphifyFirstGenerationIfRequested {
  if (-not (Test-ProviderConsentApproved -Provider 'GRAPHIFY')) { return }
  $repoRoot = $providerRepoRoot

  $resolved = Resolve-RequirementWorkspace -RepoRoot $repoRoot -Candidate $RequirementWorkspace -ArtifactRoot $graphifyArtifactRootDefault
  if (-not [bool]$resolved.ok) {
    Set-GraphifyFirstGenerationFact -Status 'skipped' -NextAction ([string]$resolved.reason_code)
    return
  }

  if ([string]::IsNullOrWhiteSpace((Resolve-GraphifyCli))) {
    Set-GraphifyFirstGenerationFact -Status 'skipped' -NextAction 'graphify-cli-required'
    return
  }

  if ($graphifyRefreshRequested -and [string]$resolved.workspace_rel -eq '.') {
    $refreshOk = Invoke-GraphifyCodeOnlyFallback -RepoRoot $repoRoot -WorkspacePath ([string]$resolved.workspace_rel)
    if ($refreshOk) {
      $artifactRef = Get-GraphifyArtifactRef -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
      if (-not [string]::IsNullOrWhiteSpace($artifactRef)) {
        Invoke-GraphifyQueryProbe -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
        Set-GraphifyFirstGenerationFact -Status 'completed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-refresh-used'
        return
      }
    } elseif (Test-GraphifyOutputRequestsForceOverwrite -Output $script:GraphifyRunDiagnostic) {
      $forceOk = Invoke-GraphifyForceOverwriteRepair -RepoRoot $repoRoot -WorkspacePath ([string]$resolved.workspace_rel)
      if ($forceOk) {
        $artifactRef = Get-GraphifyArtifactRef -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
        if (-not [string]::IsNullOrWhiteSpace($artifactRef)) {
          Invoke-GraphifyQueryProbe -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
          Set-GraphifyFirstGenerationFact -Status 'completed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-refresh-force-overwrite-used'
          return
        }
      }
      Set-GraphifyFirstGenerationFact -Status 'failed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -NextAction 'graphify-refresh-force-overwrite-failed'
      return
    }
    Set-GraphifyFirstGenerationFact -Status 'failed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -NextAction 'graphify-refresh-failed'
    return
  }

  if ([string]$resolved.workspace_rel -eq '.') {
    Push-Location $repoRoot
    try {
      $extractOk = Invoke-GraphifyCommand @('extract', '.')
    } finally {
      Pop-Location
    }
  } else {
    $extractOk = Invoke-GraphifyCommand @('extract', ([string]$resolved.workspace_abs), '--out', $repoRoot)
  }
  if ($extractOk) {
    $artifactRef = Get-GraphifyArtifactRef -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
    Invoke-GraphifyQueryProbe -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
    Set-GraphifyFirstGenerationFact -Status 'completed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef
  } else {
    if ([string]$resolved.workspace_rel -eq '.') {
      $fallbackOk = Invoke-GraphifyCodeOnlyFallback -RepoRoot $repoRoot -WorkspacePath ([string]$resolved.workspace_rel)
      if ($fallbackOk) {
        $artifactRef = Get-GraphifyArtifactRef -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
        if (-not [string]::IsNullOrWhiteSpace($artifactRef)) {
          Invoke-GraphifyQueryProbe -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
          Set-GraphifyFirstGenerationFact -Status 'completed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-code-only-fallback-used'
          return
        }
      } elseif (Test-GraphifyOutputRequestsForceOverwrite -Output $script:GraphifyRunDiagnostic) {
        $forceOk = Invoke-GraphifyForceOverwriteRepair -RepoRoot $repoRoot -WorkspacePath ([string]$resolved.workspace_rel)
        if ($forceOk) {
          $artifactRef = Get-GraphifyArtifactRef -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
          if (-not [string]::IsNullOrWhiteSpace($artifactRef)) {
            Invoke-GraphifyQueryProbe -RepoRoot $repoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
            Set-GraphifyFirstGenerationFact -Status 'completed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-force-overwrite-used'
            return
          }
        }
        Set-GraphifyFirstGenerationFact -Status 'failed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -NextAction 'graphify-force-overwrite-failed'
        return
      }
    }
    Set-GraphifyFirstGenerationFact -Status 'failed' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -NextAction 'graphify-first-generation-failed'
  }
}

function Get-GraphifyArtifactRef {
  param(
    [string]$RepoRoot,
    [string]$ArtifactRoot
  )
  foreach ($candidate in @('graph.json', 'GRAPH_REPORT.md')) {
    $relative = ($ArtifactRoot.TrimEnd('/')) + '/' + $candidate
    if (Test-Path -LiteralPath (Join-Path $RepoRoot $relative) -PathType Leaf) {
      return $relative
    }
  }
  return ''
}

function Invoke-GraphifyCodeOnlyFallback {
  param(
    [string]$RepoRoot,
    [string]$WorkspacePath
  )
  if ($WorkspacePath -ne '.') { return $false }
  Push-Location $RepoRoot
  try {
    $result = Invoke-GraphifyCommandCapture -Arguments @('update', '.')
    return [bool]$result.ok
  } finally {
    Pop-Location
  }
}

function Invoke-GraphifyForceOverwriteRepair {
  param(
    [string]$RepoRoot,
    [string]$WorkspacePath
  )
  if ($WorkspacePath -ne '.') { return $false }
  Push-Location $RepoRoot
  try {
    $result = Invoke-GraphifyCommandCapture -Arguments @('update', '.', '--force')
    return [bool]$result.ok
  } finally {
    Pop-Location
  }
}

function Test-GraphifyCliVersionMatchesPin {
  $graphifyCommand = Resolve-GraphifyCli
  if ([string]::IsNullOrWhiteSpace($graphifyCommand)) { return $false }
  return (Test-GraphifyCommandVersionMatchesPin -Command $graphifyCommand)
}

function Install-GraphifyCli {
  if (-not [string]::IsNullOrWhiteSpace((Resolve-GraphifyCliMatchingPin))) {
    Repair-GraphifyPathSymlinkIfSafe
    if (-not [string]::IsNullOrWhiteSpace((Resolve-GraphifyCliMatchingPin))) { return $true }
    return $true
  }
  if (Test-CommandExists 'npm') {
    if (Invoke-NpmGlobalInstallWithOptionalSudo -Packages @("$graphifyPackage@$graphifyVersionPin")) {
      Reset-GraphifyResolver
      Repair-GraphifyPathSymlinkIfSafe
      if (-not [string]::IsNullOrWhiteSpace((Resolve-GraphifyCliMatchingPin))) { return $true }
    }
  }
  return $false
}

function Get-GraphifyProjectPlatform {
  $hostValue = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_HOST')
  if (@('claude', 'codex', 'kiro', 'qoder') -contains $hostValue) { return $hostValue }
  return 'codex'
}

function Get-GraphifyInstructionFileName {
  param([string]$PlatformName)
  if (@('claude', 'windows') -contains $PlatformName) { return 'CLAUDE.md' }
  return 'AGENTS.md'
}

function Test-SpecFirstSourceRepo {
  param([string]$RepoRoot)
  $packageJsonPath = Join-Path $RepoRoot 'package.json'
  if (-not (Test-Path -LiteralPath $packageJsonPath -PathType Leaf)) { return $false }
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot 'skills/spec-mcp-setup') -PathType Container)) { return $false }
  if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot 'AGENTS.md') -PathType Leaf)) { return $false }
  try {
    $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
    return ([string]$packageJson.name -eq 'spec-first')
  } catch {
    return $false
  }
}

function Get-GraphifyInstructionSection {
  param([string]$PlatformName)
  if (@('claude', 'windows') -contains $PlatformName) {
    return @'
## graphify

This project has a knowledge graph at .graphify/ with god nodes, community structure, and cross-file relationships.

Rules:
- Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `.graphify/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid. Resolve the command as `graphify` from `PATH`, or `$HOME/.local/bin/graphify` (`.exe`/`.cmd` on Windows) when that executable exists. Use `query` for broad orientation; use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped candidate subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Do not use Graphify by default for simple factual Q&A, current conversation or context summaries, user-provided single-document summarization/editing, or already-scoped file reads; answer directly, use `rg`, or perform bounded source reads.
- If `.graphify/graph.json` exists but no Graphify CLI is visible, do not treat the artifact as runtime readiness. Use bounded direct source reads and mention `spec-mcp-setup --only graphify` as the setup repair path when Graphify would help.
- Dirty `.graphify/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `.graphify/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `.graphify/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- Treat legacy `graphify-out/` as compatibility-only evidence; prefer `spec-mcp-setup --only graphify --refresh` to regenerate provider-native `.graphify/`.
- Treat Graphify/code-graph output as `provider_untrusted` advisory navigation; confirm important conclusions from source/test/log/doc evidence and record limitations when confirmation is unavailable.
- Ordinary workflows do not refresh project graphs after code changes. Treat graph freshness as a setup/readiness advisory from `docs/contracts/project-graph-consumption.md`; confirm conclusions from source/test/log evidence and use `spec-mcp-setup --only graphify` when setup repair would help.
'@
  }
  return @'
## graphify

This project has a knowledge graph at .graphify/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- Use Graphify as exploration-tier orientation for architecture relationships, cross-file relationships, impact analysis, broad codebase navigation, or questions about how one project area connects to another, when `.graphify/graph.json` exists and a Graphify CLI is runtime-visible. A useful Graphify candidate may decide where to inspect next; reading source first is always valid. Resolve the command as `graphify` from `PATH`, or `$HOME/.local/bin/graphify` (`.exe`/`.cmd` on Windows) when that executable exists. Use `query` for broad orientation; use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped candidate subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Do not use Graphify by default for simple factual Q&A, current conversation or context summaries, user-provided single-document summarization/editing, or already-scoped file reads; answer directly, use `rg`, or perform bounded source reads.
- If `.graphify/graph.json` exists but no Graphify CLI is visible, do not treat the artifact as runtime readiness. Use bounded direct source reads and mention `spec-mcp-setup --only graphify` as the setup repair path when Graphify would help.
- Dirty `.graphify/` files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `.graphify/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `.graphify/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- Treat legacy `graphify-out/` as compatibility-only evidence; prefer `spec-mcp-setup --only graphify --refresh` to regenerate provider-native `.graphify/`.
- Treat Graphify/code-graph output as `provider_untrusted` advisory navigation; confirm important conclusions from source/test/log/doc evidence and record limitations when confirmation is unavailable.
- Ordinary workflows do not refresh project graphs after code changes. Treat graph freshness as a setup/readiness advisory from `docs/contracts/project-graph-consumption.md`; confirm conclusions from source/test/log evidence and use `spec-mcp-setup --only graphify` when setup repair would help.
'@
}

function Normalize-GraphifyInstructionSection {
  param(
    [string]$RepoRoot,
    [string]$PlatformName
  )
  if (Test-SpecFirstSourceRepo -RepoRoot $RepoRoot) { return }
  $instructionFile = Get-GraphifyInstructionFileName -PlatformName $PlatformName
  $target = Join-Path $RepoRoot $instructionFile
  if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { return }
  $content = [System.IO.File]::ReadAllText($target)
  $section = (Get-GraphifyInstructionSection -PlatformName $PlatformName).TrimEnd() + "`n"
  $pattern = '(?s)\n*## graphify\n.*?(?=\n## |\n<!-- spec-first:[^>]+:start -->|\z)'
  if ($content.Contains('## graphify')) {
    $regex = [regex]$pattern
    $newContent = $regex.Replace(
      $content,
      [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        if ($match.Index -eq 0) { return $section }
        return "`n`n$section"
      },
      1
    )
  } else {
    $separator = if ($content.EndsWith("`n")) { '' } else { "`n" }
    $newContent = "$content$separator`n$section"
  }
  if ($newContent -ne $content) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($target, $newContent, $utf8NoBom)
  }
}

function Test-GraphifyProjectSkillConfigured {
  param([string]$RepoRoot)
  $platformName = Get-GraphifyProjectPlatform
  if ($platformName -eq 'claude' -or $platformName -eq 'windows') {
    return (Test-Path -LiteralPath (Join-Path $RepoRoot '.claude/skills/graphify/SKILL.md') -PathType Leaf)
  }
  if ($platformName -eq 'kiro') {
    return (Test-Path -LiteralPath (Join-Path $RepoRoot '.kiro/skills/graphify/SKILL.md') -PathType Leaf)
  }
  if ($platformName -eq 'qoder') {
    return (Test-Path -LiteralPath (Join-Path $RepoRoot '.qoder/skills/graphify/SKILL.md') -PathType Leaf)
  }
  return (
    (Test-Path -LiteralPath (Join-Path $RepoRoot '.codex/skills/graphify/SKILL.md') -PathType Leaf) -or
    (Test-Path -LiteralPath (Join-Path $RepoRoot '.agents/skills/graphify/SKILL.md') -PathType Leaf)
  )
}

function Ensure-GraphifyProjectSkill {
  param([string]$RepoRoot)
  $platformName = Get-GraphifyProjectPlatform
  if (Test-GraphifyProjectSkillConfigured -RepoRoot $RepoRoot) {
    try {
      Normalize-GraphifyInstructionSection -RepoRoot $RepoRoot -PlatformName $platformName
    } catch {
    }
    Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED -Value 'true'
    return $true
  }
  return (Install-GraphifyProjectSkill -RepoRoot $RepoRoot)
}

function Install-GraphifyProjectSkill {
  param([string]$RepoRoot)
  $platformName = Get-GraphifyProjectPlatform
  Push-Location $RepoRoot
  try {
    if (Invoke-GraphifyCommand @('install', '--project', '--platform', $platformName)) {
      try {
        Normalize-GraphifyInstructionSection -RepoRoot $RepoRoot -PlatformName $platformName
      } catch {
      }
      Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED -Value 'true'
      return $true
    }
  } finally {
    Pop-Location
  }
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED -Value 'false'
  Set-GraphifyFirstGenerationFact -Status 'skipped' -NextAction 'graphify-project-skill-install-failed'
  return $false
}

function Test-GraphifyHookStatusIfAvailable {
  param([string]$RepoRoot)
  Push-Location $RepoRoot
  try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) {
      if (Invoke-GraphifyCommand @('hook', 'status')) {
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'true'
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'true'
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'verified'
        return $true
      }
      return $false
    }
  } finally {
    Pop-Location
  }
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'skipped'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON -Value 'not-a-git-repo'
  return $true
}

function Install-GraphifyHookIfAvailable {
  param([string]$RepoRoot)
  Push-Location $RepoRoot
  try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) {
      if (Invoke-GraphifyCommand @('hook', 'install')) {
        try {
          Repair-GraphifyHookPathVisibility -RepoRoot $RepoRoot
        } catch {
        }
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'true'
        if (Invoke-GraphifyCommand @('hook', 'status')) {
          Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'true'
          Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'verified'
          return $true
        }
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'false'
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'failed'
        Set-GraphifyFirstGenerationFact -Status ([Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS')) -NextAction 'graphify-hook-status-failed'
        return $false
      } else {
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'false'
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'false'
        Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'failed'
        Set-GraphifyFirstGenerationFact -Status ([Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS')) -NextAction 'graphify-hook-install-failed'
        return $false
      }
    }
  } finally {
    Pop-Location
  }
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'skipped'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON -Value 'not-a-git-repo'
  return $true
}

function Test-GraphifyFirstGenerationReadyForHook {
  if ([Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_FIRST_GENERATION_STATUS') -ne 'completed') {
    return $false
  }
  $artifactRoot = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_ROOT')
  if ([string]::IsNullOrWhiteSpace($artifactRoot)) { $artifactRoot = '.graphify' }
  $artifactRef = [Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_ARTIFACT_REF')
  if (-not [string]::IsNullOrWhiteSpace($artifactRef) -and (Test-Path -LiteralPath (Join-Path $providerRepoRoot $artifactRef) -PathType Leaf)) {
    return $true
  }
  return (
    (Test-Path -LiteralPath (Join-Path $providerRepoRoot (Join-Path $artifactRoot 'graph.json')) -PathType Leaf) -or
    (Test-Path -LiteralPath (Join-Path $providerRepoRoot (Join-Path $artifactRoot 'GRAPH_REPORT.md')) -PathType Leaf)
  )
}

function Set-GraphifyHookSkipped {
  param([string]$Reason)
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED -Value 'false'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS -Value 'skipped'
  Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_SKIPPED_REASON -Value $Reason
}

function Invoke-GraphifyQueryProbe {
  param(
    [string]$RepoRoot,
    [string]$ArtifactRoot
  )
  $graphJson = Join-Path $ArtifactRoot 'graph.json'
  if (-not (Test-Path -LiteralPath $graphJson -PathType Leaf)) { return }
  Push-Location $RepoRoot
  try {
    if (Invoke-GraphifyCommand -Arguments @('query', 'spec-first setup readiness', '--graph', $graphJson) -TimeoutSeconds $probeTimeoutSeconds) {
      Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED -Value 'true'
    } else {
      Set-Item -Path env:SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED -Value 'false'
    }
  } finally {
    Pop-Location
  }
}

function Invoke-GraphifyQueryProbeForExistingArtifactIfAvailable {
  if (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED'))) { return }
  $artifactRoot = Join-Path $providerRepoRoot $graphifyArtifactRootDefault
  $graphJson = Join-Path $artifactRoot 'graph.json'
  if (-not (Test-Path -LiteralPath $graphJson -PathType Leaf)) { return }
  if ([string]::IsNullOrWhiteSpace((Resolve-GraphifyCliMatchingPin))) { return }
  Invoke-GraphifyQueryProbe -RepoRoot $providerRepoRoot -ArtifactRoot $artifactRoot
}

function Invoke-GraphifyExistingArtifactSetupIfAvailable {
  if ($graphifyRefreshRequested) { return $false }

  $resolved = Resolve-RequirementWorkspace -RepoRoot $providerRepoRoot -Candidate $RequirementWorkspace -ArtifactRoot $graphifyArtifactRootDefault
  if (-not [bool]$resolved.ok) { return $false }

  $artifactRef = Get-GraphifyArtifactRef -RepoRoot $providerRepoRoot -ArtifactRoot ([string]$resolved.artifact_rel)
  if ([string]::IsNullOrWhiteSpace($artifactRef)) { return $false }

  if (-not (Ensure-GraphifyProjectSkill -RepoRoot $providerRepoRoot)) {
    Set-GraphifyFirstGenerationFact -Status 'skipped' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-project-skill-install-failed'
    return $true
  }

  Invoke-GraphifyQueryProbe -RepoRoot $providerRepoRoot -ArtifactRoot ([string]$resolved.artifact_abs)
  Set-GraphifyFirstGenerationFact -Status 'skipped' -WorkspacePath ([string]$resolved.workspace_rel) -ArtifactRoot ([string]$resolved.artifact_rel) -ArtifactRef $artifactRef -NextAction 'graphify-refresh-recommended'

  if (-not (Test-GraphifyHookStatusIfAvailable -RepoRoot $providerRepoRoot)) {
    Install-GraphifyHookIfAvailable -RepoRoot $providerRepoRoot | Out-Null
  }
  return $true
}

function Invoke-GraphifyProviderInstallIfRequested {
  if ($mode -ne 'install') { return }
  if (-not (Test-ProviderConsentApproved -Provider 'GRAPHIFY')) { return }
  if (-not (Install-GraphifyCli)) {
    Set-GraphifyFirstGenerationFact -Status 'skipped' -NextAction 'graphify-cli-install-failed'
    return
  }
  if (Invoke-GraphifyExistingArtifactSetupIfAvailable) { return }
  if (-not (Ensure-GraphifyProjectSkill -RepoRoot $providerRepoRoot)) { return }
  Invoke-GraphifyFirstGenerationIfRequested
  if (Test-GraphifyFirstGenerationReadyForHook) {
    Install-GraphifyHookIfAvailable -RepoRoot $providerRepoRoot | Out-Null
  } else {
    Set-GraphifyHookSkipped -Reason 'first-generation-not-completed'
  }
}

Invoke-GraphifyProviderInstallIfRequested
Invoke-GraphifyQueryProbeForExistingArtifactIfAvailable
try {
  $providerReadinessRaw = & node (Join-Path $PSScriptRoot 'provider-readiness-renderer.cjs') --source helper --repo-root $providerRepoRoot
  $providerReadiness = @($providerReadinessRaw | ConvertFrom-Json)
} catch {
  $providerReadiness = @()
}

[pscustomobject]@{
  helper_tools = $helperTools
  provider_readiness = @($providerReadiness)
  mirror_endpoints = $script:MirrorEndpoints
  recommended_environment_variables = [ordered]@{
    npm = [ordered]@{ npm_config_registry = $script:MirrorEndpoints.npm }
    uv  = [ordered]@{ UV_INDEX_URL = $script:MirrorEndpoints.uv }
  }
} | ConvertTo-Json -Compress -Depth 8
