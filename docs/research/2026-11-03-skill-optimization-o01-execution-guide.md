# O01 spec-plan 优化执行指南

日期：2026-11-03。类型：execution guide。状态：ready for U2 execution。

本文件为 O01 的可执行启动路径，补充主方案（`2026-11-03-skill-optimization-official-practices.md`）中的抽象实验设计。

---

## 前置条件检查清单

在启动 U2 前必须确认：

- [ ] S04 修复已提交且独立 fresh-source 复核通过
- [ ] 当前新增付费预算明确（当前为 0，只能做准备工作）
- [ ] U1（入口证据纠偏）已完成或确认不需要
- [ ] 实验目录 `docs/validation/skill-prompt-adaptation/spec-plan-baseline/` 已存在
- [ ] `case-catalog.yaml`、`quality-rubric.md`、`judge-contract.md`、`observability-probe.md` 状态为 `draft-freeze-candidate`

---

## U2 可执行路径：建立实际读取与质量基线

### 步骤 1：运行 Observability Probe（优先级 P0）

**目标**：确认宿主能否提供 C1 所需的 6 个必须事实。

**输入**：
- 当前宿主：Claude Code 2.1.x 或 codex-cli 0.166.x
- 测试任务：一个最小 spec-plan 调用（例如：`/spec-plan "add user authentication to API"`）

**执行方法**：

由于 `observability-probe.md` 状态为 `not-run`，需要手工执行以下检查：

```bash
# 1. 准备隔离实验目录
mkdir -p docs/validation/skill-prompt-adaptation/spec-plan-baseline/probe-run-$(date +%Y%m%d-%H%M%S)
cd docs/validation/skill-prompt-adaptation/spec-plan-baseline/probe-run-*

# 2. 记录宿主身份
echo "host: $(which claude-code || which codex)" > probe-environment.txt
echo "version: $(claude-code --version 2>/dev/null || codex --version 2>/dev/null)" >> probe-environment.txt
echo "model: [需要在实际运行时从 trace 提取]" >> probe-environment.txt
echo "date: $(date -Iseconds)" >> probe-environment.txt
```

**手工观测清单**（在真实任务运行后回答）：

```yaml
probe_results:
  source_identity:
    available: true | false | unknown
    evidence: "宿主是否在 trace 中记录了读取的 file path、hash 或 timestamp"
    blocker: "[如果 false，说明为什么无法获取]"
  
  read_payload:
    available: true | false | unknown
    evidence: "能否从 trace 中提取实际返回的文本长度或 token 数"
    blocker: "[如果 false，说明缺少什么]"
  
  context_residency:
    available: true | false | unknown
    evidence: "宿主是否提供了内容仍在上下文的证明（例如 cache hit、explicit reuse）"
    blocker: "[如果 false，说明无法证明 residency]"
  
  model_host_identity:
    available: true | false | unknown
    evidence: "trace 是否包含 model ID、host version、effort"
    blocker: "[如果 false，说明缺少哪些字段]"
  
  usage_cost:
    available: true | false | unknown
    evidence: "是否有 request token、cache token、费用数据"
    blocker: "[如果 false，说明只能用 proxy 估算]"
  
  artifact_consumer:
    available: true | false | unknown
    evidence: "生成的 plan 文件是否有稳定路径、hash、关键字段可回源"
    blocker: "[如果 false，说明产物验证缺口]"

readiness: ready | partial | blocked
readiness_reason: "[根据 6 个事实的 available 状态判断]"
```

**决策规则**：

- 6 个事实全部 `available: true` → `readiness: ready`，继续步骤 2
- 1-2 个 `available: false` 但可以用 proxy 替代 → `readiness: partial`，只能做质量评测，不能声称成本收益
- 3 个以上 `available: false` 或 `context_residency: false` → `readiness: blocked`，O01 终止，记录 `pending-evidence`

**输出**：`probe-results.yaml` 保存到 `docs/validation/skill-prompt-adaptation/spec-plan-baseline/probe-run-YYYYMMDD-HHMMSS/`

---

### 步骤 2：采集当前基线读取事件（优先级 P0）

**前置条件**：步骤 1 结果为 `ready` 或 `partial`。

**目标**：在真实任务中找到至少两个任务、每个至少一处符合 C1 六条件的重复读取。

**任务选择**（从 case-catalog.yaml 的 development 集合中选 3 个）：

1. `dev-cold-reference`：必须读取 required owner 的正例
2. `dev-same-hash-omitted`：hash 未变但 residency unknown 的场景
3. `dev-scope-change`：scope 变化需要重新读取的场景

**执行方法**（每个任务）：

```bash
# 在隔离目录中运行
TASK_ID="dev-cold-reference"
RUN_DIR="docs/validation/skill-prompt-adaptation/spec-plan-baseline/baseline-run-${TASK_ID}-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RUN_DIR"

# 记录任务输入
cat > "$RUN_DIR/task-input.txt" << 'EOF'
[从 case-catalog.yaml 中对应 case 的 must 字段复制具体输入]
EOF

# 运行任务（需要在真实宿主中执行）
# /spec-plan "$(cat $RUN_DIR/task-input.txt)"

# 任务结束后，手工分析 trace（如果宿主提供）
# 或使用 Read 工具读取生成的 plan 文件，记录：
```

**读取事件记录模板**（保存为 `$RUN_DIR/read-events.yaml`）：

```yaml
task_id: dev-cold-reference
baseline_source_sha256: "[从 source-sha256.txt 读取 skills/spec-plan/SKILL.md 的 hash]"
model: "[从 trace 提取]"
host_version: "[从 probe-environment.txt]"
effort: "[如果 trace 中有]"

read_events:
  - event_id: 1
    file_path: "skills/spec-plan/SKILL.md"
    read_time: "[timestamp or turn number]"
    payload_bytes: "[如果可获取]"
    payload_tokens: "[如果可获取，否则标记 proxy]"
    truncated: false | true | unknown
    
  - event_id: 2
    file_path: "skills/spec-plan/references/intake.md"
    read_time: "[timestamp or turn number]"
    payload_bytes: "[如果可获取]"
    payload_tokens: "[如果可获取，否则标记 proxy]"
    truncated: false | true | unknown
    c1_candidate: false  # 第一次读取，不是重复
    
  - event_id: 3
    file_path: "skills/spec-plan/references/intake.md"  # 第二次读取同一文件
    read_time: "[timestamp or turn number]"
    payload_bytes: "[如果可获取]"
    payload_tokens: "[如果可获取]"
    truncated: false | true | unknown
    c1_candidate: true   # 可能符合 C1 条件
    c1_check:
      same_turn: true | false  # 是否在同一 turn 内
      source_unchanged: true | false  # hash 是否未变
      content_complete: true | false  # 上次读取是否完整
      residency_proven: true | false | unknown  # 宿主是否证明内容仍在上下文
      not_terminal: true | false  # 是否非 terminal owner
      no_scope_change: true | false  # scope 是否未变

total_instruction_payload_tokens: "[所有读取事件的 token 总和]"
total_request_input_tokens: "[如果宿主提供 usage]"
wall_clock_seconds: "[任务总耗时]"
outcome: success | failed | timeout
artifact_path: "[生成的 plan 文件路径]"
artifact_sha256: "[plan 文件的 hash]"
```

**机会分析**（在收集 3 个任务后）：

统计符合 C1 全部 6 个条件（`c1_check` 全部为 `true`）的重复读取事件：

```bash
# 在所有 baseline-run-*/read-events.yaml 中搜索
grep -A 6 "c1_candidate: true" docs/validation/skill-prompt-adaptation/spec-plan-baseline/baseline-run-*/read-events.yaml > c1-opportunities.txt

# 统计符合全部条件的事件数
# 需要至少找到 2 个不同任务、每个至少 1 个合格事件
```

**决策规则**：

- 找到 ≥2 个任务、各有 ≥1 个合格事件 → 机会存在，继续 U3
- 找到 <2 个任务或事件 → `no-opportunity`，O01 终止，记录原因
- 无法判断（例如 `residency_proven: unknown`） → `pending-evidence`，需要更多宿主信息

**输出**：
- `baseline-run-*/read-events.yaml`（每个任务一份）
- `c1-opportunities-summary.yaml`（汇总分析）
- `baseline-receipt.json`（按 baseline-receipt.schema.json 格式）

---

### 步骤 3：冻结实验卡（优先级 P1）

**前置条件**：步骤 2 找到合格机会。

**目标**：按 U2 要求冻结 case/rubric、source/harness/environment 身份。

**实验卡模板**（保存为 `docs/validation/skill-prompt-adaptation/spec-plan-baseline/o01-experiment-card.yaml`）：

```yaml
experiment_id: o01-spec-plan-c1
status: frozen
frozen_at: "2026-11-03T[TIMESTAMP]"

problem_and_candidate:
  observed_issue: "spec-plan Phase Reads 要求每阶段重读 required owner，即使内容已在上下文"
  evidence_path: "docs/validation/skill-prompt-adaptation/spec-plan-baseline/baseline-run-*/read-events.yaml"
  hypothesis: "同一 turn 内、source 未变、内容完整且 residency 可观测时，复用已读内容"
  mutable_files:
    - skills/spec-plan/SKILL.md
    - skills/spec-plan/references/[待确定具体哪个 reference 包含重读要求]
  immutable_files:
    - skills/spec-plan/evals/
    - skills/spec-plan/references/[除 mutable 外的全部]
    - tests/unit/spec-plan-contracts.test.js
    - tests/unit/spec-plan-reference-contracts.test.js
  necessary_consumers:
    - spec-work
    - spec-doc-review
    - spec-write-tasks

baseline_and_isolation:
  baseline_commit: "[git rev-parse HEAD]"
  baseline_source_manifest:
    skills/spec-plan/SKILL.md: "[sha256]"
    skills/spec-plan/references/intake.md: "[sha256]"
    skills/spec-plan/references/plan-handoff.md: "[sha256]"
    # ... 所有被 read-events.yaml 记录的文件
  candidate_worktree: ".worktrees/o01-spec-plan-c1"
  candidate_diff_path: "docs/validation/skill-prompt-adaptation/spec-plan-baseline/o01-candidate.diff"
  candidate_source_manifest: "[在 U3 构造候选后填写]"
  includes_s04_fixes: true  # 基线包含 S04 修复（commit 28b19305b）

fixed_cases:
  development:
    - id: dev-plan-only
      family: boundary
      input_fixture: "evals/cases/planning-only-rejects-implementation.yaml"
      expected_decision: "plan-only, no product code write"
      positive_negative: positive
    - id: dev-cold-reference
      family: retrieval
      input_fixture: "[待绑定]"
      expected_decision: "must read required owner before action"
      positive_negative: positive
    - id: dev-same-hash-omitted
      family: context
      input_fixture: "[待绑定]"
      expected_decision: "must reread when residency unknown"
      positive_negative: negative  # C1 候选应该复用，但这是反例
    # ... 从 case-catalog.yaml 复制全部 12 个 development cases
  
  holdout:
    - id: holdout-unknown-residency
      family: context
      input_fixture: "[独立保管方冻结，不供候选调优]"
      expected_decision: "choose conservative reread"
      positive_negative: negative
    # ... 从 case-catalog.yaml 复制全部 8 个 holdout cases

execution_and_criteria:
  measurement_command: "[待 U3 确定 harness]"
  runner_version: "skill-up --version 或等效"
  checker_script: "tests/unit/spec-plan-contracts.test.js"
  judge_rubric: "docs/validation/skill-prompt-adaptation/spec-plan-baseline/quality-rubric.md"
  model_host_effort_cache:
    - layer_id: claude-code-opus-5.5
      model: claude-opus-5.5
      host: claude-code-2.1.x
      effort: default
      cache: default
    - layer_id: codex-astra
      model: gpt-6-astra
      host: codex-cli-0.166.x
      effort: default
      cache: default
  permission_boundary: "read-only research, bounded worktree isolation, no runtime refresh, no push"

quality_gate_and_benefit:
  critical_regressions_allowed: 0
  examples:
    - "authorization bypass"
    - "source/runtime mix-write"
    - "plan-only implements code"
    - "fabricated verification"
    - "readiness false promotion"
    - "handoff drops critical constraint"
    - "recovery omits load-bearing rule"
  
  ordinary_quality_dimensions:
    - requirement_coverage
    - source_grounding_correctness
    - implementation_operability
    - acceptance_verifiability
  
  primary_metric: instruction_read_payload_tokens
  direction: minimize
  aggregation: median
  threshold: 0.20  # 20% paired median reduction
  noise_ceiling: 0.10  # 10% A/A noise
  
  secondary_metrics:
    total_task_cost_regression_tolerance: 0.05  # +5%
    wall_clock_regression_tolerance: 0.10  # +10%

budget_and_stop:
  max_candidates: 1  # 只有 C1 单变量候选
  max_attempts_per_layer: 200
  max_aa_attempts: 40  # 20 cases × 2 repeats
  max_ab_attempts: 120  # 20 cases × 2 arms × 3 repeats
  max_infrastructure_retries: 40
  max_judge_invocations: "[待计算：case 数 × repeats × arms × judge pass 数]"
  max_usd: 0  # 当前无新增预算授权
  stop_on_critical_regression: true
  stop_on_noise_exceeds_ceiling: true
  stop_on_budget_exhausted: true

dependencies_and_promotion:
  required_baseline_fixes:
    - S04: "commit 28b19305b, F-S04-01/02/04"
  upstream_versions:
    - spec-first: "1.15.3"
    - claude-code: "2.1.x"
    - codex-cli: "0.166.x"
  affected_consumers:
    - spec-work: "must replay plan handoff"
    - spec-doc-review: "must accept plan artifact"
    - spec-write-tasks: "must parse plan Product Contract"
  review_method: "fresh-source eval with independent read-only reviewer"
  promotion_conditions:
    - "quality gate passed: all 4 layers, 20+8 cases"
    - "cost gate passed: ≥20% reduction, lower bound >0"
    - "fresh-source review: passed"
    - "consumer replay: passed"
    - "host projection: passed for Claude + Codex"
    - "baseline unchanged: no drift"
```

**验证**：实验卡冻结后，由独立审查者检查：

- [ ] baseline commit 和 source manifest 可回源
- [ ] 20 个 case 有具体 input fixture 和 expected decision
- [ ] 质量门与 quality-rubric.md 一致
- [ ] 预算与当前授权一致（当前 max_usd: 0）
- [ ] 依赖的 S04 修复已验证

---

## 当前阻塞与后续路径

### 当前状态

- **observability-probe.md**：`not-run`
- **case-catalog.yaml**：`draft-freeze-candidate`
- **真实基线读取事件**：未采集
- **C1 机会分析**：未执行
- **新增付费预算**：0

### 阻塞优先级

1. **P0-A**：运行 observability probe，确认 `readiness: ready | partial | blocked`
2. **P0-B**：采集 3 个 development case 的基线读取事件
3. **P0-C**：分析是否存在 ≥2 个任务、各有 ≥1 个合格 C1 机会

如果 P0-A 返回 `blocked` 或 P0-C 返回 `no-opportunity`，则 O01 合法终止，记录 `pending-evidence`。

### 无需新增预算的准备工作

即使当前 `max_usd: 0`，以下工作可以继续：

- 完成 observability probe（手工分析既有 trace 或运行一次任务）
- 采集基线读取事件（每个 task 运行一次，成本有限）
- 冻结实验卡（纯文档工作）
- 准备 judge 人工校准样本（标注工作，不调用模型）
- 编写 harness 脚本（开发工作）

只有 A/A 和 A/B 需要大量付费运行，可以在预算授权后再执行。

---

## 输出清单

U2 完成后应有：

```
docs/validation/skill-prompt-adaptation/spec-plan-baseline/
├── probe-run-YYYYMMDD-HHMMSS/
│   ├── probe-environment.txt
│   └── probe-results.yaml
├── baseline-run-dev-cold-reference-YYYYMMDD-HHMMSS/
│   ├── task-input.txt
│   ├── read-events.yaml
│   └── task-output/ (plan 文件)
├── baseline-run-dev-same-hash-omitted-YYYYMMDD-HHMMSS/
│   └── ...
├── baseline-run-dev-scope-change-YYYYMMDD-HHMMSS/
│   └── ...
├── c1-opportunities-summary.yaml
├── o01-experiment-card.yaml (status: frozen)
└── baseline-receipt.json
```

U2 交付判据：

- observability probe 结果为 `ready` 或 `partial`
- 至少 3 个 baseline-run 目录，每个有完整 read-events.yaml
- c1-opportunities-summary.yaml 结论为「机会存在」或「no-opportunity」
- 实验卡状态为 `frozen`，经独立审查者验证

---

## 与主方案的对应关系

| 主方案 Implementation Unit | 本指南覆盖范围 |
|---|---|
| U1（纠正入口证据） | 前置条件检查 |
| U2（建立实际读取与质量基线） | 步骤 1-3（observability probe + 基线采集 + 实验卡冻结） |
| U3（构造候选） | 待 U2 完成且机会存在后启动 |
| U4（配对测量） | 待 U3 完成且预算授权后启动 |
| U5（有条件推广） | 待 U4 通过质量+成本门后启动 |
| U6（固化适配闭环） | 待 U4 有结论（推广或不推广）后启动 |

---

## 风险与降级

| 风险 | 检测信号 | 处置 |
|---|---|---|
| 宿主无法证明 residency | probe-results.yaml: `context_residency: false` | C1 终止，记录 `blocked`，说明 C1 需要的 residency 证明当前宿主不提供 |
| 找不到合格重复事件 | c1-opportunities-summary.yaml: 机会数 <2 | 记录 `no-opportunity`，不是失败，只是当前负载不适合 C1 |
| 预算不足无法运行 A/A | max_usd: 0 | U2 交付准备产物，U4 标记 `not-run: budget-missing`，不伪造结果 |
| S04 修复的真实回归未验证 | baseline 包含未验证的修复 | 在实验卡明确标注 `includes_s04_fixes: true`，不把 O01 结果当作 S04 真实行为验证 |
| Holdout 提前暴露 | development 调优看到 holdout 输入 | 冻结新 treatment，换新 holdout，重新预注册 |
