$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-CommandVersion {
  param(
    [string]$Name,
    [string]$VersionFlag = '--version'
  )

  if (-not (Test-CommandExists $Name)) { return $null }
  try {
    return [string](& $Name $VersionFlag 2>&1 | Select-Object -First 1)
  } catch {
    return $null
  }
}

function Get-OsName {
  $isWindowsFlag = [bool](Get-Variable -Name IsWindows -ValueOnly -ErrorAction SilentlyContinue)
  $isLinuxFlag = [bool](Get-Variable -Name IsLinux -ValueOnly -ErrorAction SilentlyContinue)
  $isMacOSFlag = [bool](Get-Variable -Name IsMacOS -ValueOnly -ErrorAction SilentlyContinue)

  if ($isWindowsFlag) { return 'windows' }
  if ($isMacOSFlag) { return 'macos' }
  if ($isLinuxFlag) {
    if (Test-Path -LiteralPath '/proc/version' -PathType Leaf) {
      try {
        if ((Get-Content -LiteralPath '/proc/version' -Raw) -match 'microsoft') { return 'wsl' }
      } catch {
      }
    }
    return 'linux'
  }

  if ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT) { return 'windows' }
  return 'unknown'
}

function Get-InstallSuggestion {
  param([string]$Name, [string]$Os)

  function Get-LinuxPackageInstallCommand {
    param(
      [string]$AptPackage,
      [string]$DnfPackage,
      [string]$YumPackage,
      [string]$PacmanPackage,
      [string]$ApkPackage
    )

    if (Test-CommandExists 'apt-get') { return "sudo apt-get update && sudo apt-get install -y $AptPackage" }
	    if (Test-CommandExists 'dnf') { return "sudo dnf install -y $DnfPackage" }
	    if (Test-CommandExists 'yum') { return "sudo yum install -y $YumPackage" }
	    if (Test-CommandExists 'pacman') { return "sudo pacman -Syu --needed $PacmanPackage" }
	    if (Test-CommandExists 'apk') { return "sudo apk update && sudo apk add --upgrade $ApkPackage" }
	    return ''
	  }

	  $fnmFallback = '$script = Join-Path ([System.IO.Path]::GetTempPath()) ''fnm-install.sh''; Invoke-WebRequest -Uri https://fnm.vercel.app/install -OutFile $script; Write-Output "Review $script, then run: bash $script; fnm install --lts"'

	  switch -Regex ("$Name`:$Os") {
	    '^(node|npm|npx):windows$' { return 'winget install OpenJS.NodeJS.LTS' }
	    '^(node|npm|npx):macos$' { return 'brew install node' }
	    '^node:(linux|wsl)$' {
	      $linuxCommand = Get-LinuxPackageInstallCommand -AptPackage 'nodejs' -DnfPackage 'nodejs' -YumPackage 'nodejs' -PacmanPackage 'nodejs' -ApkPackage 'nodejs'
	      if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
	      return $fnmFallback
	    }
	    '^(npm|npx):(linux|wsl)$' {
	      $linuxCommand = Get-LinuxPackageInstallCommand -AptPackage 'npm' -DnfPackage 'npm' -YumPackage 'npm' -PacmanPackage 'npm' -ApkPackage 'npm'
	      if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
	      return $fnmFallback
	    }
    '^(uv|uvx):windows$' { return '$script = Join-Path $env:TEMP ''uv-install.ps1''; Invoke-WebRequest -Uri https://astral.sh/uv/install.ps1 -OutFile $script; Write-Output "Review $script, then run: powershell -NoProfile -ExecutionPolicy ByPass -File $script"' }
    '^(uv|uvx):' { return '$script = Join-Path ([System.IO.Path]::GetTempPath()) ''uv-install.sh''; Invoke-WebRequest -Uri https://astral.sh/uv/install.sh -OutFile $script; Write-Output "Review $script, then run: sh $script"' }
    '^jq:windows$' { return 'winget install jqlang.jq' }
    '^jq:macos$' { return 'brew install jq' }
    '^jq:(linux|wsl)$' {
      $linuxCommand = Get-LinuxPackageInstallCommand -AptPackage 'jq' -DnfPackage 'jq' -YumPackage 'jq' -PacmanPackage 'jq' -ApkPackage 'jq'
      if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
      return 'Install jq from https://jqlang.github.io/jq/'
    }
    '^python3:macos$' { return 'brew install python' }
    '^python3:(linux|wsl)$' {
      $linuxCommand = Get-LinuxPackageInstallCommand -AptPackage 'python3' -DnfPackage 'python3' -YumPackage 'python3' -PacmanPackage 'python' -ApkPackage 'python3'
      if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
      return 'Install Python from https://www.python.org/downloads/'
    }
    '^git:windows$' { return 'winget install Git.Git' }
    '^git:macos$' { return 'xcode-select --install or brew install git' }
    '^git:(linux|wsl)$' {
      $linuxCommand = Get-LinuxPackageInstallCommand -AptPackage 'git' -DnfPackage 'git' -YumPackage 'git' -PacmanPackage 'git' -ApkPackage 'git'
      if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
      return 'Install git from https://git-scm.com/downloads'
    }
    default { return $null }
  }
}

function New-DependencyFact {
  param(
    [string]$Name,
    [bool]$Required,
    [string]$Os,
    [string]$VersionFlag = '--version'
  )

  $installed = Test-CommandExists $Name
  [pscustomobject]@{
    required = [bool]$Required
    installed = [bool]$installed
    version = if ($installed) { Get-CommandVersion $Name $VersionFlag } else { $null }
    install_suggestion = if ($installed) { $null } else { Get-InstallSuggestion $Name $Os }
  }
}

$os = Get-OsName
$dependencies = [ordered]@{
  node = New-DependencyFact 'node' $true $os
  npm = New-DependencyFact 'npm' $true $os
  npx = New-DependencyFact 'npx' $true $os
  uv = New-DependencyFact 'uv' $false $os
  uvx = New-DependencyFact 'uvx' $false $os
  jq = New-DependencyFact 'jq' $false $os
  python3 = New-DependencyFact 'python3' $false $os '--version'
  git = New-DependencyFact 'git' $false $os
}

$requiredReady = $true
foreach ($entry in $dependencies.GetEnumerator()) {
  if ($entry.Value.required -and -not $entry.Value.installed) {
    $requiredReady = $false
  }
}

$warnings = @()
foreach ($entry in $dependencies.GetEnumerator()) {
  if (-not $entry.Value.required -and -not $entry.Value.installed) {
    $warnings += "$($entry.Key) missing"
  }
}

[pscustomobject]@{
  schema_version = 'deps.v2'
  platform = $os
  dependencies = $dependencies
  required_ready = [bool]$requiredReady
  warnings = @($warnings)
} | ConvertTo-Json -Compress -Depth 8
