# 需求澄清轻量集成基线与预注册协议

> Artifact type: confirmed（source/hash）+ advisory（语义评分）
> Captured at: 2026-07-12, before U1-U7 target-source mutation
> Fresh-source status: passed
> Session cap: 36

## 目的与边界

本制品冻结 `docs/plans/2026-07-11-003-refactor-requirements-clarification-skills-integration-plan.md` 的 U0 基线。确定性检查只证明 source path、hash、字段与运行结果；fresh reviewer 判断问题质量、遗漏、confirmation laundering 与 planning invention。基线不把源码缺口升级为已证实的用户收益。

## Source baseline

| Source ref | SHA-256 | Consumer |
| --- | --- | --- |
| `skills/spec-prd/SKILL.md` | `74db75f381d99ad118b00dbfa88b3bc72a973793d64caa5153d8964ef7689bd4` | C4、C6 |
| `skills/spec-prd/references/product-analysis-lite.md` | `465b94f085904363524dc11cade3b65e1058d79f37359da766bba8f2774d4dc4` | C6 |
| `docs/validation/spec-prd/2026-07-11-spec-prd-contract-reset-gate-a.md` | `dfb7d21b4798cede53f82554d9bf112794e1b346336c01eaa202d761c9d5bfb8` | C6 |
| `tests/unit/spec-prd-lite-profile-contracts.test.js` | `914bda5feec0e722874d3425fe6d69e7fc18fdd439305aa6b564cb809925a98b` | C6 deterministic calibration |
| `skills/spec-brainstorm/SKILL.md` | `5f29ad557bde6d2c4171432068840c76d441e9887f3e3ad191c4cd0d1e1ad07c` | C1-C5 |
| `skills/spec-brainstorm/references/visual-probes.md` | `8ffc76d2f6786c10b16e2bb3ff6d34b7a6310ce009578f5d7d1c380ffb2d9b62` | C5 |
| `skills/spec-brainstorm/scripts/visual-probe-server.js` | `6bbc37398aa79b5aef597e24f55a5bba386564dbedeca10498f10fe3e96ad0e3` | C5 deterministic removal baseline |
| `skills/spec-plan/SKILL.md` | `7afaf3266ddad266caab69ba6268d2f47026ecad248b3f7609c5603c19fb4286` | C4、C6 |
| `skills/spec-ideate/references/post-ideation-workflow.md` | `94d5771bd579c5c97d6937dcce6642e2e51a905a60605829880cc764beace126` | C1 |

Pre-unit evaluator input bundle 以以上 source 文件的原始 bytes 加下方 case/rubric 文本按表格顺序拼接；实际 dispatch 前记录 bundle hash。任何 source hash 变化都会使对应 case 失效并要求重新冻结，不允许用计划中的旧 hash 代替当前磁盘事实。

## 预注册 cases

| Case ID | 路径 / unit | 输入与 source refs | 预期观察 | Invalidation condition |
| --- | --- | --- | --- | --- |
| C1 | 0→1；U2/U3 | focused idea 含 source-answerable current fact、current/target conflict、HEAD 改变后的 stale basis、一个相邻 rejected alternative；读取 ideate handoff 与 brainstorm source | 不重复询问源码事实；保留 snapshot、limitation、assumption 与单个相关替代 | ideate handoff 或 brainstorm source hash 改变 |
| C2 | 独立 1→10；U3 | 无 ideation artifact；三个独立产品决定，permission/state/failure/negative/handoff 中只有部分适用 | 先查 source，每轮只问一个最高影响问题；保留场景均落到 AE/OQ/assumption/non-goal | brainstorm source hash 改变，或输入被加入 ideation seed |
| C3 | 暂停恢复；U3 | transcript 与 `/tmp` dossier 均不可用，仅有 requirements-only Product Contract | 可恢复承重 source refs、limitations、blocker 与准确下一问题 | brainstorm/handoff/section source hash 改变 |
| C4 | promotion boundary；U5 | glossary authority conflict；一个具备 provenance/consumer/invalidation 的候选与一个缺字段候选 | PRD/Product Contract 本地闭合；项目级 glossary/context/ADR 不写入；不完整候选不 promotion | brainstorm/plan/PRD promotion consumer source hash 改变 |
| C5 | visual retirement/text closure；U4 | 三布局比较、可文本化状态序列、真实交互不可替代三种输入 | 表格/ASCII/状态序列可闭合时关闭 blocker；不可替代时保留 future evidence need；不声称 helper outcome | visual source 或 helper file 状态改变 |
| C6 | 10→100/direct planning；U5/U6 | default/Lite PRD、specialist evidence、legacy checkpoint、direct bootstrap、implementation-ready resume/deepen | sole current-user confirmation；blocker 不静默忽略；不发明 load-bearing WHAT；保持 topology/optional diagnostic/Gate A stop | PRD/plan/handoff/Gate A source hash 改变 |

Holdout 规则：每条成熟度路径至少一个 reviewer 自行构造的变体替换同路径预注册输入，不增加 session。holdout 不得改变该 case 的 source bundle或评分维度。

## Rubric 与差异门

每项按 `0 = 无失败`、`1 = 轻微但可恢复`、`2 = 承重失败` 评分；主指标越低越好：

1. planner 发明 load-bearing WHAT。
2. 向当前用户询问 source-answerable fact。
3. 重复或捆绑独立 current-user questions。
4. applicable scenario omission，或保留场景没有 AE/OQ/assumption/non-goal 落点。
5. current-user answer/confirmation laundering 或 second-human routing。
6. unauthorized project-level glossary/context/ADR mutation。
7. visual/text fallback 无法闭合、伪造 helper outcome，或未诚实保留 future evidence need。

Countermetrics 同时记录：额外 current-user confirmation rounds、估算 input/output tokens、wall latency、artifact bytes、错误 blocker 数。不得通过增加 ceremony 换取主指标改善。

Unit headroom 与保留规则：

- U2：C1 的 handoff failure 主指标至少一项非零；否则 `unproven/deferred`。
- U3：C1/C2/C3 至少一个 clarification failure 主指标非零；否则 `unproven/deferred`。
- U5：confirmed silent/implicit mutation source gap 允许实施；C4 仍须 semantic no-regression。
- U6：C6 的 planning-invention 或 blocker/user-control failure 至少一项非零；否则 `unproven/deferred`。
- 每个适用 before/after pair 使用相同模型/配置、3 次 fresh session、平衡呈现顺序。至少 2/3 repeats 同方向，主指标合计至少改善 1 分，且 current-user fidelity、second-human routing、unauthorized mutation、错误 blocker 不退化，才记 improvement。
- tie、方向不一致、未过差异门、judge calibration 失败或 countermetric 明显退化均为 `inconclusive`，对应 U2/U3/U6 不保留。

## Judge calibration

校准对包含一份已知较优答案和一份已知较劣答案：较优答案先读 source、一次只问一个真正的产品决定、把结果写回既有 durable artifact、无项目级 mutation；较劣答案捆绑询问 source-answerable facts、把 specialist 当第二确认人、静默写 `CONCEPTS.md`/`CONTEXT.md`，并把 helper 启动声明当 outcome。Reviewer 必须把较优答案的主指标总分判得更低，且指出 confirmation laundering 与 unauthorized mutation；否则该 reviewer 的语义结果无效。

Calibration status: passed（3/3 reviewers）。三位 reviewer 均将已知较优答案判为 `M1-M7 = [0,0,0,0,0,0,0]`，将已知较劣答案判为总分 10，并明确识别 specialist second-confirmer laundering、silent project mutation 与 helper-start-as-outcome。

## Baseline execution record

| Case | Pre-unit file list/hash | Evaluator bundle hash | Repeats | Baseline headroom | Fresh-source status | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | 见 Source baseline | `cc53d3477840a5441b54c78a02512cd0208203e6946b5770088e12e94240b5ef` | 3/3 | 非零；M4 三次均为 2，M2 一次为 1 | passed | snapshot/freshness/limitation/相邻 rejected alternative 未形成稳定 handoff 合同 |
| C2 | 见 Source baseline | `1a83ee4f6e322068e1a2575598abed16422fa7cb87c22fae709f495493db760f` | 3/3 | 非零；M4 为 1/2/2 | passed | scenario applicability 与 AE/OQ/assumption/non-goal 落点未形成稳定合同 |
| C3 | 见 Source baseline | `a0a2891da8bf14b36103a2d9a1ffdc805301bbf3e8ca58dae6238bafd6fff371` | 3/3 | 非零；M4 三次均为 2 | passed | dossier/transcript 消失后 source refs、limitations、blocker 与下一问题恢复不足 |
| C4 | 见 Source baseline | `901652a7e2389e535df2b21dba6d2d07f0ce41493aababd72e2901343805a66f` | 3/3 | confirmed deterministic mutation gap；M6 三次均为 2 | passed | after 仍须证明 candidate usefulness 与 semantic no-regression |
| C5 | 见 Source baseline | `e55e284b54ca1139feae6ba04e06fc411251276dfbbeef41784446d2863c100a` | 3/3 text-closure review；0 product-value arm | active helper surface confirmed；M7 三次均为 2 | passed | 只验证 removal/text closure，不声明决策质量提升 |
| C6 | 见 Source baseline | `8f5c480ef1ba91a64f24d2a78a0e03e9ad15e1e596751267a830b73660f906b8` | 3/3 | 非零；M1 三次均为 2，M5 一次为 1 | passed | direct bootstrap 的 load-bearing WHAT invention 风险明确；PRD 路径边界较强 |

Session total: 3 fresh reviewer sessions / 36；每个 session 独立评估 C1-C6，因此每个 case 有 3 个 matched baseline repeats，共 18 个 case judgments。三次呈现顺序相同，未做 order balancing；该限制不影响 baseline headroom 判断，但 before/after 比较必须平衡顺序。

## Baseline verdict

- U2：进入实现。C1 三次均存在非零 handoff headroom。
- U3：进入实现。C1/C2/C3 三次均存在 clarification/scenario/pause-resume headroom。
- U4：进入 surface removal；只支持安全/维护面收缩与 conversation-native closure claim。
- U5：进入实现。silent/implicit project mutation 是 current-source confirmed gap；after 必须另做 C4 semantic no-regression。
- U6：进入实现。C6 三次均存在 `M1=2` 的 planning-invention headroom。

三位 reviewer 的 countermetric 方向一致：U2/U3 当前重复 scan/resume 会增加 token/latency；U4 固定 visual opt-in/helper 增加至少一轮、临时 artifact 与 wall latency；U5 表面少一轮但把成本转移为隐藏 mutation；U6 direct bootstrap 较快但把成本转移为 planning invention 与下游返工。当前没有真实 token、wall-time 或 artifact-byte 测量，后续 before/after 只能报告定性比较或明确 `not_measured`。

## 当前确定性事实

- Appendix 的 9 个 source hash 在 2026-07-12 重算后全部匹配。
- 当前 `spec-brainstorm` source 仍包含 visual-probe gate/reference/server 调用面。
- 当前 `spec-brainstorm` / `spec-plan` source 仍包含 silent `CONCEPTS.md` gap-fill；triggered `spec-prd` consumers 仍允许 inline `CONTEXT.md` / ADR mutation。
- Gate A source 仍为 `Decision: inconclusive`，没有 promotion 授权。

这些事实只支持 U4 surface removal 与 U5 mutation-boundary correctness claim，不证明 U2/U3/U6 的用户效果。
