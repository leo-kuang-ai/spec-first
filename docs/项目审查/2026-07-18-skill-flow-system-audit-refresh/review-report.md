---
title: spec-first Skill 关联关系系统审查当前快照刷新报告
doc_role: audit-report
review_date: 2026-07-18
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/review-report.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
working_tree_calibrated_at: 2026-07-19
working_tree_overlay: uncommitted-source-repair
limitations:
  - 当前批次是基于 2026-07-17 全量 source audit 的增量刷新；未变 source 继承其逐行证据。
  - 未授权 generic subagent dispatch；没有 fresh-source、host-loader 或 field-outcome claim。
  - mutation-authority 与 internal-helper delivery 修复尚未提交；source_head 不包含 working-tree overlay。
---

# spec-first Skill 关联关系系统审查当前快照刷新报告

## 1. 结论

当前 working-tree source 没有 P0，仍有 5 个 P1。六项原 P1 已关闭：

- **SF-01 已关闭：** `spec-commit` 与 `spec-commit-push-pr` 已作为 internal-only package 进入现有 delivery allowlist，五宿主 projection plan 与临时 sandbox `init` 均包含 caller 所需 package references；两 helper 的 invocation 不授予 commit/landing authority，LFG 由明确 entry admission 建立并传递可见 authority facts。
- **SF-05 已关闭：** code-review 的 `autofix_class` 仅分类 follow-up，不再授予 apply 权限；run-local `mutation_policy` 是唯一 mutation authority。
- **SF-07 已关闭：** dogfood/polish 已将 branch mutation、local fix、commit、landing 四类 authority 分离，scope 参数与 `done` 都不再隐式授权副作用。
- **SF-08 已关闭：** `spec-brainstorm` 已以治理名 `spec-lfg` 作为 autonomous handoff，并要求以宿主 available-skills 中的精确名调用、透传绝对 artifact path。
- **SF-09 已关闭：** `spec-lfg` 明确区分 `browser_applicability: applicable | not_applicable`；适用时由 caller 提供 exact loopback origin，非适用时保留 reason，失败/not-run/not-supported/cleanup 异常都阻断 shipping。
- **SF-27 已关闭：** 12 个原缺口 package 已补齐 package-local dispatch authorization/capability/fallback，原 6 个合格 package 继续满足基线，聚焦矩阵覆盖 18/18。

这些修复建立了 mutation authority 的共同地板，并闭合了 SF-01 收窄后的两个 load-bearing caller edge：`spec-lfg -> spec-commit-push-pr`、commit-authorized `spec-dogfood -> spec-commit`。`spec-work` 只在条件式 residual/landing 说明中引用这两个名称，Phase 4 的实际 contract 是“repo commit workflow / requested landing workflow”，不构成必须解析到 exact helper 的直接 caller edge。其余 3 个 internal-only record 继续保持 governance-only，不因本次修复被顺带交付。config、task-pack review、knowledge promotion、maintainability shared spine 与 artifact map 漂移仍会让错误 contract 进入正常用户路径。

本次在既有校准基础上关闭 SF-01、SF-05、SF-07、SF-27，将 P1 从 9 降到 5。SF-01 的关闭只确认 source/projection contract 与临时 sandbox 五宿主 `init`，不升级为真实 host loader/invocation outcome；SF-06 继续只把公共 suppress 规则与明确的 1000 行阈值认定为已证实冲突；SF-10 继续由 current producer contract 反证用户地图。`source_head` 保持修复前 HEAD，以上关闭结论来自未提交 working-tree source 与实际执行的 focused contracts。

### 1.1 逐项校准清单

| Finding | 校准裁决 | 关键边界 |
| --- | --- | --- |
| SF-01 | **已关闭** | LFG/dogfood 的两个 load-bearing helper 已五宿主投射且保持 internal-only；spec-work 仍只是条件式命名参考 |
| SF-02 | **成立** | knowledge prose gate 要求 `source_refs` / `invalidation_condition`，schema/template 未承载 |
| SF-03 | **成立** | plan/brainstorm consumer 实际读取 active output key，setup/template/test 仍标 reserved |
| SF-04 | **成立** | write-tasks 要求高风险 task pack 进入 doc-review，target 无 task-pack intake/lens/terminal owner |
| SF-05 | **已关闭** | `autofix_class` 仅分类；唯一 apply authority 是 run-local `mutation_policy` |
| SF-06 | **成立，但已收窄** | 已证实冲突仅为 persona 的 1000 行机械阈值与 shared long-file suppress；其他 structural shape 未证实被压制 |
| SF-07 | **已关闭** | branch mutation、local fix、commit、landing 四类 authority 已分离；scope/`done` 不授权副作用 |
| SF-08 | **关闭裁决正确** | exact `spec-lfg` 名称、absolute artifact payload 和五宿主 source projection 有 focused contract；未验证真实 host menu invocation |
| SF-09 | **关闭裁决正确** | applicable/not_applicable、exact origin、effect/cleanup blocker 已闭合；未运行真实 browser field outcome |
| SF-10 | **成立** | 用户 map 仍写 `workflow_integrated=false`，schema 与 durable-trigger producer contract 已为 true |
| SF-27 | **已关闭** | 当前聚焦 continuity matrix 覆盖 18/18 qualified；缺授权/缺能力均有 inline/serial fallback |

## 2. 当前 P1 行动队列

以下 finding 继承原编号；每项均保留 source refs、反证、可观察影响、closure 与 invalidation，便于后续 plan/work 直接消费。

### SF-02 — Knowledge promotion 必填 provenance / invalidation 仍缺失

- **edge/scope：** work/debug/review -> `spec-compound` -> `docs/solutions/**` -> later recall。
- **claim 与证据：** `skills/spec-compound/references/schema.yaml` 与 resolution template 仍未把 `source_refs`、`invalidation_condition` 作为新 promotion 的 required gate；这与角色契约的 durable knowledge 要求不一致。
- **counter-evidence：** `solved/verified`、grounding 与 refresh 路径仍在。
- **user impact：** 后续 workflow 可能召回无法回源、无法失效的 learning。
- **root cause / posture：** producer/schema 与 promotion exit 没有同一最小 contract；**Repair** existing schema/template/negative tests。
- **closure：** 缺任一字段的新 promotion 不得完成；refresh replacement 复用同一 contract。
- **invalidation：** owner 批准等价且可验证的 provenance/freshness contract。
- **status：** OPEN；origin：本 plan。

### SF-03 — Runtime setup 仍将 active rendering consumers 标为 reserved

- **edge/scope：** local config -> `spec-plan` / `spec-brainstorm`。
- **claim 与证据：** `skills/spec-plan/SKILL.md:99` 与 `skills/spec-brainstorm/SKILL.md:73` 读取 active `plan_output` / `brainstorm_output`，但 `skills/spec-runtime-setup/SKILL.md:126`、config template 与 `mcp-setup-config-consumers.test.js` 仍把二者写成 reserved。
- **counter-evidence：** key 缺失、非法或注释时安全回退；setup 不决定输出格式。
- **user impact：** 用户会得到与真实 consumer 相反的 config guidance。
- **root cause / posture：** consumer 与 setup catalog drift；**Extend** existing config consumer test，而非新 key/schema。
- **closure：** prose、template、focused test 都把 active/reserved 状态与真实 consumer 对齐。
- **invalidation：** 两个 workflow 删除这些 key，或迁移到另一个正式 key。
- **status：** OPEN；origin：本 plan。

### SF-04 — Task-pack 的 high-risk doc-review consumer 仍不具备 intake

- **edge/scope：** `spec-write-tasks -> spec-doc-review -> spec-work`。
- **claim 与证据：** `spec-doc-review` 当前分类只覆盖 requirements/plan/unified variants；`type: task-pack`、Task Card、wave、`stop_if`、pack/source-plan fidelity 未成为一等 intake/lens。`spec-write-tasks` 的 high-risk review handoff 因此没有唯一 consumer。
- **counter-evidence：** document reviewer 可以发现部分 prose/结构问题，且 task pack 仍是 derived。
- **user impact：** `reviewed-existing` 可来自错误 classification，不能证明 dependency、review gate 或 source-plan drift 语义成立。
- **root cause / posture：** producer 已声明 review，但 target 缺 contract；**Extend** task-pack intake/lens，或改用明确 owner。
- **closure：** 正负 handoff fixture 证明唯一分类、task-pack-specific coverage 与正确 terminal next owner。
- **invalidation：** write-tasks 移除此 handoff，并由另一个 consumer 完整承担。
- **status：** OPEN；origin：本 plan。

### SF-06 — Shared subagent spine 仍可能压制 maintainability 的 1000 行 finding

- **edge/scope：** code-review orchestrator -> maintainability persona -> shared template。
- **claim 与证据：** `references/personas/maintainability-reviewer.md:12,43` 把“diff 使 touched file 跨过 1000 行”定义为 P1 / anchor 100；`references/subagent-template.md:136,141` 却要求在项目规则未显式规定长文件阈值时 suppress “file getting long”，且 false-positive catalog 优先于 persona advisory。已证实的直接冲突是 1000 行阈值；现有文本不足以证明 thin wrapper、duplicate canonical helper 等所有 structural finding 都会被同一规则压制。
- **counter-evidence：** template 对无具体 failure mode 的主观 style advice 做 suppress 是合理的；thin wrapper、duplicate canonical helper、dead code/type-hole 仍有独立 persona 定义，不能在没有 planted case 的情况下推断它们已被公共 spine 消除。
- **user impact：** always-on maintainability coverage 对“跨 1000 行”这一明确机械 finding 的声明高于实际可报告范围，该类结构回归可能被公共 spine 静默抹除。
- **root cause / posture：** false-positive catalog 没有给 persona-defined mechanical threshold 明确 precedence；**Repair** precedence，并加 planted cases。
- **closure：** 1k crossing 必须 keep；thin wrapper、duplicate canonical helper 分别验证不被误压制；纯主观 “file getting long / hard to read” 仍 suppress。
- **invalidation：** maintainability persona 的范围被正式缩为项目显式规则。
- **status：** OPEN；origin：本 plan。

### SF-10 — 用户 artifact map 仍与 current producer contract 冲突

- **edge/scope：** artifact documentation -> user/agent discovery -> downstream consumer。
- **claim 与证据：** `docs/05-用户手册/04-workflows-artifacts-map.md:110` 仍写 `workflow_integrated=false`，而 `spec-work-run-artifact.schema.json:8-10` 与 `skills/spec-work/references/shipping-workflow.md:159` 已规定 durable trigger 时可以 integrated=true。
- **counter-evidence：** map 的 direct-evidence boundary、current plan paths 与 advisory wording 大部分正确。
- **user impact：** 用户可能把已接入的 producer 当作不可用，或错误理解 run artifact 生命周期。
- **root cause / posture：** current docs 未随 source-owned producer/consumer 迁移；**Repair** the affected map + narrow consistency test。
- **closure：** docs、schema、producer 与 consumer 对 integration flags/field set 没有相反说明。
- **invalidation：** v2 run artifact 被正式替换并完成 consumer migration。
- **status：** OPEN；origin：本 plan。

## 3. 已关闭 P1 与反证

| Finding | 当前证据 | 反证检查 | 裁决 |
| --- | --- | --- | --- |
| SF-01 | `DELIVERED_INTERNAL_SKILLS` 包含 `spec-commit`、`spec-commit-push-pr`；projection plan 与临时 sandbox 五宿主 `init` 覆盖完整 package references；source frontmatter 维持 `user-invocable:false`，授权文本明确 invocation/tests/tool permission 不授予 commit/landing；LFG step 8 传递 entry-derived commit/landing facts并声明 `mode:pipeline` 不授权 | Cursor 会过滤不支持的 `user-invocable` 字段，因此 Cursor 只验证 internal description、governance/public-route 隐藏与 package 投射；未做真实 host loader/invocation | RESOLVED（source + focused contracts + sandbox init；claim ceiling=`projection_confirmed`） |
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

1. **校准 producer/consumer contract（SF-02、SF-03、SF-04、SF-10）**：先恢复最小 required field、active config、task-pack intake、artifact-map consistency，不新增 registry、database 或 state machine。
2. **修复 maintainability 机械阈值 precedence（SF-06）**：让 persona-defined 1000 行机械阈值优先于 generic style suppress，并以 planted cases 保留主观长文件意见的 suppress。

## 6. 不做什么

- 不把 165 个 skill-name text pairs 当成 165 个 runtime invocation。
- 不把本次 lint、typecheck 或 focused test 当成 host loader、browser field outcome、CI/merge/release 证据。
- 不把 working-tree source/focused tests 冒充已提交 HEAD、fresh-source reviewer、host-loader 或 field outcome；SF-01 的关闭到 source/projection-contract 与 sandbox init 层，SF-05/SF-07/SF-27 的关闭到 source-contract 层。
- 不修改 generated runtime mirror，也不从 Graphify/CodeGraph 的导航输出推导 confirmed relationship。
