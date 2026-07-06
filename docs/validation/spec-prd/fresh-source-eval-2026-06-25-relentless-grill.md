# Fresh-Source Eval: spec-prd Relentless Grill

```yaml
fresh_source_eval:
  schema_version: fresh-source-eval-record.v1
  producer: spec-work
  freshness: current-worktree
  authority_level: advisory
  reason_code: fresh-source-eval-not-run-no-dispatch-authorization
  consumer: spec-prd contract tests and work closeout
  status: not_run
  supersedes: docs/validation/spec-prd/fresh-source-eval-2026-06-23-grill-first-clarification.md
  source_paths:
    - skills/spec-prd/SKILL.md
    - skills/spec-prd/references/grill-with-docs-integration.md
    - skills/spec-prd/references/domain-language-and-decision-ledger.md
    - skills/spec-prd/references/product-expert-lens.md
    - skills/spec-prd/references/evidence-and-topology.md
    - skills/spec-prd/references/prd-readiness-lens.md
    - skills/spec-prd/references/prd-output-template.md
    - skills/spec-prd/evals/examples.json
    - tests/unit/spec-prd-contracts.test.js
    - docs/05-用户手册/22-PRD需求文档质量增强流程.md
  runtime_paths_checked: []
  changed_behavior: "spec-prd 澄清环目标函数从'够写 PRD 就停'翻转为 relentless'理解透才停'：新增单一真相源 `## Canonical: Four Legal Stop Points`(leaf/source-resolved/owner-capped/how-pushdown)，5 个 reference 由复述旧'continue only while closes/narrows / long form 就停 / ask one question then stop'改为引用 canonical 的默认深挖；downstream_confirmation_risk 从既排序又过滤收敛为只排序；owner 手动封顶配单条兜底(owner 未给 cap/continue 信号→checkpoint-prd + pre_prd_clarification_status=checkpoint-blocked，绝不静默 ready)，含 interactive 软封顶选择点；owner_question_progress 仅加 owner-capped、pre_prd_clarification_status 加 checkpoint-blocked，不新增 grill_depth_state 独立字段。延续 2026-06-23 grill-first 的 no-fixed-cap 结论，但翻转其'continue only while each owner question closes or narrows a named gap'作为停止条件的语义。"
  reviewer_context: "本会话用户未显式授权 subagent / parallel reviewer / delegated review，按 dispatch 授权边界记 dispatch_authorization_missing，未 dispatch fresh read-only reviewer。语义行为验证(模型在改后措辞下是否真的默认追问到底、是否正确触发 owner-capped/checkpoint 兜底、source 已答分支是否仍 source-first 不问 owner)未执行，记 not_run 并附降级证据。Generated runtime mirrors 未作为 source 使用。"
  checks:
    relentless_default_not_enough_to_write_stop: not_run
    owner_capped_and_checkpoint_fallback_triggers: not_run
    source_resolved_branch_stays_source_first: not_run
    canonical_single_source_no_restated_fourtuple: deterministic-passed
    field_dedup_no_grill_depth_state: deterministic-passed
    old_stop_anchors_removed: deterministic-passed
    source_runtime_boundary: passed
    generated_runtime_mirrors: not_used
  findings:
    - id: STRUCTURAL-GATE-SKIPPABLE
      severity: P2
      kind: out-of-scope-followup
      summary: "本次 relentless 改造收紧了'走到 readiness 时不许放水'，但 spec-prd 的全部质量闸门(relentless grill、design readiness、clarification closure)都位于 readiness lens 内，而 readiness lens 本身是 LLM 自愿执行的。一个倾向抄近路的 LLM 可用'证据充分，无阻塞'一句话跳过整个 readiness 阶段，使所有闸门失效。real-run 日志(2026-06-25 KAZ 市场页 PRD)证实了这一点：figma 链接被当文本'读完'从未真 fetch、OQ 被事后补记而非 grill、最后反问'要确认还是直接进规划'而非用阻塞工具。relentless 改动无法解决'根本不走到 readiness'这条故障线。"
      recommended_route: "下一轮 spec-plan 议题：用 deterministic 脚本(check-prd-artifact.js)兜住'LLM 是否真的 decide 过'——检测 PRD 引用 figma/design source 但缺 design_source_inventory 时硬报 finding，以及'读完输入直接写 PRD 而无 grill 痕迹'在脚本层留可检测缺失。这是 'Scripts prepare, LLM decides' 向 '脚本兜住 LLM 是否真 decide' 的延伸，ROI 高于继续加 relentless 措辞。"
      status_2026-06-25: "根因经真实产物实跑纠正——真实故障是 Phase 4 / checker 根本没运行(producer 自证 ready 直接 handoff)，不是'闸跑了却全绿'(现有 checker 实跑该产物即报 28 条 finding)。已落地生产端加固(Phase 4 强制闸 + checker 本地化锚定)，并在 002 后续开发补完 defense-in-depth：`--inputs` 输入侧 design-source 扫描、grill/design/input/preflight findings、`preflight_sweep_closure` 与 Claude/Codex runtime projection contract。见 docs/validation/spec-prd/fresh-source-eval-2026-06-25-enforce-grill-design-gate.md。消费端 /spec-plan 入口自跑 checker 仍为独立 open follow-up。"
  not_run_reason: "dispatch_authorization_missing：本会话未授权 subagent dispatch，语义行为验证降级为 deterministic 脚本 + 契约测试 characterization-first 验证。"
```

## Summary

本次为 spec-prd relentless-grill 改造的 fresh-source eval 记录。诚实标注：**语义行为验证未跑 dispatch eval**（本会话无 subagent 授权），降级为 deterministic 验证。

### 已执行的 deterministic 证据（characterization-first）

- `npx jest tests/unit/spec-prd-contracts.test.js`：26 passed。删除 5 处反向止损锚点断言，新增 relentless / canonical 标题唯一性 / 单兜底 / 字段去重负向断言(含 `grill_depth_state` 与分支级冗余值 `leaf-reached`/`headless-checkpoint` 负向锁)。
- `node skills/spec-prd/scripts/run-evals.js --json`：`eval_fixture_passed`。`examples.json` 的 `large-input-ask-owner-priority` / `requirements-grill-no-fixed-cap` 旧停止语义已翻转。
- `npm run test:unit`：160 套 1382 passed，无连带破坏。
- 跨文件总检：canonical 标题在 SKILL.md 唯一(grep 计数=1)，6 文件正确引用，4 类旧止损锚点全除尽（测试中残留 1 处为 `not.toContain` 负向断言，合法）。

### 与 2026-06-23 grill-first 的衔接（supersedes）

本改动**延续**而非推翻 2026-06-23 的 no-fixed-cap 结论：固定问题数仍不是停止条件。但**翻转**了它遗留的"continue only while each owner question closes or narrows a named gap"作为停止条件的语义——那一版把"收窄不动就停"当成停止理由，本版改为"默认深挖到 canonical 四停点之一"。两份记录不矛盾，是同方向的递进。

### 未执行的语义验证（not_run，需后续 dispatch）

三项核心行为验证依赖 fresh read-only reviewer dispatch，本会话未授权，记 not_run：
1. `relentless_default_not_enough_to_write_stop`：模型是否默认追问到底而非"够写就停"。
2. `owner_capped_and_checkpoint_fallback_triggers`：owner 封顶 / owner 未给信号 → checkpoint 兜底是否正确触发。
3. `source_resolved_branch_stays_source_first`：source 已答分支是否仍 source-first 不问 owner。

降级验证手段（plan 已约定）：拿真实多源需求做 with/without relentless 措辞的 A/B 对照阅读。本会话未执行该 A/B，留作后续。

### 关键局限（finding STRUCTURAL-GATE-SKIPPABLE，P2，越界 follow-up）

real-run 日志（`2026-06-25 KAZ 市场页 PRD`）暴露：spec-prd 的质量闸门全部位于 readiness lens 内，而 readiness lens 是 LLM 自愿执行的。relentless 改造治"走到 readiness 时不放水"，治不了"根本不走到 readiness"。该结构性弱点是独立新议题，已记录为下一轮 plan 输入，不在本次改造范围。
