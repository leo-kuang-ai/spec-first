---
title: feat: hard-cut upgrade spec-compound with parity-first execution
type: feature
status: superseded
date: 2026-04-14
origin: docs/业界分析/9.spec-first-vs-compound-engineering-plugin-全量同步审计-2026-04-14.md
---

# feat: hard-cut upgrade spec-compound with parity-first execution

## 1. 目标

本计划的目标是对 `spec-compound` 相关子系统做一次 **hard cut 一致性升级**，但执行策略必须服从一个更高优先级：

**先确保源项目功能平移不遗漏，再做本地优化升级。**

因此本计划不是“边平移边抽象”，而是分成两个阶段：

1. **Phase A：功能平移优先**
   - 将 `ce-compound`
   - `ce-compound-refresh`
   - `ce-sessions`
   - `agents/research/session-historian.md`
   - 以及相关 support files、session scripts、安装接线、测试接线
   完整迁入 `spec-first`
2. **Phase B：优化收敛优先**
   - 在 Phase A 已完成且验证通过后，再评估共享合同源、历史快照同步、README / 手册收口等优化项

## 2. 总体判断

当前 `spec-compound` 与上游的差异，已经不是命名迁移，而是结构性收缩：

1. `skills/spec-compound/SKILL.md` 从上游的显式 mode 选择、track-aware orchestration、可选 session enrichment，收缩成默认 full-mode + 无 session + bug-style 单轨输出
2. `skills/spec-compound/references/schema.yaml` 把 `symptoms / root_cause / resolution_type` 提升成所有 `problem_type` 的必填字段，破坏了上游 knowledge track 语义
3. `skills/spec-compound/assets/resolution-template.md` 删除了 knowledge template
4. `skills/spec-compound-refresh/` 维持了一套已经漂移的本地合同
5. 当前仓库缺失 `skills/spec-sessions/`、`agents/research/session-historian.md` 与对应 session-history scripts
6. 当前仓库安装入口 `.claude-plugin/plugin.json` 并没有 `sessions` 命令声明，这意味着即使新增了文件，也不会进入运行时

因此，真正的任务边界不是“改一个 skill”，而是要同时处理：

- 主 workflow
- refresh workflow
- session workflow
- session agent 与脚本
- docs/solutions 数据
- consumers
- installer / runtime wiring
- smoke / unit tests

## 3. 关键执行原则

### 原则 1：功能平移优先于本地重构

第一阶段的首要目标是 **把上游功能完整迁过来**。因此在 Phase A：

- `spec-compound` 保留自己的 support files
- `spec-compound-refresh` 也保留自己的 support files
- 不做跨 skill 共享 contract source

原因很直接：

1. 保留与上游的逐文件对照能力
2. 降低“功能遗漏”和“本地抽象错误”混在一起的风险
3. 方便后续继续追上游

### 原则 2：运行时接线先于文档整理

如果 `spec-sessions` 没进入 `.claude-plugin/plugin.json`，它就不是一个真实功能，只是仓库里的静态文件。

因此必须先补：

- manifest
- command template
- installer sync
- doctor / smoke / clean 路径

这里需要特别明确一条运行时事实：

- `.claude-plugin/plugin.json` 是 **Claude 与 Codex 共用的 commands source-of-truth**
- `templates/claude/commands/spec/*.md` 虽然目录名叫 `claude`，但实际上会通过 adapter 同时生成到 `.claude/commands/spec/` 与 `.codex/commands/spec/`
- `init` / `doctor` / `clean` 的绝大多数命令感知并不是手写 `sessions` 特判，而是基于 manifest 和运行态 state 自动推导

这意味着 Phase A 的正确动作不是“到处补 if sessions”，而是：

1. 先补 manifest 与 template
2. 再用 smoke / doctor 断言验证运行态是否自动纳入
3. 只有在自动链路不成立时，才修改 `init.js` / `doctor.js` / `clean.js`

### 原则 3：producer 先于 consumer，consumer 先于 data migration

正确顺序必须是：

1. `spec-compound`
2. `spec-compound-refresh`
3. `learnings-researcher` 与 tests
4. `docs/solutions/` 现有文档迁移

不能反过来。否则会出现中间态：数据结构已经切了，但 workflow 和 consumer 还没切过去。

### 原则 4：`docs/10-prompt` 不是 Phase A 阻塞项

仓库已经明确：

- `docs/10-prompt/` 不是运行时 source-of-truth
- 常规功能开发不要求同步修改

因此 Phase A 只围绕：

- `skills/`
- `agents/`
- `templates/claude/commands/spec/`
- `.claude-plugin/plugin.json`
- `tests/`
- `docs/solutions/`

展开。`docs/10-prompt/` 进入 Phase B。

### 原则 5：agent sidecar assets 必须进入 managed runtime contract

`session-historian` 不是只有一个 markdown agent 文件，它还依赖同目录下的 `session-history-scripts/*.sh|*.py`。

当前仓库的 `syncAgents()` / `listBundledAgents()` / `state.agents` 只覆盖 `agents/**/*.md`。这意味着：

- agent markdown 可能被正确安装
- 但 sidecar scripts 不会进入 runtime
- 即使手工复制进去了，`doctor` / `clean` / state 也不知道它们存在

因此 Phase A 不允许把 session scripts 当“顺手拷一下”的附属品，而必须把它们纳入正式 managed contract：

1. sync
2. inspect
3. state
4. clean
5. smoke assertions

## 4. 上游关联面全量盘点

| 关联域 | 上游落点 | 当前状态 | parity 要求 |
|---|---|---|---|
| compound 主 workflow | `plugins/compound-engineering/skills/ce-compound/SKILL.md` | `spec-compound` 存在但收缩 | 必须恢复双 track、mode 选择、session enrichment、完整 agent 清单 |
| compound refresh | `plugins/compound-engineering/skills/ce-compound-refresh/SKILL.md` | `spec-compound-refresh` 存在但合同漂移 | 必须恢复到上游等价语义，并保留独立 support files |
| sessions skill | `plugins/compound-engineering/skills/ce-sessions/SKILL.md` | 当前缺失 | 必须新增 `skills/spec-sessions/` |
| session agent | `plugins/compound-engineering/agents/research/session-historian.md` | 当前缺失 | 必须新增 |
| session scripts | `plugins/compound-engineering/agents/research/session-history-scripts/*` | 当前缺失 | 必须新增 |
| manifest 接线 | 上游 plugin runtime 安装链 | 当前缺少 `sessions` 命令接线 | 必须补 `.claude-plugin/plugin.json` |
| command template | `compound.md` / `ce-sessions` 入口 | 当前没有 `sessions.md` | 必须补 `templates/claude/commands/spec/sessions.md`，并确认 Claude / Codex 均由该模板生成命令 |
| compound support files | `ce-compound/references/*` / `assets/*` | 当前不完整 | 必须恢复 |
| refresh support files | `ce-compound-refresh/references/*` / `assets/*` | 当前存在但漂移 | 必须恢复 |
| consumers | `agents/research/learnings-researcher.md` | 仍按平铺 schema 假设工作 | 必须改为 track-aware |
| docs 数据 | `docs/solutions/**/*` | 当前含 knowledge doc bug-style 化、非 solution 文档混入 | 必须清洗，但要后置 |
| specialized agents | `performance-oracle` / `security-sentinel` / `data-integrity-guardian` / `code-simplicity-reviewer` / `pattern-recognition-specialist` / `kieran-*` / `best-practices-researcher` / `framework-docs-researcher` | 大部分已存在 | `spec-compound` 需要恢复完整引用与路由 |

## 5. 当前关键漂移

### 5.1 `skills/spec-compound/SKILL.md`

当前存在这些偏差：

1. source asset 仍停留在本地 `compound-workflow` 语义，尚未恢复上游 `spec:compound` 对外行为合同
2. 默认直接 full-mode，不再先问 mode
3. Full 模式下缺少 session history follow-up question
4. 不再 dispatch `session-historian`
5. Context Analyzer 不再返回 track
6. Solution Extractor 不再支持 knowledge track
7. compact-safe / lightweight 路径只剩 bug-style 结构
8. Applicable Specialized Agents 清单不完整

### 5.2 `skills/spec-compound/references/*`

当前存在这些偏差：

1. `schema.yaml` 删除了 `tracks`
2. 删除了 `track_rules`
3. 删除了 knowledge track 的 `applies_when`
4. 将 `symptoms / root_cause / resolution_type` 变成全局必填
5. `component.type` 行存在非法污染
6. `resolution-template.md` 缺少 knowledge template

### 5.3 `skills/spec-compound-refresh/*`

当前 refresh workflow 虽然存在，但合同和上游不同步：

1. `SKILL.md` 语义偏离
2. `references/schema.yaml` 仍是本地变体
3. `references/yaml-schema.md` 仍是本地变体
4. `assets/resolution-template.md` 仍是本地变体

### 5.4 `docs/solutions/`

当前只有 4 个文件：

1. `docs/solutions/developer-experience/bash-portability-pitfalls-2026-04-01.md`
2. `docs/solutions/logic-errors/mcp-mysql-hostname-validation-logic-flaw-2026-04-01.md`
3. `docs/solutions/logic-errors/spec-graph-bootstrap-deep-review.md`
4. `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`

其中：

- `developer-experience` 文档实际上应是 knowledge track
- `workflow_issue` 文档实际上也应是 knowledge track
- `spec-graph-bootstrap-deep-review.md` 不是 solution doc，不应留在 `docs/solutions/`

### 5.5 安装与测试接线

当前还存在这些阻断项：

1. `.claude-plugin/plugin.json` 没有 `sessions` 命令声明
2. `tests/smoke/cli.sh` 将 agent 数量硬编码为 `47`
3. `tests/smoke/cli.sh` 尚未覆盖 `sessions.md`
4. `package.json` 的 `test:unit` 目前没有 compound 系列 contract tests

### 5.6 source / runtime 命名模型存在误判风险

当前仓库的 skill 打包机制不是“source name == runtime public name”一刀切，而是两套语义并存：

1. 一部分 source skill 使用内部工作流名，例如：
   - `compound-workflow`
   - `compound-refresh-workflow`
   - `plan-workflow`
2. Codex adapter 会把 runtime skill name 重写成 public skill 名，例如：
   - `spec-compound`
   - `spec-compound-refresh`
3. Claude 侧 slash command 主要通过 command file 指向 workflow 文件路径，不强依赖 source frontmatter name

因此 parity 的判据不能写成“把所有 source `name:` 都改成 `spec-*`”。真正应该对齐的是：

- public entry 行为
- runtime 可发现性
- command / skill 的实际调用语义

而不是盲目追求 source frontmatter 文本与上游一致。

### 5.7 consumers 还存在一个隐式降级点

`agents/research/learnings-researcher.md` 当前要求“无论如何都读取 `docs/solutions/patterns/critical-patterns.md`”，但当前仓库与上游仓库都没有这个文件。

这说明 Phase A 不能只做 track-aware 改造，还必须把 consumer 的 patterns 依赖改成：

1. 文件存在则读取
2. 文件缺失则显式跳过，不视为失败

否则即使 compound parity 完成，consumer 仍会在 patterns 层留下伪阻断。

### 5.8 逐文件差异矩阵

#### `ce-compound` -> `spec-compound`

| 文件 | 上游语义 | 当前偏差 | Phase A 动作 |
|---|---|---|---|
| `skills/ce-compound/SKILL.md` -> `skills/spec-compound/SKILL.md` | 先问 mode，Full 可选 session enrichment，bug/knowledge 双 track，完整 specialized agents | 默认 full、无 session、knowledge track 丢失、agent 清单收缩 | 以行为 parity 为目标恢复编排，不机械追求 source `name:` 文本一致 |
| `references/schema.yaml` | tracks + track_rules + knowledge `applies_when` + backward compatibility 说明 | track 模型被删，bug 字段被全局必填化，存在非法污染 | 直接恢复上游合同结构 |
| `references/yaml-schema.md` | 说明 tracks、required/optional fields、category mapping、validation rules | track 说明被删，知识型文档约束丢失 | 直接恢复上游快照 |
| `assets/resolution-template.md` | Bug template + Knowledge template 双模板 | 只剩 bug template | 恢复双模板 |
| `templates/claude/commands/spec/compound.md` | public command 入口应指向 parity 后 workflow | 当前仍指向收缩版 workflow | 保持入口路径不变，但更新文案与运行时契约说明 |

#### `ce-compound-refresh` -> `spec-compound-refresh`

| 文件 | 上游语义 | 当前偏差 | Phase A 动作 |
|---|---|---|---|
| `skills/ce-compound-refresh/SKILL.md` -> `skills/spec-compound-refresh/SKILL.md` | 完整 refresh 路径、Replace successor 生成、与 compound 合同同构 | 命名迁移后保留了本地漂移语义 | 恢复上游流程，source 继续保留 internal workflow naming |
| `references/schema.yaml` | 与 compound 共识别的双 track 合同 | 本地单轨变体 | 直接恢复上游合同 |
| `references/yaml-schema.md` | 与 compound 共识别的双 track 快速参考 | 本地单轨变体 | 直接恢复上游快照 |
| `assets/resolution-template.md` | Replace successor 需要双模板 | 只剩 bug template | 恢复双模板 |

#### `ce-sessions` 关联链路

| 文件 / 关联项 | 上游语义 | 当前偏差 | Phase A 动作 |
|---|---|---|---|
| `skills/ce-sessions/SKILL.md` | 独立 session 查询入口 | 当前缺失 | 新增 `skills/spec-sessions/SKILL.md` |
| `agents/research/session-historian.md` | 跨 Claude / Codex / Cursor 会话检索 | 当前缺失 | 逐文件引入并做宿主命名适配 |
| `agents/research/session-history-scripts/*` | 会话发现、元数据提取、骨架提取、错误提取 | 当前缺失 | 原样引入，并把它们纳入 runtime managed assets，不作为不可见 sidecar |
| `.claude-plugin/plugin.json` | command source-of-truth | 无 `sessions` 命令 | 新增 command 声明 |
| `templates/claude/commands/spec/sessions.md` | public command template | 当前缺失 | 新增模板，供 Claude / Codex 共用 |

#### runtime 管理链路补丁

| 文件 / 模块 | 当前限制 | 必要动作 |
|---|---|---|
| `src/cli/plugin.js` | 只枚举并同步 `agents/**/*.md` | 引入 `agentSupportFiles` 概念，单独枚举并同步 `agents/**` 下的非 markdown support assets |
| `src/cli/state.js` | `state.agents` 只记录 markdown agent 文件 | 在 state 中新增 `agentSupportFiles`，确保 support assets 可被 clean/prune/remove |
| `src/cli/commands/init.js` | 初始化输出只按 markdown agent 数量汇总 | 保留 agent 数量口径不变；support assets 单独统计或静默纳入 state，不混入“agent file(s)” |
| `src/cli/commands/doctor.js` | 只检查 markdown agent 安装状态 | 增加 support assets 完整性检查，避免假 PASS |
| `tests/smoke/cli.sh` | 只断言 markdown agent 存在 | 增加 runtime script existence 断言 |

### 5.9 agent support assets 当前不进入 runtime managed set

这不是 `spec-sessions` 独有的命名问题，而是当前 CLI 安装架构的能力边界问题：

1. `listBundledAgents()` 只返回 `.md`
2. `syncAgents()` 只复制这些 markdown 文件
3. `inspectInstalledAssets().agents` 也只按 markdown 判断
4. `buildState()` / `removeManagedAssets()` 只记录并删除 markdown agent 文件

因此如果直接按现有设计把 `session-history-scripts/*` 放到 `agents/research/` 下：

- runtime 不会拿到它们，`session-historian` 无法执行
- `doctor` 仍会显示 agent 安装正常，形成假阳性
- `clean` 也不会清理这些脚本，形成 managed / unmanaged 混杂

这必须在实施单元 1 里一并解决，不能拖到 Phase B。

## 6. 目标架构

升级完成后，compound 子系统应形成如下结构：

```text
spec:compound
  ├─ 显式询问 Full / Lightweight
  ├─ Full 模式可选调用 session-historian
  ├─ 按 bug / knowledge track 分类
  ├─ 生成符合双 track 合同的 docs/solutions 文档
  ├─ 必要时调用 spec:compound-refresh
  ├─ 可选调用 specialized reviewers / research agents
  └─ 做 discoverability check

spec:compound-refresh
  ├─ 保留与上游同构的独立 support files
  ├─ 做 Update / Consolidate / Replace / Delete
  ├─ Replace 时生成符合双 track 合同的 successor
  └─ 做 discoverability check

spec:sessions
  └─ 作为独立入口封装 session-historian
```

### 6.1 parity 判据与允许差异

本次 hard cut 的 parity 判据分成两层：

**必须等价的层**

- workflow 行为
- 模式选择与交互路径
- session enrichment 能力
- 双 track 合同
- specialized agent 路由
- refresh 决策与 successor 产出
- runtime 安装与 discoverability

**允许保留的层**

- source 文件中的内部 workflow 名，只要 runtime public identity 与调用语义正确
- `templates/claude/commands/spec/` 这一 source 目录命名，只要 Claude / Codex 都由同一模板正确生成
- `spec-first` 既有的 adapter 改写逻辑，只要不改变上游功能面

换句话说：**功能行为必须平移，source 打包约定不要求机械回滚。**

### 6.2 运行态接线链路

`spec-sessions` / `spec-compound` / `spec-compound-refresh` 的正确接线链路应明确为：

1. source assets
   - `skills/*`
   - `agents/*`
   - `templates/claude/commands/spec/*`
2. manifest
   - `.claude-plugin/plugin.json`
3. sync engine
   - `src/cli/plugin.js`
   - `src/cli/adapters/claude.js`
   - `src/cli/adapters/codex.js`
4. runtime outputs
   - `.claude/commands/spec/*`
   - `.claude/spec-first/workflows/*`
   - `.claude/skills/*`
   - `.claude/agents/*`
   - `.codex/commands/spec/*`
   - `.agents/skills/*`
   - `.codex/agents/*`
5. verification
   - `tests/smoke/cli.sh`
   - `doctor`

这个链路意味着：

- `sessions` 命令接线只需要补一次 manifest
- Codex 不存在独立第二套 command source-of-truth
- runtime 命名差异应由 adapter 处理，而不是在 source 文件里到处手工分叉

## 7. 执行阶段

### Phase A：功能平移优先

目标：确保源项目功能面完整进入 `spec-first`，不遗漏入口、support files、agent、脚本和运行态接线。

包含：

1. `spec-sessions` 运行态接线
2. `spec-compound`
3. `spec-compound-refresh`
4. `learnings-researcher` 与 tests
5. `docs/solutions/` 数据迁移

约束：

- 不做 support files 去重
- 不把 `docs/10-prompt/` 作为阻塞项
- 以“逐文件可对照、逐功能可验证”为第一优先级

### Phase B：优化收敛

目标：在 Phase A 跑通后，再处理本地抽象、历史快照与对外说明。

包含：

1. 是否抽共享 contract source
2. `docs/10-prompt/` 同步
3. README / 用户手册 / 架构说明收口
4. 测试与文档层面的进一步去重

## 8. 实施单元

### 实施单元 1：补齐 `spec-sessions` 运行态接线

**目标**

让 `spec-sessions` 成为真实可安装、可发现、可调用的运行态能力。

**新增文件**

- Create: `skills/spec-sessions/SKILL.md`
- Create: `agents/research/session-historian.md`
- Create: `agents/research/session-history-scripts/discover-sessions.sh`
- Create: `agents/research/session-history-scripts/extract-errors.py`
- Create: `agents/research/session-history-scripts/extract-metadata.py`
- Create: `agents/research/session-history-scripts/extract-skeleton.py`
- Create: `templates/claude/commands/spec/sessions.md`

**修改文件**

- Modify: `.claude-plugin/plugin.json`
- Modify: `src/cli/plugin.js`
- Modify: `src/cli/state.js`
- Modify: `src/cli/commands/init.js`
- Modify: `src/cli/commands/doctor.js`
- Modify: `tests/smoke/cli.sh`

**关键改动**

1. 在 manifest 中新增 `sessions` command 声明
2. 通过 manifest 驱动，让 `init` / `doctor` / clean 自动纳入 `spec-sessions`
3. Claude / Codex 初始化后都生成 `sessions.md`
4. 将 `session-historian` 与 session-history scripts 纳入 Claude / Codex 运行态产物
5. 在 CLI 中新增 `agentSupportFiles` managed-state 桶，使 `session-history-scripts/*` 进入 runtime/state/clean/doctor 闭环，而不是挂在 markdown agent 旁边成为不可见 sidecar
6. `doctor` 与 smoke 对 runtime scripts 做显式断言，避免假 PASS
7. `clean` 能删除这些 managed support assets，不污染项目
8. 只有在 smoke 证明 manifest 驱动链路不足时，才回头追加命令层特判

**验收标准**

1. `spec-first init --claude` 与 `spec-first init --codex` 后都能看到 `sessions.md`
2. `.claude/agents/research/` 与 `.codex/agents/research/` 中都存在 `session-historian.md`
3. `.claude/agents/research/session-history-scripts/` 与 `.codex/agents/research/session-history-scripts/` 中都存在 4 个脚本文件
4. `doctor` 对 `spec-sessions` 的命令、agent 与 support assets 状态感知正常
5. `clean --claude` / `clean --codex` 后这些 scripts 会被一并清理
6. 不需要为了 `sessions` 额外引入一套 Claude / Codex 分叉实现

### 实施单元 2：恢复 `spec-compound` 主 workflow parity

**目标**

将 `spec-compound` 主 workflow 恢复到与上游 `ce-compound` 等价的执行语义。

**修改文件**

- Modify: `skills/spec-compound/SKILL.md`
- Modify: `skills/spec-compound/references/schema.yaml`
- Modify: `skills/spec-compound/references/yaml-schema.md`
- Modify: `skills/spec-compound/assets/resolution-template.md`
- Modify: `templates/claude/commands/spec/compound.md`

**关键改动**

1. 恢复 `spec:compound` 的 public workflow 语义，而不是机械要求 source `name:` 必须等于 `spec-compound`
2. 恢复显式 mode 选择：
   - `Full`
   - `Lightweight`
3. 恢复 Full 模式下的 session history follow-up question
4. 恢复 `session-historian` dispatch
5. 恢复 track-aware Context Analyzer
6. 恢复 track-aware Solution Extractor
7. 恢复 track-aware Lightweight 路径
8. 恢复完整 Applicable Specialized Agents 清单
9. 保留 discoverability check、overlap detection、stack-aware reviewer routing
10. 保持与现有打包机制兼容：
    - source 可继续使用内部 workflow 名
    - Codex runtime public skill 名由 adapter 生成

**验收标准**

1. `skills/spec-compound/SKILL.md` 能表达完整双 track 编排
2. `skills/spec-compound/SKILL.md` 能显式接入 session historian
3. `compound.md` 命令模板仍正确指向 workflow 文件
4. Codex 运行态 `.agents/skills/spec-compound/SKILL.md` 使用 public skill identity，不破坏现有 adapter 约定

### 实施单元 3：恢复 `spec-compound-refresh` parity

**目标**

让 `spec-compound-refresh` 回到与上游 `ce-compound-refresh` 同构的功能面。

**修改文件**

- Modify: `skills/spec-compound-refresh/SKILL.md`
- Modify: `skills/spec-compound-refresh/references/schema.yaml`
- Modify: `skills/spec-compound-refresh/references/yaml-schema.md`
- Modify: `skills/spec-compound-refresh/assets/resolution-template.md`

**关键改动**

1. 恢复 `spec:compound-refresh` 的 public workflow 语义，但 source asset 保持现有 internal workflow naming 约定
2. 保留 own support files，不在 parity 阶段共享到 `spec-compound`
3. 恢复 Replace / Consolidate / Delete 的上游语义
4. Replace 生成的 successor 文档必须按双 track 写入

**验收标准**

1. `spec-compound-refresh` own support files 与上游逐文件可对照
2. refresh 生成的新文档符合双 track 合同
3. Codex 运行态 `.agents/skills/spec-compound-refresh/SKILL.md` 暴露 public skill identity，但 source asset 不强制改成 `spec-compound-refresh`

### 实施单元 4：升级下游消费者与验证器

**目标**

让 `docs/solutions/` 的 consumers 与 tests 在 producer parity 完成后，再一起切换到双 track 假设。

**新增文件**

- Create: `tests/unit/spec-compound-contracts.test.js`
- Create: `tests/unit/docs-solutions-frontmatter.test.js`

**修改文件**

- Modify: `agents/research/learnings-researcher.md`
- Modify: `package.json`
- Modify: `tests/smoke/cli.sh`
- Modify: `scripts/test-skills.sh`

**关键改动**

1. `learnings-researcher` 改为 track-aware 检索与摘要
2. contract tests 锁住：
   - `spec-compound`
   - `spec-compound-refresh`
   - `spec-sessions`
3. smoke 测试覆盖：
   - `sessions.md`
   - `spec-sessions`
   - 动态 agent 数
4. `learnings-researcher` 对 `docs/solutions/patterns/critical-patterns.md` 缺失做 graceful skip
5. `package.json` 将新 Jest 文件纳入默认单测入口

**验收标准**

1. `learnings-researcher` 能正确返回 knowledge doc 的高相关结果
2. `spec-plan` / `spec-code-review` 使用 `learnings-researcher` 时不会因为双 track 而退化
3. 缺失 `critical-patterns.md` 时 consumer 不报伪错误
4. tests 能阻止 `spec-sessions` 与双 track 合同回归

### 实施单元 5：迁移现有 `docs/solutions/`

**目标**

在 producer、maintainer、consumer 与 validators 全部就绪后，再对现有 `docs/solutions/` 执行 hard cut 清洗。

**修改文件**

- Modify: `docs/solutions/developer-experience/bash-portability-pitfalls-2026-04-01.md`
- Modify: `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- Keep: `docs/solutions/logic-errors/mcp-mysql-hostname-validation-logic-flaw-2026-04-01.md`
- Move: `docs/solutions/logic-errors/spec-graph-bootstrap-deep-review.md` -> `docs/validation/2026-04-01-spec-graph-bootstrap-deep-review.md`

**关键改动**

1. `developer-experience` 文档改为 knowledge track 结构：
   - `Context`
   - `Guidance`
   - `Why This Matters`
   - `When to Apply`
   - `Examples`
2. `workflow_issue` 文档改为 knowledge track 结构
3. `logic_error` 文档保持 bug track
4. 非 solution 文档移出 `docs/solutions/`

**验收标准**

1. `docs/solutions/` 下所有 `.md` 文件都属于合法 solution doc
2. knowledge-type 文档不再被迫写成 bug-style
3. `spec-graph-bootstrap-deep-review.md` 不再参与 `docs/solutions/` 检索

### 实施单元 6：Phase B 优化收敛

**目标**

在 parity 全部稳定后，再做不影响功能完整性的本地重构与历史快照同步。

**修改文件**

- Modify: `docs/10-prompt/skills/spec-compound/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-compound/assets/resolution-template.md`
- Modify: `docs/10-prompt/skills/spec-compound/references/yaml-schema.md`
- Modify: `docs/10-prompt/skills/spec-sessions/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-compound-refresh/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-compound-refresh/references/yaml-schema.md`
- Modify: `docs/10-prompt/agents/research/session-historian.md`
- Modify: `docs/10-prompt/agents/research/learnings-researcher.md`
- Modify: `README.md`
- Modify: `docs/05-用户手册/**/*`（按需）
- Modify: `docs/02-架构设计/**/*`（按需）

**关键改动**

1. 评估是否将 `spec-compound` 与 `spec-compound-refresh` 抽成共享 contract source
2. 同步 `docs/10-prompt/` 历史快照
3. 更新 README / 手册 / 架构文档中的命令与能力说明
4. 仅在 Phase A 已稳定后做 support files 去重

**验收标准**

1. Phase B 不改变 Phase A 已验证的功能面
2. `docs/10-prompt` 与对外说明更新完成，但不反向影响运行时 source-of-truth
3. 若抽共享合同，需有独立验证证明 parity 不回退

## 9. 文件级变更清单

### Create

- `skills/spec-sessions/SKILL.md`
- `agents/research/session-historian.md`
- `agents/research/session-history-scripts/discover-sessions.sh`
- `agents/research/session-history-scripts/extract-errors.py`
- `agents/research/session-history-scripts/extract-metadata.py`
- `agents/research/session-history-scripts/extract-skeleton.py`
- `templates/claude/commands/spec/sessions.md`
- `tests/unit/spec-compound-contracts.test.js`
- `tests/unit/docs-solutions-frontmatter.test.js`

### Modify

- `.claude-plugin/plugin.json`
- `src/cli/plugin.js`
- `src/cli/state.js`
- `src/cli/commands/init.js`
- `src/cli/commands/doctor.js`
- `skills/spec-compound/SKILL.md`
- `skills/spec-compound/references/schema.yaml`
- `skills/spec-compound/references/yaml-schema.md`
- `skills/spec-compound/assets/resolution-template.md`
- `skills/spec-compound-refresh/SKILL.md`
- `skills/spec-compound-refresh/references/schema.yaml`
- `skills/spec-compound-refresh/references/yaml-schema.md`
- `skills/spec-compound-refresh/assets/resolution-template.md`
- `agents/research/learnings-researcher.md`
- `package.json`
- `tests/smoke/cli.sh`
- `scripts/test-skills.sh`
- `templates/claude/commands/spec/compound.md`
- `README.md`
- `docs/solutions/developer-experience/bash-portability-pitfalls-2026-04-01.md`
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`

### Move

- `docs/solutions/logic-errors/spec-graph-bootstrap-deep-review.md` -> `docs/validation/2026-04-01-spec-graph-bootstrap-deep-review.md`

## 10. 风险与应对

### 风险 1：hard cut 后 `docs/solutions/` 被现有消费者误读

**风险点**

`learnings-researcher` 当前假设 `symptoms / root_cause / resolution_type` 可直接用于打分。

**应对**

把 `learnings-researcher` 改造和文档迁移放在同一批提交中，不允许合同切换与消费者切换分离。

### 风险 2：`spec-sessions` 存在于仓库，但不进入运行时

**风险点**

当前 `init` / `doctor` / runtime sync 都由 `.claude-plugin/plugin.json` 驱动。如果只新增模板和 skill，而漏改 manifest，`spec-sessions` 不会进入运行态。

**应对**

在第一批就修改 `.claude-plugin/plugin.json` 与 `tests/smoke/cli.sh`，把 manifest 接线和安装断言一起补齐。

### 风险 3：过早引入共享合同，导致 parity 与本地重构耦合

**风险点**

如果在 parity 阶段就删除 `spec-compound-refresh` own support files，改成跨 skill 共享合同，会失去与上游 `ce-compound-refresh` 的逐文件对照能力，并增加漏功能风险。

**应对**

Phase A 保持上游同构文件边界；共享合同只在 Phase B 作为优化任务评估。

### 风险 4：`docs/10-prompt` 与 source-of-truth 再次漂移

**风险点**

`docs/10-prompt` 是历史快照，如果需要对外解释与研究资料同步，容易在主路径里被遗漏。

**应对**

将 `docs/10-prompt` 明确降级为 Phase B 收尾任务，不阻塞 Phase A 功能平移。

### 风险 5：现有 knowledge doc 的章节语义转换不彻底

**风险点**

把 bug-style 文档简单删字段，可能留下不适合 knowledge track 的正文结构。

**应对**

对 knowledge-type 文档执行正文重写，而不是只做 frontmatter 机械迁移；并将数据迁移放到 workflow 与 validators 稳定之后。

### 风险 6：把 source frontmatter name 当成 parity 主判据，反而破坏现有打包机制

**风险点**

当前仓库对 Claude / Codex 的 runtime 暴露方式并不完全相同。若简单把 `skills/spec-compound*.md` 的 source `name:` 全部改成 `spec-*`，可能会与既有 smoke 约束、adapter 改写逻辑和内部 workflow 命名策略冲突。

**应对**

把 parity 判据从“source 文本一致”改成“public behavior 与 runtime identity 等价”。source 命名是否保留 internal workflow，由现有打包机制决定，不单独作为阻断项。

### 风险 7：patterns 依赖缺失导致 consumer 假失败

**风险点**

`critical-patterns.md` 在当前仓库与上游仓库都不存在；如果 `learnings-researcher` 仍把它当成无条件必读文件，Phase A 完成后 consumer 依然会留下伪阻断。

**应对**

把 patterns 读取改成 optional input：存在则读取，不存在则跳过并继续主流程。

### 风险 8：session scripts 未进入 managed runtime，导致 parity 纸面成立但运行失败

**风险点**

当前 CLI 只把 markdown agent 文件视为 managed assets。若不扩展 sync/state/doctor/clean，`session-historian` 会在 runtime 缺少脚本依赖，但校验链路仍可能显示正常。

**应对**

在实施单元 1 中同步修改 `src/cli/plugin.js`、`src/cli/state.js`、`src/cli/commands/init.js`、`src/cli/commands/doctor.js` 与 smoke 断言，引入 `agentSupportFiles` 这一等 managed artifact 桶。

## 11. 验证方案

### 单元验证

1. `npm run test:unit`
2. `npx jest tests/unit/spec-compound-contracts.test.js --runInBand`
3. `npx jest tests/unit/docs-solutions-frontmatter.test.js --runInBand`

### Smoke 验证

1. `npm run test:smoke`
2. 重点验证：
   - Claude init 后生成 `compound.md`、`sessions.md`
   - Codex init 后生成 `compound.md`、`sessions.md`
   - Codex runtime `.agents/skills/spec-compound/SKILL.md` 与 `.agents/skills/spec-compound-refresh/SKILL.md` 的 public skill identity 正确
   - `.codex/agents/research/session-historian.md` 存在
   - Claude / Codex runtime 下 `session-history-scripts/*` 4 个脚本都存在
   - 缺失 `docs/solutions/patterns/critical-patterns.md` 时不影响 consumer 主流程

### 手工语义验证

1. 以 knowledge 类案例跑 `spec:compound`
   - 预期输出 knowledge track frontmatter 与正文结构
2. 以 bug 类案例跑 `spec:compound`
   - 预期输出 bug track 结构
3. 在 Full 模式下选择 “search session history”
   - 预期 `session-historian` 被调用
4. 以 Replace 场景跑 `spec:compound-refresh`
   - 预期 successor 文档遵守新双 track 合同

## 12. 实施顺序

建议按以下顺序落地：

1. 先做 `实施单元 1`：补齐 `spec-sessions` 运行态接线
2. 再做 `实施单元 2`：恢复 `spec-compound` 主 workflow parity
3. 再做 `实施单元 3`：恢复 `spec-compound-refresh` parity
4. 再做 `实施单元 4`：升级下游消费者与验证器
5. 再做 `实施单元 5`：迁移现有 `docs/solutions/`
6. 最后做 `实施单元 6`：Phase B 优化收敛

排序依据：

- 运行时入口先接通
- producer / maintainer 先完成 parity
- consumer 与 validators 再切换
- 数据迁移最后执行
- 优化与历史快照同步不阻塞主路径

## 13. 完成标准

本计划完成后，以下条件必须同时成立：

1. `spec-compound` 与上游 `ce-compound` 在知识模型、mode 交互、track-aware orchestration、session enrichment、specialized agent 清单上达到等价语义
2. `spec-compound-refresh` 与上游 `ce-compound-refresh` 在 workflow 与 support files 上达到逐文件可对照的 parity
3. `spec-sessions` 与 `session-historian` 已进入仓库、manifest、安装产物与 smoke 流程
4. `session-history-scripts/*` 已进入 managed runtime/state/doctor/clean 闭环，而不是仅停留在 source tree
5. `docs/solutions/` 中只剩合法 solution docs，且 knowledge docs 使用正确章节结构
6. `learnings-researcher`、`spec-plan`、`spec-code-review` 对 `docs/solutions/` 的消费不再基于旧平铺 schema
7. source / runtime 命名策略没有被错误回滚，public identity 正确但不破坏既有 adapter 机制
8. 缺失 optional patterns 文件不会阻断 `docs/solutions/` 消费
9. tests 能阻止以下回归：
   - canonical name 再次漂移
   - knowledge template 丢失
   - `spec-sessions` 未进入运行态
   - `session-history-scripts/*` 未进入 managed runtime
   - `docs/solutions/` 再次混入非 solution 文档
10. Phase B 的任何优化都不能回退 Phase A 已经验证通过的功能面
