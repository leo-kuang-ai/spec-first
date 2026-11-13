# spec-project-rules 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | CHANGELOG.md:946、CHANGELOG.md:1012、CHANGELOG.md:1022、evals/README.md:6 | 每条硬约束均可回溯真实失败（headless 挂起、真仓扫描器三缺陷、抽样矛盾、谣言改写 P1），当前各约束（headless/marker/抽样/verify）经交叉核对无相互矛盾，非补丁堆砌 |
| D02 | pass | references/mining-method.md:35-242、scripts/extract-deps.cjs:616、SKILL.md:86 | A1-A6/C1-C4/F1-F7/X1-X3/M1-M3 提供带检索式的领域取证知识与排除清单；脚本只出 facts、明确声明规则合成归 LLM，职责分层干净 |
| D03 | pass | scripts/extract-deps.cjs:623-631、tests/unit/spec-project-rules-scripts.test.js:195-444、evals/README.md:5 | --verify 违规边/失效 refs/别名扫描错误 exit 1 属确定性强制且有 22 个单测；preview 类 prose gate 由行为 eval 的红绿可证伪 judge 覆盖；唯一残留见 Findings #2 |
| D04 | pass | SKILL.md:56、SKILL.md:86、references/knowledge-format.md:74-117、SKILL.md:121 | 脚本→LLM（抽样清单 as-is 消费、L0 垄断枚举）、知识库→入口文件（内嵌+pointer+条件祈使尾行）、refresh→frontmatter source_commit 三条交接契约完整且相互咬合 |
| D05 | pass | SKILL.md:1-123、references/knowledge-format.md:3、references/mining-method.md:3、tests/unit/spec-project-rules-contracts.test.js:98-123,144-173 | 主文 123 行紧凑、两 reference 按阶段装载、关键规则可定位；headless 规则双写但被契约测试钉住（见 Findings #4） |
| D06 | pass | SKILL.md:81、CHANGELOG.md:926、evals/trigger-cases.json:66-116 | subagent 原语可选且有无原语顺序降级；双引擎行为 eval 10/10+10/10 有记录；路由负例 4 条覆盖兄弟 skill 边界 |
| D07 | pass | evals/README.md:6、CHANGELOG.md:1012、references/knowledge-format.md:140-141 | 有问题→修订→复验链（v1→v2 重写、谣言 P1→闸门硬化→全绿、真仓三缺陷→修复→25/25）；失效条件机制化（source_commit 基线、OUTDATED、verify） |
| D08 | pass | SKILL.md:77-89、SKILL.md:121、references/knowledge-format.md:130-131、references/knowledge-format.md:3 | 大仓按代表文件有界读取并披露实测成本锚点（14.7M tokens）；freshness 脏检测把重验收敛到 dirty_refs；CLAUDE.md ≤150 行用 native import 控常驻成本 |
| B01 | pass | SKILL.md:3、SKILL.md:23-28、evals/trigger-cases.json:66-116、tests/unit/spec-project-rules-contracts.test.js:29-38 | description 含 4 条 Do-not-use 负向路由且有对应 trigger 负例；standalone_skill 注册、不暴露内部 helper、不强迫串行全链 |
| B02 | pass | SKILL.md:30-48、references/knowledge-format.md:5-49、tests/unit/spec-project-rules-contracts.test.js:19-27 | 入口/reference/script/evals/治理注册一致；唯一不一致是 evals README 引擎口径漂移（Findings #1），不触及合同本体 |
| B03 | pass | SKILL.md:42、SKILL.md:44-45、references/knowledge-format.md:123、evals/cases/bootstrap-gold.yaml:12-14 | 目标仓只读+写入面枚举；上下文文本“已授权”明文不构成授权；eval 注入语自我声明为环境事实而非指令；首嵌交互确认 |
| B04 | pass | references/knowledge-format.md:149-151、tests/unit/spec-project-rules-contracts.test.js:19-27、CHANGELOG.md:1012 | 真相源在 skills/，产物明文禁止写 generated runtime 目录；双宿主投射经治理注册与镜像同步核验，skill 本身不碰 runtime 生成 |
| B05 | pass | SKILL.md:100-108、SKILL.md:70,80-87、scripts/extract-deps.cjs:309-315,399-405,170-187 | 7 类失败模式显式列举；分批断点续跑+冲突有界取证；git 不可用/churn 归零/freshness unavailable/scan_errors 全部有确定性降级路径；marker 幂等合入防重复执行 |
| B06 | pass | SKILL.md:56,66,87、references/knowledge-format.md:124、evals/README.md:7-9 | closeout 必含 scope/确认回执/limitations/抽样比例/继续命令；eval 资产自曝 judge 局限（staged 改动检测盲区）；“宁可少写不错写”约束过度交付 |
| X01 | pass | SKILL.md:68-89、SKILL.md:81 | 触发条件成立（>500 文件长任务）：骨架先行+分批增量+自适应分群+断点恢复+共享写面单文件合入纪律；并行直接复用宿主 subagent 原语不另造编排 |
| X02 | pass | references/knowledge-format.md:1、SKILL.md:108、tests/unit/spec-project-rules-contracts.test.js:130-141 | 格式有版本标识（v2）；v1 五文件遗留目录有明确迁移策略（不迁移不删除+交互确认+headless 跳过）；契约测试断言无 v1 残留文案 |
| X03 | pass | SKILL.md:43-47、evals/fixtures/scripts/check-bootstrap.sh:22-23、check-marker-coexist.sh:4-7 | 本 skill 的高风险面是共享入口文件写入与敏感泄漏：preview 门、marker 包络、三路敏感排除、judge 断言业务源码零改动，风险与验证对账成立 |
| X04 | pass | SKILL.md:66,87,121、references/knowledge-format.md:136-141、evals/cases/large-repo-batched.yaml:4-8 | 跨会话知识工作是核心职责：freshness/limitations/继续命令/closeout 回执齐备，失效条件（OUTDATED/verify/dirty_refs）与 owner 决策点（交互确认）保留 |

## Findings

1. **[低] eval 引擎口径漂移**。位置：`skills/spec-project-rules/evals/README.md:3` vs `skills/spec-project-rules/evals/eval.yaml:11`。README 写 "engine=codex"，eval.yaml 实为 `claude_code`（CHANGELOG.md:946 记录 2026-09-02 批量修正）。后果：维护者按 README 配引擎会误配，历史轮叙述与当前 manifest 混淆。最小修复：README 括注改为 "engine=claude_code（2026-09-02 由 codex 修正）"。
2. **[低] `--verify` 在 exit-2 降级路径被静默忽略**。位置：`skills/spec-project-rules/scripts/extract-deps.cjs:584-598`（该分支只消费 `args.freshness`，`args.verify` 无任何处置）与 `skills/spec-project-rules/SKILL.md:119-120`。后果：无工具链仓库运行 `--verify` 得到 exit 2 + 抽样 payload，source refs 存活扫描不执行且文档未披露该限制——而 refs 扫描只需 KB 文本（`collectSourceRefs`，extract-deps.cjs:421-454），在降级模式本可实现；降级+保鲜组合也无 eval 覆盖。最小修复：exit-2 分支在 `--verify` 时运行 missing_refs 子集（violations 置空并注明无依赖图），或在 SKILL.md 保鲜节显式披露降级模式下 verify 仅部分可用。
3. **[信息] “每模块 ≤8 且下限 2”措辞与极端形态细微出入**。位置：`skills/spec-project-rules/SKILL.md:56` vs `scripts/extract-deps.cjs:560-564`。下限 2 是配额下限，单文件模块实际采样 1 个文件；payload 以 `sampled_file_count` 如实披露，无行为损害。最小修复：措辞补 “（单文件模块以实际为准）” 或保持现状。
4. **[保持现状成立] headless/首嵌规则双写**。位置：`SKILL.md:43-45` 与 `references/knowledge-format.md:119-126`。两处当前逐句一致，且 `tests/unit/spec-project-rules-contracts.test.js:98-102,152-155` 把两份关键短语（`agents_embed_skipped`、“不构成授权”等）都钉住。授权类规则的防御性冗余 + 测试锚定，不建议去重。
5. **[过程注记] 消费者 input pack 为空**。位置：`.../evidence/input-packs/spec-project-rules.consumers.txt:1`（仅标题行）。仓库内实际存在直接消费者（`tests/unit/spec-project-rules-contracts.test.js`、`tests/unit/spec-project-rules-scripts.test.js`、`src/cli/contracts/dual-host-governance/skills-governance.json`、`scripts/check-ce-localization-review.cjs`）。后果：仅按 pack 审查会漏掉 B02 的 consumer 证据面；本轮已自行 grep 补齐并核读。建议修复 pack 生成逻辑。

## 主责深挖面发现（D01-D05 + D08）

- **D01**：该 skill 是“按失败证据演化”的正样本——四轮硬约束硬化各自对应可定位的真实失败记录（CHANGELOG.md:946 headless 挂起、1012 真仓 hszq-app 扫描器三缺陷、1022 抽样与“LLM 不枚举”矛盾的收口、evals/README.md:6 谣言改写 P1），未发现无失败依据的过度指导；唯一“过度”嫌疑（headless 规则的长度与重复）恰是安全底线，属可接受冗余。
- **D02**：领域知识与流程控制比例健康。mining-method 的条件取证维度（前端/移动/跨端/小程序）全部绑定“AI 默认会错”的私有约定假设并给出检索式；排除清单（mining-method.md:236-238、139-142、196-202、230-234）持续把通识挡在门外，与准入三问形成双保险。
- **D03**：验证门分层清晰——确定性层（exit 0/1/2、22 个单测、契约测试钉文案）与语义层（准入三问、内嵌筛选、冲突裁决归 LLM）无冒充；唯 exit-2 下 verify 的静默缺口（Findings #2）是确定性地板上的一个小洞。
- **D04**：最强的一面。脚本→LLM 的事实单向流（“不自创抽样”SKILL.md:56、“LLM 永远不做枚举”SKILL.md:86）与产物→消费者的回载链（pointer 尾行 knowledge-format.md:117 明确设计动机：“没有这行，AI 几乎不会主动跟随 pointer”）都写明了设计依据，非字段对字段的形式对账。
- **D05**：123 行主文承载了完整可审计的边界（Hard Boundaries 集中在 SKILL.md:40-48），每条可定位；长度诊断上无冗余章节，唯一的重复有测试锚定。
- **D08**：按需装载有明确的阶段声明（两份 reference 各自声明装载时机）；大仓成本口径诚实（给出实测锚点而非空承诺，SKILL.md:89）；freshness 的 dirty-focused 重验是真正的“少读但不少证”，符合“少读不自动等于更优”的判据。

## 未读文件

- `skills/spec-project-rules/evals/fixtures/repos/*/` 各 fixture 的业务源码细件（multi-end-fresh 的 apps/packages 源文件、plain-multidir-fresh 与 single-end-fresh 的源文件、各 fixture README/package.json 除已读 4 份外）：eval 数据面，judge 锚词已与脚本/知识库双向核对，静态合同裁决不依赖逐文件内容。未覆盖后果：无法逐 fixture 确认 judge 锚词（createClient/request）与源码一一对应——主要路径已被 with-kb KB、large prepare 脚本覆盖。
- `tests/unit/spec-project-rules-scripts.test.js` 全文（读了断言清单与关键 grep 段）：脚本行为已直接从 extract-deps.cjs 源码核对。后果：单测断言细节若有偏差不在本轮视野。
- `src/cli/contracts/dual-host-governance/skills-governance.json` 原文（经 contracts.test.js:19-27 断言间接验证）；`scripts/check-ce-localization-review.cjs`、`scripts/generate-ce-localization-closeout.cjs` 的引用点（CE 外围工具，不影响 skill 合同）；`tests/unit/project-graph-consumption-contracts.test.js`（mining-method 大仓候选导航相关合同测试）。

## 结论一句话

静态合同层健康：18 项全 pass、零 fail，脚本/LLM 职责分层与失败驱动演化轨迹在同类 skill 中是正面范例；两条低危缺口（eval README 引擎口径漂移、`--verify` 在 exit-2 模式被静默忽略且未披露）与消费者 input pack 空缺属可一线修复的维护项，不动摇核心合同承诺。
