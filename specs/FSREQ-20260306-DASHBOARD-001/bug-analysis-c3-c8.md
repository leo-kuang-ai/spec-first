# Bug 分析：C3/C8 在 FR→DS→TASK 链路下误判为 0%

## 结论（问题是否存在）

存在，且可稳定复现。  
在当前矩阵模型（`FR → DS → TASK`）下，CLI 会把 C3/C8 计算为 0%，属于算法与模型定义不一致。

## 复核证据（2026-03-06 本地）

### 1) 追踪矩阵链路本身完整

`specs/FSREQ-20260306-DASHBOARD-001/traceability-matrix.md` 中存在：

- FR 行 `downstream` 包含对应 TASK（如 `FR-DASHBOARD-001 -> TASK-DASHBOARD-001`）
- TASK 行 `upstream` 指向 DS（如 `TASK-DASHBOARD-001 <- DS-DASHBOARD-001`）
- DS 行 `upstream` 指向 FR（如 `DS-DASHBOARD-001 <- FR-DASHBOARD-001`）

即语义链路完整：`FR -> DS -> TASK`。

### 2) CLI 实际输出与矩阵语义冲突

执行：

```bash
node dist/cli/index.js trace validate FSREQ-20260306-DASHBOARD-001
```

输出：

```text
C3 (Task Coverage):  0.0%
C8 (Task Compliance): 0.0%
```

执行：

```bash
node dist/cli/index.js gate check FSREQ-20260306-DASHBOARD-001 --stage 03_plan
```

输出：

```text
G-PLAN-01 FAIL: C3=0.0% uncovered FR: FR-DASHBOARD-001, FR-DASHBOARD-002, FR-DASHBOARD-003
G-PLAN-02 FAIL: C8=0.0%
```

### 3) 代码层根因定位

1. `src/core/trace-engine/coverage.ts`
- `calcTaskCoverage()` 复用 `calcUpstreamCoverage()`（约 L62）
- `calcUpstreamCoverage()` 仅把下游行 `upstream` 当作“已覆盖 FR ID 集合”（约 L117-L126）
- 在 `TASK.upstream=DS-*` 的常见场景下，集合中没有 FR，C3 变成 0%

2. `src/core/trace-engine/coverage.ts`
- `calcTaskCompliance()` 仅接受 `TASK.upstream` 直接命中 FR（约 L95-L102）
- 与指标定义 “TASK 关联 FR/NFR/DS” 不一致，导致 C8 误判为 0%

3. 同类问题还出现在：
- `src/core/gate-engine/gate-evaluator.ts` `getUncoveredFrIds()`（约 L807）  
  对 TASK 覆盖的判断也只看 `TASK.upstream` 是否直接含 FR
- `src/core/trace-engine/matrix.ts` `checkMatrix()`（约 L62）  
  `hasTask` 仅看 `TASK.upstream.includes(fr.id)`，会把 FR 误报为缺 TASK
- `src/core/gate-engine/sca.ts`（约 L239-L261）  
  `COVERAGE_GAP_TASK` 同样基于 `taskUpstream` 直接对比 FR，可能产生误报

## 规范对齐结论

从文档定义看，当前实现应判为 Bug（不是矩阵填写错误）：

- `docs/02-技术方案/V2/v2-05-追踪矩阵与ID引擎.md`：追踪链方向明确为 `FR → DS → TASK → TC → PR`
- `docs/02-技术方案/V2/v2-11-度量与健康分.md`：
  - C3: 被 TASK 覆盖的 Active FR∪NFR / Active FR+NFR
  - C8: 关联 FR/NFR/DS 的 TASK / 总 TASK

## 方案对比

### 方案 A：改矩阵数据（临时绕过，不推荐）

将 TASK `upstream` 同时写入 DS 和 FR：

```markdown
| TASK-DASHBOARD-001 | TASK | ... | verified | DS-DASHBOARD-001,FR-DASHBOARD-001 | |
```

问题：
- 让链路冗余，降低模型一致性
- 掩盖算法缺陷，后续仍会在其它模块复发

### 方案 B：统一“传递可达”算法（推荐）

核心思路：
- 构建 `id -> row` 索引
- 从 TASK 沿 `upstream` 做 BFS/DFS 回溯祖先
- 覆盖与合规判断基于“祖先集合”而非仅一跳

判定建议：
- C3：FR 是否被至少一个 TASK 传递覆盖（`TASK -> ... -> FR`）
- C8：TASK 是否能追溯到 FR/NFR/DS（至少一个命中）

优点：
- 与链式模型一致
- 一次修复可复用到 `coverage.ts` / `gate-evaluator.ts` / `matrix.ts` / `sca.ts`
- 对未来多层链路扩展更稳健

### 方案 C：按 `FR.downstream` 快速修 C3（次优）

可快速修复 C3，但 C8 仍需单独处理；且依赖 `downstream` 维护质量，不建议作为最终方案。

## 推荐落地路径

1. 在 `trace-engine` 新增统一工具函数（如 `collectUpstreamAncestors(rows, startId)`）
2. 先修 `coverage.ts`：
- C3 改为“TASK 祖先可达 FR”
- C8 改为“TASK 祖先命中 FR/NFR/DS”
3. 同步修正三处同类逻辑：
- `gate-evaluator.ts#getUncoveredFrIds`
- `matrix.ts#checkMatrix` 的 `hasTask` 判定
- `sca.ts` 中 `COVERAGE_GAP_TASK` 判定
4. 增加回归测试，覆盖“直接关联 + 传递关联 + 错误链路”三类样本

## 建议测试用例（修复验收）

### Case 1: 标准链路（应通过）

```markdown
| FR-TEST-001   | FR   | Test | Verified |             | DS-TEST-001,TASK-TEST-001 |
| DS-TEST-001   | DS   | Test | Verified | FR-TEST-001 | TASK-TEST-001 |
| TASK-TEST-001 | TASK | Test | Verified | DS-TEST-001 | |
```

预期：`C3=100%`, `C8=100%`

### Case 2: 孤儿 TASK（应失败）

```markdown
| TASK-ORPHAN-001 | TASK | Orphan | Verified | | |
```

预期：`C8<100%`

### Case 3: FR 无 TASK（应失败）

```markdown
| FR-ONLY-001 | FR | Only FR | Verified | | DS-ONLY-001 |
| DS-ONLY-001 | DS | Only DS | Verified | FR-ONLY-001 | |
```

预期：`C3<100%`
