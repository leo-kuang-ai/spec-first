# spec-graph-bootstrap 知识摄入层演进方案

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 来源：基于业界借鉴文章《Kreuzberg + Tree-sitter + LSP 三层工程智能架构》的技术洞察，结合顶尖软件工程审查 + AI Coding Workflow 架构 + Specification Engineering 三层视角，对 `spec-graph-bootstrap` 的架构缺口与演进路径做出系统性分析。
>
> 核心命题：spec-graph-bootstrap 当前只有"结构层"和"语义层"，**完全缺少"摄入层"**。从"工具降级链"演进为"双轴并行萃取 + 合并"，是下一阶段最高价值比的架构方向。

---

## 1. 现状诊断

### 1.1 当前价值链（实际）

```
源码文件
  → CRG (AST/graph)       ← 结构层，Full 模式
  → Serena MCP (LSP)      ← 语义层，Enhanced 模式降级
  → Built-in heuristics   ← 基础模式降级
  → fact-inventory.json
  → docs/contexts/<slug>/
```

这是一条**单轴线性降级链**：工具越少，能力越弱。

### 1.2 文章揭示的完整价值链（目标）

```
异构项目知识
  ├── 源码文件（.ts/.py/.rs/SQL/Shell）
  ├── 项目文档（README/ADR/CHANGELOG/CONTRIBUTING）
  ├── 规格文件（openapi.yaml/proto/schema.graphql）
  ├── 配置文件（.github/workflows/*.yml/k8s/*.yaml）
  └── 数据库文件（migrations/*.sql/ERD 文档）
        │
        ▼
  摄入层（统一归一化，发现 + 分类）    ← 当前完全缺失
        │
        ▼
  结构层（AST/语法解析，CRG + Tree-sitter）  ← 已有，代码侧
        │
        ▼
  语义层（工程语义，Serena/LSP）             ← 已有，降级路径
        │
        ▼
  fact-inventory.json（代码事实 + 文档事实）
        │
        ▼
  docs/contexts/<slug>/ + injection-index.yaml
```

### 1.3 缺口全景

| 缺口类型 | 具体表现 | 影响范围 |
|------|------|------|
| **摄入层缺失** | Phase 0/1 不扫描非代码文件 | fact-inventory 只有代码事实 |
| **单轴降级模型** | 文档丰富但无 CRG 时仍判 `Basic (low)` | data_quality 误报 |
| **injection-index 盲区** | 路由条件不感知来源层次 | 下游 LLM 无法区分事实质量 |
| **database worker 文档侧** | 只从代码倒推 ORM，不读 migrations/ | 数据库事实不完整 |
| **workspace 知识孤岛** | child repo 之间知识不互通 | workspace 场景价值打折 |

---

## 2. 设计原则（继承仓库 AI 决策输入原则）

演进必须遵守本仓库的核心设计哲学：

- **轻 contract + 明确边界**：文档摄入层只暴露稳定、可组合的发现事实，不把解析逻辑硬编码进 contract
- **让 LLM 决策**：摄入层的职责是给模型提供更真实、更贴近当前任务的输入，不是替模型做摄入决策
- **优先提高输入质量**：文档事实以 `source_layer` 标注传入 fact-inventory，不引入新的 orchestration 层
- **不做成状态机**：文档扫描不引入 stage transition 或审批分支，保持独立可组合

---

## 3. 演进方案

### 3.1 Phase 0.5：Project Knowledge Registry（优先级 1）

**位置**：Phase 0 完成后、Phase 1 开始前插入

**职责**：轻量扫描，只做发现登记，不做深度解析

**扫描目标**：

```
项目根目录
  docs/                      → 递归扫描 .md 文件
  README.md / CONTRIBUTING.md / CHANGELOG.md  → 特殊处理
  openapi*.yaml / swagger*.yaml               → API 规格
  *.proto / schema.graphql                    → 类型规格
  migrations/ / db/                           → 数据库 schema
  .github/workflows/*.yml                     → CI/CD 拓扑
  k8s/ / helm/ / infra/                       → 基础设施
```

**产出**：`.spec-first/workflows/bootstrap/<slug>/project-knowledge-registry.json`

```json
{
  "schema_version": "v1",
  "generated_at": "<ISO>",
  "doc_facts_coverage": "rich | partial | absent",
  "entries": [
    {
      "source_file": "docs/ADR-001.md",
      "kind": "adr",
      "size_bytes": 2048,
      "last_modified": "<ISO>"
    },
    {
      "source_file": "openapi.yaml",
      "kind": "api_spec",
      "spec_format": "openapi",
      "size_bytes": 15360,
      "last_modified": "<ISO>"
    },
    {
      "source_file": "CHANGELOG.md",
      "kind": "changelog",
      "size_bytes": 8192,
      "last_modified": "<ISO>"
    }
  ]
}
```

**kind 枚举**：`adr | api_spec | changelog | convention | ci_topology | db_migration | db_schema_doc | infra_config | readme`

**`doc_facts_coverage` 计算规则**：

```
rich    = entries 中含 ≥2 种高价值 kind（adr / api_spec / db_migration / changelog）
partial = entries 非空，但不满足 rich 条件
absent  = entries 为空
```

**Phase 0.5 与 Phase 0.4 的模式判定联动**：

当前模式判定只看工具可用性。Phase 0.5 后，Mode Summary 应扩展为双轴输出：

```
📊 分析模式: Full/Enhanced/Basic | Code Facts: high/medium/low
📚 文档覆盖: rich/partial/absent | Effective Confidence: high/medium/low
```

其中 `Effective Confidence` 综合两轴：

```
effective_confidence:
  code=high  + doc=rich    → high
  code=high  + doc=partial → high
  code=high  + doc=absent  → medium-high（标注：文档覆盖不足）
  code=medium + doc=rich   → medium（文档补偿部分代码分析不足）
  code=medium + doc=partial→ medium
  code=low   + doc=rich    → medium（重要提升，当前错误判为 low）
  code=low   + doc=absent  → low
```

---

### 3.2 fact-inventory.json schema 扩展（优先级 2）

在现有五个核心数组基础上，新增三个**可选**文档维度数组：

```yaml
# 新增（全部 optional，不影响现有 Full/Enhanced/Basic 路径）

architecture_decisions:           # 来自 ADR 文件
  - source_file: string           # 如 "docs/ADR-001.md"
    decision: string
    rationale: string
    status: "accepted | deprecated | superseded"
    source_layer: "document"
    confidence: "document-backed"
    updated_at: <ISO>

api_specs:                        # 来自 OpenAPI/Protobuf/GraphQL
  - source_file: string
    spec_format: "openapi | protobuf | graphql"
    endpoints_count: number
    key_endpoints: [{ path, method, summary }]
    source_layer: "document"
    confidence: "document-backed"
    updated_at: <ISO>

known_pitfalls_from_history:      # 来自 CHANGELOG/issues
  - source_file: string
    version: string | null
    description: string
    affected_area: string | null   # 如 "database/migration"
    source_layer: "document"
    confidence: "document-backed"
    updated_at: <ISO>
```

**已有字段的 `source_layer` 标注**：

对现有五个数组的每条记录，追加 `source_layer` 字段：

```yaml
source_layer: "code" | "document" | "inferred"
```

- CRG AST 提取 → `code`
- Serena LSP hover → `inferred`（推断，非直接代码解析）
- Phase 0.5 文档扫描 → `document`

**backward compatibility 保证**：

- 三个新数组均为 optional，不在 schema 中标记 required
- 现有 Phase 1 路径不变，`source_layer` 字段在旧 manifest 中缺失时下游按 `inferred` 处理
- `minimal-context.schema.json` 与 `artifact-manifest.schema.json` 同步追加字段，旧字段无变化

---

### 3.3 data_quality 双轴重构（优先级 2）

**当前**（单轴）：

```
data_quality: "fact-backed | partial | mixed | empty | sample-backed | skeletal"
```

**演进后**（双轴）：

```yaml
data_quality:
  code_facts: "fact-backed | partial | skeletal | empty"   # 代码提取质量，语义同现有单轴
  doc_facts: "rich | partial | absent"                     # 文档摄入质量，来自 Phase 0.5
  effective_quality: "fact-backed | partial | mixed | empty | sample-backed | skeletal"  # 综合判定，供 evaluateContext 消费
```

**`effective_quality` 计算规则**（`evaluateContext` 消费，backward compatible）：

```
code=fact-backed + doc=rich    → "fact-backed"
code=fact-backed + doc=partial → "fact-backed"
code=fact-backed + doc=absent  → "fact-backed"（不变，doc 不影响代码事实判定）
code=partial     + doc=rich    → "partial"（文档补偿标注在 coverage_gaps）
code=partial     + doc=partial → "partial"
code=skeletal    + doc=rich    → "mixed"（比当前纯 skeletal 提升一级）
code=empty       + doc=rich    → "sample-backed"（文档是唯一来源时等同 sample）
```

**对现有 `evaluateContext` 降级逻辑的影响**：

只改 `effective_quality` 的输入来源，不改降级规则本身：

- `effective_quality: 'fact-backed'` 且 minimal context 存在 + freshness 未 stale → L0（不变）
- `partial / mixed` 最高 L1（不变）
- `empty / sample-backed / skeletal` 最高 L2（不变）

---

### 3.4 injection-index 来源感知路由（优先级 3）

**当前 selection_rules 只有两类条件**：

```yaml
selection_rules:
  - condition: "output_exists.code_facts_public_entrypoints"
    inject: [...]
  - condition: "fact.graph_support_state == 'local-available'"
    inject: [...]
```

**演进后追加文档维度条件**（不修改现有条件）：

```yaml
selection_rules:
  # 现有条件保留不变
  - condition: "output_exists.code_facts_public_entrypoints"
    inject:
      - code-facts/public-entrypoints.md
  - condition: "fact.graph_support_state == 'local-available'"
    inject:
      - architecture/module-map.md
      - code-facts/high-risk-modules.md

  # 新增文档来源条件
  - condition: "output_exists.architecture_decisions"
    inject:
      - architecture/architecture-decisions.md    # Phase 3 新增条件产物
  - condition: "output_exists.api_specs"
    inject:
      - code-facts/api-contract.md                # Phase 3 新增条件产物
  - condition: "output_exists.known_pitfalls_from_history"
    inject:
      - pitfalls/historical-pitfalls.md           # 补充现有 pitfalls/index.md
```

**Phase 3 新增条件产物规范**：

| 产物 | 触发条件 | 数据来源 | 注入阶段 |
|------|------|------|------|
| `architecture/architecture-decisions.md` | `fact-inventory.architecture_decisions` 非空 | ADR 文件 | plan |
| `code-facts/api-contract.md` | `fact-inventory.api_specs` 非空 | OpenAPI/proto | review / work |
| `pitfalls/historical-pitfalls.md` | `fact-inventory.known_pitfalls_from_history` 非空 | CHANGELOG | review |

---

### 3.5 database worker 文档侧补充（优先级 3）

**当前**：`database-routing.json` 的候选连接只从源码 ORM 配置倒推

**演进后**：Phase 0.5 若发现 `kind: db_migration` 或 `kind: db_schema_doc` 文件，Phase 1 database 提取时同时读取这些文件，补充 `static_access_hints`：

```yaml
# database[] 记录新增字段
doc_schema_sources:
  - source_file: "migrations/001_init.sql"
    kind: "db_migration"
    tables_hint: ["users", "orders"]    # 轻量提取，不做完整解析
```

database worker Step 1（现有的 schema 探测）可优先消费这些 `doc_schema_sources`，无需全量 probe 即可建立 table 目录。

---

### 3.6 workspace 模式跨仓库知识联通（优先级 4，后续迭代）

**W.2 workspace-registry.json 扩展**：

在每个 child 记录中追加 `doc_facts_coverage` 字段：

```json
{
  "childSlug": "frontend",
  "repoRoot": "...",
  "doc_facts_coverage": "rich",   // 新增
  "status": "ready"
}
```

**W.3 workspace Docs 扩展**：

新增 `workspace/knowledge-registry-overview.md`，汇总各 child 的文档覆盖度，便于 plan 阶段感知哪个 repo 的上下文更可靠。

---

## 4. 涉及文件清单

### 4.1 skill 层（Phase 0–4 流程定义）

| 文件 | 改动类型 | 改动内容 |
|------|------|------|
| `skills/spec-graph-bootstrap/SKILL.md` | 新增章节 | Phase 0.5 流程定义 |
| `skills/spec-graph-bootstrap/SKILL.md` | 修改 Phase 0.4 | Mode Summary 输出扩展为双轴 |
| `skills/spec-graph-bootstrap/SKILL.md` | 修改 Phase 1.6 | `source_layer` 字段写入校验 |
| `skills/spec-graph-bootstrap/SKILL.md` | 修改 Phase 2 | 新增三类条件产物的 PRD 触发条件 |
| `skills/spec-graph-bootstrap/SKILL.md` | 修改 Phase 3 | 新增三类条件产物的 Worker 定义 |
| `skills/spec-graph-bootstrap/SKILL.md` | 修改 Phase 4 | injection-index 新增文档来源 selection_rules |
| `skills/spec-graph-bootstrap/references/artifact-schemas.md` | 修改 | `fact-inventory.json` 新增三个可选数组 + `source_layer` 字段 |
| `skills/spec-graph-bootstrap/references/artifact-schemas.md` | 修改 | `artifact-manifest.json` `data_quality` 双轴定义 |

### 4.2 编译器层（`src/bootstrap-compiler/`）

| 文件 | 改动类型 | 改动内容 |
|------|------|------|
| `src/bootstrap-compiler/compile-routing.js` | 修改 | 读取 `project-knowledge-registry.json`，生成文档来源 selection_rules |
| `src/bootstrap-compiler/run-bootstrap.js` | 修改 | Phase 0.5 扫描逻辑，写入 `project-knowledge-registry.json` |
| `src/bootstrap-compiler/compile-machine-artifacts.js` | 修改 | `data_quality` 双轴计算，写入 `effective_quality` |

### 4.3 契约层（`docs/contracts/`）

| 文件 | 改动类型 | 改动内容 |
|------|------|------|
| `docs/contracts/spec-graph-bootstrap/artifact-manifest.schema.json` | 修改 | `data_quality` 对象化，新增 `code_facts` / `doc_facts` / `effective_quality` |
| `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json` | 修改 | 新增三个可选数组定义 + `source_layer` enum |
| 新建 `docs/contracts/spec-graph-bootstrap/project-knowledge-registry.schema.json` | 新增 | Phase 0.5 产物 schema |

### 4.4 测试层

| 文件 | 改动类型 | 改动内容 |
|------|------|------|
| `tests/unit/spec-graph-bootstrap-contracts.test.js` | 修改 | 新增 `data_quality` 双轴断言、`source_layer` 字段断言 |
| `tests/unit/managed-state-contracts.test.js` | 视影响面 | 若 data_quality 结构变化影响 managed-state，同步更新 |

---

## 5. 实施顺序与风险评估

### 5.1 阶段划分

**阶段 1（低风险，独立可验证）**：Phase 0.5 扫描 + `project-knowledge-registry.json`

- 完全新增，不修改现有路径
- 可独立合入，现有测试不受影响
- 验证：`spec-first` 仓库自举后 `project-knowledge-registry.json` 内容正确

**阶段 2（中等风险，schema 变更）**：`fact-inventory.json` + `data_quality` 双轴

- 新增字段为 optional，backward compatible
- 主要风险：`evaluateContext` 的降级逻辑需同步更新
- 验证：现有 bootstrap 样本（`docs/contexts/spec-first/`）的 manifest 能用旧格式解析，新格式产出正确

**阶段 3（低风险，增量路由）**：`injection-index` 新增文档来源 selection_rules

- 不修改现有条件，只追加新条件
- 验证：`tests/unit/spec-graph-bootstrap-contracts.test.js` 新增断言通过

**阶段 4（后续迭代）**：workspace 跨仓库知识联通

- 依赖阶段 1-3 稳定后再做
- workspace 场景改动面较大，单独规划

### 5.2 backward compatibility 保证

- **现有 `artifact-manifest.json` 格式**：`data_quality` 单字段版本通过 `fallback_reason: 'legacy_manifest_missing_quality_fields'` 降级，不 break
- **现有 `fact-inventory.json`**：新增数组全部 optional，旧版本解析不受影响
- **现有 injection-index consumer**（`src/context-routing/`）：新增 `selection_rules` 条件只在新产物存在时触发，旧仓库无新产物时静默跳过

---

## 6. 验证 as Done

- [ ] `spec-first` 仓库自举运行 `spec-graph-bootstrap`，产出 `project-knowledge-registry.json`，`doc_facts_coverage: rich`（因为 `docs/` 目录丰富）
- [ ] `artifact-manifest.json` 的 `data_quality` 字段结构为双轴格式，`effective_quality` 正确计算
- [ ] `fact-inventory.json` 的已有条目带 `source_layer: "code"`
- [ ] `injection-index.yaml` 包含文档来源 selection_rules（若 Phase 0.5 发现了对应文件）
- [ ] 现有 `tests/unit/spec-graph-bootstrap-contracts.test.js` 全部通过（不退化）
- [ ] 空仓库 bootstrap（无 docs/）的 `doc_facts_coverage: absent`，`effective_quality` 不低于现有基准

---

## 7. 非目标（本方案明确不做）

- **不引入 OCR / 图片摄入**：Kreuzberg 的图片摄入能力对当前场景 ROI 不高，留待后续
- **不做外部文档摄入**（飞书、Confluence、GitHub Issues）：Phase 0.5 只扫描本地项目文件
- **不重构 CRG**：文档摄入层是对 CRG 的正交补充，不替代 CRG 的代码分析能力
- **不做文档自动同步**：文档事实只在 bootstrap rerun 时更新，不做 watch/incremental
- **不做文档 → 代码一致性自动对比**：文章场景 3 的验收一致性检查属于 `spec-code-review` 领域，不是 `spec-graph-bootstrap` 的职责
