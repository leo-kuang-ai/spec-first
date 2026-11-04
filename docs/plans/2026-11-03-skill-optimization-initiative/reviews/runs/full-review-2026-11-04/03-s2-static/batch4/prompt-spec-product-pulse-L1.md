你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-product-pulse/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D03**（R2 fail）： `skills/spec-product-pulse/references/run.md:16-24`；`skills/spec-product-pulse/evals/fixtures/scripts/check-source-outcomes.sh:206-214` | 正文要求保留规范化来源状态，评测却硬性要求产物含 `failed`，可拒绝符合正文合同的报告，见 F3。 |
- **D05**（R2 fail）： `skills/spec-product-pulse/references/config.md:16`；`skills/spec-product-pulse/references/interview.md:234` | 默认时间窗的设置格式与读取枚举不一致，使同一配置存在冲突解释，见 F1。 |
- **B02**（R2 fail）： `skills/spec-product-pulse/references/config.md:16`；`skills/spec-product-pulse/references/interview.md:189-193,233-234` | 访谈允许捕获其他默认时长，读取合同却只接受四种值，设置输出不能稳定被后续运行消费，见 F1。 |
- **B05**（R2 fail）： `skills/spec-product-pulse/SKILL.md:51`；`skills/spec-product-pulse/references/run.md:59-63` | 每轮留存承诺使用分钟级固定文件名，但无重名检测或保留策略，同分钟重跑存在覆盖风险，见 F2。 |
- **X02**（R2 fail）： `skills/spec-product-pulse/references/config.md:16,26`；`skills/spec-product-pulse/references/interview.md:234` | 适用于持久配置及旧配置兼容；指标来源已有兼容处理，但默认时长的生产与消费合同仍冲突，见 F1。 |

## R1 完整评审
# spec-product-pulse 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-product-pulse/references/interview.md:183、skills/spec-product-pulse/SKILL.md:43,92 | 固定 top5/p99 不做配置的理由明确（report 无法可靠消费）、15m buffer 有 ingestion-lag 依据、Learn More 段解释设计意图；未发现过时或相互矛盾约束 |
| D02 | pass | references/interview.md:13-20,43,160-164,152 | SMART bar、engagement/value 判别测试、反模式话术、source-count 按比例判断、DB read-write 拒绝话术均为领域决策依据而非流程空转 |
| D03 | pass | references/run.md:14-24、references/report-template.md:70-80、evals/fixtures/scripts/check-source-outcomes.sh:207-215、tests/unit/spec-product-pulse-contracts.test.js:35-54 | 七态 receipt 合同 + post-write checklist + eval script judge 机械验证（failed≠zero、artifact 落盘、无远端写）+ 防虚假配置回归的合同测试 |
| D04 | pass | references/run.md:6、references/strategy-source.md:3、references/report-template.md:12、references/interview.md:125 vs 252 | Phase 1 编辑后强制重读 config、strategy 规则双端同源、metric 清单动态重读与 metric→source 映射持久化分离，无信息丢失/重复 |
| D05 | pass | SKILL.md:71、references/run.md:16,24、references/report-template.md:16,59,66,78、tests/unit/ce-localization-round-1-remediation-contracts.test.js:105-108 | 七态词表 5 处重复均由合同测试显式强制；PII/top5 等规则在各执行点可定位；未发现矛盾表述 |
| D06 | pass | SKILL.md:27、references/interview.md:140-142,212 | blocking question tool 条件式匹配+编号选项兜底、MCP 能力条件化+manual 降级、调度 primitive 缺失时给平台原生替代，降级路径完整 |
| D07 | pass | CHANGELOG.md:1898(v1.13.2 收敛虚假配置+防回归测试)、CHANGELOG.md:756(v1.15.3 拆 references+receipt 语义)、CHANGELOG.md:924(行为测评 91.0 零缺陷) | 失败→修订→防回归链完整可追溯（git log 7 次迭代），eval 资产可复用 |
| D08 | pass | SKILL.md:57、references/interview.md:3、references/strategy-source.md:3 | phase 级按需加载（258 行 interview 仅首跑载入）；strategy-source 禁缓存有新鲜度理由；config.md 37 行仅 Phase 0 载入 |
| B01 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:414-428、SKILL.md:82-88、CHANGELOG.md:922 | standalone_skill 双宿主八平台投射；`disable-model-invocation: true` 显式入口、不承担自然路由（有 CHANGELOG 记录其设计意图）；负边界五条明确 |
| B02 | pass | tests/unit/spec-product-pulse-contracts.test.js:23-66 等五文件断言逐条核对 | SKILL/references/模板全部引用文件存在且消费者测试断言与当前源码逐条命中；设计意图（Learn More）与执行规则分离清晰 |
| B03 | pass | SKILL.md:21,87、references/interview.md:152、references/setup.md:29、references/strategy-source.md:7 | 只读边界、DB read-write 硬拒、.gitignore 修改先提议、策略文档内嵌内容仅作候选不当作用户确认 |
| B04 | pass | skills/spec-product-pulse/（source）、skills-governance.json:414-428、tests/unit/specialized-skill-calibration-contracts.test.js:71-79 | 真相源在 `skills/`，投射条目可定位，host-neutral 与 `docs_root` 负例由测试锁定 |
| B05 | pass | references/run.md:10,24,34、references/strategy-source.md:5、evals/fixtures/repos/u28-outcomes/exports/analytics.json:1 | 失败七态分类、部分成功继续独立指标、DB gate 未开时发 not-configured 而非探测、unreadable≠absent；fixture 状态语义与合同一致 |
| B06 | pass | SKILL.md:19、references/report-template.md:70-88、check-source-outcomes.sh:118-129 | Done 定义诚实（“report completion is not proof that every source was available”）、checklist 可执行、eval judge 验证无远端写入 |
| X01 | not-applicable | SKILL.md:55-81 | 适用性理由：单时间窗报告生成流程（route→interview→query→report），无多模块分解、共享写面或长任务依赖编排需求 |
| X02 | pass | references/config.md:26、references/run.md:10、references/report-template.md:15 | config schema 演化（v1.13.2→v1.15.3）后的 legacy 兼容路径三处一致：不猜测映射、not-run+reason_code、不静默路由到 analytics |
| X03 | pass | SKILL.md:23、references/run.md:40-46、references/interview.md:152、references/report-template.md:10,75 | 接触 PII 与生产 DB 两个真实风险面均有控制：provider-side projection 三层防线+拒绝本地脱敏+DB 硬拒，风险与控制对账成立 |
| X04 | pass | references/report-template.md:59、SKILL.md:51,80、references/config.md:29 | 报告 footer 带 source refs/freshness/limitations、saved reports 构成跨会话时间线、schedule 跨会话状态有 config 持久化与显式确认门 |

## Findings

1. **[P3] interview.md:140 引用无来源的具体工具名 `search_mcp_registry` / `suggest_connectors`。** 本仓库 `src/cli/` 无同名实现，仅历史 validation 文档提及。后果：在无此工具的宿主上模型可能尝试按名调用不存在的工具（L140 的能力条件句与 L141 的兜底句已缓解，属低风险）。最小修复：改为能力描述（“宿主的 MCP 注册表查询能力（如有）”），或标注工具名来源。
2. **[P3] SKILL.md:78 “第三次及以后的 pulse run” 无判定机制。** `pulse_schedule: ask-again-after-3-runs`（config.md:29）的计数依据未落地——config 无 run counter，也未指明按 `docs/pulse-reports/` 文件数判定。后果：模型需自行推断触发时机，行为可能不一致。最小修复：一句话指明判定依据（如按 reports 目录既有报告数）。
3. **[P3] run.md:61 文件名分钟粒度，同分钟重跑静默覆盖前一份报告。** 与 “saved-reports folder 是团队工作记忆”（SKILL.md:92）的语义有轻微张力。最小修复：在 2.4 注明覆盖行为或加秒级后缀；或保持现状并接受（重跑修正场景下覆盖可接受，属可辩护的设计选择）。
4. **[P3·观察] evals 判定词表与 skill 合同词表不同构。** check-source-outcomes.sh:208-209 期望 `state: 'ok'/'failed'`，而 skill 的七态词表无此二值。该 envelope 由 eval prompt 自行规定（check-source-outcomes.yaml:6），不构成 skill 缺陷；但它意味着此 eval 验证的是 failed≠zero 语义等价物而非七态词表行为本身，按 D03 引用时应如实标注这一差距。

## 主责深挖面发现

- **D01（去补丁化）**：本 skill 是“约束不补丁化”的正面样本——固定 top5/p99 的不可配置决策附带了消费侧理由（interview.md:183 “adding such an option here would create a value the report cannot reliably consume on later runs”），且 contracts test:46-53 用负断言（`not.toContain('pulse_error_count')`）锁死回归；CHANGELOG:1898 记录这次收敛源于真实失败（配置了 report 无法消费的值）。无建议删除的约束。
- **D02（领域知识）**：interview.md 的知识密度高且非口号——engagement vs value 判别给了三类真实滑倒示例（L43），source-count check 按比例而非绝对数判断（L160-164）明确拒绝了机械阈值，DB 拒绝给了可执行替代路径而非只说“不行”（L152）。
- **D03（验证门）**：机械/语义分层干净——script judge 只验确定性事实（数值、路径前缀、无远端写），headlines 与 followup 的可行动性留给 LLM 判断，符合项目角色契约的 floor/judgment 分工。post-write checklist 是 prose 约定（无 runtime 强制），但关键不变量有 eval judge 与合同测试双层覆盖，静态层承诺可定位且内部一致。
- **D04（衔接）**：发现一处初看矛盾、细查成立的设计——interview.md:125 要求“每个 active strategy metric 记录 source 映射”而 L252 说“strategy metrics 不存 config、每次重读”。两者对象不同（映射持久化 vs 清单动态），config.md:26 的“Persist the resolved source identifier rather than relying on inferred metric classes across runs”补齐了理由，无实际断裂。
- **D05（紧凑性）**：三类重复（七态×5 处、PII×4 处、top5/percentile×4 处）分别对应不同执行点（询问期、汇总期、写前检查）或被合同测试强制，变更成本已被测试显式化（改词表必改 ce-localization 测试）；未发现“删除无损失”的冗余段落。体量 ~590 行对一个含完整首跑访谈的 skill 属合理。
- **D08（上下文效率）**：非首跑路径的加载链为 SKILL(93)→config(37)→run(66)→strategy-source(11)→template(91)≈298 行，258 行的 interview 只在 setup 载入；strategy-source 每次运行重读文件（禁缓存）是新鲜度对效率的显式取舍且有理由声明（L3）。

## 未读文件

- `evals/fixtures/repos/mini-ledger/`（README.md、package.json、src/server.js）：unconfigured-guides-setup 案例的仓库 fixture，judge 只验证提问行为，fixture 内容不影响静态合同裁决；未覆盖后果：无法核对该 fixture 是否还原了真实的“无 config”初始态（eval.yaml 已声明 `repo_fixture` 路径，风险极低）。
- `evals/fixtures/repos/u28-outcomes/`（README.md、exports/payments.json、prepare-eval.cjs）：fixture 机械部分，内容已被 check-source-outcomes.sh:199-203 的 SHA-256 固定；未覆盖后果：无法独立复核 hash 与文件实际字节的对应，不影响 skill 源码裁决。
- `scripts/evals/ce-u28-outcomes.cjs`：judge 生成器上游脚本，judge 头部已声明生成关系；未覆盖后果：无法核对生成器与 bundled judge 的一致性（属 eval 基建而非被审对象）。
- 三个 ce-* 消费者测试文件的非 pulse 测试段：断言对象为其他 skill，与本案无关。
- `docs/validation/ce-skill-audit-2026-10-28/skills/spec-product-pulse.md`：历史审查文档，按检查表纪律仅作线索不作证据，故意未读以免锚定。

## 结论一句话

spec-product-pulse 静态合同层整体健康：18 项中 16 项 pass、X01 不适用、0 fail，仅有 4 条 P3 观察（无来源的工具名、第三次运行的判定机制、同分钟覆盖、eval 词表差距），保持现状基本成立，前两条值得在下次触碰该 skill 时顺手修正。


## R2 完整评审
# spec-product-pulse 评审（R2）

## 逐项裁决表

本报告仅裁决 `structure_contract` 静态层。已确认 HEAD 为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`；完整读取目标 Skill 的入口、6 份 references、全部已跟踪 eval 文件及消费者清单所列 5 份测试。未执行被审 Skill、测试或评测，未修改文件；不据此判断行为质量、运行成本或现场收益。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-product-pulse/SKILL.md:43-53`；`skills/spec-product-pulse/references/interview.md:9-20` | 摄取缓冲、只读访问、隐私及一次追问上限均有明确任务依据，不属于无边界的模型能力补丁。 |
| D02 | pass | `skills/spec-product-pulse/references/interview.md:35-71`；`skills/spec-product-pulse/references/run.md:24-44` | 编码了参与与价值事件的区别、缺失不等于零、质量样本局限等领域知识，语义评分仍由模型承担。 |
| D03 | fail | `skills/spec-product-pulse/references/run.md:16-24`；`skills/spec-product-pulse/evals/fixtures/scripts/check-source-outcomes.sh:206-214` | 正文要求保留规范化来源状态，评测却硬性要求产物含 `failed`，可拒绝符合正文合同的报告，见 F3。 |
| D04 | pass | `skills/spec-product-pulse/references/setup.md:8-12`；`skills/spec-product-pulse/references/run.md:6-10`；`skills/spec-product-pulse/references/report-template.md:12-16` | 策略种子、设置后重读、显式指标来源映射与查询回执有连续消费路径，不强套 PRD 主链路。 |
| D05 | fail | `skills/spec-product-pulse/references/config.md:16`；`skills/spec-product-pulse/references/interview.md:234` | 默认时间窗的设置格式与读取枚举不一致，使同一配置存在冲突解释，见 F1。 |
| D06 | pass | `skills/spec-product-pulse/SKILL.md:25-29`；`skills/spec-product-pulse/references/interview.md:138-142`；`skills/spec-product-pulse/references/run.md:42-44` | 按实际宿主能力选择提问及数据访问方式，缺少连接或投影能力时明确降级，不依赖指定模型。 |
| D07 | pass | `tests/unit/spec-product-pulse-contracts.test.js:35-66`；`tests/unit/ce-localization-round-1-remediation-contracts.test.js:92-110` | 无自动知识晋升职责；已有针对固定性能形状、隐私投影和来源状态的维护检查，静态维护依据可定位。 |
| D08 | pass | `skills/spec-product-pulse/SKILL.md:57-71`；`skills/spec-product-pulse/references/strategy-source.md:3-8` | 按阶段加载细节、每轮重读当前策略，并复用已确定信息，未以摘要替代必要原文。 |
| B01 | pass | `skills/spec-product-pulse/SKILL.md:2-5,17-23,82-88`；`src/cli/contracts/dual-host-governance/skills-governance.json:414-427` | 明确为用户调用的独立时间窗报告 Skill，排除 shipped 汇总、告警和产品修改，不冒充内部 helper。 |
| B02 | fail | `skills/spec-product-pulse/references/config.md:16`；`skills/spec-product-pulse/references/interview.md:189-193,233-234` | 访谈允许捕获其他默认时长，读取合同却只接受四种值，设置输出不能稳定被后续运行消费，见 F1。 |
| B03 | pass | `skills/spec-product-pulse/SKILL.md:21,80`；`skills/spec-product-pulse/references/interview.md:94-104,140-152`；`skills/spec-product-pulse/references/run.md:40-42` | 明确只读数据源、拒绝读写数据库凭证、披露内容进入模型上下文并限制调度授权；未将数据源材料赋予授权权威。 |
| B04 | pass | `src/cli/contracts/dual-host-governance/skills-governance.json:414-427`；`src/cli/plugin-sync.js:159-204`；`skills/spec-product-pulse/SKILL.md:61-63` | 技能源码经共享生成路径投射到宿主，机器本地配置与固定报告路径另有归属；此裁决不声称实际 runtime 无漂移。 |
| B05 | fail | `skills/spec-product-pulse/SKILL.md:51`；`skills/spec-product-pulse/references/run.md:59-63` | 每轮留存承诺使用分钟级固定文件名，但无重名检测或保留策略，同分钟重跑存在覆盖风险，见 F2。 |
| B06 | pass | `skills/spec-product-pulse/SKILL.md:19`；`skills/spec-product-pulse/references/report-template.md:68-90` | 完成条件、产物检查及来源限制披露可定位，报告完成被明确限定为不代表所有来源可用；具体评测缺陷另记 D03。 |
| X01 | pass | `skills/spec-product-pulse/references/run.md:10-34`；`skills/spec-product-pulse/references/report-template.md:15` | 适用于多来源依赖场景：先解析来源、独立来源并行、数据库串行，未查询的新指标可返回局部查询步骤。 |
| X02 | fail | `skills/spec-product-pulse/references/config.md:16,26`；`skills/spec-product-pulse/references/interview.md:234` | 适用于持久配置及旧配置兼容；指标来源已有兼容处理，但默认时长的生产与消费合同仍冲突，见 F1。 |
| X03 | not-applicable | `skills/spec-product-pulse/SKILL.md:21,82-88` | 本 Skill 不承担高风险实现、发布、部署或回滚；生产数据读取风险仍在 B03/B05 审查，不因本项不适用而豁免。 |
| X04 | pass | `skills/spec-product-pulse/references/run.md:12-24,42-44`；`skills/spec-product-pulse/references/report-template.md:16,78-90` | 时间窗、来源身份、新鲜度及限制进入持久报告，评分内容不得进入 worker prompts；报告不是自动晋升的 durable knowledge。 |

## Findings

### F1 · P2：默认时间窗的写入范围大于读取范围

- **位置：** `skills/spec-product-pulse/references/interview.md:189-193,233-234`；`skills/spec-product-pulse/references/config.md:16`；`skills/spec-product-pulse/SKILL.md:35-41,63`。
- **事实：** 入口明确接受 `48h`、`72h` 等时间窗；访谈捕获一个默认值，配置示例允许 `other`。读取合同却将 `pulse_lookback_default` 限定为 `1h`、`24h`、`7d`、`30d`，入口同时要求非法配置使用文档默认值。
- **后果：** 用户在设置阶段选择的其他合法时长，可能在下次无参数运行时被当作非法配置而回退到 `24h`，报告窗口偏离已确认意图。
- **最小修复：** 统一默认时长与显式时长的验证合同；或者在访谈中明确只接受四种默认值，并同步配置示例。补一个“设置其他时长→无参数运行”的消费者检查。
- **归属：** 同一根因影响 D05、B02、X02，不重复计为三条 finding。

### F2 · P2：分钟级报告命名缺少碰撞处理

- **位置：** `skills/spec-product-pulse/references/run.md:59-63`；`skills/spec-product-pulse/SKILL.md:51`；`skills/spec-product-pulse/references/report-template.md:80`。
- **事实：** 保存路径仅包含本地日期和分钟；写入前没有检查已有文件、拒绝覆盖或分配唯一名称的规则。
- **后果：** 同一分钟的手动重跑、不同时间窗运行或并发调用会指向同一路径，不能可靠兑现“每轮报告构成时间线”的承诺。
- **最小修复：** 写入前检测目标是否存在；重名时保留旧报告并使用明确的唯一后缀，同步产物路径合同。无需引入通用锁或编排系统。
- **证据边界：** 已确认的是静态碰撞处理缺失；本轮未执行覆盖实验，不声称已发生数据丢失。

### F3 · P2：来源状态评测 oracle 与报告合同不一致

- **位置：** `skills/spec-product-pulse/references/run.md:16-24`；`skills/spec-product-pulse/evals/fixtures/repos/u28-outcomes/exports/analytics.json:1`；`skills/spec-product-pulse/evals/fixtures/scripts/check-source-outcomes.sh:206-214`。
- **事实：** fixture 的分析来源为 `state: failed`、原因为 `permission-denied`。正文要求报告保留规范化来源状态；judge 除检查返回 JSON 的 `failed` 外，还要求保存报告必须包含字面量 `failed`。
- **后果：** 一份正确保存 `permission-denied`、保留原因和窗口、且未将缺失转换成零的报告，仍可能被判失败。该问题影响评测有效性，不直接证明 Skill 实际报告错误。
- **最小修复：** 在生成器源 `scripts/evals/build-outcome-judges.cjs` 中修正对应断言，再重新生成 judge；分别验证返回 envelope 与报告的规范化状态，不要求报告复刻原始 provider 词汇。
- **复验条件：** 应接受规范化的 `permission-denied` 报告，并继续拒绝将该来源写成 `confirmed-zero` 的报告。

## 主责深挖面发现

### B01–B04：边界总体清楚，主要断点在配置往返

- **入口与职责保持现状成立。** governance 将其登记为八宿主的 `standalone_skill`，不是工作流 command；因此不存在 `templates/claude/commands/spec/product-pulse.md` 本身不构成缺陷。正向入口与“不是 shipped 汇总、不是告警、不是修改产品”的负向范围均有源码支持。  
  证据：`src/cli/contracts/dual-host-governance/skills-governance.json:414-427`；`skills/spec-product-pulse/SKILL.md:82-88`。

- **输入输出采用轻合同，而非强套主链路 YAML。** 当前实际合同是本地 `pulse_*` 配置、来源回执和 Markdown 报告；`core/08` 的主链路 schema、数量门槛及自动重试不应机械施加于此独立 Skill。F1 才是当前生产者与消费者之间可定位的真实不一致。  
  证据：`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:27-31,293-305`；`skills/spec-product-pulse/references/config.md:14-29`；`skills/spec-product-pulse/references/run.md:12-22`。

- **授权保护具有具体内容，不只是“只读”口号。** 设置阶段不收集凭证、不安装连接；数据库要求验证只读范围；质量评分披露模型处理并要求 provider 侧最小化；调度仅显式确认后交接。以上属于 prose 合同承诺，本轮不将其描述为运行时已硬强制。  
  证据：`skills/spec-product-pulse/references/interview.md:11,94-104,140-152,210-218`；`skills/spec-product-pulse/references/run.md:40-42`。

- **source/runtime 可追溯，但没有实际加载证明。** 源码目录发现、宿主登记和递归投射路径均可定位；本轮直接读取冻结 worktree source，没有把已安装镜像当被审真相源，也没有刷新 runtime。  
  证据：`src/cli/plugin-manifest.js:431-437,468-488`；`src/cli/plugin-sync.js:159-204,459-477`。

### X01–X04：采用实际职责，不扩张为全生命周期系统

- **X01：** 多来源查询已有拆分与依赖顺序，独立来源失败不阻止其他来源产出；无需补造多 agent 编排。共享报告写面的碰撞缺口按 F2 处理。  
  证据：`skills/spec-product-pulse/references/run.md:10-34`。

- **X02：** 旧指标来源缺失时明确不猜测，并提供局部恢复；这是应保留的兼容策略。默认时间窗应达到同样的一致性，修复重点是 F1，而非新增版本系统。  
  证据：`skills/spec-product-pulse/references/config.md:26`。

- **X03：** 不承担部署与回滚，故不要求新增发布检查；数据库权限和查询负载已有独立边界。  
  证据：`skills/spec-product-pulse/references/run.md:34`；`skills/spec-product-pulse/SKILL.md:87-88`。

- **X04：** 报告携带窗口、新鲜度和限制，十条质量样本不得外推总体质量，历史报告也没有被自动提升为权威知识；应保持这一 claim-scoped 设计。  
  证据：`skills/spec-product-pulse/references/run.md:12-24,42-44`；`skills/spec-product-pulse/SKILL.md:92`。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取未获工具权限，未绕过限制。后果是无法核对该全局文件可能包含的附加要求；不影响已读取目标源码与消费者之间的具体冲突证据。
- `scripts/evals/build-outcome-judges.cjs`：属于 F3 建议涉及的修复源，未展开读取；本轮仅确认生成 judge 的缺陷及其声明的生成器归属，不评价生成器内部实现。
- `src/cli/plugin-sync.js`、`src/cli/plugin-manifest.js`、`src/cli/adapters/claude.js` 的其余段落，以及其他宿主 adapter：只读取与目标发现、投射及路径处理直接相关的范围。未覆盖整个生成器和全部宿主转换行为，不声称跨宿主运行等价或 runtime 无漂移。
- `.claude/`、`.agents/skills/` 等已安装 runtime 镜像：本轮为冻结源码静态盲评，未进行镜像对账；实际加载版本与自然路由行为不在结论内。

目标 Skill 已跟踪文件和指定消费者清单内文件无未读项。测试与 eval 均只读未运行。

## 结论一句话

静态合同本轮不通过：确认默认时间窗往返不一致、报告重名缺少保护及评测 oracle 状态错配三项 P2 缺陷；入口职责、授权保护和 source/runtime 归属总体清楚，未据此推断行为或收益。


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
