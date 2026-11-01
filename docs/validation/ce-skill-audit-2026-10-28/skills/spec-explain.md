# spec-explain 能力融合审查

状态：`source_review_complete`。双方全部24个包内文件/768行全文审读；6个直接测试文件全文核对。包外已读接口按同hash复用，不冒充其所属Skill整包完成。独立审查和真实宿主行为未执行。

## 研发定位和融合判断

本地定位为可持久回收的深度教学；普通问答留Direct Lane。CE目前进一步承担供plan/work调用的理解服务，既可直接返回证据，也可生成教学材料。应吸收证据组织能力，保留本地明确的交付定位，不以CE入口变宽为由强制所有问答走解释workflow。

| 研发场景 / 能力 | 双方源码事实与既有增强 | 裁定与最小融合建议 | 验证、成本和边界 |
| --- | --- | --- | --- |
| 理解复杂执行路径 | CE `references/orchestration.md:38–46`及`references/agents/behavior-trace-scout.md`沿trigger、state、ownership、effect追踪，涵盖失败路径；本地`SKILL.md`和orchestration主要规定通用source grounding | **建议集成。** 在现有grounding中明确先inline追踪，只有ownership边界无法完整说明时才拆分证据；复用caller已有scope，不默认启动并发scouts | 高价值用于plan前理解现有代码、debug解释；需跨模块和失败分支fresh-source场景。dispatch仍由本地授权合同决定 |
| 为什么这样实现 | CE orchestration区分documented rationale / inference / unknown，要求查历史并确认历史约束仍适用，搜索为空不证明不存在；本地一般事实/推断分层更宽泛 | **建议集成。** 给现有解释结构增加理由证据与当前适用性，不新增历史知识schema | 防止把当前设计合理性推断写成作者真实意图；无历史证据就保留unknown，不能扩大到架构裁决owner |
| caller直接理解返回 | CE `SKILL.md:15,64–72`和intake末段可按请求直接返回evidence/constraints/unanswered questions；本地刻意durable teaching，完成后有destination选择 | **有条件吸收。** 相邻workflow可复用trace和inline内容；深度教学入口仍负责可回收artifact。明确请求直接返回时不强制菜单/改进offer | 不新增另一套mode或中央状态机；callee完成不替caller决定继续实施。无真实模型验证 |
| token和时间窗 | CE `references/intake.md:16–38`有reads-as-a-flag、移除会破坏句意则为普通prose、空值不作flag、自然语言时间窗等价；本地intake有colon prose提示但语义较粗 | **建议小幅集成。** 保留显式有效token优先，补自然时间窗，不把用户已给窗口静默改7天 | 以含冒号普通句、空token、since last Monday/显式range作行为回归；不做机械字符串parser替代语义 |
| HTML可回源引用 | 本地`references/explainer-html.md:40`禁止全部external URLs；CE对应29允许普通source hyperlinks，同时禁止外部资源请求 | **建议集成。** 禁止资源加载而允许普通引用链接，兼顾可独立阅读和溯源 | 不允许CDN、JS或远程图片；需检查渲染产物而非仅测试措辞 |
| recall与用户意图 | CE `references/check-in.md:7–14`用户no quiz/quiz优先、先问题后Answers；本地固定2–4项且不明确所有问题先于答案 | **建议轻量集成。** 用户意图优先、静态且不阻塞、问题先于答案；不固定数量 | 本地已具无阻塞教学，保留；不能为了教学再索取一次交互确认 |
| 视觉与读者归属 | CE renderers按consumer调深度/voice/layout，recap不可静默丢尾；本地每个load-bearing concept要求visual，已有audience自然语言适配 | **保留本地教学表达，按收益放松视觉硬指标。** 吸收不把他人工作归于用户及截短范围披露；`rendered_for`无明确consumer时不为parity增加metadata | 没有视觉/理解效果测量，不宣称图越少或越多越好 |
| destination provider职责 | 本地`references/destinations.md:1`仍指Phase6且对artifact工具统一假设nested skeleton/CSP、自行body-strip；CE按当前工具合同由provider适配canonical HTML | **建议集成provider边界与阶段名引用。** 交付canonical artifact，读实际工具schema，不假定所有artifact surface相同 | 不导入ht-ml/Proof/Thinkroom等发布面，不扩大外发；保留本地精确授权和`.spec-first/workflows/spec-explain/<run-id>/`持久恢复，ephemeral不是唯一副本 |
| 当前grounding成本 | 本地每次generic repo/stack orientation；CE更按任务证据组织，one targeted probe | **候选瘦身，待实测。** 有caller当前scope时优先消费其事实，仅补相关新鲜度 | 不能从行数或token估算推出效果；不能移除dirty/source身份必需边界 |
| eval结果覆盖 | 本地唯一case排除`docs/explainers`，实际durable fallback在`.spec-first/workflows/spec-explain/`；judge只查主题词；CE tests锁定caller/trace/flags/quiz/adapter等文本合同 | **建议优先补行为判据。** 检查真实artifact路径、无阻塞、caller不造文档、普通prose不误解析、trace遗漏失败路径。`asks-a-question.sh`不被本eval配置引用，不自动删除通用fixture | `explain-judge-probe.json`隔离创建实际fallback artifact并给主题词，judge仍exit0。首轮错误地传argv导致空message的失败已保留，修正为其真实env接口后复现盲区；不是完整eval通过 |

## 直接依赖与验证

完整读本地`specialized-skill-calibration-contracts.test.js`、`private-scratch-migration-contracts.test.js`、`fresh-repo-grounding-contracts.test.js`；CE `ce-explain-relocated-invariants.test.ts`、`ce-explain-behavior-trace.test.ts`、`ce-explain-routing.test.ts`。本地测试主要保护持久恢复、无内部标识和source grounding；CE也是prose合同，不能替代行为验证。已有同hash的pipeline与landing-context测试不重复运行。本项没有修改被审产品、没有网络发布或runtime刷新。

最小顺序：先补trace/理由证据分层和真实fallback路径eval，再修可溯源链接与provider适配边界，再按真实任务决定inline consumer入口及视觉策略。源码结论不代表完美融合；候选未实施，fresh-source模型/host验证未执行。所有问题未经独立validator，`validation_status: unresolved`。
