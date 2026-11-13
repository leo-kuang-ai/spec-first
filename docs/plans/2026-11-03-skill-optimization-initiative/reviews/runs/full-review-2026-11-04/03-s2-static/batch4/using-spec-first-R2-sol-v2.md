# using-spec-first 评审（R2）

## 逐项裁决表

审查版本：`5b59293b`。以下裁决仅覆盖 `structure_contract` 静态层；已完整读取 Skill 包的 11 个文件、消费者清单列出的 15 个源码/测试文件、检查表与合同基线，并补读相关 owning contracts。未执行测试、行为评测或 runtime regeneration，未修改任何文件。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/using-spec-first/SKILL.md:18-30`；`skills/using-spec-first/references/public-route-map.md:33` | 保留活跃 owner、低风险短路径与必要排除条件，并明确语义导航不是关键词分类器或刚性状态机。 |
| D02 | pass | `skills/using-spec-first/SKILL.md:15`；`skills/using-spec-first/SKILL.md:50`；`skills/using-spec-first/references/conditional-routing-boundaries.md:11-14` | 路由充分性由 LLM 判断，工具只提供事实；provider 结果不能直接升级为结论。 |
| D03 | fail | `skills/using-spec-first/SKILL.md:42`；`skills/using-spec-first/evals/fixtures/scripts/check-r2-asks.sh:39-45` | 评测脚本只接受英文推荐字段，不能正确验收正文允许的本地化推荐输出。 |
| D04 | pass | `skills/using-spec-first/SKILL.md:12-16`；`skills/using-spec-first/references/public-route-map.md:17,33`；`skills/using-spec-first/references/conditional-routing-boundaries.md:48-49` | 当前意图、artifact 与 owner 连续性有明确消费规则，不强制串行阶段，跨 workflow 交接另有证据义务。 |
| D05 | pass | `skills/using-spec-first/SKILL.md:18-52`；`tests/unit/using-spec-first-contracts.test.js:34-49,105-124` | 入口保留短控制面，完整路由与条件边界分别下沉到两个可定位 reference，长度测试也明确不代表行为证明。 |
| D06 | pass | `skills/using-spec-first/references/conditional-routing-boundaries.md:32-39`；`src/cli/adapters/cursor.js:154-162`；`src/cli/adapters/kiro.js:123-132` | 不绑定特定模型能力，区分静态投射与当前会话能力；不支持或未知时保留 inline/serial 与宿主降级说明。 |
| D07 | pass | `tests/unit/using-spec-first-contracts.test.js:91-103`；`tests/unit/skill-flow-p2-closure-contracts.test.js:107-137`；`skills/using-spec-first/references/conditional-routing-boundaries.md:49` | 维护测试明确守护既有修订语义，知识晋升要求验证、适用范围和失效条件，没有承担未经支持的自动经验学习职责。 |
| D08 | pass | `skills/using-spec-first/SKILL.md:30,52`；`skills/using-spec-first/references/conditional-routing-boundaries.md:3-7,13,51-55` | 正文定义按需加载触发，安装项目不必寻找 source 仓库合同，已限定范围可直接读源码。 |
| B01 | pass | `skills/using-spec-first/SKILL.md:3,18-26`；`skills/using-spec-first/references/public-route-map.md:7-17,37-41,60-66`；`tests/unit/using-spec-first-contracts.test.js:146-160` | 正向触发、相似入口区分、活跃 worker 排除与 internal helper 隐藏都有明确静态约束。 |
| B02 | fail | `skills/using-spec-first/SKILL.md:13`；`skills/using-spec-first/references/public-route-map.md:38,40`；`tests/unit/using-spec-first-contracts.test.js:76-89` | 输出合同只枚举四类入口，reference 却明确允许特殊 route/handoff label 与 bounded source review，例外未进入输出合同。 |
| B03 | pass | `skills/using-spec-first/SKILL.md:14,26,44,50`；`skills/using-spec-first/references/public-route-map.md:43,60`；`skills/using-spec-first/references/conditional-routing-boundaries.md:21,32-35,43-44` | 路由不增加副作用授权，委派与维护需独立授权，已有任务授权又不会因入口选择被重复审批。 |
| B04 | pass | `skills/using-spec-first/references/conditional-routing-boundaries.md:7,18-22`；`src/cli/plugin-sync.js:197-204,728-750`；`tests/integration/init-six-host-lifecycle.integration.test.js:75-116,946-984` | source package、生成投射与漂移检查可追溯；安装指针不冒充源码，测试按当前宿主注册表检查投射。 |
| B05 | pass | `skills/using-spec-first/SKILL.md:30,34`；`skills/using-spec-first/references/conditional-routing-boundaries.md:13,33-39`；`src/cli/adapters/cursor.js:468-500` | 在入口职责范围内，低置信停止、可选 provider 降级、worker 不可用与非阻断启动提醒都有处置，不自行承担执行重试循环。 |
| B06 | pass | `skills/using-spec-first/SKILL.md:8,46,50`；`skills/using-spec-first/references/conditional-routing-boundaries.md:55` | 交付范围限定为入口选择，不把推荐、receipt 或文件存在当成功，也不借局部结果声称下游任务完成。 |
| X01 | pass | `skills/using-spec-first/references/public-route-map.md:11-17,33`；`skills/using-spec-first/references/conditional-routing-boundaries.md:30-35,41-44` | 适用于复杂任务的入口与协作边界：将分解和实施交给 owner，Tasks 可选，多仓副作用前需明确目标，不另造编排。 |
| X02 | pass | `skills/using-spec-first/references/public-route-map.md:11-13,37-40`；`skills/using-spec-first/references/conditional-routing-boundaries.md:18-22`；`src/cli/plugin-sync.js:624-637` | 适用于架构判断与入口/runtime 变化的路由面；方案、source revision 和 runtime regeneration 分开，兼容投射由 generator 处理。 |
| X03 | pass | `skills/using-spec-first/SKILL.md:22,50`；`skills/using-spec-first/references/public-route-map.md:60-64`；`skills/using-spec-first/references/conditional-routing-boundaries.md:20-21` | 高风险 surface 不走低风险短路径，发布与维护不因入口匹配获授权，完整绿 PR 路径要求用户明确请求。 |
| X04 | pass | `skills/using-spec-first/SKILL.md:20,44-46`；`skills/using-spec-first/references/public-route-map.md:54`；`skills/using-spec-first/references/conditional-routing-boundaries.md:46-49`；`tests/unit/spec-handoff-contracts.test.js:59-82` | 当前会话续办与跨会话交接明确分离，后者要求摘要、来源、新鲜度和限制，知识另受验证与失效条件约束。 |

## Findings

### R2-01 · P2：低置信路由评测错误拒绝合法的中文推荐

- **位置：** `skills/using-spec-first/evals/fixtures/scripts/check-r2-asks.sh:39-45`。
- **事实：** `oneRouteDecision()` 仅用 `^Recommended entrypoint:` 识别推荐，并要求“一个问题、零推荐”或“零问题、一个推荐”。但 `skills/using-spec-first/SKILL.md:42` 要求遵循仓库用户语言；同包的 `evals/cases/recommendation-only-format.yaml:7` 也明确说明中文模板字段合法。
- **触发与后果：** 输出合法的中文单入口推荐，例如“推荐入口：spec-ideate”，且没有问号时，脚本计算得到问题数和推荐数均为零，从而误判失败。这是静态可确认的 oracle 不一致，不是运行成本或未执行行为评测的问题。
- **最小修复建议：** 在该脚本的推荐识别中接受明确的中文字段变体，同时保留单入口、无提前执行的约束；增加英文推荐、中文推荐、单个澄清问题和多个推荐的正反例。不必引入自然语言分类器。

### R2-02 · P2：输出合同遗漏 reference 已明确支持的特殊路由结果

- **位置：** `skills/using-spec-first/SKILL.md:13`；`skills/using-spec-first/references/public-route-map.md:38-40`。
- **事实：** 合同声明输出恰好一个 public `spec-*` workflow、standalone skill、terminal command 或 Direct Lane；reference 则明确规定生成镜像请求输出 `runtime-maintenance` route/handoff label，源码质量只读审查输出 bounded source review。`tests/unit/using-spec-first-contracts.test.js:76-89` 还专门守护这些特殊语义，说明它们不是偶然残留。
- **后果：** 仅依赖合同摘要的调用者无法完整理解合法输出集合；按 reference 正确拒绝镜像补丁并返回维护标签时，反而不满足摘要的字面合同。只读源码审查的路径也存在相同分类缺口。
- **最小修复建议：** 在输入输出摘要中明确这两类结果如何归属现有入口类型，或显式登记特殊 handoff/review 结果及接管责任；同步添加合同对账断言。无需新增 workflow、状态机或产物 schema。

## 主责深挖面发现

### B01–B04：职责、授权与来源边界总体成立

- **入口不重建主链路。** `public-route-map.md:17,33` 明确不自动串联阶段，活跃 workflow 继续拥有失败反馈和后续交接；不应为入口 Skill 增加 PRD、任务拆分或实施验收功能。**保持现状成立。**
- **只读质量审查与包编写职责已区分。** `public-route-map.md:40` 没有把所有 Skill 审查都推给 `spec-write-skill`；需要修正的是该合法路径与摘要输出类型的对账，而非删除这条短路径。
- **路由匹配不是授权凭证。** `SKILL.md:14,26,50` 与 `conditional-routing-boundaries.md:21,32-35` 分别限制维护、委派及其他出口；`public-route-map.md:60` 进一步拆分 PR 反馈的本地修复、commit、push、回复与 resolve。未发现以 workflow 名称扩大权限的静态承诺。
- **source/runtime 具有真实消费者支撑。** `plugin-sync.js:197-204,728-750` 从 source 生成并检查完整支持文件；`instruction-bootstrap.js:63-87` 只报告 managed block 与安装入口存在，不声称模型已成功加载。Cursor/Kiro 的 loader 缺口和 Qoder 的 hook 降级也没有被当作 drift 或成功运行证据。**保持现状成立。**

### X01–X04：扩展场景应守住入口责任，不扩张为执行框架

- **X01：** 复杂依赖与长任务需要由 plan/work owner 分解，入口只负责选路、保持 owner 连续性及约束委派、多仓目标；现有静态职责足够，不要求入口新增 wave、锁或恢复数据库。
- **X02：** API 兼容、ADR、迁移和回退属于所选 owner 的方案义务。入口已经区分 source revision 与 runtime regeneration，不能因未在本 Skill 内重复实现这些流程而判失败。
- **X03：** 高风险实现仍受敏感 surface 排除及五类出口约束；绿 PR 和 runtime removal 都没有被自动启动。这里的通过只说明合同边界存在，不证明宿主已机械强制全部出口。
- **X04：** `conditional-routing-boundaries.md:48-49` 对交接与知识提供不同晋升条件；`spec-handoff-contracts.test.js:59-82` 又检查只读恢复、用户选定来源及内嵌指令隔离。普通续办无需强制创建 handoff。**保持现状成立。**

合同基线 `core/08-skill-contract-protocol.md` 已完整读取；其中主链路 YAML、数量阈值与自动重试未被套用为本入口的新要求，依据为检查表 `process/REVIEW-EXECUTION-WORKFLOW.md:45,62`。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求未获工具权限，未绕过限制重试。该文件不是用户指定的被审源码、检查表、合同基线或消费者文件；未覆盖后果是无法核对其中可能存在的额外全局执行偏好。当前已提供的语言、只读与审查范围要求均已遵守。
- **本轮指定必读材料无未读项。** Skill 包全部文件及消费者清单所列文件均已读完；未读取其他评审者输出或历史裁决来形成判断。

## 结论一句话

静态审查完成：18 项中 16 项 pass、2 项 fail，需修正本地化评测误判与特殊路由输出合同缺口，其余入口职责、授权、source/runtime 及扩展场景边界成立，但不据此宣称行为质量或实际收益已验证。
