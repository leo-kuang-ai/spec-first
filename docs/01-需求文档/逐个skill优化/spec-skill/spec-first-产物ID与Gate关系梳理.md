# Spec-First 产物 ID 与 Gate 关系梳理

> 目标：梳理文档产物的 ID 体系、ID 之间的关联关系、以及 gate 体系。
>
> 事实边界：
> - 直接证据来自 `src/shared/types.ts`、`src/core/trace-engine/**`、`src/core/change-mgr/**`、`src/core/gate-engine/**`、`src/core/document-links.ts`
> - `skills/spec-first/03-spec/references/id-types-and-status.md` 提供 ID 类型说明
> - 对“链路关系”的描述，若代码没有一条统一关系表，则明确标为 `[推导]`
> - 不把 docs 当真源，不把 gate 文案当实现

## 0. 一眼看懂的总图

```text
[Feature]
  └── FSREQ-YYYYMMDD-ABBR-NNN
        ├── PRD
        │     └── REQ-ABBR-NNN
        │           └── FR-ABBR-NNN
        │                 └── DS-ABBR-NNN
        │                       └── TASK-ABBR-NNN
        │                             └── TC-UT|IT|E2E|ST-ABBR-NNN
        ├── RFC
        │     └── RFC-NNN
        │           └── waivers -> known-exceptions.md
        │                 └── EX-NNN
        ├── Defect
        │     └── defect-001.json / defect-002.json ...
        │           ├── linkedFr
        │           └── linkedTc
        └── Trace Matrix
              └── MatrixRow{id, type, title, status, upstream, downstream, nfrTag, rfcRef}

Gate 体系：
  stage-state.json
    ↓
  dependency-check
    ↓
  gate-evaluator / condition-registry
    ↓
  gate-history.jsonl
    ↓
  findings.md / stage advance
```

## 1. ID 类型总表

### 1.1 生成与校验层

| ID 类型 | 形式 / 示例 | 直接证据 | 载体 / 产物 | 说明 |
|---|---|---|---|---|
| `Feature` | `FSREQ-YYYYMMDD-ABBR-NNN` | `src/core/trace-engine/id-validator.ts`；`src/cli/commands/id.ts` | `specs/{featureId}/` 目录与 `stage-state.json` | Feature 是项目内的顶层命名空间，不是普通 trace ID |
| `REQ` | `REQ-ABBR-NNN` | `id-types-and-status.md`；`id-validator.ts`；`id-generator.ts` | PRD / 需求项 | `REQ-PRD` 不存在，PRD 需求项必须用 `REQ` |
| `FR` | `FR-ABBR-NNN` | `id-validator.ts`；`id-generator.ts` | `spec.md` / 需求追踪 | 功能需求 ID |
| `DS` | `DS-ABBR-NNN` | `id-validator.ts`；`id-generator.ts` | `design.md` / 设计追踪 | 设计规格 ID |
| `TASK` | `TASK-ABBR-NNN` | `id-validator.ts`；`id-generator.ts` | `task_plan.md` | 任务 ID |
| `TC` | `TC-UT|IT|E2E|ST-ABBR-NNN` | `id-validator.ts`；`id-generator.ts` | 测试用例 / 测试计划 | 需要额外 `tcLevel` |
| `RFC` | `RFC-NNN` | `id-validator.ts`；`id-generator.ts`；`rfc.ts` | `specs/{featureId}/rfc/RFC-NNN.rfc.json` | RFC 有独立状态机和序号体系 |
| `SYS` / `ARCH` / `MOD` / `ATP` / `STP` / `ITP` / `UTP` | `SYS-ABBR-NNN` 等 | `id-validator.ts`；`id-generator.ts` | 需求 / 架构 / 测试计划类产物 | 这些类型存在于 ID 体系，但不绑定单一 stage |

### 1.2 关系承载层

| 承载类型 | 形式 | 直接证据 | 作用 |
|---|---|---|---|
| `MatrixRow` | `id / type / title / status / upstream / downstream / nfrTag / rfcRef` | `src/shared/types.ts` | 追踪矩阵的基础行 |
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
| `validateAbbr()` 允许连字符输入，但会在生成时去掉 | `id-generator.ts` | 外部输入可带 `-`，最终 ID 规范化 |

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

## 3. ID 之间的关系

### 3.1 直接证据关系

| 关系 | 直接证据 | 说明 |
|---|---|---|
| `Feature` -> 所有产物 | `stage-state.json`、`specs/{featureId}/...`、`id-generator.ts` / `rfc.ts` / `defect.ts` 都按 `featureId` 分目录 | Feature 是一切产物的命名空间 |
| `RFC` -> `KnownException` | `rfc.ts` 的 `syncKnownExceptionsFromWaivers()` | RFC 被批准后，其 waiver 可同步成 `known-exceptions.md` 中的 EX 条目 |
| `Defect` -> `linkedFr` / `linkedTc` | `defect.ts` 和 `DefectRecord` | 缺陷记录直接挂 FR / TC |
| `MatrixRow` -> `upstream / downstream` | `src/shared/types.ts` | 关系在行内存储，不在单独状态值里存储 |

### 3.2 推导关系链

> 下列关系是从 `id-types-and-status.md`、`task_plan.md` 解析器、`MatrixRow` 结构和各 stage gate 的输入要求综合推导出来的，不是单一模块里的一张全局关系表。

| 推导链 | 依据 | 备注 |
|---|---|---|
| `REQ -> FR` | `03-spec` 将 PRD 需求项收敛为 FR；`id-types-and-status.md` 区分 `REQ` 与 `FR` | PRD 用 `REQ`，需求规格用 `FR` |
| `FR -> DS` | `03-spec` 之后进入 `04-design`；`document-links.yaml` 在 `DESIGN` 阶段要求 `design.md -> spec.md` | 设计是从 FR 收敛而来 |
| `DS -> TASK` | `06-task` 明确从 `spec.md / design.md` 拆任务；`task_plan.md` 需要 traces | 任务追踪依赖设计与需求 |
| `TASK -> TC` | `task_plan.md` parser 只把 `traces` 中的 FR / DS 映射到 TaskNode；`TC` 在 ID 体系中存在但不在当前 `toTaskNodes()` 输出里 | 这条链在当前实现里是“语义上成立，执行器未直接显式消费” |
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
    v                      v
  TASK-...              EX-...
    |                      |
    v                      |
  TC-UT|IT|E2E|ST-...      |
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
| `createTraceContext()` 会按 type 切分 FR / DS / TASK / TC | `trace-context.ts` | 矩阵可派生出不同视图 |
| `createUpstreamLineage()` 只沿 `upstream` 递归 | `upstream-lineage.ts` | 传递祖先关系目前是单向上游解析 |
| `hasAnyAncestor()` / `collectCoveredTargetIds()` 基于上游传递链 | `upstream-lineage.ts` | 用于判断覆盖与依赖闭包 |

### 4.2 当前关系边界

| 边界 | 直接证据 | 解释 |
|---|---|---|
| 没有独立的 Matrix 持久化 store 在这次扫描中出现 | `trace-context.ts`、`upstream-lineage.ts` | 关系更多是由矩阵行和上游解析器承载 |
| `document-links.yaml` 不存 MatrixStatus | `03-spec/references/id-types-and-status.md` | 文档关联索引与矩阵状态分离 |
| `MatrixStatus` 只表达产物状态，不表达关系强度 | `id-types-and-status.md` | 状态与关系是两套轴 |

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
| `07_release` | `G-REL-01/02` | `condition-registry.ts` / `truth-source.ts` | release artifact 存在性 |

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
  |            |           |           +-- trace rows / task_plan traces
  |            |           +-- design.md / document-links.yaml
  |            +-- spec.md / document-links.yaml
  +-- PRD item

2) 变更链

RFC-NNN -> waivers -> known-exceptions.md -> EX-NNN
   |                         |
   +-- impactIds             +-- validateExceptions()

3) 缺陷链

defect-001.json -> linkedFr -> FR-...
              └-> linkedTc -> TC-...

4) 追踪矩阵

MatrixRow
  id / type / title / status / upstream / downstream / nfrTag / rfcRef
      |
      +-- createTraceContext()
      +-- createUpstreamLineage()

5) Gate 链

stage-state.json
    -> dependency-check
    -> gate-evaluator / condition-registry
    -> gate-history.jsonl
    -> findings.md
    -> stage advance
```

## 8. 关键卡点

| 卡点 | 直接证据 | 影响 |
|---|---|---|
| `task_plan.md` parser 只稳定识别表格型任务 | `src/core/task-plan/parser.ts` | 如果任务不是表格，TASK 关系会丢 |
| `toTaskNodes()` 当前只把 traces 中的 FR / DS 转成 relatedFR / relatedDS | `parser.ts` | TASK -> TC 的显式消费链还没在这一层体现 |
| `document-links.yaml` 只校验路径与引用，不表达关系强度 | `document-links.ts`；`id-types-and-status.md` | 关系强度不能靠 links 推断 |
| `MatrixStatus` 不是关系强度 | `src/shared/types.ts`；`id-types-and-status.md` | 状态和关系要分开看 |
| `G-IMPL-02` / `G-VERIFY-02` 与当前 registry 不一致 | `condition-registry.ts` 对照技能文档 | 文档 gate 与代码 gate 需要再对齐 |

## 9. 优化建议

1. 把 `REQ / FR / DS / TASK / TC / RFC / EX / defect` 做成一张固定的总表，放到同一页首屏
2. 把 `MatrixRow` 的 `upstream / downstream / rfcRef / nfrTag` 写成单独的关系表，避免和状态混写
3. 把 `G-IMPL-02`、`G-VERIFY-02` 这类“文档有、registry 无”的条件做显式标注
4. 把 `task_plan.md` 的 `traces` 示例补成 FR / DS / TC 的完整闭环，减少 TASK 层断链
5. 把 `RFC -> KnownException -> PASS_WITH_WAIVER` 作为单独链路写清，避免豁免语义被 gate 历史淹没

## 10. ID -> 产物 -> 上游 -> 下游 -> gate 总表

> 说明：
> - “上游 / 下游”里凡是没有单独持久化关系表支撑的，均标为 `[推导]`
> - gate 一栏优先写当前代码里的直接门禁；若该 ID 没有专属 gate，则写“由所属 stage / 状态机约束”

| ID | 产物 | 上游 skill 节点 | 下游 skill 节点 | 上游 ID | 下游 ID | gate |
|---|---|---|---|---|---|---|
| `Feature` | `specs/{featureId}/stage-state.json`、`specs/{featureId}/` 目录根、`.spec-first/current` 指针 | `00-first / 01-init / 17-feature`（[推导]） | 所有依赖 Feature 定位的 skill：`02-catchup / 03-spec / 04-design / 05-research / 06-task / 07-code / 08-review / 10-archive / 11-plan / 12-verify / 13-orchestrate / 14-status / 15-doctor / 16-sync / 17-feature / 20-spec-review / 21-analyze` | `.spec-first/current` / `feature switch` / `feature current` | 所有 Feature 级产物；`spec.md`、`design.md`、`task_plan.md`、`findings.md`、`gate-history.jsonl` 等 | `01-init` 相关 gate；`feature switch` 的 state 校验；`stage-machine.ts` 的阶段迁移约束 |
| `REQ` | PRD / 需求项（`prd.md` 内的需求条目） | `03-spec` | `04-design`、`20-spec-review` | source requirement / PRD 输入 [推导] | `FR` | `03-spec` 阶段 gate：`G-SPEC-00/01/02/03` + 宪法一致性检查 |
| `FR` | `spec.md` 中的 FR 片段；`document-links.yaml` 关联 | `03-spec` | `04-design`、`06-task`、`20-spec-review`、`21-analyze` | `REQ` [推导] | `DS`、`TASK`、`TC`（经 traces / 任务拆解 / 测试映射） | `03-spec` 阶段 gate；`G-SPEC-01/02/03`；`03-spec` 的宪法检查 |
| `DS` | `design.md` 中的 DS 片段；按需 `contracts/*.yaml` | `04-design / 05-research` | `06-task`、`07-code`、`08-review`、`12-verify` | `FR` | `TASK`、实现上下文、测试设计 | `04-design` 阶段 gate；`G-DESIGN-01/02/03`；`hard-gate` 入口校验 spec.md |
| `TASK` | `task_plan.md` 中的 TASK 表格行 | `06-task` | `07-code`、`11-plan`、`12-verify`、`13-orchestrate`、`08-review` | `DS` + `FR` [推导] | `TC` / 测试步骤；`batch-report` / `checkpoint` | `03_plan` 阶段 gate；`G-PLAN-01/02/03`；`hard-gate` 要求 task_plan.md |
| `TC` | 测试计划 / 测试用例 ID；可能出现在 `task_plan.md`、测试文档或矩阵中 | `06-task / 03-spec`（[推导]） | `12-verify`、`08-review`、`14-status` | `TASK` / `FR` / `DS` [推导] | `verify` 证据；`Defect.linkedTc`；质量回归 | `05_verify` 阶段 gate；当前内置 registry 为 `G-VERIFY-01/03`，`G-VERIFY-02` 仅见于技能文档未见 registry 注册 |
| `RFC` | `specs/{featureId}/rfc/RFC-NNN.rfc.json` | `11-plan / 13-orchestrate / 08-review`（[推导]） | `12-verify`、`13-orchestrate`、`10-archive` | `FR` / `DS` 影响分析 [推导] | `known-exceptions.md`；豁免审批；`Gate PASS_WITH_WAIVER` 轨迹 | RFC 状态机：`draft -> approved / rejected -> closed`；`known-exceptions.md` 校验；`gate` 的豁免语义 |
| `EX` | `specs/{featureId}/known-exceptions.md` 中的 `EX-NNN` | `11-plan / 13-orchestrate / 12-verify`（[推导]，对应豁免评估与消费） | `12-verify`、`13-orchestrate`、`07_release`（通过 gate 结果消费） | `RFC` waiver | `validateExceptions()`；`PASS_WITH_WAIVER`；`gate-history.jsonl` / findings 中的豁免留痕 | `exception-validator.ts`：必须有 approved RFC、未过期、rollbackPoint；不是独立 stage gate，而是豁免校验 gate |
| `Defect` | `specs/{featureId}/defects/defect-XXX.json` | `08-review`、`12-verify`、`07-code`（[推导]） | `07-code`、`08-review`、`12-verify`、`10-archive` | `verify` / `review` / `运行时发现` [推导] | `linkedFr`、`linkedTc`、修复流程、`escape rate` 统计 | 缺陷状态机：`open -> fixing / wontfix -> fixed -> verified`；终态 `verified / wontfix`；不直接等同于 stage gate |
| `MatrixRow` | 追踪矩阵行；派生上下文中的 `frRows / dsRows / taskRows / tcRows` | `03-spec / 04-design / 06-task / 12-verify`（[推导]） | `11-plan`、`12-verify`、`13-orchestrate`、`14-status`、`21-analyze` | `spec / design / task / tc` 的追踪输入 [推导] | `upstream-lineage`、覆盖率分析、文档/需求映射 | 无单独 gate；由所在 stage gate 与矩阵消费方共同约束 |

### 总表解读

```text
REQ / FR / DS / TASK / TC
  = 主追踪链

RFC / EX
  = 变更与豁免链

Defect
  = 问题回流链

MatrixRow
  = 跨 ID 的关系载体

gate
  = stage gate + 状态机 + 豁免校验 + 依赖检查
```

### 总表中的最关键断点

| 断点 | 说明 |
|---|---|
| `REQ -> FR` | PRD 需求项与需求规格不是同一个 ID 体系，需要在 03-spec 里完成收敛 |
| `FR -> DS` | 设计必须显式回写 spec 引用，避免设计漂移 |
| `DS -> TASK` | 任务必须能追溯到设计输入，否则 code 不可执行 |
| `TASK -> TC` | 测试计划和执行命令要能被 verify 消费，否则只剩文本 |
| `RFC -> EX` | 豁免必须落盘到 `known-exceptions.md`，否则 PASS_WITH_WAIVER 不可审计 |
| `Defect -> FR/TC` | 缺陷必须回挂需求和测试，否则复盘链断裂 |
