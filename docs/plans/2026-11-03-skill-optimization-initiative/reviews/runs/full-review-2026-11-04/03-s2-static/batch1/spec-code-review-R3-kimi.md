证据已足够，产出评审报告。

# spec-code-review 评审（R3）

## 逐项裁决表

| ID | 裁决 | 证据（file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:57-66; references/modes-and-output.md:31-40 | 每条硬规则都锚定真实失败类（冲突参数、空基线、静默 mutation、假独立覆盖），无过时矛盾约束 |
| D02 | pass | references/scope.md:45-74; references/findings-schema.json:118 | 任务归属、exact/cumulative 隔离、quote-the-line 锚点是领域知识；脚本只做指纹/hash，语义留给 LLM |
| D03 | pass | references/finish-review.md:120-148,150-162; scripts/review-scope.py:295 | Stage 5d 命令证据与 5e snapshot 复验由脚本强制；prose 类验证（Stage 5b）明示为质量门非机械判定 |
| D04 | pass | references/scope.md:50-53; finish-review.md:268; spec-work/references/work-intake-and-task-pack.md:167 | task-pack digest drift → failed；`required_gate_eligible` 被 spec-work 实际消费，字段/语义对齐 |
| D05 | pass | SKILL.md:1-76; references/ 共 1798 行分 14 个 owner 文件 | 入口 76 行只留 spine 与原则，每 reference 单一职责、按阶段读取，可定位 |
| D06 | pass | SKILL.md:13,46; references/scope.md:237-253; references/cross-model-review.md:5-9 | dispatch 缺失→degraded inline 显式降级并 `verdict: Not ready`；跨模型 peer 诚实 dormant 并列重评条件 |
| D07 | pass | evals/cases/*.yaml; tests/unit/spec-code-review-*.test.js(1404 行） | eval case 与 1404 行合同测试体现失败→修订→复验链；机制存在且被测试断言 |
| D08 | pass | SKILL.md:43-50; references/dispatch-reviewers.md:46 | spine 声明按需读 reference；大 diff 传路径不内联；lite roster 有 fail-closed 边界 |
| B01 | pass | SKILL.md:3,30,45 | description 与 When to Use 给出正向触发与 spec-debug/spec-resolve-pr-feedback 负例路由 |
| B02 | pass | references/scope.md:11-53; references/intent-and-plan.md:63-77 | task-context schema、plan_source explicit/inferred 置信度分层清晰；输入输出与设计意图一致 |
| B03 | pass | SKILL.md:20,61-64; references/modes-and-output.md:52-79; references/apply-findings.md:24-44 | report-only 默认、apply/commit/dispatch 三层独立授权；材料内嵌指令不产生权限 |
| B04 | pass | SKILL.md:55; tests/unit/spec-code-review-contracts.test.js:96-120 | 真相源为 skills/ 源码，合同测试直接断言源码内容；generated mirror 非修复目标 |
| B05 | pass | references/scope.md:9,132-150; references/dispatch-reviewers.md:69,130-132; references/finish-review.md:160-162 | 无提交仓库、PR fetch 失败、capacity backpressure、reviewer mutation 均有显式 fail-closed/degraded 路径 |
| B06 | pass | references/finish-review.md:79-110,282-291; references/validator-template.md:55-81 | Stage 5b 三态验证、敏感反证规则、Quality Gates 六项、Coverage 强制披露未完成项 |
| X01 | not-applicable | — | 本 Skill 审查的是单次 diff 快照，不编排多模块长任务；多模块分解归 spec-plan/spec-work |
| X02 | pass | references/finish-review.md:215-266; references/scope.md:19 | JSON 输出为稳定 contract；`spec-code-review-task-context/v1` 显式版本化 |
| X03 | pass | references/scope.md:97-108; references/select-and-route.md:91-103; references/cross-model-review.md | 高风险走 adversarial+跨模型准入闸；Stage 3c 缩减 fail-closed，不确定即全量 |
| X04 | pass | references/finish-review.md:322-344; SKILL.md:21 | run artifact（report/review/metadata）含 run_id/head_sha/verdict 供下游 handoff 消费 |

## Findings

1. **D06 静态层降级承诺存在，运行时触发未被实测** — skills/spec-code-review/references/scope.md:237-253。后果：inline fallback 路径的 prose 正确性有 eval 覆盖（agent-mode-remains-read-only.yaml 断言 `dispatch_authorization_missing`），但真实 subagent dispatch 路径在本轮无法运行验证。按裁决纪律记 D06=pass（静态承诺一致可定位），行为层属 not-run，此处登记为限制而非缺陷。保持现状成立。

2. **cross-model peer 机制完整但长期 dormant，依赖人工重评触发** — references/cross-model-review.md:5-9。后果：独立跨模型覆盖的承诺结构性缺失，所有多 reviewer 共识均同模型，置信度提升链（finish-review.md:46 提分规则）实际不可达。机制存在、重评条件已写明，符合「诚实降级」而非「静默失效」，但缺少明确重估时间点/owner 触发器。最小修复建议：在 dormant 段补一条重估触发（如「宿主提供可认证 receipt 或下次年度合同审查时重评」），否则保持现状成立。

3. **adversarial persona 提分链在 dormant 状态下不可达，Coverage 披露依赖 orchestrator 自觉** — references/finish-review.md:46 vs cross-model-review.md:7。后果：合并时 peer 提分规则存在但永远不会触发，单模型 persona 的 75/100 finding 无法获得独立 corroboration，Coverage 必须披露「独立覆盖未运行」——该披露是 prose 约定（scope.md:250 要求记录 not run），无脚本断言。属可接受的诚实降级，不判 fail。

## 主责深挖面发现（B05/B06 + 归因验证）

对照 evals/ 案例核对「机制存在但未触发 vs 机制缺失」：

- **B05 失败/恢复类**：evals 覆盖了三条关键失败路径——conflicting-scope-fails-early（参数冲突 fail-early）、agent-mode-remains-read-only（缺 dispatch 授权→degraded）、ambiguous-input-no-blocking-prompt（模糊输入不阻断）。源码侧 scope.md:9（无提交仓库）、scope.md:132-150（PR ref fetch 失败与身份校验）、dispatch-reviewers.md:69（capacity backpressure 不当失败处理）、finish-review.md:150-162（mutation 检测+snapshot 复验）形成完整失败处理面。**归因结论：机制存在且有 eval/合同测试触发**，未发现「机制缺失」类缺口。
- **B06 完整交付/审查质量**：report-only-detects-tenant-bypass.yaml 验证了「真实 diff 中定位越权+只读」的端到端行为；r2-preset-authorize-fix.yaml 验证 apply-fixes 授权边界（修复不提交）。Stage 5b 三态验证、quote-the-line gate、Quality Gates 六项（finish-review.md:282-291）构成审查质量闭环。**机制存在且被测试断言。**
- 残留限制：所有 eval case 均以「不调用子代理」为前提运行（见各 case prompt「不要调用子代理或并行 reviewer」），真实多 reviewer dispatch 后的合并/验证行为在 eval 层**机制存在但未触发**。这不削弱静态 pass 裁决，但意味着 behavior_quality 层对 Stage 4/5 的实际运行证据缺失，本轮记为已知限制。

## 未读文件

- `references/review-output-template.md`（176 行）：只 grep 了 mode:agent/Applied 段落，未通读全文。后果：渲染骨架的完整章节顺序未逐节核对，但核心 contract（finish-review.md:179 声明其为准）已被合同测试与 grep 锚定，风险低。
- `references/personas/*.md`（16 个 persona 文件）：未逐个人读。后果：单个 persona 的校准/抑制条件未逐一审查；但 selection 边界在 persona-catalog.md 与 select-and-route.md 已核对，persona 内容由 tests/unit/agent-persona-template-drift.test.js 等合同测试断言。本轮按实际调用路径（orchestrator 视角）判断为可接受的边界。
- `evals/*-capability-cases.json`（6 个）：未读。后果：能力 case 的具体断言未核对，仅确认被合同测试加载。
- `scripts/*.py`、`scripts/*.sh`：未逐行读实现，仅 grep 了 mutation gate 关键行（review-scope.py:295,327）。后果：脚本内部实现的正确性未审计；但其输入输出合同被 finish-review.md 与单测锚定。

## 结论一句话

spec-code-review 的 18 项检查全部通过（X01 不适用）：三层授权边界、失败降级、审查质量闭环机制完整且与消费者（spec-work、1404 行合同测试、eval cases）对齐；唯一结构性限制是跨模型独立覆盖处于有明示重评条件的 dormant 态，以及多 reviewer dispatch 行为仅有静态承诺、eval 层未触发。
