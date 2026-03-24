# First Skill 领域模型

> 基于 `.spec-first/runtime/first/domain-model.json` 生成

---

## 1. 核心实体

### 1.1 Feature

**描述**: 工作单元，研发闭环的核心载体

**ID 格式**: `FSREQ-YYYYMMDD-XXX-NNN`

**关键属性**:
- `id` - 唯一标识
- `stage` - 当前阶段
- `mode` - 模式 (N=Normal, I=Incremental)
- `size` - 规模 (S=Small, M=Medium, L=Large)
- `platforms` - 目标平台
- `terminal` - 终端标识

**关系**:
- has many FR, DS, TASK, TC
- has one Stage
- has many RFC, Defect

**证据**: `src/shared/types.ts`

---

### 1.2 FR (Functional Requirement)

**描述**: 功能需求

**ID 格式**: `FR-XXX-NNN`

**关键属性**:
- `id` - 唯一标识
- `title` - 标题
- `status` - 状态
- `upstream` - 上游引用
- `downstream` - 下游引用

**关系**:
- belongs to Feature
- covered by TASK
- covered by TC

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 1.3 DS (Design Spec)

**描述**: 设计规格

**ID 格式**: `DS-XXX-NNN`

**关键属性**:
- `id` - 唯一标识
- `title` - 标题
- `status` - 状态

**关系**:
- belongs to Feature
- references FR

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 1.4 TASK

**描述**: 任务项

**ID 格式**: `TASK-XXX-NNN`

**关键属性**:
- `id` - 唯一标识
- `title` - 标题
- `status` - 状态
- `upstream` - 上游引用

**关系**:
- belongs to Feature
- implements FR/DS

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 1.5 TC (Test Case)

**描述**: 测试用例

**ID 格式**: `TC-{UT|IT|E2E|ST}-XXX-NNN`

**关键属性**:
- `id` - 唯一标识
- `title` - 标题
- `status` - 状态
- `level` - 测试级别 (UT/IT/E2E/ST)

**关系**:
- belongs to Feature
- tests FR

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 1.6 RFC (Request for Change)

**描述**: 变更请求

**ID 格式**: `RFC-NNN`

**关键属性**:
- `id` - 唯一标识
- `featureId` - 所属 Feature
- `title` - 标题
- `level` - 变更级别
- `status` - 状态 (draft/approved/closed/rejected)
- `impactIds` - 影响的 ID 列表

**关系**:
- belongs to Feature
- impacts FR/DS/TASK

**状态机**: draft → approved → closed | rejected

**证据**: `src/shared/types.ts`

---

### 1.7 Defect

**描述**: 缺陷记录

**ID 格式**: `{featureId}-DEF-NNN`

**关键属性**:
- `seq` - 序号
- `featureId` - 所属 Feature
- `severity` - 严重程度
- `title` - 标题
- `status` - 状态 (open/fixing/fixed/verified/wontfix)

**关系**:
- belongs to Feature
- linked to FR/TC

**状态机**: open → fixing → fixed → verified | wontfix

**证据**: `src/shared/types.ts`

---

### 1.8 Gate

**描述**: 阶段质量门禁

**关键属性**:
- `id` - 条件标识
- `stage` - 适用阶段
- `description` - 条件描述
- `blocking` - 是否阻塞

**关系**:
- evaluates Stage
- produces GateResult

**总条件数**: 19 条 (16 blocking + 3 warning)

**证据**: `src/core/gate-engine/condition-registry.ts`

---

### 1.9 Skill

**描述**: AI 技能定义，驱动阶段交付

**关键属性**:
- `name` - 技能名称
- `stage` - 对应阶段
- `route` - 路由路径

**关系**:
- mapped to Stage

**总数**: 21 个

**证据**: `src/core/rules/truth-source.ts`

---

## 2. 枚举类型

### 2.1 Stage (阶段)

```
00_init        → 初始化
01_specify     → 需求定义
02_design      → 设计
03_plan        → 计划
04_implement   → 实现
05_verify      → 验证
06_wrap_up     → 收尾
07_release     → 发布
08_done        → 完成 (terminal)
09_cancelled   → 取消 (terminal)
```

**约束**: 单向不可逆，8 active + 2 terminal

**证据**: `src/shared/types.ts`

---

### 2.2 IdType (ID 类型)

**业务链路**:
- `FR` - 功能需求
- `DS` - 设计规格
- `TASK` - 任务项
- `TC` - 测试用例
- `RFC` - 变更请求

**V-Model**:
- `REQ` - 系统需求
- `SYS` - 系统设计
- `ARCH` - 架构设计
- `MOD` - 模块设计
- `ATP` - 验收测试计划
- `STP` - 系统测试计划
- `ITP` - 集成测试计划
- `UTP` - 单元测试计划

**顶层**:
- `Feature` - Feature 标识

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 2.3 TcLevel (测试级别)

| 值 | 含义 |
|----|------|
| UT | 单元测试 |
| IT | 集成测试 |
| E2E | 端到端测试 |
| ST | 系统测试 |

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

### 2.4 RfcStatus (RFC 状态)

| 值 | 含义 |
|----|------|
| draft | 草稿 |
| approved | 已批准 |
| closed | 已关闭 |
| rejected | 已拒绝 |

**约束**: 4 态状态机

**证据**: `src/shared/types.ts`

---

### 2.5 DefectStatus (缺陷状态)

| 值 | 含义 |
|----|------|
| open | 待处理 |
| fixing | 修复中 |
| fixed | 已修复 |
| verified | 已验证 |
| wontfix | 不予修复 |

**约束**: 5 态状态机

**证据**: `src/shared/types.ts`

---

### 2.6 MatrixStatus (追溯矩阵状态)

| 值 | 含义 |
|----|------|
| Planned | 已计划 |
| Implemented | 已实现 |
| Verified | 已验证 |
| Accepted | 已验收 |
| Deferred | 已延期 |
| Cancelled | 已取消 |
| Exception | 例外豁免 |

**证据**: `src/shared/types.ts`

---

### 2.7 GateStatus (Gate 结果)

| 值 | 含义 |
|----|------|
| PASS | 通过 |
| PASS_WITH_WAIVER | 豁免通过 |
| FAIL | 失败 |

**证据**: `src/shared/types.ts`

---

## 3. 状态机流转

### 3.1 Stage 状态机 (线性)

```
+----------+     +------------+     +----------+     +----------+
| 00_init  | --> | 01_specify | --> | 02_design| --> | 03_plan  |
+----------+     +------------+     +----------+     +----------+
                                                        |
                                                        v
+----------+     +------------+     +----------+     +----------+
| 08_done  | <-- | 07_release | <-- |06_wrap_up| <-- |04_implement|
+----------+     +------------+     +----------+     +----------+
     ^
     |         +------------+
     +------- | 05_verify  |
               +------------+

+--------------+
| 09_cancelled |  (可从任意 active 状态进入)
+--------------+
```

**规则**:
- 单向推进，不可回退
- Gate 必须通过才能 advance
- 08_done / 09_cancelled 为终态

---

### 3.2 RFC 状态机 (DAG)

```
                 +----------+
                 |  draft   |
                 +----+-----+
                      |
         +------------+------------+
         v                         v
   +----------+              +-----------+
   | approved |              | rejected  | (terminal)
   +----+-----+              +-----------+
        |
        v
   +----------+
   |  closed  | (terminal)
   +----------+
```

**规则**:
- draft → approved: 批准变更
- draft → rejected: 拒绝变更
- approved → closed: 变更完成
- approved → rejected: 变更被撤销

---

### 3.3 Defect 状态机 (DAG)

```
                    +------+
                    | open |
                    +--+---+
                       |
          +------------+------------+
          v                         v
    +---------+               +----------+
    | fixing  |               | wontfix  | (terminal)
    +----+----+               +----------+
         |  ^
         v  |
    +---------+
    |  fixed  |
    +----+----+
         |  ^
         v  |
   +----------+
   | verified | (terminal)
   +----------+
```

**规则**:
- open → fixing: 开始修复
- open → wontfix: 不予修复
- fixing → fixed: 修复完成
- fixed → verified: 验证通过
- 任意非终态可回退到 open

---

## 4. 覆盖率指标

| Key | 名称 | 描述 | 阻塞 |
|-----|------|------|------|
| C3 | 任务覆盖率 | TASK 覆盖 FR（传递链） | Yes |
| C4 | 测试覆盖率 | TC 直接覆盖 FR（不支持传递） | Yes |
| C6 | 实现覆盖率 | TASK 已实现状态比例 | Yes |
| C8 | 任务合规率 | TASK 有上游 FR 引用比例 | Yes |
| C9 | TC 合规率 | TC 有上游 FR 引用比例 | Yes |

---

## 5. 术语表

| 术语 | 含义 |
|------|------|
| Feature | 工作单元，研发闭环的核心载体 |
| FR | 功能需求 (Functional Requirement) |
| DS | 设计规格 (Design Spec) |
| TASK | 任务项 |
| TC | 测试用例 (Test Case) |
| RFC | 变更请求 (Request for Change) |
| REQ | 系统需求 |
| SYS | 系统设计 |
| ARCH | 架构设计 |
| MOD | 模块设计 |
| ATP | 验收测试计划 |
| STP | 系统测试计划 |
| ITP | 集成测试计划 |
| UTP | 单元测试计划 |
| Stage | 阶段枚举，驱动 Feature 生命周期 |
| Gate | 阶段质量门禁，控制阶段推进 |
| Skill | AI 技能，驱动阶段交付 |
| Mode | Feature 模式 (N=Normal, I=Incremental) |
| Size | Feature 规模 (S=Small, M=Medium, L=Large) |

---

## 6. 业务规则 / 不变量

1. **Stage 单向推进**: 阶段只能向前推进，不可回退
2. **Gate 前置**: Gate 必须通过才能 advance 到下一阶段
3. **ID 格式合规**: 所有 ID 格式必须符合正则规范
4. **状态机合法转换**: RFC/Defect 状态机转换必须合法
5. **覆盖率阈值**: 覆盖率指标必须达到阈值才能推进阶段
6. **追溯链完整**: FR → TASK → TC 追溯链必须完整

---

## 7. 证据文件

| 文件 | 内容 |
|------|------|
| `src/shared/types.ts` | 核心类型定义 (Stage, ID, Status) |
| `src/core/trace-engine/id-taxonomy.ts` | ID 分类与追溯逻辑 |
| `src/core/gate-engine/condition-registry.ts` | Gate 条件注册 |
| `src/core/metrics-engine/core-metric-thresholds.ts` | 覆盖率阈值 |
| `src/core/change-mgr/rfc-machine.ts` | RFC 状态机 |
| `src/core/change-mgr/defect-machine.ts` | Defect 状态机 |
| `src/core/rules/truth-source.ts` | Skill 映射与静态规则 |
