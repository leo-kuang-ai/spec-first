---
title: spec-first Skill 关联关系系统审查当前快照刷新报告
doc_role: audit-report
review_date: 2026-07-18
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/review-report.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 5fba757103a18103aa5943249ac095a6d82f0d3c
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf-10-doc-contract-repair
limitations:
  - 当前批次是基于 2026-07-17 全量 source audit 的增量刷新；未变 source 继承其逐行证据。
  - 未授权 generic subagent dispatch；没有 fresh-source、host-loader 或 field-outcome claim。
  - source_head 是冻结快照；current_head_at_calibration 已包含 SF-03/SF-04，尚未提交的 SF-10 artifact-map source/docs overlay 不在当前 HEAD。
---

# spec-first Skill 关联关系系统审查当前快照刷新报告

## 1. 结论

当前 working-tree source 没有 P0，仍有 1 个 P1。十项原 P1 已关闭：

- **SF-01 已关闭：** `spec-commit` 与 `spec-commit-push-pr` 已作为 internal-only package 进入现有 delivery allowlist，五宿主 projection plan 与临时 sandbox `init` 均包含 caller 所需 package references；两 helper 的 invocation 不授予 commit/landing authority，LFG 由明确 entry admission 建立并传递可见 authority facts。
- **SF-02 已关闭：** `spec-compound` 与 `spec-compound-refresh` 现在共享 `source_refs` / `invalidation_condition` promotion schema、模板、指南和字节一致 validator；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 都运行 `--promotion`，缺失、空值、错误类型或重复字段会确定性失败，默认 parser-safety 模式继续兼容 untouched legacy learning。
- **SF-03 已关闭：** Runtime Setup、config template 与 focused test 现按真实 consumer 将 `plan_output`、`brainstorm_output`、`ideate_output` 统一为 active local rendering preferences；注释示例不激活配置，默认值与 pipeline override 继续由三个 consumer 自治，setup 不调用这些 workflow。
- **SF-04 已关闭：** `spec-doc-review` 现将 `type: task-pack` 优先分类为 derived/report-only 输入，先运行真实 `spec-first tasks validate ... --json` 建立 identity/freshness/structure 地板，再以 current source plan 为 scope/acceptance/architecture/non-goals/verification 权威审查 task quality；`task_pack_outcome` 明确区分 execution handoff、pack regeneration、plan revision 与 incomplete stop。
- **SF-10 已关闭：** 用户 artifact map 现与 schema 的 `workflow_integrated` 条件、durable-trigger producer、v2 `direct_evidence_used` 字段、v1 `graph_evidence_used` read/prune 兼容和 source-owned reader 边界一致；文档不再把 `workflow_integrated=false` 写成唯一 current contract，也不再声称 workflow 自动发现或隐式消费 run artifact。
- **SF-05 已关闭：** code-review 的 `autofix_class` 仅分类 follow-up，不再授予 apply 权限；run-local `mutation_policy` 是唯一 mutation authority。
- **SF-07 已关闭：** dogfood/polish 已将 branch mutation、local fix、commit、landing 四类 authority 分离，scope 参数与 `done` 都不再隐式授权副作用。
- **SF-08 已关闭：** `spec-brainstorm` 已以治理名 `spec-lfg` 作为 autonomous handoff，并要求以宿主 available-skills 中的精确名调用、透传绝对 artifact path。
- **SF-09 已关闭：** `spec-lfg` 明确区分 `browser_applicability: applicable | not_applicable`；适用时由 caller 提供 exact loopback origin，非适用时保留 reason，失败/not-run/not-supported/cleanup 异常都阻断 shipping。
- **SF-27 已关闭：** 12 个原缺口 package 已补齐 package-local dispatch authorization/capability/fallback，原 6 个合格 package 继续满足基线，聚焦矩阵覆盖 18/18。

这些修复建立了 mutation authority 的共同地板，并闭合了 SF-01 收窄后的两个 load-bearing caller edge：`spec-lfg -> spec-commit-push-pr`、commit-authorized `spec-dogfood -> spec-commit`。`spec-work` 只在条件式 residual/landing 说明中引用这两个名称，Phase 4 的实际 contract 是“repo commit workflow / requested landing workflow”，不构成必须解析到 exact helper 的直接 caller edge。其余 3 个 internal-only record 继续保持 governance-only，不因本次修复被顺带交付。SF-02 以最小 promotion exit contract 关闭，未新增知识 registry、数据库或状态机；SF-03 只扩展现有 config consumer owner 和 focused test，不新增 key、parser、registry、schema 或状态机；SF-04 只扩展现有 doc-review owner、producer handoff 与 focused contracts，不新增 workflow、task-pack schema、approval state 或第二套 validator；SF-10 只校准用户地图和既有 artifact contract test，不改 schema、producer、read/prune helper 或 workflow consumer。maintainability shared spine 仍是唯一未关闭 P1。

此前校准已关闭 SF-01、SF-05、SF-07、SF-27，将 P1 从 9 降到 5；SF-02 进一步降到 4，SF-03 降到 3，SF-04 降到 2，本轮 SF-10 再降到 1。SF-01 的关闭只确认 source/projection contract 与临时 sandbox 五宿主 `init`，不升级为真实 host loader/invocation outcome；SF-02 的关闭只确认 promotion 字段形态、workflow gate、legacy 兼容和双 package parity，不把非空字段冒充可信 provenance 或充分 invalidation；SF-03 的关闭只确认 current source、配置模板与 focused contract 一致，不把它升级为真实 host/local config field outcome；SF-04 的关闭只确认 source-level classification/intake/lens/terminal-owner contract 与正负 fixture，不把 inline persona fallback 或静态 fixture 冒充真实 host dispatch/field outcome；SF-10 的关闭只确认用户地图、schema/producer/read-prune contract 与一致性测试对齐，不把文档一致性升级为真实用户阅读或跨宿主渲染 field outcome；SF-06 继续只把公共 suppress 规则与明确的 1000 行阈值认定为已证实冲突。`source_head` 保持原始冻结快照，SF-10 关闭结论来自 `current_head_at_calibration` 之上的未提交 working-tree docs/test source。

### 1.1 逐项校准清单

| Finding | 校准裁决 | 关键边界 |
| --- | --- | --- |
| SF-01 | **已关闭** | LFG/dogfood 的两个 load-bearing helper 已五宿主投射且保持 internal-only；spec-work 仍只是条件式命名参考 |
| SF-02 | **已关闭** | schema/template/guide/validator 同步；Full、Lightweight、Refresh Replace/Consolidate 共用 `--promotion`，legacy 默认模式不受影响 |
| SF-03 | **已关闭** | setup/template/test 已与 plan/brainstorm/ideate 三个 active consumer 对齐；setup 不获得 workflow invocation 或 rendering authority |
| SF-04 | **已关闭** | task pack 唯一分类、deterministic intake、source-plan authority、report-only mutation 与 terminal owner 已对齐；`Review complete`/`roster:full` 不提升 handoff/dispatch authority |
| SF-05 | **已关闭** | `autofix_class` 仅分类；唯一 apply authority 是 run-local `mutation_policy` |
| SF-06 | **成立，但已收窄** | 已证实冲突仅为 persona 的 1000 行机械阈值与 shared long-file suppress；其他 structural shape 未证实被压制 |
| SF-07 | **已关闭** | branch mutation、local fix、commit、landing 四类 authority 已分离；scope/`done` 不授权副作用 |
| SF-08 | **关闭裁决正确** | exact `spec-lfg` 名称、absolute artifact payload 和五宿主 source projection 有 focused contract；未验证真实 host menu invocation |
| SF-09 | **关闭裁决正确** | applicable/not_applicable、exact origin、effect/cleanup blocker 已闭合；未运行真实 browser field outcome |
| SF-10 | **已关闭** | 用户 map 已对齐 integrated true/false 条件、read/prune 生命周期、v2 direct evidence 字段和 v1 legacy graph compatibility；不再宣称自动 workflow consumer |
| SF-27 | **已关闭** | 当前聚焦 continuity matrix 覆盖 18/18 qualified；缺授权/缺能力均有 inline/serial fallback |

## 2. 当前 P1 行动队列

以下 finding 继承原编号；每项均保留 source refs、反证、可观察影响、closure 与 invalidation，便于后续 plan/work 直接消费。

### SF-06 — Shared subagent spine 仍可能压制 maintainability 的 1000 行 finding

- **edge/scope：** code-review orchestrator -> maintainability persona -> shared template。
- **claim 与证据：** `references/personas/maintainability-reviewer.md:12,43` 把“diff 使 touched file 跨过 1000 行”定义为 P1 / anchor 100；`references/subagent-template.md:136,141` 却要求在项目规则未显式规定长文件阈值时 suppress “file getting long”，且 false-positive catalog 优先于 persona advisory。已证实的直接冲突是 1000 行阈值；现有文本不足以证明 thin wrapper、duplicate canonical helper 等所有 structural finding 都会被同一规则压制。
- **counter-evidence：** template 对无具体 failure mode 的主观 style advice 做 suppress 是合理的；thin wrapper、duplicate canonical helper、dead code/type-hole 仍有独立 persona 定义，不能在没有 planted case 的情况下推断它们已被公共 spine 消除。
- **user impact：** always-on maintainability coverage 对“跨 1000 行”这一明确机械 finding 的声明高于实际可报告范围，该类结构回归可能被公共 spine 静默抹除。
- **root cause / posture：** false-positive catalog 没有给 persona-defined mechanical threshold 明确 precedence；**Repair** precedence，并加 planted cases。
- **closure：** 1k crossing 必须 keep；thin wrapper、duplicate canonical helper 分别验证不被误压制；纯主观 “file getting long / hard to read” 仍 suppress。
- **invalidation：** maintainability persona 的范围被正式缩为项目显式规则。
- **status：** OPEN；origin：本 plan。

## 3. 已关闭 P1 与反证

| Finding | 当前证据 | 反证检查 | 裁决 |
| --- | --- | --- | --- |
| SF-01 | `DELIVERED_INTERNAL_SKILLS` 包含 `spec-commit`、`spec-commit-push-pr`；projection plan 与临时 sandbox 五宿主 `init` 覆盖完整 package references；source frontmatter 维持 `user-invocable:false`，授权文本明确 invocation/tests/tool permission 不授予 commit/landing；LFG step 8 传递 entry-derived commit/landing facts并声明 `mode:pipeline` 不授权 | Cursor 会过滤不支持的 `user-invocable` 字段，因此 Cursor 只验证 internal description、governance/public-route 隐藏与 package 投射；未做真实 host loader/invocation | RESOLVED（source + focused contracts + sandbox init；claim ceiling=`projection_confirmed`） |
| SF-02 | 两套 schema/template/YAML guide/validator 保持 byte parity；Knowledge Harness consumer 与当前 deterministic floor 对齐；`--promotion` 要求非空顶层 `source_refs` array 与 `invalidation_condition` string；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 均调用同一 gate，Consolidate 的 destructive delete 明确后置；focused tests 覆盖四类共享 source parity、完整正例、缺失、空值、转义空白、常见 YAML parser 隐式非字符串 scalar、错误类型、普通及 YAML-equivalent 重复键、flow/block array 与 legacy default mode | validator 不检查引用是否真实可信，也不判断失效条件是否语义充分；未执行 fresh-session host load 或真实 compound field run | RESOLVED（source + 43-test focused contract；claim ceiling=`source-contract-confirmed`） |
| SF-03 | `spec-plan`、`spec-brainstorm`、`spec-ideate` 已有 active non-commented key consumer；Runtime Setup 与 config template 现在统一列为 active local rendering preferences，focused test 同时锁定 consumer、setup 与注释模板 | 示例仍保持注释，缺失/无效/注释值分别回退 `md`/`md`/`html`；setup 不调用 workflow，未执行真实 host/local config field run | RESOLVED（source + focused contract；claim ceiling=`source-contract-confirmed`） |
| SF-04 | `spec-doc-review` 优先识别 `type: task-pack`，malformed pack 不降级为普通 plan；task pack 强制 `report-only` / `task-pack-derived-artifact`；专属 lens 运行真实 validator receipt，并按 current source plan 审查 fidelity、dependency/wave、files/effects、verification、stop/review semantics 与 human/JSON parity；`spec-write-tasks` 的 copy-ready handoff 只在完整 zero-write JSON envelope、source-plan 对齐及 passed+valid+deterministic+正确 next action 同时成立时升级 `reviewed-existing` | validator 只证明 identity/freshness/structure，不返回 task-pack digest；`Review complete` 不是 execution handoff，`roster:full` 不授予 subagent dispatch；无授权时仍是 inline/serial、非 independent coverage，未执行真实 host/persona field run | RESOLVED（source + 53-test focused replay + 正负 handoff fixtures；claim ceiling=`source-contract-confirmed`） |
| SF-10 | 用户地图已与 schema/producer/read-prune 对齐：`workflow_integrated=true` 只对应 durable trigger 调用，false 不再被写成唯一 contract；v2 direct evidence 只列 `source_refs`、`checks_or_logs`、`repo_scope`、`limitations`、`redaction_status`；v1 `graph_evidence_used` 仅兼容 read/prune；文档显式说明不存在自动 workflow discovery/implicit consumer | 窄一致性 test 直接加载 schema 与用户地图并拒绝旧 false-only、旧 graph-shaped field、自动 spec-code-review reader 说法；未执行真实用户阅读、跨宿主文档渲染或 field outcome | RESOLVED（source/docs contract + RED/GREEN focused test；claim ceiling=`source-contract-confirmed`） |
| SF-05 | `action-class-rubric.md` 明确 classification is not permission，ordinary/default=`report-only`、explicit review-and-fix=`apply-fixes`、`mode:agent`=report-only；`mutation-authority-contracts` 通过 | `autofix_class` 仍保留优先级/风险信号，但没有任何 apply authority | RESOLVED（source + focused contract；未做 host behavior eval） |
| SF-07 | dogfood/polish 均解析 branch/local-fix/commit/landing 四类 authority；branch/PR target 只选 scope，`done` 不授权 commit；无授权时保留 verified uncommitted changes | Dogfood 的 authorized checkpoint 仍委托 `spec-commit`，但该 target 已由 SF-01 投射；真实 checkout/host run 未执行 | RESOLVED（source + focused contract；未做真实 checkout/host run） |
| SF-08 | `spec-brainstorm/references/handoff.md` 使用 `spec-lfg`，要求 exact available-skills resolution 与绝对 payload；`spec-brainstorm-clarification-contracts` 通过 | governance 的 canonical target 仍为 `spec-lfg`，无 `lfg` alias 依赖 | RESOLVED（source + focused contract；host menu invocation 未验证） |
| SF-09 | `spec-lfg/SKILL.md:72-105` 定义 applicable/not_applicable 与 caller-owned origin；`spec-test-browser` 返回 structured not-run/not-supported/cleanup status | `spec-test-browser-contracts`、LFG contract 与 five-host projection 通过；真实 browser/exact-origin capability 未运行 | RESOLVED（source + focused contract；无 field outcome） |
| SF-27 | 12 个原缺口 package 均有 package-local authorization/capability/fallback；6 个原合格 precedent 保持；matrix test 锁定 18 个唯一 package | inline fallback 不提供 independent/fresh-context/multi-agent evidence；sensitive content 与 tracked write 仍需额外 authority | RESOLVED（source + focused contract；无 fresh-source/host dispatch outcome） |

## 4. P2/P3 与新增关系的增量裁决

- 原 P2/P3 继续保留在 [07-17 report](../2026-07-17-skill-flow-system-audit/review-report.md)。本次未把未变 source 的低优先 finding 虚假地重报为新问题。
- `spec-brainstorm` 与 `spec-plan` 的 HTML rendering references 仍把 `spec-doc-review` 写成非 HTML consumer，和 current report-only contract 冲突；保持 P2。
- `spec-lfg/references/tracker-defer.md` 仍把 interactive code-review routing/filling 作为 consumer，并引用 session-temp review files；与 current code-review 的 no-ticket/no-blocking-prompt 边界不一致；保持 P2。
- 9 个新增 canonical pair 与 1 个已移除 pair 的完整理由见 [edge-ledger.md](evidence/edge-ledger.md)。新增 pair 不自动增加 public workflow 或 runtime authority。

## 5. 最高杠杆两项

1. **修复 maintainability 机械阈值 precedence（SF-06）**：让 persona-defined 1000 行机械阈值优先于 generic style suppress，并以 planted cases 保留主观长文件意见的 suppress。

## 6. 不做什么

- 不把 165 个 skill-name text pairs 当成 165 个 runtime invocation。
- 不把本次 lint、typecheck 或 focused test 当成 host loader、browser field outcome、CI/merge/release 证据。
- 不把 working-tree source/focused tests 冒充已提交 HEAD、fresh-source reviewer、host-loader 或 field outcome；SF-01 的关闭到 source/projection-contract 与 sandbox init 层，SF-02/SF-03/SF-04/SF-05/SF-07/SF-10/SF-27 的关闭到 source/docs-contract 层。
- 不修改 generated runtime mirror，也不从 Graphify/CodeGraph 的导航输出推导 confirmed relationship。
