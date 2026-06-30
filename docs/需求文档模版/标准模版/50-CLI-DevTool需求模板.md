---
spec_id: YYYY-MM-DD-NNN-<slug>
artifact_kind: prd-requirements
target_surface: cli
industry: securities
status: draft
evidence_grade: mixed
author: <作者>
created: YYYY-MM-DD
---

# <需求名称> CLI/DevTool 增量需求文档

> 本模板在「00-通用增量需求模板」骨架上，叠加 **CLI / 开发者工具 / agent-facing workflow** 专属关注点。
>
> **WHAT not HOW**：写命令入口、参数语义、预览优先、输出契约、错误恢复、升级与兼容行为；不写内部模块拆分、依赖库选择、实现函数或测试代码。

---

## Summary [core]

（同通用模板：一句话需求）

## 工具属性确认 [core，CLI/DevTool 专属]

| 维度 | 内容 |
| --- | --- |
| 工具类型 | CLI / script / workflow helper / agent-facing command / runtime projection |
| 目标用户 | 开发者 / reviewer / workflow owner / CI / 本地 agent |
| 入口 | 命令名 / skill / workflow / npm script |
| 是否会写文件或改 runtime | 是 / 否（若是，必须写 preview 与 source/runtime 边界） |
| 是否有 dry-run / check-only | 是 / 否 / 需新增 |
| 是否影响 Claude / Codex 双宿主 | 是 / 否 |
| 输出消费方 | 人读 / JSON consumer / hook / downstream workflow |
| 失败是否可恢复 | 是 / 否 / 待确认 |

## Change Delta [core]

（同通用模板。CLI/DevTool 场景必须写清现有命令、参数、输出、exit code、runtime mirror 是否保持兼容。）

| 改动点 | 当前行为 | 目标行为 | 兼容性 | 证据 tag |
| --- | --- | --- | --- | --- |
| | | | backward-compatible / breaking / unknown | |

## Requirements [core]

（同通用模板：EARS + BR 编号）

CLI/DevTool 需求应把以下行为写成 R 或 BR：

- 命令入口、参数、默认值、互斥参数、缺省行为。
- preview-first / dry-run / check-only 输出。
- exit code、stdout/stderr、JSON schema 或人读输出边界。
- 输入文件、输出文件、runtime mirror、source-of-truth 的权限边界。
- 失败恢复、重复运行、部分成功、降级模式。

## Scope Boundaries [core]

（同通用模板。必须写清不做的入口、宿主、输出格式、迁移范围。）

## Acceptance Examples [core]

CLI/DevTool 验收必须覆盖 happy path、usage error、输入缺失、重复运行、dry-run 不写盘、失败时不产生半成品。

```text
AC-01（对应 R-01）
Given <已有 source 文件和 dry-run 参数>
When <运行命令>
Then <stdout/stderr/exit code 符合契约，且不写目标文件>
```

## Evidence And Assumptions [core]

（同通用模板。命令现状、hook 行为、runtime mirror、CI 脚本、downstream consumer 均需标 evidence tag。）

---

## 命令与参数契约 [conditional，CLI/DevTool 专属]

| 命令 / 入口 | 参数 | 默认值 | 是否必填 | 互斥关系 | 输出 |
| --- | --- | --- | --- | --- | --- |
| | | | 是 / 否 | | |

写清：

- 参数缺失、未知参数、非法组合的错误信息和 exit code。
- 多个输入路径的解析规则、相对路径基准、glob 是否支持。
- 环境变量、配置文件、CLI 参数的优先级。

## Preview / Mutation Boundary [conditional，CLI/DevTool 专属]

| 模式 | 是否写盘 | 用户可见输出 | 可用于什么场景 |
| --- | --- | --- | --- |
| dry-run / check-only | 否 | | 预览、CI 检查 |
| apply / write | 是 | | 明确授权后执行 |
| refresh / init | 是 | | runtime mirror 生成 |

任何写盘命令都必须说明 source-of-truth 与 generated runtime 的边界；不得让用户手改 generated mirror 当 source fix。

## 输出与消费方 [conditional，CLI/DevTool 专属]

| 输出 | 消费方 | 稳定性 | 失败/降级信号 |
| --- | --- | --- | --- |
| stdout 人读摘要 | 人 | best-effort | |
| JSON | script / workflow / hook | contract | |
| 文件 artifact | downstream workflow | schema-versioned | |
| exit code | shell / hook | contract | |

若输出会被 `spec-plan`、hook、CI 或 agent 消费，必须写清字段语义、兼容策略和未知字段处理。

## 错误、降级与恢复 [conditional，CLI/DevTool 专属]

| 场景 | exit code / reason_code | 用户应该怎么恢复 | 是否允许继续 |
| --- | --- | --- | --- |
| 输入缺失 | | | |
| schema 不合法 | | | |
| runtime 不可用 | | | |
| source/runtime drift | | | |
| 部分成功 | | | |

降级必须响亮：写 `degraded`、原因、未被机械强制的 gate，以及继续执行需要的 owner/用户接受。

## 双宿主与 runtime 投射 [conditional，CLI/DevTool 专属]

| 宿主 | 入口 | 支持能力 | 缺失能力 / degraded |
| --- | --- | --- | --- |
| Claude | | | |
| Codex | | | |
| 通用 terminal | | | |

涉及 `.claude/`、`.codex/`、`.agents/skills/` 时，PRD 只写产品/工作流可见行为；生成逻辑和文件改动属于 `spec-plan`。

## Upgrade / Compatibility [conditional，CLI/DevTool 专属]

| 兼容点 | 当前承诺 | 目标承诺 | 迁移 / 退出条件 |
| --- | --- | --- | --- |
| 命令名 | | | |
| 参数名 | | | |
| JSON 字段 | | | |
| reason_code | | | |
| runtime mirror | | | |

## Exception Handling / Outstanding Questions [conditional]

（同通用模板。CLI/DevTool 重点：参数冲突、输入不可读、JSON 消费方、exit code、runtime mirror、重复运行、降级未强制。）

---

## 变更记录 / Handoff

（同通用模板）
