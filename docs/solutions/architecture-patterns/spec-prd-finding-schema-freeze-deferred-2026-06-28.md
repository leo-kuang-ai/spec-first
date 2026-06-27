# spec-prd finding 字段形状 freeze（已延迟）

**日期:** 2026-06-28  
**状态:** deferred — 当前消费者不依赖细节字段，等下游有需求再做

## 背景

`check-prd-artifact.js` 的 `findings` 数组中，每条 finding 的字段形状不一致：

| reason_code 类型 | 字段示例 |
|---|---|
| 结构缺失 | `{reason_code, section}` |
| 行定位 | `{reason_code, line}` |
| 数量超限 | `{reason_code, count, limit}` |
| 期望/实际 | `{reason_code, expected, actual, line}` |
| 路径 | `{reason_code, path}` |
| 需求 ID | `{reason_code, requirement_id}` |

`facts` key-set 已被 freeze 测试锁（`spec-prd-finalize.test.js:430`），但 finding 字段形状无等价闸。

## 当前影响

**当前不痛**：现有消费者（prd-readiness-guard hook、finalize closeout、lens prose）只读 `reason_code`，不依赖 extra 字段。`BLOCKING_REASON_CODES` 的 30 码已被 parity 闸锁。

## 未来触发点

当以下任一条件成立时，再实施 finding schema freeze：

1. 某个消费者需要渲染 finding 细节（block 文案包含 line number / section / count）
2. 新增 finding 类型且 extra 字段形状不一致引起实现困惑
3. finalize 的 closeout summary 需要结构化引用 finding extra 字段

## 实施方式（届时参考）

1. 枚举当前每个 `reason_code` 的 extra 字段（6 种形状）。
2. 在 `spec-prd-checker-unit.test.js` 或独立 freeze 测试中，对每个 `reason_code` 的 extra 字段做 `toMatchObject` 冻结。
3. 对齐 `looksLikeCheckableRef` / `traceRowBindsOq` 等纯函数——这些函数的返回值已有单元测试，extra 字段冻结不影响它们。

## 关联

- `facts` key-set freeze: `tests/unit/spec-prd-finalize.test.js:430`
- reason_code parity 闸: `tests/unit/spec-prd-reason-code-parity.test.js`
- finding 字段形状分析: `skills/spec-prd/scripts/check-prd-artifact.js:875-1138`
