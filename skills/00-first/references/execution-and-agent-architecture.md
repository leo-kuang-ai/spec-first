# 执行流程与 Agent 架构

> 本文档合并了执行流程与 Agent 架构,提供完整的 first 执行视图。

## 1. 总原则

- Skill 定义执行流,Agent 负责产出结果,CLI 负责最小支撑层
- docs 是人类阅读产物,runtime 是机器消费真源
- 若需要流程、调用链或架构示意,统一使用 ASCII 文本图,不使用 Mermaid
- 总并发上限为 `3` 个 Agent,禁止超出该上限
- 单个 Agent 缺证据时必须显式标记 `[待确认]`

## 2. 执行流程

### 2.1 启动命令

- 默认入口: `spec-first first`

### 2.2 执行步骤

#### 步骤 0: 加载主线程契约

- 读取 `references/main-thread-and-evidence-contract.md`
- 主线程只保留契约摘要与波次控制信息,不携带原始长证据正文

#### 步骤 -1: 激活项目(Serena LSP)

- 调用 `mcp__serena__activate_project`
- 若 30 秒内未收到成功响应则降级到文件工具
- 降级时写入 `evidence-pack/shared/context.json`:
  - `serena_status: "unavailable"`
  - `fallback: "glob-grep-read"`
- 激活成功时写入 `evidence-pack/shared/context.json`:
  - `serena_status: "active"`
- 激活成功时优先读取项目 memory 的摘要信息,不保留完整正文

#### 步骤 1: 收集证据包

- **惰性收集模式**: 主线程只收集 L0 最小证据（项目类型、入口），其他证据由 Agent 按需收集
- **缓存机制**: 所有证据读取必须经过 `evidence-pack/shared/cache.json`
- **缓存读取流程**:
  1. 先查缓存，缓存命中则直接使用
  2. 缓存未命中时读取源文件
  3. 将读取结果写入缓存
  4. 记录读取者和时间戳
- **最小必读层**: 主线程初始化时读取以下文件：
  - `package.json` / `pyproject.toml` / `go.mod` (manifest)
  - `README.md` (项目说明)
  - 入口文件 (识别项目类型)
- 所有 Agent 共享同一份证据缓存
- 主线程写入 `evidence-pack/shared/summary.json` 和 `evidence-pack/shared/context.json`
- `evidence-pack/shared/cache.json` 由各 Agent 共同维护

#### 步骤 2: 派发 runtime agents

- runtime agents 负责产出结构化 runtime 结果
- 输出必须对齐当前 runtime contract
- 不允许把 docs 当输入真源
- runtime agents 分波派发,单波最多 3 个 Agent 并发

#### 步骤 3: 派发 docs agents

- docs agents 负责产出 `docs/first/*.md`
- docs 可以更详细,但不得与 runtime 明确冲突
- docs 不参与后续上下文注入
- docs agents 分波派发,单波最多 3 个 Agent 并发

#### 步骤 4: 写入最终文件

- runtime agents 与 docs agents 产出的结果直接写入最终路径
- runtime 输出写入 `.spec-first/runtime/first/*`
- docs 输出写入 `docs/first/*`
- Skill 层在最终文件落盘后结束,不再保留中转交接目录

## 3. Agent 分组

### 3.1 runtime agents

| Agent 名称 | 产出文件 |
|-----------|---------|
| `summary-steering` | `summary.json`、`steering.json` |
| `conventions-entry-guide` | `conventions.json`、`entry-guide.json` |
| `critical-flows` | `critical-flows.json` |
| `api-contracts` | `api-contracts.json` |
| `structure-overview` | `structure-overview.json` |
| `domain-model` | `domain-model.json` |
| `database-schema` | `database-schema.json` |

### 3.2 docs agents

| Agent 名称 | 产出文件 |
|-----------|---------|
| `overview-docs` | `README.md`、`summary.md`、`steering.md` |
| `engineering-docs` | `conventions.md`、`development-guidelines.md`、`entry-guide.md` |
| `flow-docs` | `critical-flows.md`、`call-graph.md` |
| `api-docs` | `api-docs.md`、`external-deps.md` |
| `structure-docs` | `codebase-overview.md`、`architecture.md` |
| `model-docs` | `domain-model.md`、`database-er.md` |

## 4. Agent 输入与输出边界

### 4.1 runtime agents

- **输入**: 本轮 evidence pack、当前 wave、上一轮 runtime 结果摘要
- Serena 可用时优先使用符号工具；`shared/summary.json` 与 `shared/context.json` 是本轮共享事实起点
- **输出**: 对应的结构化 runtime JSON(必须附带证据指针/来源路径)
- **禁止**: 把 docs 正文当作真源或把长篇分析回灌主线程
- **若输入证据不足**: 必须在输出中显式标注 `[待确认]`,并说明缺口位置(字段/模块/链路)

### 4.2 docs agents

- **输入**: 本轮 evidence pack、已确认的 runtime 结果、当前 wave
- 优先读取 `shared/summary.json` 与 `shared/context.json`,再结合已确认 runtime 结果展开
- **输出**: 对应的 `docs/first/*.md`
- **禁止**: 重新取证或反向修正 runtime 真源
- **门禁**: docs agents 只能基于"已确认"的 runtime 资产展开；缺少真源时必须返回阻塞原因,不得硬写正文补洞

## 5. 推荐波次

### Wave 1: 基础信息

- `summary-steering`
- `conventions-entry-guide`
- `critical-flows`

### Wave 2: 结构与契约

- `api-contracts`
- `structure-overview`
- `domain-model`

### Wave 3: 数据库

- `database-schema`

### Wave 4: 基础文档

- `overview-docs`
- `engineering-docs`
- `flow-docs`

### Wave 5: 详细文档

- `api-docs`
- `structure-docs`
- `model-docs`

## 6. 波次前置条件

| Wave | 前置条件 | 部分失败策略 |
|------|---------|------------|
| Wave 1 | 本轮 evidence pack 已可读 | 3 个 runtime agents 可独立派发；某个 agent 失败不阻止同波其他 agent |
| Wave 2 | `summary-steering` healthy,且 Wave 1 的共享证据基础已收敛 | `api-contracts` 与 `structure-overview` 可在各自输入满足时继续；`domain-model` 依赖 `summary-steering` healthy,若该前置失败则保持阻塞 |
| Wave 3 | Wave 2 的结构化 runtime 资产已可用 | 若 Wave 2 的关键资产仍 `blocked`,Wave 3 不派发 |
| Wave 4 | Wave 1-3 的 runtime 资产均已可用于 docs 生成 | 允许个别 docs agent 失败重试,但不得用未确认事实补洞 |
| Wave 5 | 对应 runtime 资产与 docs 输入均已确认 | 只消费已确认 runtime 结果,缺口继续标记 `[待确认]` |

**规则**:

- docs agents 默认读取同轮 evidence pack,并参考 runtime agents 已产出的结果
- `database-er.md` 必须受 `databaseSchema.status` 约束
- 任一波次最多并发 3 个 Agent
- 每波最多 3 个 Agent,且不得突破总并发上限

## 7. 失败与重试

- **统一策略**: 失败重试一次后再阻断
- **runtime agent 失败**:
  - 优先重试一次
  - 仍失败则阻断对应 runtime 资产写盘,并回传失败原因(用于阻塞下游 docs 派发)
- **docs agent 失败**:
  - 可单独重试
  - 仍失败不得伪造内容补洞；允许只输出"阻塞原因 + `[待确认]` 缺口标记"供主线程决策
- **任意 Agent 缺证据**:
  - 输出 `[待确认]`
  - 不得把猜测写成确定事实

## 8. CLI 最小支撑层职责

### 8.1 runtime 校验

- 校验 runtime JSON 可解析
- 校验必填字段存在
- 校验字段类型与条件型状态合法

### 8.2 runtime 读取与校验

- 读取 `.spec-first/runtime/first/*.json`
- 校验 `index.json`
- 若 runtime 缺失,最小支撑层直接失败

### 8.3 docs 存在性检查

- 检查固定 docs 是否存在
- 检查条件型 docs 是否在条件满足时存在

## 9. Skill 层与 CLI 的交接边界

- **Skill 层输出**:
  - runtime 结果
  - docs 结果
  - 失败/重试结论
- **默认最终位置**:
  - `.spec-first/runtime/first/*.json`
  - `docs/first/*.md`
- `call-graph.md`、`architecture.md` 等带图文档如需示意,必须使用 ASCII 文本图或表格,不得引入 Mermaid
- **CLI 输出**:
  - runtime 校验结果
  - docs 存在性检查结果
- 若缺少最终文件,CLI 直接失败,不再保留本地认知 fallback

## 10. 删除的旧语义

- 本地旧式 builder 主导认知产出(历史语义,已删除)
- `docs/first` 作为文档真源
- docs 内容漂移作为系统错误
