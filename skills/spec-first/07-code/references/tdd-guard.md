# TDD 记录说明

当前实现真理源: `src/core/batch-executor/guards.ts`

## 核心原则

TDD 证据优先作为执行记录与回放依据，不作为 `code` 的前置门禁。

## 当前记录口径

### 记录建议

批量执行过程中，如有测试证据、豁免或回放结论，建议记录到 `specs/{featureId}/findings.md`：

- `[TDD-RED] TASK-ID`
- `[TDD-WAIVER] TASK-ID`
- `[TDD-GREEN] TASK-ID`

注意：

- 当前实现不再把 findings 作为 `code` 进入门禁
- `TDD-GREEN` 仍可作为执行完成后的补充证据
- 当前 skill 可以要求补充结构化字段，但不得把这些字段描述成 runtime 已强制解析

### TASK 级建议

每个 TASK 在编码过程中，建议形成以下之一：

1. 已记录 RED 证据
2. 已记录经确认的 WAIVER

不满足时，仍可继续进入实现，但应在 findings 或执行记录中补齐说明。

## TDD Policy Resolution（建议）

TDD 是否强制，优先按**变更类型**判断，而不是按仓库端类型一刀切。

### 变更类型优先级

1. 先判断本 TASK 的主要变更类型
2. 再映射到 `required / conditional_waiver / waived`
3. `conditional_waiver` 建议写明替代验证证据

### 默认矩阵

| 变更类型 | app | h5 / admin | backend | shared | 默认策略 |
|---------|-----|------------|---------|--------|----------|
| 业务规则 / 领域逻辑 | required | required | required | required | 先 RED |
| 状态管理 / 编排逻辑 | required | required | required | required | 先 RED |
| 组件 / 页面交互行为 | conditional_waiver | required | - | - | 优先组件/页面级 RED |
| 接口 / 服务行为 | - | - | required | conditional_waiver | 优先 service / integration RED |
| 纯样式 / 文案 | waived | waived | - | - | WAIVER 即可 |
| 配置 / 脚本 / 打包 | conditional_waiver | conditional_waiver | conditional_waiver | conditional_waiver | WAIVER + 替代验证 |
| 外部集成接线 | conditional_waiver | conditional_waiver | conditional_waiver | conditional_waiver | 契约 / 冒烟替代 |

说明：

- `shared` 指多端共享包、schema mapper、SDK、共用 domain 模块
- 同一 TASK 同时涉及多类变更时，按风险更高的类型执行
- 无法判断时，建议先做最小验证，再继续实现

## WAIVER 口径（建议）

WAIVER 只用于确实不适合先写失败测试的情况，不用于绕过已有测试义务。

### 建议 reason code

- `style_copy_only`
- `doc_only`
- `config_only`
- `generated_code`
- `external_integration`
- `infra_wiring`

### WAIVER 最低内容

- Scope
- Reason
- Alternative Verification
- Approver
- Time

如果是 `conditional_waiver`，建议写出可执行替代验证，例如：

- `pnpm lint`
- `pnpm typecheck`
- 定向 build / smoke / contract test
- 人工验证步骤及边界

## 反合理化守卫（建议）

以下理由不建议作为 WAIVER：

- "改动很小"
- "时间不够"
- "先实现再补"
- "这个页面不好测"
- "测试环境麻烦"
- "覆盖率后面再补"

以下理由也不充分：

- 只有 GREEN，没有先前 RED
- 只有全量测试通过，但无法说明与当前 TASK 的关系
- 只写了 WAIVER 标记，没有原因和替代验证

## 推荐证据格式

### RED

```md
### [TDD-RED] TASK-XXX

- Policy: required
- Change-Type: business_logic
- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `1`
- Failure: 目标行为尚未实现
- Expectation: 输入非法参数时应拒绝
- Time: `2026-03-14T10:30:00+08:00`
```

### WAIVER

```md
### [TDD-WAIVER] TASK-XXX

- Policy: conditional_waiver
- Change-Type: external_integration
- Scope: 文档更新 / 纯配置调整 / 无法自动化验证的外部集成
- Reason: 当前变更不适合先写失败测试，已获确认
- Alternative Verification: `pnpm lint && pnpm typecheck`，并执行定向 smoke
- Approver: 用户确认 / 负责人确认
- Time: `2026-03-14T10:30:00+08:00`
```

### GREEN

```md
### [TDD-GREEN] TASK-XXX

- Policy: required
- Change-Type: business_logic
- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `0`
- Result: 相关测试通过
- Notes: 与 RED 同一测试文件，最小实现闭环完成
- Time: `2026-03-14T11:00:00+08:00`
```

## 执行建议

- findings.md 负责记录，不负责阻断
- 如果仓库只能跑全量验证，也可以记录 `pnpm test -- --run`，并标明本 TASK 关联范围
- RED / WAIVER / GREEN 都可以写入 `specs/{featureId}/findings.md`
- 推荐在标记下方补结构化字段，便于 `catchup / status / review / verify` 做恢复与审查
