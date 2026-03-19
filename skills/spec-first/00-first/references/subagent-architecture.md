# 00-first 多 Agent 架构

## 总原则

- 多 Agent 编排属于 Skill 层，不属于 CLI
- Agent 负责产出结果，Skill 工作流负责将结果写入最终文件
- CLI 只做最小支撑与校验
- 单个 Agent 缺证据时必须显式标记 `[待确认]`
- 总并发上限为 `3` 个 Agent，禁止超出该上限

## Agent 分组

### runtime agents

- `summary-steering`
  - 产出：`summary.json`、`steering.json`
- `conventions-entry-guide`
  - 产出：`conventions.json`、`entry-guide.json`
- `critical-flows`
  - 产出：`critical-flows.json`
- `api-contracts`
  - 产出：`api-contracts.json`
- `structure-overview`
  - 产出：`structure-overview.json`
- `domain-model`
  - 产出：`domain-model.json`
- `database-schema`
  - 产出：`database-schema.json`

### docs agents

- `overview-docs`
  - 产出：`README.md`、`summary.md`、`steering.md`
- `engineering-docs`
  - 产出：`conventions.md`、`development-guidelines.md`、`entry-guide.md`
- `flow-docs`
  - 产出：`critical-flows.md`、`call-graph.md`
- `api-docs`
  - 产出：`api-docs.md`、`external-deps.md`
- `structure-docs`
  - 产出：`codebase-overview.md`、`architecture.md`
- `model-docs`
  - 产出：`domain-model.md`、`database-er.md`

## 推荐波次

### Wave 1

- `summary-steering`
- `conventions-entry-guide`
- `critical-flows`

### Wave 2

- `api-contracts`
- `structure-overview`
- `domain-model`

### Wave 3

- `database-schema`

### Wave 4

- `overview-docs`
- `engineering-docs`
- `flow-docs`

### Wave 5

- `api-docs`
- `structure-docs`
- `model-docs`

规则：

- docs agents 默认读取同轮 evidence pack，并参考 runtime agents 已产出的结果
- `database-er.md` 必须受 `databaseSchema.status` 约束
- 任一波次最多并发 3 个 Agent

## 失败与重试

- runtime agent 失败：
  - 优先重试一次
  - 仍失败则阻断对应 runtime 资产写盘
- docs agent 失败：
  - 可单独重试
  - 不得伪造内容补洞
- 任意 Agent 缺证据：
  - 输出 `[待确认]`
  - 不得把猜测写成确定事实

## Skill 层与 CLI 的交接边界

- Skill 层输出：
  - runtime 结果
  - docs 结果
  - 失败/重试结论
- 默认最终位置：
  - `.spec-first/runtime/first/*.json`
  - `docs/first/*.md`
- CLI 输出：
  - runtime 校验结果
  - docs 存在性检查结果
- 若缺少最终文件，CLI 直接失败，不再保留本地认知 fallback
