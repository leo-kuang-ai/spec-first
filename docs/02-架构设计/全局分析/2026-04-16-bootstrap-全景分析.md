# Bootstrap 全景分析：legacy bootstrap vs spec-graph-bootstrap

> Lifecycle: historical-input / external-reference. 本文保留旧架构、方案、迁移或研究记录；当前 source of truth 以 `docs/README.md`、根目录 README、`docs/05-用户手册/`、`docs/contracts/`、`skills/`、`src/cli/` 和 `CHANGELOG.md` 为准。

> 基于代码事实（`skills/spec-graph-bootstrap/SKILL.md` + `skills/spec-graph-bootstrap/SKILL.md`），不含推测。
>
> 作者: 2026-04-16 | spec-first 内部架构分析

---

## 一、系统定位

两个 bootstrap skill 都是 **Stage-0 supporting workflow**，目标是在 spec-first 五阶段工作流（brainstorm→plan→work→review→compound）运行前，为目标项目生成**可复用的项目上下文资产**。

| | spec-graph-bootstrap | spec-graph-bootstrap |
|---|---|---|
| 入口 | `spec-graph-bootstrap [target]` | `spec-graph-bootstrap [target]` |
| 核心工具层 | Serena MCP / Read+Grep+Glob | CRG CLI（Tier 1）→ Serena → Read+Grep+Glob |
| 分析模式数 | 2（Enhanced / Basic） | 3（Full / Enhanced / Basic） |
| 产物层 | 人类可读 markdown 文档 | 机器可读 JSON 控制面 + 人类可读文档 |
| Stage-0 路由层 | ❌ 无 | ✅ injection-index.yaml |
| Phase 数量 | 3（Readiness → Analyze → Execute） | 5（0 就绪 → 1 事实抽取 → 2 规划 → 3 生成 → 4 路由） |

---

## 二、spec-graph-bootstrap：全链路分析

### 2.1 宏观架构

spec-graph-bootstrap 是一个 **单层编排器模式**：编排器自身完成分析（Phase 1），写出 PRD 合同（Phase 2），再派发 worker subagent 执行（Phase 3）。

核心设计原则：
- 编排器是唯一的分析者，不依赖外部 JSON 产物
- Worker 通过 PRD 获得全部上下文，不回扫源码以外的信息
- README.md 由编排器串行汇总，不委托给 worker

### 2.2 ASCII 全链路流程图

```
spec-graph-bootstrap [target-repo-path-or-slug]
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  HOST READINESS GATE（必须通过，否则立即停止）                      │
│                                                                  │
│  Step 1: Read host-setup.json                                    │
│    ├─ 不存在/setup_success!=true  ──→  ⛔ NOT_SETUP              │
│    └─ setup_success=true         ──→  继续                       │
│                                                                  │
│  Step 2: MCP Probe（context7 resolve-library-id 或 serena）      │
│    ├─ 失败                        ──→  ⛔ SETUP_DONE_NOT_RESTARTED│
│    └─ 成功                        ──→  State: READY              │
└──────────────────────────────────────────────────────────────────┘
        │ READY
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: 分析目标仓库                                             │
│                                                                  │
│  1.1 Slug 生成（优先级：用户显式 > reuse > 目录名）                 │
│      └─ 非阻断，立即告知用户选定的 slug                             │
│                                                                  │
│  1.2 Rerun Backup（R20）                                         │
│      └─ docs/contexts/<slug>/ 存在时                              │
│         → backup to .spec-first/workflows/bootstrap/<slug>/backup_<T>/
│         → 校验文件数一致，否则 ABORT                               │
│                                                                  │
│  1.3 Serena Probe（决定分析模式）                                  │
│      ├─ get_current_config                                       │
│      ├─ activate_project（无已激活项目时）                          │
│      └─ get_symbols_overview（轻量探针）                           │
│           ├─ 成功  ──→  mode=Enhanced                            │
│           └─ 失败  ──→  mode=Basic                               │
│                                                                  │
│  1.4 Layer Detection（7 类：frontend/backend/mobile/              │
│      desktop/cli/shared/data）                                   │
│      └─ 机械证据检测（package.json / 目录模式 / 框架特征）            │
│                                                                  │
│  1.5 DB Configuration Detection（MySQL only in MVP）              │
│      检测优先级：用户显式 > .spec-first/meta/config.yaml           │
│                > .env > ORM configs > Framework configs          │
│      验证：MCP SELECT 1 + DATABASE() 一致性校验                   │
│                                                                  │
│  输出：分析模式确定 + 层级清单 + DB 访问级别                          │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: PRD Task Contract 生成                                  │
│                                                                  │
│  固定 Tasks（总是创建）:                                            │
│    summary-context  → 00-summary.md                              │
│    architecture-context → architecture/{system-overview,         │
│                           module-map,integration-boundaries}.md  │
│    pitfalls-context → pitfalls/index.md                          │
│                                                                  │
│  条件 Tasks（Phase 1.4 检测到的层）:                               │
│    {frontend|backend|mobile|desktop|cli|shared|data}-context     │
│    guides-context（≥3 层 且 ≥2 层有显式跨层依赖时）                  │
│                                                                  │
│  数据库 Task（Phase 1.5 MySQL 已验证时）:                           │
│    database-context → database/database-er.md                   │
│                                                                  │
│  PRD 写入路径：                                                    │
│    .spec-first/workflows/bootstrap/<slug>/tasks/<id>/prd.md      │
│                                                                  │
│  2.5 PRD Quality Gate（4 检查，自动 enrich，不人工审批阻断）          │
│    ├─ Goal 具体（不是泛型 bootstrap 描述）                          │
│    ├─ Context 含 Phase 1 真实证据（路径/类名/函数名/配置键）           │
│    ├─ Files to Fill 列出精确文件路径                                │
│    └─ Technical Notes 含 ≥1 项目专属约束                           │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3: Worker Subagent 执行                                    │
│                                                                  │
│  并行（无共享文件的 worker 同时启动）:                               │
│    summary-context worker                                        │
│    architecture-context worker                                   │
│    pitfalls-context worker                                       │
│    [frontend|backend|...]-context worker × N                     │
│    database-context worker（条件）                                │
│                                                                  │
│  每个 worker 合同:                                                 │
│    task_id + prd_path + ownership_boundary + guardrails           │
│    + completion_report                                            │
│  超时：20 分钟 → 视为失败                                           │
│                                                                  │
│  失败处理:                                                         │
│    summary-context 失败 → 全量恢复 backup                          │
│    其他 worker 失败   → 保留成功产物，写 partial README              │
│    所有 worker 失败  → 全量恢复 backup                             │
│                                                                  │
│  串行（所有 worker 完成后）:                                        │
│    编排器写 docs/contexts/<slug>/README.md                        │
│    成功 → 删除 backup                                             │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
  最终产物：docs/contexts/<slug>/
    README.md（含 <!-- spec-graph-bootstrap --> 标记）
    00-summary.md
    architecture/system-overview.md
    architecture/module-map.md
    architecture/integration-boundaries.md（条件）
    pitfalls/index.md
    layers/{frontend|backend|...}/index.md（条件）
    guides/index.md（条件）
    database/database-er.md（条件）
```

### 2.3 关键微观设计

#### Slug 生成不阻断（R12-R13）

三级优先级：用户显式参数 → 扫描已有 `<!-- spec-graph-bootstrap -->` 标记 → 目录名 kebab-case。全程不等待用户确认，只在 summary 中告知用户选定值。**设计意图**：避免让用户在工作流入口处反复确认标识符。

#### PRD Quality Gate 自动 enrich（Phase 2.5）

4 项检查，任一不通过时自动 enrich（补充 Phase 1 证据），循环重检，不引入人工审批步骤。**设计意图**：让 PRD 作为 worker 唯一上下文源，质量不足时由编排器自修复而非阻断用户。

#### 数据库多级降级（Phase 1.5）

MCP（Level 1）→ CLI（Level 2）→ ORM inference（Level 3）。Level 1 额外要求：`SELECT DATABASE()` 结果与项目配置中的 `db_name` 一致，不一致则降级 CLI，防止 MCP 连接的是错误数据库实例。**精确设计**：project_db_pass_env 只记录环境变量名，不写入值。

#### backup 的关键守则（R20）

文件数校验是硬门控：backup 文件数 ≠ 原目录文件数 → 立即 ABORT，不进入 Phase 3。保证"永远不静默进入半覆盖状态"。

---

## 三、spec-graph-bootstrap：全链路分析

### 3.1 宏观架构

spec-graph-bootstrap 是 **双层架构**：

1. **控制面（machine-first）**：CRG CLI 产出 AST-grade 事实 → JSON 控制面（fact-inventory.json / risk-signals.json / test-surface.json）
2. **文档面（human-readable）**：Worker subagent 消费控制面 JSON → 生成 markdown 文档

核心设计差异：
- **事实与展示分离**：Worker 不回扫源码，只读 fact-inventory.json
- **schema contract 外置**：`docs/contracts/spec-graph-bootstrap/` 是机器真源，SKILL.md 只保留阶段流程
- **编译职责分离**：`src/bootstrap-compiler/` 承接最终编译链（`compile-machine-artifacts.js` → `compile-human-assets.js` → `compile-routing.js`）
- **injection-index.yaml**：Phase 4 生成路由索引，下游 spec-plan/spec-work/spec-code-review 通过此文件自动选取注入上下文

### 3.2 ASCII 全链路流程图

```
spec-graph-bootstrap [target-repo-path]
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 0: 就绪探测与模式判定                                        │
│                                                                  │
│  0.1 Slug 生成（优先于其他所有步骤）                                  │
│      slug = basename(resolve(target))，特殊字符→'-'               │
│      立即打印: 📁 Slug + 产物路径                                   │
│                                                                  │
│  0.2 MCP 就绪探测（沿用 spec-graph-bootstrap 两步）                       │
│      Step 1: host-setup.json setup_success 检查                  │
│      Step 2: Serena probe → serena.ready=true/false              │
│                                                                  │
│  0.2b CRG CLI 就绪检查（新增）                                     │
│      Read host-setup.json                                        │
│      if version>=5 and crg.cli_available==false                  │
│        → crg.indexed=false，graph_support_state=crg-cli-unavailable
│        → 直接跳到 0.4 降级                                         │
│      if crg.cli_available==true and native_modules=="missing"    │
│        → ⚠️ 打印告警，继续执行但预期 crg stats 可能 exit 2           │
│                                                                  │
│  0.3 CRG 图状态检测                                               │
│      [1] graph.db 不存在 → crg.indexed=false → 3b                │
│      [2] graph.db 存在 → spec-first crg stats --repo=<target>    │
│          [2a] 非零退出/degraded=true → crg.indexed=false → 3b    │
│          [2b] node_count=0 → crg.indexed=false → 3b             │
│          [2c] node_count>0 → crg.indexed=true → 3c stale 检测    │
│                                                                  │
│      3b 提示用户构建图索引                                           │
│          用户确认 → spec-first crg build → 成功 crg.indexed=true  │
│                                          → 失败 crg.indexed=false│
│          用户拒绝 → crg.indexed=false 降级                         │
│                                                                  │
│      3c Stale 检测（artifact-manifest.json 存在时）                 │
│         对比 artifact-manifest.inputs.crg.graph_last_built       │
│         vs crg stats data.last_built + 关键文件 SHA 对比           │
│         → 不一致时打印 ⚠️ stale 告警（不阻断流程）                    │
│                                                                  │
│  0.4 模式判定                                                     │
│      crg.indexed=true             → Full    (confidence: high)   │
│      crg.indexed=false+serena=true→ Enhanced(confidence: medium) │
│      crg-cli-unavailable+s=true   → Enhanced(confidence: medium) │
│      crg-cli-unavailable+s=false  → Basic   (confidence: low)    │
│      else                         → Basic   (confidence: low)    │
│                                                                  │
│  0.6 artifact-manifest.json 第一次写入（in_progress）               │
│      记录：crg stats 快照 + 关键文件 SHA + analyzer_versions         │
│                                                                  │
│  0.7 Rerun Backup（docs/contexts/<slug>/ 已存在时）                │
│      backup 到 .spec-first/workflows/bootstrap/<slug>/backup_<T>/
│      校验文件数，不一致 ABORT                                        │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼ （Full 模式路径）
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: 事实抽取（CRG CLI 路径，5 Stage 串并结合）                 │
│                                                                  │
│  1.0 前置触发（单独一步）:                                           │
│      spec-first crg context --repo=<target>                      │
│      → 读取 top_flows / top_communities / top_hubs               │
│      → 确定后续 Stage 优先级                                        │
│                                                                  │
│  Stage A（同一 response 内并行发出）：                               │
│  ┌────────────────────────────────────────────────┐              │
│  │ crg stats + Read(package.json/go.mod/pom.xml)  │ → project_identity
│  │ crg search "schema" / "entity" / "model" /     │              │
│  │   "dto" / "migration" / "validation"           │ → data_shapes│
│  │ crg search "<框架特征>" × 10 类型               │ → layers     │
│  │ Glob + Read（DB detection，沿用 spec-graph-bootstrap）│ → database   │
│  └────────────────────────────────────────────────┘              │
│        │ 数据依赖                                                  │
│        ▼                                                          │
│  Stage B-Round1（依赖 Stage A，同一 response 内并行）：              │
│  ┌────────────────────────────────────────────────┐              │
│  │ crg flows  → 记录 data.items[].flow_id          │ → entrypoints│
│  │ crg communities → 记录 community_id             │ → modules    │
│  │ crg architecture                               │ → arch骨架   │
│  │ Read(package.json) → 候选库名清单（integration 预处理）│         │
│  └────────────────────────────────────────────────┘              │
│        │ 数据依赖                                                  │
│        ▼                                                          │
│  Stage B-Round2（依赖 B-R1，同一 response 内并行）：                 │
│  ┌────────────────────────────────────────────────┐              │
│  │ crg flow --id=<flow_id> × top-5 criticality    │ → entrypoints深度
│  │ crg community --id=<community_id> × N           │ → modules 深度
│  │ crg search <lib_name> × N（候选库）              │ → integration候选
│  └────────────────────────────────────────────────┘              │
│        │ 数据依赖                                                  │
│        ▼                                                          │
│  Stage B-Round3（依赖 B-R2，同一 response 内并行）：                 │
│  ┌────────────────────────────────────────────────┐              │
│  │ crg query --pattern=importers_of               │              │
│  │   --module=<lib_node_id_symbol_key> × N        │ → integrations│
│  └────────────────────────────────────────────────┘              │
│        │ 数据依赖                                                  │
│        ▼                                                          │
│  Stage C（依赖 B-R3，同一 response 内并行）：                        │
│  ┌────────────────────────────────────────────────┐              │
│  │ crg query --pattern=tests_for                  │              │
│  │   --subject=<member.id> × ≤10                  │ → test_surface│
│  │ crg impact --symbol=<entry_node> --depth=2 × ≤5│ → risk blast │
│  │ crg large-functions --min-lines=100            │ → large funcs│
│  │ crg god-nodes                                  │ → god nodes  │
│  │ crg query --pattern=dependents_of              │              │
│  │   --module=<core_shared_node_id> × ≤5          │ → risk deps  │
│  └────────────────────────────────────────────────┘              │
│        │                                                          │
│  1.6 写入控制面（顺序：3 主文件 → artifact-manifest.json）           │
│      fact-inventory.json（写入后 4 项 JSON 校验）                  │
│      risk-signals.json                                           │
│      test-surface.json（coverage_gaps evidence 非空校验）          │
│      artifact-manifest.json（追加 generation_errors if any）       │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: 任务规划（PRD contracts，事实驱动）                        │
│                                                                  │
│  前置检查：fact-inventory.json 存在且非空，否则停止                   │
│                                                                  │
│  固定产物 PRDs（7 个）:                                             │
│    00-summary.md          ← project_identity                     │
│    architecture/module-map.md ← modules + data_shapes            │
│    pitfalls/index.md      ← risk_signals + integrations          │
│    code-facts/public-entrypoints.md ← entrypoints               │
│    code-facts/test-map.md ← testing_surface + test-surface.json │
│    code-facts/high-risk-modules.md ← risk_signals                │
│    context-packs/review-change.md ← 静态组装（不调 crg review-context）
│                                                                  │
│  条件产物：API 文档等按规则判定                                      │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3: 文档生成（fact→doc，不回扫源码）                           │
│                                                                  │
│  并行（各 Worker 消费 fact-inventory.json）:                        │
│    00-summary.md worker                                          │
│    module-map.md worker                                          │
│    pitfalls/index.md worker                                      │
│    code-facts/public-entrypoints.md worker                       │
│    code-facts/test-map.md worker                                 │
│    code-facts/high-risk-modules.md worker                        │
│    context-packs/review-change.md worker                         │
│                                                                  │
│  串行（最后）:                                                      │
│    README.md（上下文控制台，汇总所有产物状态）                          │
│                                                                  │
│  artifact-manifest.json 第二次写入（status: complete）:             │
│    记录每个产物的 depends_on（schema + analyzer 版本引用）            │
│                                                                  │
│  失败处理:                                                         │
│    任一固定 v1 产物写入失败 → 全量恢复 backup → 停止                  │
│    成功后删除 backup                                               │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 4: 路由生成                                                 │
│                                                                  │
│  生成 docs/contexts/<slug>/injection-index.yaml:                 │
│                                                                  │
│  always: [00-summary.md, README.md]                              │
│                                                                  │
│  stages:                                                         │
│    plan:    [architecture/module-map.md]                         │
│    work:    [code-facts/test-map.md]                             │
│    review:  [code-facts/high-risk-modules.md,                    │
│              pitfalls/index.md,                                  │
│              context-packs/review-change.md,                     │
│              code-facts/test-map.md]                             │
│    unknown: [README.md]                                          │
│                                                                  │
│  selection_rules:                                                 │
│    output_exists.code_facts_public_entrypoints                   │
│      → inject: code-facts/public-entrypoints.md                 │
│    fact.graph_support_state == 'local-available'                 │
│      → inject: [module-map.md, high-risk-modules.md]            │
│                                                                  │
│  advice:                                                         │
│    review: "优先 code-facts 和 risk signals，而非 narrative"       │
│    work:   "优先 code-facts 和 test-map，而非 architecture"        │
│    plan:   "优先 architecture/module-map 和 code-facts/public-entrypoints"
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
  最终产物:
  .spec-first/workflows/bootstrap/<slug>/    ← 控制面（不提交 VCS）
    fact-inventory.json
    risk-signals.json
    test-surface.json
    artifact-manifest.json（两段写入：in_progress → complete）

  docs/contexts/<slug>/                       ← 人类可读文档（VCS 资产）
    README.md
    00-summary.md
    architecture/module-map.md
    pitfalls/index.md
    code-facts/public-entrypoints.md
    code-facts/test-map.md
    code-facts/high-risk-modules.md
    context-packs/review-change.md
    injection-index.yaml
```

### 3.3 关键微观设计

#### CRG 调用的节点 ID 约束

`crg query` 系列命令的 `--symbol`/`--module`/`--subject` **必须为 symbol_key 格式字符串**（`<file_path>#<kind>#<name>#L<line_start>`），不接受裸名称。

- B-R2 `crg search <lib>` → 取精确匹配项的 `node_id`（symbol_key）→ B-R3 `crg query --module=<node_id>`
- B-R1 `crg flows` → 取 `data.items[].flow_id`（非 `id`）→ B-R2 `crg flow --id=<flow_id>`
- B-R2 `crg community` → 取 `data.members[].id`（symbol_key）→ Stage C `crg query --subject=<id>`

这是最高密度的错误陷阱：字段名错误（`id` vs `flow_id`）或类型错误（裸名称 vs symbol_key）会导致调用静默失败。

#### 置信度两级模型

| 等级 | 来源 | 约束 |
|---|---|---|
| Observed | crg flows/communities/community 直接返回的 AST 节点；crg large-functions/impact 统计；Read(package.json) | 无需 inference_reason |
| Inferred | crg query 全系列（固定 Inferred）；crg search 的 kind 分类；路径/目录命名推断 | 必须使用枚举值 inference_reason |

单条 Inferred 事实不触发 high severity，除非 ≥2 个独立信号支持。

**inference_reason 枚举**（不得使用自由描述）：
- CRG Tier: `crg-importers-evidence` / `crg-dependents-evidence` / `crg-tests-for-evidence` / `crg-semantic-search-evidence` / `crg-blast-radius-threshold` / `crg-large-function-heuristic`
- Serena Tier: `serena-pattern-match` / `serena-symbol-evidence`
- Built-in Tier: `directory-naming-pattern` / `path-naming-pattern` / `grep-import-pattern` / `read-source-code` / `package-json-analysis` / `glob-pattern-match`

#### artifact-manifest.json 两段写入

Phase 0 写入 `status: in_progress`，Phase 3 完成后写入 `status: complete` + 每个产物的 `depends_on`（精确到 schema 版本和 analyzer 版本）。**设计意图**：实现增量检测——stale 检测通过对比 `inputs.crg.graph_last_built` 与当前 `crg stats` 结果判断是否需要重跑。

#### FTS5 多词限制

`crg search` 底层 FTS5：空格 = 短语匹配（phrase match），不支持多词 OR。Stage A 中 6 个关键词（schema/entity/model/dto/migration/validation）**必须各自独立调用**，不得合并为一次调用。

---

## 四、双 Bootstrap 对比分析

### 4.1 能力矩阵

| 能力维度 | spec-graph-bootstrap | spec-graph-bootstrap |
|---|---|---|
| **事实质量** | 人工分析，质量依赖 PRD 上下文注入 | CRG AST 级事实，无幻觉 |
| **置信度建模** | ❌ 无置信度模型 | ✅ Observed/Inferred 两级 + 枚举 inference_reason |
| **下游路由对接** | ❌ 无 injection-index.yaml | ✅ Phase 4 生成，下游工作流自动消费 |
| **增量检测** | ❌ 每次全量 | ✅ artifact-manifest.json stale 检测 |
| **机器可读产物** | ❌ 纯 markdown | ✅ fact-inventory.json + risk-signals.json + test-surface.json |
| **DB 支持** | ✅ 详细（3 级 + 5 类连接状态 + R23 backup filter） | ⚠️ 仅 Phase 1.5 引用"沿用 spec-graph-bootstrap" |
| **PRD 质量门** | ✅ Phase 2.5 四检查 + 自动 enrich | ⚠️ 仅"fact-inventory.json 非空"前置检查 |
| **编译责任归属** | 编排器内联 | `src/bootstrap-compiler/` 独立模块 |
| **schema 真源** | SKILL.md 内文本 | `docs/contracts/spec-graph-bootstrap/`（外置） |
| **降级精度** | 2 级（Enhanced/Basic） | 3 级（Full/Enhanced/Basic） |
| **code-facts 层** | ❌ 无 | ✅ public-entrypoints / test-map / high-risk-modules |
| **context-packs 层** | ❌ 无 | ✅ review-change（静态组装） |

### 4.2 执行链路对比

```
spec-graph-bootstrap（简洁版）：

  Probe → Analyze → Write PRDs → Dispatch Workers → README

spec-graph-bootstrap（分层版）：

  Probe → CRG Build? → Mode →
    Stage A(parallel) →
    B-R1(parallel) →
    B-R2(parallel) →
    B-R3(parallel) →
    C(parallel) →
  Write JSON → PRDs → Dispatch Workers → README → injection-index.yaml
```

### 4.3 升级路径建议

```
新项目（无 CRG 图索引）:
  第一次 → spec-graph-bootstrap（快速上手）
         ↓ 积累后运行 spec-first crg build
  升级 → spec-graph-bootstrap（Full 模式，完整事实链）

CRG 不可用的环境（仅有 Serena）:
  → spec-graph-bootstrap（Enhanced 模式）
    = spec-graph-bootstrap（Enhanced 模式）的超集（多 code-facts + injection-index）

纯离线/受限环境（无 MCP）:
  → spec-graph-bootstrap（Basic 模式）
    注意：spec-graph-bootstrap Basic 模式 Phase 1 Enhanced/Basic 路径的
    具体调用序列在 SKILL.md 中未完整定义（见 Gap 分析）
```

---

## 五、Gap 分析与优化建议

### Gap 1：spec-graph-bootstrap 无 Stage-0 路由对接

**现状**：spec-graph-bootstrap 产出的 `docs/contexts/<slug>/` 目录无 `injection-index.yaml`，下游 spec-plan/spec-work/spec-code-review 无法通过统一路由接口消费。

**代码证据**：`skills/spec-graph-bootstrap/SKILL.md` 中明确写道：
> "Current version scope: generate context assets only. Automatic injection into the five-stage workflow is a future capability."

**影响**：使用 spec-graph-bootstrap 的项目享受不到 Stage-0 的自动上下文注入能力。

**优化方案**：在 spec-graph-bootstrap Phase 3 完成后增加一个可选 Phase 3.5，仅生成 `injection-index.yaml` 基础版（always + stages 结构），selection_rules 留空（因为无 code-facts 产物），advice 用通用模板填充。既不破坏现有设计，又打通下游消费链路。

---

### Gap 2：spec-graph-bootstrap Phase 1 Enhanced/Basic 路径未定义

**现状**：Phase 1 章节标题为"Full 模式 CRG CLI 路径"，Enhanced 和 Basic 模式的等价事实抽取调用序列**未在 Phase 1 中具体定义**。置信度规则章节提到了 Serena Tier 和 Built-in Tier 的 `inference_reason` 枚举值，但没有对应的"如何使用 Serena 完成 Stage A/B/C 等价分析"的操作流程。

**代码证据**：`skills/spec-graph-bootstrap/SKILL.md` Phase 1 开头：
> "Phase 1：事实抽取（Full 模式 CRG CLI 路径）"

整个 Phase 1 章节（1.0–1.6 共 130 行）全部是 CRG CLI 命令，无 Enhanced/Basic 分支。

**影响**：当 crg.indexed=false 降级到 Enhanced 模式时，执行者（Claude）需要自行推断如何用 Serena 完成等价分析，JSON 产物质量不一致，confidence 字段填写缺乏操作依据。

**优化方案**：在 Phase 1 末尾增加"Enhanced/Basic 模式等价路径"章节，为 fact-inventory.json 的每个关键字段（entrypoints/modules/integrations/testing_surface/data_shapes/layers）定义 Serena/Glob/Grep 的等价操作序列。

---

### Gap 3：spec-graph-bootstrap Phase 2 PRD 质量门缺失

**现状**：Phase 2 仅检查"fact-inventory.json 存在且非空"，没有对应 spec-graph-bootstrap Phase 2.5 的 4 项具体质量检查（Goal 具体性 / Context 有真实证据 / Files to Fill 精确路径 / Technical Notes 项目专属约束）。

**代码证据**：spec-graph-bootstrap Phase 2：
> "前置检查：fact-inventory.json 存在且非空，否则停止。"

spec-graph-bootstrap Phase 2.5：
> "Goal is specific and clearly tied to the current task, not generic bootstrap prose"
> "Context includes concrete evidence from Phase 1, such as real paths, class names, function names, or config keys"
> （4 项检查 + 自动 enrich 循环）

**影响**：graph-bootstrap 的 PRD 质量依赖执行者的自发努力，Worker 质量无底线保障。

**优化方案**：在 Phase 2 末尾增加与 spec-graph-bootstrap Phase 2.5 等价的质量门，复用相同 4 项检查，调整"Context 真实证据"标准为"来自 fact-inventory.json 的具体字段值（如 fact.entrypoints[0].path）"。

---

### Gap 4：两个 Bootstrap 的 DB 能力不对称

**现状**：spec-graph-bootstrap Phase 1.5 实现了完整的 MySQL 多级降级（MCP Level 1 + DATABASE() 一致性校验 + CLI Level 2 + ORM inference Level 3），以及 R23 backup table filter 和 5 类连接状态标记。spec-graph-bootstrap Phase 1.1 中仅写"4.10 Database Detection 沿用 spec-graph-bootstrap Phase 1.5"，Phase 3 的并行 Worker 列表中不含 database-context worker。

**影响**：graph-bootstrap 对于 MySQL 项目无法生成 `database/database-er.md`。

**优化方案**：在 spec-graph-bootstrap 中明确：DB 事实写入 `fact-inventory.json` 的 `database[]` 字段后，在 Phase 2 增加"database-context PRD"条件生成，Phase 3 增加 database worker，产物路径与 spec-graph-bootstrap 一致。

---

### Gap 5：crg context 的 flow_id vs id 字段陷阱无告警机制

**现状**：Phase 1.0 `crg context` 和 1.1 Stage B-R1 `crg flows` 都返回 `flow_id`（非 `id`），SKILL.md 中以注释方式提醒（`> 字段注意：flow_id 字段（非 id）`），但无 runtime 校验机制。

**影响**：执行时若字段名写错（如用 `.id` 代替 `.flow_id`），B-R2 `crg flow --id=<undefined>` 会静默失败，导致 entrypoints 事实为空，但 fact-inventory.json 写入验证不检查 entrypoints 是否非空（仅检查 JSON 合法性 + schema_version + analyzer_mode + coverage_gaps evidence）。

**优化方案**：在 Phase 1.6 写入校验中增加一条：`entrypoints` 数组在 Full 模式下不得为空（如为空则在 generation_errors 中记录 `"entrypoints-empty-in-full-mode"`，降级为 Enhanced 处理）。

---

### Gap 6：升级路径文档缺失

**现状**：两个 bootstrap 的 skill description 各自说明了功能定位，但没有任何文档明确回答"我应该用哪个"以及"什么时候从 spec-graph-bootstrap 升级到 spec-graph-bootstrap"。

**优化方案**：在两个 SKILL.md 的 `## Why This Exists` / `## 调用方式` 章节后各增加一小节 `## 选型指南`（或互相引用）：
- spec-graph-bootstrap：推荐起点，已有 CRG 图索引后建议切换 spec-graph-bootstrap
- spec-graph-bootstrap：CRG 就绪后的升级路径，产出 injection-index.yaml 可对接下游工作流

---

## 六、总体评级

| 维度 | spec-graph-bootstrap | spec-graph-bootstrap |
|---|---|---|
| **执行链路完整性** | ✅ 高（4 个 Phase 路径清晰，降级有分支） | ⚠️ 中（Phase 1 Enhanced/Basic 路径缺定义） |
| **质量保障机制** | ✅ 高（Phase 2.5 PRD Quality Gate） | ⚠️ 中（仅 JSON 存在性检查） |
| **事实可信度** | ⚠️ 中（无置信度建模，依赖 Serena 质量） | ✅ 高（Observed/Inferred + 枚举 reason） |
| **下游集成能力** | ❌ 低（无 injection-index） | ✅ 高（Phase 4 路由 + Stage-0 消费） |
| **增量运行支持** | ❌ 无 stale 检测 | ✅ artifact-manifest stale 检测 |
| **设计复杂度** | 低（适合快速理解） | 高（5 Phase + 5 Stage 串并结合） |
| **DB 能力** | ✅ 完整 | ⚠️ 仅"沿用"，无产物定义 |

**结论**：两个 bootstrap 构成清晰的**能力演进层**，spec-graph-bootstrap 是上手路径，spec-graph-bootstrap 是完整能力的最终形态。当前最大的体系性风险是：graph-bootstrap 的 Enhanced/Basic 降级路径在 Phase 1 中无操作定义，导致降级后 JSON 产物质量不可预期。修复这一 gap 是达到业界领先水平的关键前置动作。
