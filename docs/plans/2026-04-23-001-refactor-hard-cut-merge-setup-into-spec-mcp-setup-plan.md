---
title: "2026-04-23 `refactor(hard-cut): merge setup into spec-mcp-setup`"
type: archive
status: superseded
created: 2026-04-23
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# 2026-04-23 `refactor(hard-cut): merge setup into spec-mcp-setup`

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

## 背景

当前仓库同时存在两个 setup 相关 workflow：

- `setup`
  - source of truth: `skills/setup/SKILL.md`
  - 负责 repo-local / project-local setup 诊断与 bootstrap
  - 承载 `scripts/check-health`、`.spec-first/config.local.yaml` bootstrap、legacy Compound Engineering 清理提示、helper tool 检查与安装建议
- `spec-mcp-setup`
  - source of truth: `skills/spec-mcp-setup/SKILL.md`
  - 负责 host-level MCP baseline 安装、修复、验证与 readiness ledger 写入

这两个 workflow 已经形成三个问题：

1. **用户入口重叠**：用户难以判断“环境 setup”到底该走 `setup` 还是 `spec-mcp-setup`。
2. **对外口径漂移**：当前 source/docs/README 对 Codex 入口存在 `$setup` / `spec-setup` / `spec-mcp-setup` 的混杂。
3. **真相源分裂**：setup 语义分布在两个 workflow 中，增加长期维护与双宿主治理成本。

用户已明确要求走**方案 1 的一次性彻底迁移**：不保留兼容壳，直接把 `setup` 的职责并入 `spec-mcp-setup`，并删除独立 `setup` surface。

---

## 目标

一次性完成以下硬切：

1. `spec-mcp-setup` 成为唯一 setup 入口。
2. 删除独立 `setup` workflow command / skill / template / docs mirror / tests surface。
3. 所有原先指向 `spec-setup`、`$setup`、`spec-setup` 的入口与提示，统一改为：
   - Claude：`spec-mcp-setup`
   - Codex：`spec-mcp-setup`
4. 保持当前 `spec-mcp-setup` 的 machine truth、readiness ledger、Serena bootstrap 与 graph-bootstrap 消费语义不被污染。
5. 保证 repo-local preflight 的确定性资产在 hard-cut 后仍有稳定落点，不出现“文案已并入、脚本已丢失”的半迁移状态。
6. 保证当前产品面 / runtime 面 / test 断言面中不再暴露旧 setup 入口；唯一允许保留旧入口的位置仅限历史文档或“已移除说明”语境。

---

## 设计原则

本方案严格遵守 `docs/10-prompt/项目角色.md` 的基线：

- **Light contract**
- **Explicit boundaries**
- **Let the LLM decide**
- 脚本负责确定性流程，workflow prose 负责说明边界与决策输入
- 不新增第二份 machine truth
- 不把 repo-local preflight 状态混入 MCP baseline readiness 语义
- 入口可以 hard-cut，但契约域不能混成“大而全 setup”

---

## 当前事实基线

### 1. `setup` 当前是独立 workflow，不是别名

以下文件都将其当作独立 surface：

- `skills/setup/SKILL.md`
- `templates/claude/commands/spec/setup.md`
- `docs/10-prompt/skills/setup/SKILL.md`
- `tests/unit/setup.sh`
- `tests/smoke/cli.sh`
- `tests/unit/dual-host-governance-contracts.test.js`
- `README.md`
- `README.zh-CN.md`

### 2. `spec-mcp-setup` 已具备稳定主干

关键真相源与主链：

- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/mcp-tools.json`
- `templates/claude/commands/spec/mcp-setup.md`
- `skills/spec-mcp-setup/scripts/check-deps.*`
- `skills/spec-mcp-setup/scripts/detect-host.*`
- `skills/spec-mcp-setup/scripts/detect-tools.*`
- `skills/spec-mcp-setup/scripts/install-mcp.*`
- `skills/spec-mcp-setup/scripts/configure-host.*`
- `skills/spec-mcp-setup/scripts/repair-install.*`
- `skills/spec-mcp-setup/scripts/activate-serena.*`
- `skills/spec-mcp-setup/scripts/verify-tools.*`

### 3. setup 当前承载 repo-local 责任

原 `setup` 的有效职责主要是：

- `scripts/check-health`
- legacy CE cleanup guidance
- `.spec-first/config.local.example.yaml` refresh
- `.spec-first/config.local.yaml` create-once bootstrap
- `.gitignore` 覆盖提示
- helper tools 检查与安装建议
- handoff 到 `spec-mcp-setup`

### 4. manifest 与 governance 强绑定

以下两个真相源必须同步调整：

- `.claude-plugin/plugin.json`
- `src/cli/contracts/dual-host-governance/skills-governance.json`

不能只删 skill 目录或只改文档，否则 runtime 资产生成与双宿主 contract 会失配。

### 5. 旧入口不仅存在于 README，还存在于真实路由与下游引用

以下文件若不改，hard-cut 后仍会继续暴露旧入口：

- `skills/using-spec-first/SKILL.md`
- `src/context-routing/verifier-registry.js`
- `skills/test-browser/SKILL.md`
- `skills/feature-video/references/tier-browser-reel.md`
- `tests/unit/verification-gate-state.test.js`
- `tests/unit/test-browser-contracts.test.js`
- `tests/unit/feature-video-contracts.test.js`

这意味着本次迁移不是简单“删 setup + 改 README”，而是需要全链路收口旧入口提示面。

---

## 迁移后的目标边界

hard-cut 后，`spec-mcp-setup` 变为**唯一 setup workflow**，但内部必须保留清晰的两段边界：

### Phase A：Project / Repo Setup Preflight
吸收原 `setup` 的确定性前置能力：

- 运行 `check-health`
- 检查 legacy CE 遗留
- 刷新 `.spec-first/config.local.example.yaml`
- 在用户确认后创建 `.spec-first/config.local.yaml`
- 在用户确认后建议/补 `.gitignore`
- 检查 helper tools 缺失并在确认后安装/验证

### Phase B：MCP Host Baseline Setup
沿用现有 `spec-mcp-setup` 主链：

- dependency detection
- host detection
- MCP install / configure / repair
- Serena bootstrap
- readiness ledger 写入与验证

### 明确不做的事

以下状态**不得**混入 `baseline_ready`：

- `.spec-first/config.local.yaml` 是否存在
- `.gitignore` 是否覆盖
- legacy CE 是否被删除
- helper tools 是否已装齐

`baseline_ready` 继续只表达 **required MCP baseline** 的 readiness。

### 新边界约束

本次 hard-cut 只做“入口统一 + deterministic preflight 并入 + 旧 surface 删除”，**不**做以下扩张：

- 不把 helper tools 写入 `mcp-tools.json`
- 不把 repo-local config contract 写入 readiness ledger
- 不把 verifier prerequisite 泛化成 MCP tool
- 不把 `config-template.yaml` 解释成 MCP reference

换句话说：
- `spec-mcp-setup` 成为唯一入口
- 但其内部仍保持“project preflight facts”与“MCP baseline facts”两层分离

### Phase A 的 machine truth 约束（必须项）

本次 hard-cut 中，Phase A 的 deterministic preflight **一律继续以迁移后的**
`skills/spec-mcp-setup/scripts/check-health`
**作为唯一 machine input**。

这意味着：

- helper tools 检测
- legacy CE 检测
- `.spec-first/config.local.*` 检测
- `.gitignore` 覆盖检测
- helper tools install command / fallback project URL 建议

都继续复用 `check-health` 的输出契约。

本次 **不** 做以下事情：

- 不把这些状态并入 `mcp-tools.json`
- 不并入 `detect-tools.*`
- 不新增第二套 preflight metadata / detection script
- 不让 workflow prose 临时充当检测真相源

`spec-mcp-setup/SKILL.md` 在 Phase A 只负责：
- 调用迁移后的 `check-health`
- 展示输出
- 基于输出组织交互与确认

而**不**重定义另一套 helper tool / repo-local preflight 检测语义。

---

## 一次性彻底迁移方案

## Step 0：先迁 deterministic assets，再谈 hard-cut

### 目标
在删除 `skills/setup/` 之前，先把 repo-local preflight 的确定性资产迁到新落点，避免新入口只剩文案没有脚本。

### 这一步是阻断项，不是建议项
以下两个资产必须在 hard-cut 前完成迁移：

- `skills/setup/scripts/check-health`
- `skills/setup/references/config-template.yaml`

### 推荐新落点
- `skills/spec-mcp-setup/scripts/check-health`
- `skills/spec-mcp-setup/references/config-template.yaml`

### 原因
- hard-cut 删除 `skills/setup/` 后，这两个文件不能再留在旧目录
- 它们承载的是 Phase A 的确定性逻辑，不是可选文案
- 如果不先迁，`spec-mcp-setup` 就无法真正吸收 repo-local preflight 责任

### 注意
这里采用的是“最小重定位”方案，而不是本批次再做更中性的目录重构。更中性的 project config 目录抽离，可以留到后续独立重构，不应和这次 hard-cut 混在一起。

---

## Step 1：把 `spec-mcp-setup` 扩成唯一 source of truth

### 目标
将原 `setup` 的 repo-local preflight 能力直接并入 `skills/spec-mcp-setup/SKILL.md`，并让 runtime command 侧同步暴露该能力。

### 必改文件
- `skills/spec-mcp-setup/SKILL.md`
- `docs/10-prompt/skills/spec-mcp-setup/SKILL.md`
- `docs/10-prompt/skills/spec-mcp-setup/execution-flow.md`
- `skills/spec-mcp-setup/references/supported-mcp-tools.md`
- `templates/claude/commands/spec/mcp-setup.md`
- `skills/spec-mcp-setup/scripts/check-health`
- `skills/spec-mcp-setup/references/config-template.yaml`

### 变更要求
1. 在 `spec-mcp-setup` 前半段新增/重构一个明确的 **Project/Repo Setup Preflight** 阶段。
2. 把原 `setup` 的以下职责迁入：
   - `check-health` 输出展示
   - legacy CE cleanup guidance
   - `.spec-first/config.local.*` bootstrap 约定
   - `.gitignore` 覆盖提示
   - helper tools 安装引导
3. 保持 `mcp-tools.json` 继续只管理 MCP tool registry，不把 repo-local config 或 helper tools 塞进其中。
4. `supported-mcp-tools.md` 仅扩写 workflow 边界说明，不把非 MCP helper tools 冒充成 MCP tool catalog。
5. `templates/claude/commands/spec/mcp-setup.md` 的运行时入口文案必须显式承接原 `setup` 的 repo-local preflight 说明，不只是保留“安装 MCP tools”的旧表述。

### 关键约束
- 不新增第二份 machine-readable MCP registry
- 不改变 `detect-tools.sh` 的 baseline 语义
- 不改变 ledger v1 schema
- `check-health` 的输出可以继续是 preflight 展示输入，但不得写入 readiness ledger
- Phase A 的 machine truth 仍只来自迁移后的 `check-health`

---

## Step 2：统一所有入口与提示语

### 目标
在删除 `setup` surface 之前，先把所有旧入口指向替换为 `spec-mcp-setup`，避免 hard-cut 后残留死链接。

### 统一后的唯一入口
- Claude：`spec-mcp-setup`
- Codex：`spec-mcp-setup`

### 必改文件
- `skills/using-spec-first/SKILL.md`
- `src/context-routing/verifier-registry.js`
- `skills/test-browser/SKILL.md`
- `skills/feature-video/references/tier-browser-reel.md`
- `README.md`
- `README.zh-CN.md`
- `docs/项目介绍/README.md`
- 其他 grep 到的 `spec-setup`、`$setup`、`spec-setup`、`setup skill` 引用

### 具体要求
1. `using-spec-first` 中关于 setup 请求的路由规则必须改到：
   - Claude：`spec-mcp-setup`
   - Codex：`spec-mcp-setup`
2. 所有原 `setup_hint` 改为 `spec:mcp-setup`
3. 清理 `$setup` / `spec-setup` 漂移
4. README / README.zh-CN` 中原有独立 `Setup | spec-setup | spec-setup` 行应删除，而不是仅做字符串替换；唯一保留的 setup 类入口应是 `mcp-setup`
5. `feature-video`、`test-browser` 等下游 guidance 文案必须同步迁移，不能只改测试不改 source

### 历史文档处理边界
- 产品面 / 当前真相源 / 当前运行时相关文档：必须同步
- `docs/plans/**`、`docs/brainstorms/**`、`docs/业界分析/**` 等历史文档：原则上不全文批量改写
- 若某些历史文档仍被当前 README / skill 主链直接引用，则可补一个“已被 `spec-mcp-setup` 替代”的注记，但不重写原始历史语境

### 提示面清零验收规则（必须项）

以下三类 surface 中，旧入口必须清零：

1. **产品面 / source-facing**
   - skills
   - templates
   - README / docs
   - verifier registry / routing docs
2. **runtime 面 / generated assets**
   - `spec-first init --claude` 生成结果
   - `spec-first init --codex` 生成结果
3. **test-facing**
   - unit / smoke / contract tests 中的当前断言与示例文本

允许保留旧入口的唯一情况：
- 历史文档
- “已移除说明”语境

不允许出现的情况：
- 当前产品面仍提示 `spec-setup`
- runtime 产物仍暴露 `setup` command / skill
- 当前测试断言仍把旧入口当作现行 contract

---

## Step 3：硬切测试合同与 runtime 断言

### 目标
在真正删除 `setup` source 之前，先把测试与 runtime 断言从“依赖 setup 独立存在”改成“依赖 mcp-setup 单入口承载完整语义”。

### 必改/删除文件
- 删除或重写 `tests/unit/setup.sh`
- 修改 `tests/smoke/cli.sh`
- 修改 `tests/unit/dual-host-governance-contracts.test.js`
- 修改 `tests/unit/skills-governance-contracts.test.js`
- 修改 `tests/unit/asset-consistency.test.js`
- 修改 `tests/unit/test-browser-contracts.test.js`
- 修改 `tests/unit/feature-video-contracts.test.js`
- 修改 `tests/unit/verification-gate-state.test.js`
- 扩展 `tests/unit/mcp-setup.sh`

### 迁移要求

#### 删除 setup 独立存在性断言
不再断言以下文件必须存在：
- `skills/setup/SKILL.md`
- `docs/10-prompt/skills/setup/SKILL.md`
- `templates/claude/commands/spec/setup.md`

#### 新增/强化 mcp-setup 吸收后的断言
需要新增或强化以下断言：
- `spec-mcp-setup` skill 文本包含 repo-local preflight 阶段
- `templates/claude/commands/spec/mcp-setup.md` 的 runtime 文案承接了原 setup 的 repo-local preflight 责任
- `spec-mcp-setup` 仍保持 ledger v1 contract
- `baseline_ready` 语义未被 repo-local setup 污染
- Serena pending / failed / ready 三态不变
- graph-bootstrap 仍按 readiness ledger 消费，不回退到旧 `setup_success`
- `verification_gate_state` blocker 中的 `setup_hint` 已切到 `spec:mcp-setup`
- `feature-video` / `test-browser` 的 source 与 test 都不再引用 `spec-setup`

### smoke 特别要求
`tests/smoke/cli.sh` 不只是删除 `setup.md` 文件存在性断言，还必须同步处理：
- runtime command 文件数量变化
- workflow skill 数量变化
- `.claude/commands/spec/setup.md` 的旧内容断言迁移到 `mcp-setup.md`（如 `.spec-first/config.local.yaml` 可见性）
- pack 产物不再包含 `skills/setup/**` 与 `templates/claude/commands/spec/setup.md`

### runtime/tests 同步的硬验收（必须项）

在 hard-cut 完成后，必须能明确证明：

1. `spec-first init --claude` 生成结果中：
   - 不再出现 `setup.md`
   - 不再出现 `setup` workflow skill surface
   - `mcp-setup` 仍存在且承载 repo-local preflight 可见内容
2. `spec-first init --codex` 生成结果中：
   - 不再出现 `setup` workflow skill surface
   - `mcp-setup` 仍存在且承载 repo-local preflight 可见内容
3. `tests/smoke/cli.sh` 与相关 contract tests：
   - 已同步更新 command 数量断言
   - 已同步更新 workflow skill 数量断言
   - 已同步更新 filtered asset set / 打包产物预期

这一步不是“把文件名删掉”即可，而是要证明 runtime 资产与测试合同已经整体切换到新入口。

### `tests/unit/setup.sh` 处理策略（定死）

本次 hard-cut 采用以下策略，不保留二选一歧义：

- **删除 `tests/unit/setup.sh`**
- 将其中仍有价值的合同迁移到：
  - `tests/unit/mcp-setup.sh`
  - `tests/smoke/cli.sh`
  - 相关 governance / asset consistency tests

原因：
- hard-cut 后不再制度化保留旧 `setup` surface
- 避免新增长期“已移除 setup”专属测试负担

---

## Step 4：调整 plugin manifest 与双宿主治理真相源

### 目标
在 source、下游引用、测试准备完毕后，再删除 `setup` 的 command / skill surface，确保 runtime 资产生成与 governance contract 一次性对齐。

### 必改文件
- `.claude-plugin/plugin.json`
- `src/cli/contracts/dual-host-governance/skills-governance.json`

### 具体要求

#### `plugin.json`
- 从 `commands[]` 删除：
  - `name: "setup"`
  - `filename: "setup.md"`
  - `skill: "setup"`
- 从 `skills[]` 删除：
  - `setup`

#### `skills-governance.json`
- 删除 `setup` 对应的治理记录
- 保留 `spec-mcp-setup` 为唯一 setup 类 workflow command

### 风险控制
`src/cli/plugin.js` 对 `manifest.commands` 与 `skills-governance` 有强校验；必须成对修改，不能只改其一。

### 顺序要求
这一步必须发生在：
- `spec-mcp-setup` 已能承接完整 source 语义之后
- 所有 setup 提示面已替换之后
- 主要 contracts/smoke 已改为新入口之后

不能先删 manifest/governance 再回头补 source/test。

---

## Step 5：硬删独立 `setup` source surface

### 目标
删除 setup 作为独立 workflow 的全部 source-of-truth 与 runtime source。

### 删除文件
- `skills/setup/SKILL.md`
- `templates/claude/commands/spec/setup.md`
- `docs/10-prompt/skills/setup/SKILL.md`
- `skills/setup/scripts/check-health`
- `skills/setup/references/config-template.yaml`

### 处理原则
- 不保留 deprecated shim
- 不保留空壳 command
- 不保留“请改用”的中间态

这意味着迁移一旦合入，`spec-setup` 立即失效，唯一入口是 `spec-mcp-setup`。

---

## Step 6：清理运行时资产与打包面

### 目标
让 init / smoke / pack 后的运行时资产只包含 `mcp-setup`，不再包含 `setup`。

### 核心影响面
- Claude runtime command 集不再生成 `setup.md`
- Codex runtime workflow skill 不再包含 `setup`
- 打包产物中不再包含：
  - `skills/setup/**`
  - `templates/claude/commands/spec/setup.md`

### 受影响文件
- `tests/smoke/cli.sh`
- `src/cli/plugin.js`（通常通过真相源变更间接受影响；如测试需要特殊适配再处理）

### 验收要求
hard-cut 后要能明确证明：
- runtime 中仍有 `mcp-setup` 作为唯一 setup 入口
- runtime 中已无 `setup` 残留 command/skill
- `mcp-setup` 的 runtime 内容对用户仍可见 repo-local preflight 阶段
- runtime 数量断言与打包内容断言已同步切换到新入口

---

## 文件变更矩阵

## A. 必须修改

### workflow / docs 真相源
- `skills/spec-mcp-setup/SKILL.md`
- `docs/10-prompt/skills/spec-mcp-setup/SKILL.md`
- `docs/10-prompt/skills/spec-mcp-setup/execution-flow.md`
- `skills/spec-mcp-setup/references/supported-mcp-tools.md`
- `templates/claude/commands/spec/mcp-setup.md`
- `skills/spec-mcp-setup/scripts/check-health`
- `skills/spec-mcp-setup/references/config-template.yaml`

### 删除的 setup 真相源
- `skills/setup/SKILL.md`
- `templates/claude/commands/spec/setup.md`
- `docs/10-prompt/skills/setup/SKILL.md`
- `skills/setup/scripts/check-health`
- `skills/setup/references/config-template.yaml`

### governance / manifest
- `.claude-plugin/plugin.json`
- `src/cli/contracts/dual-host-governance/skills-governance.json`

### 下游引用 / 路由 / 产品面
- `skills/using-spec-first/SKILL.md`
- `src/context-routing/verifier-registry.js`
- `skills/test-browser/SKILL.md`
- `skills/feature-video/references/tier-browser-reel.md`
- `README.md`
- `README.zh-CN.md`
- `docs/项目介绍/README.md`
- 其他 grep 命中的 setup 入口文案

### 测试
- `tests/smoke/cli.sh`
- `tests/unit/dual-host-governance-contracts.test.js`
- `tests/unit/skills-governance-contracts.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/unit/test-browser-contracts.test.js`
- `tests/unit/feature-video-contracts.test.js`
- `tests/unit/verification-gate-state.test.js`
- `tests/unit/mcp-setup.sh`
- `tests/unit/setup.sh`（删除）

### 版本记录
- `CHANGELOG.md`

## B. 不纳入本次 hard-cut 的扩张项
- 不在本批次新建更中性的 project config 目录
- 不在本批次重构 helper tools 的独立 machine-readable catalog
- 不在本批次改动 readiness ledger schema
- 不在本批次扩大 `mcp-tools.json` 的职责边界

---

## 风险分析

## 风险 1：`baseline_ready` 被误扩成“泛 setup 完成”

### 表现
graph-bootstrap 会把 repo-local config / helper tools 的状态误当作 MCP baseline readiness。

### 控制
- 不修改 `detect-tools.sh` 的 required MCP baseline 核心定义
- 不把 repo-local config、legacy cleanup、helper tools 写入 required MCP tool readiness
- `tests/unit/mcp-setup.sh` 增加保护性断言

---

## 风险 2：Serena bootstrap 合同被弱化

### 表现
`.serena/project.yml` 存在就被误判为 ready。

### 控制
- 保持 `.serena/project.yml` + `.serena/index-ready.json` 双条件
- 不放松 `project_status = failed/pending/ready` 的既有语义

---

## 风险 3：双宿主入口继续漂移

### 表现
部分 source/docs/tests 仍保留 `$setup` / `spec-setup` / `spec-setup`。

### 控制
- 全仓 grep 清零旧入口
- `using-spec-first`、`verifier-registry`、`feature-video`、`test-browser` 必须纳入 hard-cut 同批修改
- 统一改为 `spec-mcp-setup`

---

## 风险 4：manifest / governance / smoke 三者失配

### 表现
`validateSkillsGovernance()`、runtime asset sync、smoke tests 同时爆炸。

### 控制
- 先完成 source / hint / tests 的新入口替换，再改 `plugin.json` + `skills-governance.json`
- 不做“先删文件后补 manifest”的半成品状态
- smoke 中的 setup runtime 语义必须迁到 mcp-setup，不只是删文件名

---

## 风险 5：一次性硬切导致用户断裂

### 这是本方案接受的代价
因为用户明确要求“一次性彻底迁移”，本方案**不保留兼容壳**。

因此必须在 PR / CHANGELOG / README 中明确说明：
- `spec-setup` 已移除
- 请改用 `spec-mcp-setup`

---

## 风险 6：deterministic assets 迁移不完整，导致新入口空心化

### 表现
`spec-mcp-setup` 文案中描述了 repo-local preflight，但 `check-health` / `config-template.yaml` 仍留在已删除的旧目录或路径失效。

### 控制
- `check-health` 与 `config-template.yaml` 从“建议项”升格为 hard-cut 前必须迁移项
- 先迁资产、再改 source、再删旧目录
- 为新路径补测试断言

---

## 脚本与模板迁移落点

### `skills/setup/scripts/check-health`
必须迁移到：
- `skills/spec-mcp-setup/scripts/check-health`

原因：
- 它承载的是 setup preflight 的确定性逻辑
- 一次性 hard-cut 后不应继续挂在已删除的 `skills/setup/` 下

### `skills/setup/references/config-template.yaml`
本次 hard-cut 采用最小重定位方案，迁移到：
- `skills/spec-mcp-setup/references/config-template.yaml`

说明：
- 这在目录语义上并不完美，但本次优先保证 hard-cut 闭环完成
- 后续若要进一步纯化目录语义，可单独做一次“project config references 抽离”重构

---

## 验证方案

## 1. 静态验证

### 全仓 grep
确认以下入口已被彻底替换：
- `spec-setup`
- `$setup`
- `spec-setup`

允许保留的唯一情况：
- 历史版本记录 / 历史文档说明中以“已移除/历史背景”形式出现

### 全仓 grep 重点文件
至少确认以下 source/runtime-facing 文本已切换：
- `skills/using-spec-first/SKILL.md`
- `src/context-routing/verifier-registry.js`
- `skills/test-browser/SKILL.md`
- `skills/feature-video/references/tier-browser-reel.md`
- `README.md`
- `README.zh-CN.md`

## 2. 合同与单测

至少执行：

```bash
npm run lint:skill-entrypoints
npm run test:unit -- tests/unit/dual-host-governance-contracts.test.js --runInBand
npm run test:unit -- tests/unit/skills-governance-contracts.test.js --runInBand
npm run test:unit -- tests/unit/asset-consistency.test.js --runInBand
npm run test:unit -- tests/unit/verification-gate-state.test.js --runInBand
npm run test:unit -- tests/unit/test-browser-contracts.test.js --runInBand
npm run test:unit -- tests/unit/feature-video-contracts.test.js --runInBand
bash tests/unit/mcp-setup.sh
bash tests/smoke/cli.sh
```

`tests/unit/setup.sh` 本次应删除，不再保留为 removed-surface 专项测试。

## 3. 运行时验证

```bash
spec-first init --claude --dry-run
spec-first init --codex --dry-run
spec-first doctor --claude
spec-first doctor --codex
```

重点检查：
- Claude runtime 不再生成 `setup.md`
- Codex runtime 不再生成 `setup` workflow skill
- `mcp-setup` 仍正常出现在 workflow surface 中
- `mcp-setup` 的 runtime 内容已能体现 repo-local preflight 阶段

## 4. graph-bootstrap 回归验证

重点确认：
- `spec-graph-bootstrap` 仍消费 readiness ledger v1
- 不出现对旧 `setup_success` 的回退
- Serena readiness gate 语义不变

---

## 预期结果

完成本次 hard-cut 后，仓库的 setup 语义收口为：

- **唯一入口**：`spec-mcp-setup`
- **唯一 setup workflow 真相源**：`skills/spec-mcp-setup/SKILL.md`
- **唯一 MCP machine truth**：`skills/spec-mcp-setup/mcp-tools.json`
- **唯一 host readiness machine truth**：`host-setup.json` ledger v1
- **唯一 repo-local preflight deterministic assets 落点**：`skills/spec-mcp-setup/scripts/check-health` 与 `skills/spec-mcp-setup/references/config-template.yaml`

被消除的历史负担：

- 独立 `setup` workflow
- `spec-setup` 入口
- `$setup` / `spec-setup` 文案漂移
- setup 与 mcp-setup 双入口认知负担

---

## 实施顺序（严格版）

一次性 hard-cut 必须按以下顺序执行，不能乱序：

1. **先迁 deterministic assets**
   - 迁 `check-health`
   - 迁 `config-template.yaml`
2. **再改 `spec-mcp-setup` source + docs mirror + command template`**
   - 让唯一入口先具备完整语义
3. **再改所有旧入口提示面**
   - `using-spec-first`
   - `verifier-registry`
   - `test-browser`
   - `feature-video`
   - README / docs
4. **再改 tests / smoke / contract 断言**
   - 让测试先接受新入口与新 runtime 语义
5. **最后同一批提交内改 `plugin.json` + `skills-governance.json` 并删除 `setup` source**
6. **补 `CHANGELOG.md`**
7. **完整跑 lint + unit + smoke + init/doctor 验证**

原因：
- 这是 hard-cut，不允许仓库中间出现“入口已删但 deterministic assets / tests / 下游提示还没改完”的半完成状态。

---

## Changelog 要求

本次若进入实施，必须在根目录 `CHANGELOG.md` 追加记录，摘要建议类似：

- `refactor(setup): 硬切移除独立 setup workflow，将 repo-local preflight 全量并入 spec-mcp-setup，统一唯一 setup 入口为 spec-mcp-setup 与 spec-mcp-setup，并同步收口双宿主治理、runtime assets、README 与 contract tests (user-visible)`

---

## 结论

这是一个**可以做，并且在补齐了 Phase A machine truth 约束 + 提示面清零验收 + runtime/tests 硬验收后，已经达到可执行级别**的 hard-cut 方案。

它的价值在于：
- 统一 setup 入口
- 删除重复 workflow surface
- 降低双宿主治理复杂度
- 收敛长期真相源

它的代价在于：
- 无兼容期
- 改动面横跨 skill / scripts / references / template / plugin / governance / docs / tests / runtime
- 必须在单批次内完成，不适合半改

如果目标是“彻底收口而不是平滑过渡”，并且能严格按本文顺序执行，这就是当前仓库可执行的一次性迁移方案。
