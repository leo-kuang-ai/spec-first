function Get-HelperRegistryPath {
  $scriptDir = $PSScriptRoot
  if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    $scriptDir = Split-Path -Parent $PSCommandPath
  }
  return (Join-Path (Split-Path -Parent $scriptDir) 'helper-tools.json')
}

function Get-HelperRegistry {
  return (Get-Content -Raw -LiteralPath (Get-HelperRegistryPath) | ConvertFrom-Json)
}

function Get-HelperSourceRepo {
  param([string]$Name)
  foreach ($helper in @((Get-HelperRegistry).helpers)) {
    if ($helper.id -eq $Name) {
      if ($helper.safety -and $helper.safety.source_repo) {
        return [string]$helper.safety.source_repo
      }
      return ''
    }
  }
  return ''
}

# 展示用安装命令生成器(PowerShell 单一真相源),与 bash lib 的
# helper_registry_install_command_display 对称。install-helpers.ps1 与 check-health.ps1
# 历史上各维护一份且与 registry 静态 commands 三方漂移(如 brew install gh vs upgrade-wrapped)。
# 这里收敛为共享函数:非 agent-browser helper 一律委派到此。agent-browser 因 browser runtime / global skill
# 组合命令语义不同保留各脚本自有分支;check-health.ps1 的 native-path 提示(如 jq/windows)
# 在其委派包装层处理,不进本共享函数。
# 注意:这是「展示/审批近似命令」,真正执行真相源是 install-helpers.ps1 的 Invoke-HelperInstall。

function Get-HelperLinuxPackageInstallCommand {
  param(
    [string]$AptPackage,
    [string]$DnfPackage,
    [string]$YumPackage,
    [string]$PacmanPackage,
    [string]$ApkPackage
  )
  if (Test-CommandExists 'apt-get') { return "sudo apt-get update && sudo apt-get install -y $AptPackage" }
  if (Test-CommandExists 'dnf') { return "sudo dnf upgrade -y $DnfPackage || sudo dnf install -y $DnfPackage" }
  if (Test-CommandExists 'yum') { return "sudo yum update -y $YumPackage || sudo yum install -y $YumPackage" }
  if (Test-CommandExists 'pacman') { return "sudo pacman -Syu --needed $PacmanPackage" }
  if (Test-CommandExists 'apk') { return "sudo apk update && sudo apk add --upgrade $ApkPackage" }
  return ''
}

function Get-HelperBrewLatestInstallCommand {
  param([string]$Package)
  return "brew update && if brew list --formula $Package >/dev/null 2>&1; then brew upgrade -q $Package; else brew install -q $Package; fi"
}

function Get-HelperWingetLatestInstallCommand {
  param([string]$PackageId)
  return "winget upgrade --id $PackageId -e --silent --accept-package-agreements --accept-source-agreements || winget install --id $PackageId -e --silent --accept-package-agreements --accept-source-agreements"
}

# 非 agent-browser helper 的展示命令派发。agent-browser 由各脚本自行处理(返回空串)。
function Get-HelperInstallCommandDisplay {
  param(
    [string]$Name,
    [string]$Platform
  )
  switch ($Name) {
    'gh' {
      if ($Platform -eq 'windows') { return (Get-HelperWingetLatestInstallCommand -PackageId 'GitHub.cli') }
      if ($Platform -eq 'linux') {
        $linuxCommand = Get-HelperLinuxPackageInstallCommand -AptPackage 'gh' -DnfPackage 'gh' -YumPackage 'gh' -PacmanPackage 'github-cli' -ApkPackage 'github-cli'
        if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
        return 'Install gh from https://cli.github.com'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'gh')
    }
    'jq' {
      if ($Platform -eq 'windows') { return (Get-HelperWingetLatestInstallCommand -PackageId 'jqlang.jq') }
      if ($Platform -eq 'linux') {
        $linuxCommand = Get-HelperLinuxPackageInstallCommand -AptPackage 'jq' -DnfPackage 'jq' -YumPackage 'jq' -PacmanPackage 'jq' -ApkPackage 'jq'
        if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
        return 'Install jq from https://jqlang.github.io/jq/'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'jq')
    }
    'vhs' {
      if ($Platform -eq 'windows') { return 'go install github.com/charmbracelet/vhs@latest' }
      if ($Platform -eq 'linux') {
        if (Test-CommandExists 'go') { return 'go install github.com/charmbracelet/vhs@latest' }
        return 'Install vhs from https://github.com/charmbracelet/vhs'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'vhs')
    }
    'silicon' {
      if ($Platform -eq 'windows') { return 'cargo install silicon --force' }
      if ($Platform -eq 'linux') {
        if (Test-CommandExists 'cargo') { return 'cargo install silicon --force' }
        return 'Install silicon from https://github.com/Aloxaf/silicon'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'silicon')
    }
    'ffmpeg' {
      if ($Platform -eq 'windows') { return (Get-HelperWingetLatestInstallCommand -PackageId 'Gyan.FFmpeg') }
      if ($Platform -eq 'linux') {
        $linuxCommand = Get-HelperLinuxPackageInstallCommand -AptPackage 'ffmpeg' -DnfPackage 'ffmpeg' -YumPackage 'ffmpeg' -PacmanPackage 'ffmpeg' -ApkPackage 'ffmpeg'
        if (-not [string]::IsNullOrWhiteSpace($linuxCommand)) { return $linuxCommand }
        return 'Install ffmpeg from https://ffmpeg.org/download.html'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'ffmpeg')
    }
    'ast-grep' {
      if ($Platform -eq 'windows') { return 'npm install -g @ast-grep/cli@latest' }
      if ($Platform -eq 'linux') {
        if (Test-CommandExists 'cargo') { return 'cargo install ast-grep --locked --force' }
        if (Test-CommandExists 'npm') { return 'npm install -g @ast-grep/cli@latest' }
        return 'Install ast-grep from https://ast-grep.github.io'
      }
      return (Get-HelperBrewLatestInstallCommand -Package 'ast-grep')
    }
    'ast-grep-skill' { return 'npx -y skills@latest add ast-grep/agent-skill -g -y' }
    default { return '' }
  }
}
