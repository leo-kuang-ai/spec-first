---
title: "spec skill 体系 Slice A' P0 handoff gate 加固"
date: "2026-06-28"
last_updated: "2026-06-28"
category: "workflow-issues"
module: "spec-first"
problem_type: "workflow_issue"
component: "skill-chain"
severity: "high"
applies_when:
  - "audit scanner P0 结果全为生成 runtime 边界说明误报，掩盖真实安全风险"
  - "spec-plan 产出计划不携带来源质量信号（PRD-grade vs brainstorm-grade）"
  - "task-pack semantic_posture: reviewed-existing 为 LLM 自报，无法复验"
  - "spec-doc-review 发现可复用教训后路径消失，知识不沉淀"
tags: ["scanner", "false-positive", "origin-grade", "evidence-metadata", "handoff", "learning-capture", "spec-skill-chain"]
source_refs:
  - "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md"
  - "docs/brainstorms/2026-06-28-002-spec-skill-robustness-stability-optimization-requirements.md"
---

# spec skill 体系 Slice A' P0 handoff gate 加固

## 问题

核心链路 `Codebase→Spec→Plan→Tasks→Work→Review→Knowledge` 四个 handoff 节点各有一个确定性 gate 缺口：

1. **audit scanner 误报**：`PROHIBITION_HINTS` 未收录 `does not`/`excludes`/`are not source`，导致 "禁止手改 `.claude/`" 类边界说明被错判为 P0 危险指令（全仓仅有的3个 P0 全为误报）。
2. **Spec→Plan 来源质量不可见**：`spec-plan` 候选发现不区分 PRD-grade 与 brainstorm-grade，产出计划不携带 `origin_grade`，下游无法判断证据强度。
3. **Tasks→Work posture 自报**：`semantic_posture: reviewed-existing` 可被 LLM 自称，CLI 不产 `reason_code`，spec-work 执行前不验证证据存在性。
4. **Review→Knowledge 路径缺失**：`spec-doc-review` 无 learning-capture 步骤，headless 模式静默丢弃可复用教训。

## 解法

**原则：Scripts prepare deterministic facts; LLM decides semantic adequacy above that floor。**

### T001 — Scanner 误报修复

`skills/spec-skill-audit/scripts/lib/security-patterns.js` `PROHIBITION_HINTS` 补入：
```js
/\bare not\b/i, /\bdoes not\b/i, /\bexcludes?\b/i, /\bnot source\b/i, /\bnot owned\b/i
```
边界说明降级 P3，直接写入指令保持 P0。加 2 个 scanner fixture 防回归。

### T002 — origin_grade 元数据

`planning-flow.md` Phase 0.2 增候选发现时读 `artifact_kind` 字段，标注 PRD-grade/brainstorm-grade/legacy。`plan-template.md` frontmatter 加 `origin_grade` 字段（visible、non-blocking，brainstorm-grade 直接入口合法）。

### T003 — task-pack reason_code + evidence 字段

`task-pack.js` 加 `deriveReasonCode()` 映射 valid/wrong-chain/stale/unverifiable/invalid 到机器可读 code；`ALLOWED_TASK_FIELDS` 加 `semantic_posture_evidence`/`dispatch_authorization_evidence`（shape-check only，CLI 不判语义充分性）。

### T004 — spec-work/spec-write-tasks 证据复验

`spec-work/SKILL.md` 任务包 intake 补：identity/freshness/structure 通过后还需核查 `semantic_posture` 证据。`reviewed-existing` 无 evidence → 降为 `unchecked-existing`。`dispatch_authorization: authorized` 无引用 → 降为 `missing`。

### T005 — doc-review learning-capture

`spec-doc-review/SKILL.md` 加 Learning Capture Recommendation 节（三段式 Skip/Offer/Lean），headless 至多一行 advisory，不自动运行 `spec-compound`，不写 `docs/solutions/`，非 gate。

## 验证

- T001：`npx jest tests/unit/skill-audit-scripts.test.js`（38/39，1 pre-existing fail）；全仓实扫 P0 runtime_governance 降为 0
- T003：`npx jest tests/unit/task-pack-command.test.js`（51/51）
- T005：`npx jest tests/unit/spec-doc-review-contracts.test.js`（19/19）；fresh-source eval PASS
- T002/T004：合约测试通过；fresh-source eval strongly recommended

## 关键教训

- **"机制存在" ≠ "机制对特定 case 生效"**：`PROHIBITION_HINTS` 有 `do not` 不代表覆盖 `does not`，source-read 确认比假设更重要。
- **Evidence metadata 应携带来源，不应替代语义判断**：CLI shape-check 验证字段形状，LLM/human 负责判断语义充分性，两者边界清晰。
- **Downstream Consumers 是契约承诺**：doc-review 没有列 `spec-compound` 就是没有路径，列了才有行为。
