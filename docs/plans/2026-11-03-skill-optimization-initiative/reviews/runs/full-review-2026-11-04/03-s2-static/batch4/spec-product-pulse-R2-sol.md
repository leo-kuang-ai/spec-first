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
