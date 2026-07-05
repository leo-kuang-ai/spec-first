---
title: repo-profile standalone refresh skill 计划
created: 2026-04-22
status: completed
owner: engineering
origin: 当前对话；延续 `docs/plans/2026-04-21-002-feat-init-shared-spec-seeds-plan.md` 对 shared seed 的后续决策
scope: 新增 standalone skill `spec-repo-profile-refresh`，显式读取仓库事实与 `.spec-first/specs/repo-profile.yaml`，生成 repo-level 规范补全建议并支持受控写回；不改 `init` 主链，不自动触发，不扩展到 state/gate/runtime 编排
---

# repo-profile standalone refresh skill 计划

## 完成说明

本计划的第一版最小闭环已完成，当前状态收口为 `completed`。

已完成项：

1. 新增 standalone skill `spec-repo-profile-refresh`
2. 补齐 prompt mirror、dual-host governance 与合同测试
3. 补齐最小用户文档、版本说明与 changelog
4. 明确边界：默认 preview-first、只维护 `.spec-first/specs/repo-profile.yaml` 允许字段、`spec-graph-bootstrap` 为推荐上游上下文但不是硬前置

本次收口不包含后续增强项，例如 `spec-plan` 消费可观测性、field-level patch preview 或 advisory 提示。

## 1. 背景与问题定义

`spec-first init --claude` / `--codex` 已经会创建 `.spec-first/specs/repo-profile.yaml` 与 `README.md`，但当前内容仍然是 deterministic seed：

- `repo_id`
- `languages`
- `project_type`（仅强信号）
- `project_intent.summary`（manifest / README 摘要）

这层 seed 解决了“统一位置创建 repo-level scaffold”的问题，但没有解决“后续如何用 LLM 补全 repo-level 长期规范”的问题。

如果把这件事继续塞进现有主链，会带来明显边界问题：

- 挂到 `init`
  - 会把初始化从 deterministic scaffold 创建器做重成 repo 语义分析器
- 挂到 `spec-plan`
  - 会让 planning workflow 顺手承担 repo-level 规范维护职责
- 挂到 `spec-work`
  - 会让 feature execution 顺手改长期规范，边界过宽
- 挂到 `spec-code-review`
  - review 可以指出缺口，但不应成为 repo truth 源维护器

因此，最合理的后续路线不是扩张现有 workflow，而是提供一个显式触发、边界独立的 standalone skill，专门负责 repo-profile 的建议补全与受控更新。

### 1.1 为什么现在值得做

这个需求只有在以下条件同时成立时才值得做：

1. 它补的是 shared seed 的“语义补全链路”，而不是再发明一套新的规范系统。
2. 它保持显式触发，不把 LLM 写回隐藏进 `init` / `plan` / `work` 的默认链路。
3. 它继续遵守“轻 contract + 明确边界 + 让 LLM 决策”。

如果做成独立 skill，它就能和现有 deterministic seed 明确分层：

- `init`
  - 创建保守 seed
- `spec-repo-profile-refresh`
  - 基于仓库事实做语义补全建议

### 1.2 不值得继续做大的信号

如果出现以下任一情况，不应继续扩张这个能力：

1. 用户并不愿意维护 `repo-profile.yaml`，即使 skill 提供了建议补全也很少采纳。
2. 该 skill 需要越来越多 scratch state、routing、gates 或自动触发逻辑才能成立。
3. skill 产出的补全经常与仓库事实冲突，导致用户主要在清理错误建议。
4. 该 skill 开始承担 `docs/contexts/`、runtime state 或 workflow state 的职责。

## 2. 决策摘要

本计划确认以下决策：

1. 新增 standalone skill：`spec-repo-profile-refresh`
2. 它是 `standalone_skill`，不是 `workflow_command`
3. 它是 `dual_host` 能力，Claude / Codex 都通过 skill 交付，不生成 `spec-*` command
4. 默认交互模式为 preview-first：
   - 先生成建议
   - 用户确认后再写回
5. 第一版只维护 `.spec-first/specs/repo-profile.yaml`
6. 第一版主要补全这些字段：
   - `project_intent.summary`
   - `principles`
   - `non_negotiables`
   - `review_defaults`
7. 第一版不主动重写以下字段，除非证据非常强且用户明确要求：
   - `repo_id`
   - `languages`
   - `project_type`
8. skill 只读取 repo facts 与现有 seed，不写 runtime state / verification state / workflow state
9. skill 不自动在 `init`、`spec-plan`、`spec-work`、`spec-code-review` 中触发
10. 第一版不引入新的 `.spec-first/workflows/<...>/` scratch 状态体系

## 3. 目标与非目标

### 3.1 目标

1. 提供一个显式调用的 skill，用于补全 `.spec-first/specs/repo-profile.yaml`
2. 让 deterministic seed 与 LLM semantic refresh 分层清晰
3. 默认先预览建议，再写回
4. 补全后的内容保持 repo-level normative scaffold 语义，不混入 runtime / gate / task state
5. 新 skill 满足双宿主治理、prompt mirror、打包与 contract test 要求

### 3.2 非目标

1. 不让 `init` 自动调用该 skill
2. 不把该 skill 做成 command-backed workflow
3. 不让 `spec-plan` / `spec-work` 自动写回 repo-profile
4. 不在第一版维护多文件 profile system
5. 不在第一版引入持久 run artifact / workflow state / gate state
6. 不在第一版把 `docs/contexts/` 与 `repo-profile.yaml` 做双向同步
7. 不在第一版直接修改 `doctor` / `clean` / managed state 边界

## 4. 需求追踪

本计划直接对应当前讨论中的需求与约束：

1. repo-profile 的后续补全应由单独一个 skill 承担
2. 它应该是显式触发的 skill，不是隐藏在现有 workflow 里的自动步骤
3. 它应该先给建议，再决定是否写回
4. 它只补 repo-level normative scaffold，不补 runtime / workflow / gate 类信息
5. 它应与当前 shared seed 方案保持一致：保守、可编辑、低误导

## 5. 设计原则

1. 职责分层明确
   - `init` 负责 deterministic seed
   - refresh skill 负责 semantic补全建议
2. 显式触发优先
   - 不做自动触发，不做隐式写回
3. preview-first
   - 默认先展示建议，再允许写回
4. 只补 normative scaffold
   - 不越界到 runtime / gate / workflow artifacts
5. 优先事实支撑
   - LLM 补全必须建立在 manifest / README / code facts / 已有 seed 之上
6. 宁缺勿乱写
   - 没有足够依据时保留空值或保持原样

## 6. 方案设计

### 6.1 Skill 定位与宿主交付

新 skill 以 source-of-truth 形式落在：

- `skills/spec-repo-profile-refresh/SKILL.md`

对应 prompt mirror：

- `docs/10-prompt/skills/spec-repo-profile-refresh/SKILL.md`

双宿主治理目标：

- `entry_surface = standalone_skill`
- `host_scope = dual_host`
- `host_delivery.claude = skill`
- `host_delivery.codex = skill`

这意味着：

- 它不进入 `.claude-plugin/plugin.json` commands
- 不生成 Claude `spec-*` command 文件
- 不生成 Codex workflow command surface
- 只作为用户可发现的 skill 交付

### 6.2 输入面

第一版建议读取以下输入，按优先级由强到弱使用：

1. `.spec-first/specs/repo-profile.yaml`
2. `README.md` / `README.zh-CN.md`
3. `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod`
4. `docs/contexts/<slug>/00-summary.md`
5. `docs/contexts/<slug>/code-facts/public-entrypoints.md`
6. `docs/contexts/<slug>/code-facts/test-map.md`

其中：

- `repo-profile.yaml` 是待更新目标，不是无条件真相源
- `docs/contexts/` 是事实型辅助输入，不是规范写回模板

### 6.3 输出模式

第一版只支持两类输出模式：

1. `preview`
   - 输出建议补全内容
   - 指出修改理由
   - 不写文件
2. `apply`
   - 在 preview 基础上写回 `.spec-first/specs/repo-profile.yaml`
   - 仅更新允许字段

默认使用 `preview`。

### 6.4 字段更新策略

#### 默认可补全字段

- `project_intent.summary`
- `principles`
- `non_negotiables`
- `review_defaults`

这些字段的共同特点：

- 属于 repo-level 长期语义
- deterministic seed 无法可靠生成
- 适合通过 LLM 基于仓库事实给出建议初稿

#### 默认不主动改动字段

- `repo_id`
- `languages`
- `project_type`

原因：

- 这三类字段更接近事实层或弱事实层
- 第一版 refresh skill 不应变成 repo 自动分类器
- 只有在用户明确要求修正且证据充分时，才允许建议修改

### 6.5 写回边界

写回 `.spec-first/specs/repo-profile.yaml` 时，必须保持以下边界：

1. 不新增 runtime / workflow / gate 类字段
2. 不写入 task-specific requirements
3. 不写入 verifier dispatch / routing / state machine
4. 不覆盖用户未授权变更范围之外的字段
5. 保持 YAML 结构稳定，不把文件重写成新 schema

### 6.6 与现有 workflow 的关系

#### `init`

- 继续只创建 deterministic seed
- 不自动触发 refresh skill

#### `spec-plan`

- 继续只消费 `.spec-first/specs/repo-profile.yaml`
- 若发现关键字段为空，可以建议用户运行 `spec-repo-profile-refresh`
- 不默认写回

#### `spec-work`

- 不负责更新 repo-profile

#### `spec-code-review`

- 可以指出 repo-profile 不完整或与仓库事实明显冲突
- 但不负责补全写回

#### `spec-graph-bootstrap`

- 继续只产 facts
- 不写 normative scaffold

## 7. 实施单元

## Unit 1: 新增 standalone skill 合同与参考文档

### Goal

定义 `spec-repo-profile-refresh` 的用户契约、输入边界、输出模式和写回规则。

### Files

- `skills/spec-repo-profile-refresh/SKILL.md`
- `docs/10-prompt/skills/spec-repo-profile-refresh/SKILL.md`
- 可选参考：
  - `skills/spec-repo-profile-refresh/references/*.md`

### Decisions

1. 这是 standalone skill，不是 workflow command
2. 默认 preview-first
3. 第一版只维护 `repo-profile.yaml`
4. 第一版不引入持久 workflow scratch artifact

### Test Scenarios

1. skill frontmatter 合法
2. source 与 prompt mirror 关键合同锚点一致
3. 文案明确“preview 默认、apply 可选”
4. 文案明确不属于 `spec-*` command

## Unit 2: 双宿主治理与交付接线

### Goal

确保新增 skill 满足双宿主治理 contract，并能进入现有打包与 runtime 交付链。

### Files

- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `docs/contracts/dual-host-governance/README.md`
- 如现有打包/过滤逻辑需要：
  - `src/cli/plugin.js`
  - 相关 manifest / tests

### Decisions

1. `entry_surface = standalone_skill`
2. `host_scope = dual_host`
3. `host_delivery.claude = skill`
4. `host_delivery.codex = skill`
5. 不新增 command name

### Test Scenarios

1. 治理 contract 测试通过
2. 运行时 skill 目录能被正确打包/交付
3. 不会错误生成 command-backed workflow 入口

## Unit 3: repo-profile 分析与建议补全主链

### Goal

让 skill 能读取仓库事实、分析现有 seed，并生成可解释的补全建议。

### Files

- `skills/spec-repo-profile-refresh/SKILL.md`
- 如需辅助 prompt/reference：
  - `skills/spec-repo-profile-refresh/references/field-policy.md`
  - `skills/spec-repo-profile-refresh/references/update-rubric.md`

### Decisions

1. 读取现有 `repo-profile.yaml` 时保留未修改字段
2. 仅对允许字段给出建议
3. 每类建议都需要说明依据来自哪里
4. 没有足够依据时保持空值或保留原值

### Test Scenarios

1. 合同文本明确输入优先级
2. 合同文本明确默认可补全字段与默认不主动改动字段
3. 合同文本明确不写 runtime / gate / workflow state

## Unit 4: preview / apply 写回边界与文档收口

### Goal

让用户清楚知道 skill 的使用方式、写回边界以及与现有 shared seed 的关系。

### Files

- `docs/05-用户手册/README.md`
- `docs/05-用户手册/02-核心概念.md`
- `docs/08-版本更新/README.md`
- `CHANGELOG.md`（若开始实现）

### Decisions

1. 用户文档要明确：`init` 创建 seed，refresh skill 负责建议补全
2. 文档要明确：默认 preview，不是自动写回
3. 若开始实现源码，必须同步更新 `CHANGELOG.md`

### Test Scenarios

1. 用户文档不会把该 skill 描述成 `init` 的自动步骤
2. 文档不会把它描述成新的 workflow command

## 8. 推荐测试文件

建议新增或修改以下测试：

- `tests/unit/spec-repo-profile-refresh-contracts.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/unit/skills-governance-contracts.test.js`
- 如 runtime 交付链需要：
  - `tests/smoke/cli.sh`

其中：

- `spec-repo-profile-refresh-contracts.test.js`
  - 锁 skill 合同、mirror 对齐、preview/apply 语义与字段边界
- `asset-consistency.test.js`
  - 锁 source/mirror 锚点一致性
- `skills-governance-contracts.test.js`
  - 锁 standalone skill 治理分类与 host delivery

## 9. 风险与缓解

### 风险 1：skill 再次把 shared seed 做重

缓解：

- 第一版只补一个文件
- 默认 preview-first
- 不引入 scratch state / workflow state

### 风险 2：LLM 建议与仓库事实冲突

缓解：

- 明确输入优先级
- 每类建议都要求给出依据
- 无充分依据则保留空值或原值

### 风险 3：边界漂移回 `init` / `spec-plan`

缓解：

- 文档与合同中明确写死：
  - `init` 不自动触发
  - `spec-plan` 只建议，不写回

### 风险 4：新增 skill 后双宿主治理漂移

缓解：

- 同步更新 governance json 与 docs contract
- 补 contract tests 锁边界

## 10. 执行顺序

1. 明确 skill 命名与 host governance 分类
2. 编写 `skills/spec-repo-profile-refresh/SKILL.md`
3. 补 prompt mirror
4. 更新 dual-host governance 真源与文档
5. 增加 contract tests
6. 如需要，再补最小用户手册说明
7. 最后再决定是否进入实现阶段

## 11. 最小可行闭环

如果要验证这个能力是否值得存在，最小闭环应是：

1. `spec-first init --claude` / `--codex` 创建 `.spec-first/specs/repo-profile.yaml`
2. 用户显式运行 `spec-repo-profile-refresh`
3. skill 基于仓库事实输出 `project_intent.summary / principles / non_negotiables / review_defaults` 的建议补全
4. 用户确认后写回同一文件
5. `spec-plan` 在后续 planning 中消费补全后的非空字段

只要这条闭环稳定成立，这个 skill 就不是“又一个独立 prompt”，而是 shared seed 的明确补全链路。

## 12. Verification

以下证据同时成立，才算该计划实施完成：

1. 新 skill 以 `standalone_skill` 形式存在于 source tree
2. source skill 与 prompt mirror 对齐
3. dual-host governance 真源已补齐对应记录
4. skill 合同明确 preview / apply 两种模式
5. skill 合同明确默认可补全字段与默认不主动改动字段
6. skill 合同明确不属于 `spec-*` workflow command
7. contract tests 能防止 host delivery 或写回边界回归

以下任一情况仍算未完成：

1. 该能力仍然依赖挂进 `init` 主链才成立
2. 文案把 standalone skill 写成 command-backed workflow
3. 写回边界允许 runtime / workflow / gate state 混入 `repo-profile.yaml`
4. 实施后仍无法清楚回答“谁负责创建 seed，谁负责补全 seed”

## 13. 后续演进方向

本计划完成后，可在后续独立迭代中评估：

1. 是否允许 `spec-plan` 在字段为空时主动提示运行 `spec-repo-profile-refresh`
2. 是否为该 skill 增加更细的字段级 patch 预览
3. 是否需要引入“建议补全但不自动 apply”的更细交互模式
