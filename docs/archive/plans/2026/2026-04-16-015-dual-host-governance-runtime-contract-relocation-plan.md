---
title: "Dual-Host Governance Runtime Contract Relocation Plan"
type: archive
status: superseded
created: 2026-04-16
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Dual-Host Governance Runtime Contract Relocation Plan

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 解决 Claude/Codex 双宿主治理的发布断链，把 `dual-host` 的 machine-readable governance 真源从 `docs/` 迁移到真正的 runtime asset 目录，确保源码态、tarball 安装态、CLI 运行态重新收敛到同一条闭环。

**Architecture:** 采用“human-readable contract 与 machine-readable runtime truth source 分层”的方案。`docs/contracts/dual-host-governance/README.md` 继续作为人类可读 contract；`src/cli/contracts/dual-host-governance/skills-governance.json` 与 `skills-governance.schema.json` 成为唯一 machine-readable 真源，由 `src/cli/plugin.js`、lint、unit tests、release verification 共同消费。实现原则是**迁移，不复制**，避免产生第二真源。

**Tech Stack:** Node.js CommonJS、JSON Schema、npm pack / tarball smoke verification、现有 `spec-first` CLI runtime、Jest、shell-first smoke tests

---

## 1. 问题定义

### 1.1 当前故障

当前运行时直接依赖 `docs/contracts/dual-host-governance/skills-governance.json`：

- `src/cli/plugin.js`
- `scripts/lint-skill-entrypoints.js`（通过 `plugin.js` 间接依赖）
- `tests/unit/skills-governance-contracts.test.js`

但 npm 发布白名单 `package.json -> files` 未包含 `docs/`，导致：

1. 源码 checkout 下 `init / doctor / clean / lint` 可以正常运行
2. 发布后的 tarball 不包含运行时必需的 governance JSON/schema
3. npm 安装用户运行 CLI 时，可能在 `loadSkillsGovernance()` 阶段直接失败

### 1.2 根因

根因不是单一漏配 `files`，而是职责边界错误：

1. `docs/` 本应承载人类阅读的 contract
2. machine-readable runtime truth source 却被放进了 `docs/`
3. 运行时代码对 `docs/` 建立了硬依赖

### 1.3 方案目标

本次修复必须同时满足以下三个目标：

1. 消除发布断链
2. 不制造第二真源
3. 不扩大到与本故障无关的全仓 contract 重构

---

## 2. 需求追踪

本计划直接响应以下事实与要求：

1. 双宿主治理 contract 已经成立，不能回退到“无 machine-readable 真源”的状态
2. 运行时必须继续由单一真源驱动 `buildFilteredAssetSet()`
3. 修复后必须能覆盖源码态与发布态，不接受“本地可跑、tarball 失效”的半闭环
4. 所有文件路径在本计划中必须使用 repo-relative path

与本计划直接相关的现有事实来源：

1. `docs/contracts/dual-host-governance/README.md`
2. `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改执行-backlog.md`
3. `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`
4. `src/cli/plugin.js`
5. `package.json`

---

## 3. 决策摘要

### 3.1 采用方案 B

machine-readable governance 真源迁移到：

- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/contracts/dual-host-governance/skills-governance.schema.json`

human-readable contract 保留在：

- `docs/contracts/dual-host-governance/README.md`

### 3.2 不采用方案 A

不采用“仅把 `docs/contracts/dual-host-governance/*` 加入 `package.json -> files`”的原因：

1. `docs/` 会继续承担 runtime asset 角色
2. 人类文档与程序输入边界仍然混乱
3. 后续新增 runtime contract 时容易再次误放进 `docs/`

### 3.3 真源约束

修复后必须满足：

1. machine-readable governance JSON/schema 只保留一份
2. `docs/contracts/dual-host-governance/README.md` 不再与 JSON/schema 同目录共存为“程序读取真源”
3. 运行时代码不得再直接依赖 `docs/`

---

## 4. 范围与非目标

### 4.1 本轮范围

仅包含以下工作：

1. dual-host governance machine-readable 真源迁移
2. runtime / lint / tests 路径重定向
3. human-readable contract 文案收口
4. tarball / 安装态验证闭环补齐

### 4.2 明确排除

以下内容不在本轮实施范围：

1. `docs/contracts/spec-graph-bootstrap/*` 迁移
2. 其他 `docs/contracts/*` 的批量结构重构
3. `pre-commit` 增强
4. 与 dual-host governance 无关的 release pipeline 全面清理
5. 历史计划文档、历史需求文档的全量路径替换

### 4.3 历史文档处理边界

以下文档类别按“历史记录”处理，不做全量批改：

1. `docs/plans/` 中与本次迁移无直接执行关系的旧计划
2. `docs/01-需求分析/` 中的历史方案稿
3. `docs/02-架构设计/` 中的历史分析快照

本轮只更新仍作为当前治理依据的 active docs：

1. `docs/contracts/dual-host-governance/README.md`
2. `AGENTS.md`
3. `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改执行-backlog.md`
4. `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`

---

## 5. 成功标准

本计划完成后，必须同时满足以下标准：

1. `src/cli/plugin.js` 不再从 `docs/` 读取 governance JSON/schema
2. tarball 中能看到 `src/cli/contracts/dual-host-governance/skills-governance.json`
3. tarball 中能看到 `src/cli/contracts/dual-host-governance/skills-governance.schema.json`
4. 隔离安装 tarball 后，`spec-first init --codex` 能正常运行
5. 隔离安装 tarball 后，`spec-first doctor --codex` 能正常运行
6. `skills-governance.json` 仍然覆盖 `47` 个 source skills，且 workflow / standalone / host_scope 分类不漂移
7. 文档不再把 `docs/contracts/dual-host-governance/*.json` 表述成 runtime 真源
8. 默认 `npm run test:release` 成为本问题的单一发布验证入口，不再与额外新增的 governance-focused release smoke 分叉
9. `getSkillsGovernancePath()` 明确返回 `src/cli/contracts/dual-host-governance/skills-governance.json`，且该契约有 unit test 守护
10. `src/cli/` 运行时代码不得再直接引用 `docs/contracts/dual-host-governance/skills-governance.json`，且该边界有机械化断言守护

---

## 6. 实施顺序总览

严格按以下顺序执行：

1. Implementation Unit 1：建立 runtime contract 目录并迁移 JSON/schema
2. Implementation Unit 2：重定向 runtime 读取路径与 helper API
3. Implementation Unit 3：收口 human-readable governance 文档与整改文档口径
4. Implementation Unit 4：补 tarball / 安装态 guardrail
5. Implementation Unit 5：最终回归验证与发布前确认

顺序不可打乱的原因：

1. 先迁移文件，才能安全修改 runtime path
2. runtime path 稳定后，文档才能准确回写
3. 发布验证必须建立在最终路径之上，否则仍会误测源码态

---

## 7. Implementation Unit 1：建立 runtime contract 目录并迁移 machine-readable 真源

**Goal:** 把 dual-host governance 的 machine-readable contract 从 `docs/` 挪到 runtime asset 目录，且不产生复制副本。

**Files:**
- Create: `src/cli/contracts/dual-host-governance/`
- Move: `docs/contracts/dual-host-governance/skills-governance.json` -> `src/cli/contracts/dual-host-governance/skills-governance.json`
- Move: `docs/contracts/dual-host-governance/skills-governance.schema.json` -> `src/cli/contracts/dual-host-governance/skills-governance.schema.json`

**Patterns to follow:**
- 保持 JSON 与 schema 同目录，沿用相对 `$schema: "./skills-governance.schema.json"` 模式
- machine-readable 资产与 runtime 代码同域存放，不再放在 `docs/`

**Approach:**
- 新建 `src/cli/contracts/dual-host-governance/`
- 采用“move, not copy”原则迁移 JSON/schema
- 迁移后保留文件名与结构不变，最小化下游解析影响

**Test scenarios:**
- 新目录下 JSON 能被正常读取
- JSON 中 `$schema` 仍能正确指向同目录 schema
- `schemaVersion=1`、`47` skills、`13` workflow command skill 不漂移

**Verification:**
- `node -e "const g=require('./src/cli/contracts/dual-host-governance/skills-governance.json'); console.log(g.schemaVersion, g.skills.length)"`

---

## 8. Implementation Unit 2：重定向 runtime 读取路径与 helper API

**Goal:** 让运行时、lint、tests 统一读取新的 runtime truth source 路径，同时保持 API 边界稳定。

**Files:**
- Modify: `src/cli/plugin.js`
- Modify: `tests/unit/skills-governance-contracts.test.js`
- Modify: `tests/unit/dual-host-governance-contracts.test.js`
- Modify: `scripts/lint-skill-entrypoints.js`（仅在存在路径字面量时）

**Patterns to follow:**
- 保持 `loadSkillsGovernance()`、`getSkillsGovernancePath()` 对外语义稳定
- helper API 可以继续叫原名，但返回值必须改为 runtime path

**Approach:**
- 将 `GOVERNANCE_PATH` 改为 `src/cli/contracts/dual-host-governance/skills-governance.json`
- 保留现有 `validateSkillsGovernance()`、`buildFilteredAssetSet()`、`inspectInstalledAssets()` 的行为不变
- 不重写治理算法，只修输入资产落位
- 如果 tests 直接断言旧 docs 路径，需要同步切换到新 runtime path
- `getSkillsGovernancePath()` 视为运行时 contract surface，不把新路径当成“内部实现细节”；必须通过 unit test 显式锁定返回值

**Test scenarios:**
- `loadSkillsGovernance()` 能从新路径读取并完成校验
- `getSkillsGovernancePath()` 返回值固定指向 `src/cli/contracts/dual-host-governance/skills-governance.json`
- `buildFilteredAssetSet('claude')` 输出仍为 `13 commands + 13 workflowSkills + 34 skills`
- `buildFilteredAssetSet('codex')` 输出仍为 `0 commands + 13 workflowSkills + 33 skills + skipped=1`
- `orchestrating-swarms` 仍为 Codex skipped 项
- `claude-permissions-optimizer` 仍为 dual host delivered maintenance skill

**Verification:**
- `npx jest tests/unit/skills-governance-contracts.test.js tests/unit/dual-host-governance-contracts.test.js tests/unit/managed-state-contracts.test.js --runInBand`

---

## 9. Implementation Unit 3：收口 human-readable contract 与 active governance docs

**Goal:** 让当前仍然参与治理的文档与新路径一致，同时不对历史文档做大面积无意义回写。

**Files:**
- Modify: `docs/contracts/dual-host-governance/README.md`
- Modify: `AGENTS.md`
- Modify: `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改执行-backlog.md`
- Modify: `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`

**Patterns to follow:**
- `README.md` 只描述 contract 与维护规则，不再作为 machine-readable JSON/schema 的目录真源
- `AGENTS.md` 中的治理规则必须指向新的 runtime truth source

**Approach:**
- 在 `docs/contracts/dual-host-governance/README.md` 中明确：
  - human-readable contract 仍在 `docs/contracts/dual-host-governance/README.md`
  - machine-readable runtime truth source 改为 `src/cli/contracts/dual-host-governance/skills-governance.json`
- `AGENTS.md` 中关于 host classification 的真源路径同步改为 `src/cli/contracts/dual-host-governance/skills-governance.json`
- 整改 backlog / 清单仅更新仍被用作当前审计依据的段落，不重写历史上下文章节

**Test scenarios:**
- active docs 不再把 `docs/contracts/dual-host-governance/skills-governance.json` 写成 runtime 真源
- `AGENTS.md` 的 contributor guidance 与 runtime 实际路径一致
- `README.md` 中 human-readable / machine-readable 边界清晰

**Verification:**
- `rg -n "docs/contracts/dual-host-governance/skills-governance.json|src/cli/contracts/dual-host-governance/skills-governance.json" AGENTS.md docs/contracts/dual-host-governance/README.md docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改执行-backlog.md docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`

---

## 10. Implementation Unit 4：补 tarball / 安装态 guardrail

**Goal:** 把“源码态通过”升级为“发布态也闭环”，防止同类问题再次回流。

**Files:**
- Create: `tests/smoke/release-dual-host-governance.sh`
- Create: `tests/unit/runtime-contract-boundary.test.js`
- Modify: `package.json`
- Modify: `tests/smoke/install-tarball.sh`（仅在需要复用现有逻辑时）
- Test: `tests/unit/skills-governance-contracts.test.js`

**Patterns to follow:**
- 发布验证应优先做“窄而硬”的断言，先证明 tarball 包含正确 runtime 资产，再验证 CLI 能执行关键命令
- 不把本轮验证完全绑定到现有重型 `install-tarball.sh`
- 默认 `test:release` 必须收敛为单一真相，不允许保留“旧入口继续指向不可靠脚本、另起一个 `test:release:governance` 才真正覆盖本问题”的双轨状态

**Approach:**
- 新增一个 focused release smoke：
  1. `npm pack`
  2. 断言 tarball 内包含：
     - `package/src/cli/contracts/dual-host-governance/skills-governance.json`
     - `package/src/cli/contracts/dual-host-governance/skills-governance.schema.json`
  3. 隔离安装 tarball 到临时 prefix
  4. 在临时项目目录执行：
     - `spec-first init --codex -u test --lang en`
     - `spec-first doctor --codex`
  5. 作为对称校验，再执行：
     - `spec-first init --claude -u test --lang en`
     - `spec-first doctor --claude`
- `package.json` 中的默认 `test:release` 必须在本轮完成收口，允许两种实现方式，但只能保留一个默认入口：
  1. 加固现有 `tests/smoke/install-tarball.sh`，把 dual-host governance tarball 断言直接纳入该脚本，并继续由 `test:release` 调用
  2. 新建更聚焦的 `tests/smoke/release-dual-host-governance.sh` 作为统一入口，再由它按需复用或委派 `install-tarball.sh` 的可复用逻辑
- 如果保留 `test:release:governance` 这样的辅助脚本名，它只能作为 `test:release` 的别名或局部调试入口，不能与默认 `test:release` 形成竞争性的“双真相”
- 新增机械闸门，至少覆盖两类断言：
  1. `tests/unit/skills-governance-contracts.test.js` 断言 `getSkillsGovernancePath()` 指向 `src/cli/contracts/dual-host-governance/skills-governance.json`
  2. `tests/unit/runtime-contract-boundary.test.js` 扫描 `src/cli/**/*.js`，若仍出现 `docs/contracts/dual-host-governance/skills-governance.json` 这类 docs-side machine-readable path，则直接失败

**Test scenarios:**
- `npm run test:release` 失败即可阻断发布，且失败原因能覆盖 tarball 丢失 runtime contract 的场景
- tarball 内容断言失败时，发布验证直接失败
- 隔离安装后 `init --codex` 不再报治理真源缺失
- 隔离安装后 `doctor --codex` 能读取 filtered asset set
- 同样的 tarball 在 Claude 侧 init / doctor 也能正常运行
- 若 `src/cli/` 重新引用 docs-side governance path，机械闸门直接失败

**Verification:**
- `npx jest tests/unit/skills-governance-contracts.test.js tests/unit/runtime-contract-boundary.test.js --runInBand`
- `npm run test:release`
- `npm pack --dry-run`

---

## 11. Implementation Unit 5：最终回归验证与发布前确认

**Goal:** 在代码、文档、tarball 三个层面确认本次迁移没有引入第二真源，也没有破坏双宿主行为。

**Files:**
- Verify only

**Approach:**
- 运行 unit + smoke + focused release verification
- 检查 tarball contents
- 检查 active docs 的真源口径
- 检查 `CHANGELOG.md` 与版本更新文档是否按治理要求同步
- 检查默认 `test:release` 已收敛为单一发布入口，而不是“旧入口 + 新入口”并存

**Verification commands:**
- `npx jest tests/unit/skills-governance-contracts.test.js tests/unit/dual-host-governance-contracts.test.js tests/unit/managed-state-contracts.test.js tests/unit/lint-skill-entrypoints.test.js tests/unit/runtime-contract-boundary.test.js --runInBand`
- `npm run test:smoke`
- `npm run test:release`
- `npm pack --dry-run`
- `git diff --check -- src/cli/plugin.js src/cli/contracts/dual-host-governance/skills-governance.json src/cli/contracts/dual-host-governance/skills-governance.schema.json docs/contracts/dual-host-governance/README.md AGENTS.md package.json tests/unit/skills-governance-contracts.test.js tests/unit/dual-host-governance-contracts.test.js tests/unit/runtime-contract-boundary.test.js tests/smoke/release-dual-host-governance.sh CHANGELOG.md docs/08-版本更新/README.md`

**Done definition:**
- 源码态通过
- tarball 内容通过
- 隔离安装态通过
- active docs 口径通过
- 无第二真源残留

---

## 12. 风险与控制措施

### 风险 1：迁移后形成 docs + src 双份 JSON/schema

**控制措施：**
- 明确执行“move, not copy”
- 在 `docs/contracts/dual-host-governance/README.md` 中只保留 human-readable 说明

### 风险 2：历史文档仍保留旧路径，造成阅读混乱

**控制措施：**
- 只更新 active docs
- 在当前 contract README 中明确说明“runtime truth source 已迁到 `src/cli/contracts/...`”

### 风险 3：release 验证继续只测源码态

**控制措施：**
- 新增 focused tarball / install smoke，不再只依赖本地 checkout tests

### 风险 4：默认 `test:release` 与新增 release smoke 分叉，导致团队误用错误入口

**控制措施：**
- 默认 `test:release` 在本轮必须完成收口
- 辅助脚本如 `test:release:governance` 只能作为别名或局部调试入口，不得与默认入口竞争

### 风险 5：未来运行时代码再次直接依赖 docs-side machine-readable contract

**控制措施：**
- 新增 `tests/unit/runtime-contract-boundary.test.js` 作为机械闸门
- `tests/unit/skills-governance-contracts.test.js` 显式锁定 `getSkillsGovernancePath()` 返回的新 runtime path

### 风险 6：未来新增 governance 资产再次误放进 `docs/`

**控制措施：**
- 在 `AGENTS.md` 中固化规则：运行时 machine-readable contract 必须落在已发布 runtime asset 目录

---

## 13. 变更清单建议

本轮实现预计会触达以下文件集合：

### Runtime / source of truth

- `src/cli/plugin.js`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/contracts/dual-host-governance/skills-governance.schema.json`

### Governance docs

- `docs/contracts/dual-host-governance/README.md`
- `AGENTS.md`
- `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改执行-backlog.md`
- `docs/06-待办事项/2026-04-16-Claude-Codex-双宿主-skill-整改清单.md`

### Verification

- `tests/unit/skills-governance-contracts.test.js`
- `tests/unit/dual-host-governance-contracts.test.js`
- `tests/unit/runtime-contract-boundary.test.js`
- `tests/smoke/release-dual-host-governance.sh`
- `package.json`

### Required governance updates

- `CHANGELOG.md`
- `docs/08-版本更新/README.md`

---

## 14. 最终建议

这是一次**结构边界修复**，不是简单路径热修。

实施时必须坚持三条底线：

1. 不把 machine-readable truth source 留在 `docs/`
2. 不保留双份 JSON/schema
3. 不再用源码态 smoke 代替发布态验证

只有这三条同时成立，才能把“方案基本正确”提升到“发布级闭环完成”。
