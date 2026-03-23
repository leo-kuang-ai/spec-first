# Spec-First 产物 ID 与 Gate 关系梳理

> 目标：按最新代码事实，梳理产物 ID 体系、ID 之间的关联关系、以及 gate 体系。
>
> 事实边界：
> - 直接证据来自 `src/shared/types.ts`、`src/core/trace-engine/**`、`src/core/change-mgr/**`、`src/core/gate-engine/**`、`src/core/document-links.ts`
> - `skills/spec-first/03-spec/references/id-types-and-status.md` 提供 ID 类型的术语背景，但不覆盖实现真源
> - 若代码没有一张统一关系表，文档只把它记为 `[推导]`
> - docs 不是真源；gate 文案、skill 文案、README 里的说法都要回到代码核对
>
> 当前说明：
> - 本文按当前工作区最新代码整理，包含 `src/cli/commands/id.ts`、`src/cli/commands/defect.ts` 的最新校验修正
> - `task-plan` 到 `TaskNode` 的投影当前仍只保留 `relatedFR` / `relatedDS`，`REQ` / `TASK` 仍留在解析层 trace 中，不进入执行契约

## 0. 一眼看懂的总图

```text
[Feature]
  └── FSREQ-YYYYMMDD-ABBR-NNN
        ├── PRD / requirements
        │     └── REQ-ABBR-NNN
        ├── spec.md / requirements convergence
        │     └── FR-ABBR-NNN
        ├── design
        │     └── DS-ABBR-NNN
        ├── plan
        │     └── TASK-ABBR-NNN
        │           └── task_plan.md traces
        │                 ├── FR-ABBR-NNN
        │                 ├── DS-ABBR-NNN
        │                 └── [推导] REQ / TASK 只在解析层保留，不进入 TaskNode 执行契约
        ├── test
        │     └── TC-UT|IT|E2E|ST-ABBR-NNN
        ├── change management
        │     ├── RFC-NNN
        │     │     └── waivers -> known-exceptions.md
        │     │           └── EX-NNN
        │     └── defect-001.json / defect-002.json ...
        │           ├── linkedFr
        │           └── linkedTc
        └── trace matrix
              └── MatrixRow{id, type, title, status, upstream, downstream, nfrTag, rfcRef}

Gate 体系：
  stage-state.json
    ↓
  dependency-check / hard-gate / confirm-policy
    ↓
  gate-evaluator / condition-registry
    ↓
  gate-history.jsonl
    ↓
  findings.md / stage advance / goLive check
```

> 读图口径：
> - `PRD / requirements` 阶段只生成 `REQ`
> - `FR` 不是 PRD 直接产物，而是后续 `spec.md` 收敛后的功能需求 ID
> - `REQ -> FR` 是推导链，不是同一阶段的并列产物

## 1. ID 类型总表

### 1.1 生成与校验层

| ID 类型 | 形式 / 示例 | 直接证据 | 载体 / 产物 | 说明 |
|---|---|---|---|---|
| `Feature` | `FSREQ-YYYYMMDD-ABBR-NNN` | `src/core/trace-engine/id-validator.ts`；`src/cli/commands/id.ts`；`src/core/process-engine/feature.ts` | `specs/{featureId}/` 目录与 `stage-state.json` | Feature 是命名空间，不是普通 trace ID |
| `REQ` | `REQ-ABBR-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | PRD / 需求项 | PRD 需求项使用 `REQ`，不和 `FR` 混用 |
| `FR` | `FR-ABBR-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | `spec.md` / 需求追踪 | 功能需求 ID |
| `DS` | `DS-ABBR-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | `design.md` / 设计追踪 | 设计规格 ID |
| `TASK` | `TASK-ABBR-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | `task_plan.md` | 任务 ID |
| `TC` | `TC-UT|IT|E2E|ST-ABBR-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | 测试用例 / 测试计划 | 生成时需要 `tcLevel` |
| `RFC` | `RFC-NNN` | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts`；`rfc.ts` | `specs/{featureId}/rfc/RFC-NNN.rfc.json` | RFC 有独立序号，不带 abbr |
| `SYS` / `ARCH` / `MOD` / `ATP` / `STP` / `ITP` / `UTP` | `SYS-ABBR-NNN` 等 | `id-taxonomy.ts`；`id-validator.ts`；`id-generator.ts` | 需求 / 架构 / 测试计划类产物 | 存在于 ID 体系，但不绑定单一 stage |

### 1.2 关系承载层

| 承载类型 | 形式 | 直接证据 | 作用 |
|---|---|---|---|
| `MatrixRow` | `id / type / title / status / upstream / downstream / nfrTag / rfcRef` | `src/shared/types.ts` | 追踪矩阵基础行 |
| `DefectRecord` | `seq / featureId / severity / ... / linkedFr / linkedTc` | `src/shared/types.ts`；`src/core/change-mgr/defect.ts` | 缺陷与 FR / TC 的关联 |
| `RfcRecord` | `impactIds / waivers / approvals` | `src/shared/types.ts`；`src/core/change-mgr/rfc.ts` | RFC 的影响范围与豁免 |
| `KnownException` | `EX-### / rfcId / frId / reason / expiresAt / rollbackPoint` | `src/shared/types.ts`；`src/core/trace-engine/exception-validator.ts`；`src/core/change-mgr/rfc.ts` | RFC 豁免的落盘形式 |

## 2. ID 生成 / 搜索 / 校验规则

### 2.1 生成

| 规则 | 直接证据 | 解释 |
|---|---|---|
| `nextId()` 先扫描现有文档中的 ID，再读取预留表 `.id-reservations.json` | `id-generator.ts` | ID 不是只靠内存计数，而是基于现有文档内容 + 预留登记 |
| `TC` 生成必须带 `tcLevel` | `id-generator.ts` | `TC` 是分层测试 ID |
| `RFC` 使用单独序号 `RFC-NNN` | `id-generator.ts`；`rfc.ts` | RFC 不带 abbr |
| `validateAbbr()` 允许连字符输入，但生成时会去掉 | `id-generator.ts` | 外部输入可带 `-`，最终 ID 规范化 |

### 2.2 校验

| 规则 | 直接证据 | 解释 |
|---|---|---|
| `validateId()` 用正则识别 Feature / FR / DS / TASK / REQ / SYS / ARCH / MOD / ATP / STP / ITP / UTP / TC / RFC | `id-validator.ts` | ID 类型识别是模式驱动 |
| `Feature` ID 格式不同于普通 trace ID | `id-validator.ts` | `FSREQ-YYYYMMDD-ABBR-NNN` 是单独格式 |
| `id-validator` 不维护关系，只判断格式 | `id-validator.ts` | 关系由 Matrix / RFC / Defect / links 承载，不由格式校验承载 |

### 2.3 搜索 / 列表

| 规则 | 直接证据 | 解释 |
|---|---|---|
| `searchId()` 基于文档内容和预留表搜索，不依赖外部关系表 | `id-search.ts` | 文档是主索引，关系表不是主索引 |
| `listIds()` 从 `collectKnownIds()` 过滤有效 ID | `id-search.ts` | 列表也是基于已存在内容 |
| `collectKnownIds()` 扫描所有 `.md/.yml/.yaml/.json` 文本文件 | `id-generator.ts` | ID 是“从文档里长出来”的 |
| `id search/list --type` 对 `IdType` 做大小写不敏感匹配 | `src/cli/commands/id.ts` | `Feature` / `REQ` / `FR` 等过滤项可被正常命中 |

## 3. ID 之间的关系

### 3.1 直接证据关系

| 关系 | 直接证据 | 说明 |
|---|---|---|
| `Feature` -> 所有产物 | `stage-state.json`、`specs/{featureId}/...`、`id-generator.ts` / `rfc.ts` / `defect.ts` 都按 `featureId` 分目录 | Feature 是一切产物的命名空间 |
| `RFC` -> `KnownException` | `rfc.ts` 的 `syncKnownExceptionsFromWaivers()` | RFC 被批准后，其 waiver 可同步成 `known-exceptions.md` 中的 EX 条目 |
| `Defect` -> `linkedFr` / `linkedTc` | `defect.ts`、`DefectRecord`、`src/cli/commands/defect.ts` | 缺陷记录直接挂 FR / TC，且当前会做类型校验 |
| `MatrixRow` -> `upstream / downstream` | `src/shared/types.ts` | 关系在行内存储，不在单独状态值里存储 |

### 3.2 推导关系链

> 下列关系是从 ID 语义、`task_plan.md` 解析器、`MatrixRow` 结构和各 stage gate 的输入要求综合推导出来的，不是单一模块里的一张全局关系表。

| 推导链 | 依据 | 备注 |
|---|---|---|
| `REQ -> FR` | `03-spec` 将 PRD 需求项收敛为 FR；`id-types-and-status.md` 区分 `REQ` 与 `FR` | PRD 用 `REQ`，需求规格用 `FR` |
| `FR -> DS` | `03-spec` 之后进入 `04-design`；`document-links.yaml` 在 `DESIGN` 阶段要求 `design.md -> spec.md` | 设计从需求收敛而来 |
| `DS -> TASK` | `06-task` 明确从 `spec.md / design.md` 拆任务；`task_plan.md` 需要 traces | 任务追踪依赖设计与需求 |
| `TASK -> TC` | `task_plan.md` 可写入 `TC` traces；`TaskNode` 当前只保留 `relatedFR` / `relatedDS`，`TC` 不进入执行契约 | 这条链在当前实现里是“语义上成立，执行器未直接显式消费” |
| `RFC -> FR` | `RfcWaiver.frId`、`KnownException.frId` | RFC 豁免最终必须落到 FR 级别 |
| `Defect -> FR/TC` | `DefectRecord.linkedFr` / `linkedTc` | 缺陷回挂功能需求与测试用例 |

### 3.3 关系图

```text
           [Feature]
               |
               v
            FSREQ-...
               |
    +----------+-----------+
    |                      |
    v                      v
  REQ-...                RFC-NNN
    |                      |
    v                      v
  FR-...              waivers / approvals
    |                      |
    v                      v
  DS-...              known-exceptions.md
    |                      |
    v                      |
  TASK-...               EX-...
    |                      |
    v                      |
  TC-UT|IT|E2E|ST-...     |
    |                      |
    +----------+-----------+
               |
               v
          DefectRecord
        linkedFr / linkedTc

MatrixRow:
  id, type, title, status, upstream, downstream, nfrTag, rfcRef
  └─ 关系表达器，不是 gate 状态机
```

## 4. Trace Matrix 与上游链路

### 4.1 MatrixRow 角色

| 项 | 直接证据 | 解释 |
|---|---|---|
| `MatrixRow` 有 `upstream` / `downstream` | `src/shared/types.ts` | 关系是显式数组，不是隐式字符串拼接 |
| `createTraceContext()` 会按 type 切分 FR / DS / TASK / TC | `trace-context.ts` | 矩阵可派生不同视图 |
| `createUpstreamLineage()` 只沿 `upstream` 递归 | `upstream-lineage.ts` | 传递祖先关系目前是单向上游解析 |
| `hasAnyAncestor()` / `collectCoveredTargetIds()` 基于上游传递链 | `upstream-lineage.ts` | 用于判断覆盖与依赖闭包 |

### 4.2 当前关系边界

| 边界 | 直接证据 | 解释 |
|---|---|---|
| 没有独立的 Matrix 持久化 store 在这次扫描中出现 | `trace-context.ts`、`upstream-lineage.ts` | 关系更多由矩阵行和上游解析器承载 |
| `document-links.yaml` 不存 MatrixStatus | `src/shared/types.ts`；`document-links.ts` | 文档关联索引与矩阵状态分离 |
| `MatrixStatus` 只表达产物状态，不表达关系强度 | `src/shared/types.ts` | 状态与关系是两套轴 |

## 5. Gate 体系总览

### 5.1 阶段 gate 条件 ID

| 阶段 | gate ID | 直接证据 | 说明 |
|---|---|---|---|
| `00_init` | `G-INIT-01/02/03` | `condition-registry.ts` | 目录、模式、stage-state |
| `01_specify` | `G-SPEC-00/01/02/03` | `condition-registry.ts` | PRD、spec、document-links、C10 |
| `02_design` | `G-DESIGN-01/02/03` | `condition-registry.ts` | design、links、constitution |
| `03_plan` | `G-PLAN-01/02/03` | `condition-registry.ts` | task_plan、links、CRITICAL findings |
| `04_implement` | `G-IMPL-01` | `condition-registry.ts` | 已声明文档是否都存在 |
| `05_verify` | `G-VERIFY-01/03` | `condition-registry.ts` | test-report / security-scan |
| `06_wrap_up` | `G-WRAP-01/02` | `condition-registry.ts` | retro / release evidence |
| `07_release` | `G-REL-01/02` | `condition-registry.ts`；`truth-source.ts` | release artifact 存在性 |

### 5.2 Gate 结果状态

| 状态 | 直接证据 | 含义 |
|---|---|---|
| `PASS` | `src/shared/types.ts` | 全部通过 |
| `PASS_WITH_WAIVER` | `src/shared/types.ts`；`advance.ts` | 有豁免，但仍可推进 |
| `FAIL` | `src/shared/types.ts` | 不可推进 |
| warning-only 条件 | `condition-registry.ts` 里 `blocking: false` | 失败不阻断，但写入历史与 findings |

### 5.3 文档声明 vs 代码注册

| 项 | 现状 | 说明 |
|---|---|---|
| `G-IMPL-02` | 技能文档中出现，`condition-registry.ts` 未注册 | 当前内置 registry 只有 `G-IMPL-01` |
| `G-VERIFY-02` | 技能文档中出现，`condition-registry.ts` 未注册 | 当前内置 registry 只有 `G-VERIFY-01` / `G-VERIFY-03` |
| `G-REL-01/02` | 代码与文档一致 | release gate 已在 registry 中 |

### 5.4 gate 与额外前置机制

| 机制 | 直接证据 | 作用 |
|---|---|---|
| `dependency-check` | `src/core/process-engine/dependency-checker.ts` | advance 前检查下一阶段依赖项 |
| `hard-gate` | `src/core/skill-runtime/hard-gate.ts` | skill 级入口守卫，阶段不对 / 文件缺失直接阻断 |
| `confirm-policy` | `src/core/skill-runtime/confirm-policy.ts` | `auto / assisted / strict`，是确认策略，不是 stage gate |
| `goLive check` | `src/core/gate-engine/golive.ts` | 发布前综合检查 |

## 6. Gate 与 ID 的耦合点

### 6.1 03-spec / 04-design / 06-task 的文档 gate

| 节点 | gate 需要的 ID / 产物 | 说明 |
|---|---|---|
| `03-spec` | `REQ`、`FR`、`spec.md`、`document-links.yaml`、C-PRD / C10 相关记录 | 需求项 ID 与规范文档强耦合 |
| `04-design` | `DS`、`design.md`、`document-links.yaml`、`constitution.md` | 设计规格 ID 与设计文档强耦合 |
| `06-task` | `TASK`、`task_plan.md`、`document-links.yaml` | 任务 ID 必须可被 parser 读取 |

### 6.2 07-code / 12-verify 的执行 gate

| 节点 | gate / 前置 | 说明 |
|---|---|---|
| `07-code` | `design.md`、`task_plan.md`、依赖检查、hard-gate、worktree 高风险守卫 | code 阶段强依赖前序 ID 链 |
| `12-verify` | `gate check`、`docs links validate`、`metrics report`、TDD 证据 | verify 关注的是“本次新鲜证据” |

### 6.3 RFC / Exception / Gate

| 链路 | 直接证据 | 说明 |
|---|---|---|
| RFC 通过后可同步 `known-exceptions.md` | `rfc.ts`、`exception-validator.ts` | EX 不是手写随意条目，而是 RFC waiver 的落盘 |
| `PASS_WITH_WAIVER` 在 advance 中会写 findings | `advance.ts` | gate 豁免要可追踪 |
| `validateExceptions()` 要求 RFC 已 approved、未过期、有 rollbackPoint | `exception-validator.ts` | 豁免本身也有 gate |

## 7. 主要关系链的完整 ASCII 图

```text
1) 需求链

REQ-...   -> FR-...   -> DS-...   -> TASK-...   -> TC-...
  |            |           |           |            |
  |            |           |           |            +--> linkedTc
  |            |           |           +-- task_plan traces / parser
  |            |           +-- design.md / document-links.yaml
  |            +-- spec.md / document-links.yaml
  +-- PRD item

2) 变更链

RFC-NNN -> waivers -> known-exceptions.md -> EX-NNN
   |                         |
   +-- impactIds             +-- validateExceptions()

3) 缺陷链

DefectRecord(seq)
  ├─ linkedFr -> FR-...
  └─ linkedTc -> TC-...

4) Gate 链

stage-state.json
  ↓
dependency-check / hard-gate / confirm-policy
  ↓
condition-registry -> gate-evaluator
  ↓
gate-history.jsonl
  ↓
findings.md / stage advance / goLive check
```

## 8. 最新代码口径下的关键结论

| 结论 | 直接证据 | 说明 |
|---|---|---|
| `id search/list --type` 已按大小写不敏感匹配修正 | `src/cli/commands/id.ts` | `Feature` / `REQ` / `FR` 等过滤现在可用 |
| `defect register` 会校验 `linkedFr` / `linkedTc` / `discoveredIn` | `src/cli/commands/defect.ts`；`src/core/change-mgr/defect.ts` | 缺陷回流链路不会再写入明显脏值 |
| `defect list` 的筛选值已与真实 `DefectStatus` / `SecuritySeverity` 对齐 | `src/cli/commands/defect.ts`；`src/shared/types.ts` | 列表筛选不会再接受错误枚举 |
| `task-plan` 到 `TaskNode` 仍然只输出 `relatedFR` / `relatedDS` | `src/core/task-plan/parser.ts`；`src/core/batch-executor/types.ts` | `REQ/TASK` 仍停留在解析层 trace，不进入执行契约 |
| `TC` / `RFC` 作为补充节点已进入 relationship-graph | `src/core/trace-engine/relationship-graph.ts`；`src/core/trace-engine/trace-context.ts` | 主链与补充链已分层 |

## 9. 文档总结

- 代码里真正稳定的主链是：`Feature -> REQ -> FR -> DS -> TASK`
- 执行契约里当前保留的是：`TaskNode.relatedFR / relatedDS`
- 补充链路是：`TC / RFC / Defect / EX`
- Gate 体系的真源是：`condition-registry.ts` + `gate-evaluator.ts` + `hard-gate.ts` + `confirm-policy.ts` + `dependency-checker.ts`
- `G-IMPL-02` / `G-VERIFY-02` 这类旧文案不应再被当成代码事实

---

如果你要继续把这份文档再压缩成“可执行优化清单”，下一步可以直接把它拆成：
1. `ID 体系`
2. `Gate 体系`
3. `关系承载层`
4. `TaskNode 边界`
