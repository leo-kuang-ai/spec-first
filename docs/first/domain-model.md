# 领域模型

## 核心实体

### Feature

**描述**：功能需求单元，是 Spec-First 管理的核心实体。

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| featureId | string | 唯一标识，格式 FSREQ-YYYYMMDD-{FEAT}-{NNN} |
| title | string | 功能标题 |
| mode | 'N' \| 'I' | 新建/迭代模式 |
| size | 'S' \| 'M' \| 'L' | 规模 |
| currentStage | Stage | 当前阶段 |
| terminal | boolean | 是否终态 |

**状态转换**：

```
00_init → 01_specify → 02_design → 03_plan → 04_implement → 05_verify → 06_wrap_up → 07_release → 08_done
任意阶段 → 09_cancelled
```

**证据**：`src/shared/types.ts:77-102`

---

### Stage

**描述**：Feature 生命周期阶段。

**枚举值**：

| 阶段 | 代码 | 说明 |
|------|------|------|
| INIT | 00_init | 初始化 |
| SPECIFY | 01_specify | 需求规格 |
| DESIGN | 02_design | 技术设计 |
| PLAN | 03_plan | 任务拆解 |
| IMPLEMENT | 04_implement | 代码实现 |
| VERIFY | 05_verify | 验收测试 |
| WRAP_UP | 06_wrap_up | 归档复盘 |
| RELEASE | 07_release | 上线发布 |
| DONE | 08_done | 完成 |
| CANCELLED | 09_cancelled | 取消 |

**约束**：
- 单向不可逆流转
- 必须通过 Gate 校验才能推进

**证据**：`src/shared/types.ts:7-18`

---

### TraceabilityId

**描述**：追溯 ID，支持全链路追踪。

**类型（14 类）**：

| 分类 | 类型 | 说明 |
|------|------|------|
| 业务链路 | FR | 功能需求 |
| 业务链路 | DS | 设计规格 |
| 业务链路 | TASK | 任务 |
| 业务链路 | TC | 测试用例 |
| 业务链路 | RFC | 变更请求 |
| V-Model | REQ | 需求 |
| V-Model | SYS | 系统 |
| V-Model | ARCH | 架构 |
| V-Model | MOD | 模块 |
| V-Model | ATP | 验收测试计划 |
| V-Model | STP | 系统测试计划 |
| V-Model | ITP | 集成测试计划 |
| V-Model | UTP | 单元测试计划 |
| 顶层 | Feature | Feature 标识 |

**格式**：`{TYPE}-{FEAT}-{NNN}`

**证据**：`src/shared/types.ts:24-38`

---

### Gate

**描述**：质量门禁，评估阶段推进条件。

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| status | 'PASS' \| 'PASS_WITH_WAIVER' \| 'FAIL' | 评估结果 |
| conditions | ConditionResult[] | 条件评估结果 |
| waivers | WaiverRef[] | 豁免引用 |

**规则**：
- 19 条规则：16 blocking + 3 warning
- 任一 blocking 失败则整体 FAIL

**证据**：`src/shared/types.ts:105-132`

---

### MatrixRow

**描述**：追踪矩阵行。

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 追溯 ID |
| type | IdType | ID 类型 |
| title | string | 标题 |
| status | MatrixStatus | 状态 |
| upstream | string[] | 上游 ID |
| downstream | string[] | 下游 ID |

**证据**：`src/shared/types.ts:199-208`

---

### RFC

**描述**：变更请求。

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | RFC ID |
| level | 'Minor' \| 'Major' \| 'Critical' | 影响级别 |
| status | 'draft' \| 'approved' \| 'closed' \| 'rejected' | 状态 |
| impactIds | string[] | 影响范围 |
| waivers | RfcWaiver[] | 豁免项 |

**证据**：`src/shared/types.ts:135-161`

---

### Defect

**描述**：缺陷记录。

**属性**：

| 属性 | 类型 | 说明 |
|------|------|------|
| seq | number | 序号 |
| severity | 'S1' \| 'S2' \| 'S3' \| 'S4' | 严重程度 |
| status | 'open' \| 'fixing' \| 'fixed' \| 'verified' \| 'wontfix' | 状态 |
| linkedFr | string | 关联 FR |
| linkedTc | string | 关联 TC |

**证据**：`src/shared/types.ts:164-180`

---

## 实体关系

```
Feature ──has──→ Stage
    │
    └──contains──→ TraceabilityId
                        │
                        └──represented_in──→ MatrixRow

Stage ──requires──→ Gate
                        │
                        ↑
RFC ──waives─────────────┘
```

## 覆盖率指标

| 指标 | 说明 | 计算方式 |
|------|------|----------|
| C3 | 任务覆盖率 | TASK 覆盖 FR（传递链） |
| C4 | 测试覆盖率 | TC 直接覆盖 FR |
| C6 | 实现覆盖率 | TASK 已实现 |
| C8 | 任务合规率 | TASK 有上游 |
| C9 | TC 合规率 | TC 有上游 FR |

**证据**：`src/shared/types.ts:211-217`
