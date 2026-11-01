# spec-brainstorm 全量源码对照审查

- 状态：`source_review_complete`，仅代表全文源码比较与融合裁定，不代表实施、独立审查或真实模型效果。
- 双方包内58个文本文件、10372行均已逐段读完；同hash的先前全文记录明确复用，截断另行补读。包含本地全部eval/fixture、双方全部references、CE 1275行display helper、737行packs resolver、288行elevation dispatcher与2594行peer runner。逐文件账见 `../file-tables/spec-brainstorm.md`。
- 本地源为 `skills/spec-brainstorm/`，CE源为 `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-brainstorm/`。直接核对plan intake、settlement维护源、prototype、ideate和LFG调用接口；未运行真实模型、Slack、浏览器服务或外发。

## 意图与完整执行链

共同职责是把未定WHAT收敛为可供planning使用的需求：恢复/领域分类→来源定向→问题与场景澄清→方案权衡→synthesis→是否需要文档→requirements-only Product Contract→review/plan/prototype等交接。HOW与执行不归此owner。两方都支持非软件分支，但本轮融合判断聚焦研发，不扩展庆典等非研发产品面。

本地优化并非少同步了一套CE runtime：它已将视觉决策回归会话、把runnable feel question交给prototype，并增加当前用户产品确认、source-first、场景durable landing、恢复证据、dispatch授权和知识候选边界。CE新增的视觉/跨模型基础设施不能覆盖这些优化。

## 能力对照与融合裁定

| 研发场景 | CE源码事实 | spec-first现状 | 裁定、最小融合点与验证 |
| --- | --- | --- | --- |
| 不把提出的方案当真实目标 | `synthesis-summary.md:35`先陈述The problem，标注推断；`brainstorm-sections.md:39-54`将outcome与Means分行 | 本地synthesis`:31-45`从What we're building开始；Goal Capsule只有objective/authority/blocker | **建议吸收**问题复述和outcome/means区别，不新增阶段或必填长模板。用方案措辞输入但真实目标不同的任务检验，用户能纠正假设，R/AE对应目标 |
| 不重问已审视的选择且保留来源 | CE synthesis`:23,37,145`明确Stated-with-provenance、Carrying forward、settled例外路由 | 本地主入口、plan-write和shared settlement已有更强单owner；synthesis`:263-265`仍为通用Stated→Requirements / Inferred→Key Decisions，无例外 | **建议闭合本地已有协议**：增加settled路由例外，不将确认决策弱化为inferred/assumption；保留产品KD/技术KTD owner。验证ideate已审视选择、冷directive、agent自拟三类输入 |
| 无需产物时不虚假承诺写文件 | CE synthesis`:46-48,71`对no-doc明确destination且不硬编码下游动作 | 本地sections有doc-need判断，synthesis`:45,51,216-224,258`却普遍承诺写plan | **建议吸收**条件文案，使用本次已确定目的地；不把确认写文件当唯一完成出口。验证用户拒绝文档、轻量直接planning、需要durable artifact三条路径 |
| 防止建议悄悄扩大范围 | CE `interaction-rules.md:29`区分必要保障、提前落害和昂贵但非必需选项 | 本地有YAGNI、scope/carrying-cost思考，无同等明确默认推荐标准 | **建议窄吸收**推荐标准；不得据此缩减用户要求或漏掉必要安全约束。以audit trail/alerts/operator process等可选扩张检验，不硬编码脚本 |
| 规则只有一个规范落点 | CE sections`:134-145,220-229`以R-ID为normative owner，KD为选择索引与Governs | 本地SKILL已指定KD为产品决策单owner，sections`:178-182`要求decision+rationale，共享协议和tests固定此分工 | **保留本地owner**，只吸收cite-not-restate原则。不可直接迁移CE R-owner产生双owner；检查重复阈值/默认值是否漂移 |
| 拆分后不丢整体关系 | CE sections`:243-255`持久化work relationships，非线性关系才画图，不是master roadmap | 本地phase-0已有coherent-work和separate acceptance；plan intake仍是一份Product Contract，未见同名marker消费者 | **有条件吸收关系内容**到既有scope/context；不单独引入`ce-section` marker或registry。确有plan/doc-review机器定位需求再成对设计consumer |
| 并发写文档不覆盖 | CE plan-write`:18`用exclusive creation与collision suffix | 本地plan-write`:16`和入口固定每日NNN，无exclusive reservation动作 | **吸收原子预留原则，保留本地命名**，碰撞重分NNN，不搬取消日序号方案。当前为prose协议，未声称复现确定性writer bug；将来用并发fixture验证 |
| 视觉判断与运行体验分工 | CE visual-probes逐视觉决策先offer，临时HTML+display server，Rule7转prototype | 本地dialogue用表格/状态序列/ASCII/只读截图，不生成HTML/CSS/JS；handoff由prototype承接运行体验 | **保留本地设计**，不恢复退役helper；吸收“明确判断内容、忽略细节、没解决再升级prototype”的反馈语义，不新增第二canonical UI artifact。视觉收益未测 |
| 技术选择需要更强推理 | CE reasoning-elevation解析当前intent、native→CLI→inline，dispatcher核对requested/served，runner管理生命周期 | 本地approaches已限定授权和实际model/isolation，inline不冒称fresh/independent，无通用作业runtime | **主要等价边界已有**；可借receipt和失败分类，不导入通用runtime。must-use条件不满足应blocked；model偏好不授权worker/跨provider数据访问 |
| 交互producer返回caller | CE handoff`:10-36`新增`mode:return-to-caller`、artifact/brief/key_decisions | 本地无此入参，LFG `plan-brief.md`直接接artifact；现有return-to-caller是work→LFG | **暂缓**。有真实caller再成对引入，brief不能冒充work source；不复制孤立JSON字段 |
| 组织上下文与恢复 | 双方Slack reader全文thread、bounded搜索与摘要；CE handoff传scratch dossier | 本地增加durable source refs/snapshot/limitations/invalidation/next question、唯一当前用户产品确认、不写glossary/ADR | **保留本地增强**。Slack helper中authenticated→private search freely及silence→consent旧文案不产生授权或确认事实，按parent scope检索，沉默只作弱线索 |

## 源码冲突与限制

1. **本地synthesis的no-doc/settlement闭包不足**，准确段落及最小建议见上表。是已确认文案冲突，不代表本轮执行已写出错误需求文件。先补这两处，不再建schema。
2. **CE lifecycle/readiness、pipeline和路径约定不能整包覆盖。** 本地readiness与Markdown status正交，HTML无lifecycle；plan `SKILL.md:74-86`明确settled owner与Product Contract byte preservation，intake消费本地metadata。取消日序号、改状态或取消pipeline Markdown会破坏既有consumer。
3. **CE runner terminal不等于语义成功。** `peer-job-runner.py:1197-1220`及`:2441-2473`可因非空result判done；consumer仍需检查worker status、served-model receipt与内容，不得把生命周期当研究/产品充分性证明。
4. **CE stale cleanup是待验证风险。** runner`:1918-1947`按sibling root age清理，本轮未验证长时活跃作业，不列为confirmed进程缺陷。将来采用须验证run ownership、live job与race，当前run不得清理别人的工作。
5. **CE display远程分支不适合作本地默认。** visual-probes`:117`建议0.0.0.0无认证；本地不引入该分支。选择视觉不代表额外network exposure授权。
6. **eval结果判断仍弱。** clear-req只看聊天含docs/plans和-plan.md；verdict只看spec-pov，不能证明正确交接；check-r2-asks用关键词，表末两个ASCII问号且“说明”陈述也可通过；部分case仍把`.claude/skills/...`当source。未来检查真实产物/metadata/副作用并加入settlement/no-doc结果，不以本轮静态测试宣称真实eval通过。

## 验证与最小落地顺序

实际4 suites/16 tests全通过：spec-brainstorm-contracts、spec-brainstorm-clarification-contracts、spec-brainstorm-visual-retirement-contracts、settled-decisions-contracts。证据 `../brainstorm-tests.log`、`../brainstorm-tests.json`。这些证明静态合同和临时projection，不证明对话质量、真实宿主或研发收益；无独立reviewer、真实Slack/跨模型/Windows/browser运行。

先闭合settled/no-doc文案，再增加problem/outcome与推荐范围标准，再用真实产物eval检验source→决策→planning fidelity。原子预留与work relationship随真实写入/消费需求追加；visual helper、通用跨模型runtime、caller-return暂缓。不恢复自动知识写入，不扩授权，不建立强状态机。
