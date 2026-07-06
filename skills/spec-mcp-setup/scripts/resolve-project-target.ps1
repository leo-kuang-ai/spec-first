param(
  [string]$Repo = '',
  [string]$Folder = '',
  [ValidateSet('json', 'env')]
  [string]$Format = 'json',
  [int]$ScanDepth = 3
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function ConvertTo-CanonicalPath {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "path not found: $Path"
  }
  return (Resolve-Path -LiteralPath $Path).ProviderPath
}

function ConvertTo-AbsolutePath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Test-PathWithin {
  param(
    [string]$Child,
    [string]$Parent
  )
  $normalizedChild = $Child.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $normalizedParent = $Parent.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  if ($normalizedChild -eq $normalizedParent) { return $true }
  return $normalizedChild.StartsWith($normalizedParent + [System.IO.Path]::DirectorySeparatorChar)
}

function Get-RelativeToWorkspace {
  param(
    [string]$Path,
    [string]$Root
  )
  if ($Path -eq $Root) { return '.' }
  if (Test-PathWithin -Child $Path -Parent $Root) {
    return $Path.Substring($Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar).Length + 1)
  }
  return $Path
}

function Get-GitRoot {
  param([string]$Path)
  $root = git -C $Path rev-parse --show-toplevel 2>$null
  if ([string]::IsNullOrWhiteSpace($root)) { return '' }
  return ConvertTo-CanonicalPath -Path $root
}

function Get-GitHealth {
  param([string]$Path)
  $gitEntry = Join-Path $Path '.git'
  $health = [ordered]@{
    status = 'not-git'
    reason_code = 'not-git'
    git_entry_type = 'missing'
  }
  if (-not (Test-Path -LiteralPath $gitEntry)) {
    $root = git -C $Path rev-parse --show-toplevel 2>$null
    if (-not [string]::IsNullOrWhiteSpace($root)) {
      $health.status = 'ok'
      $health.reason_code = 'git-ok'
      $health.git_entry_type = 'ancestor'
    }
    return $health
  }

  if (Test-Path -LiteralPath $gitEntry -PathType Leaf) {
    $health.status = 'corrupted-gitdir'
    $health.reason_code = 'gitdir-file-unparseable'
    $health.git_entry_type = 'file'
    $firstLine = ([System.IO.File]::ReadAllText($gitEntry) -split "`n", 2)[0].TrimEnd("`r")
    if ($firstLine -like 'gitdir:*') {
      $rawPointer = $firstLine.Substring('gitdir:'.Length).Trim()
      $pointerPath = if ([System.IO.Path]::IsPathRooted($rawPointer)) {
        $rawPointer
      } else {
        [System.IO.Path]::GetFullPath((Join-Path $Path $rawPointer))
      }
      if (Test-Path -LiteralPath (Split-Path -Parent $pointerPath)) {
        $pointerPath = Join-Path (Resolve-Path -LiteralPath (Split-Path -Parent $pointerPath)).ProviderPath (Split-Path -Leaf $pointerPath)
      }
      $pointerExists = Test-Path -LiteralPath $pointerPath
      $gitRoot = git -C $Path rev-parse --show-toplevel 2>$null
      $pointerValid = $pointerExists -and (-not [string]::IsNullOrWhiteSpace($gitRoot))
      $health.status = if ($pointerValid) { 'ok' } else { 'broken-worktree' }
      $health.reason_code = if ($pointerValid) {
        'git-ok'
      } elseif ($pointerExists) {
        'broken-worktree-pointer-invalid'
      } else {
        'broken-worktree'
      }
      $health.worktree_pointer = [ordered]@{
        raw = $rawPointer
        path = $pointerPath.Replace('\', '/')
        exists = [bool]$pointerExists
      }
    }
    return $health
  }

  if (Test-Path -LiteralPath $gitEntry -PathType Container) {
    $health.git_entry_type = 'directory'
    $root = git -C $Path rev-parse --show-toplevel 2>$null
    if ([string]::IsNullOrWhiteSpace($root)) {
      $health.status = 'corrupted-gitdir'
      $health.reason_code = 'gitdir-directory-invalid'
    } else {
      $health.status = 'ok'
      $health.reason_code = 'git-ok'
    }
    return $health
  }

  $health.status = 'corrupted-gitdir'
  $health.reason_code = 'gitdir-entry-invalid'
  $health.git_entry_type = 'other'
  return $health
}

function Add-Candidate {
  param(
    [System.Collections.Generic.List[string]]$Candidates,
    [string]$Root
  )
  foreach ($existing in @($Candidates)) {
    if ($existing -eq $Root) { return }
    if (Test-PathWithin -Child $Root -Parent $existing) { return }
  }
  $Candidates.Add($Root)
}

function Find-ChildGitRepos {
  param(
    [string]$Root,
    [int]$MaxDepth
  )
  $excluded = @('.git', 'node_modules', 'vendor', '.claude', '.codex', '.kiro', '.agents', '.spec-first', 'build', '.cache', '.direnv', '.venv')
  $queue = New-Object System.Collections.Generic.Queue[object]
  $candidates = New-Object System.Collections.Generic.List[string]
  $queue.Enqueue([pscustomobject]@{ depth = 0; path = $Root })
  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    foreach ($child in @(Get-ChildItem -LiteralPath $current.path -Directory -Force -ErrorAction SilentlyContinue)) {
      if ($excluded -contains $child.Name) { continue }
      if (Test-Path -LiteralPath (Join-Path $child.FullName '.git')) {
        $gitRoot = Get-GitRoot -Path $child.FullName
        if (-not [string]::IsNullOrWhiteSpace($gitRoot) -and (Test-PathWithin -Child $gitRoot -Parent $Root)) {
          Add-Candidate -Candidates $candidates -Root $gitRoot
        } else {
          $health = Get-GitHealth -Path $child.FullName
          if ($health.status -ne 'not-git') {
            $script:CandidateDiagnostics.Add([ordered]@{
              workspace_relative_path = Get-RelativeToWorkspace -Path (ConvertTo-CanonicalPath -Path $child.FullName) -Root $Root
              path = (ConvertTo-CanonicalPath -Path $child.FullName)
              git_health = $health
            })
          }
        }
        continue
      }
      if ([int]$current.depth -lt $MaxDepth) {
        $queue.Enqueue([pscustomobject]@{ depth = ([int]$current.depth + 1); path = $child.FullName })
      }
    }
  }
  @($candidates.ToArray() | Sort-Object)
}

function Get-CoverageGap {
  param(
    [string]$Root,
    [object[]]$CandidateRoots
  )
  $ignored = @('.git', 'node_modules', 'vendor', '.claude', '.codex', '.kiro', '.agents', '.spec-first', 'build', '.cache', '.direnv', '.venv')
  $uncovered = New-Object System.Collections.Generic.List[string]
  foreach ($child in @(Get-ChildItem -LiteralPath $Root -Directory -Force -ErrorAction SilentlyContinue | Sort-Object Name)) {
    if ($ignored -contains $child.Name) { continue }
    if (Test-Path -LiteralPath (Join-Path $child.FullName '.git')) { continue }
    $canonicalChild = ConvertTo-CanonicalPath -Path $child.FullName
    $skip = $false
    foreach ($candidate in @($CandidateRoots)) {
      if ($canonicalChild -eq $candidate -or (Test-PathWithin -Child $candidate -Parent $canonicalChild)) {
        $skip = $true
        break
      }
    }
    if (-not $skip) {
      $uncovered.Add((Get-RelativeToWorkspace -Path $canonicalChild -Root $Root))
    }
  }
  return [ordered]@{
    uncovered_top_level_dirs = $uncovered.Count
    sample = @($uncovered.ToArray() | Select-Object -First 7)
    ignored_dir_patterns = $ignored
    advisory = 'Some top-level folders are not independent Git repos and are not covered by -AllRepos. Use -Folder <path> explicitly for non-git folder indexing.'
  }
}

$invocationCwd = ConvertTo-CanonicalPath -Path (Get-Location).Path
$rootGitHealth = Get-GitHealth -Path $invocationCwd
$cwdGitRoot = if ($rootGitHealth.status -eq 'ok') { Get-GitRoot -Path $invocationCwd } else { '' }
$script:CandidateDiagnostics = New-Object System.Collections.Generic.List[object]
$result = [ordered]@{
  schema_version = 'project-target.v2'
  mode = ''
  repo_status = 'not-git-repo'
  target_kind = ''
  selection_source = ''
  state_write_allowed = $false
  invocation_cwd = $invocationCwd
  workspace_root = $invocationCwd
  selected_repo_root = $null
  selected_folder_root = $null
  target_root = $null
  repo_label = ''
  folder_label = ''
  candidates = @()
  git_health = $rootGitHealth
  reason_code = ''
  next_action = ''
}
$exitCode = 0

if (-not [string]::IsNullOrWhiteSpace($Repo) -and -not [string]::IsNullOrWhiteSpace($Folder)) {
  throw 'resolve-project-target.ps1: use either -Repo or -Folder, not both'
}

if (-not [string]::IsNullOrWhiteSpace($Folder)) {
  $rawTarget = ConvertTo-AbsolutePath -Path $Folder
  if (-not (Test-Path -LiteralPath $rawTarget)) {
    $result.mode = 'invalid-target'
    $result.target_kind = 'invalid'
    $result.reason_code = 'folder-target-not-found'
    $result.next_action = 'Choose an existing non-git folder and rerun with -Folder <path>.'
    $exitCode = 1
  } elseif (-not (Test-Path -LiteralPath $rawTarget -PathType Container)) {
    $result.mode = 'invalid-target'
    $result.target_kind = 'invalid'
    $result.reason_code = 'folder-target-not-directory'
    $result.next_action = 'Choose an existing non-git folder and rerun with -Folder <path>.'
    $exitCode = 1
  } else {
    $canonicalTarget = ConvertTo-CanonicalPath -Path $rawTarget
    if (-not [string]::IsNullOrWhiteSpace($cwdGitRoot)) {
      $result.workspace_root = $cwdGitRoot
    }
    if (-not (Test-PathWithin -Child $canonicalTarget -Parent $result.workspace_root)) {
      $result.mode = 'invalid-target'
      $result.target_kind = 'invalid'
      $result.reason_code = 'folder-target-outside-workspace'
      $result.next_action = 'Choose a folder inside the current workspace.'
      $exitCode = 1
    } else {
      $targetGitRoot = Get-GitRoot -Path $canonicalTarget
      if (-not [string]::IsNullOrWhiteSpace($targetGitRoot)) {
        $result.mode = 'invalid-target'
        $result.target_kind = 'invalid'
        $result.reason_code = 'folder-target-is-git-repo'
        $result.next_action = 'Use -Repo for Git repositories, or choose a folder outside any Git repo.'
        $exitCode = 1
      } else {
        $result.mode = 'non-git-folder'
        $result.repo_status = 'not-git-repo'
        $result.target_kind = 'non-git-folder'
        $result.selection_source = 'explicit-folder'
        $result.state_write_allowed = $true
        $result.selected_folder_root = $canonicalTarget
        $result.target_root = $canonicalTarget
        $result.folder_label = Get-RelativeToWorkspace -Path $canonicalTarget -Root $result.workspace_root
        $result.repo_label = $result.folder_label
      }
    }
  }
} elseif (-not [string]::IsNullOrWhiteSpace($Repo)) {
  $rawTarget = ConvertTo-AbsolutePath -Path $Repo
  if (-not (Test-Path -LiteralPath $rawTarget)) {
    $result.mode = 'invalid-target'
    $result.target_kind = 'invalid'
    $result.reason_code = 'repo-target-not-found'
    $result.next_action = 'Choose an existing child Git repo and rerun with --repo <path>.'
    $exitCode = 1
  } else {
    $canonicalTarget = ConvertTo-CanonicalPath -Path $rawTarget
    if (-not [string]::IsNullOrWhiteSpace($cwdGitRoot)) {
      $result.workspace_root = $cwdGitRoot
    }
    if (-not (Test-PathWithin -Child $canonicalTarget -Parent $result.workspace_root)) {
      $result.mode = 'invalid-target'
      $result.target_kind = 'invalid'
      $result.reason_code = 'repo-target-outside-workspace'
      $result.next_action = 'Choose a child Git repo inside the current workspace.'
      $exitCode = 1
    } else {
      $targetGitRoot = Get-GitRoot -Path $canonicalTarget
      if ([string]::IsNullOrWhiteSpace($targetGitRoot)) {
        $result.mode = 'invalid-target'
        $result.target_kind = 'invalid'
        $result.reason_code = 'repo-target-not-git'
        $result.next_action = 'Choose a path inside a child Git repo and rerun with --repo <path>.'
        $exitCode = 1
      } elseif (-not (Test-PathWithin -Child $targetGitRoot -Parent $result.workspace_root)) {
        $result.mode = 'invalid-target'
        $result.target_kind = 'invalid'
        $result.reason_code = 'repo-target-outside-workspace'
        $result.next_action = 'Choose a child Git repo inside the current workspace.'
        $exitCode = 1
      } elseif (-not [string]::IsNullOrWhiteSpace($cwdGitRoot) -and $targetGitRoot -ne $cwdGitRoot) {
        $result.mode = 'invalid-target'
        $result.target_kind = 'invalid'
        $result.reason_code = 'repo-target-outside-workspace'
        $result.next_action = 'Run from the target repo or invoke from its parent workspace.'
        $exitCode = 1
      } else {
        $result.mode = 'git-repo'
        $result.repo_status = 'git-repo'
        $result.target_kind = 'git-repo'
        $result.selection_source = 'explicit-repo'
        $result.state_write_allowed = $true
        $result.selected_repo_root = $targetGitRoot
        $result.target_root = $targetGitRoot
        $result.repo_label = Get-RelativeToWorkspace -Path $targetGitRoot -Root $result.workspace_root
      }
    }
  }
} elseif (-not [string]::IsNullOrWhiteSpace($cwdGitRoot)) {
  $result.mode = 'git-repo'
  $result.repo_status = 'git-repo'
  $result.target_kind = 'git-repo'
  $result.selection_source = 'cwd-git-root'
  $result.state_write_allowed = $true
  $result.workspace_root = $cwdGitRoot
  $result.selected_repo_root = $cwdGitRoot
  $result.target_root = $cwdGitRoot
  $result.repo_label = Split-Path -Leaf $cwdGitRoot
} else {
  $result.target_kind = 'workspace'
  $candidateRoots = @(Find-ChildGitRepos -Root $result.workspace_root -MaxDepth $ScanDepth)
  $result.coverage_gap = Get-CoverageGap -Root $result.workspace_root -CandidateRoots $candidateRoots
  if ($script:CandidateDiagnostics.Count -gt 0) {
    $result.candidates_diagnostics = @($script:CandidateDiagnostics.ToArray())
  }
  $result.candidates = @($candidateRoots | ForEach-Object {
    [ordered]@{
      repo_label = Get-RelativeToWorkspace -Path $_ -Root $result.workspace_root
      git_root = $_
      workspace_relative_path = Get-RelativeToWorkspace -Path $_ -Root $result.workspace_root
      relationship = 'child_git_repo'
    }
  })
  if ($candidateRoots.Count -eq 0) {
    $result.mode = 'workspace-no-git-candidates'
    $result.reason_code = 'workspace-no-git-candidates'
    if ($rootGitHealth.status -eq 'broken-worktree') {
      $result.next_action = 'Run spec-first repair-worktree --dry-run, or pass -Folder . for explicit non-git folder indexing.'
    } elseif ($rootGitHealth.status -eq 'corrupted-gitdir') {
      $result.next_action = 'Run git fsck or inspect the .git directory, then rerun setup.'
    } else {
      $result.next_action = 'Run from a Git repo or pass --repo <child> after creating one.'
    }
  } elseif ($candidateRoots.Count -eq 1) {
    $result.mode = 'workspace-single-candidate'
    $result.reason_code = 'workspace-target-required'
    if ($rootGitHealth.status -eq 'broken-worktree') {
      $result.next_action = "Run spec-first repair-worktree --dry-run, or rerun with --repo $($result.candidates[0].workspace_relative_path)."
    } elseif ($rootGitHealth.status -eq 'corrupted-gitdir') {
      $result.next_action = "Run git fsck or inspect the .git directory, then rerun with --repo $($result.candidates[0].workspace_relative_path)."
    } else {
      $result.next_action = "Rerun with --repo $($result.candidates[0].workspace_relative_path)."
    }
  } else {
    $result.mode = 'workspace-multi-repo'
    $result.reason_code = 'workspace-target-required'
    if ($rootGitHealth.status -eq 'broken-worktree') {
      $result.next_action = 'Run spec-first repair-worktree --dry-run, choose a child Git repo with --repo <child>, or pass -Folder . for explicit non-git folder indexing.'
    } elseif ($rootGitHealth.status -eq 'corrupted-gitdir') {
      $result.next_action = 'Run git fsck or inspect the .git directory, then choose a child Git repo with --repo <child>.'
    } else {
      $result.next_action = 'Choose a child Git repo and rerun with --repo <child>.'
    }
  }
}

if ($Format -eq 'env') {
  foreach ($key in @('schema_version','mode','repo_status','target_kind','selection_source','state_write_allowed','invocation_cwd','workspace_root','selected_repo_root','selected_folder_root','target_root','repo_label','folder_label','reason_code','next_action')) {
    $value = $result[$key]
    if ($null -eq $value) { $value = '' }
    $escaped = ([string]$value).Replace("'", "''")
    Write-Output "$key='$escaped'"
  }
} else {
  [pscustomobject]$result | ConvertTo-Json -Depth 10 -Compress
}

exit $exitCode
