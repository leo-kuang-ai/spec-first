# 当前各节点 ID 关系图（线框图）

- 生成日期：2026-03-10
- 目标：把当前仓库中“实际存在”的 ID 节点关系画出来，区分 **运行时承认**、**产物中存在但运行时不承认**、**断链/弱链** 三类
- 说明：本图以当前代码与当前 `specs/` 样本为准，不以 README 为准

## 图例

- `[OK]`：运行时当前承认的 ID 类型/关系
- `[WARN]`：产物中存在，但运行时语义不完整或只被部分消费
- `[BAD]`：产物中存在，但运行时当前不承认或会导致断链
- `-->`：运行时/矩阵中的强关系
- `-.->`：产物中声明了关系，但 runtime 不一定承认

---

## 1. 当前全局 ID 生命周期节点图

```text
+-----------------------------------+
| [OK] Feature ID                   |
| FSREQ-YYYYMMDD-FEAT-NNN           |
+-----------------------------------+
   |--> +-----------------------------------+
   |    | [OK] stage-state.json             |
   |    | specs/<featureId>/stage-state.json|
   |    +-----------------------------------+
   |                 |
   |                 +--> +-------------------------------+
   |                      | [OK] stage advance            |
   |                      +-------------------------------+
   |
   |--> +-------------------------------------------+
   |    | [OK] traceability-matrix.md               |
   |    | specs/<featureId>/traceability-matrix.md  |
   |    +-------------------------------------------+
   |                 |
   |                 +--> +-------------------+
   |                 |    | [OK] parseMatrix  |
   |                 |    +-------------------+
   |                 |             |
   |                 |             +--> +-------------------+
   |                 |             |    | [OK] checkMatrix  |
   |                 |             |    +-------------------+
   |                 |             |
   |                 |             +--> +-------------------+
   |                 |             |    | [OK] getCoverage  |
   |                 |             |    +-------------------+
   |                 |             |
   |                 |             +--> +-------------------+
   |                 |                  | [OK] evaluateGate |
   |                 |                  +-------------------+
   |
   |--> +-----------------------------------+
   |    | [OK] todo-state.json              |
   |    | specs/<featureId>/todo-state.json |
   |    +-----------------------------------+
   |                 |
   |                 +--> +-------------------+
   |                 |    | [OK] loadTodoState|
   |                 |    +-------------------+
   |                 |             |
   |                 |             +--> +-------------------+
   |                 |                  | [OK] auto-loop    |
   |                 |                  +-------------------+
   |                 |                            |
   |                 |                            +--> todo-state.json
   |
   +--> +-----------------------+
        | [OK] .spec-first/current |
        +-----------------------+
```

### 代码锚点
- Feature ID 生成：`src/core/process-engine/init.ts:80`
- Matrix 解析：`src/core/trace-engine/matrix.ts:44`
- 覆盖率消费：`src/core/trace-engine/coverage.ts:15`
- Gate 消费：`src/core/trace-engine/matrix.ts:53`
- Todo 恢复/循环：`src/core/ai-orchestrator/todo-runner.ts:179`, `src/core/ai-orchestrator/auto-loop.ts:99`

---

## 2. 运行时“承认的”标准 ID 关系图

```text
+---------------------------------------+
| [OK] REQ-* / SYS-* / ARCH-* / MOD-*   |
+---------------------------------------+
     |--> +------------------+
     |    | [OK] FR-*        |
     |    +------------------+
     |          |--> +------------------+
     |          |    | [OK] DS-*        |
     |          |    +------------------+
     |          |             |
     |          |             +--> +------------------+
     |          |                  | [OK] TASK-*      |
     |          |                  +------------------+
     |          |                           |
     |          |                           +--> +------------------------------+
     |          |                                | [OK] Implemented/Verified/   |
     |          |                                | Accepted                     |
     |          |                                +------------------------------+
     |          |
     |          +--> +------------------+
     |          |    | [OK] TASK-*      |
     |          |    +------------------+
     |          |
     |          +--> +---------------------------+
     |               | [OK] TC-UT|IT|E2E|ST-*    |
     |               +---------------------------+
     |
     +--> +------------------+
     |    | [OK] ATP-*       |
     |    +------------------+
     +--> +------------------+
     |    | [OK] STP-*       |
     |    +------------------+
     +--> +------------------+
     |    | [OK] ITP-*       |
     |    +------------------+
     +--> +------------------+
          | [OK] UTP-*       |
          +------------------+
```

### 代码锚点
- 运行时承认的 ID 类型：`src/core/trace-engine/id-validator.ts:8`
- `TC` 只能带 level：`src/core/trace-engine/id-validator.ts:21`
- FR 断链判定：`src/core/trace-engine/matrix.ts:67`

---

## 3. 当前 Feature `FSREQ-20260310-HOMEPERF-001` 实际节点关系图

### 3.1 实际矩阵图（按产物原样）

```text
[WARN] 上游需求层
+------------------+   +------------------+   +------------------+
| REQ-PERF-CSS     |   | REQ-PERF-JS      |   | REQ-PERF-CACHE   |
+------------------+   +------------------+   +------------------+
          |                      |                      |
          v                      v                      v
+------------------+   +------------------+   +------------------+
| FR-HOMEPERF-001  |   | FR-HOMEPERF-002  |   | FR-HOMEPERF-003  |
+------------------+   +------------------+   +------------------+
          |
          |
[WARN] 还有：REQ-PERF-LIST --> FR-HOMEPERF-004
[WARN]      REQ-PERF-FCP  --> FR-HOMEPERF-005

[BAD] AC 层（产物存在，runtime 不承认）
FR-HOMEPERF-001 -.-> AC-HOMEPERF-001-01~03
FR-HOMEPERF-002 -.-> AC-HOMEPERF-002-01~04
FR-HOMEPERF-003 -.-> AC-HOMEPERF-003-01~04
FR-HOMEPERF-004 -.-> AC-HOMEPERF-004-01~03
FR-HOMEPERF-005 -.-> AC-HOMEPERF-005-01~04

[OK] FR / DS / TASK 主干
FR-HOMEPERF-001 --> DS-HOMEPERF-001 --> TASK-HOMEPERF-001
FR-HOMEPERF-001 --> DS-HOMEPERF-001 --> TASK-HOMEPERF-002
FR-HOMEPERF-003 --> DS-HOMEPERF-003 --> TASK-HOMEPERF-003
FR-HOMEPERF-002 --> DS-HOMEPERF-002 --> TASK-HOMEPERF-004
FR-HOMEPERF-004 --> DS-HOMEPERF-004 --> TASK-HOMEPERF-006
FR-HOMEPERF-005 --> DS-HOMEPERF-005 --> TASK-HOMEPERF-007
FR-HOMEPERF-005 --> DS-HOMEPERF-005 --> TASK-HOMEPERF-008
FR-HOMEPERF-004 --> DS-HOMEPERF-006 --> TASK-HOMEPERF-004

[WARN] 复合上游 / 横向连接
FR-HOMEPERF-005 --> DS-HOMEPERF-001
FR-HOMEPERF-005 --> DS-HOMEPERF-002
FR-HOMEPERF-004 --> DS-HOMEPERF-006
FR-HOMEPERF-005 --> DS-HOMEPERF-006
FR-HOMEPERF-004 --> TASK-HOMEPERF-005
FR-HOMEPERF-002 --> TASK-HOMEPERF-005

[WARN] NFR 驱动任务
NFR-PERF-001 --> TASK-HOMEPERF-009

[BAD] TC 层（产物存在，runtime 不承认）
AC-HOMEPERF-001-01~03 -.-> TC-HOMEPERF-001~003
AC-HOMEPERF-002-01~04 -.-> TC-HOMEPERF-004~007
AC-HOMEPERF-003-01~04 -.-> TC-HOMEPERF-008~011
AC-HOMEPERF-004-01~03 -.-> TC-HOMEPERF-012~014
AC-HOMEPERF-005-01~04 -.-> TC-HOMEPERF-015~018
```

### 3.2 这张图说明了什么
- `FR/DS/TASK` 主干已经在当前矩阵中形成可读关系，见 `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:3`
- `AC-*` 节点与 `TC-HOMEPERF-*` 节点真实存在于产物，但运行时当前 **不承认** 这两类格式，见 `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:8`, `src/core/trace-engine/id-validator.ts:8`
- `REQ-PERF-*` 与 `NFR-PERF-*` 也是当前样本中的上游锚点，但 `checkMatrix()` 实际硬编码只认 `REQ-PRD-*` 为 FR 合法 PRD 上游，见 `src/core/trace-engine/matrix.ts:72`

### 3.3 关键节点来源
- FR → REQ-PERF：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:3`
- AC 节点：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:8`
- DS → TASK：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:26`
- NFR → TASK：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:40`

---

## 4. 旧样本 `FSREQ-20260309-HOMEPAGE-001` 实际节点关系图

```text
[OK] PRD 主链
REQ-PRD-VIS-001/002 --> FR-VIS-001 --> DS-VIS-001 --> TASK-VIS-001
REQ-PRD-INT-001/002 --> FR-INT-001 --> DS-INT-001 --> TASK-INT-001
REQ-PRD-VIZ-001/002/003 --> FR-VIZ-001 --> DS-VIZ-001 --> TASK-VIZ-001
REQ-PRD-LAY-001/002 --> FR-LAY-001 --> DS-LAY-001 --> TASK-LAY-001

[BAD] TC 层（产物存在但 runtime 不承认）
FR-VIS-001 -.-> TC-VIS-001
FR-INT-001 -.-> TC-INT-001
FR-VIZ-001 -.-> TC-VIZ-001
FR-LAY-001 -.-> TC-LAY-001
```

### 说明
- 这个样本的 `REQ-PRD-* → FR → DS → TASK` 主链是运行时当前更接近承认的形式，见 `specs/FSREQ-20260309-HOMEPAGE-001/traceability-matrix.md:3`
- 但 `TC-VIS-001` 这类无 level TC 仍会导致 runtime 认不出 TC 节点，见 `specs/FSREQ-20260309-HOMEPAGE-001/traceability-matrix.md:24`, `src/core/trace-engine/id-validator.ts:21`

---

## 5. 当前 runtime 实际消费图

```text
+-------------------------------------------+
| [OK] traceability-matrix.md               |
+-------------------------------------------+
                     |
                     v
+-------------------------------------------+
| [OK] parseMatrix                          |
+-------------------------------------------+
   |--> [OK] FR rows
   |--> [OK] DS rows
   |--> [OK] TASK rows
   |--> [OK] TC rows
   |
   +--> [BAD] 非法 / 未知 ID
         会被降级成 Feature

[OK] 覆盖率消费
FR rows + TASK rows --> C3 Task Coverage
FR rows + TC rows   --> C4 FR Test Coverage
FR rows + TC rows   --> C5 AC Test Coverage（当前实现同 C4）

[OK] 校验消费
FR rows + DS rows + TASK rows + TC rows --> checkMatrix
```

### 代码锚点
- 非法 ID 降级：`src/core/trace-engine/matrix.ts:159`
- FR 断链规则：`src/core/trace-engine/matrix.ts:67`
- C4/C5 当前同实现：`src/core/trace-engine/coverage.ts:75`, `src/core/trace-engine/coverage.ts:80`

---

## 6. 当前节点关系中的关键断点

### 6.1 断点 A：`AC-*` 节点存在，但 runtime 不建模
- 产物存在：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:8`
- runtime 不承认：`src/core/trace-engine/id-validator.ts:8`
- 结果：AC 只能作为文本存在，不能参与正式 coverage / gate / lineage

### 6.2 断点 B：无 level 的 `TC-*` 存在，但 runtime 不承认
- 产物存在：`specs/FSREQ-20260309-HOMEPAGE-001/traceability-matrix.md:24`
- runtime 只认 `TC-UT|IT|E2E|ST-*`：`src/core/trace-engine/id-validator.ts:21`
- 结果：矩阵里看起来有 TC，运行时却会判定 FR 缺少 TC mapping

### 6.3 断点 C：`REQ-PERF-*` / `NFR-*` 存在，但 `checkMatrix` 对 FR upstream 只认 `REQ-PRD-*`
- 样本存在：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:3`
- 运行时规则：`src/core/trace-engine/matrix.ts:72`
- 结果：即使有上游需求，runtime 仍会报 FR 缺失 PRD upstream

### 6.4 断点 D：`TASK-HOMEPERF-009 <- NFR-PERF-001`
- 样本存在：`specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:40`
- `C8` 只把 `FR + DS` 视为合规祖先，不包含 NFR：`src/core/trace-engine/coverage.ts:112`
- 结果：NFR 驱动任务是当前链路里的“灰色节点”

---

## 7. 最小结论

- 当前仓库里已经形成了两套并存的节点图：
  1. **runtime 承认图**：`REQ/FR/DS/TASK/TC(level)`
  2. **产物实际图**：`REQ-PRD / REQ-PERF / AC / TC(无level) / NFR`
- 这两套图并没有完全重合，所以当前很多“节点关系”只是文档上连通，**不是 runtime 上连通**。
- 如果后续要继续查问题，优先沿着这四个断点继续：`AC`、`TC(level)`、`REQ vs REQ-PRD`、`NFR 驱动 TASK`。
