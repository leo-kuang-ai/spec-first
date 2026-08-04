# Mixed / 跨端 Surface 模板

> 与 `00-generic.md` 组合使用。只有真实跨 surface、producer/consumer 或 source-of-truth 变化时加载；单端需求不应因为“可能有关联”而使用 Mixed。
>
> 所有人类问题只询问当前执行对话的用户。行业 overlay 按明确信号独立加载。

## Mixed 属性确认

| 维度 | 内容 |
| --- | --- |
| 涉及 surface | App / H5-PC / Admin / Backend / CLI / 第三方 |
| 主业务结果 | |
| 当前 source-of-truth | |
| 目标 source-of-truth | |
| producer | |
| consumers | |
| 同步方式 / 时效（产品语义） | |

## Source-Of-Truth Resolution

| item | current source | target source | non-authoritative mirrors | conflict rule | evidence |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Producer / Consumer Map

| producer | artifact / state / config | consumers | expected freshness | change effect | failure visibility |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 跨端一致性矩阵

| 能力 / 状态 | App | H5-PC | Admin | Backend / CLI | 允许差异 | source |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

每项说明必须一致的内容、允许差异的原因、更新顺序和冲突时以谁为准。

## 异步同步与降级

| 场景 | producer 状态 | consumer 状态 | 用户可见结果 | 恢复 / 补偿 | 最终一致性条件 |
| --- | --- | --- | --- | --- | --- |
| 延迟 | | | | | |
| 丢失 / 失败 | | | | | |
| 重复 | | | | | |
| 顺序错乱 | | | | | |
| 部分 surface 不可用 | | | | | |

## Rollout / Backout

写清各 surface 的发布顺序、兼容窗口、feature flag、旧版本行为、允许的临时不一致和回退后的 source-of-truth。不要把技术部署顺序写成实现任务。

## 端到端验收与回归保护

- producer 更新后每个 consumer 的可观察结果。
- 延迟、重复、失败、部分成功和恢复。
- 旧客户端 / 旧调用方 / 旧数据兼容。
- source-of-truth 冲突和负向验收。
- 回退后不发生双写、错误覆盖或用户不可解释状态。

## Mixed 待闭合问题候选

这里只提示候选缺口，不生成第二套 OQ schema。会改变 source-of-truth、surface 覆盖、允许差异、同步时效、fallback 或 E2E 验收的问题移入 output contract 的 canonical `Outstanding Questions`；协议、消息系统、数据库和部署编排进入 `spec-plan`。
