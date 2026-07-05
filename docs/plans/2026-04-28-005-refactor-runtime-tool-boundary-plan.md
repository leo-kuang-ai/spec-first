---
title: "refactor: 停止向全局 instruction 写入 runtime tooling"
type: refactor
status: completed
date: 2026-04-28
spec_id: 2026-04-28-005-runtime-tool-boundary
---

# refactor: 停止向全局 instruction 写入 runtime tooling

## 概览

本计划采用更小、更清晰的方案：**停止把 runtime tooling guidance 写入全局 `CLAUDE.md` / `AGENTS.md`**。

`GitNexus`、`code-review-graph`、graph readiness、Serena、ast-grep 仍然保留，但它们不再作为所有 workflow 默认可见的全局提示。工具目录和 readiness 语义继续收口在 `skills/spec-mcp-setup/references/supported-mcp-tools.md`、`.spec-first/graph/*` 和 `.spec-first/impact/*`；`spec-plan`、`spec-work`、`spec-code-review` 等工程执行 workflow 按需读取和使用。

这样比“继续写入全局，然后在全局里解释适用范围”更符合项目基线：少写全局 prompt，减少解释性 guard，把阶段边界交还给具体 skill。真正要做的是移除全局写入这个污染源，而不是在每个上游 skill 里补防火墙。

---

## 问题框架

当前 `spec-first init` 会把 `src/cli/runtime-tools-index.js` 生成的 `spec-first:runtime-tools` managed block 写入 `CLAUDE.md` / `AGENTS.md`。这段 block 会在所有 workflow 的全局 instruction context 中出现。

这带来两个问题：

- `spec-brainstorm`、需求澄清、产品定义等上游阶段不需要 runtime tooling，却会被动看到 GitNexus / CRG / graph-bootstrap / impact analysis 相关内容。
- 如果靠全局 prompt 解释“什么时候不要用这些工具”，本质上仍然把工程执行 evidence routing 放进了全局高优先级上下文，增加 prompt 噪音和误触发概率。

更稳的边界是：

```text
CLAUDE.md / AGENTS.md
  语言、workflow 入口、coding guidelines、仓库级硬约束

skills/spec-mcp-setup/references/supported-mcp-tools.md
  工具目录、安装说明、readiness 语义

spec-plan
  读取 graph readiness facts，但 optional bounded

spec-work / spec-code-review
  代码编辑、impact、review 时按需使用 GitNexus / CRG

spec-brainstorm
  保持现有 light repo scan / code reads 能力，用于验证产品和实现事实；
  不新增额外防火墙或降级规则
```

---

## 需求追踪

- R1. `spec-first init --claude|--codex` 不再向 `CLAUDE.md` / `AGENTS.md` 写入 `<!-- spec-first:runtime-tools:start -->` managed block。
- R2. 当前仓库已提交的 `CLAUDE.md` / `AGENTS.md` 删除现有 `spec-first:runtime-tools` block，只保留语言、workflow 入口、coding guidelines 和其他真正全局的仓库约束。
- R3. `doctor` 不再要求 runtime-tools block installed，也不再把缺失 runtime-tools block 视为 drift / warning。
- R4. `clean` 保留移除 legacy `spec-first:runtime-tools` block 的能力，用于清理老项目和当前仓库旧 block。
- R5. `src/cli/runtime-tools-index.js` 不再作为全局写入模板使用；本轮可以保留最小 legacy cleanup helper，避免一次性删除造成 clean 回归。
- R6. `spec-brainstorm` 不做本轮改造；它继续保留现有代码事实验证能力，必要时可以做 light repo scan / code reads。
- R7. `spec-plan` 保留现有 `Graph Readiness Facts (Optional, Bounded)` 逻辑；本次不需要为 runtime tooling 额外补下游防火墙。
- R8. `spec-work` / `spec-code-review` 仍可在工程执行阶段按需使用 GitNexus / CRG；本次不降低执行阶段证据能力。
- R9. 测试必须证明 init 不写 runtime-tools block、doctor 不检查 runtime-tools block、clean 能清理 legacy block、当前 root instructions 不含 runtime-tools block。
- R10. 本次源码和文档变更必须按项目规则更新 `CHANGELOG.md`。

---

## 范围边界

- 不删除 GitNexus 能力。
- 不删除 external `code-review-graph` 能力。
- 不删除 graph compiler。
- 不删除 `.spec-first/graph/*` 或 `.spec-first/impact/*` readiness artifacts。
- 不改变 `spec-graph-bootstrap` provider command safety 或 canonical artifact 输出。
- 不把工具目录复制到 `CLAUDE.md` / `AGENTS.md` 的其他 block。
- 不手工修改 `.agents/skills/`、`.claude/`、`.codex/` 下的 generated/runtime mirrors。
- 不修改 `spec-brainstorm` 的现有代码事实验证能力。
- 不修改 `spec-plan` 的现有 optional graph readiness 消费逻辑。

---

## Graph Readiness

- status: stale
- source_revision: 5d191758552cc10962e93131254a79391092982f
- current_revision: 40fe1c0749e624cbe2e57146bd1e295a1ca05c44
- stale: true
- primary_providers: code-review-graph, gitnexus
- degraded_providers: none recorded
- fallback_capabilities: bounded direct repo reads, Serena MCP / ast-grep where useful
- confidence: medium
- limitations: `.spec-first/graph/graph-facts.json` 存在并报告 primary readiness，但它由旧 source revision 生成。当前计划只把 graph facts 当作 stale supporting evidence，不当作当前 primary evidence。

---

## 上下文与调研

### 相关代码与模式

- [src/cli/runtime-tools-index.js](src/cli/runtime-tools-index.js)：当前负责 build / inspect / write / remove `spec-first:runtime-tools` managed block。新方向是不再 build/write/inspect 全局 block，但可以暂时保留 remove 作为 legacy cleanup。
- [src/cli/commands/init.js](src/cli/commands/init.js)：`buildInitMetadataPlan()` 当前会把 runtime tools block 写入 instruction file；这是本次需要断开的主链。
- [src/cli/commands/doctor.js](src/cli/commands/doctor.js)：当前通过 `inspectRuntimeToolsIndexBlock()` 检查 runtime tools drift；新方向是不再检查。
- [src/cli/commands/clean.js](src/cli/commands/clean.js)：当前会调用 `removeManagedRuntimeToolsBlock()`；新方向是继续保留这个 legacy cleanup 行为。
- [tests/unit/runtime-tools-index.test.js](tests/unit/runtime-tools-index.test.js)：当前主要验证 runtime tools block 构建和漂移；新方向下应改为 legacy cleanup contract，或删除写入/inspect 相关断言。
- [tests/unit/init-dry-run.test.js](tests/unit/init-dry-run.test.js)：当前断言 init 后 instruction file 包含 `<!-- spec-first:runtime-tools:start -->`；需要反向改成不包含。
- [skills/spec-brainstorm/SKILL.md](skills/spec-brainstorm/SKILL.md)：Phase 1.1 已有 light repo scan / code reads 和 “Verify before claiming” 规则；本次不修改。
- [skills/spec-plan/SKILL.md](skills/spec-plan/SKILL.md)：已经有 optional bounded graph readiness 消费逻辑；本次不修改。
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md)：当前提交了旧 `spec-first:runtime-tools` block，需要删除。

### 机构知识沉淀

- [docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md](docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md)：持久改动必须落在 source-of-truth 文件，而不是 generated runtime artifacts。本次应改 `src/cli/*`、`skills/*`、`tests/*` 和 root tracked instructions，不改 `.agents/skills/*` / `.claude/*` mirrors。
- [docs/contracts/source-runtime-customization-boundary.md](docs/contracts/source-runtime-customization-boundary.md)：provider / tool facts 是 evidence，不是语义权威；本次直接把 runtime tooling 从全局 prompt 移出，符合这一边界。
- [docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md](docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md)：dual-host surfaces 不同，init / doctor / clean 测试要同时覆盖 Claude 和 Codex 行为。

### 影响面说明

由于本计划会断开 init / doctor 的 runtime-tools 全局治理链，影响面比单纯改 prose 更偏向 CLI metadata 行为，但更简单、更彻底。

后续实施前应对这些符号重新做 impact analysis：

- `buildInitMetadataPlan`：确认移除 runtime tools 写入会影响哪些 init / dry-run / drift tests。
- `checkInstructionRuntimeTools`：确认 doctor 中是否可以删除或停用。
- `removeManagedRuntimeToolsBlock`：确认 clean legacy cleanup 仍被覆盖。
- `buildRuntimeToolsBlock` / `inspectRuntimeToolsIndexBlock`：确认是保留为内部 dead helper、删除，还是降级为 legacy-only 测试对象。

---

## 关键技术决策

- **不再写全局 runtime tools block。** 根 instruction files 不承担 tool routing / evidence routing 职责。
- **保留 legacy cleanup。** 老项目和当前仓库已经有 `spec-first:runtime-tools` block，本轮应提供清理路径，而不是让遗留 block 永久残留。
- **工具能力留在局部上下文。** `supported-mcp-tools.md`、graph readiness artifacts、`spec-plan`、`spec-work`、`spec-code-review` 才是 runtime tooling 的合适消费面。
- **不在上游 skill 补防火墙。** 移除全局写入后，不再为 `spec-brainstorm` 增加额外规则，避免误伤它读取现有代码逻辑来验证事实的能力。
- **不恢复旧 CRG，也不删新 graph readiness。** 本计划只调整 prompt delivery surface，不改变 provider capabilities。

---

## 开放问题

### 规划中已解决

- 是否继续在全局写入 runtime tools guidance？不继续。直接不写入全局是更小、更稳的解法。
- 是否删除 `runtime-tools-index.js`？本轮不强制完整删除。建议先保留 legacy cleanup 所需函数，停用 init / doctor 的写入和检查链路；后续可单独做死代码清理。
- 是否删除外部 `<!-- gitnexus:start -->` block？不在本次范围。它不是 spec-first managed block；本次只移除 spec-first 自己写入的 runtime tooling 污染源。
- 是否修改 `spec-graph-bootstrap`？不需要。它仍只编译 readiness facts。

### 延后到实现阶段

- `runtime-tools-index.js` 中 build / inspect / write 函数是直接删除，还是先保留但不再从 init / doctor 调用。优先选择最小安全改动：停用调用链，保留 `removeManagedRuntimeToolsBlock()` 和必要常量，测试覆盖 legacy cleanup。
- 是否需要 README 更新。实现阶段用 `rg "runtime tools|spec-first:runtime-tools|GitNexus|code-review-graph"` 做 bounded 检查，只有 README 仍描述全局写入时才改。

---

## 实施单元

- U1. **停止 init 写入 runtime tools block**

**目标：** 让 `spec-first init --claude|--codex` 不再向 root instruction file 写入 `spec-first:runtime-tools` block。

**需求：** R1

**依赖：** 无

**文件：**
- 修改：`src/cli/commands/init.js`
- 修改：`tests/unit/init-dry-run.test.js`
- 可能修改：`tests/unit/runtime-tools-index.test.js`

**方法：**
- 从 `buildInitMetadataPlan()` 中移除 `applyManagedRuntimeToolsBlock(...)` / `buildRuntimeToolsBlock(...)` 链路。
- 删除 `init.js` 中不再使用的 runtime-tools imports。
- 更新 Claude / Codex init apply tests：从断言包含 `<!-- spec-first:runtime-tools:start -->` 改为断言不包含。
- 保留 language、bootstrap、coding-guidelines block 的顺序和断言。

**测试场景：**
- 正常路径：`spec-first init --codex` 生成的 `AGENTS.md` 不包含 `spec-first:runtime-tools` marker。
- 正常路径：`spec-first init --claude` 生成的 `CLAUDE.md` 不包含 `spec-first:runtime-tools` marker。
- 回归：`AGENTS.md` / `CLAUDE.md` 仍包含 language、bootstrap、coding-guidelines managed blocks。
- 回归：host-specific `spec-*` / `spec-*` workflow entry guidance 仍存在。

**验证：**
- `npx jest tests/unit/init-dry-run.test.js --runInBand`

---

- U2. **停止 doctor 检查 runtime tools block**

**目标：** `doctor` 不再把 runtime-tools block 缺失或漂移视为需要修复的问题。

**需求：** R3

**依赖：** U1

**文件：**
- 修改：`src/cli/commands/doctor.js`
- 修改：相关 doctor / dry-run / runtime drift tests（按实际现有测试定位）

**方法：**
- 移除或停用 `checkInstructionRuntimeTools()`。
- 删除 `inspectRuntimeToolsIndexBlock` import。
- 从 doctor check list 中移除 runtime tools index 项。
- 若 init 的 current runtime drift 检查也依赖 runtime-tools inspect，同步移除该 drift reason。

**测试场景：**
- 正常路径：instruction file 没有 `spec-first:runtime-tools` block 时，doctor 不报 runtime tools warning。
- 回归：language、bootstrap、coding-guidelines drift 检查仍正常。
- 错误路径：其他 managed block partial / drifted 仍被 doctor 捕获。

**验证：**
- 运行现有 doctor 相关 Jest / shell 测试；如果没有窄测试，至少运行 `npm run test:unit` 中覆盖 doctor 的部分。

---

- U3. **保留 legacy cleanup，移除当前 root 旧 block**

**目标：** 清理当前仓库和老项目的遗留 `spec-first:runtime-tools` block，但不再生成新 block。

**需求：** R2, R4, R5

**依赖：** U1

**文件：**
- 修改：`src/cli/runtime-tools-index.js`
- 修改：`src/cli/commands/clean.js`（仅在接口调整时）
- 修改：`tests/unit/runtime-tools-index.test.js`
- 修改：`tests/unit/clean-dry-run.test.js`
- 修改：`AGENTS.md`
- 修改：`CLAUDE.md`

**方法：**
- 将 `runtime-tools-index.js` 收窄为 legacy cleanup helper，至少保留 `RUNTIME_TOOLS_START`、`RUNTIME_TOOLS_END`、`removeManagedRuntimeToolsBlock()` 和其内部需要的 stale-section 清理逻辑。
- 如果 build / write / inspect 不再被任何生产代码调用，可以删除对应 exports 和测试；如果一次性删除风险较高，先保留未调用函数但删除 init / doctor 调用链。
- 从 `AGENTS.md` / `CLAUDE.md` 删除 `<!-- spec-first:runtime-tools:start --> ... <!-- spec-first:runtime-tools:end -->` block。
- 保留外部 `<!-- gitnexus:start -->` block。
- 保留 clean 移除 legacy runtime tools block 的行为。

**测试场景：**
- 正常路径：`removeManagedRuntimeToolsBlock()` 能移除完整 legacy block。
- 正常路径：`clean --codex --dry-run` / `clean --claude --dry-run` 会移除遗留 runtime tools block。
- 回归：clean 保留外部 `<!-- gitnexus:start -->` block。
- 回归：当前 root `AGENTS.md` / `CLAUDE.md` 不含 `spec-first:runtime-tools` marker。

**验证：**
- `npx jest tests/unit/runtime-tools-index.test.js tests/unit/clean-dry-run.test.js --runInBand`

---

- U4. **更新 changelog 和验证矩阵**

**目标：** 记录用户可见的 prompt delivery 行为变化，并用窄测试证明没有丢失执行阶段能力边界。

**需求：** R9, R10

**依赖：** U1-U3

**文件：**
- 修改：`CHANGELOG.md`
- 可能修改：README / README.zh-CN（仅当 bounded 搜索发现旧全局写入口径）

**方法：**
- `CHANGELOG.md` 使用当前 developer profile author。
- 验证命令按从窄到宽执行：
  - `npx jest tests/unit/init-dry-run.test.js tests/unit/runtime-tools-index.test.js tests/unit/doctor-runtime-tools.test.js tests/unit/clean-dry-run.test.js --runInBand`
  - `rg -n "spec-first:runtime-tools:start|spec-first:runtime-tools:end" AGENTS.md CLAUDE.md` 应无匹配。
  - `npm run typecheck`
  - 如 doctor / clean / init 影响面较大，再运行 `npm run test:unit`
- 提交前运行 `gitnexus_detect_changes()`。

**测试场景：**
- init 不写全局 runtime tools block。
- doctor 不要求 runtime tools block。
- clean 能清理 legacy runtime tools block。
- 当前 root `AGENTS.md` / `CLAUDE.md` 不含 `spec-first:runtime-tools` marker。

**验证：**
- 上述 focused tests 通过。
- `npm run typecheck` 通过。

---

## 系统影响

- **交互图：** `init` 不再写 runtime-tools block；`doctor` 不再检查它；`clean` 仍清理遗留 block。
- **错误传播：** 老项目中遗留 runtime-tools block 不会被 doctor 当作必须恢复的对象；clean 可以移除它。
- **状态生命周期风险：** 如果直接删除 `runtime-tools-index.js` 的 build / inspect 函数，必须同步删除所有 imports 和测试。更稳做法是先断开生产调用链，再收窄测试。
- **API surface parity：** Claude 和 Codex 都不再收到全局 runtime tooling block；两端行为应一致。
- **不变约束：** `supported-mcp-tools.md`、graph readiness artifacts、`spec-plan`、`spec-work`、`spec-code-review` 仍是工程执行阶段的工具入口和 evidence context。

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 执行阶段 agent 忘记 GitNexus / CRG 可用 | 在 `spec-plan`、`spec-work`、`spec-code-review` 的局部 workflow 中保留按需使用说明；工具目录仍在 `supported-mcp-tools.md` |
| 老项目遗留 runtime tools block 无法清理 | 保留 `removeManagedRuntimeToolsBlock()` 和 clean 回归测试 |
| 删除 build / inspect 造成 import 回归 | 优先分两步：先停用 init / doctor 调用链，再按测试反馈删除死代码 |
| 当前 root docs 与新 init 输出不一致 | 同步删除 `AGENTS.md` / `CLAUDE.md` 中的 managed runtime tools block，并用 init tests 锁住不再生成 |

---

## 文档与运维说明

- 这是 user-visible 行为变化：新安装或重新 `init` 后，root instruction files 不再包含 runtime tooling guidance。
- README 不一定需要改。只有当 README 当前明确说 `init` 会写入 runtime tools block 时，才同步修正。
- 不刷新 `.agents/skills/`、`.claude/`、`.codex/` runtime mirrors；如需验证运行时行为，通过 `spec-first init --claude|--codex` 在临时项目中验证。

---

## 来源与参考

- 用户请求：不要把 graph / GitNexus / CRG 写入全局 `CLAUDE.md` / `AGENTS.md`，改为执行阶段按需使用。
- 相关既有计划：[docs/plans/2026-04-28-002-feat-runtime-tool-instruction-index-plan.md](docs/plans/2026-04-28-002-feat-runtime-tool-instruction-index-plan.md)
- 项目角色基线：[docs/10-prompt/项目角色.md](docs/10-prompt/项目角色.md)
- Runtime tools source：[src/cli/runtime-tools-index.js](src/cli/runtime-tools-index.js)
- Init source：[src/cli/commands/init.js](src/cli/commands/init.js)
- Doctor source：[src/cli/commands/doctor.js](src/cli/commands/doctor.js)
- Clean source：[src/cli/commands/clean.js](src/cli/commands/clean.js)
