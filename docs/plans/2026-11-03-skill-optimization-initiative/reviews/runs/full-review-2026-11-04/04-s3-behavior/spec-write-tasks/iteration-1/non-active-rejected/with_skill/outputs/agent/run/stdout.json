已确认全部关键事实。仓库中没有 `src/server.js`（只有 `.claude/`、`docs/`），也没有已存在的 `docs/tasks/` 任务包。结论已经清楚，无需编译。

## 结论：不生成可执行任务包（`source_plan_non_active`）

**源计划是一个已完成的非活跃计划**，不满足编译条件：

| 检查项 | 结果 |
| --- | --- |
| 计划 frontmatter | `type: feat`、`status: completed`、`origin: old-thing` |
| 实施单元 | 仅 U1「已交付功能」——Goal 为「已上线并验证」，即无剩余工作 |
| 计划声明文件 `src/server.js` | 当前仓库中不存在，印证这是从别处归档的历史计划 |
| 现存任务包 | 无（`docs/tasks/` 不存在） |

按本 skill 的核心规则：**可执行任务只能从 `status: active` 的计划编译**；`completed` 计划返回 `source_plan_non_active`——不做 hash、不写入新的可执行任务包、也不路由到 `spec-work`。该计划没有未决范围或验收缺口需要补拆，「已交付」也不构成可再执行的任务切片，因此我没有为它创建任何 `docs/tasks/` 文件。

### 下一步（二选一，由你决定）

1. **无需动作**——如果这份计划只是历史归档，「已上线并验证」即终态，本就没有可拆分的执行内容。
2. **确有后续工作要做**——请明确说明要在 old-thing 上补完/继续的范围，先经 `spec-plan`（Phase 0.1 历史计划入口）建立有效的 `active` 后继计划，之后我再按本 skill 正常生成并校验新任务包。仅凭本次拆分请求不构成实施授权。

### Final Decision Envelope

```yaml
decision: return-to-plan
reason_code: source_plan_non_active
identity_basis: source-plan-path+body-hash
artifact_root: /private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-612924684
repo_root: /private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-612924684
reason: 源计划 status 为 completed 且唯一实施单元已交付上线，按生命周期规则拒绝编译可执行任务包。
source_plan: docs/plans/2026-08-01-001-feat-old-thing-plan.md
task_pack: null
task_pack_validity: not-applicable
deterministic_handoff: false
validity_scope: identity-freshness-structure-only
semantic_posture: not-applicable
dispatch_authorization: not_applicable
validation: null   # 非活跃分支不产出任务包，未运行 CLI validate/hash（Core Rule 10 禁止将其 hash 进新任务包）
orientation:
  provider: direct-repo-reads
  posture: bounded
  evidence_refs:
    - docs/plans/2026-08-01-001-feat-old-thing-plan.md
  limitations:
    - 计划仅声明一个已交付单元（U1），无剩余范围线索
    - 计划声明的 src/server.js 在当前仓库不存在，确认为历史归档
    - 仓库内无 docs/tasks/ 现存任务包
next_action: stop
```

`next_action: stop` 的依据：你没有明确要求「补完」这份非活跃历史计划，且它没有剩余范围；若要走选项 2，告诉我后续需求即可。
