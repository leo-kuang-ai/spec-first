# CLI / DevTool Surface 模板

> 与 `00-generic.md` 组合使用，只补命令入口、参数语义、preview/mutation、输出、错误恢复、升级和 runtime projection 的产品合同。Frontmatter 与 readiness 由 `references/prd-output-template.md` 提供。
>
> 所有人类问题只询问当前执行对话的用户。

## Tool 属性确认

| 维度 | 内容 |
| --- | --- |
| 工具类型 | CLI / script / workflow / agent-facing command / runtime projection |
| 目标用户 | 开发者 / reviewer / CI / 本地 agent / 其它 |
| 公开入口 | 命令 / 参数 / skill / workflow / npm script |
| 支持平台 | macOS / Linux / Windows / Claude / Codex / Cursor / Kiro / Qoder |
| 副作用 | 只读 / 写文件 / 删除 / host config / 外部调用 |
| consumer | 人类 / shell / CI / downstream workflow / parser |

## 命令与参数语义

| 入口 | 参数 / 配置 | 默认值 | 必填条件 | 非法值结果 | 示例 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

明确参数优先级、环境变量、配置文件、交互/非交互模式和 exit code。不要在 PRD 中规定解析库或函数实现。

## Preview / Mutation Boundary

| 动作 | 默认行为 | preview 输出 | 确认点 | 实际副作用 | 可恢复方式 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

能 preview-first 的写入不得 silent write。删除、覆盖、host runtime 修改和危险命令必须有明确 mutation boundary。

## 输出与消费方

| 输出面 | 格式 | 必要字段 / 含义 | consumer | 稳定性 / versioning |
| --- | --- | --- | --- | --- |
| stdout | human / JSON / NDJSON | | | |
| stderr | error / warning / degraded | | | |
| artifact | path / schema / freshness | | | |
| exit code | 0 / non-zero meaning | | | |

区分 advisory、confirmed、generated 和 degraded；不要让 transcript 声明替代 outcome evidence。

## 错误、降级与恢复

| 失败场景 | 用户可见结果 | reason_code | 是否继续 | 恢复动作 | 残留状态 |
| --- | --- | --- | --- | --- | --- |
| 依赖缺失 | | | | | |
| 权限不足 | | | | | |
| 部分写入 | | | | | |
| 配置冲突 | | | | | |
| provider 不可用 | | | | | |

降级必须响亮：说明未被强制的 gate、原因、限制和继续条件；不能把 advisory fact 升格为 confirmed truth。

## 多宿主与 runtime projection

| Host | source | generated runtime | 支持 / 降级 | 验证方式 |
| --- | --- | --- | --- | --- |
| Claude | | | | |
| Codex | | | | |
| Cursor | | | | |
| Kiro | | | | |
| Qoder | | | | |

Source-first：修 source/generator，再运行正式 init；不手改 generated mirrors。

## Upgrade / Compatibility

写清旧配置、旧命令、旧 artifact、旧 runtime 和 unsupported platform 的产品结果；涉及 breaking change 时明确迁移、警告、失败和回退边界。

## CLI/DevTool 补充验收

- 默认参数、显式参数、非法参数和互斥参数。
- preview 与 confirm 后实际 mutation 一致。
- stdout/stderr/JSON/exit code 可被 consumer 稳定读取。
- 中途失败无静默残留，恢复路径明确。
- 五宿主 source/runtime projection 按实际支持范围验证。

## CLI/DevTool Outstanding Questions

会改变公开入口、默认行为、副作用、输出 contract、兼容或恢复的决定属于 PRD；模块拆分、依赖库和内部函数进入 `spec-plan`。
