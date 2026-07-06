# spec-first 集成 Everything Claude Code 能力技术方案（深度审查修订版）

## 0. 结论摘要

终审结论：**CONDITIONAL PASS，方向可保留，但进入开发前必须按本文门禁修复资产身份、递归索引、internal delivery、pack 生命周期、reference gating 与 prompt supply-chain 安全问题**。

`spec-first` 可以集成 `everything-claude-code`（下文简称 ECC），但集成方式必须收敛为 **可选、轻量、内部能力镜片**，而不是把 ECC 当成第二套 workflow、第二套 command、或默认 agent 池导入。

最终原则：

```text
spec-first 管流程
ECC 补能力
spec-* 入口不变
ECC commands 不导入
ECC hooks 不导入
MVP 只导入 6 个 internal reference/lens skills
ECC agents 不进入 MVP
所有 ECC-derived runtime assets 使用 ecc- 命名空间
由 spec-first governance 管理 runtime 下发
由 LLM 在 workflow 中按需选择，不由脚本做语义路由
```

本方案替换早期“默认导入 P0/P1 skills + agents”的设想。审查后结论是：

```text
默认大包导入：BLOCK
直接导入 ECC commands/hooks/agents：BLOCK
仅用 frontmatter.name 作为全局 canonical id：BLOCK
显式 opt-in + reference-only MVP：CONDITIONAL PASS
```

代码一致性结论：本文是实现前方案，不表示当前 `/Users/kuang/xiaobu/spec-first` 已支持 ECC capability pack。实现前必须补齐本文列出的 CLI、结构化 skill source index、governance schema、state、doctor/clean、安全 lint 和 reference gating 改造。

准确性校验日期：2026-05-05。已对照 `/Users/kuang/xiaobu/spec-first` 当前源码确认：`init.js` 尚不支持 `--with-ecc`；`plugin.js` 仍按一级 `skills/` 目录建立 skill 清单，且 `syncAgents()` 仍同步当前 51 个 bundled agents；`skills-governance.schema.json` 仍不接受 `capability_pack` / `capability_role`；`state.js` 当前状态结构不包含 `capabilityPacks`。因此本文仍应保持 `CONDITIONAL PASS`，不能升级为已实现方案。

---

## 1. 深度审查问题与修复决策

| 审查问题 | 最佳修复方案 | 本文落点 |
|---|---|---|
| `frontmatter.name` 被当成全局 canonical id，会破坏现有目录/frontmatter 不一致的 skill | 引入结构化资产模型：`assetId`、`sourceRelativeDir`、`runtimeName`、`frontmatterName` 分离 | 第 7 章 |
| 递归扫描被低估，当前多处仍假设 `skills/<skillName>` | 先建立 `SkillSourceIndex`，所有读取、sync、dry-run、inspect、adapter rewrite 改为使用结构化索引 | 第 7.2、7.3 |
| 不能直接移除 `AGENT_FACING_INTERNAL_SKILLS`，否则 internal-only skill 可能默认泄漏 | 保留现有 internal allowlist 语义，同时新增 pack-gated internal delivery；不得把所有 `internal_only + internal` 自动下发 | 第 7.5 |
| `--with-ecc` 同时像 MVP 又像 V2 provider | MVP 只支持固定内置 pack `core-engineering`；provider 化移到后续阶段 | 第 4、10 章 |
| MVP 范围在 3、6、可选 7 之间漂移 | 明确定义：Value Spike=3 个 lens；MVP Pack=6 个 lens；`security-lite` 是 Post-MVP candidate | 第 5 章 |
| reference 文件可能在未启用 ECC 时引用不存在的 `ecc-*` skill | 采用条件生成：只有启用 ECC pack 时才生成 runtime reference；reference 内仍带 unavailable fallback | 第 6 章 |
| pack id 命名不一致 | 固定映射：CLI `core-engineering`、governance `ecc-core-engineering`、state provider `ecc` | 第 4.3 |
| state/doctor/clean 没有完整 enable/disable/stale 生命周期 | 定义 pack lifecycle、state shape、doctor 输出和 clean 行为 | 第 8 章 |
| prompt supply-chain 安全不足 | source lock 增加 commit/hash；导入时 lint 禁止 command/hook/agent/工具越权语义 | 第 9 章 |
| MVP 不接 agents 只靠文档约束，当前 `agents/` 全量同步会泄漏 | MVP 阶段禁止把 ECC agent 文件放入 `agents/`；agent filtering 完成前不得引入 ECC agents | 第 11 章 |
| “Bash 只读命令”不是可执行安全边界 | 未来 agent 不以 Bash 只读约定作为安全保证；必须依赖 agent governance、工具约束和 no-edit contract | 第 11.3 |
| `spec-work`、`spec-mcp-setup` 映射不清 | 删除 `spec-work` 作为 MVP 目标；`ecc-mcp-server-patterns` 只在现有 `spec-mcp-setup` 内作为可选 lens | 第 6.5 |
| ECC lens 输出可能变成泛泛 checklist | 每个 lens 必须遵循统一输出契约：applicable、evidence、top risks、suggested change、no verdict | 第 5.4 |

---

## 2. 背景与约束

### 2.1 spec-first 当前架构

`spec-first` 是 Node.js CommonJS CLI，核心职责是把源码资产生成到 Claude Code / Codex 的 runtime 目录。

关键源码职责：

| 位置 | 职责 |
|---|---|
| `src/cli/commands/init.js` | `spec-first init --claude\|--codex` 入口，生成宿主 runtime assets |
| `src/cli/plugin.js` | 构建 manifest、读取治理 contract、过滤并同步 commands / skills / agents |
| `src/cli/adapters/claude.js` | Claude Code runtime 路径、command/skill 渲染和路径重写 |
| `src/cli/adapters/codex.js` | Codex runtime 路径、skill/agent 渲染和路径重写 |
| `src/cli/contracts/dual-host-governance/skills-governance.json` | skill entry surface 与双宿主 delivery 的治理真相源 |
| `skills/` | workflow / standalone / internal skill 源码真相源 |
| `agents/` | agent profile 源码真相源 |
| `templates/claude/commands/spec/` | Claude command metadata 模板 |

Claude runtime 生成路径：

```text
.claude/commands/spec/        # 用户可见 spec-* commands
.claude/skills/               # standalone + internal skills
.claude/spec-first/workflows/  # workflow skill runtime copy
.claude/agents/               # agents
.claude/spec-first/state.json  # managed state
```

Codex runtime 生成路径：

```text
.agents/skills/               # user-visible workflows + standalone/internal skills
.codex/agents/                # agents
.codex/spec-first/state.json  # managed state
```

### 2.2 spec-first 的三层关系

`spec-first` 的主关系是：

```text
Command = 用户入口
Skill   = workflow 主体
Agent   = workflow 内部调度的专项角色
```

例如 `spec-plan`：

```text
templates/claude/commands/spec/plan.md 只定义 command metadata
skills/spec-plan/SKILL.md 定义真正 planning workflow
spec-first init --claude 将两者合成为 .claude/commands/spec/plan.md
```

ECC 集成不能破坏这个主关系。

### 2.3 spec-first 项目哲学约束

长期原则：

```text
Light contract
Explicit boundaries
Let the LLM decide
```

对应约束：

```text
Deterministic execution belongs to scripts
Semantic analysis belongs to LLM
Scripts prepare, LLM decides
Never replace LLM with a state machine
Never ask LLM to simulate deterministic tooling
```

本方案必须满足：

- 脚本只负责安装、过滤、校验、同步 runtime assets。
- LLM 负责判断当前 workflow 是否需要某个 ECC lens。
- 不让脚本根据任务语义自动选择 ECC 能力。
- 不引入强编排、状态机或第二套工作流入口。

### 2.4 ECC 当前能力形态

ECC 当前有：

| 类型 | 数量 | 说明 |
|---|---:|---|
| Skills | 182 | 工程、语言、测试、安全、前端、媒体、业务运营技能 |
| Agents | 48 | 代码审查、构建修复、规划、性能、文档、E2E 等子代理 |
| Commands | 68 | `/everything-claude-code:*` 用户入口 |

ECC 中有价值的是大量检查清单、工程实践和专项 reviewer 思路；但 ECC command / hook / agent 执行风格不能直接进入 spec-first 默认 runtime。

### 2.5 当前代码基线与尚未实现能力

截至本方案审查时，`/Users/kuang/xiaobu/spec-first` 当前代码尚不支持 ECC capability pack。以下内容是实现前必须补齐的代码缺口：

| 能力 | 当前代码事实 | 实现前要求 |
|---|---|---|
| `--with-ecc` | `src/cli/commands/init.js` 只支持 `--claude`、`--codex`、`--dry-run`、`--user`、`--lang`、`--help` | 新增参数解析、help/usage、dry-run 输出，并把 pack selection 传入 asset filtering |
| nested `skills/ecc/*/SKILL.md` | `src/cli/plugin.js` 当前按 `skills/<skillName>/SKILL.md` 一级目录读取 | 引入结构化 `SkillSourceIndex`，不要只改递归扫描函数 |
| `capability_pack` / `capability_role` | `skills-governance.schema.json` 当前 `additionalProperties: false`，不接受这两个字段 | 扩展 schema、loader、validator、filter，并保持默认 no-ECC 行为 |
| internal ECC skill 下发 | 当前 `internal_only + internal` 受 `AGENT_FACING_INTERNAL_SKILLS` 限制 | 保留现有保护，同时新增 pack-gated internal delivery |
| `capabilityPacks` state | `state.js` 的 `normalizeState()` 只保留固定字段，会丢弃未知字段 | 扩展 build/read/normalize/validate，持久化 pack 状态 |
| `doctor` / `clean` pack 感知 | 当前只能按现有 filtered assets/state 做通用检查和清理 | 支持 enabled/missing/drifted/stale ECC managed assets |
| agent filtering | 当前 agents 仍全量同步 | ECC agents 进入前必须新增 agent governance/filtering；MVP 不允许放入 `agents/` |
| agent frontmatter name 唯一性 | 当前 Claude agent 重名检查只看文件 basename | 后续接 agents 前必须检查 frontmatter `name` 全局唯一 |

---

## 3. 集成目标与非目标

### 3.1 目标

1. 增强 spec-first workflow 的决策输入质量。
2. 为 `spec-plan`、`spec-debug`、`spec-code-review`、`spec-polish-beta`、`spec-mcp-setup` 补充少量高价值工程 lens。
3. 保持 `spec-*` 和 `spec-*` 用户入口不变。
4. 保持 spec-first source assets -> runtime assets 的生成边界。
5. 让 ECC-derived assets 可审计、可版本锁定、可禁用、可清理、可逐步扩展。

### 3.2 非目标

| 非目标 | 原因 |
|---|---|
| 不全量导入 ECC | ECC 资产规模大，会增加上下文和维护负担 |
| 不导入 ECC commands | 避免 `spec-*` 与 `/everything-claude-code:*` 两套入口并存 |
| 不导入 ECC hooks | hooks 会改变宿主全局行为，风险高 |
| MVP 不导入 ECC agents | 当前 agent filtering / schema / 权限边界尚未补齐 |
| 不让脚本语义路由 ECC 能力 | 语义判断属于 LLM |
| 不把 ECC 能力变成强规则引擎 | 违背 Light contract / Let the LLM decide |
| 不直接修改 `.claude/`、`.codex/`、`.agents/skills/` | 这些是 runtime 副本，必须由 `spec-first init` 生成 |
| 不把 provider 化放入 MVP | MVP 只做固定内置 pack，避免过早抽象 |

---

## 4. 用户入口与 pack 命名策略

### 4.1 不新增用户 workflow 入口

启用 ECC capability 后，用户仍然只使用现有入口。

Claude Code：

```text
spec-brainstorm
spec-plan
spec-work
spec-debug
spec-code-review
spec-doc-review
spec-polish-beta
spec-optimize
spec-mcp-setup
```

Codex：

```text
spec-brainstorm
spec-plan
spec-work
spec-debug
spec-code-review
spec-doc-review
spec-polish-beta
spec-optimize
spec-mcp-setup
```

不新增：

```text
/ecc:*
/everything-claude-code:*
$ecc-*
```

### 4.2 CLI 显式启用

默认不启用 ECC：

```bash
spec-first init --claude
spec-first init --codex
```

启用固定内置 ECC pack：

```bash
spec-first init --claude --with-ecc core-engineering
spec-first init --codex --with-ecc core-engineering
```

MVP 只支持一个固定 pack：`core-engineering`。不支持任意 provider、不支持多个外部 pack、不支持从 ECC 源项目动态读取。

### 4.3 pack id 统一映射

| 层级 | 值 | 说明 |
|---|---|---|
| CLI user input | `core-engineering` | 用户输入短名 |
| governance value | `ecc-core-engineering` | 全局唯一 capability pack id |
| state provider key | `ecc` | capability provider 分组 |
| state enabled value | `core-engineering` | 与 CLI 输入一致 |
| display text | `ECC core-engineering` | CLI/help/doctor 展示 |
| runtime skill prefix | `ecc-` | 所有 ECC-derived runtime skill 前缀 |

### 4.4 Init 输出

未启用：

```text
ECC capability packs: disabled
```

启用：

```text
ECC capability packs: core-engineering
Generated additional ECC internal skills: 6
Generated additional ECC agents: 0
No ECC commands or hooks were installed.
```

不支持的 pack：

```text
Unsupported ECC capability pack: <name>
Supported ECC capability packs: core-engineering
```

---

## 5. 能力范围：Value Spike、MVP Pack、Post-MVP

### 5.1 Value Spike：3 个 lens

Value Spike 的目标是先验证 ECC lens 是否真实增强 spec-first，不等同于 MVP runtime pack。

```text
ecc-api-design
ecc-click-path-audit
ecc-accessibility
```

Value Spike 可以通过人工评审样本或临时本地实验完成，不要求先实现完整 CLI、state、doctor/clean。

### 5.2 MVP Pack：6 个 lens

MVP Pack 固定为 6 个 ECC-derived internal reference/lens skills：

| 导入后名称 | ECC 来源 | 目标 workflow | 价值 |
|---|---|---|---|
| `ecc-api-design` | `skills/api-design` | `spec-plan`, `spec-code-review` | API 资源、分页、错误响应、版本控制 checklist |
| `ecc-database-migrations-lite` | `skills/database-migrations` | `spec-plan`, `spec-code-review` | expand-contract、zero-downtime、rollback 迁移 lens |
| `ecc-postgres-patterns-lite` | `skills/postgres-patterns` | `spec-plan`, `spec-code-review` | Postgres/RLS/index/query 速查 |
| `ecc-click-path-audit` | `skills/click-path-audit` | `spec-debug`, `spec-polish-beta` | UI 点击路径、状态互相抵消、最终状态错误审计 |
| `ecc-accessibility` | `skills/accessibility` | `spec-plan`, `spec-polish-beta`, `spec-code-review` | WCAG 2.2 / ARIA / iOS / Android 无障碍映射 |
| `ecc-mcp-server-patterns` | `skills/mcp-server-patterns` | `spec-mcp-setup`, `spec-plan` | MCP server 实现模式，不替代 setup workflow |

MVP 不包含可选第 7 个。

### 5.3 Post-MVP Candidate

`ecc-security-review-lite` 是 Post-MVP candidate，不进入 MVP Pack。

| 导入后名称 | ECC 来源 | 条件 |
|---|---|---|
| `ecc-security-review-lite` | `skills/security-review` | 只保留 checklist，不导入 `security-reviewer` agent，不拥有最终 verdict |

### 5.4 Lens 输出契约

每个 ECC lens 正文必须遵循统一输出契约，避免变成泛泛 checklist 或第二套 verdict。

```text
When used, return:
- applicable: yes/no
- evidence: concrete doc/code/task evidence
- top_risks: up to 3 risks
- suggested_change: concrete change or "none"
- final_verdict: never; leave verdict to the calling spec-first workflow
```

禁止：

```text
block merge
own final verdict
must call this agent
must call ECC command
perform edit/write as part of the lens
```

### 5.5 MVP 不导入的能力

| 不导入能力 | 原因 |
|---|---|
| `ecc-security-reviewer` | 与 `spec-security-reviewer`、`spec-security-sentinel`、`spec-security-lens-reviewer` 高重复 |
| `ecc-database-reviewer` | 与 `spec-data-migrations-reviewer`、`spec-data-integrity-guardian`、`spec-schema-drift-detector` 高重复 |
| `ecc-performance-optimizer` | 与 `spec-performance-reviewer`、`spec-performance-oracle` 重复，且偏执行优化 |
| `ecc-docs-lookup` | 与 `spec-framework-docs-researcher`、`spec-best-practices-researcher` 重复 |
| `ecc-e2e-runner` | 需要先统一 browser harness；当前 `test-browser` 约束未适配 |
| `ecc-browser-qa` 原样导入 | 与 `test-browser` 的 browser 约束冲突 |
| `ecc-design-system` | 可能越权生成 DESIGN.md、tokens、preview，和 `frontend-design` 边界冲突 |
| `ecc-tdd-workflow` 原样导入 | 与 spec-first 的轻量 execution posture 冲突 |
| `ecc-verification-loop` | 与 `spec-work`、`spec-code-review`、`test-browser` 泛化重复 |
| `ecc-pr-test-analyzer` | 与 `spec-testing-reviewer` 高重复 |
| `ecc-refactor-cleaner` | 有删除/清理风险，MVP 不接 |
| `ecc-code-simplifier` | 与 `spec-code-simplicity-reviewer`、`spec-maintainability-reviewer` 重复 |

---

## 6. 与 spec-first workflow 的映射和 reference gating

### 6.1 reference gating 决策

采用 **条件生成**：只有启用 ECC pack 时，runtime 中才生成 ECC reference 文件或在 workflow runtime 中包含 ECC reference 段落。

默认 init 不启用 ECC 时：

```text
不生成 ecc-* skills
不生成 ECC reference runtime 文件
不在 workflow runtime 中暴露 ECC 能力提示
```

启用 `--with-ecc core-engineering` 时：

```text
生成 6 个 ecc-* internal skills
生成对应 ECC reference runtime 文件
workflow 可按需读取 reference
```

即使条件生成，reference 内容也必须包含 fallback：

```text
Only use this ECC lens if the corresponding ecc-* skill is present in the runtime.
If unavailable, ignore this reference silently.
```

### 6.2 `spec-plan`

启用 ECC 时生成：

```text
skills/spec-plan/references/ecc-capability-lenses.md
```

建议内容：

```text
当计划涉及 API：可读取 ecc-api-design。
当计划涉及 DB/schema/migration：可读取 ecc-database-migrations-lite、ecc-postgres-patterns-lite。
当计划涉及无障碍或跨平台 UI：可读取 ecc-accessibility。
当计划涉及 MCP server 实现：可读取 ecc-mcp-server-patterns。
```

这是建议，不是强制路由表。

### 6.3 `spec-debug`

启用 ECC 时生成：

```text
skills/spec-debug/references/ecc-debug-lenses.md
```

建议内容：

```text
当 bug 表现为按钮点击后状态被后续逻辑撤销、UI 最终状态错误、多个状态更新互相抵消时，可读取 ecc-click-path-audit。
```

### 6.4 `spec-polish-beta`

启用 ECC 时生成：

```text
skills/spec-polish-beta/references/ecc-ui-polish-lenses.md
```

建议内容：

```text
当 UI 打磨涉及可访问性、ARIA、焦点管理、移动端可访问性 traits 时，可读取 ecc-accessibility。
当 UI 行为路径有最终状态异常时，可读取 ecc-click-path-audit。
```

### 6.5 `spec-code-review`

MVP 不新增 reviewer agents。

启用 ECC 时生成：

```text
skills/spec-code-review/references/ecc-review-lenses.md
```

建议内容：

```text
API diff：可参考 ecc-api-design。
DB/migration diff：可参考 ecc-database-migrations-lite、ecc-postgres-patterns-lite。
Accessibility diff：可参考 ecc-accessibility。
```

最终 findings、confidence gate、merge/dedup、verdict 仍由 `spec-code-review` 原生 workflow 管理。

### 6.6 `spec-mcp-setup`

不新增 MCP workflow，不替代 setup readiness 检查。

启用 ECC 时，`ecc-mcp-server-patterns` 只作为现有 `spec-mcp-setup` 或相关规划任务中的可选 reference lens：

```text
当任务涉及 MCP server tool/resource/prompt 设计时，可参考 ecc-mcp-server-patterns。
```

---

## 7. 技术实现方案

### 7.1 源码目录与 runtime 展开

MVP 在源码层使用 `skills/ecc/` 单独分组，但 runtime 层仍展开为扁平 `ecc-*` skill 名称。

源码结构：

```text
skills/
  ecc/
    api-design/
      SKILL.md
    database-migrations-lite/
      SKILL.md
    postgres-patterns-lite/
      SKILL.md
    click-path-audit/
      SKILL.md
    accessibility/
      SKILL.md
    mcp-server-patterns/
      SKILL.md
```

runtime 生成结构：

```text
# Claude Code
.claude/skills/ecc-api-design/SKILL.md
.claude/skills/ecc-database-migrations-lite/SKILL.md
.claude/skills/ecc-postgres-patterns-lite/SKILL.md
.claude/skills/ecc-click-path-audit/SKILL.md
.claude/skills/ecc-accessibility/SKILL.md
.claude/skills/ecc-mcp-server-patterns/SKILL.md

# Codex
.agents/skills/ecc-api-design/SKILL.md
.agents/skills/ecc-database-migrations-lite/SKILL.md
.agents/skills/ecc-postgres-patterns-lite/SKILL.md
.agents/skills/ecc-click-path-audit/SKILL.md
.agents/skills/ecc-accessibility/SKILL.md
.agents/skills/ecc-mcp-server-patterns/SKILL.md
```

不生成嵌套 runtime 目录 `skills/ecc/api-design`。

### 7.2 结构化资产身份模型

不能使用 `frontmatter.name` 作为全局唯一 canonical id。必须显式区分：

| 字段 | 示例 | 用途 |
|---|---|---|
| `assetId` | `ecc-api-design` | governance、state、filtering 的稳定 id |
| `sourceRelativeDir` | `skills/ecc/api-design` | 源码读取路径 |
| `runtimeName` | `ecc-api-design` | runtime 目录名 |
| `frontmatterName` | `ecc-api-design` | host skill metadata，可校验但不替代 assetId |
| `capabilityPack` | `ecc-core-engineering` | pack gating |
| `capabilityRole` | `internal_reference_lens` | 能力角色 |

现有目录/frontmatter 不一致的 skill 必须继续工作。例如：

```text
sourceRelativeDir: skills/spec-session-extract
assetId: spec-session-extract
frontmatterName: session-extract
runtimeName: spec-session-extract
```

ECC-derived skill 可以要求：

```text
assetId == runtimeName == frontmatterName
```

但这个约束只适用于 `skills/ecc/**/SKILL.md`，不能反向套到所有既有 skill。

### 7.3 SkillSourceIndex

新增或等价实现一个结构化索引：

```text
SkillSourceIndex = Map<assetId, SkillSourceRecord>
```

记录形态：

```json
{
  "assetId": "ecc-api-design",
  "sourceRelativeDir": "skills/ecc/api-design",
  "sourceSkillFile": "skills/ecc/api-design/SKILL.md",
  "runtimeName": "ecc-api-design",
  "frontmatterName": "ecc-api-design",
  "capabilityPack": "ecc-core-engineering",
  "capabilityRole": "internal_reference_lens"
}
```

索引构建规则：

1. 扫描 `skills/**/SKILL.md`。
2. 读取 frontmatter。
3. 对一级目录旧 skill，默认 `assetId = directoryName`、`runtimeName = directoryName`。
4. 对 `skills/ecc/**/SKILL.md`，要求 frontmatter `name` 与 `ecc-*` runtimeName 一致。
5. 校验所有 `assetId` 全局唯一。
6. 校验所有 `runtimeName` 全局唯一。
7. 校验 `sourceRelativeDir` 必须位于 bundled `skills/` 根目录下，禁止 `..` 路径逃逸。

### 7.4 需要调整的代码面

| 函数/逻辑 | 当前假设 | 修订方案 |
|---|---|---|
| `listSkillDirectoryNames()` | 只扫描 `skills/` 一级目录 | 替换或升级为 `buildSkillSourceIndex()` |
| `validateSkillsGovernance()` | `skill_name` 必须存在于一级 bundled skills | 校验 governance `skill_name` 存在于 `assetId` 索引 |
| `readBundledSkillSource(skillName)` | 读取 `skills/<skillName>/SKILL.md` | 通过索引读取 `sourceSkillFile` |
| `syncSkills()` | source 和 target 都用 `skillName` | source 用 `sourceRelativeDir`，target 用 `runtimeName` |
| `planSkillsSync()` | dry-run source 和 target 都用 `skillName` | dry-run 使用同一索引，输出 source -> runtime 映射 |
| `inspectInstalledAssets()` | 对比 `skills/<skillName>` 与 runtime `<skillName>` | 对比 indexed source 与 runtimeName |
| Claude adapter path rewrite | 假设 `skills/${skillName}/` | 使用 source index 做 source path -> runtime path rewrite |
| Codex adapter path rewrite | 假设 `skills/${skillName}/` | 使用 source index 做 source path -> runtime path rewrite |
| `state.json` | 记录 runtime skill name | 保留 managed arrays，同时新增 `capabilityPacks` |

### 7.5 internal delivery 规则

不得把所有 `internal_only + internal` skills 自动下发。

修订后的 delivery 规则：

```text
1. 默认 init：沿用现有 internal delivery 行为，只下发现有允许的 internal skills。
2. --with-ecc core-engineering：额外下发 capability_pack=ecc-core-engineering 的 internal reference lens。
3. 其他 internal_only skills：除非被现有 allowlist 或启用的 pack 显式允许，否则不下发。
```

`AGENT_FACING_INTERNAL_SKILLS` 可以保留为 legacy internal allowlist，但不再承担 ECC 资产名单真相源。正式实现时应把它重命名或封装为：

```text
LEGACY_ALWAYS_DELIVERED_INTERNAL_SKILLS
```

并把 ECC delivery 交给 pack selection。

### 7.6 Governance schema

扩展 `skills-governance.schema.json`，允许：

```json
{
  "capability_pack": "ecc-core-engineering",
  "capability_role": "internal_reference_lens"
}
```

字段语义：

| 字段 | 是否必填 | 说明 |
|---|---|---|
| `capability_pack` | 否 | `null` 或字符串；`ecc-*` pack 必须显式 opt-in |
| `capability_role` | 否 | `internal_reference_lens`、`workflow_reference` 等有限枚举 |

示例：

```json
{
  "skill_name": "ecc-api-design",
  "entry_surface": "internal_only",
  "command_name": null,
  "host_scope": "dual_host",
  "owner_host": null,
  "capability_pack": "ecc-core-engineering",
  "capability_role": "internal_reference_lens",
  "host_delivery": {
    "claude": "internal",
    "codex": "internal"
  }
}
```

过滤规则：

```text
capability_pack == null：按现有规则处理
capability_pack == ecc-core-engineering：仅当 --with-ecc core-engineering 时进入 filtered set
未知 capability_pack：validator 报错
```

---

## 8. State、Doctor、Clean 生命周期

### 8.1 state shape

启用 ECC 后，`state.json` 必须记录：

```json
{
  "capabilityPacks": {
    "ecc": {
      "enabled": ["core-engineering"],
      "sourceVersion": "2.0.0-rc.1",
      "sourceCommit": "<ecc-source-commit>",
      "skills": [
        "ecc-api-design",
        "ecc-database-migrations-lite",
        "ecc-postgres-patterns-lite",
        "ecc-click-path-audit",
        "ecc-accessibility",
        "ecc-mcp-server-patterns"
      ],
      "agents": []
    }
  }
}
```

同时，managed `skills` 数组继续记录 runtime skill names，确保现有 clean 机制可逐步兼容。

### 8.2 生命周期矩阵

| 场景 | 期望行为 |
|---|---|
| 默认 init，从未启用 ECC | 不生成 ECC skills，不生成 ECC references，state 无 ECC enabled pack |
| 默认 init，但旧 state 曾启用 ECC | 不新增 ECC；doctor 应报告 stale managed ECC assets；clean 可移除 |
| init `--with-ecc core-engineering` | 生成 6 个 ECC skills、ECC references、state capabilityPacks |
| 重复 init `--with-ecc core-engineering` | 幂等更新，保持 state 与 runtime 一致 |
| dry-run `--with-ecc core-engineering` | 展示将生成的 6 个 skills、references、state 变化 |
| clean | 删除 state 中记录的 managed ECC skills/references，不删除用户自建 assets |
| doctor enabled healthy | 报告 6 installed、0 missing、0 drifted |
| doctor enabled missing | 报告 missing 名称和建议重新 init |
| doctor disabled stale | 报告 stale ECC managed assets 和建议 clean |

### 8.3 doctor 输出与 exit code

建议输出：

```text
ECC capability packs: disabled
```

```text
ECC capability packs: core-engineering
ECC skills: 6 installed, 0 missing, 0 drifted
ECC agents: 0 installed
No ECC commands or hooks installed
```

```text
ECC capability packs: disabled
Stale ECC managed assets detected: 6
Suggested action: spec-first clean --claude
```

Exit code：

| code | 含义 |
|---:|---|
| 0 | healthy |
| 1 | missing/drifted/stale managed assets |
| 2 | invalid state、unsupported pack、schema violation |

### 8.4 clean 安全规则

`clean` 只能删除：

1. state 记录为 managed 的 ECC runtime assets；或
2. 带 spec-first managed marker 且属于已知 ECC pack 的 assets。

不能按 `ecc-*` 前缀盲删，避免误删用户自建 skill。

---

## 9. Source lock 与 prompt supply-chain 安全

### 9.1 source lock 字段

新增能力锁定文档：

```text
docs/10-prompt/ecc-integration/source-lock.md
```

每个能力记录：

```text
source_project
source_version
source_git_commit
source_path
source_file_sha256
imported_name
imported_path
imported_file_sha256
import_type
allowed_tools
transform_notes
target_workflows
reviewed_by
imported_at
status
```

只记录 `source_version` 不够，必须有 commit/hash 才能防止 prompt supply-chain 漂移。

### 9.2 import-time lint

ECC-derived skill 导入时必须 lint 禁止：

```text
Task ecc-*
Task security-reviewer / database-reviewer / performance-optimizer 等 ECC agent 调用
/everything-claude-code:*
.claude/commands
.claude/hooks
.claude/agents
.agents/skills 绝对 runtime 写入假设
must call this agent
final verdict belongs to this skill
block merge
Edit / Write / Bash 执行修复暗示
hook installation
command installation
```

允许：

```text
作为 checklist / lens / reference 使用
返回 advisory findings
说明不拥有 final verdict
说明由调用方 workflow 判断是否适用
```

### 9.3 path safety

递归扫描必须校验：

```text
sourceRelativeDir 位于 bundled skills root 下
runtimeName 只允许 [a-z0-9][a-z0-9-]*
ECC runtimeName 必须以 ecc- 开头
禁止 ..、绝对路径、符号链接逃逸
runtime target 必须位于 adapter.skillsRoot 下
```

---

## 10. 分阶段落地计划

### Phase 0：Value Spike 与方案冻结

目标：验证 3 个 lens 是否真的有价值，不先做平台化改造。

范围：

```text
ecc-api-design
ecc-click-path-audit
ecc-accessibility
```

产出：

```text
source-lock 草案
lens 输出契约样本
是否进入 MVP Pack 的判断
```

### Phase 1：结构化 skill source index

完成：

```text
buildSkillSourceIndex()
assetId/sourceRelativeDir/runtimeName/frontmatterName 解耦
现有目录/frontmatter 不一致 skill 不破坏
path safety 校验
runtimeName 唯一性校验
```

### Phase 2：governance 与 fixed built-in pack

完成：

```text
skills-governance.schema.json 支持 capability_pack / capability_role
loadSkillsGovernance() 保留 capability 字段
validateSkillsGovernance() 校验 pack 和 source index
buildFilteredAssetSet() 接收 enabled capability selection
默认 no-ECC 行为保持不变
--with-ecc core-engineering 只启用固定内置 pack
```

### Phase 3：state / doctor / clean 闭环

完成：

```text
state normalize/build/read/write 支持 capabilityPacks
doctor 报告 disabled/enabled/missing/drifted/stale
clean 删除 managed ECC assets
init dry-run 展示 ECC 差异
```

### Phase 4：导入 MVP Pack 6 个 lens

导入：

```text
ecc-api-design
ecc-database-migrations-lite
ecc-postgres-patterns-lite
ecc-click-path-audit
ecc-accessibility
ecc-mcp-server-patterns
```

同时生成 gated references。

### Phase 5：Post-MVP security-lite 评估

仅在 MVP 验证有价值后评估：

```text
ecc-security-review-lite
```

不得导入 `ecc-security-reviewer` agent。

### Phase 6：Agent governance 后再接少量 agents

只有在以下全部完成后再考虑：

```text
agent filtering
frontmatter name uniqueness
Codex Task ecc-* lint 禁止或兼容转换
no-edit/read-only execution contract
findings schema
no final verdict contract
```

### Phase 7：Provider 化

如果固定内置 pack 被验证有价值，再考虑：

```text
integrations/ecc/manifest.json
src/cli/capability-providers/ecc.js
provider manifest schema
provider tarball/release tests
```

Provider 化不属于 MVP。

---

## 11. 后续 Agent 接入边界

### 11.1 MVP 禁止 ECC agents 进入 source tree

在 agent filtering 完成前，不允许把 ECC agent 文件放入：

```text
agents/
```

原因：当前 spec-first 会同步 `agents/` 下所有 markdown。只要文件进入 `agents/`，就可能默认泄漏到 runtime。

### 11.2 Agent governance 前置条件

后续如要接，需要满足：

```text
agents-governance.json
或 provider manifest
或 buildFilteredAssetSet() 返回 filtered agents
```

不能继续所有 `agents/*.md` 全量同步。

### 11.3 工具权限边界

不能把“Bash 只读命令”当成可执行安全边界。Bash 本身不可强制只读。

未来 ECC reviewer agents 必须满足：

```text
no Edit
no Write
no mutation command
no final verdict
schema-compatible findings only
```

如果 host 无法强制工具级只读，则只能通过 workflow 选择和 agent contract 降低风险，不能声称已实现强安全边界。

### 11.4 输出 schema

所有 ECC reviewer agents 必须输出兼容 `spec-code-review` 的 structured findings：

```text
severity
autofix_class
owner
requires_verification
confidence
pre_existing
suggested_fix
evidence
```

### 11.5 首批可考虑 agents

后续仅考虑这些有明确增量的 agents：

| Agent | 条件 |
|---|---|
| `ecc-silent-failure-hunter` | 改成 no-edit reviewer，输出 spec-code-review findings schema |
| `ecc-type-design-analyzer` | 只在 typed domain / TS 类型设计变化时调用 |
| `ecc-comment-analyzer` | advisory reviewer，不阻断 |
| `ecc-build-error-resolver` | 只作为 `spec-work` / `spec-debug` 中构建失败后的 resolver，不进入 review persona 池 |

不建议接入：

```text
ecc-security-reviewer
ecc-database-reviewer
ecc-performance-optimizer
ecc-docs-lookup
ecc-e2e-runner
ecc-refactor-cleaner
ecc-code-simplifier
```

---

## 12. Browser / UI 能力边界

`spec-first` 当前已有 `test-browser` skill，并强调浏览器测试路线。

任何 ECC browser/UI 能力必须服从 spec-first browser harness 约束，不能原样导入 ECC `browser-qa` 或 `e2e-runner` 中的 Playwright / Puppeteer / claude-in-chrome 多路线假设。

MVP 只允许：

```text
ecc-click-path-audit
```

作为 UI 状态流审计 lens。

后续如需接 `e2e-runner`，必须改写为 spec-first browser harness 兼容版本。

---

## 13. 验证策略

### 13.1 静态验证

```bash
npm run lint:skill-entrypoints
npm run typecheck
npm run test:unit
```

如果当前 `spec-first` 没有这些 npm script，应改用该项目现有等价测试命令，不在方案中新增虚假的可用命令声明。

### 13.2 Runtime dry-run

```bash
spec-first init --claude --dry-run
spec-first init --codex --dry-run
spec-first init --claude --with-ecc core-engineering --dry-run
spec-first init --codex --with-ecc core-engineering --dry-run
```

断言：

- 未启用 ECC 时，不生成 `ecc-*` runtime assets。
- 未启用 ECC 时，不生成 ECC reference runtime 文件。
- 启用 ECC 时，生成 expected 6 个 `ecc-*` skills。
- 启用 ECC 时，生成 gated ECC references。
- 不生成任何 ECC commands。
- 不安装任何 ECC hooks。
- 不生成 ECC agents。

### 13.3 Doctor / Clean

```bash
spec-first doctor --claude
spec-first doctor --codex
spec-first clean --claude --dry-run
spec-first clean --codex --dry-run
```

断言：

- doctor 能报告 ECC pack disabled/enabled。
- doctor 能报告 missing/drifted/stale ECC managed assets。
- clean 能清理 managed ECC assets。
- clean 不按 `ecc-*` 前缀盲删用户自定义 assets。

### 13.4 关键回归测试矩阵

| 测试 | 目的 |
|---|---|
| default init 不生成任何 `ecc-*` skill | 防止默认泄漏 |
| default init 不生成 ECC references | 防止幽灵能力引用 |
| `--with-ecc core-engineering` 生成 6 个 skill | 验证 opt-in |
| nested source path 可同步到 flat runtime path | 验证 `skills/ecc/*` 设计 |
| 现有 frontmatter/目录不一致 skill 不破 | 防止 canonical id 迁移事故 |
| governance 不接受未知 pack | 防止拼写错误静默通过 |
| doctor 能发现 missing ECC skill | 验证检查闭环 |
| clean 能移除 managed ECC skill | 验证清理闭环 |
| 不放行 `Task ecc-*` / ECC command 引用 | 防止 prompt 污染 |
| `agents/` 中没有 ECC agent 被默认同步 | 防止 agent 泄漏 |
| Claude / Codex dry-run 都稳定 | 验证双宿主 |

### 13.5 Workflow 行为验证

使用 fresh-source eval，不依赖当前会话缓存。

| Workflow | 验证点 |
|---|---|
| `spec-plan` | API/DB/UI/MCP 任务能否按需引用 ECC lens，但不强制 |
| `spec-debug` | UI 状态互相抵消问题能否建议 click-path audit |
| `spec-polish-beta` | 无障碍打磨能否引用 accessibility lens |
| `spec-code-review` | 相关 diff 能否参考 lens，但 final verdict 仍由原 workflow 决定 |
| `spec-mcp-setup` | MCP server 设计可参考 ecc-mcp-server-patterns，但 setup readiness 不被替代 |

---

## 14. 质量门禁

进入实现前必须满足：

| Gate | 要求 |
|---|---|
| Verdict | 文档保持 CONDITIONAL PASS，直到实现和测试通过后才能升级 |
| MVP 范围 | MVP Pack 固定为 6 个 reference/lens skills |
| Value Spike | 3 个 lens 只用于价值验证，不称为 MVP |
| 用户入口 | 不新增 `/ecc:*`、`/everything-claude-code:*`、`$ecc-*` |
| Commands | 不导入 ECC commands |
| Hooks | 不安装 ECC hooks |
| Agents | MVP 不导入 ECC agents，且不把 ECC agent 放入 `agents/` |
| Browser | 服从 spec-first browser harness 约束 |
| Asset identity | 使用 `assetId/sourceRelativeDir/runtimeName/frontmatterName` 结构化模型 |
| Governance | ECC skills 由 capability pack 控制，不能只靠 JS 常量名单 |
| Internal delivery | 不得把所有 `internal_only + internal` 自动下发 |
| State | `--with-ecc` 状态可持久化、可检查、可清理 |
| Reference gating | 未启用 ECC 时不暴露 ECC reference |
| Prompt safety | source lock 有 commit/hash，import lint 禁止 command/hook/agent 越权语义 |
| 双宿主 | Claude/Codex dry-run 均通过 |
| Source attribution | 每个 ECC-derived asset 记录来源版本、commit、hash、路径、转换说明 |
| Workflow | ECC lens 只提供输入，不拥有最终 verdict |

---

## 15. 最终推荐实施路线

推荐路线：

```text
第一步：做 3-lens Value Spike，验证 ECC lens 是否真实增强 spec-first。
第二步：实现结构化 SkillSourceIndex，不让 frontmatter.name 直接成为全局 canonical id。
第三步：扩展 governance schema 和 fixed built-in pack filtering，保持默认 no-ECC。
第四步：实现 --with-ecc core-engineering、state、doctor、clean 生命周期闭环。
第五步：导入 6 个 MVP Pack lens，并只在启用 pack 时生成 references。
第六步：补 source lock、hash、import-time lint 和 path safety。
第七步：验证 workflow 增益和双宿主 runtime 行为。
第八步：MVP 稳定后再评估 security-lite、agent governance 和 provider 化。
```

Value Spike：

```text
ecc-api-design
ecc-click-path-audit
ecc-accessibility
```

MVP Pack：

```text
ecc-api-design
ecc-database-migrations-lite
ecc-postgres-patterns-lite
ecc-click-path-audit
ecc-accessibility
ecc-mcp-server-patterns
```

一句话结论：

```text
ECC 可以增强 spec-first，但第一阶段只能作为显式启用、内部 reference lens 进入；不能作为默认大包、第二套 workflow、未治理的 agent 池，或绕过 spec-first governance 的 prompt supply-chain 进入。
```
