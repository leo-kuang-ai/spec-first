# Background Quality Contract V2 Assessment

**Date:** 2026-03-09
**Scope:** 剩余未接入 `shared/background-quality-contract.md` 的 `spec-first` skills

## Current State

V1 已完成以下 5 个关键节点的 shared contract 对齐：

- `01-init`
- `08-review`
- `12-verify`
- `14-status`
- `21-analyze`

当前仍有 `10` 个 skill 存在背景质量相关触点，但尚未接入 shared contract：

- `00-first`
- `00-onboarding`
- `02-catchup`
- `03-spec`
- `04-design`
- `06-task`
- `07-code`
- `11-plan`
- `13-orchestrate`
- `15-doctor`

## Assessment Principle

是否纳入下一批接入，不看“是否提到背景字段”本身，而看它属于哪一类：

1. **直接 consumer**：直接读取、声明、展示或约束背景质量字段。
2. **流程路由器**：不直接输出完整背景结论，但会把背景信号传递给下游。
3. **真源生产者**：定义或生成 runtime truth source，本身不应被当作背景结论 consumer。
4. **入口/体验裁剪器**：根据背景状态做入口建议，但不承担 contract 输出义务。

只有前两类，才适合进入 `background-quality-contract` 的 V2 接入范围。

## Recommended V2 Scope

### P1: Must Include in V2

这批 skill 与 V1 contract 的语义最接近，应作为下一批正式接入对象。

#### `03-spec`

现状：

- 已显式使用 `background_input_status`
- 已定义 `degraded` 降级模式
- 已有相关测试：`tests/unit/spec-skill-docs.test.ts`

判断：

- 属于直接 consumer
- 与现有 contract 的命名层完全兼容
- 接入成本低，收益高

建议：

- 增加 shared contract 引用
- 不改现有 spec-view 降级逻辑
- 共享测试只校验：`spec-view` + `background_input_status` + `degraded` 仍与 contract 一致

#### `15-doctor`

现状：

- 已诊断 `background_input_status`
- 已对比 `runtime 真源` 与 `docs 投影视图`
- 已有测试：`tests/unit/doctor-skill-docs.test.ts`

判断：

- 属于直接 consumer
- 语义与 `status/analyze` 非常接近
- 是最适合接入 contract 的下一批 skill 之一

建议：

- 增加 shared contract 引用
- 明确 doctor 的输出侧字段沿用 canonical output names
- 可在 shared test 中加入 doctor 的最小一致性断言

#### `04-design`

现状：

- 已使用 `design-view`
- 当前文档使用 `backgroundInputStatus`
- 已引入正式设计评审 / `L3` 高依赖门槛
- 已有测试：`tests/unit/design-skill-docs.test.ts`

判断：

- 属于直接 consumer
- 但命名当前仍偏输入层写法
- 与 `08-review` 的输入/输出双层规则相似，适合复用 V1 的处理模式

建议：

- 增加 shared contract 引用
- 明确：`backgroundInputStatus` 为输入层字段，用户可见输出统一使用 `background_input_status`
- 不要强行改 `design-view` 及 `L3` 逻辑

#### `06-task`

现状：

- 当前文档要求输出 `backgroundInputStatus`
- 任务拆解依赖完整 FR/DS 映射
- 尚无专门的 task skill-docs contract 测试

判断：

- 属于直接 consumer
- 处在 spec → design → task 的关键中间层，若不统一，漂移会继续向 code/review 扩散

建议：

- 增加 shared contract 引用
- 复用 `08-review` 的双层命名边界说明
- 建议补一份 `tests/unit/task-skill-docs.test.ts` 或扩展相关文档测试

#### `07-code`

现状：

- 当前文档要求输出 `backgroundInputStatus`
- 已有测试：`tests/unit/code-skill-docs.test.ts`
- 与 `08-review` 相邻，语义边界高度相似

判断：

- 属于直接 consumer
- 与 V1 的 review 对齐模式完全相同
- V2 应优先纳入，避免 code/review 两端对背景字段理解不一致

建议：

- 增加 shared contract 引用
- 明确输入层 `backgroundInputStatus` / 输出层 `background_input_status`
- 保持 `entryPoints` / `likelyChangeAreas` / `changeHazards` 这些 code-view 特有字段不动

#### `11-plan`

现状：

- 输出中必须包含 `backgroundInputStatus`
- 同时声明 `dependencyStrength`、`riskCategory`、`riskSignals`
- 复用 orchestrate 的背景治理口径

判断：

- 属于直接 consumer + 半路由器
- 与 `background-quality-contract` 有重叠，但也涉及更宽的风险治理口径

建议：

- V2 中只先接入 `backgroundInputStatus` / `background_input_status` 的命名边界
- `dependencyStrength` / `riskCategory` / `riskSignals` 暂不纳入本 contract
- 这些字段后续应进入独立的 `orchestration-governance-contract`

### P2: Lightweight Include in V2

这批可以纳入，但只做轻量对齐，不建议过度治理。

#### `02-catchup`

现状：

- 模板中展示 `background_input_status`
- 主要是状态恢复与摘要展示

判断：

- 属于轻展示 consumer
- 不需要完整背景质量结论，只需与 canonical output name 保持一致

建议：

- 增加一行 shared contract 引用即可
- 不需要增加复杂测试，只要防字段名漂移

#### `03-spec`

已列为 P1；若资源紧张，也可先按 P2 做最小引用，再在下一轮补共享测试。

## Should Not Be Included in This Contract Yet

### `13-orchestrate`

现状：

- 使用 `背景状态 full / degraded / blind`
- 输出 `dependency_strength`
- 输出 `risk_category` / `risk_signals`
- 更像运行时治理聚合器，而非背景质量结论 consumer

判断：

- 它不是当前 contract 的简单 consumer
- 它对背景状态做了“再加工”和风险路由
- 它的语义中心是“治理信号”，不是“背景质量展示字段”

结论：

- **不建议直接纳入当前 `background-quality-contract`**
- 建议后续拆成独立 contract：
  - `background-governance-signals-contract`
  - 覆盖：`background_status`、`dependency_strength`、`risk_category`、`risk_signals`

### `00-first`

现状：

- 定义 runtime 真源与 docs 投影视图层
- 是 truth source producer

判断：

- 它生产背景事实，不消费背景结论
- 若强行接入当前 contract，容易把“事实来源定义”和“面向用户的输出约定”混在一起

结论：

- **不纳入当前 contract**
- 只需保证共享 contract 与 first 的事实模型不冲突

### `00-onboarding`

现状：

- 基于 first 资产是否存在给出 degraded onboarding
- 负责入口推荐，不负责阶段输出或治理结论

判断：

- 属于入口体验裁剪器
- 过早接入 current contract 只会增加文档耦合，不带来明显收益

结论：

- **暂不接入**
- 只需保留“无 first 资产 → degraded onboarding”的用户提示语义

## V2 Suggested Order

建议下一批按以下顺序推进：

1. `15-doctor`
2. `03-spec`
3. `07-code`
4. `04-design`
5. `06-task`
6. `11-plan`
7. `02-catchup`

原因：

- `doctor/spec` 与 V1 contract 的字段语义最接近，接入成本最低
- `code/design/task` 当前仍存在输入层 camelCase 说法，属于高价值消漂移目标
- `plan` 涉及更宽的治理字段，适合在 V2 后段做“最小接入”
- `catchup` 只做展示，最后补齐即可

## Testing Strategy for V2

V2 不建议继续把所有断言堆进 `tests/unit/background-quality-contract.test.ts`，否则共享测试会过度膨胀。

建议分两层：

### Layer A: Shared Contract Test

继续保留在 `tests/unit/background-quality-contract.test.ts`，只测：

- canonical output fields
- shared enums
- 已接入核心 skill 的最小一致性

### Layer B: Wave-specific Doc Tests

为 V2 skill 采用“就近扩展现有 skill-docs 测试”的方式：

- `tests/unit/doctor-skill-docs.test.ts`：加入 contract 引用与 canonical naming 断言
- `tests/unit/spec-skill-docs.test.ts`：加入 contract 引用断言
- `tests/unit/code-skill-docs.test.ts`：加入输入层/输出层边界断言
- `tests/unit/design-skill-docs.test.ts`：同上
- `tests/unit/task-skill-docs.test.ts`：如当前没有，则新建最小测试
- `tests/unit/plan-skill-docs.test.ts`：如当前没有，则新建最小测试
- `tests/unit/catchup-skill-docs.test.ts`：如需要，仅加最小展示字段断言

## Recommended Next Action

下一轮不要直接扩到 `orchestrate`。

最稳的 V2 开发顺序是：

1. 先做 `doctor + spec` 的最小接入
2. 再做 `code + design + task` 的双层命名统一
3. 最后做 `plan + catchup`
4. 将 `orchestrate` 单独列为下一份“治理信号 contract”设计题

## Final Recommendation

结论如下：

- **应进入 V2 的 skill：** `03-spec`、`04-design`、`06-task`、`07-code`、`11-plan`、`15-doctor`
- **可轻量接入 V2 的 skill：** `02-catchup`
- **不应纳入当前 contract 的 skill：** `00-first`、`00-onboarding`、`13-orchestrate`

这意味着下一轮最合适的策略不是“把所有剩余 skill 全接入同一 contract”，而是：

- 把直接 consumer 接完
- 把展示类轻量补齐
- 把 orchestrate 相关治理信号单独建模

这样才能既保持一致性，又不把两个层次不同的概念硬塞进同一个共享 contract。
