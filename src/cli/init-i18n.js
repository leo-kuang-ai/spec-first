const MESSAGES = {
  zh: {
    selectHosts: '选择要初始化的宿主运行时:',
    checkboxHint: '↑/↓ 移动 · 空格 选择/取消 · Enter 确认 · Ctrl+C 取消',
    selectHint: '↑/↓ 移动 · Enter 确认 · Ctrl+C 取消',
    developerName: '开发者名称:',
    languageSelect: '默认回复语言:',
    workspaceTarget: '选择 workspace 初始化目标:',
    workspaceRootOnly: (count) => `仅父级 workspace（推荐，检测到 ${count} 个子仓库）`,
    workspaceAllRepos: (count) => `所有子仓库（高级批量维护，${count} 个）`,
    workspaceCancel: '取消',
    reuseGlobalProfile: (name, lang) => (
      `检测到全局开发者: ${name} (${lang})。沿用?`
    ),
    syncUserLanguageConsent: '是否同步用户级语言偏好到 Codex/Claude 用户 instruction 文件?（首次授权后后续 init 会自动维护；默认否）',
    globalProfileOverwrite: (display, name, lang) => (
      `全局 developer profile 已存在: ${display}。是否用 ${name} (${lang}) 覆盖?`
    ),
    confirmApply: '应用这些更改?',
    cancelled: '已取消。',
    nameRequired: '开发者名称不能为空。',
    minSelectedError: (count) => `请至少选择 ${count} 项。`,
    previewSelectedHosts: (labels) => `已选择宿主运行时: ${labels}`,
    previewHostRuntime: (index, total, label) => `宿主运行时 ${index}/${total}: ${label}`,
    previewDryRunHeader: (platform) => `预览: spec-first init (${platform})`,
    previewCoverage: (targets, hosts, groups, budget) => (
      `预览覆盖: targets=${targets} hosts=${hosts} target_host_groups=${groups} detail_budget=${budget}`
    ),
    previewSummaryCoverage: (targets, hosts) => `初始化预览: ${targets} 个目标 · ${hosts} 个宿主`,
    previewHostSummary: (label, destructive, critical, generated) => (
      `  ${label}: 删除/清理 ${destructive} · 关键写入 ${critical} · 生成 ${generated}`
    ),
    previewSummaryDestructive: (count, groups) => `风险操作: ${count} 个 destructive path · ${groups} 个 target/host group`,
    previewSummaryDestructiveOmitted: (count) => (
      `  ... 另有 ${count} 个 destructive path；运行 spec-first init --dry-run 查看有界明细。`
    ),
    previewSummaryGlobalDeveloper: (action, displayPath, name, lang) => (
      `全局 developer profile: ${action} · ${displayPath} · ${name} (${lang})`
    ),
    previewSummaryLanguageReady: '用户级语言同步: ready（无需修改）',
    previewSummaryLanguageChanges: (count) => `用户级语言同步: ${count} 项计划变更`,
    previewGlobalDeveloperHeader: '全局 developer profile 预览:',
    previewDestructivePaths: (count) => `删除 / prune / runtime-untrack paths (${count}):`,
    previewCriticalWritePaths: (count) => `关键写入 paths (${count}):`,
    previewGeneratedPaths: (count) => `生成路径 (${count}):`,
    previewTargetDetail: (platform, kind, label, root, resetReason) => (
      `目标明细: host=${platform} kind=${kind} label=${label} root=${root} reset=${resetReason}`
    ),
    previewOmittedCoverage: (targets, targetHostGroups, paths) => (
      `预览省略: targets=${targets} target_host_groups=${targetHostGroups} paths=${paths}`
    ),
    previewHardResetLegacy: '将先执行 managed hard reset，再重新生成 runtime assets。',
    previewHardResetDrift: '将先执行 managed hard reset，再重新生成 runtime assets（检测到当前 runtime drift）。',
    previewDestructiveReset: '破坏性预览: 包含 managed runtime reset/removal/prune 操作。',
    previewWouldRemove: (count) => `将移除 ${count} 个过期 managed path。`,
    previewWouldPrune: (count, suffix) => `将清理 ${count} 个未管理 command 文件${suffix}`,
    previewWouldEnsureDir: (count, suffix) => `将确保 ${count} 个 managed 目录存在${suffix}`,
    previewWouldWrite: (count, suffix) => `将写入/更新 ${count} 个 managed 文件${suffix}`,
    previewWouldUntrack: (count) => `将从 git index untrack ${count} 个 managed runtime path:`,
    previewNoRuntimeUntrack: '没有 managed runtime path 需要 untrack。',
    previewRuntimeUntrackCheck: (reasonCode) => `Runtime untrack 检查: ${reasonCode}`,
    previewRuntimeUntrackDiagnostic: (diagnostic) => `  ${diagnostic}`,
    previewOmittedPaths: (count) => `  ... 还有 ${count} 个 path 未在 preview 中展示`,
    previewNoFilesChanged: '不会修改文件。',
    previewUserLanguageSyncHeader: '用户级语言同步:',
    previewUserLanguageSyncDryRun: '预览模式：不会写入用户级 instruction 文件或全局 developer profile。',
    applyInstalledClaudeHook: '🪝 已安装 Claude managed hook matchers 到 .claude/settings.json',
    applyInstalledCodexHook: '🪝 已安装 Codex SessionStart hook 到 .codex/hooks/',
    applyGeneratedCommands: (count, dir) => `📦 已在 ${dir} 生成 ${count} 个 command 文件`,
    applyGeneratedSkills: (count, dir) => `🧩 已在 ${dir} 生成 ${count} 个 skill 目录`,
    applyGeneratedAgents: (count, dir) => `🤖 已在 ${dir} 生成 ${count} 个 agent 文件`,
    applyGeneratedAgentSupport: (count, dir) => `🧰 已在 ${dir} 生成 ${count} 个 agent support 文件`,
    applyGitignoreAdded: '🧹 已新增 .gitignore spec-first managed block',
    applyGitignoreUpdated: '🧹 已更新 .gitignore spec-first managed block',
    applySkippedCodexHook: '🪝 已跳过 Codex SessionStart hook 安装：当前目录的 .codex 是 CODEX_HOME 全局 hook 位置',
    applyDeveloperProfileCreate: '🪪 已写入全局 developer profile:',
    applyDeveloperProfileOverwrite: '🪪 已更新全局 developer profile:',
    applyDeveloperProfilePreserve: '🪪 已保留现有全局 developer profile:',
    applyRuntimeUntracked: (count) => `🧯 已从 git index untrack ${count} 个 managed runtime path（工作区文件保留）。`,
    applyRuntimeUntrackNone: '🧯 没有 managed runtime path 需要 untrack。',
    applyRuntimeUntrackSkipped: (reasonCode) => `🧯 Runtime untrack 已跳过: ${reasonCode}`,
    applyRunSummary: (ready, total) => `初始化结果: ${ready}/${total} 个宿主 ready`,
    applyRunFailureSummary: (ready, total) => `初始化结果: ${ready}/${total} 个宿主 ready（存在失败）`,
    applyHostSummary: (label, status, details) => `  ${label}: ${status}${details ? ` · ${details}` : ''}`,
    applyStatusReady: 'ready',
    applyStatusFailed: 'failed',
    applyCommandsCount: (count) => `${count} commands`,
    applySkillsCount: (count) => `${count} skills`,
    applyAgentsCount: (count) => `${count} agents`,
    applyHookUpdated: 'hook 已更新',
    applyHookSkippedCompact: 'hook 已跳过',
    applyGitignoreCompact: '已更新 .gitignore managed block',
    applyChangelogCompact: '已创建 CHANGELOG.md',
    applyAgentSupportCount: (count) => `${count} agent support`,
    applyWorkspaceCount: (ready, total) => `workspace ${ready}/${total} ready`,
    applyProfileCompact: (action, displayPath, name, lang) => (
      `全局 developer profile: ${action} · ${displayPath} · ${name} (${lang})`
    ),
    applyLanguageCompact: (status, reasonCode) => (
      `用户级语言同步: ${status}${reasonCode && reasonCode !== 'none' ? ` (${reasonCode})` : ''}`
    ),
    applyLanguageIssue: (host, displayPath, error) => `  ${host}: ${displayPath}${error ? ` · ${error}` : ''}`,
    applyRuntimeUntrackCompact: (count) => `Runtime untrack: ${count} 个 managed path`,
    applyRuntimeUntrackSample: (displayPath) => `  - ${displayPath}`,
    applyRefreshParentRuntime: '▶ 刷新父级宿主 runtime assets',
    applyUserLanguageSyncHeader: (status, reasonCode) => `用户级语言同步: ${status}${reasonCode && reasonCode !== 'none' ? ` (${reasonCode})` : ''}`,
    diagnosticCursorGeneratedRuntimePreview: 'Warning [cursor_generated_runtime_preview]: Cursor runtime 已生成，但本机尚未验证 skill discovery/invocation；生成的 skills 可能不会被 Cursor 加载。',
    diagnosticQoderHookActivationUnverified: 'Warning [qoder_hook_activation_unverified]: Qoder 的 qodercli 1.0.41 evidence baseline 已确认 hook settings 与 command protocol，但 authenticated event execution 和 shared IDE loader safety 尚未验证；settings entries 保持未启用，SessionStart 与 PRD guard 当前不生效。',
  },
  en: {
    selectHosts: 'Select host runtimes to initialize:',
    checkboxHint: '↑/↓ move · Space toggle · Enter confirm · Ctrl+C cancel',
    selectHint: '↑/↓ move · Enter confirm · Ctrl+C cancel',
    developerName: 'Developer name:',
    languageSelect: 'Default response language:',
    workspaceTarget: 'Select workspace target:',
    workspaceRootOnly: (count) => `Parent workspace only (recommended, ${count} child repos detected)`,
    workspaceAllRepos: (count) => `All child repos (advanced batch maintenance, ${count})`,
    workspaceCancel: 'Cancel',
    reuseGlobalProfile: (name, lang) => (
      `Detected global developer: ${name} (${lang}). Reuse it?`
    ),
    syncUserLanguageConsent: 'Sync the user-level language preference to Codex/Claude user instruction files? (after the first opt-in, future init runs maintain it automatically; default no)',
    globalProfileOverwrite: (display, name, lang) => (
      `Global developer profile already exists: ${display}. Overwrite it with ${name} (${lang})?`
    ),
    confirmApply: 'Apply these changes?',
    cancelled: 'Cancelled.',
    nameRequired: 'Developer name is required.',
    minSelectedError: (count) => `Select at least ${count} item(s).`,
    previewSelectedHosts: (labels) => `Selected host runtimes: ${labels}`,
    previewHostRuntime: (index, total, label) => `Host runtime ${index}/${total}: ${label}`,
    previewDryRunHeader: (platform) => `Dry run: spec-first init (${platform})`,
    previewCoverage: (targets, hosts, groups, budget) => (
      `Preview coverage: targets=${targets} hosts=${hosts} target_host_groups=${groups} detail_budget=${budget}`
    ),
    previewSummaryCoverage: (targets, hosts) => `Init preview: ${targets} target(s) · ${hosts} host(s)`,
    previewHostSummary: (label, destructive, critical, generated) => (
      `  ${label}: remove/prune ${destructive} · critical writes ${critical} · generated ${generated}`
    ),
    previewSummaryDestructive: (count, groups) => `${count} destructive path(s) across ${groups} target/host group(s):`,
    previewSummaryDestructiveOmitted: (count) => (
      `  ... ${count} more destructive path(s); run spec-first init --dry-run for bounded details.`
    ),
    previewSummaryGlobalDeveloper: (action, displayPath, name, lang) => (
      `Global developer profile: ${action} · ${displayPath} · ${name} (${lang})`
    ),
    previewSummaryLanguageReady: 'User-level language sync: ready (no changes)',
    previewSummaryLanguageChanges: (count) => `User-level language sync: ${count} planned change(s)`,
    previewGlobalDeveloperHeader: 'Global developer profile preview:',
    previewDestructivePaths: (count) => `Destructive / prune / runtime-untrack paths (${count}):`,
    previewCriticalWritePaths: (count) => `Critical write paths (${count}):`,
    previewGeneratedPaths: (count) => `Generated paths (${count}):`,
    previewTargetDetail: (platform, kind, label, root, resetReason) => (
      `Target detail: host=${platform} kind=${kind} label=${label} root=${root} reset=${resetReason}`
    ),
    previewOmittedCoverage: (targets, targetHostGroups, paths) => (
      `Preview omitted: targets=${targets} target_host_groups=${targetHostGroups} paths=${paths}`
    ),
    previewHardResetLegacy: 'Would perform a managed hard reset before regenerating runtime assets.',
    previewHardResetDrift: 'Would perform a managed hard reset before regenerating runtime assets (current runtime drift detected).',
    previewDestructiveReset: 'Destructive preview: managed runtime reset/removal/prune operations are included.',
    previewWouldRemove: (count) => `Would remove ${count} managed obsolete path(s).`,
    previewWouldPrune: (count, suffix) => `Would prune ${count} unmanaged command file(s)${suffix}`,
    previewWouldEnsureDir: (count, suffix) => `Would ensure ${count} managed directorie(s)${suffix}`,
    previewWouldWrite: (count, suffix) => `Would write/update ${count} managed file(s)${suffix}`,
    previewWouldUntrack: (count) => `Would untrack ${count} managed runtime path(s):`,
    previewNoRuntimeUntrack: 'No managed runtime paths require untracking.',
    previewRuntimeUntrackCheck: (reasonCode) => `Runtime untrack check: ${reasonCode}`,
    previewRuntimeUntrackDiagnostic: (diagnostic) => `  ${diagnostic}`,
    previewOmittedPaths: (count) => `  ... ${count} more path(s) omitted from preview`,
    previewNoFilesChanged: 'No files were changed.',
    previewUserLanguageSyncHeader: 'User-level language sync:',
    previewUserLanguageSyncDryRun: 'Dry run: no user-level instruction file or global developer profile will be written.',
    applyInstalledClaudeHook: '🪝 Installed Claude managed hook matchers in .claude/settings.json',
    applyInstalledCodexHook: '🪝 Installed Codex SessionStart hook in .codex/hooks/',
    applyGeneratedCommands: (count, dir) => `📦 Generated ${count} command file(s) in ${dir}`,
    applyGeneratedSkills: (count, dir) => `🧩 Generated ${count} skill directory(ies) in ${dir}`,
    applyGeneratedAgents: (count, dir) => `🤖 Generated ${count} agent file(s) in ${dir}`,
    applyGeneratedAgentSupport: (count, dir) => `🧰 Generated ${count} agent support file(s) in ${dir}`,
    applyGitignoreAdded: '🧹 Added .gitignore spec-first managed block',
    applyGitignoreUpdated: '🧹 Updated .gitignore spec-first managed block',
    applySkippedCodexHook: '🪝 Skipped Codex SessionStart hook install: this directory .codex is the CODEX_HOME global hook location',
    applyDeveloperProfileCreate: '🪪 Wrote global developer profile:',
    applyDeveloperProfileOverwrite: '🪪 Updated global developer profile:',
    applyDeveloperProfilePreserve: '🪪 Preserved existing global developer profile:',
    applyRuntimeUntracked: (count) => `🧯 Untracked ${count} managed runtime path(s) from git index (work tree files preserved).`,
    applyRuntimeUntrackNone: '🧯 No managed runtime paths require untracking.',
    applyRuntimeUntrackSkipped: (reasonCode) => `🧯 Runtime untrack skipped: ${reasonCode}`,
    applyRunSummary: (ready, total) => `Init complete: ${ready}/${total} hosts ready`,
    applyRunFailureSummary: (ready, total) => `Init result: ${ready}/${total} hosts ready`,
    applyHostSummary: (label, status, details) => `  ${label}: ${status}${details ? ` · ${details}` : ''}`,
    applyStatusReady: 'ready',
    applyStatusFailed: 'failed',
    applyCommandsCount: (count) => `${count} command${count === 1 ? '' : 's'}`,
    applySkillsCount: (count) => `${count} skill${count === 1 ? '' : 's'}`,
    applyAgentsCount: (count) => `${count} agent${count === 1 ? '' : 's'}`,
    applyHookUpdated: 'hook updated',
    applyHookSkippedCompact: 'hook skipped',
    applyGitignoreCompact: 'updated .gitignore managed block',
    applyChangelogCompact: 'created CHANGELOG.md',
    applyAgentSupportCount: (count) => `${count} agent support file${count === 1 ? '' : 's'}`,
    applyWorkspaceCount: (ready, total) => `workspace ${ready}/${total} ready`,
    applyProfileCompact: (action, displayPath, name, lang) => (
      `Global developer profile: ${action} · ${displayPath} · ${name} (${lang})`
    ),
    applyLanguageCompact: (status, reasonCode) => (
      `User-level language sync: ${status}${reasonCode && reasonCode !== 'none' ? ` (${reasonCode})` : ''}`
    ),
    applyLanguageIssue: (host, displayPath, error) => `  ${host}: ${displayPath}${error ? ` · ${error}` : ''}`,
    applyRuntimeUntrackCompact: (count) => `Runtime untrack: ${count} managed path(s)`,
    applyRuntimeUntrackSample: (displayPath) => `  - ${displayPath}`,
    applyRefreshParentRuntime: '▶ Refresh parent host runtime assets',
    applyUserLanguageSyncHeader: (status, reasonCode) => `User-level language sync: ${status}${reasonCode && reasonCode !== 'none' ? ` (${reasonCode})` : ''}`,
    diagnosticCursorGeneratedRuntimePreview: 'Warning [cursor_generated_runtime_preview]: Cursor runtime was generated, but local skill discovery/invocation is not verified; generated skills may not load.',
    diagnosticQoderHookActivationUnverified: 'Warning [qoder_hook_activation_unverified]: the qodercli 1.0.41 evidence baseline confirms the hook settings and command protocol, but authenticated event execution and shared IDE loader safety are not verified; settings entries remain disabled, so SessionStart and PRD guard hooks are inactive.',
  },
};

function getInitMessages(lang) {
  return MESSAGES[lang] || MESSAGES.zh;
}

module.exports = {
  getInitMessages,
};
