你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-write-skill/` 的 5 个维度给出相反裁决（R1=pass / R2=fail），你需要逐维度核实源码后给出最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。可确定性核实的以源码为准。

## 待仲裁维度（R2 的 fail 论据）

1. **D04**：references/delivery-gates.md:17、scripts/validate-skill.cjs:172/224——交付要求同步 tests/docs/Changelog，而 preview consumer 禁止声明 Skill canonical root 之外的文件，合法完整交付无法绑定同一写集。
2. **B02**：references/authoring-workbench.md:35、references/delivery-gates.md:82、tests/unit/spec-write-skill-authoring-preview.test.js:122——semantic envelope 所需完整 changed-file 集与 preview 消费者约束冲突。
3. **B05**：references/authoring-workbench.md:44、scripts/validate-skill.cjs:174/180——partial failure、dirty overlap 和能力缺失的处理承诺不足。
4. **X02**：SKILL.md:23、references/authoring-method.md:104、scripts/validate-authoring-preview.cjs:144——版本与迁移保留规则在 contract/consumer/governance 变更场景不完整。
5. **X03**：references/delivery-gates.md:37、scripts/validate-skill.cjs:224/360——外部未知 package 高风险分支依赖的 validator 能力不足。

## R1（pass 侧）完整评审
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


## R2（fail 侧）完整评审
# spec-write-skill 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-write-skill/references/behavior-contract-design.md:7`；`skills/spec-write-skill/references/authoring-workbench.md:7` | 以可观察行为增量约束 prose，并允许非承重修订走短路径，没有将所有任务强制展开为完整设计流程。 |
| D02 | pass | `skills/spec-write-skill/references/authoring-method.md:74`；`skills/spec-write-skill/SKILL.md:41` | package 资源归属、迁移 disposition 和反模式有明确领域判据，机械事实与 LLM 语义判断分工清楚。 |
| D03 | fail | `skills/spec-write-skill/references/delivery-gates.md:17`；`skills/spec-write-skill/scripts/validate-skill.cjs:172`；`skills/spec-write-skill/scripts/validate-skill.cjs:224` | validator 承诺 no-follow，但发现根路径 symlink 后仍解析真实路径并继续读取，错误结果不能补救已经发生的越界检查。 |
| D04 | fail | `skills/spec-write-skill/SKILL.md:59`；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144` | 交付要求同步 tests/docs/Changelog，而 preview consumer 禁止声明 Skill canonical root 之外的文件，合法完整交付无法绑定同一写集。 |
| D05 | pass | `skills/spec-write-skill/SKILL.md:25`；`skills/spec-write-skill/SKILL.md:45`；`skills/spec-write-skill/references/authoring-workbench.md:13` | 分支、出口和条件读取可定位，复杂 map/topology 仅在改变决策时展开；不以篇幅本身判缺陷。 |
| D06 | pass | `skills/spec-write-skill/references/evaluation-design.md:18`；`skills/spec-write-skill/references/target-profiles.md:36` | 明确区分模型配置、source 适配、runtime 投射和能力验证；无模型调用授权或宿主证据时降级，不外推跨模型效果。 |
| D07 | pass | `skills/spec-write-skill/references/optimization-and-lifecycle.md:7`；`skills/spec-write-skill/references/evaluation-design.md:16` | feedback 先保持 observation，进入 regression 需要脱敏复现、预期确认与写授权，并保留 baseline、失效条件及不可推广状态。 |
| D08 | pass | `skills/spec-write-skill/SKILL.md:27`；`skills/spec-write-skill/references/authoring-method.md:55`；`skills/spec-write-skill/references/evaluation-design.md:30` | 先按 disposition 选择必要资料，inventory 不回传全部正文，读取证据按实际决策依赖要求，不机械追求少读。 |
| B01 | pass | `skills/spec-write-skill/SKILL.md:3`；`skills/spec-write-skill/SKILL.md:31`；`skills/spec-write-skill/evals/trigger-cases.json:55` | authoring/readiness、audit-only、纯安装及 runtime maintenance 的职责分支明确，近邻分支要求路由后停止。 |
| B02 | fail | `skills/spec-write-skill/references/authoring-workbench.md:35`；`skills/spec-write-skill/references/delivery-gates.md:82`；`tests/unit/spec-write-skill-authoring-preview.test.js:122` | semantic envelope 所需完整 changed surfaces 与脚本接受的单 package 写集不一致，且测试固化了这一限制。 |
| B03 | fail | `skills/spec-write-skill/SKILL.md:33`；`skills/spec-write-skill/scripts/validate-skill.cjs:172`；`skills/spec-write-skill/scripts/validate-skill.cjs:353` | 只读不升级 apply 的文案成立，但被信任 validator 对含 symlink 的目标根没有在读取前停止，违反外部 package 的 no-follow 信任边界。 |
| B04 | fail | `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:9`；`src/cli/adapters/opencode.js:49`；`skills/spec-write-skill/references/project-profiles.md:24` | source-first 原则清楚，但确定性 runtime 路径排除表遗漏实际存在的 OpenCode generated Skill root。 |
| B05 | fail | `skills/spec-write-skill/references/authoring-workbench.md:44`；`skills/spec-write-skill/scripts/validate-skill.cjs:174`；`skills/spec-write-skill/scripts/validate-skill.cjs:180` | partial failure、dirty overlap 和能力缺失有停止规则，但路径安全错误只累计 finding、不阻断后续检查，隔离失败路径未闭合。 |
| B06 | fail | `skills/spec-write-skill/references/evaluation-design.md:32`；`skills/spec-write-skill/evals/fixtures/scripts/check-mirror-refused.sh:8` | 交付合同要求根据可观察动作和产物判定，而自带 mirror 行为用例仅以最终文本关键词判通过，无法排除实际修改镜像的反例。 |
| X01 | pass | `skills/spec-write-skill/references/authoring-workbench.md:13`；`skills/spec-write-skill/references/authoring-workbench.md:19`；`skills/spec-write-skill/references/evaluation-design.md:13` | 多 owner/consumer、复杂资源调整和长时 loop 有按需分解、ArchitectureFit、checkpoint/recovery 评测要求，不强造编排体系。 |
| X02 | fail | `skills/spec-write-skill/SKILL.md:23`；`skills/spec-write-skill/references/authoring-method.md:104`；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144` | 版本与迁移保留规则存在，但涉及 contract/consumer/governance 联动的合法修订被 package-only 写集限制阻断。 |
| X03 | fail | `skills/spec-write-skill/references/delivery-gates.md:37`；`skills/spec-write-skill/scripts/validate-skill.cjs:224`；`skills/spec-write-skill/scripts/validate-skill.cjs:360` | 外部未知 package 是本 Skill 明确覆盖的高风险分支，而它依赖的 validator 未兑现根路径 no-follow；不是因为本轮未运行行为测试判失败。 |
| X04 | pass | `skills/spec-write-skill/references/optimization-and-lifecycle.md:7`；`skills/spec-write-skill/references/authoring-workbench.md:35`；`skills/spec-write-skill/references/evaluation-design.md:28` | 交接保留 source snapshot、scope、owner limitations 与 invalidation；fresh-source、独立 reader 和模型自述的证据边界明确。 |

以上裁决仅针对 `structure_contract`。源码版本为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作树检查为空；未运行测试、模型评测或 runtime 投射，未修改文件。测试文件用于核对当前断言，不作为本轮测试通过证据。`core/08` 未为本 Skill 定义专属输出 schema，其主链路拟议 YAML、计数门槛和自动语义裁决不直接套用。

## Findings

### F1 · P1：完整 source 交付与 preview 写集边界互相冲突

- **位置：** `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144`、`:187`。
- **事实：** 所有声明路径及 snapshot 文件都必须位于 `canonical_source_root` 内；但 `skills/spec-write-skill/SKILL.md:59` 和 `references/delivery-gates.md:82-86` 要求同步必要 tests/docs/Changelog，新增入口还涉及治理记录。
- **后果：** 以 `skills/example-skill` 为 canonical root 时，`tests/...`、根 `CHANGELOG.md`、治理 JSON 无法进入通过验证的同一写集；只修改 package 又不能完成项目交付义务。任意扩大 canonical root 还会破坏其“Skill source root”的身份及 canonical `SKILL.md` snapshot 语义。
- **消费者证据：** `tests/unit/spec-write-skill-authoring-preview.test.js:122-140` 明确断言 root 外文件失败，当前测试没有覆盖合法的跨 source surface 修订。
- **最小修复建议：** 保留单 repo、单 Skill owner，另外显式声明获授权的 supporting source paths；让 preview/snapshot/receipt 对这些精确路径统一绑定，而不是放宽整个 repo。补充“Skill + test + Changelog”正例和未授权相邻路径负例。

### F2 · P1：validator 对不安全目标根报错后仍继续读取

- **位置：** `skills/spec-write-skill/scripts/validate-skill.cjs:172-175`、`:180-189`、`:224-240`、`:353-360`。
- **事实：** 检出 root/ancestor symlink 或目标位于 authorized root 之外时，只追加 finding；随后仍调用 `realpathSync`，对解析后的目录执行 inventory，并单独读取 `SKILL.md`。直接 symlink root 虽跳过 walk，仍会进入该 `SKILL.md` 读取路径。
- **后果：** 外部 package 的链接根可以导致检查器读取链接目的地；授权范围检查也变成“读完再报告不合法”。最终 `fail` 并不撤销已发生的读取，违反 `SKILL.md:33` 的 no-follow 合同。
- **消费者证据：** `tests/unit/spec-write-skill-validator.test.js:266-289` 只断言结果为 fail，没有断言零 inventory/零目标读取。相邻 inspector 已有提前返回实现：`scripts/lib/package-inspection.cjs:131-134`。
- **最小修复建议：** root symlink、祖先 symlink、containment 失败或无法确认时，在任何目标内容读取前终止；补充读取 spy，断言不调用目标 `readdir`/文件读取，而不只是断言退出状态。

### F3 · P2：generated-runtime 确定性排除表遗漏 OpenCode

- **位置：** `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:9`、`:141`。
- **事实：** 排除表仅包含六组历史路径；实际 adapter 将 `.opencode/skills` 声明为 generated Skill/workflow root，见 `src/cli/adapters/opencode.js:49-55`。项目 profile 的 runtime 列表也仍停留在同样六组路径，见 `references/project-profiles.md:24`。
- **后果：** 即使其他 manifest、scope、snapshot 均合法，preview 也不会因目标位于 `.opencode/skills/...` 而报 `generated_runtime_path_forbidden`；source/runtime 边界只剩上游 LLM owner 判断兜底。这里不能声称脚本已覆盖当前项目的完整 runtime 边界。
- **最小修复建议：** 由项目 profile 提供当前受管理的 runtime 路径事实，并补上 OpenCode 负例；同步核对其余当前宿主。不要为了修路径检查引入 provider 行为判断。

### F4 · P2：mirror 拒绝用例可将实际写镜像的输出判为通过

- **位置：** `skills/spec-write-skill/evals/fixtures/scripts/check-mirror-refused.sh:8-11`；`skills/spec-write-skill/evals/cases/mirror-patch-refused.yaml:24-27`。
- **事实：** judge 只检查最终消息是否同时包含 source 指示词和任一“拒绝”候选词；后者包括 `runtime`、`mirror`、`init`，并不要求真实拒绝，也不检查文件变化或工具动作。
- **后果：** 类似“已修改 runtime mirror，后续可同步 source skills/”的错误交付同样满足判据；尝试写入后再声称拒绝也无法被检出。这是判据的静态假阳性，不是本轮推断出的实际行为失败。
- **最小修复建议：** 将拒绝语义判定与动作证据分开：核对目标镜像未修改、无禁止写入尝试，并要求正确 source/runtime 后续指引；只有最终文本时明确降格为文本冒烟检查，不作为边界行为通过证据。

## 主责深挖面发现

### B01–B04

- **B01：保持现状成立。** `SKILL.md:31-35` 将近邻路由、owner blocker、validate-only 和 apply 分开，`authoring-method.md:20` 进一步禁止近邻分支继续 inventory/validator。不能因为它提供 authoring 方法就将普通只读质量审查强行纳入。
- **B02：核心问题是写集合同，而不是输出字段不足。** `layer_result` 与五轴 readiness 在入口、references、fixture 和 contract tests 中有对应；F1 则使“完整 source patch”无法被当前 preview consumer 接受。
- **B03：授权 prose 值得保留，工具读取出口需要修正。** `SKILL.md:39-40` 不重复索取已覆盖授权，也不把 package 内 validator 当可信工具；`authoring-method.md:53` 禁止 validate-only 升级 apply。F2 是这些承诺在确定性读取路径上的具体断裂。
- **B04：source-first 原则成立，路径清单不足。** runtime 重建、catalog 生成和 maintainer-only evals 的边界明确；F3 不意味着所有宿主投射都错误，只证明 OpenCode runtime 未进入该脚本的拒绝范围。

### X01–X04

- **X01：保持现状成立。** `authoring-workbench.md:19` 优先判断独立证据方向、合并能力和协调成本，不按 agent 数建立固定 roster；长任务的 checkpoint/recovery 进入相应 eval family，不要求本 Skill 变成通用执行引擎。
- **X02：迁移判据可保留，但联动交付受阻。** `authoring-method.md:104-111` 对未知 sidecar 默认保留或人工裁决，避免清理式删除；真正阻断是 F1，尤其影响修改输出合同后同步 consumer/tests/governance 的场景。
- **X03：风险加严不是缺失，风险实现有漏洞。** `delivery-gates.md:29-42` 已覆盖外部包、高权限、外发和可分发 payload；应修 F2 的入口读取短路，不能继续增加安全口号代替。
- **X04：保持现状成立。** `optimization-and-lifecycle.md:7-9` 保留 handoff 所需 source、baseline、budget、stop、rollback 与 invalidation；无法复现的反馈不晋升 regression，失败产物也不自动成为 durable knowledge。

## 未读文件

- **本次指定必读范围无未读文件：** 已读完整 `SKILL.md`、全部八份 references、四份 runtime scripts/lib、全部 package 内 eval/fixture 资产、target sidecar、检查表、合同基线及消费者清单列出的十一份测试文件。
- `/Users/kuang/.codex/AGENTS.md`：读取权限未获批准，未尝试绕过；无法核对该全局文件是否还有额外约束。
- `src/cli/plugin-sync.js`、`src/cli/plugin-governance.js`、`src/cli/state.js` 及其递归依赖：未展开读取，属于消费者测试进一步引用的投射/应用实现；因此不声称当前全部宿主的实际投射与写入行为已验证。
- `src/cli/adapters/opencode.js:91` 之后及其余宿主 adapter 实现：仅为确认 F3 有界读取 OpenCode 路径声明；不对其余宿主是否存在同类遗漏或完整兼容性作结论。
- `docs/validation/2026-07-12-spec-write-skill-promotion/**` 等历史评测原始证据：未读取，不以旧 promotion 测试或历史通过状态证明当前行为质量、成本或收益。

## 结论一句话

本轮静态审查完成全部 18 项裁决；该 Skill 的职责、授权与评测分层设计总体清楚，但完整写集无法交付、validator 未兑现 no-follow、OpenCode runtime 排除遗漏及拒绝用例假阳性四项问题使其当前静态合同不能判为通过。


## 输出格式

对每个维度输出一行表格：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail。最后一段「修复建议」：fail 成立的维度给最小可维护修复。语言：中文。先读源码再下结论。
