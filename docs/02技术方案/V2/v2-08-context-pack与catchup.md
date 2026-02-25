# V2-08 Context Pack 与 Catchup

> **对齐需求**: aux-01-skill-system · aux-02-cli-system
> **版本**: v2.1 | **日期**: 2026-02-10 | **原则**: KISS

---

## 1. 目标

解决 AI 会话断裂和上下文膨胀问题，保证跨 Agent 可恢复、可校验。

---

## 2. Context Pack v2.0

### 2.1 双区结构

| 区域 | 用途 | 体积约束 |
|------|------|---------|
| `control` | Feature 元数据 + 当前状态 + 产物指针 | < 2KB（硬限制） |
| `references` | 按需读取的产出物片段 | 按 Slicing 策略动态裁剪 |

### 2.2 control 区格式

```yaml
context_pack:
  version: "2.0"
  control:
    feature_meta:
      id: "FSREQ-20260210-AUTH-001"
      title: "用户认证模块"
      mode: N
      size: S
      platforms: [h5, java-backend]
    constitution: "constitution.md"
    current_phase: "04_implement"
    current_task: "TASK-AUTH-001"
    artifacts:
      matrix: "specs/<featureId>/traceability-matrix.md"
      progress: "specs/<featureId>/stage-state.json"
```

### 2.3 references 区格式

```yaml
  references:
    - path: "specs/<featureId>/spec.md"
      selector: "FR-AUTH-*"
      reason: "current_task_related"
      checksum: "<sha256>"
      mtime: "2026-02-09T10:30:00Z"
```

每个 reference 必须包含：`path`、`selector`、`reason`、`checksum`、`mtime`。

---

## 3. Context Slicing（动态裁剪）

### 3.1 三层上下文

| 层级 | 内容 | 加载策略 |
|------|------|---------|
| L1 核心 | Constitution + Project Meta | 始终加载 |
| L2 阶段 | 当前阶段强依赖的上游产出物 | 按阶段加载 |
| L3 邻居 | 当前 ID 直接关联的上下游条目 | 基于矩阵 depth=1 |

### 3.2 阶段 × 上下文映射

| 阶段 | L1 | L2 | L3 |
|------|----|----|-----|
| 01 Specify | Constitution | 历史 Spec (Mode I) | 当前编辑的 FR/NFR |
| 02 Design | Constitution + Spec | 现有架构文档 | 当前 FR 关联的 DS/API |
| 04 Implement | Constitution | Spec + Design + Contracts | 当前 TASK + 关联 FR/AC + API |
| 05 Verify | Constitution | Spec + Design + Task Plan | 当前 TC + 关联 FR/AC |

### 3.3 预算与降级

- **硬限制**：`control` < 2KB，超限视为构建失败
- **推荐预算**：总计 16K tokens（L1 ≤ 20%, L2 ≤ 30%, L3 ≥ 50%），可通过 `config.yaml` 中 `context.token_budget` 覆盖（合法范围 8K-64K）
- **超限降级顺序**：
  1. 裁剪 L2 非强依赖内容（优先移除历史演进记录）
  2. L3 从全量降为 Top-N（按相关性 > 变更时间 > 风险排序）
  3. 仍超限时，control 仅保留 ID 列表，正文通过 references 按需拉取
- **超限时输出 warning**：`CONTEXT_BUDGET_EXCEEDED: 已降级到 Level N，部分上下文需按需读取`

### 3.4 规模策略

| 规模 | 默认策略 | 说明 |
|------|---------|------|
| S | inline-first | 优先 control + 少量引用 |
| M | hybrid | control + 关键引用并行 |
| L | references-first | control 仅保留索引，正文全部按需读取 |

引用约束：S/M 默认 `max_refs=20`，L 默认 `max_refs=50`。

---

## 4. Session Catchup 机制

### 4.1 触发条件

- `/clear` 命令
- 上下文窗口截断
- IDE 重启或网络中断后重连
- 跨 Agent 委派时（新 Agent 无前序会话上下文，需通过 Catchup 恢复 Feature 状态）
- 编排 Skill 检测到上下文缺失时自动调用

### 4.2 恢复流程（7 步）

```text
catchup(featureId)
  │
  ├── 1. 读取 stage-state.json（当前阶段）
  ├── 2. 读取 task_plan.md（任务规划状态）
  ├── 3. 读取 stage-state.json（已完成进度）
  ├── 4. 读取 findings.md（已有发现）
  ├── 5. 定位当前阶段 + 当前 TASK
  ├── 6. 扫描必需文件缺失项（spec/design/tasks/tests/matrix）
  └── 7. 输出恢复摘要到终端（含 missing files 列表）
```

### 4.3 恢复后强制校验

1. `current_phase` 与 `stage-state.json` 一致
2. `current_task` 与 `task_plan.md` 中最新未完成任务一致
3. 恢复摘要必须包含 `missing_files[]`（为空也要显式输出）

不一致时输出 warning 并提示用户修正（轻量告警，默认不阻断阶段推进）。

### 4.4 自动触发策略

| 策略 | 行为 |
|------|------|
| `auto`（默认） | 新会话启动时自动执行只读 Catchup（静默） |
| `prompt` | 新会话启动时提示用户是否执行 Catchup |
| `off` | 不自动触发，仅手动调用 |

并发保护：60 秒内不重复触发。失败时降级为手动 catchup。

---

## 5. AI 统计

文件路径：`specs/<featureId>/ai-stats.jsonl`

```json
{"timestamp":"2026-02-10T10:00:00Z","skill":"code","taskId":"TASK-AUTH-001","tokensIn":2400,"tokensOut":1800,"duration":45}
```

每次 Skill 执行完成后追加一行，用于后续度量分析。

---

## 6. 最小实现清单

1. `buildContext(featureId, opts)` — 构建 Context Pack（control + references）
2. `sliceContext(pack, budget)` — 按预算裁剪上下文
3. `catchup(featureId)` — 7 步恢复流程
4. `validateConsistency(pack)` — 一致性校验（checksum + mtime）
5. `recordStats(featureId, stats)` — AI 统计写入 JSONL
