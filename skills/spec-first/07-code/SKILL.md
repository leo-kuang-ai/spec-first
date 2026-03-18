---
name: "spec-first:code"
description: "Use when implementation work is ready, a TASK has been approved, and you need to execute code changes in the current feature workspace."
version: "2.1.0"
last_updated: "2026-03-18"
changelog: |
  v2.1.0: 收敛为当前可执行模式；去除冗余 FAQ；对齐真实配置/状态文件/能力边界；明确 stop_on_failure_rate 等仍属目标态
  v2.0.0: 完全重写为批量模式；当前只保留依赖解析、上下文打包、checkpoint/report 等已落地能力，失败率控制仍未接入真实运行时
  v1.1.0: 单 TASK 模式（已废弃）
user-invocable: true
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep, Agent"
---

# Skill: code

按 TASK 规格执行代码实现。支持：

- 单 TASK 模式
- 分层批量模式
- 多 agent / subagent 辅助执行

## 当前模式

- Command: `/spec-first:code [featureId]`

当前仓库的真实状态是：

- skill 以自动批量模式定义完整执行流程
- batch executor 仍未完全接入真实 subagent 执行链路
- 失败率控制、超时裁剪、多层并发控制仍停留在目标态设计，不是当前稳定运行能力
- 因此当前默认做法是：
  - 提示词仍按自动批量模式组织
  - 运行时根据宿主能力落到真实 subagent 或人工/半自动调度

不要把“自动批量模式提示词”直接等同于“当前 runtime 已稳定自动接线”。

## 背景质量契约

本 skill 遵循 [shared/background-quality-contract.md](../shared/background-quality-contract.md)。

执行前检查：

- `backgroundInputStatus`
- `background_input_status`

## Announce at Start

```text
I'm using the code skill to implement [Feature ID].
Mode: [single-task | batch-layered]
Tasks detected: [N]
```

## 触发条件

批量模式：

- 用户执行 `/spec-first:code`
- `task_plan.md` 中存在多个 `todo/pending` TASK

单任务模式：

- 用户明确指定 task-id
- 或当前只剩一个待执行 TASK

命令：

`/spec-first:code [task-id]`

## 真理源

执行时以当前仓库真实实现为准：

- TASK 解析：[`src/core/task-plan/parser.ts`](../../../src/core/task-plan/parser.ts)
- 批量类型：[`src/core/batch-executor/types.ts`](../../../src/core/batch-executor/types.ts)
- 上下文打包：[`src/core/batch-executor/context-packer.ts`](../../../src/core/batch-executor/context-packer.ts)
- checkpoint：[`src/core/batch-executor/checkpoint.ts`](../../../src/core/batch-executor/checkpoint.ts)
- 报告生成：[`src/core/batch-executor/report-generator.ts`](../../../src/core/batch-executor/report-generator.ts)
- 当前并发配置：[`src/shared/config-schema.ts`](../../../src/shared/config-schema.ts)

## 当前已实现配置

当前只对齐已落地配置：

```yaml
runtime:
  auto_orchestrate:
    max_parallel: 1..4
```

说明：

- `max_parallel` 的真实读取入口是 `runtime.auto_orchestrate.max_parallel`
- 以下配置在 skill 中不再视为当前已实现真理源：
  - `runtime.code.max_parallel`
  - `stop_on_failure_rate`
  - `context_pack_size`
  - `task_timeout_ms`
  - `max_layers`

这些最多只能视为目标态设计，不应当作当前执行依据。

## 当前未兑现的目标态能力

以下能力仍然属于设计目标，而不是当前稳定承诺：

- 基于 `stop_on_failure_rate` 的自动熔断
- 基于 `task_timeout_ms` 的任务级超时治理
- 基于 `context_pack_size` 的统一上下文预算调度
- 基于 `max_layers` 的层级上限控制

如果需要这些能力，必须先以代码实现或测试证据证明已落地，再回写到 skill 文档。

## 硬规则

1. 批量模式不放松任何单 TASK 守卫。
2. 没有可靠冲突信息时，默认串行而不是乐观并发。
3. subagent 只负责单 TASK 实现，不负责共享状态写入。
4. 主进程统一汇总结果并写共享文件。
5. 提示词始终按自动批量模式组织；找不到真实运行时接线时，由宿主或主进程按同一批量流程落到人工/半自动调度。
6. `Simplicity First`：优先最小实现，避免为单个 TASK 顺手扩写无关能力。
7. `Surgical Changes`：只动当前 TASK 必需的文件和范围，不顺带重构无关区域。

## 守卫

### P0 全局守卫

- 阶段必须是 `04_implement`
- `design.md` 必须存在
- `task_plan.md` 中至少有一个待执行 TASK
- 必须先解析依赖关系
- 必须先做 TDD 预检

### 单 TASK 守卫

- 必须有 RED 证据或 WAIVER
- 必须坚持最小实现，只覆盖当前 TASK 所需范围
- 只修改当前 TASK 直接需要的代码
- 必须补测试或说明不补测试的理由
- 必须回写可追踪结果

## 字段真理源

当前 task plan 解析以 parser 为准，稳定字段只有：

- `task_id`
- `title`
- `status`
- `depends_on`
- `traces`
- `owner`

不要假设当前 task plan 稳定支持：

- `changeAreas`
- 任意自定义冲突元数据

如果缺少显式冲突元数据：

- 默认串行
- 或只在低风险、不同文件、不同模块时谨慎并发

## 执行流程

### P0 计划阶段

1. 定位当前 Feature
2. 读取 `task_plan.md`
3. 解析待执行 TASK
4. 判断模式：
   - 1 个 TASK：单任务模式
   - 多个 TASK：批量模式
5. 解析 `depends_on`
6. 构建依赖图
7. 检查是否有循环依赖
8. 做 TDD 预检
9. 输出执行计划

### P1 执行阶段

对每一层 ready TASK：

1. 先判断串行还是并发
2. 为每个 TASK 准备上下文包
3. 如宿主已接线真实 subagent，则可并发派发
4. 如未接线，则保持自动批量模式的任务组织方式，但由宿主或主进程按人工/半自动顺序调度
5. 收集结果：`success / failure / blocked`
6. 计算本层失败情况
7. 更新共享状态与报告

### P2 收尾阶段

1. 更新 findings
2. 更新 batch checkpoint
3. 生成 batch report
4. 明确下一步：
   - 继续实现
   - 重试失败 TASK
   - 进入 review

## 执行模式决策表

| 场景 | 模式 |
|------|------|
| 只有 1 个待执行 TASK | 单任务 |
| 多个 TASK 且依赖清晰、无冲突信息缺口 | 可分层批量 |
| 多个 TASK，但共享文件/共享配置/共享迁移 | 串行 |
| 宿主未接线真实 subagent | 自动批量模式提示词 + 人工/半自动调度 |
| 上下文包超限 | 降级裁剪或串行 |

## 主进程 / Subagent 边界

### 主进程负责

- 读取 `task_plan.md`
- 解析依赖关系
- 决定串行/并发
- 汇总 subagent 结果
- 写共享状态文件
- 生成批量报告

### Subagent 负责

- 单 TASK 实现
- 单 TASK 测试
- 单 TASK 错误返回
- 单 TASK 相关代码/测试文件修改

### Subagent 禁止

- 直接写 `task_plan.md`
- 直接写 `findings.md` 的汇总结果
- 直接写 `batch-checkpoint.json`
- 直接写 `batch-report.md`
- 修改其他 TASK 状态

## 共享文件写入规则

主进程独占写：

- `specs/{featureId}/task_plan.md`
- `specs/{featureId}/findings.md`
- `specs/{featureId}/batch-checkpoint.json`
- `specs/{featureId}/batch-report.md`

Subagent 可写：

- 当前 TASK 直接相关源码文件
- 当前 TASK 直接相关测试文件

## 上下文包规则

格式定义见 [context-pack-schema.yaml](./references/context-pack-schema.yaml)。

硬限制：

- 默认目标大小 `< 2KB`

裁剪优先级：

1. 保留 `task`
2. 保留必要 FR 摘要
3. 保留必要 DS 摘要
4. 保留最少 constitution 约束
5. 删除无关背景和历史日志

如果仍超限：

- 不盲目继续
- 改为串行并人工补充最小上下文

## TDD 规则

详细规则见 [tdd-guard.md](./references/tdd-guard.md)。

最小执行要求：

- 批量前做一次 TDD 预检
- 单 TASK 执行前再次检查 RED / WAIVER
- 成功后必须形成 GREEN 证据或等价测试通过记录

执行时还必须遵守以下解释规则：

- TDD 强制优先按**变更类型**判定，不按端类型一刀切
- `business_logic / orchestration / shared_domain` 默认 `required`
- `style_copy_only / doc_only` 可 `waived`
- `config_only / external_integration / infra_wiring` 默认 `conditional_waiver`
- `conditional_waiver` 必须写替代验证，不得只写一句“无法测试”

推荐执行顺序：

1. 解析 TASK 的主要变更类型
2. 映射到 `required / conditional_waiver / waived`
3. 在 `findings.md` 写入 `[TDD-RED]` 或 `[TDD-WAIVER]`
4. 仅在证据存在后开始写生产代码
5. 完成后补 `[TDD-GREEN]`

禁止合理化：

- 先写代码，后补 RED
- 用全量绿替代 RED
- 把样式、配置、外部接线之外的逻辑改动一律归类成 WAIVER
- 把“改动很小 / 时间不够 / 页面不好测”当成 WAIVER 理由

## Traces 规则

尾注格式见 [traces-trailer.md](./references/traces-trailer.md)。

要求：

- 每个实现文件都要有稳定 traces trailer
- 格式必须单一、可检索、不要自行扩展字段名

## 报告与状态文件

当前建议输出：

- `specs/{featureId}/findings.md`
- `specs/{featureId}/batch-checkpoint.json`
- `specs/{featureId}/batch-report.md`

说明：

- `todo-state.json` 更偏 orchestrator 状态，不应作为本 skill 的默认 batch checkpoint 真理源

## 并发黑名单

以下场景默认不要并发：

- 修改同一文件
- 修改同一目录下共享配置
- 迁移脚本
- 安全敏感逻辑
- 核心运行时路由
- 共享状态文件
- 大规模重命名

## 输出物

- 代码实现
- 测试实现
- `findings.md`
- `batch-checkpoint.json`
- `batch-report.md`

## 确认策略

- 单任务：可简化确认
- 批量模式：推荐严格确认

## 成功标准

- 所有目标 TASK 均有明确结果：
  - `done`
  - `blocked`
  - `failed`
- 共享状态文件由主进程统一更新
- 失败 TASK 有明确下一步
- 未夸大当前自动化能力

## 参考文件

- [context-pack-schema.yaml](./references/context-pack-schema.yaml)
- [report-template.md](./references/report-template.md)
- [tdd-guard.md](./references/tdd-guard.md)
- [traces-trailer.md](./references/traces-trailer.md)
- [test-template.md](./references/test-template.md)
- [code-standards.md](./references/code-standards.md)
- [target-env-verification.md](./references/target-env-verification.md)
