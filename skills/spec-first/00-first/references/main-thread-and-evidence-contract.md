# 主线程与证据包契约

> 本文档合并了主线程契约、证据包规范和 Agent 输出 Schema,提供完整的契约视图。

## 1. 主线程契约

> `first` 主线程的 canonical contract.
> 目标是让主线程只保留协调、裁决与验收所需的最小上下文,不再携带原始长证据正文。

### 1.1 当前 Feature

- 必须明确当前 Feature ID
- 若 Feature 未知,必须先恢复或定位 Feature,再继续后续波次
- 主线程只保留 Feature 标识,不保留原始证据正文

### 1.2 当前波次

- 必须明确当前处理的 wave
- wave 只描述当前阶段要做什么,不复述完整执行流
- 主线程只保留本轮 wave 名称、目标与阻断条件

### 1.3 资产目标
- runtime wave 产出结构化 JSON
- docs wave 产出 Markdown 阅读产物
- 主线程只传 asset 名称与约束,不传长证据全文

### 1.4 并发上限

- 并发由 `runtime.auto_orchestrate.max_parallel` 控制,主线程只读取配置值,不自定义扩展
- 当前可接受的总并发上限固定为 `3`
- 主线程不得将并发提升到该上限之外；需要调优必须先修改统一契约
- 主线程只调度,不扩展并发上限,也不携带子任务长上下文

### 1.5 重试规则

- 每个任务最大重试次数由 `runtime.auto_orchestrate.max_retry_per_task` 控制(默认值见配置)
- 遵守 `runtime.auto_orchestrate.retry_backoff_ms` 与 `runtime.auto_orchestrate.max_total_retry_duration_ms`
- 超限或仍失败则标记 `blocked` / `retryable`,不能伪造结果补洞

### 1.6 验收条件
- runtime 资产可解析
- docs 产物存在性检查通过
- `status / orchestrate / init / first` 不出现回归
- 所有正式结论都能追溯到 evidence path 或 runtime asset path

### 1.7 禁止保留

- 禁止保留原始证据正文(主线程不得携带长证据全文)
- 原始证据正文
- 每个 agent 的完整推理过程
- runtime/docs 的冗长正文
- 任何无法追溯来源的臆测结论

## 2. Evidence Pack 规范

> 规范主线程与 subagents 之间如何传递证据。
> 目标是把"证据包"标准化为结构化输入,避免主线程把长证据直接塞给每个 agent。

### 2.1 Evidence Pack 目录结构

最小逻辑结构如下,属于强制规范,不是建议:

```text
evidence-pack/
  manifest.json
  shared/
  runtime/
  docs/
```

- `manifest.json`: 本轮包的摘要、范围、版本、生成时间
- `shared/`: runtime 与 docs 共享的最小事实
- `runtime/`: runtime agents 可读的证据集合
- `docs/`: docs agents 可读的证据集合
- 任一 wave 的 evidence pack 至少要覆盖当前 wave 需要的事实切片,不能只给目录壳

### 2.2 shared/ 共享摘要

- `shared/` 仅属于 Skill 层执行产物,不是 CLI 自动验收的最终交付物
- `shared/summary.json` 由主线程动态生成,提供跨 wave 的最小共享事实
- `shared/context.json` 记录 Serena 可用性、降级原因与本轮关键配置
- `shared/summary.json` 至少应包含 `serena_available`、`project_type`、`entry_points` 与 `gaps`
- 不得手动维护 `shared/summary.json` 或以静态快照替代

### 2.3 runtime wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取 `runtime/`
- 不允许重新扩展为长篇背景分析

### 2.4 docs wave 可读范围

- 允许读取 `manifest.json`
- 允许读取 `shared/`
- 允许读取本轮已确认的 runtime 结果
- 不允许重新取证或反向修正 runtime 真源

### 2.5 传递原则

- 主线程只发包,不发长证据
- subagent 只消费与自己波次相关的 evidence slice
- 缺证据时必须标记 `[待确认]`
- 不得把猜测写成确定事实

### 2.6 最小必读层

在开始扩展 wave 证据前,至少先读取以下角色对应的文件:

| 角色 | 目的 | 常见文件示例 |
|------|------|-------------|
| Manifest | 快速识别项目基本形态、脚本与依赖入口 | `package.json`、`pyproject.toml`、`pom.xml`、`go.mod` |
| README | 快速识别项目意图、使用方式与推荐入口 | `README.md`、`readme.md` |
| Entry | 定位主启动入口或命令入口 | `src/index.ts`、`src/main.*`、`app/main.*`、`main.py` |
| Config | 定位构建、类型、运行与 workspace 配置 | `tsconfig.json`、`vite.config.*`、`next.config.*`、`nx.json` |
| Lockfile | 确认依赖冻结状态,辅助判断技术栈稳定性 | `pnpm-lock.yaml`、`package-lock.json`、`yarn.lock`、`poetry.lock` |

说明:
- 角色优先,不要求所有项目都存在每一种文件。
- 若某一角色文件缺失,可用同角色的其他证据替代,但不得跳过整个角色。
- 对 monorepo / 多语言项目,先读根层 Manifest 与 README,再补各子包的 Entry / Config。

### 2.7 最小充分性判断

evidence pack 只有在满足以下条件时才视为"足够":

- 能识别当前项目主类型与必要子类型
- 能定位当前 wave 需要的入口、关键配置和核心依赖
- 无需再向主线程追问"项目是什么、入口在哪里、基础依赖是什么"这类前置问题

## 3. Agent 输出 Schema

> 统一 runtime agents 与 docs agents 的最小输出格式。
> 主线程只读取结构化摘要,不读取完整推理链。

### 3.1 标准字段

- `status`
- `artifacts`
- `evidence_paths`
- `gaps`
- `next_action`

### 3.2 状态枚举

- `healthy`
- `blocked`
- `retryable`
- `[待确认]`

### 3.3 字段说明

- `status`: 本轮结果的总状态
- `artifacts`: 已产出的文件或资产,必须使用对象数组；每项至少包含 `name`、`path`、`written`
  - `name`: 资产名,保持与 runtime/docs 目标一致
  - `path`: canonical 输出路径
  - `written`: 布尔值,`true` 表示已实际落盘到 `path`
- `evidence_paths`: 支撑结论的证据路径
- `gaps`: 缺失项、待确认项或阻塞项
- `next_action`: 下一步建议动作,必须可执行

### 3.4 示例

```json
{
  "status": "healthy",
  "artifacts": [
    {
      "name": "summary.json",
      "path": ".spec-first/runtime/first/summary.json",
      "written": true
    }
  ],
  "evidence_paths": ["package.json:1", "src/index.ts:5"],
  "gaps": [],
  "next_action": null
}
```

### 3.5 失败表达

- `blocked`: 当前波次无法继续,需要先修复阻塞
- `retryable`: 允许重试一次
- `[待确认]`: 证据不足,不能自行补猜

### 3.6 输出约束

- 不输出长篇分析
- 不输出与其它 agent 重复的解释性正文
- 结论必须可回溯到 `evidence_paths`
