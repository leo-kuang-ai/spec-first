# spec-prototype 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-prototype/SKILL.md:9-13`；`skills/spec-prototype/references/craft-floor.md:3-7` | 指导围绕“不伪造待验证维度”和真人体验展开，视觉底线按问题适用，没有要求所有原型执行完整生产流程。 |
| D02 | pass | `skills/spec-prototype/references/scoping.md:7-16`；`skills/spec-prototype/references/build.md:7-15` | 提供原型特有的保真度、比较宽度、媒介选择及生产隔离判断依据，产品选择仍归人而非脚本。 |
| D03 | fail | `skills/spec-prototype/scripts/light-webserver.js:146-154,241-249,283` | 停止操作会阻断身份未验证实例，但状态查询将其报告为 stopped，启动操作又可能绕过该状态创建另一实例，验证出口不一致。 |
| D04 | fail | `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/SKILL.md:40` | 已有选择、调整及 owning plan 的交接约定，但缺少交接来源版本、新鲜度和限制的稳定保留要求。 |
| D05 | pass | `skills/spec-prototype/SKILL.md:15-44`；`skills/spec-prototype/references/scoping.md:18-22` | 入口、条件引用、运行阶段和出口职责可定位；阶段明确不是持久化状态机，重复主要用于守护关键边界。 |
| D06 | pass | `skills/spec-prototype/references/build.md:9,13`；`skills/spec-prototype/references/preview.md:3,27,31` | 不依赖特定模型专属能力；媒介不能表达待测维度、临时存储和身份验证能力不足时均有明确限制或阻断约定。 |
| D07 | pass | `skills/spec-prototype/evals/eval.yaml:13-22`；`skills/spec-prototype/evals/cases/go-ahead-before-build.yaml:3-6`；`tests/integration/spec-prototype-human-journey.integration.test.js:59-132` | 无自动知识晋升职责，维护依据体现为入口、授权和预览隔离的聚焦回归资产；不据此推断实际行为已经通过。 |
| D08 | pass | `skills/spec-prototype/SKILL.md:11,17,40`；`skills/spec-prototype/references/scoping.md:7` | 视觉底线、写回引用按条件加载，仓库读取限于相关页面或流程，并要求复用对话及已有决策。 |
| B01 | pass | `skills/spec-prototype/SKILL.md:3,13,39` | 正向触发、产品发现负例、无人值守阻断及生产实现排除明确，公开入口不冒充内部 helper。 |
| B02 | fail | `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:39,179-187,192` | 构建约定要求每个问题使用子目录，但预览器只自动发现根下 `screens/` 的直接 HTML，目录布局和默认展示合同未接通。 |
| B03 | pass | `skills/spec-prototype/SKILL.md:35-39`；`skills/spec-prototype/references/scoping.md:7,20`；`skills/spec-prototype/references/preview.md:5` | 讨论不授权构建或服务，已有明确授权不重复索取，委派和 `.gitignore` 扩权均要求当前授权，禁止凭据落入产物及交接。 |
| B04 | pass | `skills/spec-prototype/references/build.md:3,13`；`skills/spec-prototype/SKILL.md:35,39`；`tests/integration/spec-prototype-human-journey.integration.test.js:9,54` | 被审源码与测试均指向 `skills/`，原型输出与生产源码隔离，没有要求修改 generated runtime；本结论不包含实际宿主投射验证。 |
| B05 | fail | `skills/spec-prototype/scripts/light-webserver.js:146-154,235-249,258-260,283` | 身份验证失败与确实停止被状态查询合并，重新启动可能覆盖仍活跃实例的状态文件，破坏恢复及后续清理的可追踪性。 |
| B06 | fail | `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:179-187`；`tests/integration/spec-prototype-human-journey.integration.test.js:26-45` | 当前消费测试只覆盖顶层单屏，未对账按问题分目录的构建交付，存在产物已生成但默认预览仍显示等待页的静态路径。 |
| X01 | not-applicable | `skills/spec-prototype/references/scoping.md:3,16`；`skills/spec-prototype/references/build.md:13` | 职责是有界产品问题的隔离探索，不承担多模块生产实施、共享写面编排或长任务集成；耦合流程仅影响原型大小。 |
| X02 | not-applicable | `skills/spec-prototype/SKILL.md:13,39`；`skills/spec-prototype/references/write-back.md:3` | 不实施生产 API、架构或版本迁移，只把体验决策交给原 owning artifact，因此不要求本 Skill 自行维护迁移、ADR 或兼容性协议。 |
| X03 | pass | `skills/spec-prototype/references/preview.md:5-7,25,31`；`skills/spec-prototype/scripts/light-webserver.js:27-35,156-172,252-279` | 对自身实际承担的本地执行风险，定义目录隔离、回环绑定、路径包含检查及身份绑定停止；生产发布和回滚不在其职责内。 |
| X04 | fail | `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/references/preview.md:27` | 有决策保留和接收 owner，但交接没有要求绑定来源版本、体验版本与限制，临时产物可失效却缺少相应的新鲜度核对。 |

## Findings

### F1 · P1：问题子目录与预览器发现规则未接通

- **位置：** `skills/spec-prototype/references/build.md:15`；`skills/spec-prototype/scripts/light-webserver.js:39,179-187,192`。
- **事实：** 构建引用要求在唯一运行目录下按问题建立子目录；服务端将展示根固定为 `<RUN_DIR>/screens`，首页只枚举该目录的直接 `.html` 文件。源码没有说明如何把问题子目录映射到展示根或默认首页。
- **触发与后果：** 按问题组织为 `<RUN_DIR>/question-a/index.html` 时，文件在服务根之外；即使组织为 `<RUN_DIR>/screens/question-a/index.html`，首页仍不会递归发现它，默认 URL 会显示等待页。原型构建完成不等于真人能从返回的默认 URL 体验它。
- **最小修复建议：** 在构建及预览引用中统一一种目录布局和访问合同，例如明确使用 `screens/<question>/index.html` 并返回对应完整 URL；不必为此增加递归“最新页面”选择器。
- **覆盖缺口：** `tests/integration/spec-prototype-human-journey.integration.test.js:28-35` 仅创建并访问顶层 `screens/screen.html`，不能覆盖上述合同路径。

### F2 · P1：身份未验证的活跃实例可能被报告为停止，并被重新启动覆盖状态

- **位置：** `skills/spec-prototype/scripts/light-webserver.js:146-154,241-249,283`；相关清理位置为 `skills/spec-prototype/scripts/light-webserver.js:239`。
- **事实：** `runningInfo()` 对“PID 不活跃”和“PID 活跃但身份信息无效或身份端点不可验证”都返回 `null`。`status` 将两者统一输出为 `stopped`；`start()` 对后一种情况也继续创建新服务。相反，`stop()` 在 `skills/spec-prototype/scripts/light-webserver.js:258-260` 明确返回 blocked。
- **触发与后果：** 原服务仍存活，但身份文件损坏或身份查询暂时失败时，再次启动可能新建第二个服务，并覆盖同一组 PID/身份文件。旧服务随后退出还会无条件删除这些共享状态文件，导致新服务失去正常的状态查询和停止入口。
- **最小修复建议：** 将探测结果区分为“已停止／身份已确认运行／活跃但未验证”，让 `status` 和 `start` 对第三种结果保留 blocked；退出清理前核对状态文件仍属于当前实例。
- **覆盖缺口：** `tests/integration/spec-prototype-human-journey.integration.test.js:59-82` 只验证未确认身份时的 `stop`，没有验证同一状态下的 `status` 和 `start`。

### F3 · P2：决策交接没有稳定绑定来源与体验版本

- **位置：** `skills/spec-prototype/references/build.md:19`；`skills/spec-prototype/references/write-back.md:3`；`skills/spec-prototype/SKILL.md:40`。
- **事实：** 决策胶囊要求记录问题、路径、胜出方案、理由、调整和开放问题；写回要求保留 owning artifact 并添加原型证据。但没有要求保存相关来源引用及其版本、真人实际体验的产物版本、新鲜度或适用限制。
- **触发与后果：** 已体验页面后来修改、上游计划变化，或临时目录被系统清理后，下游仍可能读取旧选择，却不能判断它针对哪个来源和哪一版体验成立。仅要求“读取 `decisions.md`”不能完成该判断。
- **最小修复建议：** 在现有胶囊和写回约定中增加轻量字段：owning source 引用及版本/时间、实际体验版本、未体验调整、限制和重新确认条件。沿用现有文件，不新增状态库。
- **边界：** 这是静态交接合同缺口，不是要求原型承担生产实现验证或 durable knowledge 晋升。

## 主责深挖面发现

- **B01——保持现状成立。** `skills/spec-prototype/SKILL.md:13` 将方向发现与有界原型问题明确分开；`skills/spec-prototype/references/scoping.md:14` 允许在已命名问题内部比较多个机制，两者并不矛盾，不应把所有“多方向比较”都误判成产品发现。
- **B02——主要问题是产物路径，而非缺少统一 YAML。** 输入可来自当前对话、brainstorm 或 plan，输出为原型与人类决策，见 `skills/spec-prototype/references/scoping.md:7`、`skills/spec-prototype/SKILL.md:44`。合同基线没有定义 prototype 专属 schema；不应把主链路拟议字段和数量门槛强加给它。实际不一致见 F1。
- **B03——保持已有授权连续性。** `skills/spec-prototype/SKILL.md:36` 与 `skills/spec-prototype/references/scoping.md:20` 既阻止讨论变写入，也允许已有明确构建授权继续生效。`awaiting-go-ahead` 不等于每轮必须重新审批。
- **B04——未发现反向修 runtime 的指令。** 当前资产以 `skills/spec-prototype/` 为源码，临时原型与生产源码明确分离。本轮没有读取或修改宿主镜像，也不据源码静态结论宣称宿主投射已验证。
- **X01／X02——不扩张职责。** `skills/spec-prototype/references/build.md:13` 已要求隔离复现不足时向 owning workflow 披露限制，而非擅自启动全应用或扩大生产写入；无需增加生产任务编排、API 迁移协议。
- **X03——安全机制值得保留，但生命周期状态应补齐。** 回环绑定、CSP、路径包含检查及 token-bound stop 均有源码实现；F2 是同一生命周期内的状态分类不一致，不应以删除身份验证来“简化”。
- **X04——决策记录不等于完整交接证据。** 现有胶囊能保留人类选择，但 F3 表明它尚不能稳定回答“基于哪个来源、体验了哪一版、何时需要重验”。

以上裁决仅针对 `structure_contract`。已逐一读取 Skill 全部 14 个文件及消费者清单列出的集成测试；未运行测试、预览或行为评测，不以此作为 fail 理由，也不声明运行通过。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，未读取。后果是无法核对该全局兼容入口中是否存在额外约束；不将其记为被审 Skill 缺陷。
- 指定 Skill 目录、检查表、合同基线、项目角色契约及消费者清单所列文件：**无未读项**。目录中没有 `templates/` 资产。

## 结论一句话

**静态审查不通过：入口、授权与生产隔离边界清楚，但问题目录到预览的交付合同、未验证活跃实例的恢复处理，以及决策交接的新鲜度仍存在可定位缺口。**
