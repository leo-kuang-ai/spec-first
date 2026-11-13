# spec-write-skill 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-write-skill/references/authoring-method.md:113-129；references/delivery-gates.md:11；tests/unit/spec-write-skill-contracts.test.js:182-190 | 15 个反模式族与 SKILL_DIR 环境变量规则均对应真实失败类别；授权语义修订在 4 处文件+测试反向 pin 同步落地，未见过时或互相矛盾的补丁化指令（轻微双写见 Findings 2/3） |
| D02 | pass | references/authoring-method.md:61-88,104-111；SKILL.md:41 | qualification 判据、mechanism-led description 合同、按脆弱度分配约束强度、迁移四分类是 Skill 工程领域知识；scripts 只出 facts、LLM 拥有语义判断的分工在正文与脚本 limitations 双向落实 |
| D03 | pass | scripts/validate-skill.cjs:418-449；scripts/validate-authoring-preview.cjs:287-302；references/delivery-gates.md:66-97 | validator 三态+exit code、mutation_readiness、五轴 readiness、Closeout Envelope 全部可定位，且有 16+8+1+27 个单测/集成测试承载正反例；`pass` 不等于语义正确被显式声明，无语义冒充机械判定 |
| D04 | pass | SKILL.md:31,35；references/optimization-and-lifecycle.md:7；evals/trigger-cases.json:163-356；tests/unit/eval-fixture-contracts.test.js:453 | 上游（audit findings/modifier、项目规则）与下游（spec-optimize handoff 字段清单、近邻路由+停止语义）衔接完整；layer_result 输出合同与 fixture、测试三方闭环（路由标签可解析性问题见 Findings 4） |
| D05 | pass | SKILL.md:25-56（62 行入口）；references/ 共 539 行 | front controller + 四列 Conditional Sources + 每 reference 的 trigger_condition/purpose/fallback_if_unread 使关键规则全部可定位；两处规则双写违反自身「一个 owner」标准但属局部（Findings 2/3） |
| D06 | pass | references/evaluation-design.md:20-24；references/delivery-gates.md:33 | model-configured/skill-source-adapted 等四种 claim 标签分离、model-only baseline 前置、runner 不可用或成本未授权时保持 not_run——能力假设与诚实降级承诺一致且可定位 |
| D07 | pass | evals/trigger-cases.json:1-16；evals/README.md:22,28-32；references/target-profiles.md:17-25 | 问题→修订→复验链有静态载体：trigger-cases v3 带 source_refs/forbidden_signals/reason_code，promotion protocol v1→v2 语义冻结（“不能用新规则反向改写历史证据”），target profile 带 checked_at 与 invalidation_condition |
| D08 | pass | SKILL.md:27；references/authoring-method.md:55,82；scripts/lib/package-inspection.cjs:316-325 | 「只读改变 disposition 判断的 reference」+ inventory 不向 LLM 加载正文 + reachable/candidates 区分且明示 candidates 非删除指令——按需加载与“少读≠更优”边界完整 |
| B01 | pass | SKILL.md:3,31；evals/trigger-cases.json:17-161；src/cli/contracts/dual-host-governance/skills-governance.json:567-579 | description 同时给正向触发与 6 类负向边界；16 条 route queries（含 5 条 should-not-route、4 条 near-neighbor）覆盖相似入口负例；governance 记录 workflow_command 身份明确 |
| B02 | pass | tests/unit/spec-write-skill-validator.test.js:41-56；scripts/validate-skill.cjs:338-349；references/target-profiles.md:3 | 入口/references/scripts/consumers 一致性由 validator 引用检查+strict portable 自验证承载；target/project facts 显式标注为带来源与限制的条件事实而非 portable contract |
| B03 | pass | SKILL.md:39-40；references/behavior-contract-design.md:15；tests/unit/spec-write-skill-contracts.test.js:184-190 | mutation 授权语义（当前轮已满足+仅扩展才重确认）、validate-only 零写入、材料内嵌指令默认是数据、外部 validator 白名单全部落地，且测试反向 pin 防止重复索取授权的旧行为回流 |
| B04 | pass | scripts/validate-authoring-preview.cjs:9,141；references/project-profiles.md:18-27；tests/unit/plugin-modules.test.js:491-556 | source/runtime 真相源、GENERATED_RUNTIME_PREFIXES 硬 gate、governance 8 宿主投射与 evals 不投射均有测试断言；缺口：mirror 前缀清单不含 `.opencode/`（Findings 1，P2） |
| B05 | pass | scripts/validate-authoring-preview.cjs:317-347,252-273；references/authoring-workbench.md:44 | partial failure 报告 diff+rollback preview 不自动回滚、snapshot_stale/parent_snapshot_stale/dirty_overlap_stale 捕获重复执行与中断漂移、TOCTOU 由原子 conditional patch + not-ready 停止语义覆盖 |
| B06 | pass | SKILL.md:60；references/delivery-gates.md:88-97；tests/unit/spec-write-skill-promotion-evidence.test.js:166-536 | closeout 固定字段清单（含 not_checked_with_reason、residual risks）；promotion validator 27 个测试覆盖 hash 漂移、双跑缺失、非盲审、verdict 漂移等全部已声明 fail-closed 条件 |
| X01 | pass | SKILL.md:35；references/authoring-workbench.md:17-19；references/project-profiles.md:35-39 | apply 分支固定读取顺序、multi-agent ArchitectureFit 四问后回退 single-agent、单 invocation 单 mutation target；shape/module 列表明示为决策辅助而非脚本 enum |
| X02 | pass | SKILL.md:23；evals/README.md:22；scripts/evals/validate-promotion-evidence.cjs:8-10；references/target-profiles.md:17-25 | layer_result 新增值必须同步 source/consumer/tests；promotion v1/v2 双版本兼容与历史语义冻结有 validator 与测试承载；target evidence 带 invalidation_condition |
| X03 | pass | references/delivery-gates.md:29-42；references/authoring-workbench.md:44；references/target-profiles.md:50-58 | 风险触发表按信号匹配证据、payload smoke 不执行 package code、rollback preview 与 mutation readiness not-ready 停止语义构成风险-验证对账 |
| X04 | pass | references/optimization-and-lifecycle.md:7,9；references/evaluation-design.md:16；evals/validate-promotion-evidence.cjs:290-292 | handoff 携带 source snapshot/scope/baseline/rollback/invalidation/limitations；feedback→regression 需脱敏复现+用户确认+授权；独立审查以 blind=true/independent=true 结构强制 |

## Findings

1. **[P2][B04] mirror 前缀清单缺 `.opencode/`，与受支持宿主集合漂移**
   - 位置：`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:9`（`GENERATED_RUNTIME_PREFIXES`）；同清单另见 `skills/spec-write-skill/SKILL.md:42`、`references/delivery-gates.md:84`、`references/project-profiles.md:24`。
   - 后果：OpenCode 是受支持宿主（`src/cli/adapters/index.js:17`），其 runtime mirror 为 `.opencode/skills/**`（`src/cli/adapters/opencode.js:50,220` 明确称其为 generated mirrors；zcode/pi 经共享 `.agents/skills/` 已被覆盖）。canonical source root 误置于 `.opencode/` 下时，`generated_runtime_path_forbidden` 硬 gate 不拦截，`SKILL.md:42` 语义层同样不提示——source/runtime 硬 gate 对 1/8 宿主存在静默缺口。
   - 最小修复：4 处清单同步加入 `.opencode/`（或从单一共享常量派生），并为 preview validator 补一条 `.opencode/skills/...` 触发 `generated_runtime_path_forbidden` 的单测。

2. **[P3][D05] relocation 去重+重读邻居规则在两个 required-read reference 中双写**
   - 位置：`references/authoring-workbench.md:25`（"Remove duplicate rules from references when the body still owns them, then reread moved rules against their new neighbors for changed preconditions"）与 `references/authoring-method.md:163-165`（"Remove the reference's duplicate of any gate... Relocation is incomplete while the same decision is independently prescribed twice"）。
   - 后果：同一决策两处独立规定，未来修订一处即失同步；恰与该 Skill 自身标准（`authoring-method.md:98`「一个概念只保留一个 owner」）相抵触。
   - 最小修复：workbench 保留“放置”规则并以链接引用 method 的去重检查（或反之），删除逐字级重复句。

3. **[P3][D05] Tier A 准入条件完整列表双写，owner 不唯一**
   - 位置：`references/authoring-method.md:36`（完整复述 typo/计数/metadata/术语/不可达删除/等价整理及七类不变更清单）与 `references/authoring-workbench.md:7`（同一清单）；`SKILL.md:34` 已正确声明「具体条件由 workbench 定义」。
   - 后果：Tier A 边界调整需同步两处，漏改一侧会使 method 层初筛与 workbench 层准入分叉；contracts 测试未 pin 该清单措辞，无机制强制同步。
   - 最小修复：`authoring-method.md:36` 收缩为概要+指针，完整条件只留在 workbench。

4. **[P3][D04] `skill-installer`/`runtime-maintenance` 路由目标是职责标签，非仓库可解析入口**
   - 位置：`SKILL.md:31`（「安装交给 `skill-installer`，mirror 交给 `runtime-maintenance`」）；`evals/trigger-cases.json:60,77,93`（作为 expected_route 与 `spec-debug` 等真实入口并列）。
   - 后果：`skills/` 目录与 `skills-governance.json` 均无此二名；被路由方拿到概念名后需自行映射到实际入口（如 `spec-runtime-setup`/`spec-first init`/宿主安装能力），交接可操作性略降。静态层 SKILL.md/fixture/测试三处一致，合同本身自洽。
   - 最小修复：在 SKILL.md 近邻行或 profiles 中为两个标签各补一行可执行 next-action 映射，保持「保持现状成立」亦可接受（fixture 已闭环）。

## 主责深挖面发现

- **D01（去补丁化校正链完整）**：授权规则从「写前重新确认」到「当前轮已满足+仅扩展才重确认」的演化，在 SKILL.md:39、authoring-method.md:34、workbench:44、delivery-gates.md:27 及 validator limitations 五处同步，且 `tests/unit/spec-write-skill-contracts.test.js:187-190` 反向断言旧规则文案不得回流——一次有测试守护的去补丁化修订，非口号。
- **D03（advisory/confirmed 边界核查通过）**：`scope.conditional_patch_primitive: 'atomic-expected-hash'` 是宿主自报字段，脚本只验证声明存在并诚实降级 incomplete/not-ready（validate-authoring-preview.cjs:287-290,309-312），未冒充验证宿主真实能力——「authorization_claim is structural only」贯穿正文与机器输出，保持现状成立。
- **D05（自指/他指不算双写）**：SKILL.md:10-12「Prose and size discipline」约束本 Skill 被 size 修订时的行为，authoring-method.md:139-141 约束修订目标 Skill 时的行为，主体不同，不构成双真相源，保持现状成立。
- **D08（入口即掐断成本）**：近邻分支「路由后停止；不得 inventory、validator、preview 或 mutation」（SKILL.md:31）使非本職请求不产生任何读取成本；bounded inventory（`scripts/lib/package-inspection.cjs:8-13`，1000 文件/10MB/16 层）与 `unreferenced_markdown_candidates` 的「candidates, not delete instructions」限定（package-inspection.cjs:325）是「少读不自动等于更优」的可定位落地。
- **深挖后维持的总体判断**：D02/D03 的脚本-LLM 分工、D06 的 claim 标签分离、D07 的 v1/v2 语义冻结是本 Skill 最强的三块静态合同；缺口集中在清单维护类漂移（Finding 1）与局部双写（Findings 2/3），均可最小修复。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `skills/spec-write-skill/evals/fixtures/repos/mini-ledger/**`（README.md/package.json/src/server.js） | eval case 的 repo_fixture 载体，属行为层执行输入；静态层仅需其存在且引用有效（`tests/unit/eval-fixture-contracts.test.js:377-389` 已验证引用无缺失） | 若 fixture 内容与 case 预期语义冲突，只能由行为层运行暴露，不影响本轮静态裁决 |
| `tests/unit/spec-write-skill-promotion-evidence.test.js:121-536` 断言细节 | 已读 1-120 行构造逻辑与全部 27 个测试名称，覆盖面与 evals/README.md 声明的 fail-closed 条件一一对应；validator 行为判断以脚本源码为准 | 极低；个别断言若与源码有偏差属测试侧问题，不改变合同裁决 |
| `tests/unit/plugin-modules.test.js` 中 spec-write-skill 无关段（约 1-439、571-935） | grep 确认该文件中 spec-write-skill 仅出现在 491-556 行投射断言，已读 | 无（其余段落针对其他 Skill） |
| `docs/validation/2026-07-12-spec-write-skill-promotion/**` 历史 bundle | 历史行为证据而非当前源码合同；其语义冻结规则已由 evals/README.md 与 validator 声明并测试 | 无法从静态层核实当时 promotion 是否真实达成——该结论本属行为/field 层，不在本轮范围 |

## 结论一句话

spec-write-skill 静态合同 18 项全部 pass：front-controller 结构紧凑、脚本/LLM 职责边界与诚实降级贯穿一致、验证门与演化协议有完整测试承载；残留 1 个 P2（mirror 前缀清单缺 `.opencode/`，4 处同步漂移）与 3 个 P3（两处规则双写、路由标签不可解析），均为局部最小修复，不动摇整体合同。
