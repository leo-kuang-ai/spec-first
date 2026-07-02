# spec-first `.gitignore` 参考

本文面向把 `spec-first` 安装到业务项目里的用户，说明在执行 `spec-first init` 和 `spec-mcp-setup` 后，哪些产物应该加入 `.gitignore`，哪些产物可以按团队协作需要提交。

从 `v1.7.0` 起，`spec-first init` 会在当前目标项目的 `.gitignore` 中自动写入或更新一个 `# spec-first:start` / `# spec-first:end` managed block。交互式 init 会在确认前预览这次写入；取消时不会改变文件系统。团队仍然应该 review 并提交 `.gitignore`，让后续成员获得相同忽略规则。

核心原则：

- `.claude/`、`.codex/` 和 `.agents/skills/` 下的 spec-first runtime mirror 可重建，不作为项目 source truth。
- `.spec-first/config/` 和 `.spec-first/workspace/` 是本地 setup/control-plane facts，默认不提交。
- `.spec-first/audits/**`、`.spec-first/governance/**` 和 generated runtime mirrors 也不应作为普通 LLM 上下文扫描源；只有 setup/update/runtime-drift/audit/governance evidence 任务或用户明确点名路径时才按需读取。
- `.spec-first/sessions/` 是 multi-actor 治理协议的 opt-in advisory 记录目录，由 `spec-first session register` 等命令写入；属于 runtime state，默认不提交。
- `.codegraph/` 是 CodeGraph 项目级 SQLite 索引，默认不提交。
- `graphify-out/` 是 Graphify provider 的项目图谱运行时目录，默认不提交；`spec-first init` 会忽略整个 `graphify-out/` 目录。
- `$spec-mcp-setup` 确认 provider pack 后还可能安装 Graphify provider runtime（`.codex/skills/graphify/` 或 `.claude/skills/graphify/`）和 `.git/hooks/post-commit` / `.git/hooks/post-checkout`。前者落在已忽略的 generated/runtime 目录；后者是 Git 本地 hook，不进入仓库提交面。
- `AGENTS.md`、`CLAUDE.md`、`docs/`、项目源码、测试和 confirmed standards source 应按团队正常协作策略提交。

## init 默认写入的 `.gitignore` block

`init` 默认写入下面这一段。不要手改 managed block 内部内容；如果需要团队额外规则，放在 block 外部。

```gitignore
# spec-first:start
# spec-first generated runtime assets
.claude/commands/spec/
.claude/skills/
.claude/spec-first/
.claude/agents/
.claude/hooks/session-start
.claude/hooks/spec-plan-guard
.claude/hooks/prd-prewrite-guard
.claude/hooks/prd-readiness-guard
.claude/tasks/
.claude/worktrees/
.codex/
.agents/skills/
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
graphify-out/
# spec-first:end
```

普通单 repo / monorepo 中，`init` 保持当前行为，只维护当前执行目录对应的目标项目 `.gitignore`，通常应在项目根目录运行。在父 workspace 且检测到多个 child Git repos 时，`init` 会在引导中询问全部 child 或单个 child：选择全部时逐个初始化 child repo，并在父目录写 advisory `.spec-first/workspace/init-summary.json` index、`.spec-first/workspace/init-summary-claude.json` / `init-summary-codex.json` 宿主维度 summary、父级 host 入口文档和 host runtime assets，用于父级只读路由；父目录不把 child repo 的 `.spec-first/config/*` 作为 parent-local truth。

如果项目里已经有同类规则，`init` 仍会保留 spec-first managed block，保证后续版本可以幂等更新。它不会尝试判断所有语义等价的 glob，也不会删除 block 外的用户规则。

如果你的项目没有自定义 `.agents/` 目录资产，也可以把 `.agents/skills/` 简化成：

```gitignore
.agents/
```

如果项目里已经用 `.agents/plugins/` 或其他 `.agents/` 内容承载团队自定义资产，不要忽略整个 `.agents/`，只忽略 `.agents/skills/`。

## 执行后常见产物树

```text
<repo>/
  AGENTS.md                         # Codex 入口文档，可提交
  CLAUDE.md                         # Claude Code 入口文档，可提交
  .gitignore                        # 建议提交

  .claude/
    commands/spec/                  # generated runtime，忽略
    skills/                         # generated runtime，忽略
    spec-first/                     # runtime state/profile，忽略
    agents/                         # generated runtime，忽略
    hooks/session-start             # generated runtime hook，忽略
    hooks/prd-prewrite-guard        # generated runtime hook，忽略
    hooks/prd-readiness-guard        # generated runtime hook，忽略
    tasks/ worktrees/               # host-local scratch，忽略

  .codex/
    commands/spec/                  # legacy cleanup/runtime path，忽略
    spec-first/                     # runtime state/profile，忽略
    agents/                         # generated runtime，忽略
    hooks.json hooks/               # Codex host/runtime hook config，忽略

  .agents/
    skills/                         # Codex skill runtime mirror，忽略

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

  graphify-out/                     # Graphify project graph，provider runtime，忽略
    graph.json                      # 团队共享 map 时可提交
    GRAPH_REPORT.md                 # 团队共享 map 时可提交
    graph.html                      # 可视化输出，是否提交按团队策略
    .graphify_root                  # provider refresh metadata，通常不需要人工编辑
    .graphify_python                # provider hook 使用的本地解释器路径，通常不提交
    .graphify_labels.json           # 社区标签缓存，是否提交按团队策略
    cost.json                       # 本地成本文件，忽略

  .git/hooks/post-commit            # Graphify provider-native refresh hook，本地 Git hook
  .git/hooks/post-checkout          # Graphify provider-native refresh hook，本地 Git hook

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
| `graphify-out/cache/`、`graphify-out/graph.html`、`graphify-out/.graphify_labels.json` | Graphify provider runtime/cache 输出，默认随整个 `graphify-out/` 忽略。 |

## 默认不提交的内容

默认不提交：

| 路径 | 原因 |
| --- | --- |
| `.claude/commands/spec/`、`.claude/skills/`、`.claude/spec-first/`、`.claude/agents/` | `spec-first init` 可重建的 runtime assets |
| `.claude/tasks/`、`.claude/worktrees/` | Claude Code host-local scratch/worktree 产物 |
| `.codex/`、`.agents/skills/` | Codex host/runtime assets 与 `spec-first init` 可重建的 runtime mirror |
| `.spec-first/config.local.yaml`、`.spec-first/*.local.yaml` | 本地配置，可能包含个人路径或私有设置 |
| `.spec-first/config/*.json` | `spec-mcp-setup` 生成的 setup-owned 本地投影，不是第二个版本源 |
| `.spec-first/workspace/` | 父级多仓 advisory summaries，不是 child repo canonical truth |
| `.spec-first/audits/`、`.spec-first/app-audit/`、`.spec-first/workflows/` | workflow execution evidence，默认本地留存 |
| `.spec-first/sessions/` | multi-actor 治理协议的 opt-in advisory 记录目录，由 `spec-first session register` 写入；不启用时为空 |
| `.codegraph/` | CodeGraph 本地 SQLite index，可由 `codegraph init` 重建 |
| `graphify-out/` | Graphify 项目图谱运行时目录，默认整体忽略，不提交 |

旧版本可能留下 `.direct-source-evidence/`、`.code-review-graph/`、`.spec-first-graph/`、`.spec-first/graph/`、`.spec-first/providers/`、`.spec-first/impact/` 或 `.gitnexus/` 等 retired provider / graph 残留。它们不属于当前 `init` managed block；如果这些路径出现在 `git status` 中，先按 setup/update/clean 指引确认是否为历史残留，不要为了隐藏噪声把 retired provider 路径重新加入当前默认规则。

`*.tgz` 是本地打包产物，可重新执行 `npm pack` 生成，但它不是 spec-first 专属产物，因此不进入 init 默认 managed block。团队如果希望统一忽略 npm pack 产物，可以在 block 外自行加入：

```gitignore
*.tgz
```

## 共享 project standards

如果团队希望跨人复用 project standards，应把已确认内容写入明确 source-of-truth，例如 `AGENTS.md`、`CLAUDE.md`、目录级 `AGENTS.md` / `CLAUDE.md`，或当前推荐的 `docs/contracts/team-standards.md` + `docs/standards/index.md` + `docs/standards/**`。

`docs/standards/**` 是 checked-in source surface，不是 runtime artifact。只有 `trust=confirmed,lifecycle_state=active` 且 scope 命中的规则才可作为 workflow hard context；`docs/standards/candidates/**` 只放 proposal/advisory 内容，不应被 downstream workflow enforce。`docs/specs/**` 记录能力行为真相，不能替代团队开发规范。旧 `.spec-first/standards/` 属于已退役 runtime/artifact 路径，不应作为新的 confirmed standards source。

## 不建议加入的规则

不要默认加入：

```gitignore
.claude/
.agents/
.spec-first/
```

原因：

- 整个 `.claude/` 可能会隐藏团队有意提交的项目设置、hook 或非 spec-first 配置；`.codex/` 是当前默认例外，Codex host/runtime config 与 spec-first Codex runtime mirror 都按本地可重建资产处理。
- 整个 `.agents/` 可能会隐藏团队自定义 plugins 或 marketplace 配置。
- 整个 `.spec-first/` 会隐藏 `.spec-first/config.local.example.yaml`、`.spec-first/specs/repo-profile.yaml` 和团队可能选择提交的其他 source 文件；当前 confirmed team standards 推荐放在 `docs/standards/**`，不放在 `.spec-first/standards/`。

默认推荐是忽略 spec-first 可重建 runtime、Codex host runtime root 和本地 facts，同时保留明确 source 路径的提交决策空间。
