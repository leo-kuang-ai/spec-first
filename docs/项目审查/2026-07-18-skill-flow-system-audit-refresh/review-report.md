---
title: spec-first Skill 关联关系系统审查当前快照刷新报告
doc_role: audit-report
review_date: 2026-07-18
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/review-report.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: none
limitations:
  - 当前批次是基于 2026-07-17 全量 source audit 的增量刷新；未变 source 继承其逐行证据。
  - 未授权 generic subagent dispatch；没有 fresh-source、host-loader 或 field-outcome claim。
  - source_head 是冻结快照；current_head_at_calibration 已包含 P0-P3 修复，校准时没有 working-tree overlay。
  - committed P2 pair delta 为 +2/-3；P3 pair delta 为 0/0。
---

# spec-first Skill 关联关系系统审查当前快照刷新报告

## 1. 结论

当前 working-tree source 的 P0/P1/P2/P3 均为 0。十一项原 P1 已关闭：

- **SF-01 已关闭：** `spec-commit`、`spec-commit-push-pr` 与 `spec-proof` 已作为 internal-only package 进入现有 delivery allowlist，五宿主 projection plan 与临时 sandbox `init` 均包含 caller 所需完整 package references；9 条 load-bearing caller edge 均可解析。严格内部 commit helpers 保持 `user-invocable:false`，`spec-proof` 只允许 source 声明的显式点名调用且不进入公共 route/menu；helper invocation 不授予 mutation、commit 或 landing authority。
- **SF-02 已关闭：** `spec-compound` 与 `spec-compound-refresh` 现在共享 `source_refs` / `invalidation_condition` promotion schema、模板、指南和字节一致 validator；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 都运行 `--promotion`，缺失、空值、错误类型或重复字段会确定性失败，默认 parser-safety 模式继续兼容 untouched legacy learning。
- **SF-03 已关闭：** Runtime Setup、config template 与 focused test 现按真实 consumer 将 `plan_output`、`brainstorm_output`、`ideate_output` 统一为 active local rendering preferences；注释示例不激活配置，默认值与 pipeline override 继续由三个 consumer 自治，setup 不调用这些 workflow。
- **SF-04 已关闭：** `spec-doc-review` 现将 `type: task-pack` 优先分类为 derived/report-only 输入，先运行真实 `spec-first tasks validate ... --json` 建立 identity/freshness/structure 地板，再以 current source plan 为 scope/acceptance/architecture/non-goals/verification 权威审查 task quality；`task_pack_outcome` 明确区分 execution handoff、pack regeneration、plan revision 与 incomplete stop。
- **SF-06 已关闭：** maintainability persona 的 1000 行 threshold 现明确为 persona-owned mechanical rule；shared template 先保留被直接证据证明的 persona severity/confidence，既不让 false-positive catalog suppress，也不让 generic advisory 规则把 P1/anchor-100 降成 anchor-50，再对剩余主观 long-file opinion 保持 FP-over-advisory suppression。四个 planted cases 分别覆盖 1k crossing、thin wrapper、duplicate canonical helper 与无阈值/无 failure mode 的 subjective long-file concern。
- **SF-10 已关闭：** 用户 artifact map 现与 schema 的 `workflow_integrated` 条件、durable-trigger producer、v2 `direct_evidence_used` 字段、v1 `graph_evidence_used` read/prune 兼容和 source-owned reader 边界一致；文档不再把 `workflow_integrated=false` 写成唯一 current contract，也不再声称 workflow 自动发现或隐式消费 run artifact。
- **SF-05 已关闭：** code-review 的 `autofix_class` 仅分类 follow-up，不再授予 apply 权限；run-local `mutation_policy` 是唯一 mutation authority。
- **SF-07 已关闭：** dogfood/polish 已将 branch mutation、local fix、commit、landing 四类 authority 分离，scope 参数与 `done` 都不再隐式授权副作用。
- **SF-08 已关闭：** `spec-brainstorm` 已以治理名 `spec-lfg` 作为 autonomous handoff，并要求以宿主 available-skills 中的精确名调用、透传绝对 artifact path。
- **SF-09 已关闭：** `spec-lfg` 明确区分 `browser_applicability: applicable | not_applicable`；适用时由 caller 提供 exact loopback origin，非适用时保留 reason，失败/not-run/not-supported/cleanup 异常都阻断 shipping。
- **SF-27 已关闭：** 12 个原缺口 package 已补齐 package-local dispatch authorization/capability/fallback，原 6 个合格 package 继续满足基线，聚焦矩阵覆盖 18/18；对抗性复核额外发现并移除 `spec-code-review` Stage 1c 之前的 trivial-PR subagent dispatch，改为 orchestrator inline conservative judgment，并确认 repo-profile dispatch 位于 gate 之后。
- **SF-11 已关闭（原 P2）：** 三份 HTML renderer 现在都把 `spec-doc-review` 声明为 report-only HTML consumer，并显式锁定 `mutation_policy: report-only`、`mutation_reason: html-artifact` 与 `fixes_applied: 0`；Brainstorm 的 requirements review 对 Markdown/HTML 都可见，HTML 传递 `mutation:report-only` 且保持字节不变；shared consumer prose 按 artifact kind 限定 `spec-work`，requirements-only Brainstorm/Ideate HTML 不再形成 M-013 direct-work edge。
- **SF-12 已关闭（原 P2）：** Universal Brainstorm 与 Universal Plan 的 Proof-only 分支都先物化 run-local Markdown、确认文件存在且非空，再把具体 path/title/identity 交给 `spec-proof`；Save+Proof 发布同一保存文件，Proof 失败仍保留并报告本地路径。
- **SF-18 已关闭（原 P2）：** `spec-work` 的共置 tracker reference 是唯一规范 owner；LFG 只保留五宿主所需的字节一致 package-local projection，source parity 与 projection contract 禁止旧 code-review filing owner、猜测 temp path 和 session-temp durable link。
- **SF-13 已关闭（原 P2）：** Universal Ideate 不直跳 `spec-plan`；它只进入 `spec-brainstorm`，用户在 Brainstorm wrap-up 显式选择 **Create a plan** 后才进入 universal/knowledge-work plan。Universal plan 默认不提供 `spec-work`。
- **SF-14 已关闭（原 P2）：** App audit 不再声明 active `spec-code-review` consumer/caller；`from:code-review` 与 `code_review_handoff` 仅保留为旧 artifact 的休眠兼容字段。
- **SF-15 已关闭（原 P2）：** Optimize 删除没有 trigger/payload/intake 的 `spec-work` 纸面 consumer。
- **SF-16 已关闭（原 P2）：** Session historian 只写 caller 提供的 run-local scratch path；写成功返 path，失败返完整 inline prose，tracked/product write 保持禁止。
- **SF-17 已关闭（原 P2）：** Worktree helper 只声明 Dogfood 当前 caller；未来 caller 必须先在 public owner 建立 forward edge。
- **SF-19 已关闭（原 P2）：** Figma mutating worker 返回 changed paths、verification、不可重建视觉观察与 remaining blockers，并重复禁止 stage/commit/push/PR/lifecycle/generated-runtime-as-source。
- **SF-20 已关闭（原 P2）：** Code Review 在 `NO-CACHE` 或 helper failure 时 fresh derive profile 且跳过 `put`，不再退化为 no-profile。
- **SF-21 已关闭（原 P2）：** Maintainability anchor 50 一律 suppress；有直接客观证据才提升到 anchor 75，不能通过 P0/P1 relabel 绕 gate。
- **SF-22 已关闭（原 P2）：** Riffrec analysis 是 analyzer canonical owner，Sweep 是 byte-identical package-local projection，source 与五宿主 projection parity 均有合同。
- **SF-23 已关闭（原 P2）：** `spec-resolve-pr-feedback` 与 `spec-test-xcode` 成为用户显式 standalone skill；PR feedback 的 local fix、commit、push、reply、thread resolve 分别准入，Xcode 删除虚假 Code Review auto-caller。

这些修复建立了 mutation authority 的共同地板，并闭合了 SF-01 的 9 条 load-bearing caller edge。P2 没有新增状态机或中心化 coordinator：虚假 consumer/reverse edge 被删除，已有 worker/cache/confidence/analyzer owner 在原 owner 内扩展；对抗性复核还将 SF-11 遗留的 requirements-only direct-work wording 收窄为 artifact-kind conditional。最后 3 项 P3 同样只校准现有 owner：Deployment prompt 镜像 orchestrator gate，validator template 接受 optional detail context，LFG 如实描述 Simplify 的 scoped verification。当前 P0/P1/P2/P3 队列均已清空。

此前校准已清空 P0-P2；`current_head_at_calibration` 已提交 SF-24/SF-25/SF-26 修复，且没有重新打开既有 finding。P3 的关闭证据止于 source contract、RED/GREEN focused tests 与完整回归，不把 prompt/contract 验证升级为真实 deployment、validator recall/precision、host-loader 或 field outcome。`source_head` 保持原始冻结快照；已提交 P2 pair delta 为 `+2/-3`，P3 pair delta 为 `0/0`。

### 1.1 逐项校准清单

| Finding | 校准裁决 | 关键边界 |
| --- | --- | --- |
| SF-01 | **已关闭** | LFG/dogfood/Proof 的 9 条 load-bearing caller edge 已五宿主投射且保持 internal-only；spec-work 仍只是条件式命名参考 |
| SF-02 | **已关闭** | schema/template/guide/validator 同步；Full、Lightweight、Refresh Replace/Consolidate 共用 `--promotion`，legacy 默认模式不受影响 |
| SF-03 | **已关闭** | setup/template/test 已与 plan/brainstorm/ideate 三个 active consumer 对齐；setup 不获得 workflow invocation 或 rendering authority |
| SF-04 | **已关闭** | task pack 唯一分类、deterministic intake、source-plan authority、report-only mutation 与 terminal owner 已对齐；`Review complete`/`roster:full` 不提升 handoff/dispatch authority |
| SF-05 | **已关闭** | `autofix_class` 仅分类；唯一 apply authority 是 run-local `mutation_policy` |
| SF-06 | **已关闭** | persona-owned 1000-line mechanical threshold 明确优先于 subjective long-file suppress 与 generic advisory 降级；thin wrapper/duplicate helper 正例与 subjective opinion 负例均有 planted case |
| SF-07 | **已关闭** | branch mutation、local fix、commit、landing 四类 authority 已分离；scope/`done` 不授权副作用 |
| SF-08 | **关闭裁决正确** | exact `spec-lfg` 名称、absolute artifact payload 和五宿主 source projection 有 focused contract；未验证真实 host menu invocation |
| SF-09 | **关闭裁决正确** | applicable/not_applicable、exact origin、effect/cleanup blocker 已闭合；未运行真实 browser field outcome |
| SF-10 | **已关闭** | 用户 map 已对齐 integrated true/false 条件、read/prune 生命周期、v2 direct evidence 字段和 v1 legacy graph compatibility；不再宣称自动 workflow consumer |
| SF-11 | **已关闭（原 P2）** | 三份 renderer、Brainstorm 菜单与 current doc-review HTML report-only contract 对齐；requirements-only Brainstorm/Ideate 不直达 Work，不授予 HTML mutation authority |
| SF-12 | **已关闭（原 P2）** | Proof-only 先物化并验证 run-local Markdown，再传具体 source path；Save+Proof 发布同一保存文件，失败保留路径 |
| SF-13 | **已关闭（原 P2）** | Ideate 只 handoff 到 Brainstorm；Plan 只能由用户在 Brainstorm wrap-up 显式选择，Universal plan 默认不进入 Work |
| SF-18 | **已关闭（原 P2）** | Work 是规范 owner；LFG 是字节一致 package-local projection，source 与五宿主投射 parity 均被测试锁定 |
| SF-14 | **已关闭（原 P2）** | App audit reverse integration 降为明确休眠兼容；当前无 Code Review caller/intake；负向合同读取真实非空 consumer section |
| SF-15 | **已关闭（原 P2）** | Optimize 删除无真实 intake 的 Work consumer |
| SF-16 | **已关闭（原 P2）** | Session historian scratch write/path return/inline fallback 与 caller 一致，禁止 tracked/product write |
| SF-17 | **已关闭（原 P2）** | Worktree 只保留 Dogfood confirmed caller；future caller 必须先建 forward edge |
| SF-19 | **已关闭（原 P2）** | Figma worker evidence packet 与 mutation/commit/landing/lifecycle/source-runtime 边界完整 |
| SF-20 | **已关闭（原 P2）** | NO-CACHE/helper failure 均 fresh derive，cache 不可用不再移除 shared profile input |
| SF-21 | **已关闭（原 P2）** | anchor 50 suppress；直接证据提升到 75，否则不产出 |
| SF-22 | **已关闭（原 P2）** | Riffrec canonical owner + Sweep byte-identical projection + source/five-host parity |
| SF-23 | **已关闭（原 P2）** | 两个显式 user-only standalone skill 五宿主投射；PR feedback 五类 exit authority 分离；Cursor frontmatter lossy projection 按宿主语义验证 |
| SF-24 | **已关闭（原 P3）** | Deployment worker 只镜像 risky migration-artifact gate，不能 self-invoke 或用普通 data-processing 风险扩张 activation |
| SF-25 | **已关闭（原 P3）** | `why_it_matters` 是 available-when-present 的可选 validator context；缺失时继续从 diff/cited code 验证 |
| SF-26 | **已关闭（原 P3）** | Simplify 默认 scoped tests + 全项目 typecheck/lint，必要时扩大；final verification 继续拥有完整 closeout truth |
| SF-27 | **已关闭** | 当前聚焦 continuity matrix 覆盖 18/18 qualified；trivial-PR pre-gate 判断已 inline，缺授权/缺能力均有 inline/serial fallback |

## 2. 当前 P1 行动队列

无。P0-P3 均已关闭。

## 3. 已关闭 P1 与反证

| Finding | 当前证据 | 反证检查 | 裁决 |
| --- | --- | --- | --- |
| SF-01 | `skills-governance.json` 以 `entry_surface: internal_only` 与逐宿主 `host_delivery: internal` 作为 internal delivery 唯一真源；`plugin-governance.js` 直接消费治理记录，不维护第二份 helper 名单。projection plan 与临时 sandbox 五宿主 `init` 覆盖 5 个 delivered internal package 的完整 references；caller-edge contract 覆盖 LFG/dogfood 与 5 条 Proof handoff。commit helpers 保持 `user-invocable:false`，Proof 保留显式点名入口但不进入 public route | Cursor 会过滤不支持的 `user-invocable` 字段，因此 Cursor 对严格内部 helper 只验证 internal description、governance/public-route 隐藏与 package 投射；未做真实 host loader/invocation | RESOLVED（source + focused contracts + sandbox init；claim ceiling=`projection_confirmed`） |
| SF-02 | 两套 schema/template/YAML guide/validator 保持 byte parity；Knowledge Harness consumer 与当前 deterministic floor 对齐；`--promotion` 要求非空顶层 `source_refs` array 与 `invalidation_condition` string；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 均调用同一 gate，Consolidate 的 destructive delete 明确后置；focused tests 覆盖四类共享 source parity、完整正例、缺失、空值、转义空白、常见 YAML parser 隐式非字符串 scalar、错误类型、普通及 YAML-equivalent 重复键、flow/block array 与 legacy default mode | validator 不检查引用是否真实可信，也不判断失效条件是否语义充分；未执行 fresh-session host load 或真实 compound field run | RESOLVED（source + 43-test focused contract；claim ceiling=`source-contract-confirmed`） |
| SF-03 | `spec-plan`、`spec-brainstorm`、`spec-ideate` 已有 active non-commented key consumer；Runtime Setup 与 config template 现在统一列为 active local rendering preferences，focused test 同时锁定 consumer、setup 与注释模板 | 示例仍保持注释，缺失/无效/注释值分别回退 `md`/`md`/`html`；setup 不调用 workflow，未执行真实 host/local config field run | RESOLVED（source + focused contract；claim ceiling=`source-contract-confirmed`） |
| SF-04 | `spec-doc-review` 优先识别 `type: task-pack`，malformed pack 不降级为普通 plan；task pack 强制 `report-only` / `task-pack-derived-artifact`；专属 lens 运行真实 validator receipt，并按 current source plan 审查 fidelity、dependency/wave、files/effects、verification、stop/review semantics 与 human/JSON parity；`spec-write-tasks` 的 copy-ready handoff 只在完整 zero-write JSON envelope、source-plan 对齐及 passed+valid+deterministic+正确 next action 同时成立时升级 `reviewed-existing` | validator 只证明 identity/freshness/structure，不返回 task-pack digest；`Review complete` 不是 execution handoff，`roster:full` 不授予 subagent dispatch；无授权时仍是 inline/serial、非 independent coverage，未执行真实 host/persona field run | RESOLVED（source + 53-test focused replay + 正负 handoff fixtures；claim ceiling=`source-contract-confirmed`） |
| SF-06 | maintainability persona 将 1000-line crossing 固定为 persona-owned mechanical threshold；shared template 保留有直接 diff 证据的 persona severity/confidence，避免 false-positive suppress 与 advisory anchor-50 降级，再 suppress 剩余 subjective long-file shape；capability fixture 覆盖 crossing、thin wrapper、duplicate helper 与 subjective negative case | subjective “file getting long / hard to read” 在无项目规则、无 threshold crossing、无 concrete failure mode 时仍须 suppress；未执行 fresh-session persona dispatch | RESOLVED（source + planted cases + focused contract；claim ceiling=`source-contract-confirmed`） |
| SF-10 | 用户地图已与 schema/producer/read-prune 对齐：`workflow_integrated=true` 只对应 durable trigger 调用，false 不再被写成唯一 contract；v2 direct evidence 只列 `source_refs`、`checks_or_logs`、`repo_scope`、`limitations`、`redaction_status`；v1 `graph_evidence_used` 仅兼容 read/prune；文档显式说明不存在自动 workflow discovery/implicit consumer | 窄一致性 test 直接加载 schema 与用户地图并拒绝旧 false-only、旧 graph-shaped field、自动 spec-code-review reader 说法；未执行真实用户阅读、跨宿主文档渲染或 field outcome | RESOLVED（source/docs contract + RED/GREEN focused test；claim ceiling=`source-contract-confirmed`） |
| SF-05 | `action-class-rubric.md` 明确 classification is not permission，ordinary/default=`report-only`、explicit review-and-fix=`apply-fixes`、`mode:agent`=report-only；`mutation-authority-contracts` 通过 | `autofix_class` 仍保留优先级/风险信号，但没有任何 apply authority | RESOLVED（source + focused contract；未做 host behavior eval） |
| SF-07 | dogfood/polish 均解析 branch/local-fix/commit/landing 四类 authority；branch/PR target 只选 scope，`done` 不授权 commit；无授权时保留 verified uncommitted changes | Dogfood 的 authorized checkpoint 仍委托 `spec-commit`，但该 target 已由 SF-01 投射；真实 checkout/host run 未执行 | RESOLVED（source + focused contract；未做真实 checkout/host run） |
| SF-08 | `spec-brainstorm/references/handoff.md` 使用 `spec-lfg`，要求 exact available-skills resolution 与绝对 payload；`spec-brainstorm-clarification-contracts` 通过 | governance 的 canonical target 仍为 `spec-lfg`，无 `lfg` alias 依赖 | RESOLVED（source + focused contract；host menu invocation 未验证） |
| SF-09 | `spec-lfg/SKILL.md:72-105` 定义 applicable/not_applicable 与 caller-owned origin；`spec-test-browser` 返回 structured not-run/not-supported/cleanup status | `spec-test-browser-contracts`、LFG contract 与 five-host projection 通过；真实 browser/exact-origin capability 未运行 | RESOLVED（source + focused contract；无 field outcome） |
| SF-27 | 12 个原缺口 package 均有 package-local authorization/capability/fallback；6 个原合格 precedent 保持；matrix test 锁定 18 个唯一 package；code-review contract 额外锁定 trivial-PR 判断 inline 且 repo-profile dispatch 位于 Stage 1c 之后 | matrix 是 source-contract guard，不是 18 个真实 host dispatch fixture；inline fallback 不提供 independent/fresh-context/multi-agent evidence，sensitive content 与 tracked write 仍需额外 authority | RESOLVED（source + focused contract + inline first-dispatch order audit；无 fresh-source/host dispatch outcome） |

## 4. P2/P3 与新增关系的增量裁决

- 原 P2 与原 P3 SF-24/SF-25/SF-26 均已关闭；07-17 report 继续作为原始 finding provenance，不代表 current backlog。
- **SF-11 已关闭：** 三份 renderer 均承认 report-only `spec-doc-review` consumer；Brainstorm 不再隐藏 HTML requirements review；HTML review 明确为 byte-preserving、`fixes_applied: 0`，并阻断所有 Markdown mutation path；shared renderer 将 `spec-work` 限定为 implementation-ready software plan consumer，requirements-only Brainstorm/Ideate HTML 不形成 direct-work edge。RED/GREEN 合同同时覆盖 shared renderer、Brainstorm handoff、doc-review mutation owner 与 Plan 既有正确 handoff。
- **SF-12 已关闭：** Universal Brainstorm/Plan 的 Proof-only 路径在 publish 前物化 existing local Markdown，并在 publish 失败时保留具体路径；Save+Proof 不再生成第二份可能漂移的内容。
- **SF-18 已关闭：** Work/LFG tracker reference 当前 source 字节一致，Work 明确拥有规范合同；五宿主 projection plan 同时验证两份 runtime copy 仍相等，且正文不再让 `spec-code-review` filing 或将 session-temp path 写入 durable ticket。
- **SF-13 已关闭：** Universal Ideate 的下一跳仍只有 Brainstorm；Brainstorm 自己的 terminal menu 保留用户显式 Plan 选择，且 Universal Plan 不冒充 software execution chain。
- **SF-14/SF-15/SF-17 已关闭：** 删除虚假 App-audit/Code Review active edge、Optimize/Work consumer 与 Worktree/Work-Code Review reverse caller；兼容字段和 future-caller 规则均明确不建立 active relation。
- **SF-16/SF-19 已关闭：** 两个 worker 都返回 caller 可消费的 authoritative path/evidence packet，并保持 tracked write、stage、commit、push、PR、lifecycle 与 generated-runtime-as-source 禁止边界。
- **SF-20/SF-21 已关闭：** Cache shared protocol 与 Code Review caller 同步；Maintainability producer 不再产生 synthesis 必然丢弃的 P1/anchor-50 finding。
- **SF-22 已关闭：** analyzer owner/projection/parity 三层同源合同建立。
- **SF-23 已关闭：** 两个 orphan helper 进入 user-only standalone route；PR feedback 先建立五类独立 exit authority，Xcode 不再声称 Code Review auto-caller；五宿主 projection test 按 Cursor 不支持 `allowed-tools` 的 host-lossy frontmatter 合同校准，而不是伪造字段 parity。
- **SF-24 已关闭：** Deployment prompt 只允许 orchestrator 在 risky migration/schema artifact gate 成立时调用，并显式拒绝 self-invocation 与普通 data-processing 扩张。
- **SF-25 已关闭：** Validator variable contract 与 Stage 5b 对齐；`why_it_matters` 缺失不再阻断 validator 依据 diff/cited code 独立复核。
- **SF-26 已关闭：** LFG 将 Simplify verification 校准为 full-project typecheck/lint + default changed-path tests + risk-based broadening，最终 verification gate 保持权威。
- 已提交 P2 的 `+2/-3` canonical pair 变化、P3 的 `0/0` pair 结论与 M-013 artifact-kind conditional 的完整理由见 [edge-ledger.md](evidence/edge-ledger.md)。文本 mention 或新增 route 不自动增加 workflow mutation/runtime authority。

## 5. 后续最高杠杆项

无剩余 Skill-flow finding。Release-governance 的 public workflow summary coverage 缺口继续由独立 release continuity owner 处理，不在本审查中重编号或降级为 P3。

## 6. 不做什么

- 不把 165 个 skill-name text pairs 当成 165 个 runtime invocation。
- 不把本次 lint、typecheck 或 focused test 当成 host loader、browser field outcome、CI/merge/release 证据。
- 不把 working-tree source/focused tests 冒充已提交 HEAD、fresh-source reviewer、host-loader 或 field outcome；SF-01 的关闭到 source/projection-contract 与 sandbox init 层，SF-02/SF-03/SF-04/SF-05/SF-06/SF-07/SF-10/SF-11/SF-12/SF-13/SF-18/SF-27 的关闭到 source/docs-contract 或 projection-parity 层。
- 不修改 generated runtime mirror，也不从 Graphify/CodeGraph 的导航输出推导 confirmed relationship。
