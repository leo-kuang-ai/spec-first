---
title: "refactor: 将 init 初始化入口内容收敛为 context router"
type: refactor
status: completed
date: 2026-05-13
spec_id: 2026-05-13-001-init-instruction-router
---

# refactor: 将 init 初始化入口内容收敛为 context router

## 摘要

本计划将 `spec-first init --claude|--codex` 写入 `CLAUDE.md` / `AGENTS.md` 的 workflow bootstrap 内容从“较完整的治理说明”收敛为短而高信号的 context router。第一阶段只优化 `spec-first:bootstrap` managed block，保持 `lang-policy`、`coding-guidelines`、GitNexus evidence block 和 runtime delivery 行为不变。

---

## 问题框定

当前 `init` 生成的根入口文档已经具备正确分层：语言与 changelog 治理、workflow 入口治理、编码执行准则、GitNexus evidence 边界分别由独立 managed block 管理。但随着 workspace、startup reminder、doc-review dispatch、standards、graph readiness 等规则进入 bootstrap，`CLAUDE.md` / `AGENTS.md` 中的入口提醒开始偏向“微型手册”，不再足够像每次会话都应加载的 context router。

这会带来三个问题：

- 上下文负担增加：每次新会话都会加载较长入口说明，挤占真正理解代码和任务的上下文空间。
- 真相源漂移风险增加：`skills/using-spec-first/SKILL.md` 已是完整 routing policy source-of-truth，bootstrap 若复制过多细节，后续容易变成第二份路由规范。
- 边界信号变弱：入口文档越长，`using-spec-first`、`current host`、`source/runtime`、`target_repo`、`do not hand-edit generated runtime` 这些真正关键的 guardrails 越容易被淹没。

目标不是删除治理，而是把根入口文档恢复为“告诉 agent 什么时候该去哪里读完整信息”的短路由器。

---

## 需求

- R1. `spec-first:bootstrap` managed block 必须保持为 workflow entry context router，不复制 `using-spec-first` 的完整 decision tree。
- R2. `skills/using-spec-first/SKILL.md` 继续作为 workflow routing policy source-of-truth。
- R3. bootstrap 必须保留 substantial work 前入口判断提醒，包括文件修改、state-changing command、架构 / prompt / workflow 决策。
- R4. bootstrap 必须保留“已在 workflow 或 bounded subagent 中时不重新分流”的边界。
- R5. bootstrap 必须保留当前 host 入口边界：Claude 使用 `spec-*`，Codex 使用 `spec-*`。
- R6. bootstrap 必须保留“不默认进入 `spec-brainstorm`，不自动串联多个 workflow”的高频防错信号。
- R7. bootstrap 必须保留父 workspace 的最小安全边界：只读候选 repo 可用 advisory facts，写入 / 修复 / 测试 / review autofix / commit 前必须有明确 `target_repo` 或 per-child scope。
- R8. Codex bootstrap 必须保留 startup reminder 的 best-effort / non-blocking / top-level-only 边界，以及 public workflow 调用授权其文档化 read-only reviewer/researcher phase 的规则。
- R9. common anchors 可以保留为短索引，但不得扩展成完整 workflow menu 或 handoff 流程。
- R10. 不合并 managed blocks：`lang-policy`、`bootstrap`、`coding-guidelines`、GitNexus evidence block 继续各自承担独立职责。
- R11. 本轮不改变 `init` 的 runtime asset 同步、`clean` 移除范围、`doctor` drift 检查语义或 GitNexus block 创建策略。
- R12. checked-in `AGENTS.md` / `CLAUDE.md` 的 managed bootstrap source slice 必须与 generator 输出对齐，避免本仓库自检立即 drifted。
- R13. 所有 source 变更必须更新 `CHANGELOG.md`，并用当前 host developer profile 的作者名。

---

## 假设

- A1. 本计划直接来自当前对 `init` 初始化内容的优化讨论，没有单独的 upstream requirements document。
- A2. 本轮优先解决最大信息密度来源：`src/cli/instruction-bootstrap.js` 生成的 bootstrap block。
- A3. `lang-policy` 与 `coding-guidelines` 虽然也可进一步瘦身，但纳入同一变更会扩大测试面和行为审查范围，先作为 follow-up。
- A4. 计划实施时工作区可能仍有用户已有 dirty 文件；执行者必须只修改本计划列出的文件和必要的 changelog 记录。

---

## 范围边界

- 不新增 `spec-next`、`spec-guide`、CLI router、routing script、状态机或新 public workflow。
- 不把 `CLAUDE.md` / `AGENTS.md` 变成完整 workflow 手册。
- 不把 GitNexus / code-review-graph readiness、provider status 或动态 facts 写进 bootstrap。
- 不修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors 作为 source fix。
- 不把 `coding-guidelines` 扩展成 workflow routing 或 next-step guidance。
- 不改变 `clean` 对 `lang-policy` 保留、对 `bootstrap` / `coding-guidelines` 移除的现有行为。
- 不改变 `init` 对 missing GitNexus block 默认不创建的行为。

### 后续工作

- 压缩 `lang-policy`：需要单独判断通用项目与 spec-first 自身的 changelog 铁律是否应拆层。
- 压缩 `coding-guidelines`：需要同时处理 `templates/rules/claude.md` 英文模板对齐和 execution posture 测试。
- 为 fresh init 创建非 managed 的项目上下文 skeleton：这会改变文件不存在时的用户可编辑内容形态，需要单独设计 ownership 和 clean/doctor 边界。
- 将 README / 用户手册中的入口说明进一步 progressive disclosure 化：可在本次实现后根据实际文案同步。

---

## 图谱就绪状态

- 目标仓库: `spec-first`
- 状态: stale
- source_revision: `2a16a9d7c80d86178f93cd928cc885d60b398ff9`
- current_revision: `2a16a9d7c80d86178f93cd928cc885d60b398ff9`
- stale: true
- primary_providers: `code-review-graph`, `gitnexus`
- degraded_providers: compiled artifacts 未报告
- fallback_capabilities: 有界直接仓库读取与会话内 GitNexus 证据
- runtime_mcp_evidence: live GitNexus 对 init instruction blocks 的 query 成功；live GitNexus impact 显示 `buildInitMetadataPlan` 为 LOW risk，`buildBootstrapBlock` 为 MEDIUM risk
- confidence: medium
- limitations: 编译后的 graph facts 来自同一 commit，但记录的 worktree status hash 与当前 dirty worktree 不一致；会话内 GitNexus 证据未回写到 canonical graph readiness artifacts

---

## 上下文与调研

### 相关代码与模式

- `src/cli/commands/init.js` 负责 init write plan。`buildInitMetadataPlan()` 按以下顺序组装 instruction file：移除 legacy runtime tools block，应用 `lang-policy`，应用 `instruction-bootstrap`，应用 `coding-guidelines`，再归一化已有 GitNexus block。
- `src/cli/instruction-bootstrap.js` 负责 `buildBootstrapBlock()`、`buildZhBootstrapBody()`、`buildEnBootstrapBody()`、`applyManagedBootstrapBlock()`、`inspectInstructionBootstrap()` 和 `removeManagedBootstrapBlock()`。
- `src/cli/lang-policy.js` 负责 language 与 changelog policy；它不是 workflow router。
- `src/cli/coding-guidelines.js` 负责 routing-after execution posture。现有测试已经断言它不能包含 next-step 或 command routing 内容。
- `src/cli/gitnexus-instruction-block.js` 负责 GitNexus evidence boundary。`init` 会归一化已有 block，但不会创建缺失的 GitNexus block。
- `src/cli/commands/doctor.js` 通过 inspect helpers 对 generated bootstrap/coding-guidelines blocks 做 byte-compare，因此 generator 变化要求 checked-in `AGENTS.md` / `CLAUDE.md` managed slices 同步对齐。
- `src/cli/commands/clean.js` 会移除 bootstrap 与 coding-guidelines blocks，保留 lang-policy，且不移除 GitNexus block。
- `tests/unit/instruction-bootstrap.test.js` 与 `tests/unit/init-dry-run.test.js` 是 bootstrap text 与 init-generated instruction content 的主要行为契约。
- `tests/smoke/cli.sh` 与 `tests/smoke/release-dual-host-governance.sh` 会 grep 关键 bootstrap phrases；实现必须保留这些短语，或用等价意图更新 smoke guards。

### 项目沉淀

- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` 强化了 source-first repair：generated runtime mirrors 应重新生成，而不是手工编辑。
- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md` 指出 host entrypoint mapping 应位于 init/governance layers，而不是散落在共享 prose 中。
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` 说明 changing public workflow surfaces 会触及 command manifest、dual-host governance 与 adapters；本计划避免新增 surface。
- `docs/plans/2026-04-20-012-feat-init-coding-guidelines-plan.md` 建立了 managed block separation：language/changelog、workflow entry 和 execution posture 必须分离。
- `docs/plans/2026-05-02-001-feat-using-spec-first-next-step-guidance-plan.md` 建立了 next-step guidance 属于 `using-spec-first` 的边界；bootstrap 只能承载 thin reminder。
- `docs/plans/2026-05-09-002-refactor-skill-doc-text-optimization-plan.md` 提醒缩短 prompts 时必须保留 high-signal guardrails，而不是无差别删除。

### 外部参考

- 跳过外部调研。本计划是内部 CLI/runtime governance 与 prompt-surface refactor，本地 source patterns 已足够明确，且没有第三方 API 依赖。

---

## 关键技术决策

- 首先只精简 `spec-first:bootstrap`：它是当前内容最像 duplicated routing policy 的 block。
- 保持 managed block boundaries 不变：通过收窄每个 block 的职责来缩短内容，而不是合并 blocks。
- 只在允许的 governance surfaces 中保留 host-specific wording：`instruction-bootstrap`、init output、README entry tables 和 tests。
- 将 checked-in `AGENTS.md` / `CLAUDE.md` 视为 source entry documents，但将 `.claude/`、`.codex/` 和 `.agents/skills/` 视为 generated runtime mirrors。
- 保持 `using-spec-first` 作为唯一完整 router：bootstrap 指向它，并只承载最小 always-loaded trigger set。
- 测试保持语义导向，而不只看 byte-count：line budget 有用，但真正 contract 是保留或排除特定 routing boundaries。

---

## 开放问题

### 规划阶段已解决

- 这次是否也修改 `lang-policy`？不修改。它的 changelog 与 language policy 是独立职责，需要单独风险审查。
- 这次是否也修改 `coding-guidelines`？不修改。该 block 是 execution posture，不是 workflow routing；修改它会扩大 scope 与 template alignment 工作。
- init 是否生成新的通用项目 skeleton？本计划不做。skeleton 会改变 user-editable text 的 ownership 与 clean/doctor 预期。
- bootstrap 是否保留 common entry anchors？保留，但作为 compact index，而不是完整 route map。
- 实施是否把 runtime generated files 当成修复目标？不。先改 source generator 和 checked-in source entry docs，只在需要时再 regenerate runtime。

### 留待实施阶段

- 精确措辞与 line budget 可在实施阶段定稿，但最终 bootstrap body 应在保留 R1-R9 的同时明显短于当前 generated body。
- 如果 smoke tests 依赖不再适合短 contract 的旧短语，应更新为断言 replacement intent，而不是保留 stale wording。
- prose 变化后是否运行 fresh-source eval 取决于实施范围；如执行，必须使用当前磁盘 source，而不是 cached runtime skill definitions。

---

## 高层技术设计

> *本节说明预期方向，供评审参考，不是实现规格。实施 agent 应把它当作上下文，而不是照抄的代码。*

| 管理面 | 真相源保留在 | 本计划后的 router 内容 | 明确排除 |
| --- | --- | --- | --- |
| `spec-first:lang` | `src/cli/lang-policy.js` | 语言与 changelog 策略 | Workflow 路由与工具证据 |
| `spec-first:bootstrap` | `src/cli/instruction-bootstrap.js` + 指向 `skills/using-spec-first/SKILL.md` | 轻量入口提醒、当前 host 边界、最小锚点、source/runtime guardrails | 完整路由树、guide-mode 菜单、graph readiness 流程 |
| `spec-first:coding-guidelines` | `src/cli/coding-guidelines.js` | 路由后的执行姿态 | next-step 路由、workflow selector 内容 |
| `gitnexus` | `src/cli/gitnexus-instruction-block.js` | block 存在时的证据边界 | 动态 provider 状态或强制 impact 声明 |

预期 bootstrap 形态：

```text
Workflow 入口治理
- 这个 block 是什么，以及完整 routing source 在哪里
- 什么时候考虑 workflow，什么时候直接轻量回答
- 当前 host 的入口语法
- 用一行说明 workspace target 安全边界
- 用紧凑形式说明 Codex-only startup / dispatch 边界
- 紧凑常用入口锚点
- 反模式：不默认 brainstorm、不自动串联、不暴露 internal-only 能力
```

---

## 实施单元

### U1. 定义瘦身版 bootstrap 契约测试

**目标：** 在改 prose 前，先把预期的 context-router 行为转化为聚焦测试。

**关联需求：** R1, R2, R3, R4, R5, R6, R7, R8, R9

**依赖：** 无

**文件：**
- 修改: `tests/unit/instruction-bootstrap.test.js`
- 修改: `tests/unit/init-dry-run.test.js`

**做法：**
- 用保留 guardrails 的语义断言替换脆弱的长 prose 断言。
- 保留 Claude `spec-*` 与 Codex `spec-*` 的 host-specific 检查。
- 增加反向断言，确保 bootstrap 不膨胀成完整 routing tree 或 guide-mode menu。
- 保留对 `workspace-graph-targets.v1`、`target_repo`、`startup-reminder --codex`、non-blocking startup reminder，以及 Codex workflow-owned read-only reviewer/researcher dispatch authorization 的断言。

**执行说明：** 尽量 test-first；第一次运行应只因为预期文案变化失败。

**遵循模式：**
- `tests/unit/coding-guidelines.test.js` 中保持 execution posture 与 workflow routing 分离的反向断言。
- `tests/unit/gitnexus-instruction-block.test.js` 中面向稳定轻量 contract 而非旧冗长文本的归一化断言。

**测试场景：**
- 正常路径：生成的 Claude zh/en bootstrap 包含指向 `using-spec-first` 的短指针、当前 host 入口语法和常用锚点。
- 正常路径：生成的 Codex zh/en bootstrap 包含 `spec-*`、`spec-first startup-reminder --codex`、non-blocking 行为和 workflow-owned read-only dispatch authorization。
- 边界情况：corrupted marker repair 仍会移除 stale generated-like bodies，并保留 clean-heading user sections。
- 错误路径：builder 变化后，drifted bootstrap 仍可被 `inspectInstructionBootstrap()` 检测到。
- 集成：`init --claude` 与 `init --codex` 只生成一个 bootstrap marker，并保留周围用户内容。

**验证：**
- 更新后的测试把 bootstrap 描述为 thin context router；如果旧的 long-form policy text 被重新引入，测试会失败。

---

### U2. 精简 bootstrap 生成器

**目标：** 更新 `buildZhBootstrapBody()` 与 `buildEnBootstrapBody()`，产出紧凑的 context-router 文本，同时保留 host-specific 边界。

**关联需求：** R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11

**依赖：** U1

**文件：**
- 修改: `src/cli/instruction-bootstrap.js`
- 测试: `tests/unit/instruction-bootstrap.test.js`
- 测试: `tests/unit/init-dry-run.test.js`

**做法：**
- 将 parent workspace 段落压缩成一行高信号说明：advisory read-only candidate facts 可用，但 mutating work 需要明确 `target_repo` / per-child scope。
- 保留 Codex-specific startup reminder 与 dispatch 规则，但移除重复解释。
- 将 common anchors 保持为带 current-host command syntax 的紧凑索引。
- 保留指向完整 policy 的 `skills/using-spec-first/SKILL.md`。
- 不改变 marker names、append/replace behavior、legacy-body stripping 或 inspect statuses。

**遵循模式：**
- `src/cli/gitnexus-instruction-block.js`：短而边界清晰的 evidence boundary block。
- `docs/plans/2026-05-02-001-feat-using-spec-first-next-step-guidance-plan.md`：“bootstrap 是 thin reminder，完整 policy 位于 using-spec-first”。

**测试场景：**
- 正常路径：zh 与 en blocks 明显更短，同时保留相同 block heading 与 markers。
- 边界情况：不引入 unknown host；generator 仍只按 adapter id 分支。
- 错误路径：旧的 drifted bootstrap body 会被新的 clean body 替换。
- 集成：`buildInitMetadataPlan()` 继续生成 `lang -> bootstrap -> coding-guidelines` 顺序。

**验证：**
- `npx jest tests/unit/instruction-bootstrap.test.js tests/unit/init-dry-run.test.js --runInBand` 通过。

---

### U3. 对齐 checked-in host 入口文档

**目标：** 保持 repo-root `AGENTS.md` 与 `CLAUDE.md` 和新的 bootstrap generator 对齐，避免本仓库 source entry docs 立即 drifted。

**关联需求：** R10, R11, R12, R13

**依赖：** U2

**文件：**
- 修改: `AGENTS.md`
- 修改: `CLAUDE.md`
- 修改: `CHANGELOG.md`
- 测试: `tests/unit/repository-guidance-contracts.test.js`

**做法：**
- 只替换每个 checked-in entry document 中的 `<!-- spec-first:bootstrap:start -->` managed slice。
- 保留 managed block 之外所有手写项目指引。
- 不触碰 `.claude/`、`.codex/` 或 `.agents/skills/` 下的 generated runtime mirrors。
- 使用当前 host developer profile 添加必要 changelog 记录：Codex 读取 `.codex/spec-first/.developer`，Claude 读取 `.claude/spec-first/.developer`；如果 profile 缺失，先按 repo init guidance 处理，再写 source changes。

**遵循模式：**
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`：source-first repair。
- `AGENTS.md` 与 `CLAUDE.md` 中现有 managed block 顺序。

**测试场景：**
- 正常路径：repository guidance tests 仍能找到 source/runtime validation guidance 与 GitNexus evidence contract。
- 正常路径：repository guidance tests 从 `AGENTS.md` 和 `CLAUDE.md` 抽取 `spec-first:bootstrap` managed slice，并断言它们分别与 `buildBootstrapBlock(getAdapter('codex'), 'zh')`、`buildBootstrapBlock(getAdapter('claude'), 'zh')` 精确相等。
- 边界情况：root entry documents 各自只有一个 bootstrap start marker。
- 错误路径：旧的长 parent workspace prose 不会残留在 managed block 内。

**验证：**
- checked-in `AGENTS.md` / `CLAUDE.md` 有自动化 equality check，能对照 generator 当前 zh bootstrap body 验证各自的 host-specific surface。

---

### U4. 只在必要处更新 smoke 与生命周期 guard

**目标：** 在文案变化后保持 smoke 与生命周期测试有意义，避免只因为测试 grep 旧文案而保留 stale long-form prose。

**关联需求：** R7, R8, R11, R12

**依赖：** U2, U3

**文件：**
- 修改: `tests/smoke/cli.sh`，如果现有 grep terms 发生变化
- 修改: `tests/smoke/release-dual-host-governance.sh`，如果 Codex startup reminder wording 发生变化
- 修改: `tests/unit/claude-settings.test.js`，如果 Claude SessionStart hook bootstrap fixture 或 semantic assertions 依赖变更后的 prose

**做法：**
- 优先保留关键 grep tokens，例如 `workspace-graph-targets.v1`、`target_repo`、`spec-first startup-reminder --codex` 和 non-blocking behavior。
- 如果某个短语为清晰度被移除，用检查同一边界的断言替代，而不是换成更窄的字符串。
- 除非测试暴露真实 lifecycle mismatch，否则不修改 `clean` / `doctor` 代码。
- 如果 `tests/unit/clean-dry-run.test.js` 或 `tests/unit/doctor-runtime-tools.test.js` 失败，先视为 implementation boundary violation 或 stale over-coupled assertion；不在未修订 scope 的情况下把本计划扩展为 clean/doctor lifecycle changes。

**遵循模式：**
- `tests/smoke/cli.sh` 当前对两个 hosts 的 marker checks。
- `tests/smoke/release-dual-host-governance.sh` 当前 host-specific governance checks。
- `tests/unit/claude-settings.test.js` 当前 SessionStart hook bootstrap injection contract。

**测试场景：**
- 正常路径：Claude 和 Codex smoke init 仍生成带 lang、bootstrap、coding-guidelines markers 的 instruction files。
- 正常路径：Claude SessionStart hook 仍注入新的 thin bootstrap router content，并保持相同 managed marker boundaries。
- 集成：Codex release governance smoke 仍证明 startup reminder 是 non-blocking，且不适用于 bounded subagents、leaf reviewers 或 workers。
- 回归：clean 仍移除 bootstrap/coding-guidelines，并保留 lang-policy 与 GitNexus block。

**验证：**
- 如果 hook assertions 发生变化，`npx jest tests/unit/claude-settings.test.js --runInBand` 通过。
- 如果 smoke files 被修改，`npm run test:smoke` 通过。

---

### U5. 评估用户可见文档影响

**目标：** 判断 generated-entry-content 变化是否需要在 U3 已负责的 `CHANGELOG.md` 之外同步 release notes 或用户手册。

**关联需求：** R13

**依赖：** U2, U3

**文件：**
- 修改: `docs/08-版本更新/README.md`，如果实现对用户足够可见，需要版本说明
- 修改: `README.md` / `README.zh-CN.md`，仅当当前公开文档描述了旧的较长 bootstrap 行为

**做法：**
- 将 generator output change 视为 user-visible，因为未来 `init` 会改变 `CLAUDE.md` / `AGENTS.md`。
- 文档保持概念层级：“init 写入 thin workflow entry reminder；完整 routing policy 位于 using-spec-first。”
- 不在 README 中复制精确的 generated block。

**遵循模式：**
- `docs/08-版本更新/README.md` 中过往 init-managed block changes 的小节。
- README 中引导用户描述任务或询问下一步，而不是阅读完整 router menu 的说明。

**测试场景：**
- 测试预期：无。仅做可选 release / user documentation review，除非 README wording 有现有测试需要更新。

**验证：**
- U3 为实现变更只负责一条 changelog entry；可选公开文档不会引入第二份 routing policy。

---

### U6. 用 fresh-source 场景验证路由理解

**目标：** 证明更短的 bootstrap 改善或至少保持 agent routing comprehension，而不只是更短、包含关键 token。

**关联需求：** R1, R2, R3, R4, R5, R6, R7, R8, R9

**依赖：** U2, U3

**文件：**
- 修改: `docs/contracts/workflows/fresh-source-eval-checklist.md`，仅当现有 checklist 缺少记录此 eval 的合适方式
- 测试: 无。使用 semantic evaluation artifact 或最终实现说明

**做法：**
- source edits 后运行轻量 fresh-source eval：把当前磁盘上的 `buildBootstrapBlock()` 输出或 checked-in managed bootstrap slices，加上最小 host context，交给 fresh read-only reviewer。
- 使用 3-5 个 scenario prompts 测试 router 的真实职责：
  - lightweight fact question 不应强制进入 workflow；
  - clear substantial source edit 应路由到 current-host work；
  - bounded subagent 已在 workflow 内时不应重新入口分流；
  - parent workspace mutating work 应要求明确 `target_repo` / per-child scope；
  - Codex startup reminder 应为 non-blocking 且 top-level only。
- 在 implementation closeout 或 validation notes 中记录 pass/fail 和限制。不要把 eval 变成 deterministic router script。

**遵循模式：**
- `docs/contracts/workflows/fresh-source-eval-checklist.md`：current-source、cache-safe prose validation。
- `skills/using-spec-first/SKILL.md` guide-mode examples：预期 routing behavior。

**测试场景：**
- 测试预期：无。这是 semantic fresh-source eval，不是 unit test。Unit tests 仍负责 deterministic generator 和 marker behavior。

**验证：**
- Fresh-source eval 报告 thin bootstrap 在所选 scenarios 下保留正确 routing posture；或实现记录失败 scenario，并在 handoff 前修订 bootstrap。

---

## 全系统影响

- **交互图：** `init` 通过同一个 `buildInitMetadataPlan()` 路径写入更短的 bootstrap 文本；在 `init` 重新生成前，`doctor` 会把旧 bootstrap blocks 视为 drifted。
- **错误传播：** Marker corruption handling 应保持不变；stale generated-like bodies 会被剥离，并追加或替换为一个 clean block。
- **状态生命周期风险：** Runtime state files 与 asset manifests 不受影响。唯一 source/runtime sync 风险是误把 checked-in `AGENTS.md` / `CLAUDE.md` 当作 generated runtime；本计划将它们视为 source entry docs。
- **API surface parity：** Claude 与 Codex entry syntax 继续 host-specific；不引入新的 command、skill、CLI flag 或 manifest entry。
- **集成覆盖：** Unit tests 覆盖 generator 与 init output；smoke tests 覆盖实际 host runtime installation surface。
- **不变约束：** `lang-policy` 仍是 language/changelog policy，`coding-guidelines` 仍是 execution posture，GitNexus block 仍是 evidence boundary，完整 routing policy 仍位于 `skills/using-spec-first/SKILL.md`。

---

## 风险与依赖

| 风险 | 缓解措施 |
|------|------------|
| 过度压缩导致 critical guardrails 丢失 | 保留针对 `using-spec-first`、substantial work routing、no default brainstorm、no auto-chain、`target_repo` 和 generated runtime boundaries 的语义测试。 |
| 只优化字数 | 运行轻量 fresh-source scenario eval，让更短的 block 接受真实 routing comprehension 检查，而不只看 token count。 |
| checked-in `AGENTS.md` / `CLAUDE.md` 仍处于 drifted 状态 | generator 变化后同步 managed bootstrap slices，并保持 repository guidance tests 通过。 |
| Smoke tests 固化旧文案 | 在 exact prose 变化处更新 smoke assertions，使其检查意图。 |
| 意外改变 runtime behavior | 本计划不修改 `init` operation planning、adapter delivery、`clean`、`doctor` 或 managed markers。 |
| 创建第二份 routing source | bootstrap 只保留 pointer 与 trigger；所有 route selection details 继续位于 `skills/using-spec-first/SKILL.md`。 |

---

## 已考虑的替代方案

- 一次 PR 精简所有 managed blocks：首轮拒绝，因为 `lang-policy`、`coding-guidelines` 和 GitNexus block 各自有独立测试与职责。
- 用一个指向 `using-spec-first` 的链接完全替代 bootstrap：拒绝，因为 root instruction files 仍需要少量 always-loaded high-signal triggers，以保障 routing 与 source/runtime safety。
- 新增 `CONTEXT.md` 或 `MEMORY.md`：本计划拒绝，因为 spec-first 已有 `spec-standards`、graph artifacts 和 compound workflows 来承载 durable context 与 knowledge。
- init 时生成 project-specific prohibition list：拒绝，因为 scripts 不应基于部分 repo evidence 推断语义 tech-stack constraints。

---

## 文档 / 运维说明

- 实施不应把对本仓库运行 `spec-first init --claude|--codex` 当作 source 编辑的替代品。可以在临时项目或 dry-run 中用 init 做验证。
- 如果 source 变更后必须刷新 runtime mirrors，应作为单独 regeneration step 执行，不要把 runtime diff 当作 source fix。
- 最终 PR 应说明是否有意不更新 generated runtime assets。

---

## 来源与参考

- 相关代码: `src/cli/commands/init.js`
- 相关代码: `src/cli/instruction-bootstrap.js`
- 相关代码: `src/cli/lang-policy.js`
- 相关代码: `src/cli/coding-guidelines.js`
- 相关代码: `src/cli/gitnexus-instruction-block.js`
- 相关测试: `tests/unit/instruction-bootstrap.test.js`
- 相关测试: `tests/unit/init-dry-run.test.js`
- 相关测试: `tests/smoke/cli.sh`
- 相关沉淀: `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- 相关沉淀: `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
- 相关沉淀: `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`
- 相关计划: `docs/plans/2026-04-20-012-feat-init-coding-guidelines-plan.md`
- 相关计划: `docs/plans/2026-05-02-001-feat-using-spec-first-next-step-guidance-plan.md`
