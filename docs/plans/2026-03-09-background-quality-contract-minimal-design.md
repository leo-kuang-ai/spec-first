# Background Quality Contract Minimal Design

**Date:** 2026-03-09
**Scope:** `skills/spec-first/01-init`, `skills/spec-first/08-review`, `skills/spec-first/12-verify`, `skills/spec-first/14-status`, `skills/spec-first/21-analyze`, shared doc contract, shared doc tests

## Goal

以最小补丁方式为 `spec-first` 建立“背景质量”共享契约，确保多个 skill 对以下横切语义保持一致：

1. 背景输入是否完整。
2. runtime 真源是否可信。
3. docs 投影视图是否与 runtime 同步。
4. 分析 / 状态 / 验证输出中的背景字段、枚举、严重度底线不再手工漂移。

本轮目标是建立 **shared contract + shared tests**，而不是引入新的模板引擎或文档生成系统。

## Current Problems

### 1. 背景质量已成为横切语义，但仍在分散维护

当前 `spec-first` 共 `20` 个 skill，其中至少 `14` 个 skill 已直接引用背景质量相关字段或概念。这意味着它已经不是 `21-analyze` 的局部规则，而是平台级流程语义。

典型分布：

- `01-init` 负责生成和写入背景状态。
- `08-review` 把背景状态作为审查输入元数据。
- `12-verify` 在高风险验证中显式声明背景依赖。
- `14-status` 负责展示背景状态卡片。
- `21-analyze` 负责输出背景质量结论并做严重度判定。

### 2. 已出现真实漂移

现状已经存在以下不一致：

- 命名漂移：`backgroundInputStatus` 与 `background_input_status` 并存。
- 责任漂移：有的 skill 只声明背景状态，有的 skill 输出完整结论，但没有共享边界。
- 规则漂移：严重度判定集中在 `21-analyze`，其他 skill 没有共享底线。
- 模板漂移：主文档、reference、示例报告、测试需要手工同步，容易漏改。

### 3. 代码层已具备事实真源，文档层尚未形成统一契约

runtime / gate 代码已经读取背景状态并输出风险，但文档层没有一个统一、可复用、可测试的约束中心，导致每次演进都需要跨多个 skill 手工修补。

## Design Decisions

### 1. 采用“共享契约 + 共享测试”，不做重型抽象

本轮采用以下策略：

- 新增一份共享 contract 文档，定义背景质量的最小公共语义。
- 新增一组共享测试，验证关键 skill 对该 contract 的遵守情况。
- 保留各 skill 自己的执行语义、输出结构和细节扩展。

本轮明确不做：

- 模板引擎
- markdown include 体系
- 自动生成所有 skill reference
- 为统一命名而改动大量 runtime 代码

### 2. 显式区分“内部字段名”和“文档输出字段名”

为避免一次性代码改造过大，V1 采用双层命名规则：

- **代码 / runtime / JSON 内部字段**：`backgroundInputStatus`
- **文档 / 报告 / 仪表盘 / 可读输出字段**：`background_input_status`

这样既承认现状，又能让所有用户可见文档逐步向统一输出收敛。

### 3. 共享 contract 只定义最小必需内容

共享 contract 只定义以下内容：

- 核心字段名
- 允许的枚举值
- 最小语义解释
- 消费义务
- 严重度底线

它不负责描述每个 skill 的完整流程。

## Shared Contract Definition

### File

新增文件：`skills/spec-first/shared/background-quality-contract.md`

### Canonical Output Fields

当某个 skill 输出“背景质量结论”或“背景状态卡片”时，必须包含以下四个字段：

- `background_input_status`
- `runtime 真源`
- `docs 投影视图`
- `同步状态`

如输出完整结论块，还应包含：

- `建议动作`

### Enums

#### `background_input_status`

- `full`
- `degraded`
- `blind`

#### `runtime 真源`

- `healthy`
- `degraded`
- `missing`

#### `docs 投影视图`

- `synced`
- `stale`
- `drifted`

#### `同步状态`

- `in_sync`
- `stale`
- `drifted`

### Minimal Semantics

- `background_input_status=full`：背景输入完整，可支持高置信结论。
- `background_input_status=degraded`：存在可用背景，但完整性不足，需降低置信度或补充说明。
- `background_input_status=blind`：缺少关键背景输入，不应直接给出高置信判断。
- `runtime 真源=missing`：无法读取或确认 runtime 事实真源。
- `docs 投影视图=drifted`：docs 与 runtime 的映射已明显偏离。
- `同步状态!=in_sync`：输出中必须显式给出建议动作。

### Severity Floor

V1 只定义共享底线，不统一所有 skill 的完整风险体系：

- `background_input_status=blind` → 不得低于 `HIGH`
- `runtime 真源异常 / missing` → 不得低于 `HIGH`
- `docs 投影视图=drifted` → 不得低于 `MEDIUM`
- `同步状态=stale/drifted` → 不得低于 `MEDIUM`

## Ownership and Consumer Rules

### `01-init`

职责：背景状态生产者。

要求：

- 继续负责写入 `backgroundInputStatus`
- 在文档中引用 shared contract 作为背景状态来源
- 枚举说明与 shared contract 保持一致

### `08-review`

职责：背景输入消费者。

要求：

- 可以继续保留 `backgroundInputStatus` 作为输入元数据字段
- 需要在文档中明确：若输出用户可见背景字段，应使用 `background_input_status`
- 不要求 V1 输出完整背景质量结论块

### `12-verify`

职责：验证场景背景依赖声明者。

要求：

- 报告模板中至少包含 `background_input_status`
- 高风险验证需要显式声明背景依赖强度
- 若后续扩展完整背景结论块，字段名必须遵守 shared contract

### `14-status`

职责：背景状态展示者。

要求：

- 状态卡片必须展示四字段：
  - `background_input_status`
  - `runtime 真源`
  - `docs 投影视图`
  - `同步状态`
- 若检测到漂移或失同步，必须给出建议动作

### `21-analyze`

职责：背景质量结论与严重度判定者。

要求：

- 必须输出 `## 背景质量结论`
- 该段必须包含四字段与 `建议动作`
- 严重度规则不得弱于 shared contract 的底线

## V1 Scope

V1 只覆盖以下文件与能力：

- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/08-review/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`
- `skills/spec-first/14-status/SKILL.md`
- `skills/spec-first/21-analyze/SKILL.md`
- `skills/spec-first/shared/background-quality-contract.md`
- `tests/unit/background-quality-contract.test.ts`

必要时补小范围 reference：

- `skills/spec-first/12-verify/references/verify-report-template.md`
- `skills/spec-first/14-status/references/status-dashboard-template.md`
- `skills/spec-first/21-analyze/references/report-format.md`

## Non-Goals

- 本轮不统一所有 skill 的完整输出模板
- 本轮不把所有历史文档字段一次性改成同一种命名
- 本轮不重写 `doctor` / `orchestrate` / `spec` / `code` 的背景质量说明
- 本轮不引入额外的 runtime 层对象模型

## Shared Test Strategy

### File

新增文件：`tests/unit/background-quality-contract.test.ts`

### What It Verifies

共享测试只验证“跨 skill 不漂移”的硬约束：

1. shared contract 文件存在。
2. shared contract 定义了四个 canonical output fields。
3. shared contract 定义了四组枚举。
4. `01-init` 的背景状态枚举与 contract 一致。
5. `14-status` 的状态卡片包含四字段。
6. `21-analyze` 的背景质量结论包含四字段与建议动作。
7. `12-verify` 的模板至少包含 `background_input_status`。
8. `08-review` 显式说明 `backgroundInputStatus` 只是输入层字段，而不是文档输出 canonical name。

### Relationship With Existing Tests

现有测试继续保留：

- `tests/unit/analyze-skill-docs.test.ts`
- `tests/unit/analyze-background-quality.test.ts`
- `tests/unit/status-skill-docs.test.ts`
- `tests/unit/verify-skill-docs.test.ts`

分工如下：

- shared test：防跨 skill contract 漂移
- 现有 skill-docs test：防单个 skill 局部回退
- runtime test：防真实实现与文档脱钩

## Rollout Plan

### Step 1

新增 `shared/background-quality-contract.md`，只写最小契约。

### Step 2

新增 `tests/unit/background-quality-contract.test.ts`，先让共享约束变成可执行校验。

### Step 3

接入 5 个关键 skill，补充必要文案或模板字段，但不做结构性重写。

### Step 4

运行定向测试 + 全量测试，确保：

- 新增 shared test 通过
- 相关 skill-docs test 继续通过
- 全量测试不回归

## Verification

V1 完成后需满足：

- 存在共享 contract 文件，且内容控制在最小必要范围
- `01-init`、`12-verify`、`14-status`、`21-analyze` 对字段名和枚举定义不冲突
- `08-review` 对输入层命名与输出层命名边界描述清晰
- 新增 shared test 通过
- 原有相关测试继续通过
- 不引入模板系统或额外生成链路

## Recommendation

建议立即执行该 V1。

原因：

1. 背景质量已在多个 skill 中扩散，已经具备共享契约的必要性。
2. 当前已出现真实漂移，继续靠逐个 skill 修补会反复返工。
3. 共享 contract + 共享测试的实现成本低，收益高，且符合“最小补丁、设计简洁、使用简单”的约束。
