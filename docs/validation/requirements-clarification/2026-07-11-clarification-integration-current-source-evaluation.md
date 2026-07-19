# 需求澄清轻量集成 Current-Source Evaluation

> Artifact type: confirmed（source/test facts）+ advisory（semantic comparison）
> Baseline: `docs/validation/requirements-clarification/2026-07-11-clarification-integration-baseline.md`
> Fresh-source status: passed
> Required session cap: 36

## Evaluation contract

使用 baseline 的 C1-C6、M1-M7 rubric、judge calibration、countermetrics 与差异门。Before bundle 从 `HEAD` source 读取；After bundle 从当前工作树 source 读取。三位彼此独立的 fresh reviewer 各评估所有适用 case，因此每个 unit 获得 3 个 matched repeats。呈现顺序按 reviewer 轮换 `before→after`、`after→before`、`before→after`。Static tests 不裁决 semantic improvement。

## Current source hashes

| Source ref | After SHA-256 |
| --- | --- |
| `skills/spec-ideate/references/post-ideation-workflow.md` | `ad11642aac473155704ecd9e8e3c36c8dac690008865a425d17971f7067949b6` |
| `skills/spec-brainstorm/SKILL.md` | `5e8365a53b3627290b1b59ce7e3d7361f2e0ddd6d83bed2924fc18f310f09b27` |
| `skills/spec-brainstorm/references/product-pressure-test.md` | `2e5f4ad474d6b174cfe54555e31d695085e942c3559127153cfbb2dde928fd84` |
| `skills/spec-brainstorm/references/brainstorm-sections.md` | `9db1310fbfe61e0d3676feed8be10913b2e8cfe73357f544f0418676400b2105` |
| `skills/spec-brainstorm/references/handoff.md` | `b399fcffd62033a4edd62e6817fc216f50c60f39ebe5740ec7ea769a0264ee1d` |
| `skills/spec-plan/SKILL.md` | `b01be2c81ce90503b74078bf91e44924fed7b74bd00731b062cba07f866d03d3` |
| `skills/spec-prd/SKILL.md` | `38f26a519741cab7f1538448cec6f703b608041b094533b302cf29149bb8f023` |
| `skills/spec-prd/references/domain-language-and-decision-ledger.md` | `f1ecde33b3bf5b37e3801e69f95284198506397d355c7dc343fce9acb26acfe3` |
| `skills/spec-prd/references/evidence-and-topology.md` | `e596b313e36f2ace3a635da75e5dd28a9993ff9e8220b1f8fb9227c56748f95b` |
| `skills/spec-prd/references/grill-with-docs-integration.md` | `aaa90931129db5db520d8836214a4bcc7146bd0b79710bb304906a6b97e7d14f` |
| `skills/spec-prd/references/prd-output-template.md` | `59a776888f79c76d7d8c0869773ece95a828918e310ece2a53dbd06bd4858c89` |
| `skills/spec-prd/references/prd-readiness-lens.md` | `fddbff2c86451191210d99f2690af85490be2fd1d4016789c7b284a67839ba35` |
| `skills/spec-prd/evals/examples.json` | `ebc9039ee0a8a47287380370ed56c2466d8300e742b4e939b8ae84f397dc3733` |
| `docs/contracts/domain-glossary.md` | `6c16fdd75f22f72014cf9b9cb1f843906b5a38ff645a888accdfffb3fb534d41` |

2026-07-15 delta refresh: `spec-brainstorm` / `spec-plan` 增加了与 requirements clarification 正交的 Markdown plan lifecycle metadata 合同，因此上述三项 source hash 与 final-source manifest 已刷新。原 2026-07-12 unit replay 未重跑，也不再证明这三项文件与当时逐字节相同；本次只用独立 fresh-source lifecycle review 验证新增 producer/closeout 语义，原 replay 继续作为历史 clarification 证据，不冒充本次 lifecycle 评估。

2026-07-16 delta refresh: `spec-plan` 增加了与 requirements clarification producer 语义正交的 planning-only、首屏决策、evidence/ownership、高风险、multi-surface、dispatch fallback，以及 `reuse / extend / compose / new` composition-first 架构姿态合同，因此 `skills/spec-plan/SKILL.md` 的 current-source hash 与 final-source manifest 再次刷新。原 2026-07-12 unit replay 未重跑，不证明本轮 source 与当时逐字节相同；本轮只通过 `spec-plan` 聚焦 source/fixture/projection tests 验证新增 planning contract，fresh-source helper eval 因 `dispatch_authorization_missing` 未执行。

2026-07-19 delta refresh: `spec-brainstorm` 与 `spec-ideate` 的 post-ideation reference 增加了与 requirements clarification 产品语义正交的 package-local dispatch authorization/capability/fallback 边界，因此两项 current-source hash 与 final-source manifest 再次刷新。原 2026-07-12 unit replay 未重跑，不证明本轮 source 与当时逐字节相同；本轮只通过 mutation/dispatch authority、brainstorm/ideate 聚焦合同与完整 unit suite 验证新增授权边界，fresh-source/host-loader/field outcome 均为 `not_run`。

U4 removal facts: `skills/spec-brainstorm/references/visual-probes.md` and `skills/spec-brainstorm/scripts/visual-probe-server.js` are absent in the After tree; their Before hashes are retained in the baseline.

## Unit-exit sequence replay

为修复最初未持久化完整 unit-exit provenance 的 P1，使用基准 commit `89c732603b0d544bdd2aeb2fd520525c6301a574` 构造隔离副本，按 `U2 → U3 → U4 → U5 → U6` 重新应用当时实现。每个 unit 均保存 pre/post 文件集合与 SHA-256、patch hash、实际 evaluator bundle 内容与 bundle hash、原始 reviewer JSON 和 countermetrics。Replay 在 2026-07-12 capture 时与 34 个目标 source 逐字一致，mismatch 为 0；后续 source delta 见上方 refresh note。

Durable evidence: `docs/validation/requirements-clarification/2026-07-12-unit-replay/`；聚合入口为 `aggregate.json`。U2-U5 使用三个真正独立 session A/B/G；单一 session 内错误生成内部三重复的 Reviewer C 被保留但不计数。U6 首轮 residual finding 促成 direct-bootstrap authority refinement：任何未由当前用户或 current source 确认的承重 WHAT 必须显式记录为 planning-time assumption；改变 behavior/scope/success criteria 的内容返回当前用户或保持 named blocker。随后 D/E/F 三次 matched recheck 均通过。

## U5 deterministic no-mutation sentinel

Sentinel scope: the exact root/project glossary paths `CONCEPTS.md`, `docs/contracts/domain-glossary.md`, `CONTEXT.md`, and `CONTEXT-MAP.md`, plus the sorted recursive file set under `docs/adr/`. The capture used a read-only Node.js fixture (`fs.existsSync` / `fs.readFileSync` + SHA-256), ran `npx jest --runInBand tests/unit/requirements-language-promotion-contracts.test.js` between the two captures, and then repeated the same capture. This proves only that the protected path set and bytes did not change during that deterministic fixture window; it is not a historical replay of interactive `spec-brainstorm`, `spec-plan`, or `spec-prd` runs, and it does not attribute the existing contents of concurrently owned files to this task.

| Protected path | Before status / SHA-256 | After status / SHA-256 |
| --- | --- | --- |
| `CONCEPTS.md` | `present:9f52fd276fab3b94464f20d6307babb8c53ee11cb7b4afc6a610bf71411e40a6` | `present:9f52fd276fab3b94464f20d6307babb8c53ee11cb7b4afc6a610bf71411e40a6` |
| `docs/contracts/domain-glossary.md` | `present:6c16fdd75f22f72014cf9b9cb1f843906b5a38ff645a888accdfffb3fb534d41` | `present:6c16fdd75f22f72014cf9b9cb1f843906b5a38ff645a888accdfffb3fb534d41` |
| `CONTEXT.md` | `absent` | `absent` |
| `CONTEXT-MAP.md` | `absent` | `absent` |
| `docs/adr/0001-init-owns-limited-user-language-sync.md` | `present:b8c8f30a0c98959a11fe0f48a6ea83f8a4f3fb44a4ec2eddbd908ee9b0ab188d` | `present:b8c8f30a0c98959a11fe0f48a6ea83f8a4f3fb44a4ec2eddbd908ee9b0ab188d` |
| `docs/adr/0002-init-team-knowledge-network-access.md` | `present:e3bbf9d1a53ee44a207aa14b20ecd6c0e7569e94afcef7ecaf809bf3265df874` | `present:e3bbf9d1a53ee44a207aa14b20ecd6c0e7569e94afcef7ecaf809bf3265df874` |
| `docs/adr/0002-spec-prd-stays-workflow-not-agent-collection.md` | `present:2493d6c5340e699cd0be8ac072e73a660668ae346fed294feab4efd637ac8838` | `present:2493d6c5340e699cd0be8ac072e73a660668ae346fed294feab4efd637ac8838` |

Sentinel result: passed（7 protected path entries；present hashes equal；root context paths remained `absent`；recursive `docs/adr/` path set unchanged）。

## Unit-exit results

| Unit / cases | Repeat distribution | Main metric delta | Countermetrics | Verdict | Limitations |
| --- | --- | --- | --- | --- | --- |
| U2 / C1 | 3/3 improved；total delta `-3/-2/-3` | snapshot/limitation/assumption/adjacent-alternative failures → 0 | seed bytes slightly higher; no extra confirmation round; latency not_measured | retained | source-prose evaluation, not field outcome |
| U3 / C1-C3 | 3/3 improved on every case；each After total 0 | source question, scenario landing, and pause/resume failures → 0 | small reasoning/artifact increase; no extra confirmation round or erroneous blocker observed | retained | source-prose evaluation, not transcript replay |
| U4 / C5 | 3/3 text-closure improved；deterministic removal passed | M7 `2 → 0`; helper surface absent | removes fixed opt-in round, helper latency, and temp artifact | retained | safety/maintenance and closure claim only; no product-value claim |
| U5 / C4+C6 no-regression | C4 3/3 `2 → 0`；C6 3/3 `5 → 2`，remaining M1 explicitly owned by U6 | unauthorized mutation M6 `2 → 0`；second-confirmer/confirmation laundering 无回归 | candidate fields add bounded output; no extra product round | retained | deterministic sentinel passed；U5 不冒领 U6 planning outcome；field outcome not_run |
| U6 / C6 | refinement recheck 3/3 improved；total delta `-3/-2/-2`；After `0/0/0` | planning invention 与 direct-bootstrap confirmation laundering → 0 | source/assumption trace adds bounded tokens; no false-blocker regression | retained | real token/wall latency not_measured |

Judge calibration: passed（baseline 3/3；paired reviewers 3/3）。
Fresh reviewer sessions: 16 / 36 cap（历史 baseline/paired/recheck 9；持久 replay A/B/C 3；malformed replacement G 1；U6 refinement D/E/F 3）。
Integrated C1/C2/C6 no-regression: passed；current-user fidelity、second-human routing、unauthorized mutation、planning invention 与错误 blocker 均无最终 P0/P1。
Field outcome: not_run（无 current-user opt-in field pilot；本轮不声明普遍用户效果）。

## Semantic limitations

- Fresh-source review 比较当前 source prose 与 `HEAD` Before source，不是实际 workflow transcript、真实用户任务或 field pilot。
- token、wall latency 与 artifact bytes 只做方向性判断，均未实测。
- R36 保留当前用户逐项把真实 blocker 转成显式 assumption/decision 并记录 consequence/accepted risk 的控制权；该路径不把风险归零，但避免 planner 静默发明或漂白 producer confirmation。
- U5/C6 只支持 no-regression；C6 的主改善归 U6，不用累计 source 夸大 U5 效果。

## Deterministic verification

- Focused contract tests：11 suites / 76 tests passed（包含 30-day/direct-bootstrap authority 结构守卫、runtime mutation forbidden patterns、U5 sentinel、unit replay artifact contract、record-to-bundle hash binding、raw rubric score/delta/direction/verdict recomputation 与五宿主 candidate-only/no-mutation projection assertions）。
- `npm run lint:skill-entrypoints`：285 files passed。
- `npm run typecheck`：155 files passed。
- `npm run test:eval-fixtures`：6 suites / 70 tests passed。
- `npm test`：76 unit suites / 663 tests passed；smoke 1 suite / 5 tests passed；integration 2 suites / 16 tests passed。
- `npm run build`：`npm pack --dry-run` passed；retired visual helper assets absent from tarball。
- `git diff --check`：passed。
- 五宿主 projection：dry-run 后从 source 执行 init，5/5 hosts ready；source/runtime 中 `visual-probes.md`、`visual-probe-server.js` 与 gate/helper tokens 均无残留。
- Doctor：Claude/Codex install/runtime/readiness `pass`；Cursor 为 generated-loader/CLI/MCP advisory warning，Kiro 为 host readiness warning，Qoder 为既有 hook activation/MCP advisory warning。这些 warning 不表示 source projection drift。

Generated runtime projection 只证明 source delivery，不证明问题质量或用户结果。Field outcome 仍为 `not_run`。
