# CE 上游更新同步技术方案最终审查报告

- **目标文档：** `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md`
- **仓库：** `/Users/kuang/xiaobu/spec-first`
- **审查模式：** report-only、non-interactive
- **总体 verdict：** `CHANGES_REQUESTED` / **修订后可实施**
- **审查完成度：** complete，但机器可读 reviewer-envelope 校验与最终工作树复查有降级，见“限制与降级”。

## 结论

方案对目标、non-goals、517 与 1,023 路径冲突、source/runtime 边界、分阶段实施和 claim ceiling 的总体方向正确。当前版本仍不应以 `artifact_readiness: implementation-ready` 进入 canonical-source 修改。主要缺口集中在语义证据关闭、实施准入、receipt/authority、首轮 window facts、handoff gate、依赖图和 OpenCode 验证入口。

达到下一档 **可实施** 的门槛：

1. 关闭全部 High findings。
2. 在 U1 开始前明确 blob identity/version、artifact 部分失败恢复和当前 execution baseline。
3. 为受影响宿主建立 claim-to-test 映射，并统一 artifact 状态词。
4. 对“每一轮更新”的目标选择其一：补可重复运行验收，或把目标收窄为本固定窗口。
5. 重新运行方案级结构/链接校验。需要时再做 fresh-source 复核；不得用该复核替代上述合同修订。

在这些门槛满足前，U0 的只读事实重放可以继续；U1 的设计修订可以继续。U2–U6/U9 的 canonical-source mutation 和 U8 closeout 不应开始。

## 聚合与校准摘要

- 两名独立 reviewer 都指出 docs/tests 可被机械关闭。该 finding 合并为 High。计划缺口是 confirmed；具体会漏掉哪些行为仍是 advisory，未因 reviewer 共识而升级。
- “包级准入合同”和“owner receipt 合同”保留为两个 finding。前者守 mutation 入口，后者守 verification/closeout 出口，不能互相替代。
- feasibility reviewer 提出的“方案没有选择 patch/receipt 合并模型”未保留为独立 finding。目标方案第 342、345–346 行已经选择 receipt-first、稳定结果快照后重建正式 ledger、同快照 patch 合并的模型。当前 producer 尚未实现该模型是 U1 的实施事实；剩余问题已归入包级准入与 receipt 合同缺失。
- 三个 reviewer 没有给出相反的建议动作。严重度按实际阻断点校准，没有仅因多人同意把 advisory 事实升级为 confirmed。

## Blocker

无 P0。当前问题可通过修订方案和合同解决，不需要推翻整体架构。

## High

### H1. 文档和测试可能未经语义筛查就被关闭

- **建议动作：** Apply。由方案 owner 增加当前窗口绑定的语义例外提取步骤。
- **后果：** 账本可能覆盖全部路径并通过计数与哈希校验，却遗漏只存在于文档、测试、fixture 或验收说明中的行为要求。
- **目标锚点：** 目标方案第 75–77、120–136、289–293、341 行；KTD3/KTD4、“历史排除规则与本窗口同步范围”、U7、D1 closure 设计。
- **状态：** 计划缺口 `confirmed`，confidence 100。实际遗漏的具体行为 `advisory`，尚未逐项裁决。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:120-136,289-293` 允许 H2/H3/H4 通过 count/hash、group rule 和 exception list 收口。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/historical-exclusions.json:2-3,110-112,214-216,321-323` 将该产物标为 `advisory-scope-filter`、`formal_adjudication: false`。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/review-report.md:91-93` 记录 315 条 `tests/skill-eval-cell` 变化仍需语义判断，完整窗口逐路径裁决为 0。
  - `/Users/kuang/xiaobu/spec-first/docs/10-prompt/结构化项目角色契约.md` §3.2 要求脚本准备事实，LLM/human 判断语义充分性。
- **建议修复方向：** 保留“不直接复制”这一 mutation disposition。对 docs/tests 净变化做按 package/Skill 有界语义筛查，产出“行为承载例外”及 source/test owner。脚本只验证每条路径已进入例外裁决或 evidence-only closure，不裁决语义。
- **Reviewer：** adversarial-document-reviewer、feasibility-reviewer。

### H2. 包级实施准入缺少正式、可验证的合同

- **建议动作：** Apply。定义最小 run-specific admission contract 和 validator。
- **后果：** 实施者可能依据自由格式工作账本修改 canonical source。正式全窗口裁决失败时，已发生的修改没有可证明的准入依据。
- **目标锚点：** 目标方案第 288–293、345–346、415 行；U7、D1“部分准入与完整关闭”、D6 prepare 后流程。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:345-346` 引入“包级工作账本”，但未给出 schema、稳定 identity、freshness、validator 或 stale/retry 规则。
  - `/Users/kuang/xiaobu/spec-first/scripts/check-ce-upstream-reconciliation.cjs:792-823` 的 `validateAdjudicationArtifact` 只接受与完整 name-status 等长的全量记录。
  - `/Users/kuang/xiaobu/spec-first/tests/unit/ce-upstream-reconciliation-v2.test.js:195-277,426-535` 覆盖全量 adjudication join 和 snapshot drift，没有 scope-bound mutation admission 合同。
- **建议修复方向：** 绑定 window identity、完整 input hash、精确 path subset、package/scope identity、target snapshot、语义裁决者、source refs、limitations、未决项和 authority。validator 只确认机械完整性。语义充分性仍由 reviewer/owner 判断。
- **Reviewer：** adversarial-document-reviewer。

### H3. Owner receipt 无法被单写者确定性校验

- **建议动作：** Apply。定义版本化 owner receipt contract、validator、join key 和 stale/retry 规则。
- **后果：** 最终收口无法判断 receipt 是否漏字段、绑定旧窗口、重复提交、引用过期测试或超出授权范围。
- **目标锚点：** 目标方案第 108–110、299–303、424、439–440 行；Artifacts、U8、D6“证据落点”、Interface Contracts。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:439-440` 要求 receipt 包含 changed files、命令、exit code、测试、授权和 claim ceiling。
  - `/Users/kuang/xiaobu/spec-first/docs/contracts/verification/ce-upstream-ledger-patch.schema.json:6-25` 只定义 ledger patch 的证据字段，没有 changed-file fingerprint、argv、exit code、log hash、authorization 或 claim ceiling。
  - 对 `/Users/kuang/xiaobu/spec-first/{docs,src,scripts,tests,skills}` 的只读检索只找到方案中的 `owner-receipts/` 引用，没有找到 CE owner receipt schema 或 `validateOwnerReceipt`。
- **建议修复方向：** receipt 至少绑定 window/input identity、实施单元、affected upstream paths、前后 source snapshot、changed-file 内容指纹、完整 argv、exit code、日志引用或哈希、验证状态、授权范围、limitations 和 claim ceiling。明确 producer、single-writer consumer、重复/stale receipt 拒绝规则。
- **Reviewer：** feasibility-reviewer。

### H4. 语义裁决可以自行声明为 confirmed

- **建议动作：** Apply。拆分机械验证状态与语义 review/authority receipt。
- **后果：** 下游可能把模型自报状态当作已确认的 owner、action 或产品决策，即使 schema、join 和 hash 都通过。
- **目标锚点：** 目标方案第 106–110、341、435–440 行；Artifacts、D1 closure 设计和 Interface Contracts。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/contracts/verification/ce-upstream-adjudication.schema.json:6-14,20-29` 只有 producer kind/model/status，没有 review receipt、independence、authority ref 或产品 owner 决策引用。
  - `/Users/kuang/xiaobu/spec-first/scripts/check-ce-upstream-reconciliation.cjs:808-823` 的 `validateAdjudicationArtifact` 只检查 producer kind、可选 status、快照与记录数。
  - `/Users/kuang/xiaobu/spec-first/tests/unit/ce-upstream-reconciliation-v2.test.js:195-246` 的合法 fixture 没有 producer status，仍可进入 join；这也暴露 schema 与直接 validator 的准入差异。
  - `/Users/kuang/xiaobu/spec-first/docs/10-prompt/结构化项目角色契约.md` §2、§3.2、§3.4 区分事实、语义判断、owner 授权与 independent evidence。
- **建议修复方向：** 让 reconciler 只确认 schema、join、hash、provenance 和 receipt 结构。语义裁决另绑定 review/authority receipt、source snapshot、独立性或 degraded 状态。新增产品面和产品排除必须引用对应 owner 决策来源。
- **Reviewer：** adversarial-document-reviewer。

### H5. Window facts 的首轮生成存在循环依赖

- **建议动作：** Apply。固定 create 与 verify 两阶段协议。
- **后果：** U1 没有唯一可执行入口。实现者必须自行决定 window manifest 是 producer 的输入还是输出，进而改变 authority、重跑和篡改语义。
- **目标锚点：** 目标方案第 328–336、402–415 行；D1 Manifest 设计、D6 prepare 命令。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:328-336` 要求非历史窗口在首次写文件前提供 window facts，同时说 U1 生成该文件。
  - 同文件 `:402-415` 的首个 prepare 命令把尚未生成的 `window-facts.json` 作为参数传入。
  - `/Users/kuang/xiaobu/spec-first/scripts/check-ce-upstream-reconciliation.cjs:1322-1329` 当前仍以 `runtime.fullWindowFacts || FULL_WINDOW_FACTS` 取得事实；`FULL_WINDOW_FACTS.total` 在 `:147-155` 固定为 517。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/technical-plan-verification.json:34-37` 明确说明 `window-facts` 尚未生成或调用。
- **建议修复方向：** 推荐 U0 用 immutable Git objects 和冻结清单创建版本化 manifest；普通 prepare/full-window 只读并验证。若 producer 自建，则增加独立 create mode，并限制其输入、输出目录和覆盖行为。
- **Reviewer：** feasibility-reviewer。

### H6. Handoff 出口没有可验证 gate

- **建议动作：** Apply。增加 workflow-owned handoff contract 和 validator，或明确 loud-convention 降级。
- **后果：** closeout 可能在缺少 source refs、freshness、limitations、next owner 或 claim ceiling 时被标为 completed。下一会话会基于过期或不可回源信息继续执行。
- **目标锚点：** 目标方案第 110、299–303、499、503–510 行；Artifacts、U8、Failure Handling、Definition of Done。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:299-303` 只要求 JSON parse、链接检查和按需测试，没有 handoff schema、validator、receipt 或阻断 reason code。
  - `/Users/kuang/xiaobu/spec-first/docs/10-prompt/结构化项目角色契约.md` §3.3 要求 handoff/context reset 成为出口 gate；不能硬强制时必须声明 loud convention 和未强制范围。
  - `/Users/kuang/xiaobu/spec-first/skills/spec-handoff/references/artifact-contract.md:24-84` 与 `/Users/kuang/xiaobu/spec-first/skills/spec-handoff/scripts/handoff-artifact.cjs:115-145` 提供了可借鉴的字段/validator 模式，但不自动成为本 workflow 的合同。
- **建议修复方向：** 最小字段包括 summary、source refs、freshness、limitations、next owner、claim ceiling 和绑定快照。校验失败时禁止 completed。不要为复用而把当前 workflow 错误路由到 `spec-handoff`。
- **Reviewer：** adversarial-document-reviewer。

### H7. 实施单元依赖图与全局准入门不一致

- **建议动作：** Apply。把依赖声明细化到包或子包，并让全局顺序与单元声明一致。
- **后果：** 实施者可能在语义准入前修改源码，也可能把独立的 optimize 工作无谓阻塞在 PR feedback 链路之后。
- **目标锚点：** 目标方案第 232–243、250–265、276、288–293、316–319、366–367 行；U2–U7、Execution dependency order、D3。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:243,265` 中 U3/U5 的 Dependencies 只列 U1。
  - 同文件 `:288-293,316-319` 要求所有实施单元先完成对应 U7-A。
  - 同文件 `:254` 把整个 U4 声明为依赖 U3；`:366-367` 又说只有 PR 子包依赖 U3，optimize 可在自身 U7-A 后独立处理。
- **建议修复方向：** U3、U5 显式依赖各自 U7-A。U4-PR 依赖 U3 和自身 U7-A；U4-optimize 只依赖 U1 和自身 U7-A。receipt 应记录实际满足的 dependency refs。
- **Reviewer：** coherence-reviewer。

### H8. OpenCode package-entry 目标没有完整 owner 和可执行验证入口

- **建议动作：** Apply。先固定适用性分支，再补 owner 与真正的 packaged-entry load 命令。
- **后果：** 方案可能在没有处理真实 package/plugin 入口、也没有加载已打包产物的情况下声称兼容性已验证。
- **目标锚点：** 目标方案第 181–184、273–281 行；F3、U6。
- **状态：** 计划缺口 `confirmed`，confidence 100。上游变化是否适用于本地仍是执行期 `advisory` 判断。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:274-281` 将 package entry 纳入 U6 Goal，但 Files 没有 `package.json`、安装验证脚本或其他明确 package-entry owner；验证只写“相关 unit/smoke/build”。
  - `/Users/kuang/xiaobu/spec-first/package.json:7-13,21,33` 显示本地 entry/export 与 build 命令。
  - `/Users/kuang/xiaobu/spec-first/docs/catalog/runtime-capabilities.md:188-189` 规定 `npm run build` 只证明包内容，不证明隔离安装或入口加载。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/candidate-owner-map.json:2-6` 自报为 advisory owner navigation，不能替代正式 owner 裁决。
- **建议修复方向：** 若本地没有同型缺陷，把相关上游路径裁决为 evidence-only 并收窄 U6 Goal。若适用，指定本地 package/install owner、可能修改文件和加载已打包产物的精确命令。不得用 `npm pack --dry-run` 代替入口加载。
- **Reviewer：** coherence-reviewer。

## Medium

### M1. Blob identity 缺少 A/D/M/R 表示和版本迁移定义

- **建议动作：** Apply。U1 开始前固定字段及兼容策略。
- **后果：** 逐路径内容身份无法稳定进入正式输入合同，删除与 rename 端点也无法按计划 fail closed。
- **目标锚点：** 目标方案第 224–227、336–338、435–438 行；U1、D1 Schema 兼容、Interface Contracts。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/contracts/verification/ce-upstream-adjudication-input.schema.json:44-51` 只有开放的 `source_facts`，没有 old/new object 的必填表示。
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:435-438` 要求每行绑定 blob OID，但未定义新增、删除、修改、rename 的 null/双端语义。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/git-object-inventory.json` 已使用 `old_object`/`new_object` 及 mode/type/git_oid，可作为事实来源，不等于正式 schema 已定义。
- **建议修复方向：** 在 `source_facts` 固定 old/new object 形状并绑定 inventory hash；若字段成为正式必填项，提升 input schema version，保留 v1 reader 与 517-path fixture。
- **Reviewer：** feasibility-reviewer。

### M2. 多文件 artifact 发布缺少原子性和并发策略

- **建议动作：** Apply，或明确单进程前提和确定性恢复流程。
- **后果：** 中断或两个 writer 同时刷新时，可能留下新旧混合的 name-status、input、ledger、inventory 与 summary。
- **目标锚点：** 目标方案第 328–346、392–424、426–433、488–499 行；D1、D6、D7、Failure Handling。
- **状态：** 遗漏 `confirmed`，confidence 75；并发发生频率 `advisory`。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/scripts/check-ce-upstream-reconciliation.cjs:1265-1267` 的 `writeGenerated` 直接调用 `fs.writeFileSync`。
  - 同文件 `:1397-1400` 的 prepare 分支顺序写三个文件；`:1466-1470` 的 full-window 分支顺序写四个文件。
  - 目标方案定义 stale evidence 和 rollback，但没有临时目录、原子发布边界、existing-output collision 或并发 writer 规则。
- **建议修复方向：** 先在内存中生成并校验完整 artifact set，再写入 run 专属临时目录并原子发布。增加窗口级锁或 existing-output hash admission。若不实现原子发布，必须写明失败后的检测与恢复命令，并收窄 completion claim。
- **Reviewer：** feasibility-reviewer。

### M3. 八宿主影响缺少逐层、逐宿主的 claim-to-test 矩阵

- **建议动作：** Apply。把 package projection、doctor/loader、真实宿主调用和 field outcome 分开映射。
- **后果：** registry 或 adapter 回归可能未被发现，而报告仍可能给出过宽的“宿主兼容性已验证”结论。
- **目标锚点：** 目标方案第 273–281、389、421–422、443–445、483–485 行；U6、D5、D6、System-Wide Impact、Runtime And Field Ceiling。
- **状态：** 计划缺项 `confirmed`，confidence 75；实际 changed set 是否要求全部测试由实施时判断。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/src/cli/adapters/index.js:1-17,40-42` 返回 Claude、Codex、Cursor、Kiro、Qoder、OpenCode、ZCode、Pi。
  - `/Users/kuang/xiaobu/spec-first/src/cli/adapters/cursor.js:72-73` 与 `/Users/kuang/xiaobu/spec-first/src/cli/adapters/opencode.js:78-80` 只声明 `generated_runtime_preview`。
  - `/Users/kuang/xiaobu/spec-first/src/cli/adapters/kiro.js:124-133` 明确记录 `kiro_generated_runtime_loader_unverified`。
  - 目标方案第 421–422、483–485 行已正确限制 projection claim，但 U6 没有把这些层级映射到精确测试路径和状态。
- **建议修复方向：** package projection 用动态全宿主 projection tests；runtime health/loader 状态用 doctor tests；init/clean/idempotency 用动态宿主 integration；真实宿主调用保持 not-run，除非有版本绑定 journey；behavior quality 只由实际变更 Skill 的 fresh-source 场景支持；runtime cost 与 field outcome 无证据时保持 not-run。
- **Reviewer：** coherence-reviewer。

### M4. 当前 execution baseline 尚未成为 U1 前的明确硬条件

- **建议动作：** Apply。把初始 snapshot 标为不可变历史证据，并在 U1 前建立新的 execution baseline。
- **后果：** 既有用户 WIP 可能被归入 CE changed set，rollback 或 receipt 也可能绑定已失效的 dirty manifest。
- **目标锚点：** 目标方案第 214–218、426–440、535–538 行；U0、D7、Interface Contracts、窗口冻结记录。
- **状态：** 快照差异 `confirmed`，confidence 100；污染风险为 reviewer judgment。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/window-snapshot.json:27-35` 只记录初始 4-path dirty manifest。
  - `/Users/kuang/xiaobu/spec-first/docs/validation/ce-pull-2026-10-27/snapshot-supplement.json:12-17` 说明 dirty 内容哈希未保存，历史内容不可追补。
  - intake 与 coherence reviewer 的只读 `git status --short --untracked-files=all` 事实为 branch `feat/onboarding-workflow-routing-ux`、HEAD `59cb4cb130a31bb1a2335add80d570b87a8b40d4`、共 24 个状态路径；这晚于初始冻结。
  - 目标方案第 438–440 行要求实施前另存 changed-file hash 和 dirty manifest，但 U0 的完成叙述没有把该重绑定列为进入 U1 的显式验收条件。
- **建议修复方向：** U0 保留 immutable historical snapshot。新增 execution baseline，记录完整 status、dirty 内容指纹、路径归属、不可触碰 WIP 和 overlap 分类。任何 source mutation 前 validator 应确认 baseline freshness。
- **Reviewer：** coherence-reviewer。

### M5. 不完整状态词没有按 artifact 类型形成合同

- **建议动作：** Apply。增加按 artifact 分类的状态矩阵和转换规则。
- **后果：** producer、工作队列、receipt、summary 和 ledger 可能对同一未验证状态写入不同值，导致 schema 失败或错误关闭。
- **目标锚点：** 目标方案第 45、280、285–293、435–440 行；R9、U6/U7、Interface Contracts。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - 目标方案使用 `planned`、`blocked`、`degraded`、`not-run`、`incomplete`、`pending-verification`、`deferred/unresolved`。
  - `/Users/kuang/xiaobu/spec-first/docs/contracts/verification/ce-upstream-adjudication.schema.json:20-29` 只允许固定 target action、`planned|confirmed|not-applicable` 和独立 degraded boolean。
  - `/Users/kuang/xiaobu/spec-first/docs/contracts/verification/ce-upstream-ledger-patch.schema.json:21-25` 使用相同 evidence 状态子集。
- **建议修复方向：** 分别定义 formal adjudication、工作队列、owner receipt、verification summary 和整体 lifecycle 的合法状态。将 `pending-verification` 映射到既有状态加 reason code，或明确它只属于 receipt 字段。
- **Reviewer：** coherence-reviewer。

### M6. 持续同步目标缺少重复运行验收或明确收窄

- **建议动作：** Apply。由 owner 选择补验收或收窄目标。
- **后果：** 当前窗口可以完成，但下一窗口仍可能需要修改 producer、schema、package mapping 或 output allowlist，无法支持“每一轮更新”的承诺。
- **目标锚点：** 目标方案第 20–24、220–227、500–510 行；Goal Capsule、U1、Definition of Done。
- **状态：** 目标与 DoD 差距 `confirmed`；下一窗口是否失败为 `advisory`。confidence 75。
- **回源证据：**
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-10-27-001-refactor-ce-upstream-sync-technical-scheme.md:20` 明确写“为每一轮”建立闭环。
  - 同文件 `:220-227` 只要求当前 1,023 窗口与旧 517 fixture。
  - 同文件 `:500-510` 的 DoD 只关闭当前窗口，没有 synthetic next-window、成本上限或重估/退役触发器。
  - `/Users/kuang/xiaobu/spec-first/docs/10-prompt/结构化项目角色契约.md` §4 要求新增能力说明 consumer、失败方式、验证与退役条件。
- **建议修复方向：** 若保留持续目标，增加 synthetic next-window fixture，证明只替换 manifest/refs 即可 prepare、admit、close，并写明运行成本与重估条件。否则把目标改为本固定窗口的可复用实现基础。
- **Reviewer：** adversarial-document-reviewer。

## Low

### L1. Successor 承诺没有落入 frontmatter

- **建议动作：** Apply。补 canonical relationship metadata，或删除机器可读关系承诺。
- **后果：** 自动化 consumer 只能通过正文猜测新旧计划关系，无法稳定定位前序方案。
- **目标锚点：** 目标方案第 1–14、33、79 行；frontmatter、Problem Frame、KTD7。
- **状态：** `confirmed`，confidence 100。
- **回源证据：**
  - 目标 frontmatter 没有 `supersedes` 或 `successor_of`，但 KTD7 明确承诺该关系。
  - `/Users/kuang/xiaobu/spec-first/docs/plans/2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md:12` 展示仓库已有 `supersedes` 用法。
- **建议修复方向：** 如果 unified-plan contract 接受该字段，在 frontmatter 指向 canonical 前序方案；否则改写 KTD7，说明由哪个既有字段或 artifact 提供机器可读追踪。
- **Reviewer：** coherence-reviewer。

## FYI

无单独 FYI。低置信度或不可验证推测没有进入可行动清单。

## 成功标准覆盖复核

| 检查面 | 结论 | 关联 finding / 证据 |
|---|---|---|
| 目标、non-goals、成功标准、DoD | 总体一致，但“每一轮”高于当前 DoD；当前 readiness 过早 | M6；目标方案第 20、500–510 行 |
| 517 与 1,023 冲突 | 根因、证据和“不可只改常量”顺序正确 | producer `FULL_WINDOW_FACTS.total=517`；`reconciliation-probe.json:23-26`；目标方案 U1 |
| snapshot → path facts → adjudication → owner mapping → implementation → runtime → verification | 主链已描述；admission、receipt、handoff 和 baseline 仍未闭合 | H2、H3、H6、M4 |
| deterministic 与 semantic 分工 | 原则写对；evidence-only closure 与 confirmed authority 仍越界 | H1、H4 |
| source/runtime/provider/advisory/artifact/consumer/ownership | source/runtime 和 provider claim ceiling 基本清晰；OpenCode owner/test 与 advisory owner map 仍不足 | H8、M3 |
| mutation gate | source mutation 授权边界清晰；包级 admission 不能确定性验证 | H2 |
| verification gate | focused-test 和 claim ceiling 方向正确；owner receipt/semantic authority 不闭合 | H3、H4 |
| source/runtime gate | source-first、禁止手改 runtime、dry-run 与 apply 分层清晰 | 无新增 finding；目标方案 R7/KTD6/D6 |
| handoff gate | 内容要求存在，blocking primitive 或 loud convention 缺失 | H6 |
| knowledge-promotion gate | U5 保留现有 invalidation owner，未发现第二知识权威的必然引入 | 无新增 finding；执行时仍需按 receipt 验证 |
| schema/version/migration/compatibility | 旧 517 fixture 与 v1 reader方向正确；blob、receipt、状态合同不足 | H3、M1、M5 |
| idempotency/rerun/stale evidence | snapshot rebind 和旧 evidence 限制已写；首次 manifest、receipt stale 和多文件重跑仍不足 | H2、H3、H5、M2 |
| recovery/rollback/partial failure/concurrency | hunk/file rollback 和不清理用户 WIP 正确；artifact-set 原子性/并发未定义 | M2、M4 |
| workspace pollution | 明确不覆盖用户 WIP，但当前 baseline 必须重建 | M4 |
| 多宿主与 downstream consumers | 八宿主和主要 consumer 已枚举；缺逐层 claim-to-test 矩阵 | M3、H8 |
| package projection/runtime loader/真实宿主/field outcome | 方案正确区分 evidence ceiling；U6 的测试入口仍过宽 | M3、H8 |
| 最小实施顺序 | U0→U1→admission→owner→verification 的骨架合理；依赖图需统一 | H7 |
| 过度设计与重复机制 | 复用现有 reconciler、schema、owner，拒绝中心 runner 的方向合理；新增合同应保持 workflow-specific、最小 | H2、H3、H6 的修复边界 |
| 当前 WIP 一致性 | 初始 4-path snapshot 只能作为历史证据，不能作为当前执行 baseline | M4 |

## 当前 WIP 与方案描述的一致性

- 初始 snapshot 绑定 target HEAD `59cb4cb130a31bb1a2335add80d570b87a8b40d4` 和 4 个 dirty paths。`snapshot-supplement.json` 说明 dirty 内容未哈希，不能追补。
- intake 与 coherence reviewer 后续只读观察到 branch `feat/onboarding-workflow-routing-ux`、同一 HEAD、24 个 status paths：2 个 tracked modified，以及目标方案、`.agents/tasks/project-understanding-2026-10-27.md`、workspace cleanup artifact 和 CE validation 目录下的未跟踪文件。
- 方案第 438–440 行已经要求实施前重绑 dirty manifest 和 changed-file hash。该要求与当前事实方向一致，但应升级为 U1 前明确验收条件。
- 本聚合步骤只读检查了目标方案、指定 source skill/角色契约、相关 producer/schema/tests/docs、冻结 artifacts、adapter/catalog 和 package metadata。由于本步骤没有 shell/terminal 工具，未能在写报告前或写报告后实际执行 `git status --short`。因此，无法独立确认 reviewer 观察之后是否出现并发工作树变化。该限制不影响“本聚合步骤只写了本报告”这一工具级事实，但降低了全仓最终状态对比的保证。

## Reviewer roster 与隔离

| Slot | Persona | 主要视角 | 结果 |
|---|---|---|---|
| slot-1 | `adversarial-document-reviewer` | 架构、治理、owner/source-runtime、五类出口 gate、证据与替代方案 | `NEEDS_CHANGES` |
| slot-2 | `feasibility-reviewer` | producer、ledger/schema、阶段切换、失败恢复 | `NEEDS_CHANGES` |
| slot-3 | `coherence-reviewer` | 多宿主、downstream claim、单元依赖、WIP 与内部一致性 | `NEEDS_CHANGES` |

`cost-shape: profile=standard N=3 personas=[adversarial,feasibility,coherence] skipped_conditional=[scope-guardian:budget] doc_bytes=60218 slices=full isolation=min`

- `worker_dispatch_authorization: explicit`
- `worker_dispatch_capability: available`
- `worker_context_isolation: isolated`
- `worker_model_override: supported`
- `worker_bounded_parallelism: supported`
- 三个 reviewer 都使用 `gpt-5.6-sol`，不是 cross-model coverage。
- 隔离来自 workflow-native session topology，不是 `spec-doc-review` source skill 自己完成的 generic subagent dispatch。
- 三个 reviewer 均声明未读取兄弟 reviewer 输出；聚合前由当前步骤统一去重与冲突解析。

## 审查覆盖

- 完整目标方案的 Goal Capsule、Product Contract、Planning Contract、KTD、U0–U9、D1–D7、Interface Contracts、System-Wide Impact、Verification Contract、Failure Handling 和 DoD。
- 项目角色契约、AGENTS.md、source `spec-doc-review` skill、rendering floor、synthesis 规则和 findings schema。
- producer 关键符号：`FULL_WINDOW_FACTS`、`parseArgs`、`assertFullWindowFacts`、`validateAdjudicationArtifact`、`buildAdjudicationInput`、`buildPackageSummary`、`validateLedgerPatch`、`mergeLedgerPatch`、`mergeLedgerPatches`、`writeGenerated`。
- 三个 CE adjudication/ledger v1 schema，历史 517 fixture 和当前 reconciliation 单测的相关分支。
- 冻结 snapshot、supplement、path/commit/object inventory、probe、scope filter、candidate owner map、technical-plan verification 和当前 review report。
- Claude、Codex、Cursor、Kiro、Qoder、OpenCode、ZCode、Pi 的 registry/adapter 事实及 runtime capability catalog 的 evidence ceiling。
- plan/work/review/PR feedback/optimize/compound/write-skill/LFG 等方案点名 consumer 的存在与计划映射。

## 未验证项

- 未运行 Jest、typecheck、lint、smoke、integration、build 或完整测试。
- 未运行 JSON Schema validator；只读检查了 schema 和对应源码校验路径。
- 未执行 producer 新参数、runtime projection、runtime apply、doctor、真实宿主加载、真实模型、provider、外发、PR/CI、发布或 field outcome。
- 未逐条阅读 1,023 条上游净 diff，也未裁决 398 条候选 owner/action。
- 未确定 586 条 docs/tests 中有多少独立行为要求。H1 只确认当前计划允许在未做该判断时关闭。
- 未执行 Windows-native 验证。
- 未执行 final `git status --short`，原因见“限制与降级”。

## 冲突与假设

- 当前 source、contract、tests、只读 Git facts 优先于方案自述和 advisory artifacts。
- `historical-exclusions.json` 与 `candidate-owner-map.json` 仅作 advisory 输入，不能作为 confirmed semantic adjudication。
- `technical-plan-verification.json:status=passed` 只覆盖候选 join、路径存在、链接和 fence 等结构检查；其 limitations 明确未运行产品测试、fresh-source eval 或 runtime projection。
- 目标方案第 342、345–346 行已经解决“是否采用跨快照 patch”这一设计选择：本轮保留同快照 patch，source 改动后重建正式 ledger。聚合不再把该选择本身报为缺失。
- H1 的 cross-persona agreement 提高了对“计划缺口存在”的信心，不证明具体行为遗漏已经发生。
- `implementation-ready` 在本报告中表示当前文档自报状态，不表示本次审查同意进入 source mutation。

## 限制与降级

- 三个 reviewer 的工作流返回是自然语言报告，不是 `findings-schema.json` 要求的单一 JSON object。工作区内也未找到以三个 step id 命名的 JSON 文件。因此本步骤不能完成机器 schema validation，只能按 severity、confidence、finding type、fix 和 evidence 手工规范化。persona 覆盖事实有效，但 machine-readable envelope coverage 为 degraded。
- 没有外部 reviewer、cross-model reviewer 或现场验证。workflow-native 隔离只证明上下文隔离，不证明模型多样性。
- 本步骤没有 shell/terminal 工具，不能执行用户要求的最终 `git status --short`。报告使用 intake 与 coherence reviewer 的只读状态事实，并明确 freshness 上限。
- 本审查未修改目标方案、任何 source、generated runtime 或其他文件；未暂存、未提交、未 push、未创建 PR、未发布。唯一写入是本报告：`/Users/kuang/xiaobu/spec-first/.agents/tasks/2026-10-27-ce-upstream-sync-plan-review.md`。

## 写入边界

- **已写入：** `/Users/kuang/xiaobu/spec-first/.agents/tasks/2026-10-27-ce-upstream-sync-plan-review.md`
- **未写入：** 目标方案、`skills/`、`src/`、`scripts/`、`templates/`、`docs/contracts/`、tests、任何 generated runtime mirror、Git index 或远程系统。
- **未执行：** 暂存、提交、push、PR、发布、runtime apply、完整测试。

Review complete
