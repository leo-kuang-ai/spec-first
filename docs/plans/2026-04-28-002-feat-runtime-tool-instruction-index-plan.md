---
title: feat: Add managed runtime tool instruction index
type: feat
status: completed
date: 2026-04-28
spec_id: 2026-04-28-002-runtime-tool-instruction-index
---

# feat: Add managed runtime tool instruction index

## Overview

为 `spec-first init` 增加一个轻量的 runtime tool instruction managed block，把 `GitNexus`、`code-review-graph`、`Serena MCP`、`ast-grep` 这类已安装/推荐的代码智能工具，在 `AGENTS.md` 与 `CLAUDE.md` 中以“使用边界索引”的方式呈现。

本计划不把每个工具都复制成 GitNexus 那样的大型强规则块。目标是让 agent 在启动后知道这些工具存在、何时使用、何时不要使用，同时继续保持单一真相源：

- 机器真相源：`skills/spec-mcp-setup/mcp-tools.json`
- 人类可读工具索引：`skills/spec-mcp-setup/references/supported-mcp-tools.md`
- 动态 readiness facts：`~/.claude/spec-first/host-setup.json`、`~/.codex/spec-first/host-setup.json`、`.spec-first/config/graph-providers.json`
- agent 启动提示：新增 `spec-first:runtime-tools` managed block，只保存轻量边界说明，不保存动态状态或安装命令

---

## Problem Frame

当前 `AGENTS.md` 与 `CLAUDE.md` 已经有两种工具说明形态：

- `AGENTS.md` 有 `## MCP Tool Index`，只指向 `skills/spec-mcp-setup/references/supported-mcp-tools.md`。
- `CLAUDE.md` 在“重要开发约束”里有一条类似说明。
- 两个文件都存在外部注入的 `<!-- gitnexus:start -->` / `<!-- gitnexus:end -->` block，里面包含 GitNexus 的强制 impact / detect-changes 规则。

这导致两个问题：

- `GitNexus` 的强规则可见度很高，但 `code-review-graph`、`Serena MCP`、`ast-grep` 的使用边界没有同等清晰的启动提示。
- 如果直接为每个工具复制完整说明，会在 `AGENTS.md`、`CLAUDE.md`、`supported-mcp-tools.md`、`mcp-tools.json` 之间制造多真相源，并把动态 readiness 写死。

最佳方向是新增一个受 `spec-first init` 管理的轻量 instruction block：它只告诉 agent “这些工具分别适合什么、不适合什么、完整清单去哪里看、ready 状态如何判断”，不复制完整安装表和版本状态。

---

## Requirements Trace

- R1. `AGENTS.md` 和 `CLAUDE.md` 都应获得同语义的 runtime tool usage guidance。
- R2. 新增内容必须由 `spec-first init --codex|--claude` 写入和维护，不能只手改当前仓库根文档。
- R3. 新内容必须支持中文与英文语言策略，遵循 `--lang zh|en`。
- R4. 新内容必须使用 host-correct runtime reference path：Codex 指向 `.agents/skills/spec-mcp-setup/references/supported-mcp-tools.md`，Claude 指向 `.claude/skills/spec-mcp-setup/references/supported-mcp-tools.md`。
- R5. 不重复维护完整工具目录、安装命令、版本号、symbol count、readiness 状态或 provider query-ready 状态。
- R6. 不把 helper tools 当成 MCP server，不把 `ast-grep` 写入 `mcp-tools.json`。
- R7. 不覆盖、删除或重新生成外部 `<!-- gitnexus:start -->` block；如果该 block 存在，继续让它承担 GitNexus 强制规则。
- R8. `doctor` 应能检测 runtime tool instruction managed block 缺失、partial、drifted，并提示重新运行 `spec-first init --codex|--claude`。
- R9. `clean` 应移除 `spec-first` 管理的 runtime tool instruction block，同时保留外部 GitNexus block 和用户手写内容。
- R10. 测试必须覆盖 block 构建、幂等插入、双语言、双宿主路径、drift 检测、clean 移除和“不含安装命令/动态状态”负向契约。

---

## Scope Boundaries

- 不改变 `spec-mcp-setup` 安装流程。
- 不改变 `spec-graph-bootstrap` 的 provider bootstrap 流程。
- 不新增 MCP server、helper tool 或 graph provider。
- 不修改 `mcp-tools.json` 的工具集合。
- 不把 GitNexus 外部 block 纳入 `spec-first` 管理范围。
- 不把 `code-review-graph` 提升为和 GitNexus 相同的全局强制 gate。
- 不让 `Serena MCP` 替代 graph-level impact analysis、测试或源码真相源。
- 不让 `ast-grep` 替代简单 `rg` / `rg --files` 搜索。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` runtime/generated assets；验证 runtime 时通过 `spec-first init --claude|--codex` 重建。

---

## Context & Research

### Relevant Code and Patterns

- `src/cli/lang-policy.js`：已有 `spec-first:lang` managed block 模式，包含 build/apply/inspect 的轻量 contract。
- `src/cli/instruction-bootstrap.js`：已有 `spec-first:bootstrap` managed block，按 adapter 生成 Claude `spec-*` 与 Codex `spec-*` 入口文案。
- `src/cli/coding-guidelines.js`：已有 `spec-first:coding-guidelines` managed block，`doctor` 会检测 drift。
- `src/cli/commands/init.js`：`buildInitMetadataPlan()` 当前按 lang -> bootstrap -> coding-guidelines 顺序写入 instruction file。
- `src/cli/commands/doctor.js`：当前检查 bootstrap 与 coding-guidelines，可扩展 runtime tool instruction 检查。
- `src/cli/commands/clean.js`：当前 clean 会移除部分 managed blocks；新增 block 必须接入 cleanup。
- `src/cli/adapters/claude.js`：Claude runtime skill path 是 `.claude/skills`。
- `src/cli/adapters/codex.js`：Codex runtime skill path 是 `.agents/skills`。
- `skills/spec-mcp-setup/references/supported-mcp-tools.md`：当前人类可读工具索引，包含 MCP、graph-provider、helper tooling 与 readiness boundary。
- `skills/spec-mcp-setup/mcp-tools.json`：当前 MCP server 与 graph-provider MCP server 的唯一机器 registry。
- `AGENTS.md` / `CLAUDE.md`：当前根 instruction 文件已经有 GitNexus 外部 block；新增 managed block 必须与它共存。

### Existing Boundary Decisions

- `docs/plans/2026-04-26-001-refactor-mcp-setup-hardening-plan.md` 已明确 `supported-mcp-tools.md` 是人类可读工具索引，不应在 root docs 复制完整目录。
- `docs/plans/2026-04-27-002-refactor-agent-browser-external-tool-plan.md` 已明确 helper tool 不应进入 `mcp-tools.json`。
- `docs/10-prompt/项目角色.md` 要求保持 light contract、explicit boundaries、single source of truth；本计划遵循“脚本写确定性 block，LLM 基于边界说明做工具选择”。

### External Research

未使用外部研究。当前任务是仓库内 instruction governance 设计，已有项目源码、计划文档和角色基线足够决策。

---

## Key Technical Decisions

- **新增 `spec-first:runtime-tools` managed block，而不是扩大手写说明。** 这样 `init`、`doctor`、`clean` 能治理它，避免当前 `MCP Tool Index` 在不同 root docs 中漂移。
- **block 只写使用边界，不写安装事实。** 安装命令、工具清单和 readiness 由 `spec-mcp-setup` 的 reference/registry/ledger 负责；root instruction 只提升 agent 的工具选择质量。
- **host path 由 adapter 派生。** `buildRuntimeToolsBlock(adapter, lang)` 使用 `adapter.skillsRoot` 生成 `.claude/skills/...` 或 `.agents/skills/...`，不要硬编码单一平台路径。
- **保持 GitNexus 外部 block 独立。** `GitNexus` 现有 block 含 symbol count、relationship count 和强规则，属于外部工具注入；`spec-first` 不应接管或复制它。新 block 只写“若存在 GitNexus 管理块，遵守该块”。
- **`code-review-graph` 是 impact-context provider，不是全局强 gate。** 它适合最小上下文、impact radius、review context、related tests、detect changes；使用前应看 provider 是否 query-ready，不 ready 时先 graph-bootstrap 或降级到 bounded direct repo reads。
- **`Serena MCP` 是 symbol/LSP 辅助，不替代 graph-level 判断。** 它适合 symbol overview、symbol lookup、references、LSP 定位和精确编辑，但不负责全局影响面裁决。
- **`ast-grep` 是 helper CLI + global skill，不是 MCP server。** 简单文本/文件搜索仍优先 `rg` / `rg --files`；需要 AST 语义匹配或结构化 rewrite 时使用 `ast-grep`。
- **managed block 应插入到 spec-first managed blocks 之后、外部 GitNexus block 之前。** 如果 `<!-- gitnexus:start -->` 存在，把 runtime-tools block 放在它之前，保持 spec-first managed content 连续，同时不触碰外部 block。

---

## Proposed Managed Block Content

### 中文版本

```md
<!-- spec-first:runtime-tools:start -->
## 代码智能与运行时工具（由 spec-first 管理）

`spec-mcp-setup` 管理本项目推荐/必需的 MCP servers、graph-provider MCP servers 与 helper tooling。完整工具清单、安装命令、host-specific notes 与 readiness ledger 语义统一收口在 `.agents/skills/spec-mcp-setup/references/supported-mcp-tools.md`。

### 使用边界
- `GitNexus`：用于全局代码知识图谱、架构理解、影响分析和提交前变更检测。若本文件存在 `<!-- gitnexus:start -->` 管理块，优先遵守该块的强制规则。
- `code-review-graph`：用于最小上下文、impact radius、review context、相关测试和 graph stats。只有 graph provider 已 query-ready 时使用；未 ready 时先运行 `spec-graph-bootstrap`，或退回 bounded direct repo reads。
- `Serena MCP`：用于 symbol overview、symbol lookup、references、LSP 辅助定位和精确编辑。它是上下文/编辑辅助，不替代源码真相源、测试或 graph-level 影响分析。
- `ast-grep`：用于结构化代码搜索和安全 rewrite。简单文本/文件搜索仍优先 `rg` / `rg --files`；需要 AST 语义匹配时再使用 `ast-grep`。

### 不要做
- 不要把 helper tools 当成 MCP server 写入 `mcp-tools.json`。
- 不要在本文件复制安装命令、版本号、完整工具表或动态 ready 状态。
- 不要让多个 graph provider 规则互相覆盖；明确的强制治理块优先，其余工具作为上下文增强 provider 使用。
<!-- spec-first:runtime-tools:end -->
```

Claude 版本将同一段中的 reference path 和 graph-bootstrap entrypoint 改为 `.claude/skills/spec-mcp-setup/references/supported-mcp-tools.md` 与 `spec-graph-bootstrap`。

### 英文版本

英文版保持同等语义，使用 `Runtime Code Intelligence Tools` 标题，并保留工具名、命令、路径和协议名不翻译。

---

## Implementation Units

### U1. 新增 runtime tool instruction managed block 模块

**Files**

- Add: `src/cli/runtime-tools-index.js`
- Modify: `src/cli/commands/init.js`
- Modify: `src/cli/commands/doctor.js`
- Modify: `src/cli/commands/clean.js`

**Design**

- 提供 `buildRuntimeToolsBlock(adapterOrId, lang)`。
- 提供 `applyManagedRuntimeToolsBlock(existing, block)`。
- 提供 `inspectRuntimeToolsBlock(projectRoot, adapter)`。
- 提供 `removeManagedRuntimeToolsBlock(existing)`。
- 插入顺序为 `lang -> bootstrap -> coding-guidelines -> runtime-tools`。
- 如果已有 `<!-- gitnexus:start -->` 且 runtime-tools block 缺失，插入到 GitNexus block 前面。
- 如果 runtime-tools block 已存在，则原位替换，不移动外部 block。

**Test Scenarios**

- `tests/unit/runtime-tools-index.test.js` 覆盖空文件、无 marker 文件、已有 marker 文件、partial marker、drifted content。
- Codex 中文 block 包含 `.agents/skills/spec-mcp-setup/references/supported-mcp-tools.md` 和 `spec-graph-bootstrap`。
- Claude 中文 block 包含 `.claude/skills/spec-mcp-setup/references/supported-mcp-tools.md` 和 `spec-graph-bootstrap`。
- 英文 block 使用 English natural language，但保留 `GitNexus`、`code-review-graph`、`Serena MCP`、`ast-grep`、paths、commands。
- block 不包含 `npx -y gitnexus@latest analyze`、`uvx code-review-graph build`、`brew install`、`cargo install`、symbol count、relationship count、`query_ready=true` 等动态/安装事实。
- 文件中存在 `<!-- gitnexus:start -->` 时，新 block 插入到 GitNexus block 前，GitNexus block 内容 byte-for-byte 保留。

### U2. 接入 init / doctor / clean 治理

**Files**

- Modify: `src/cli/commands/init.js`
- Modify: `src/cli/commands/doctor.js`
- Modify: `src/cli/commands/clean.js`
- Modify: `tests/unit/instruction-bootstrap.test.js` 或新增 `tests/unit/runtime-tools-index.test.js`
- Modify: `tests/unit/clean-dry-run.test.js`

**Design**

- `buildInitMetadataPlan()` 在 coding-guidelines 后追加 runtime-tools block。
- `inspectCurrentRuntimeDrift()` 将 runtime-tools status 纳入 drift reason。
- `doctor` 输出 `AGENTS.md runtime tools index` / `CLAUDE.md runtime tools index` 检查。
- `clean` 移除 runtime-tools block，不移除 GitNexus 外部 block。

**Test Scenarios**

- `spec-first init --codex --dry-run` 的 instruction preview 包含 runtime-tools block。
- 缺失 runtime-tools block 时，`doctor` 给出 warning 和 `spec-first init --codex|--claude` 修复提示。
- drifted runtime-tools block 时，`doctor` 给出 warning。
- `clean --codex --dry-run` 移除 runtime-tools block，但保留 `<!-- gitnexus:start -->` block。

### U3. 同步当前仓库 root instruction 文件

**Files**

- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

**Design**

- 通过新增的 managed block 生成内容，替换当前手写 `MCP Tool Index` 的职责。
- 当前手写 `MCP Tool Index` 可以保留为仓库本地 source note，也可以删除并交给 managed block；实施时应优先避免重复。
- GitNexus 外部 block 保留，不修改 symbol count 或外部工具提供的内容。

**Test Scenarios**

- `AGENTS.md` 中只有一个 `spec-first:runtime-tools` block。
- `CLAUDE.md` 中只有一个 `spec-first:runtime-tools` block。
- 两个文件仍保留 `spec-first:lang`、`spec-first:bootstrap`、`spec-first:coding-guidelines`。
- 两个文件若已有 `gitnexus:start` block，内容未被 `spec-first init` 接管或删除。

### U4. 更新 reference 文档的边界说明

**Files**

- Modify: `skills/spec-mcp-setup/references/supported-mcp-tools.md`

**Design**

- 增加一个短小的 “Instruction Surface Boundary” 小节。
- 说明 root instruction 只放 runtime tool usage boundary，不放完整工具目录。
- 指向 machine truth 与 readiness ledgers，避免读者把 `AGENTS.md` / `CLAUDE.md` 当成安装状态来源。

**Test Scenarios**

- `tests/unit/browser-helper-tool-contracts.test.js` 或 `tests/unit/mcp-setup.sh` 继续验证 helper tools 不进入 `mcp-tools.json`。
- reference 文档继续包含 required MCP、graph providers、helper tooling 和 readiness boundary。

### U5. 文档与变更记录

**Files**

- Modify: `CHANGELOG.md`
- Optional Modify: `docs/08-版本更新/README.md`

**Design**

- 源码行为变更必须写 `CHANGELOG.md`。
- 如果最终实现影响用户可见 `init/doctor/clean` 行为，changelog 记录追加 `(user-visible)`。

**Test Scenarios**

- `CHANGELOG.md` 顶部有当前 developer profile 作者 `leokuang`。
- 变更摘要明确这是 init/root instruction 行为变更，而不是工具安装行为变更。

---

## Tool-By-Tool Handling

### 1. GitNexus

**处理方式：保留外部强规则块，不由 spec-first 复制或接管。**

`GitNexus` 已经在根 instruction 中有外部 block，包含 impact analysis、detect changes、index freshness 和资源说明。这类内容有动态统计和外部工具治理语义，`spec-first` 不应重写。新增 runtime-tools block 只声明：如果存在 GitNexus 管理块，优先遵守该块。

**不要做**

- 不复制 symbol count / relationship count / execution flow count。
- 不把 GitNexus CLI skill 路径复制进新的 spec-first block。
- 不在 `mcp-tools.json` 外维护第二份 GitNexus 配置。

### 2. code-review-graph

**处理方式：作为 impact-context graph provider 写入轻量使用边界。**

`code-review-graph` 的价值是最小上下文、impact radius、review context、related tests、detect changes 和 graph stats。它需要 `spec-graph-bootstrap` 构建 provider index 后才是 query-ready。root instruction 只能提醒使用条件和降级路径，不能暗示它永远可用。

**不要做**

- 不新增 “每次编辑前必须 CRG impact” 的强规则，避免和 GitNexus 外部规则冲突。
- 不把 `uvx code-review-graph build` 写进 root instruction。
- 不把 provider readiness 写死成 ready。

### 3. Serena MCP

**处理方式：作为 symbol/LSP 辅助工具写入轻量使用边界。**

`Serena MCP` 适合局部代码理解、symbol overview、symbol lookup、references 和精确编辑。它能提升定位质量，但不拥有全局影响图事实，也不能替代 tests、direct repo reads 或 graph provider 的影响分析。

**不要做**

- 不要求所有搜索都先走 Serena。
- 不让 Serena readiness 成为 workflow hard gate。
- 不把 `.serena/index-ready.json` 解释为 graph provider query-ready。

### 4. ast-grep

**处理方式：作为 helper CLI + global skill 写入轻量使用边界。**

`ast-grep` 用于结构化代码搜索和 rewrite。它不是 MCP server，不进入 `mcp-tools.json`。简单文本和文件搜索仍用 `rg` / `rg --files`；当需要 AST 语义匹配、避免 regex 误伤或做结构化 rewrite 时使用 `ast-grep`。

**不要做**

- 不把 `ast-grep` 加到 MCP registry。
- 不在 root instruction 复制安装命令。
- 不要求所有搜索都改用 `ast-grep`。

---

## Validation Plan

### Narrow Validation

- `npx jest tests/unit/runtime-tools-index.test.js --runInBand`
- `npx jest tests/unit/clean-dry-run.test.js --runInBand`
- `bash tests/unit/lang-policy.sh`

### Broader Validation

- `npm run typecheck`
- `npm run test:unit`
- `git diff --check`

### Runtime Preview Validation

- `spec-first init --codex --dry-run`
- `spec-first init --claude --dry-run`
- `spec-first doctor`

这些命令用于验证 root instruction preview、doctor drift 检查和现有 runtime drift 提示。不要手改 `.claude/`、`.codex/`、`.agents/skills/` 来伪造通过。

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| root instruction 内容重复，agent 看到两套工具说明 | Medium | Medium | 新增 managed block 后清理或收敛旧手写 `MCP Tool Index`，测试 marker 只有一份 |
| 新 block 误导用户以为所有工具已 ready | Medium | High | 明确动态状态以 `doctor`、setup ledger、provider projection 为准 |
| GitNexus 外部 block 被 init/clean 破坏 | Low | High | 插入/移除逻辑只操作 `spec-first:runtime-tools` marker，测试 byte-for-byte 保留 GitNexus block |
| `code-review-graph` 与 GitNexus 强规则冲突 | Medium | Medium | 文案把 CRG 定义为 context provider，不新增强制 always-run rule |
| host path 写错导致普通项目无法找到 reference | Medium | Medium | 路径从 adapter 派生，双宿主测试覆盖 |
| helper tool 被误加入 `mcp-tools.json` | Low | High | 继续保留负向 contract：`ast-grep` 不在 `mcp-tools.json` |

---

## Alternatives Considered

- **直接编辑 `AGENTS.md` / `CLAUDE.md` 手写说明。** 拒绝。这样无法被 `init/doctor/clean` 治理，会继续制造 drift。
- **为每个工具新增 GitNexus 式大块。** 拒绝。`code-review-graph`、`Serena MCP`、`ast-grep` 的职责不同，统一复制大块会产生强编排和多真相源。
- **把完整工具表复制到 root instruction。** 拒绝。完整工具表已经在 `supported-mcp-tools.md`，机器事实在 `mcp-tools.json`。
- **只更新 `supported-mcp-tools.md`，不碰 root instruction。** 不足。agent 启动时不一定主动读取 reference；根 instruction 需要一个轻量索引提高工具选择质量。
- **把 GitNexus block 纳入 spec-first 管理。** 拒绝。它是外部工具注入，包含动态 stats 和外部治理规则，`spec-first` 不应接管。

---

## Success Signals

- `AGENTS.md` / `CLAUDE.md` 有一致的 runtime tool usage guidance。
- `doctor` 能发现 runtime tool managed block 缺失或漂移。
- `clean` 能移除 runtime tool managed block 且不破坏 GitNexus 外部 block。
- `supported-mcp-tools.md` 仍是完整人类可读工具索引。
- `mcp-tools.json` 仍是 MCP / graph-provider MCP server 机器真相源。
- `ast-grep` 仍只作为 helper CLI + global skill，不进入 MCP registry。
- agent 能清楚区分：GitNexus 强规则、code-review-graph context provider、Serena LSP 辅助、ast-grep 结构化搜索。
