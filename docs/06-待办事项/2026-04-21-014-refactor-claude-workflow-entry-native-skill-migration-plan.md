---
title: Claude Workflow Entry Native Skill Migration Plan
created: 2026-04-21
updated: 2026-05-29
status: done
resolution: superseded-by-render-merge
owner: engineering
origin: 用户观察到 spec-graph-bootstrap 在文件存在的情况下仍报"SKILL.md 不存在"，根因定位为 command shim 两跳架构的 path resolution 不稳定
scope: 把 Claude 侧 12 个 workflow 入口从 .claude/commands/spec/*.md + .claude/spec-first/workflows/ 二跳架构，迁移为 .claude/skills/spec-*/SKILL.md native project skill 直调
---

# Claude Workflow Entry Native Skill Migration Plan

> **状态：已完成（P0 已解决，但由另一套方案解决，本计划步骤未执行）。**
> 复核日期 2026-05-29，证据见下方「实际解决方式」。归档保留，作为根因与决策记录，不再执行 Step 3-14。

## 0. 实际解决方式（2026-05-29 复核）

**结论：本计划要解决的 P0「入口执行不可靠」已不存在，但不是通过本计划的 native skill 迁移解决的，而是通过 `1.5.8` 引入的 init-time render-merge 方案解决。**

### 0.1 根因如何被消除

计划 §1.2 描述的「两跳 prose 架构」（command 文件作为 shim，发出 prose instruction 让 Claude 再去 Read `.claude/spec-first/workflows/.../SKILL.md`，依赖相对路径解析）已被替换。

现行机制（`src/cli/adapters/claude.js` 的 `renderCommandContent`，引入于 commit `b634c4d7` / `1.5.8`）：

- 命令模板（`templates/claude/commands/spec/*.md`）现在只承载 frontmatter + 一句生成说明。
- `spec-first init` 时，把模板 frontmatter 与 `skills/spec-*/SKILL.md` 的 body **合并渲染**，生成**自包含**的 runtime 命令文件。
- runtime 加载的就是这个完整文件（实测 `.claude/commands/spec/plan.md` 为 766 行完整 workflow 内容），Claude 不再需要去 Read 第二个文件，伪根因报错消失。

### 0.2 复核证据

| 检查 | 结果 |
|---|---|
| `grep "SKILL.md 文件不存在" .claude/` | 空 —— 伪根因报错文案在 runtime 中已不存在 |
| `grep "spec-first/workflows.*SKILL.md\|read.*SKILL.md" .claude/commands/spec/` | 空 —— runtime 命令无二跳 prose 引用 |
| `.claude/commands/spec/plan.md` 行数 | 766 行（自包含完整内容） |
| Step 1（SKILL.md `name` 改 `spec-*`） | 已由其它演化完成（实测全部为 `spec-brainstorm` 等规范名） |

### 0.3 未采纳的部分

计划 §2.2 的「调用名从 `spec-*`（colon namespace）统一为 `/spec-*`（hyphen）」**未执行**，且不再作为本计划的一部分推进：

- 当前 runtime 命令名仍为 `spec-plan` 等 colon namespace 形式，自洽可用，不是 bug。
- 这是命名偏好 + breaking change（见 §7），与已解决的 P0 入口可靠性无关。
- 如需推进命名统一，应作为独立小计划重新立项，不复用本文档基于「两跳架构」错误前提的 Step 3-14。

因此 Step 3-14（删 command 层、删模板、迁移 governance、改调用名）**均不执行**——它们会破坏现行 render-merge 架构（command 层现在承载合并后的完整入口内容，删除入口即破坏可用性）。

---

> 以下为 2026-04-21 原始计划，保留作为历史根因分析与决策记录。其架构前提（两跳 prose shim）已不成立。

## 1. 问题框定

### 1.1 表现症状

用户在正确执行 `spec-first init --claude` 之后，`.claude/spec-first/workflows/spec-graph-bootstrap/SKILL.md` 确实存在，但执行 `spec-graph-bootstrap` 仍然被提示：

> `.claude/spec-first/workflows/spec-graph-bootstrap/SKILL.md 文件不存在，请先执行 spec-first init --claude`

这是伪根因报错——文件存在，但 Claude 报告不存在。

### 1.2 根因

当前 Claude 侧 workflow 入口是两跳架构：

```
用户执行 spec-graph-bootstrap
  → Claude 读 .claude/commands/spec/graph-bootstrap.md   ← 命令存在 ✓
  → 命令内容是 prose instruction：
    "read .claude/spec-first/workflows/spec-graph-bootstrap/SKILL.md"
  → Claude 尝试用相对路径执行 Read 工具
  → path resolution 失败，报"文件不存在"                 ← 伪根因
```

命令文件是一个 shim，它对 Claude 发出 prose instruction，要求 Claude 再去读另一个文件。这条链路依赖 Claude 可靠地将 prose 中的相对路径解析为正确的绝对路径，而这一步在实践中不稳定。

对比 native project skill 的加载方式：Claude Code runtime 在用户调用 `/spec-plan` 时，直接从 `.claude/skills/spec-plan/SKILL.md` 加载内容注入 context，不经过 prose instruction，路径解析由 runtime 保证。

### 1.3 两类问题的区分

| 问题类型 | 描述 | 优先级 |
|---|---|---|
| **入口执行不可靠**（本计划）| Claude 根本进不去 workflow，slash command 提示找不到 SKILL.md | P0 |
| bootstrap 产物错误 | 跑进去以后 child fan-out、workspace-registry schema 等产物不对 | P1 |

入口不稳定时，后续所有 bootstrap 修复都无法稳定验证。本计划优先解决入口问题。

---

## 2. 目标

1. **消除两跳**：workflow skills 直接以 native project skill 形式安装，由 Claude Code runtime 确定性加载。
2. **统一命名**：Claude 侧入口从 `spec-*`（colon namespace）统一为 `/spec-*`（hyphen，native skill 调用形式）。
3. **清理遗留**：`clean --claude` 自动清理旧 `.claude/commands/spec/` 和 `.claude/spec-first/workflows/` 目录。
4. **不破坏 Codex 侧**：Codex adapter 已是 `workflowsRoot === skillsRoot`，本次改动对 Codex 零影响。

---

## 3. 非目标

- 不修改 workflow skill 的内容和行为逻辑
- 不修改 bootstrap 产物的生成逻辑
- 不追改 `docs/plans/`、`docs/brainstorms/` 等历史文档中的 `spec-*` 引用
- 不改变 Codex 侧任何入口

---

## 4. 改动面

| 类别 | 数量 |
|---|---|
| SKILL.md `name` 字段更新 | 11 个 |
| skills/ 内 `spec-*` 引用替换 | 75 处 |
| 源码文件修改 | 7 个 |
| 命令模板文件删除 | 12 个 |
| 测试断言更新 | 35+ 处，23+ 个文件 |

---

## 5. 详细实施步骤

### Step 1：更新 11 个 SKILL.md `name` 字段

最低风险改动，纯 frontmatter 元数据。

| 文件 | 旧 `name` | 新 `name` |
|---|---|---|
| `skills/spec-brainstorm/SKILL.md` | `brainstorm-workflow` | `spec-brainstorm` |
| `skills/spec-ideate/SKILL.md` | `ideate-workflow` | `spec-ideate` |
| `skills/spec-plan/SKILL.md` | `plan-workflow` | `spec-plan` |
| `skills/spec-work/SKILL.md` | `work-workflow` | `spec-work` |
| `skills/spec-debug/SKILL.md` | `debug-workflow` | `spec-debug` |
| `skills/spec-code-review/SKILL.md` | `review-workflow` | `spec-code-review` |
| `skills/spec-compound/SKILL.md` | `compound-workflow` | `spec-compound` |
| `skills/spec-sessions/SKILL.md` | `sessions-workflow` | `spec-sessions` |
| `skills/spec-update/SKILL.md` | `update-workflow` | `spec-update` |
| `skills/spec-compound-refresh/SKILL.md` | `compound-refresh-workflow` | `spec-compound-refresh` |
| `skills/spec-work-beta/SKILL.md` | `work-beta-workflow` | `spec-work-beta` |

已正确的（不动）：`spec-graph-bootstrap`、`spec-mcp-setup`、`spec-optimize`、`spec-slack-research`。

另需确认 `skills/setup/SKILL.md` 的 `name` 字段，决定是保留 `/setup` 还是改为 `/spec-setup`。

> **执行前验证**：`spec-work-beta` 不在 `skills-governance.json` 的 `workflow_command` 列表中，说明它已是 `standalone_skill`；Step 12 的模板删除列表也没有 `work-beta.md`。执行 Step 1 前先确认 `spec-work-beta` 的 `entry_surface`——若已是 `standalone_skill`，则其 `name` 字段改动仅影响调用名，不涉及 governance 迁移，可安全执行。

**验证**：逐个检查 `name:` 字段已更新，无拼写错误。

---

### Step 2：skills/ 内 `spec-*` 引用全局替换

范围限定为 `skills/` 目录，不改 `docs/` 历史文档。

**替换映射**：

```
spec-brainstorm      →  /spec-brainstorm
spec-ideate          →  /spec-ideate
spec-plan            →  /spec-plan
spec-work\b          →  /spec-work
spec-work-beta       →  /spec-work-beta
spec-debug           →  /spec-debug
spec-code-review          →  /spec-code-review
spec-compound\b      →  /spec-compound
spec-sessions        →  /spec-sessions
spec-update          →  /spec-update
spec-setup           →  /spec-setup  ← 仅在 Step 1 决定将 setup 改名为 spec-setup 时执行；若保留 /setup 则跳过此行
spec-mcp-setup       →  /spec-mcp-setup
spec-graph-bootstrap    →  /spec-graph-bootstrap
spec-compound-refresh  →  /spec-compound-refresh
```

**重点文件**（引用最集中）：

- `skills/using-spec-first/SKILL.md`（13 处，治理合同，必须改正确）
- `skills/lfg/SKILL.md`（pipeline 串联 `spec-plan` → `spec-work` → `spec-code-review`）
- `skills/spec-brainstorm/references/`（多处 handoff 引用）
- `skills/git-worktree/SKILL.md`（引用 `spec-code-review`、`spec-work`）
- `skills/spec-debug/SKILL.md`（引用 `spec-brainstorm`、`spec-compound`）

`using-spec-first` 还有两条治理语义需同步更新：

```markdown
# 旧
- Claude workflow entrypoints use `spec-*`
- Do **not** write Claude workflow entrypoints as `spec-*`.

# 新
- Claude workflow entrypoints use `/spec-*`（native project skill）
- Do **not** write Claude workflow entrypoints as `spec-*`.
```

**验证**：`grep -r "spec-*" skills/` 输出为空。

---

### Step 3：`plugin.json` 移除 `commands` 数组

```json
// 修改前
{
  "directories": {
    "commands": "templates/claude/commands/spec",
    "skills": "skills",
    "agents": "agents"
  },
  "commands": [ ...12 条... ]
}

// 修改后
{
  "directories": {
    "skills": "skills",
    "agents": "agents"
  }
}
```

**验证**：`node -e "require('./.claude-plugin/plugin.json')"` 无报错；`commands` 字段不再存在。

---

### Step 3b：`src/cli/contracts/dual-host-governance/skills-governance.json` 迁移

> **必须与 Step 3 同批执行**：`plugin.js` 中 `validateSkillsGovernance()` 在加载时校验每条 `entry_surface: 'workflow_command'` 的记录必须在 `manifest.commands` 中有对应项。Step 3 删除 `commands` 数组后，若此步骤未同步执行，任何 `init`/`doctor`/`clean` 调用都将硬崩溃。

将以下 12 条 governance 记录从 `workflow_command` 改为 `standalone_skill`：

```
setup, spec-brainstorm, spec-compound, spec-debug, spec-graph-bootstrap,
spec-ideate, spec-mcp-setup, spec-plan, spec-code-review, spec-sessions,
spec-update, spec-work
```

每条记录改动：
```json
// 修改前
{
  "entry_surface": "workflow_command",
  "command_name": "plan",
  "host_delivery": { "claude": "command", "codex": "skill" }
}

// 修改后
{
  "entry_surface": "standalone_skill",
  "command_name": null,
  "host_delivery": { "claude": "skill", "codex": "skill" }
}
```

同步更新 `plugin.js`：

1. **`validateManifest()`**：删除 `Array.isArray(manifest.commands)` 断言（line 94）；从 `['commands', 'skills', 'agents']` 循环中移除 `'commands'`（line 102）。**必须与 Step 3 plugin.json 改动同批执行**，否则 CLI 在 validateManifest 层即崩溃，不会到达 validateSkillsGovernance。
2. **`validateSkillsGovernance()`**：删除 `workflow_command` 校验分支（lines 205–218）及其逆向校验（standalone_skill 记录不得有 manifest command 对应项的检查）。
3. **`buildFilteredAssetSet()`**：删除 `entry_surface === 'workflow_command'` 分支（不保留，不做 no-op）；同时从 `ENTRY_SURFACES` 集合删除 `'workflow_command'`，从 `HOST_DELIVERIES` 集合删除 `'command'`。

同步更新 `skills-governance-contracts.test.js`：
- 删除 `manifest.commands.map(c => c.skill)` 的 `workflowSkills` 推导逻辑
- 删除 `claudeAssets.commands.toHaveLength(manifest.commands.length)` 断言
- 改为断言所有 12 个前 workflow_command 技能的 `host_delivery.claude === 'skill'`

**验证**：`node -e "const p = require('./src/cli/plugin.js'); p.buildFilteredAssetSet('claude')"` 无报错。

---

### Step 4：`src/cli/plugin.js` 移除 command 基础设施

**删除函数**（约 80 行）：
- `syncCommands()`
- `planCommandsSync()`
- `listBundledCommands()`
- `inspectCommands()`

**修改 `buildFilteredAssetSet()`**：
- 移除 `commands` 字段
- `workflowSkills` 路由目标从 `workflowsRoot` 改为 `skillsRoot`

**修改 `planBundledAssetSync()` / `syncBundledAssets()`**：
- 移除 `adapter.hasCommands ? planCommandsSync() : []` 分支
- 返回结构中移除 `commands` 字段
- 返回结构中移除 `workflowSkills` 字段（合并进 `skills`）

**修改 `planSkillsSync()` / `syncSkills()`**：
- `workflowSkills` 不再写入 `workflowsRoot`，直接并入 `skillsRoot` 的 skill 安装列表

**验证**：`grep -n "commandRoot\|syncCommands\|planCommandsSync\|listBundledCommands" src/cli/plugin.js` 无输出。

---

### Step 5：`src/cli/adapters/claude.js`

```js
// 删除
get commandRoot() { return '.claude/commands/spec'; }
get workflowsRoot() { return '.claude/spec-first/workflows'; }
```

`inspectRuntimeFiles()` 中：
- 删除 `workflowFiles` 读取逻辑
- 删除 `workflowFiles` 并入 `skillFiles` 的合并
- canonical name 检查和 Task agent 引用检查只扫 `skillsRoot`

**验证**：`grep -n "commandRoot\|workflowsRoot\|workflowFiles" src/cli/adapters/claude.js` 无输出。

---

### Step 6：`src/cli/adapters/base.js`

```js
// 删除
get commandRoot() { throw new Error('Not implemented: commandRoot'); }
get hasCommands() { ... }
get workflowsRoot() { throw new Error('Not implemented: workflowsRoot'); }
```

**验证**：`grep -n "commandRoot\|hasCommands\|workflowsRoot" src/cli/adapters/base.js` 无输出。

---

### Step 7：`src/cli/adapters/codex.js`

Codex adapter 已有 `workflowsRoot === skillsRoot`，改动量极小：
- 删除 `commandRoot` 实现（Codex 无 command 层）
- 删除 `hasCommands`（Codex 本来就返回 false）
- 确认 `workflowsRoot` 引用已清理

**验证**：smoke test Codex 侧资产安装路径不变。

---

### Step 8：`src/cli/commands/init.js`

- 删除 `commandDir` 变量及所有使用点
- 删除 `filteredAssetSet.commands` 相关逻辑
- 删除 `planCommandNamespacePrune()` 调用
- 删除 dry-run preview 中 commands 部分的输出
- 删除 managed state 写入中的 `commands` 字段
- 更新 restart 提示中的命令名：`spec-*` → `/spec-*`

**验证**：`node bin/spec-first.js init --claude --dry-run` 输出无 commands 相关行；state.json 无 `commands` 字段。

---

### Step 9：`src/cli/commands/doctor.js`

- 删除 `inspectCommands()` 调用及其报告输出
- 删除 `commands` missing/extra 的检查逻辑
- canonical name 检查（`workflowFiles`）改为只扫 `skillsRoot`

**验证**：`node bin/spec-first.js doctor --json` 无 commands 相关字段输出。

---

### Step 10：`src/cli/state.js`

**managed state schema 变更**：

```js
// validateManagedStateShape() 中移除 commands 字段断言

// readManagedState() 中：
// 读取旧 state 时如果存在 commands 字段，静默忽略（向后兼容，不报错）

// writeManagedState() 中：不再写入 commands 字段
```

**同步处理 `workflowSkills` 字段**：

`state.js` 中以下位置依赖 `adapter.workflowsRoot`（Step 4-5 已删除），需全部处理：

- `planManagedAssetRemoval()`（line 259–268）：`state.workflowSkills` 清理循环调用 `adapter.workflowsRoot`
- `planHardResetManagedAssets()`（line 322–351）：独立访问 `adapter.workflowsRoot`（在 `adapter.workflowsRoot !== adapter.skillsRoot` 条件下），init 重新初始化和 `clean --reset` 均会触发此路径

**处理方式（选定方案）**：

```js
// 1. readManagedState()：仍读取旧 workflowSkills 字段（不报错，向后兼容）
// 2. writeManagedState()：不再写入 workflowSkills
// 3. planManagedAssetRemoval() 的 workflowSkills 循环：
//    改为检查 adapter.workflowsRoot !== undefined 而非目录是否存在
//    （adapter 属性已删除 → 条件为 false → 循环跳过，不崩溃）
// 4. planHardResetManagedAssets()：
//    删除 'if (adapter.workflowsRoot !== adapter.skillsRoot)' 分支整体
//    （workflowsRoot 不再存在，分支恒为 false，直接删除）
// 5. REQUIRED_MANAGED_STATE_ARRAY_FIELDS：移除 workflowSkills
```

**验证**：
- 旧 state.json（含 `commands`/`workflowSkills` 字段）被读取时无报错
- 新写入的 state.json 无 `commands`/`workflowSkills` 字段
- `planManagedAssetRemoval()` 在 `adapter.workflowsRoot` 属性不存在时不崩溃
- `planHardResetManagedAssets()` 不引用已删除的 `adapter.workflowsRoot`

---

### Step 11：`src/cli/commands/clean.js` 新增遗留清理

clean 执行时追加对旧安装的清理：

1. 删除 `.claude/commands/spec/`（旧 command 模板目录）
2. 删除 `.claude/spec-first/workflows/`（旧 workflow 副本目录）
3. state.json 中移除 `commands` 字段（如存在）

**实现位置**：在 `ClaudeAdapter.planRuntimeFilesRemoval()` 中追加两条 `remove_dir` 操作（此方法已由 `clean.js` 调用，干跑预览也会自动覆盖）：

```js
// claude.js planRuntimeFilesRemoval()
{
  kind: 'remove_dir',
  path: '.claude/commands/spec',
  reason: 'legacy_command_shim_cleanup',
},
{
  kind: 'remove_dir',
  path: '.claude/spec-first/workflows',
  reason: 'legacy_workflow_copy_cleanup',
},
```

dry-run 模式下应在 preview 中显示这三个操作。

**验证**：`node bin/spec-first.js clean --claude --dry-run` 输出包含上述三项删除预览。

---

### Step 12：删除 12 个命令模板文件

```
templates/claude/commands/spec/brainstorm.md
templates/claude/commands/spec/compound.md
templates/claude/commands/spec/debug.md
templates/claude/commands/spec/graph-bootstrap.md
templates/claude/commands/spec/ideate.md
templates/claude/commands/spec/mcp-setup.md
templates/claude/commands/spec/plan.md
templates/claude/commands/spec/code-review.md
templates/claude/commands/spec/sessions.md
templates/claude/commands/spec/setup.md
templates/claude/commands/spec/update.md
templates/claude/commands/spec/work.md
```

随之删除整个 `templates/claude/commands/` 目录。

**验证**：`ls templates/claude/commands/` 报错（目录不存在）。

---

### Step 13：更新测试

| 测试文件 | 改动性质 |
|---|---|
| `tests/unit/init-dry-run.test.js` | 移除 commands 在 dry-run preview 中的断言 |
| `tests/unit/managed-state-contracts.test.js` | 移除 `commands` 字段 schema 断言 |
| `tests/unit/runtime-asset-integrity.test.js` | 移除 commands 目录存在性断言 |
| `tests/unit/runtime-plan-contracts.test.js` | 移除 commandPlan 相关断言 |
| `tests/unit/clean-dry-run.test.js` | 新增对遗留 commands/workflows dir 清理的断言 |
| `tests/unit/skills-governance-contracts.test.js` | 更新命令名 `spec-*` → `/spec-*` |
| `tests/unit/using-spec-first-runtime-contracts.test.js` | 更新所有命令名引用 |
| `tests/unit/dual-host-governance-contracts.test.js` | 同上 |
| `tests/unit/spec-sessions-contracts.test.js` | 更新命令名引用 |
| `tests/unit/spec-debug-contracts.test.js` | 更新命令名引用 |
| `tests/unit/spec-update-contracts.test.js` | 更新命令名引用 |
| `tests/unit/agent-support-contracts.test.js` | 按需更新 |
| `tests/unit/setup.sh` | 移除 commands 目录验证 |
| `tests/unit/mcp-setup.sh` | 更新命令名引用 |
| `tests/smoke/cli.sh` | 移除 commands 目录生成验证，改为 skills 目录验证 |
| `tests/smoke/release-dual-host-governance.sh` | 更新命令名引用 |

> **执行前先获取完整列表**：`grep -rln 'spec-*[a-z]' tests/` 获取实际受影响文件（至少 23 个，比原列表多 7+）。同时检查 `docs/10-prompt/` 目录——该目录存放 skills/ 的 prompt mirror 文件，与 skills/ 源文件要求 byte-equal 同步；Step 2 改动 skills/ 后，`docs/10-prompt/` 中对应的 mirror 文件也需同步替换 `spec-*` 引用（`grep -rln 'spec-*[a-z]' docs/10-prompt/` 可获取列表）。已知遗漏的文件包括：`feature-video-contracts.test.js`、`test-browser-contracts.test.js`、`lfg-contracts.test.js`、`lint-skill-entrypoints.test.js`、`spec-brainstorm-contracts.test.js`、`spec-compound-contracts.test.js`、`git-worktree-contracts.test.js`。

> **skills-governance-contracts.test.js 需完整重写**（不只是改名）：现有测试从 `manifest.commands.map(c => c.skill)` 推导 `workflowSkills`，Step 3b 后 `manifest.commands` 消失，测试需要改为验证 governance 记录的 `host_delivery.claude === 'skill'`。

| `tests/unit/native-skill-entry-contracts.test.js` | **新增**：验证 11 个 SKILL.md `name` 字段符合 `spec-*` 格式；验证 `skills/` 内无残留 `spec-*` 引用；验证 plugin.json 无 `commands` 字段 |

---

### Step 14：更新 CLAUDE.md

更新范围：**不只是一行治理规则**，需审查全文所有 `spec-*` 引用和命令模板路径引用。

已知需更新的位置：
1. 治理规则行：`Claude workflow 入口使用 spec-*` → `/spec-*`
2. 第 62 行资产结构说明：`入口命令 spec-sessions` → `/spec-sessions`；`templates/claude/commands/spec/sessions.md` → 删除（文件已不存在）
3. 全文搜索 `spec-*` 并逐一确认替换

```markdown
# 旧（治理规则）
- Claude workflow 入口使用 `spec-*`

# 新
- Claude workflow 入口使用 `/spec-*`（native project skill 直调）
- `.claude/commands/spec/` 已废弃，`spec-first clean --claude` 可清理旧残留
```

**验证**：`grep "spec-*" CLAUDE.md` 无输出。

---

## 6. 执行顺序

```
Step 1   SKILL.md name 字段      ← 可单独验证，最安全（先确认 spec-work-beta 状态）
Step 2   skills/ 引用替换         ← 依赖 Step 1 完成
Step 3   plugin.json             ← 必须与 Step 3b 同批
Step 3b  skills-governance.json  ← 必须与 Step 3 同批，否则启动即崩溃
Step 4   plugin.js               ← 依赖 Step 3/3b
Step 5   claude.js adapter
Step 6   base.js adapter
Step 7   codex.js adapter
Step 8   init.js                 ← 依赖 Step 4-6
Step 9   doctor.js               ← 依赖 Step 5
Step 10  state.js                ← 独立
Step 11  clean.js                ← 依赖 Step 5（ClaudeAdapter）、Step 8-10
Step 12  删除模板文件              ← 依赖 Step 3/3b
Step 13  测试更新                 ← 依赖 Step 1-12 全部（先跑 grep 获取完整文件列表）
Step 14  CLAUDE.md               ← 最后
```

**重要约束**：Step 3 和 Step 3b 必须在同一 commit 中执行，中间状态会导致 CLI 完全不可用。

Step 1-2 可先合入验证命名行为，Step 3-14 建议单 PR 一次性完成。

---

## 7. 破坏性变更

| 变更 | 影响 | 缓解 |
|---|---|---|
| 调用名 `spec-plan` → `/spec-plan` | 所有已使用命令的用户 | release notes 明确列出，CLAUDE.md 同步更新 |
| state.json 移除 `commands` 字段 | 旧安装静默兼容 | readManagedState 忽略旧字段，不报错 |
| `.claude/commands/spec/` 消失 | 旧安装在 clean 后清理 | clean 的 dry-run 预览会提前告知用户 |
| `.claude/spec-first/workflows/` 消失 | 同上 | 同上 |

---

## 8. 验收标准

1. 在全新项目执行 `spec-first init --claude`，然后执行 `/spec-graph-bootstrap`，workflow 成功进入，不报"SKILL.md 不存在"。
2. `ls .claude/commands/` 目录不存在（或不含 `spec/` 子目录）。
3. `ls .claude/spec-first/workflows/` 目录不存在。
4. `ls .claude/skills/` 包含全部 15 个 `spec-*` skill 目录。
5. `grep -r "spec-*" .claude/skills/` 无输出。
6. `npm test` 全部通过。
7. 旧安装（含 `commands` 字段的 state.json）执行 `spec-first doctor` 不报错，执行 `spec-first clean --claude` 正常清理遗留目录。

---

## 9. 版本影响

建议 minor bump：`1.5.x → 1.6.0`，在 changelog 中明确标注调用名变更为 breaking change。
