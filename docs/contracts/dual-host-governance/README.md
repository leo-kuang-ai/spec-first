# Supported-host skill delivery governance Contract v1

- 状态：`accepted`
- 生效日期：`2026-04-16`
- 作用范围：`T00 / T01 / T11 / T12 / T14`
- 目标：为 Claude/Codex/Kiro/Qoder supported-host 产品面、治理枚举、filtered asset set 提供单一可引用 contract

> 兼容性说明：目录名仍为 `dual-host-governance`，这是历史 compatibility path。当前 machine-readable 语义已经泛化为 supported-host / 多宿主 skill delivery governance；不得把目录名解读为只支持 Claude/Codex。

## 1. 产品面最终决策

### 1.1 用户可见入口

1. 所有 supported hosts 的用户可见 workflow 标识统一为 `spec-*`
2. 宿主 runtime delivery 是内部投射细节，不改变用户侧 `spec-*` workflow 名称
3. Claude 内部投射 `.claude/commands/spec-*.md` 和 `.claude/spec-first/workflows/`
4. Codex 内部投射 `.agents/skills/spec-*`
5. Kiro 内部投射 `.kiro/skills/spec-*/SKILL.md`；P0 不生成 Kiro command layer，也不占用 Kiro native Specs namespace
6. Qoder 内部投射 `.qoder/commands/spec-*.md`，并同步 `.qoder/skills/spec-*` workflow skill mirror
7. standalone skill 只能按 skill 方式表述，不得写成已声明 workflow command
8. `Skill(...)`、`skill:`、其他内部调用 DSL 明确排除在“用户可见入口治理”之外

### 1.2 Codex compatibility layer 决策

本仓从本 contract 起，**不再为 Codex 安装 `.codex/commands/spec/*` compatibility command layer**。

具体口径：

1. `.codex/commands/spec/*` 不再是 Codex 的正式产品面
2. `init / doctor / clean / README / skill 文案` 不再把它描述为可用入口
3. Codex 侧统一通过 `.agents/skills/` 下的 `spec-*` 发现与调用 workflow
4. `.codex/commands/spec/*` 仅保留为**历史兼容清理目标**，用于 re-init / clean 清除旧版本遗留资产

决策理由：

1. 当前代码一旦继续生成 `.codex/commands/spec/*`，`init`、`doctor`、CLI banner 与 smoke 守卫就会持续把它当成正式产品面
2. Codex 已具备 `.agents/skills/` 发现路径，继续保留命令层只会制造双重入口心智
3. 在 package A 直接移除兼容命令层，能最小成本收口产品契约，并减少后续治理模型歧义

## 2. 治理枚举 Contract

### 2.1 `entry_surface`

用于表达 skill 在仓库真源中的入口类型。

允许值：

1. `workflow_command`
2. `standalone_skill`
3. `internal_only`

定义：

1. `workflow_command`
   - 该 skill 被 `skills-governance.json` 与 `templates/claude/commands/spec/*.md` 共同生成的 command manifest 声明为 command-backed workflow source
   - 这是**源层分类**，不等于每个宿主都必须暴露 command 文件
2. `standalone_skill`
   - 该 skill 不在 manifest `commands` 中，按普通 skill 交付
3. `internal_only`
   - 该能力不进入 `using-spec-first` 的公共 route/menu，只用于内部编排、support files 或宿主内部消费
   - 是否允许用户显式点名调用由 package source 自己声明：严格内部 helper 使用 `user-invocable: false`；像 `spec-proof` 这类显式点名可用、但不作为公共 workflow route 的 helper，可以保持可调用
   - 显式点名能力不把 `internal_only` 提升为 `standalone_skill`，也不授予该 helper 的 mutation、external-access、commit 或 landing authority

### 2.2 `host_scope`

用于表达 skill 的宿主分发边界。

允许值：

1. `dual_host`
2. `host_exclusive`
3. `target_host_maintenance`

定义：

1. `dual_host`
   - 所有 supported hosts 都需要交付对应能力；当前 supported hosts 为 `claude`、`codex`、`kiro`、`qoder`
2. `host_exclusive`
   - 只在单一宿主上交付给用户或运行时
3. `target_host_maintenance`
   - `owner_host` 必须保持可交付
   - 且至少还要有一个非 `owner_host` 宿主可交付
   - 当前执行宿主可以触发，但目标是维护另一宿主或其配置/资产

### 2.3 必要补充字段

仅靠 `entry_surface + host_scope` 仍不足以表达 command-backed workflow 在 supported hosts 下的实际投递方式，因此必须补充以下字段：

1. `command_name`
   - 类型：`string | null`
   - 当 `entry_surface = workflow_command` 时必填
2. `owner_host`
   - 类型：`claude | codex | kiro | qoder | null`
   - 当 `host_scope = host_exclusive` 或 `target_host_maintenance` 时必填
3. `host_delivery`
   - 类型：对象
   - 字段：`claude`、`codex`、`kiro`、`qoder`
   - 允许值：`command`、`skill`、`internal`、`none`

说明：

1. `entry_surface` 描述源层角色
2. `host_delivery` 描述每个宿主最终如何交付
3. 两者不能混写

### 2.4 当前决策下的 delivery 约束

在本 contract 生效后，所有 command-backed workflow skill 的宿主交付规则如下：

1. Claude
   - `host_delivery.claude = command`
   - 生成 `.claude/commands/spec-*.md`
   - 继续把 command-backed workflow skill 同步到 `.claude/spec-first/workflows/`
2. Codex
   - `host_delivery.codex = skill`
   - 不再生成 `.codex/commands/spec/*`
   - workflow 通过 `.agents/skills/spec-*` 发现与调用
3. Kiro
   - `host_delivery.kiro = skill`
   - 不生成 `.kiro/commands/spec/*` 或 Kiro command layer
   - workflow 通过 `.kiro/skills/spec-*` 发现与调用
4. Qoder
   - `host_delivery.qoder = command`
   - 生成 `.qoder/commands/spec-*.md` workflow runtime files
   - 同步 `.qoder/skills/spec-*` workflow skill mirrors

这意味着：

1. `workflow_command` 是源层事实
2. Codex 和 Kiro 侧不再因为这个源层事实而额外生成 command 文件；Qoder 因宿主原生支持命令文件 runtime 而生成 command layer

### 2.5 Agent 模型选择 Contract

对于由 workflow/skill/orchestrator 调度、且主体行为主要由 prompt contract 决定的 agent，默认使用 `model: inherit`。

只有在存在明确代码事实时才允许固定模型。可接受的证据包括：

1. 最近的 contract/test 明确要求固定模型并验证该约束
2. 运行时适配、宿主兼容或成本/延迟治理明确依赖固定模型
3. 专项分析文档给出固定模型的必要性，且没有等价的继承式方案

固定模型必须在最近的 contract、测试或分析文档中给出理由；没有证据时，不得因为上游写死某个模型就直接回退。

当前由本 contract 明确冻结为 `model: inherit` 的代表性 agent：

1. `design-lens-reviewer`
2. `scope-guardian-reviewer`
3. `security-lens-reviewer`
4. `slack-researcher`

当前已被治理并允许固定模型的例外：

1. `coherence-reviewer`
   - 是 `spec-doc-review` 的 `always-on reviewer`
   - 当前固定 `model: haiku`，用于低成本执行内部一致性审校
   - 证据来自 `skills/spec-doc-review/SKILL.md` 的 always-on 调度合同与当前 agent frontmatter
2. `workflow/lint`
   - 当前固定 `model: haiku`，用于低成本执行 Ruby / ERB lint orchestration
   - agent 正文明确围绕 `bundle exec standardrb`、`bundle exec erblint --lint-all`、`bin/brakeman` 这类工具编排与结果归纳
   - 这类命令型检查流程更依赖稳定的工具调用与简洁总结，不需要升级为继承式高成本模型

其他固定模型 agent 若要纳入本 contract，需要先补充对应的 contract、测试或专项分析证据。

这条规则的目标不是禁止固定模型，而是把模型选择从“沿袭上游 frontmatter”收口为“有证据的治理决策”。

## 3. filtered asset set Contract

### 3.1 输入

filtered asset set 的最小输入固定为：

1. 由 `skills-governance.json` 的 workflow records 与 command template frontmatter 生成的 manifest command set
2. 宿主治理真源文件
3. 目标平台：`claude | codex | kiro | qoder`

### 3.2 输出

filtered asset set 的输出结构固定包含：

1. `commands`
2. `workflowSkills`
3. `skills`
4. `agents`
5. `agentSupportFiles`
6. `skipped`

其中：

1. `commands`
   - 当前平台需要真正同步的 command 文件集合
2. `workflowSkills`
   - 当前平台需要同步的 command-backed workflow skill 目录集合
3. `skills`
   - 当前平台需要同步的 standalone skill 目录集合
4. `agents`
   - 当前平台需要同步的 agent markdown 集合
5. `agentSupportFiles`
   - 当前平台需要同步的 agent support files 集合
6. `skipped`
   - 被过滤掉的项及原因，供 doctor / debug / 审计使用

### 3.3 构建时机

filtered asset set 必须在运行时统一构建，至少覆盖：

1. `init` 的 previewState
2. `removeObsoleteManagedAssets`
3. 实际同步
4. `doctor`
5. `clean`
6. `state` 模块相关清理/检查逻辑

### 3.4 状态落盘边界

1. 不新增第二套持久化 state 语义
2. 继续复用现有 `state.json` tracked arrays
3. filtered asset set 是运行时计算结果，不单独持久化为新的 runtime state 文件

## 4. machine-readable 真源落位

human-readable 主 contract 固定落位：

- `docs/contracts/dual-host-governance/README.md`

machine-readable 真源文件固定落位：

- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/contracts/dual-host-governance/skills-governance.schema.json`
- `templates/claude/commands/spec/*.md` frontmatter（workflow command metadata）

其中：

1. `skills-governance.json`
   - 覆盖当前仓库 `37` 个 source skills
   - 是 `plugin.js` runtime filter、lint、审计脚本的共同真源
2. `skills-governance.schema.json`
   - 固定 `schemaVersion=1`
   - 锁定 `entry_surface`、`host_scope`、`host_delivery` 等字段的结构边界

约束：

1. 保留 `dual-host-governance` 同一命名空间，但 human-readable contract 与 machine-readable runtime truth source 分层存放
2. `docs/` 只承载人类阅读 contract，不再承载运行时 machine-readable JSON/schema
3. `src/cli/` 运行时代码不得再直接依赖 `docs/` 下的 machine-readable contract

## 5. Package A 落地要求

`T01 / T16` 必须直接遵守本 contract：

1. CodexAdapter 不再安装 `.codex/commands/spec/*`
2. KiroAdapter 不安装 `.kiro/commands/spec/*`，P0 只交付 `.kiro/skills`、`.kiro/agents`、`.kiro/spec-first` 和 Kiro MCP config 支撑面
3. `init` 对所有 supported hosts 使用统一 `spec-*` 用户可见口径，并用 host delivery 说明承载方式
4. `doctor` 不再把 `.codex/commands/spec/*` 或 `.kiro/commands/spec/*` 当成正式产品面检查项
5. README、CLI banner、`spec-runtime-setup`、`setup` 全量收口到正确宿主入口
6. smoke 断言同步切换到新契约

## 6. Contributor Maintenance Rules

新增或修改 skill 时，必须同步满足以下规则：

1. 不得只改 `SKILL.md` 文案而不更新 `skills-governance.json`
2. 不得只改 command template frontmatter 或生成后的 manifest command set，而不更新 `entry_surface=workflow_command` 记录
3. 不得把 standalone skill 写成已声明 slash command
4. 不得把 Codex 用户入口写成 host-specific legacy spelling；用户口径统一为同名 `spec-*` workflow
5. 不得把 Kiro 用户入口写成 host-specific legacy spelling；用户口径是同名 `spec-*` workflow，Kiro 内部投射到 `.kiro/skills/spec-*`
6. `Skill(...)`、`skill:`、以及其他内部调用 DSL 明确不属于“用户可见入口治理”范围
7. `docs/10-prompt/skills/` 不再是 active contract surface、runtime mirror 或 skill source；新增或修改 skill 不得要求随 `skills/` source 改动同步更新或重新创建该目录，避免把 `skills/` 与 `docs/10-prompt/skills/` 重新变成双真相源
8. 新增 lint / doctor / smoke 规则时，应优先引用 `skills-governance.json`，而不是重复手写 skill 名单
9. 运行时 machine-readable contract 必须继续落在 `src/cli/contracts/dual-host-governance/`，不得重新回放到 `docs/`
