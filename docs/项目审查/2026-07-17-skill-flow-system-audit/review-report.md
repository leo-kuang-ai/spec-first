---
title: spec-first Skill 关联关系系统审查报告
doc_role: audit-report
review_date: 2026-07-17
status: review-complete
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
source_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
---

# spec-first Skill 关联关系系统审查报告

## 1. 结论

**Skill 之间的关联关系不是全部正确。**

主链的基本 ownership 已经成立：`using-spec-first` 单入口、requirements-only unified plan 原地深化、task pack 仅作 derived index、`spec-work` 持有执行与 closeout、`spec-code-review mode:agent` report-only、provider facts 保持 advisory、plan lifecycle 与 run evidence 不反向覆盖 source plan。这部分可以继续 Adopt。

但全量逐文件复核与独立 fresh-source 场景复核后，确认存在 11 个 P1：

1. 7 个 internal-only helper 中只有 `spec-worktree` 被五宿主投射；多个 public caller 指向运行时不可达 target。
2. `spec-compound` 的 knowledge-promotion gate 回归，新的 durable learning 不再要求 `invalidation_condition` / `source_refs`。
3. Runtime Setup 把 `spec-plan` / `spec-brainstorm` 已消费的 output config 错标为 reserved，并由测试固化。
4. 高风险 task pack 被交给 `spec-doc-review`，但 consumer 没有 task-pack intake、分类或专属审查合同。
5. `spec-code-review` 对默认模式和显式 review-and-fix 的 mutation authority 存在三套相互冲突的说法。
6. `spec-code-review` 的共享 subagent template 会压掉 always-on maintainability persona 的核心职责。
7. `spec-dogfood` / `spec-polish` 把 workflow invocation、branch mutation、local fix 与 commit authorization 混为一体。
8. `spec-brainstorm` 的 autonomous handoff 调用不存在的 `lfg` identifier；真实入口是 `spec-lfg`。
9. `spec-lfg` 要求 browser verification 可返回 N/A，但 `spec-test-browser` 只定义 PASS / FAIL / PARTIAL。
10. current contract / 用户地图仍保留旧 brainstorm canonical path、旧 run-artifact integration 状态与旧字段集合。
11. 18 个会派发 generic worker 的 package 中只有 6 个完整继承显式 dispatch authorization；12 个缺口里包含 mutating resolver、experiment worker、learning replacement 与 scheduled sensitive-feedback 分析。

没有 P0。上述问题不会让全部研发主链不可用，但会在正常路径上造成 invocation 失败、未授权/不可审计的 worker dispatch、review gate 失真、非授权 commit、durable knowledge 失效边界丢失或 consumer 读取错误事实，因此不能以“测试全绿”判定关系正确。

## 2. 覆盖与证据等级

| 分母 | 覆盖结果 |
| --- | --- |
| Governed nodes | 35/35：17 workflow command、11 standalone skill、7 internal-only helper |
| Skill source files | 275/275：全部 `SKILL.md + references/**`，265 Markdown、7 YAML、3 JSON，共 37,412 行 |
| 分区逐文件台账 | planning 102/102、execution 85/85、sidepaths 88/88；三者 missing/extra/duplicate 均为 0 |
| Canonical cross-skill mention pairs | 157/157；使用 skill-name token boundary 生成分母，逐对区分真实 edge、reverse declaration、near-neighbor/negative boundary、informational mention 与 drift；114 对当前确认，43 对至少一项关系语义漂移 |
| Direct supporting surfaces | 76/76：governance、workflow/knowledge/verification contracts、producer/consumer、五宿主 projection、用户地图和 focused tests 逐文件登记 |
| Dispatch authority matrix | 35/35 package：18 个会 generic dispatch，6 个完整继承 gate/fallback，12 个存在缺口；17 个不直接 generic dispatch |
| Deterministic validation | skill-entrypoint lint 309 files、typecheck 180 files、25 focused suites / 223 tests、`test:eval-fixtures` 6 suites / 78 tests全部通过 |

Claim ceiling：

- current source + consumer 可以确认关系存在或漂移；
- focused tests 可以确认被测试的机械断言；
- fresh-source 22 文件六场景只确认隔离输入下的 source-level semantic judgment；
- Graphify / CodeGraph 仅作为 `provider_untrusted` 导航；
- 本报告不证明真实宿主 loader、真实用户 outcome、CI/merge/release 或外部服务可用性。

## 3. 主链裁决

### 3.1 入口与主 artifact 链

**Adopt with repairs。**

- `using-spec-first` 一次选择一个 public entrypoint 后让出控制，没有把主链硬编码成强状态机。
- 但 route selection 的 dispatch authority 没有被 12 个 target package 完整消费；入口选对不等于内部 generic worker 已获授权，见 SF-27。
- 新 `spec-brainstorm` 写 requirements-only unified plan，`spec-plan` 原地增加 HOW；Product Contract 与 Planning Contract 的 authority 分层成立。
- `spec-write-tasks` 只派生 task pack，`spec-work` 会重放 source plan readiness/hash/scope；task pack 不持有 product scope 或 lifecycle。
- 需要修复的不是新增 orchestration layer，而是 `brainstorm -> spec-lfg` 名称、`task pack -> doc review` consumer 和用户 artifact map。

### 3.2 Work / Debug / Review / Closeout

**Adopt with authority repairs。**

- `spec-work` 与 `spec-debug` 的 actual-tree、verification、residual、lifecycle、commit、landing 分层清楚。
- `spec-code-review mode:agent` 始终 report-only，caller-owned fix 关系成立。
- 但 ordinary review 的 mutation policy 在 main/reference/schema 中不一致；maintainability persona 又被共享模板抵消，不能声称 review roster 的语义 coverage 全部成立。

### 3.3 Internal helper 与 runtime delivery

**Concern。**

- Governance 将 7 个 helper 全部声明为五宿主 `internal` delivery。
- `plugin-governance.js` 的 allowlist 只包含 `spec-worktree`；五宿主 projection plan 也都只写入它。
- `spec-lfg -> spec-test-browser/spec-commit-push-pr`、`spec-dogfood -> spec-commit`、多个 producer -> `spec-proof` 是真实 caller edge，却没有 runtime target。
- `spec-resolve-pr-feedback` 没有 caller；`spec-test-xcode` 的 reverse caller 声明已经过时。

### 3.4 Runtime / provider / config

**Adopt advisory boundary，修复 consumer registry。**

- Runtime Setup、Graphify、CodeGraph 只提供 readiness/navigation facts，不拥有 scope、root cause 或 completion authority。
- 当前主要错误不是 provider authority，而是 setup-owned config catalog 与真实 `spec-plan` / `spec-brainstorm` consumer 反向。

### 3.5 Review / Work -> Knowledge

**Concern。**

- `spec-compound` 仍要求 solved/verified，并有 claim grounding 与 refresh 路径。
- 但 canonical schema/template 不再保存 recall 所需的 provenance 与 invalidation boundary；这使 knowledge-promotion exit gate 从 loud convention 退化为缺失约定。

## 4. P1 Findings

方案默认把 P1 行动队列限制为 10 项；SF-27 由独立 fresh-source 场景触发，并经 35/35 package 对账确认涉及 authority-changing/mutating worker 风险，因此按风险地板保留为第 11 项，但仍并入同一个 hard-exit authority 工作包，不增加第四个下一阶段动作。

### SF-01 — Internal helper governance 与五宿主 runtime delivery 断链

| 字段 | 内容 |
| --- | --- |
| edge/scope | public caller -> 7 internal-only helpers -> host projection |
| claim | Governance 声明 7 个 helper 在五宿主均为 `internal`，但 filtered asset set 只交付 `spec-worktree`。 |
| evidence | `src/cli/plugin-governance.js:14-16,75-81`；`skills-governance.json` 的 7 个 internal records；五宿主 `planBundledAssetSync` 均只有 `spec-worktree/SKILL.md` operation。 |
| direct callers | `spec-lfg -> spec-test-browser/spec-commit-push-pr`；`spec-dogfood -> spec-commit/spec-worktree`；brainstorm/ideate/plan/explain/pov -> `spec-proof`。 |
| counter-evidence | `spec-worktree` 可达；部分 caller 有 inline/API fallback；source checkout 中 helper 文件存在。 |
| user impact | 新 init/runtime projection 下 public workflow 可能在调用时找不到 target；LFG 的 browser/PR tail 与 Proof publish 是正常路径，不是只影响维护者的死代码。 |
| posture | Extend 现有 governance/projection；每个 helper 明确选择“交付、内联替代、或退役”，不再保留 delivery 声明与实现 allowlist 两套真相。 |
| closure | 7 个 helper 的 caller-target reachability test 覆盖五宿主；所有 caller 要么 target 可发现，要么有显式 fallback/terminal return；孤儿 helper 被退役或绑定 owner。 |
| invalidation | 若宿主提供同名、等价且可验证的 native primitive，并且 caller source 显式绑定该能力，可重新裁决是否需要投射。 |

### SF-02 — Knowledge promotion required fields 回归

| 字段 | 内容 |
| --- | --- |
| edge/scope | work/debug/review -> `spec-compound` -> `docs/solutions/**` -> later recall |
| claim | 新 promotion 不再要求 `invalidation_condition` 与 `source_refs`。 |
| evidence | `docs/10-prompt/结构化项目角色契约.md:61,69`；`docs/contracts/knowledge/knowledge-harness.md:50-69`；`skills/spec-compound/references/schema.yaml:37-231`；`assets/resolution-template.md:13-94`。 |
| corpus fact | 32 篇 solution 中仅 9 篇同时含两字段；23 篇缺 invalidation condition，22 篇缺 source refs。 |
| counter-evidence | 当前仍有 solved/verified precondition、mechanical/semantic grounding、`spec-compound-refresh`。 |
| user impact | 后续 Skill 可召回一个无法回源或没有失效条件的 durable learning，并把 stale guidance 当作当前候选。 |
| posture | 恢复既有 schema/template/prose gate；存量继续标 legacy advisory，不要求一次性迁移全部文档。 |
| closure | 新 promotion 缺任一字段时不能完成；focused test 覆盖 positive/negative；refresh replacement 使用同一 contract。 |
| invalidation | Project owner 用等价、可验证的 provenance/freshness contract 替代这两个字段时重新裁决。 |

### SF-03 — Runtime Setup 错标 active output-config consumer

| 字段 | 内容 |
| --- | --- |
| edge/scope | `.spec-first/config.local.yaml` -> `spec-plan` / `spec-brainstorm` |
| claim | 两个 workflow 已读取 `plan_output` / `brainstorm_output`，Runtime Setup 与模板仍称 reserved。 |
| evidence | `skills/spec-plan/SKILL.md:88-101`；`skills/spec-brainstorm/SKILL.md:62-75`；`skills/spec-runtime-setup/SKILL.md:117-126`；`config-template.yaml:59-68`。 |
| test evidence | `mcp-setup-config-consumers.test.js:44-55` 通过，但通过内容恰好固定错误的 reserved 断言。 |
| counter-evidence | key 默认仍是注释；缺失/非法值安全回退；setup 不决定输出格式。 |
| user impact | 用户和维护者会得到与真实运行相反的 config contract。 |
| posture | Extend active-consumer catalog/template/test，不新增 key 或 config schema。 |
| closure | Skill、template、consumer test 对 active/reserved 状态一致，并覆盖 uncommented/commented/invalid precedence。 |
| invalidation | 两个 workflow 删除这些 key 或换成新的正式 key。 |

### SF-04 — 高风险 task pack 的 doc-review consumer 不存在

| 字段 | 内容 |
| --- | --- |
| edge/scope | `spec-write-tasks -> spec-doc-review -> reviewed-existing -> spec-work` |
| claim | write-tasks 把高风险 task pack 交给 doc-review，但 doc-review 只认识 requirements/plan/unified-requirements/unified-plan。 |
| evidence | `execution-handoff-contract.md:80-95`；`spec-doc-review/SKILL.md:34-58`；`subagent-template.md:67-69`。 |
| counter-evidence | 某些 task pack 含 U-ID、files、test 字段，可能被误判成 plan；coherence reviewer 仍可能发现部分结构问题。 |
| user impact | `semantic_posture: reviewed-existing` 可能来自错误文档类型和错误 persona lens，无法证明 task dependency、wave、stop_if、review_gate 与 source-plan fidelity。 |
| posture | Extend doc-review 的 task-pack intake/type/lenses，或换用明确拥有 task-pack contract 的 reviewer；不要依赖内容碰巧像 plan。 |
| closure | task pack 被唯一分类；review output 明确覆盖 task-pack schema/authority/semantic fit；positive/negative handoff fixture 闭合。 |
| invalidation | write-tasks 删除该 handoff，并由另一个明确 consumer 完整承担高风险 pack review。 |

### SF-05 — `spec-code-review` mutation authority 三向冲突

| 字段 | 内容 |
| --- | --- |
| edge/scope | user/caller -> code review -> apply fixes -> caller/commit |
| claim | Main Skill 规定 default report-only、仅显式 review-and-fix 可 apply；action rubric 称 default interactive 会 apply；schema/template 又称本 Skill 不 apply。 |
| evidence | `spec-code-review/SKILL.md:65-90,765-793,949-951`；`action-class-rubric.md:1-16`；`findings-schema.json:54-57,121-124`；`subagent-template.md:143-150`。 |
| counter-evidence | `mode:agent` 始终 report-only 在所有 surface 一致；main Skill 的 Phase 0 最完整。 |
| user impact | 相同“review”请求可能被理解成修改或不修改代码；mutation 属 hard exit，不能靠读者猜优先级。 |
| posture | Thin/Repair：只保留一套 run-local mutation contract，leaf reviewer 只描述 leaf 权限，schema 不替 orchestrator 声明相反全局规则。 |
| closure | main/reference/schema/template/test 对 default、review-and-fix、mode:agent 三个 case 给出同一 expected mutation/commit 结果。 |
| invalidation | Project owner 明确退役 review-owned apply，统一改成 caller-only fixes。 |

### SF-06 — Shared template 抵消 always-on maintainability reviewer

| 字段 | 内容 |
| --- | --- |
| edge/scope | code-review orchestrator -> maintainability persona -> shared subagent template -> synthesis |
| claim | Catalog/persona 要求检查 1k-line regression、indirection、duplicate helper、complexity growth；共享模板却硬性 suppress 未写入 AGENTS/CLAUDE 的 general code-quality concern，并直接举 long file / too many parameters。 |
| evidence | `persona-catalog.md:3-16`；`maintainability-reviewer.md:1-47`；`subagent-template.md:127-141`。 |
| counter-evidence | mechanical dead code/type hole/具名 canonical helper 仍可能通过；跨 reviewer corroboration 可提升一部分 finding。 |
| user impact | 名义上 always-on 的 reviewer 实际被公共 spine 静默清空，review coverage 声明高于真实语义 coverage。 |
| posture | Repair precedence：区分无 failure mode 的 style opinion 与 persona-owned structural regression；增加 planted-case fixture。 |
| closure | 1k crossing、无行为 wrapper、duplicate canonical helper、纯主观“难读”四类 fixture 分别得到预期 keep/suppress。 |
| invalidation | maintainability persona 被正式退役，或其职责只剩已 codified project standards。 |

### SF-07 — Dogfood/Polish 将 workflow invocation 升级为 branch/commit authority

| 字段 | 内容 |
| --- | --- |
| edge/scope | user -> dogfood/polish -> checkout/fix -> commit |
| claim | Dogfood 默认 fix loop 每次 commit；Polish 将“done”直接映射为 commit，并可自行 checkout branch；没有独立 branch/commit authorization gate。 |
| evidence | `spec-dogfood/SKILL.md:22-35,55-75,78-90,199-216`；`spec-polish/SKILL.md:20-33,38-42,108-116`；对照 `spec-work/references/execution-strategy.md:19,129-138`。 |
| counter-evidence | 两个 Skill 都明确会修改 UI/bug；dogfood 是 hands-off；输出摘要提到 commit。 |
| user impact | 用户只授权 QA/polish 或说“结束”时可能发生 branch switch 与不可回滚的 git history mutation，并可能卷入 pre-existing dirty work。 |
| posture | Wrap：mutation、branch、commit、landing 四个授权面分开；无 commit authority 时留下 verified diff + commit candidate。 |
| closure | 两个 Skill 在 branch mutation/commit 前有独立 authority basis，tests 锁定 `done != commit authorization`。 |
| invalidation | 全局角色合同显式把这两个 workflow 的 invocation 定义为 commit-producing tail，并补齐 dirty/branch/landing 规则。 |

### SF-08 — Brainstorm 调用不存在的 `lfg` Skill identifier

| 字段 | 内容 |
| --- | --- |
| edge/scope | `spec-brainstorm -> autonomous shipping -> spec-lfg` |
| claim | Handoff 使用 `lfg`，governance/source 只存在 `spec-lfg`，没有 command/alias。 |
| evidence | `spec-brainstorm/references/handoff.md:56-57,90-104`；`spec-lfg/SKILL.md:1-16`；governance record `skill_name: spec-lfg`；bundled commands 中无 lfg。 |
| counter-evidence | Payload 形状正确：requirements-only artifact path 会由 LFG 传给 spec-plan 原地 enrich。 |
| user impact | 用户选择菜单中的 hands-off 路径时，skill invocation 或 copy-ready fallback 直接失败。 |
| posture | Repair exact identifier，并用 governed-roster target resolution test 防止未定义 skill 名再次进入 caller prose。 |
| closure | caller 使用当前宿主 available-skills 中 `spec-lfg` 的精确 runtime name；五宿主 source projection fixture 通过。 |
| invalidation | 正式新增并治理 `lfg` alias，且所有宿主都能解析该 alias。 |

### SF-09 — LFG 与 browser helper 缺少合法 N/A 完成握手

| 字段 | 内容 |
| --- | --- |
| edge/scope | `spec-lfg -> spec-test-browser -> lifecycle closeout` |
| claim | LFG 要求 browser/runtime verification passed 或明确 N/A + reason；browser helper 只有 PASS/FAIL/PARTIAL。 |
| evidence | `spec-lfg/SKILL.md:68-72`；`spec-test-browser/SKILL.md:285-305`；pipeline reference 无 not-applicable shape。 |
| counter-evidence | 缺失、失败或 indeterminate 会 fail closed，不会产生错误 DONE。 |
| user impact | backend-only、docs-only或无可映射 route 的合法 LFG 任务无法表达 N/A，可能永久阻断 lifecycle 与 shipping。 |
| posture | Extend helper return envelope，显式定义 passed/failed/not-applicable 与 reason；LFG 只消费结构化结果。 |
| closure | backend-only、browser-bearing、helper-missing、test-failed 四个 fixture 分别得到 N/A/PASS/blocked/blocked。 |
| invalidation | LFG 正式改为只允许 browser-bearing任务，并在 planning/intake 阶段硬拒绝其他任务。 |

### SF-10 — Canonical artifact/consumer 文档保留旧关系

| 字段 | 内容 |
| --- | --- |
| edge/scope | brainstorm -> plan；work run artifact -> code review；用户/agent artifact discovery |
| claim | Current contract/用户地图仍称新 brainstorm 写 `docs/brainstorms/`，并保留 `workflow_integrated=false` 与 legacy graph-evidence 字段集合。 |
| evidence | `spec-id-traceability.md:21-30`；`04-workflows-artifacts-map.md:31,108-112`；`10-产物目录.md:16-20`；`24-公开入口与Skill目录.md:27`。 |
| counter-evidence | README 中英文、current brainstorm source、runtime catalog 和 run-artifact schema/producer 已给出正确关系。 |
| user impact | 用户或 agent 会搜索错误 canonical root、错误判断 producer integration，并按不存在的 `direct_evidence_used` 字段写 consumer。 |
| posture | Thin/Repair 旧 current-fact 描述；增加只覆盖 canonical path/integration flag/field set 的窄 consistency test。 |
| closure | current docs 无相反关系；new brainstorm 唯一指向 `docs/plans/`；run artifact 文档与 v2 schema/producer 完全一致。 |
| invalidation | canonical path 或 run-artifact v2 contract 被正式替换并完成迁移。 |

### SF-27 — Dispatch authorization 未形成 package-local 可执行继承

| 字段 | 内容 |
| --- | --- |
| edge/scope | `using-spec-first -> public workflow -> generic subagent/persona/worker`；另含 internal `spec-resolve-pr-feedback` |
| claim | 35 个 governed package 中有 18 个会直接或条件性 generic dispatch；只有 `spec-code-review`、`spec-debug`、`spec-doc-review`、`spec-plan`、`spec-prd`、`spec-work` 这 6 个完整执行“显式 user/upstream authorization + missing-auth fallback + capability fallback”。其余 12 个存在缺口。 |
| evidence | `skills/using-spec-first/references/conditional-routing-boundaries.md:19-23`；[edge-ledger.md](evidence/edge-ledger.md) 的 35/35 package matrix。高风险例：`skills/spec-compound-refresh/SKILL.md:186,272-294,490-495`、`skills/spec-optimize/SKILL.md:111-115,414-432,514-580`、`skills/spec-resolve-pr-feedback/SKILL.md:41-45`、`skills/spec-sweep/SKILL.md:90-123`。 |
| counter-evidence | 6 个 package 已给出正确 precedent；`spec-brainstorm` / `spec-explain` / `spec-simplify-code` 等有 inline/serial capability fallback；部分 workflow 会预告 agent 数量或仅派只读 worker。 |
| user impact | 普通 workflow invocation 会被静默放大成额外 agent 成本、并发占用和上下文复制；在 `compound-refresh`、`optimize`、`resolve-pr-feedback` 中还涉及 worker 写代码/learning，在 scheduled `sweep` 中涉及 Slack/email/media 内容进入额外 agent context。无 subagent primitive 的宿主又会出现主流程无法按 contract 完成。 |
| posture | Extend 共享 run-local dispatch fact：每个 dispatching package 在第一次派发前解析 authorization/capability，缺授权时 inline/serial或明确停止，并记录统一 reason code；不新建中心化 agent scheduler 或全局状态机。 |
| closure | 18 个 dispatching package 的 explicit/missing/capability-unavailable 三类 fixture 全部闭合；12 个缺口逐包有明确 fallback，mutating/sensitive worker 不再把 workflow invocation、approved spec 或“用户未禁止”当授权。 |
| invalidation | Project owner 若正式把某个 workflow invocation 定义为其内部 dispatch 的显式授权，必须同时修订共享边界、该 workflow 的用户可见 contract、cost/data boundary 与跨宿主 fallback，届时可逐包重新裁决。 |

## 5. Deferred P2/P3

这些 finding 不进入下一阶段最高杠杆三项，但已在逐文件台账与 edge ledger 中保留。

| ID | 级别 | 关系问题 | 裁决 |
| --- | --- | --- | --- |
| SF-11 | P2 | 三份 shared HTML renderer 仍称 `spec-doc-review` 不是 HTML consumer；brainstorm 因此隐藏 HTML requirements review，且 ideate renderer 泄漏 plan-specific consumer prose。 | Repair shared renderer/caller；plan 主 handoff 已正确，所以不升 P1。 |
| SF-12 | P2 | universal brainstorm / universal planning 的 Proof-only 分支未先物化 `spec-proof` 必需的 local Markdown source path。 | 先 save temp/local md 再 publish，或允许明确 inline payload contract。 |
| SF-13 | P2 | universal ideate 称 brainstorm 后结束且无 plan 链，universal brainstorm 实际提供 `spec-plan`。 | 对齐 terminal/handoff 叙述，避免 caller 错误承诺。 |
| SF-14 | P2 | app-audit 声明 `from:code-review` / `code_review_handoff`，code-review 全包无 caller/consumer。 | 明确接线或删除 integration claim。 |
| SF-15 | P2 | optimize 把 spec-work 列为 downstream consumer，但无 trigger/payload，spec-work 也不读取 experiment artifact。 | 删除纸面 consumer 或补最小 handoff。 |
| SF-16 | P2 | compound session-historian caller 要求写 scratch artifact + return path，worker 明确禁止写文件、只返文本。 | 统一 worker return；inline fallback 只是降级。 |
| SF-17 | P2 | worktree helper 反向声称 spec-work/code-review caller，真实 forward edge 只有 dogfood。 | 删除过时 caller 或在 public owner 中正式接线。 |
| SF-18 | P2 | LFG 与 Work 各持一份不等价 tracker-defer contract；旧版仍把 filing 归 code-review interactive route，并允许 temp path 进入 durable ticket prose。 | 收敛为单一 owner contract。 |
| SF-19 | P2 | Figma mutating worker 缺 changed_paths/verification return，也未重复 worker 禁止 stage/commit 的边界。 | 对齐通用 worker packet。 |
| SF-20 | P2 | shared repo-profile cache 要求 NO-CACHE fresh derive，code-review caller 明确选择 no-profile。 | 明确“full protocol”是否允许 consumer-specific fallback。 |
| SF-21 | P2 | maintainability persona 认为 P1/anchor 50 可存活，synthesis 仅允许 P0/50。 | 与 SF-06 一并修复 producer/consumer confidence contract。 |
| SF-22 | P2 | sweep 与 Riffrec Skill 各持 byte-identical analyzer，但无 canonical owner/parity test。 | 保留 package-local copy，增加同源/parity contract。 |
| SF-23 | P2 | `spec-test-xcode` 声称 code-review 会调用；实际只有静态 Swift persona，helper 与 `spec-resolve-pr-feedback` 均无 current caller。 | 退役孤儿或绑定真实 public owner；不要保留 reverse-only integration。 |
| SF-24 | P3 | deployment prompt 的自述 activation 比 orchestrator 的 risky-migration gate 更宽。 | 统一说明；实际 worker 不可自调用。 |
| SF-25 | P3 | validator 说 `why_it_matters` required，orchestrator 允许 artifact 不可用时省略。 | 改成 when available。 |
| SF-26 | P3 | LFG 称 simplify 会跑完整 test suite，实际 simplify 先跑 affected scoped tests。 | 修正文案；后续 verification 仍阻止错误 closeout。 |

## 6. 已确认正确或未升级的关系

- `using-spec-first -> public route` 的可见性/target selection：27 个可选 public target 全部进入 route map，internal-only 为 0；其中 11 个 target 的 downstream dispatch-authority 继承另见 SF-27。
- `ideate -> brainstorm`：focused seed 只传选中方向，不把 ideation artifact 当 Product Contract。
- `brainstorm -> plan`：有 artifact 时传 requirements-only path，无 artifact 时传精简决策；plan consumer 原地 enrich。
- `prd -> plan`：ready/checkpoint/validate stop point 与 owner decision authority 清楚。
- `plan -> work/write-tasks`：implementation-ready 与 derived task-pack boundary 清楚。
- `work -> plan/debug/review/closeout`：scope-changing discovery 回 owner，review report-only，actual-tree/verification/lifecycle 分层成立。
- `sweep -> lfg`：rolling requirements-only plan path 可被 LFG 的 spec-plan step enrich；source/state authority 不反转。
- `riffrec -> brainstorm`：只有 extensive path handoff；quick path终止，payload 带 source materials。
- `runtime-setup -> downstream`：provider facts 仍为 advisory；未把 graph/provider 输出当 completion authority。
- `pov -> direct lane/spec-explain` 未升级 finding：轻量 neutral fact 可 Direct Lane，需要 dense artifact/check-in 时 route map 已指向 spec-explain。

## 7. 下一阶段最高杠杆三项

1. **恢复可执行 reachability（SF-01、SF-08、SF-09）**
   - Owner：plugin/governance + LFG/helper owners。
   - Closure：caller-target 五宿主 reachability、规范名解析、browser N/A handshake 同一 patch 闭合。
   - 不做：不新建第二套路由注册表；复用现有 governance/projection/tests。

2. **统一 hard-exit 与 dispatch authority（SF-05、SF-06、SF-07、SF-27）**
   - Owner：using-spec-first boundary + code-review + dogfood/polish + dispatching workflow owners。
   - Closure：dispatch/mutation/branch/commit/landing 单义，missing-auth/capability fallback 可审计，shared template 不抵消 persona，case fixtures 可复现。
   - 不做：不把所有 review fix 都交给脚本，也不让 reviewer 自动决定 commit。

3. **校准 canonical producer/consumer contracts（SF-02、SF-03、SF-04、SF-10）**
   - Owner：knowledge、runtime-setup、task-pack/doc-review、docs contract owners。
   - Closure：knowledge promotion、active config、task review、artifact map 分别有 source+consumer+focused test 的纵向 slice。
   - 不做：不新建 knowledge database、config registry v2、task state machine 或生成整份用户手册的复杂系统。

## 8. 不做什么

- 不把 157 个文本共现全部当成 runtime edge。
- 不建设新的 durable Skill graph registry 或强 workflow state machine。
- 不在本轮修 Skill、CLI、contract、tests 或 generated runtime mirror。
- 不以 source 文件存在证明 host runtime 可发现。
- 不以 223 个聚焦测试通过证明 field outcome 或否定 source contradiction。
- 不修改 origin plan 正文，不把 review-complete 当整改完成。

## 9. 最终判断

spec-first 的 Skill 体系不是“需要推倒重来”，而是“主链 ownership 基本正确，但若干 load-bearing edge 没有完成纵向闭合”。最重要的缺口不在新增节点，而在：caller 与 runtime target 可达、producer 与 consumer 使用同一 contract、dispatch/hard-exit authority 只有一个 owner、失败/降级有合法 return shape。

本报告是 review evidence，不授权修复、commit、push、PR 或 lifecycle mutation。
