# spec-first `.gitignore` 参考

本文面向把 `spec-first` 安装到业务项目里的用户，说明在执行 `spec-first init` 和 `spec-runtime-setup` 后，哪些产物应该加入 `.gitignore`，哪些产物可以按团队协作需要提交。

从 `v1.7.0` 起，`spec-first init` 会在当前目标项目的 `.gitignore` 中自动写入或更新一个 `# spec-first:start` / `# spec-first:end` managed block。交互式 init 会在确认前预览这次写入；取消时不会改变文件系统。团队仍然应该 review 并提交 `.gitignore`，让后续成员获得相同忽略规则。

核心原则：

- 各宿主目录中的 `spec-*`、`using-spec-first`、Graphify project skill、`spec-first/` state、`spec-*` command、明确的 spec-first hook 与 pointer 文件可重建，不作为项目 source truth；同目录下的团队自定义 skill、agent、rule 或宿主配置不因位于宿主目录就自动视为 runtime。
- `.cursor/mcp.json` 是 Cursor project MCP 配置落点；`.kiro/settings/` 是 Kiro workspace MCP 配置落点；`.qoder/settings.local.json` 是 Qoder local MCP 配置落点；`.qoder/settings.json` 中 spec-first managed hook entries 是 managed slice 而非整文件 ownership。它们默认按本地配置忽略，但如果内容可移植、不含密钥且团队明确需要共享，可以在 managed block 后用 negation 规则重新纳入 Git；`init` 不会自动解除这些 team-policy 文件的已有跟踪状态。
- `.cursor/rules/**`、`.cursor/agents/**`、`.kiro/specs/**` 和 `.qoder/rules/**` 是宿主原生或用户维护 artifact，不属于 spec-first generated runtime mirror。三个固定 pointer `.cursor/rules/spec-first.mdc`、`.kiro/steering/spec-first.md`、`.qoder/rules/spec-first.md` 除外，它们由 `init` 生成并默认忽略。
- `.spec-first/config/` 和 `.spec-first/workspace/` 是本地 setup/control-plane facts，默认不提交。
- `.spec-first/audits/**`、`.spec-first/governance/**` 和 generated runtime mirrors 也不应作为普通 LLM 上下文扫描源；只有 setup/update/runtime-drift/audit/governance evidence 任务或用户明确点名路径时才按需读取。
- `.spec-first/sessions/` 是 multi-actor 治理协议的 opt-in advisory 记录目录，由 `spec-first session register` 等命令写入；属于 runtime state，默认不提交。
- `.codegraph/` 是 CodeGraph 项目级 SQLite 索引，默认不提交。
- `.graphify/` 是 Graphify provider-native 项目图谱运行时目录，默认不提交；`spec-first init` 会忽略整个 `.graphify/` 目录。
- `graphify-out/` 是旧版 Graphify artifact 目录，默认继续忽略，避免历史产物意外提交；当前 setup 会提示刷新为 `.graphify/`。
- `spec-runtime-setup` 确认 provider pack 后还可能安装 Graphify provider runtime（`.codex/skills/graphify/` 或 `.claude/skills/graphify/`）和 project-local Git hook。Hook 目标由 `git rev-parse --git-path hooks` 解析，默认通常是 `.git/hooks/post-commit` / `.git/hooks/post-checkout`，也可以是仓库内自定义路径；只有目标位于当前项目内并通过 no-follow symlink containment 时才会写入。项目外 `core.hooksPath` 下，setup 只对 `post-commit`/`post-checkout` 做只读 marker 检测：命中报 `verified-external`（外部已存在 commit-time Graphify hook），缺失报 `blocked` + 一键安装提示；绝不 write/execute/status、修改、复制或串联外部 hook。`verified-external`/`manual-only` 都只表示 spec-first 只读可验证的 external posture，不证明外部 hook 一定不存在或不会执行；应将 external hook execution 视为 unverified。

如需在 `git commit` 后自动刷新 Graphify，可由仓库 owner 在确认不会绕过现有全局/组织 hooks 后显式启用项目内 hooks root：

```bash
git config --show-origin --get core.hooksPath
mkdir -p .githooks
git config --local core.hooksPath .githooks
spec-runtime-setup --only graphify
```

仓库级 `core.hooksPath` 会覆盖全局值。若 `/Users/<user>/.githooks` 或组织配置承载 `commit-msg`、`pre-commit`、`pre-push` 等策略，不应直接切换；应继续使用 `manual-only`，或由 owner 建立受审计的项目 hook dispatcher。Runtime Setup 不自动复制、合并或链式执行这些脚本。

Graphify 上游推荐用 `graphify hook install` 安装提交自动刷新，但该命令遵循 Git 的有效 `core.hooksPath`，没有独立的 project-only hooks 目标参数。若有效路径是用户级共享目录，直接运行会把 Graphify block 追加到共享 `post-commit` / `post-checkout`，从而可能影响所有继承该配置的仓库。因此 Runtime Setup 只在有效路径已位于当前项目内时调用官方 hook installer；项目外路径下若需确认历史 hook 是否仍会执行，由 owner 先运行 `git rev-parse --git-path hooks` 并手工审计对应 hook，setup 不把未读取的外部状态猜成“未安装”。
- `AGENTS.md`、`CLAUDE.md`、`docs/`、项目源码、测试和 confirmed standards source 应按团队正常协作策略提交。

## init 默认写入的 `.gitignore` block

`init` 默认写入下面这一段。不要手改 managed block 内部内容；如果需要团队额外规则，放在 block 外部。

```gitignore
# spec-first:start
# spec-first generated runtime assets
.claude/commands/spec/
.claude/commands/spec-*.md
.claude/skills/spec-*/
.claude/skills/using-spec-first/
.claude/skills/graphify/
.claude/spec-first/
.claude/agents/spec-*
.claude/hooks/session-start
.claude/hooks/spec-plan-guard
.claude/hooks/prd-prewrite-guard
.claude/hooks/prd-readiness-guard
.claude/tasks/
.claude/worktrees/
.codex/commands/spec/
.codex/commands/spec-*.md
.codex/skills/spec-*/
.codex/skills/using-spec-first/
.codex/skills/graphify/
.codex/spec-first/
.codex/agents/spec-*
.codex/hooks/session-start
.codex/hooks/session-start.cmd
.codex/hooks.json
.agents/skills/spec-*/
.agents/skills/using-spec-first/
.agents/skills/graphify/
.cursor/skills/spec-*/
.cursor/skills/using-spec-first/
.cursor/spec-first/
.cursor/mcp.json
.cursor/rules/spec-first.mdc
.kiro/commands/spec/
.kiro/commands/spec-*.md
.kiro/skills/spec-*/
.kiro/skills/using-spec-first/
.kiro/skills/graphify/
.kiro/agents/spec-*
.kiro/spec-first/
.kiro/settings/
.kiro/steering/spec-first.md
.qoder/commands/spec/
.qoder/commands/spec-*.md
.qoder/skills/spec-*/
.qoder/skills/using-spec-first/
.qoder/skills/graphify/
.qoder/agents/spec-*
.qoder/spec-first/
.qoder/hooks/session-start
.qoder/hooks/prd-prewrite-guard
.qoder/hooks/prd-readiness-guard
.qoder/rules/spec-first.md
.qoder/settings.local.json
.context/spec-first/

# spec-first local setup and workflow runtime artifacts
.spec-first/*.local.yaml
.spec-first/config.local.yaml
.spec-first/config/*.json
.spec-first/audits/
.spec-first/governance/
.spec-first/app-audit/
.spec-first/workflows/
.spec-first/workspace/
.spec-first/sessions/

# optional provider local artifacts
.codegraph/
.graphify/
graphify-out/
# spec-first:end
```

普通单 repo / monorepo 中，`init` 保持当前行为，只维护当前执行目录对应的目标项目 `.gitignore`，通常应在项目根目录运行。在父 workspace 且检测到多个 child Git repos 时，`init` 默认在父 workspace root 执行完整 bootstrap：写入 instruction、`.gitignore`、缺失时的 `CHANGELOG.md` 以及 selected host runtime/state，但不逐个写 child repo。需要把某个 child repo 作为独立 agent root 时，显式运行 `spec-first init --repo <child>`；只有明确做批量 child-root runtime 维护时才使用 `spec-first init --all-repos`。父目录不把 child repo 的 `.spec-first/config/*` 作为 parent-local truth。

如果项目里已经有同类规则，`init` 仍会保留 spec-first managed block，保证后续版本可以幂等更新。它不会尝试判断所有语义等价的 glob，也不会删除 block 外的用户规则。若 marker 缺失、重复或顺序错误，`init` 会停止并要求先修复 `.gitignore`，不会猜测替换范围。

`init` 的 runtime untrack 只覆盖可明确识别且整项归 spec-first 所有的命名空间与本地运行状态。默认忽略但可能按团队策略提交的 MCP config、Graphify artifact，以及位于 host-user-owned surface 的 pointer / Qoder hook managed slice，不会被自动执行 `git rm --cached`。

如果你的项目明确把整个 `.agents/skills/` 都视为本地生成资产，也可以在 managed block 外自行简化成：

```gitignore
.agents/
```

如果项目里已经用 `.agents/skills/`、`.agents/plugins/` 或其他 `.agents/` 内容承载团队自定义资产，不要忽略整个 `.agents/` 或 `.agents/skills/`；默认 managed block 只忽略 spec-first 与 Graphify 的已知生成项。

`spec-*` 与 `using-spec-first` 是 spec-first runtime 的保留命名空间。团队自定义 skill/agent 应使用其他名称，避免被后续 `init` 识别为可重建 runtime。

## 执行后常见产物树

```text
<repo>/
  AGENTS.md                         # Codex 入口文档，可提交
  CLAUDE.md                         # Claude Code 入口文档，可提交
  .gitignore                        # 建议提交

  .claude/
    commands/spec-*.md              # spec-* workflow runtime mirror，忽略
    commands/spec/                  # legacy command namespace，init/clean 会清理
    skills/spec-*/ using-spec-first/ # spec-first generated runtime，忽略
    skills/<team-skill>/            # 团队自定义 skill，可提交
    spec-first/                     # runtime state/profile，忽略
    agents/spec-*                   # spec-first generated agent，忽略
    agents/<team-agent>             # 团队自定义 agent，可提交
    hooks/session-start             # generated runtime hook，忽略
    hooks/prd-prewrite-guard        # generated runtime hook，忽略
    hooks/prd-readiness-guard        # generated runtime hook，忽略
    tasks/ worktrees/               # host-local scratch，忽略

  .codex/
    commands/spec/                  # legacy cleanup/runtime path，忽略
    spec-first/                     # runtime state/profile，忽略
    agents/spec-*                   # spec-first generated runtime，忽略
    hooks.json hooks/               # Codex host/runtime hook config，忽略
    config.toml                     # 团队/用户配置，是否提交按团队策略

  .agents/
    skills/spec-*/ using-spec-first/ # Codex skill runtime mirror，忽略
    skills/<team-skill>/            # 团队自定义 skill，可提交

  .cursor/
    skills/spec-*/ using-spec-first/ # Cursor workflow runtime mirror，忽略
    skills/<team-skill>/            # 团队自定义 skill，可提交
    spec-first/                     # spec-first state/profile，忽略
    mcp.json                        # Cursor project MCP config，忽略；clean 保留整文件
    rules/                          # Cursor-native rules，是否提交按团队策略
    agents/                         # Cursor-native/user agents，是否提交按团队策略

  .kiro/
    skills/spec-*/ using-spec-first/ # Kiro workflow runtime mirror，忽略
    skills/<team-skill>/            # 团队自定义 skill，可提交
    agents/spec-*                   # spec-first subagent runtime mirror，忽略
    agents/<team-agent>             # 团队自定义 agent，可提交
    spec-first/                     # spec-first state/profile，忽略
    settings/                       # spec-first MCP workspace config，忽略
    steering/spec-first.md          # generated pointer，忽略
    specs/                          # Kiro-native specs，是否提交按团队策略

  .qoder/
    commands/spec-*.md              # Qoder spec-* workflow runtime file mirror，忽略
    commands/spec/                  # legacy command namespace，init/clean 会清理
    skills/spec-*/ using-spec-first/ # Qoder project skill runtime mirror，忽略
    skills/<team-skill>/            # 团队自定义 skill，可提交
    agents/spec-*                   # spec-first subagent runtime mirror，忽略
    agents/<team-agent>             # 团队自定义 agent，可提交
    spec-first/                     # spec-first state/profile，忽略
    hooks/session-start             # spec-first managed hook script，忽略
    hooks/prd-prewrite-guard        # spec-first managed hook script，忽略
    hooks/prd-readiness-guard       # spec-first managed hook script，忽略
    settings.local.json             # Qoder local MCP config，忽略；clean 保留整文件
    rules/spec-first.md             # generated pointer，忽略
    rules/<team-rule>.md            # Qoder-native rule，是否提交按团队策略

  .spec-first/
    config.local.example.yaml       # 本地配置模板，可提交
    config.local.yaml               # 本地配置，忽略
    config/
      runtime-capabilities.json     # setup-owned local readiness facts，忽略
    governance/
      rule-maturity.json            # workflow governance observations，忽略
    workspace/
      *.json                        # 父级多仓 advisory summaries，忽略

  .codegraph/                       # CodeGraph SQLite index，忽略

  .graphify/                        # Graphify project graph，provider runtime，忽略
    graph.json                      # 团队共享 map 时可提交
    GRAPH_REPORT.md                 # 团队共享 map 时可提交
    graph.html                      # 可视化输出，是否提交按团队策略
    .graphify_root                  # provider refresh metadata，通常不需要人工编辑
    .graphify_python                # provider hook 使用的本地解释器路径，通常不提交
    .graphify_labels.json           # 社区标签缓存，是否提交按团队策略
    cost.json                       # 本地成本文件，忽略

  graphify-out/                     # 旧版 Graphify artifact，legacy 忽略

  .git/hooks/post-commit            # 默认有效 hooks root 下的 Graphify refresh hook；自定义项目内 hooksPath 时位置随 Git 配置变化
  .git/hooks/post-checkout          # 默认有效 hooks root 下的 Graphify refresh hook；项目外 hooksPath 时 setup 不写入

```

## 需要提交的内容

通常应该提交：

| 路径 | 原因 |
| --- | --- |
| `.gitignore` | 让团队统一忽略本地 runtime/control-plane 产物 |
| `AGENTS.md` | Codex 入口文档，包含项目级 workflow 入口治理和语言策略 |
| `CLAUDE.md` | Claude Code 入口文档，包含项目级 workflow 入口治理和语言策略 |
| `.spec-first/config.local.example.yaml` | 本地配置模板，不包含个人密钥时可作为 onboarding 模板提交 |
| `docs/brainstorms/`、`docs/plans/`、`docs/tasks/`、`docs/solutions/` | durable workflow artifacts 和工程知识 |
| `.spec-first/specs/repo-profile.yaml` | 如果团队明确使用它承载 confirmed project profile，应作为项目知识 source 提交 |
`AGENTS.md` 和 `CLAUDE.md` 是 checked-in host entry docs，不等同于 `.agents/skills/`、`.codex/agents/` 或 `.claude/skills/` 里的 runtime mirror。

## 按团队策略决定的内容

| 路径 | 建议 |
| --- | --- |
| `.claude/settings.json` | Claude Code 项目配置；`init --claude` 会写入 spec-first 受管 hook matchers。团队希望共享 Claude hooks、permissions 或 MCP 配置时可提交；仅个人使用的配置应放到 `.claude/settings.local.json` 并在 managed block 外自行忽略。 |
| 各宿主的自定义 `skills/<team-skill>/`、`agents/<team-agent>` | 团队维护且需要跨人复用时应提交；`init` 默认只忽略 `spec-*`、`using-spec-first` 和 Graphify 等已知生成项。 |
| `.cursor/rules/**`、`.cursor/agents/**`、未知 `.cursor/**` | Cursor-native 团队规则、用户 agent 或宿主文件；是否提交按 Cursor/团队策略决定，spec-first P0 只管理 `.cursor/skills/**`、`.cursor/spec-first/**` 和 `.cursor/mcp.json`。 |
| `.qoder/rules/**`、`.qoder/settings.json`、未知 `.qoder/hooks/**` | Qoder-native 团队规则、用户级配置或 hooks；是否提交按 Qoder/团队策略决定。`.qoder/hooks/session-start`、`.qoder/hooks/prd-prewrite-guard`、`.qoder/hooks/prd-readiness-guard` 三个 spec-first managed hook scripts 除外。 |
| `.cursor/mcp.json`、`.kiro/settings/`、`.qoder/settings.local.json` | 默认本地忽略；仅当配置使用可移植命令/环境变量引用、不含密钥且团队需要统一 provider 配置时，通过 block 后的 negation 规则选择性提交。 |
| `.graphify/cache/`、`.graphify/graph.html`、`.graphify/.graphify_labels.json` | Graphify provider runtime/cache 输出，默认随整个 `.graphify/` 忽略。 |
| `graphify-out/**` | 旧版 Graphify artifact，默认继续忽略；需要更新图谱时用 `spec-runtime-setup --only graphify --refresh` 生成 `.graphify/`。 |

## 默认不提交的内容

默认不提交：

| 路径 | 原因 |
| --- | --- |
| `.claude/commands/spec-*.md`、`.claude/commands/spec/`、`.claude/skills/spec-*/`、`.claude/skills/using-spec-first/`、`.claude/spec-first/`、`.claude/agents/spec-*` | `spec-first init` 可重建的 runtime assets；团队自定义 skill/agent 不在此列 |
| `.claude/tasks/`、`.claude/worktrees/` | Claude Code host-local scratch/worktree 产物 |
| `.codex/commands/spec*`、`.codex/spec-first/`、`.codex/skills/spec-*/`、`.codex/skills/using-spec-first/`、`.codex/agents/spec-*`、spec-first hooks | Codex spec-first runtime assets；`.codex/config.toml` 等非 spec-first 配置不再被整目录忽略 |
| `.agents/skills/spec-*/`、`.agents/skills/using-spec-first/` | Codex skill runtime mirror；团队自定义 `.agents/skills/<team-skill>/` 可按策略提交 |
| `.cursor/skills/spec-*/`、`.cursor/skills/using-spec-first/`、`.cursor/spec-first/`、`.cursor/rules/spec-first.mdc` | Cursor preview spec-first-managed runtime mirror、state 与 generated pointer，可由 `init --cursor` 重建 |
| `.cursor/mcp.json` | Cursor project MCP config output，默认忽略且不是 source；`spec-first clean --cursor` 保留整文件，server entry 由 `spec-runtime-setup` setup/uninstall 管理 |
| `.kiro/skills/spec-*/`、`.kiro/skills/using-spec-first/`、`.kiro/agents/spec-*`、`.kiro/spec-first/`、`.kiro/steering/spec-first.md` | Kiro spec-first-managed runtime mirror、state 与 generated pointer；团队自定义 skill/agent 不在此列 |
| `.kiro/settings/` | Kiro MCP workspace config，默认本地忽略；需要团队共享时仅提交可移植且无密钥的配置 |
| `.qoder/commands/spec-*.md`、`.qoder/commands/spec/`、`.qoder/skills/spec-*/`、`.qoder/skills/using-spec-first/`、`.qoder/agents/spec-*`、`.qoder/spec-first/`、`.qoder/rules/spec-first.md`、三个 spec-first hook | Qoder spec-first-managed runtime mirror、pointer、hook scripts 与 state，可由 `init` 重建 |
| `.qoder/settings.local.json` | Qoder local MCP config output，默认忽略且不是 source；`spec-first clean --qoder` 保留整文件，server entry 由 `spec-runtime-setup` setup/uninstall 管理 |
| `.spec-first/config.local.yaml`、`.spec-first/*.local.yaml` | 本地配置，可能包含个人路径或私有设置 |
| `.spec-first/config/*.json` | `spec-runtime-setup` 生成的 setup-owned 本地投影，不是第二个版本源 |
| `.spec-first/workspace/` | 父级多仓 advisory summaries，不是 child repo canonical truth |
| `.spec-first/audits/`、`.spec-first/app-audit/`、`.spec-first/workflows/` | workflow execution evidence，默认本地留存 |
| `.spec-first/sessions/` | multi-actor 治理协议的 opt-in advisory 记录目录，由 `spec-first session register` 写入；不启用时为空 |
| `.codegraph/` | CodeGraph 本地 SQLite index，可由 `codegraph init` 重建 |
| `.graphify/` | Graphify provider-native 项目图谱运行时目录，默认整体忽略，不提交 |
| `graphify-out/` | 旧版 Graphify artifact 目录，默认整体忽略，不提交 |

旧版本可能留下 `.direct-source-evidence/`、`.code-review-graph/`、`.spec-first-graph/`、`.spec-first/graph/`、`.spec-first/providers/`、`.spec-first/impact/` 或 `.gitnexus/` 等 retired provider / graph 残留。它们不属于当前 `init` managed block；如果这些路径出现在 `git status` 中，先按 setup/update/clean 指引确认是否为历史残留，不要为了隐藏噪声把 retired provider 路径重新加入当前默认规则。

`*.tgz` 是本地打包产物，可重新执行 `npm pack` 生成，但它不是 spec-first 专属产物，因此不进入 init 默认 managed block。团队如果希望统一忽略 npm pack 产物，可以在 block 外自行加入：

```gitignore
*.tgz
```

## 共享 project guidance

如果团队希望跨人复用 project guidance，应把已确认内容写入明确 source-of-truth，例如 `AGENTS.md`、`CLAUDE.md`、目录级 `AGENTS.md` / `CLAUDE.md`，或精确的 `docs/contracts/**` 合同。`docs/specs/**` 记录能力行为真相，不能替代团队协作约束。

## 不建议加入的规则

不要默认加入：

```gitignore
.claude/
.agents/
.spec-first/
.cursor/
.qoder/
```

原因：

- 整个 `.claude/` 可能会隐藏团队有意提交的项目设置、hook 或非 spec-first 配置；`.codex/` 是当前默认例外，Codex host/runtime config 与 spec-first Codex runtime mirror 都按本地可重建资产处理。
- 整个 `.agents/` 可能会隐藏团队自定义 plugins 或 marketplace 配置。
- 整个 `.spec-first/` 会隐藏 `.spec-first/config.local.example.yaml`、`.spec-first/specs/repo-profile.yaml` 和团队可能选择提交的其他 source 文件。
- 整个 `.cursor/` 可能会隐藏团队有意维护的 Cursor rules、agents 或其它 host-native 文件；默认只忽略 spec-first managed Cursor preview runtime 和 project MCP config。
- 整个 `.qoder/` 可能会隐藏团队有意维护的 Qoder rules、settings 或 hooks；默认只忽略 spec-first managed Qoder runtime。

默认推荐是忽略 spec-first 可重建 runtime、Codex host runtime root 和本地 facts，同时保留明确 source 路径的提交决策空间。
