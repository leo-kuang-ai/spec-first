## 执行流程

### 默认路径

默认直接执行：

```bash
spec-first first
```

非交互批处理推荐：

```bash
spec-first first --yes
```

CLI 主链负责：
- 检测项目与现有 runtime 状态
- 生成或刷新 `.spec-first/runtime/first/`
- 从 runtime truth 统一投影 `docs/first/*.md`

### 运行阶段

#### 1. 定位与校验

- 确认当前目录是可识别项目
- 判断已有 runtime truth 是否健康
- 如已有健康 runtime，优先走增量刷新
- 如无健康 runtime，走首次 bootstrap

#### 2. 项目识别

- 语言、框架、端类型识别
- Greenfield / Brownfield 判定
- 必要时允许 `--type=<backend|frontend|mobile|cross-platform|desktop|monorepo|mixed>` 手动指定

识别规则详见 `references/detection-rules.md`。

#### 3. Runtime 真源生成与刷新

- 先生成或更新结构化 runtime 资产
- `summary.json` 只能从结构化分析结果或其他 runtime 资产汇总
- `docs/first/*` 仅是 projection，不得作为真源反推
- `index.json` 记录正式 runtime 资产的状态和健康度

#### 4. Docs 最终投影

- 统一从 runtime truth 生成 `docs/first/*.md`
- 条件型能力先看 runtime 状态，再决定是否输出对应文档
- `database-er.md` 只有在 `databaseSchema.status === healthy` 时生成

## 增强路径

只有在默认 CLI 输出证据不足时，才按需读取以下增强 reference：

- `references/agents-code-analysis.md`
- `references/agents-api-deps.md`
- `references/agent-guidelines-setup.md`
- `references/agent-database.md`
- `references/agent-domain-model.md`
- `references/subagent-architecture.md`

增强路径的目的：
- 补深结构、架构、调用链证据
- 补强 API 契约、领域模型、数据库关系
- 不改变 runtime-first 主链，不把 Markdown 变成真源

## 当前正式资产集

- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

正式投影视图收口为：
- `README.md`
- `summary.md`
- `steering.md`
- `conventions.md`
- `critical-flows.md`
- `entry-guide.md`
- `api-docs.md`
- `codebase-overview.md`
- `domain-model.md`
- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `development-guidelines.md`
- `database-er.md`
