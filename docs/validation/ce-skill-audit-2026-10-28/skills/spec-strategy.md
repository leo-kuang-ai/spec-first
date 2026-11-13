# spec-strategy 能力融合审查

状态：`source_review_complete`。双方18个包内文件/964行全文审读；首次大输出中部截断后，已分读完整补齐interview、template、update及CE入口/grounding。直接消费接口包括双方pulse setup/report和本地strategy-source，均全文核对；其他下游整包归各自主表项。

## 定位

双方都维护根目录共享STRATEGY.md，以用户真实取舍为答案，仓库只帮助提问；不以近期commit推断产品转向。它是研发工作的方向输入，不承接feature排期、实现计划或指标查询。本地保留Target problem / Our approach / Who it's for / Not working on / Marketing标题，CE改用Purpose / Positioning / Users / Boundaries / Brand；这是本地consumer稳定性选择，不是同步缺陷。

| 研发能力 | CE源码事实 | 本地事实与融合裁定 | 最小建议、验证和代价 |
| --- | --- | --- | --- |
| 有证据的策略访谈 | grounding全文区分意图/结构与近期attention；interview规则6由repo sharpen question而非代答 | 本地grounding5–11和interview末段已有等价约束；**保留**，空仓库正常继续，不强制建立profile | 不增加中央repo model缓存；测试需观察引用与用户答案，关键词不能证明真读 |
| 定位的可判别性 | CE interview第二节增加“nearest competing product could truthfully say it”反问 | 本地已覆盖fluff、feature list、产品描述、goal、并行方向、与问题脱节；**窄化吸收邻近替代方案检验** | 在现有pushback例子加一条，适合技术产品区分harness价值；不需要新表或外部竞品research gate |
| 压力测试质量 | CE interview119–131要求3–5个真有两种可能的提案、避开显然on/off strategy、一提案一轮，不增sections吸收矛盾 | 本地interview末段已具压力测试和两轮cap；但未明确避开foregone conclusion。**建议吸收判别质量标准**，不机械硬化提案数量 | 用诱人相邻feature、第二persona、资源挤占验证是否真能改变approach/tracks；未运行模型 |
| 可复用的拒绝原则 | CE interview135–141及template46从被拒提案生成“Resist a change when...” | 本地Not working on记录具体排除项，没有跨提案原则。**建议可选吸收**，由已明确拒绝事实提炼并让用户纠正，不凭空造禁止项 | 留在现有Not working on正文一行，无新heading/schema；下游仅作为advisory，不脚本化语义门禁 |
| 文档ownership与迁移 | CE update7–31：solely/multi-writer、author-approved、prose-only、全节drift、targeted body保护；fold/link不删旧文档 | 本地update及grounding已有等价且明确未选默认可逆link、授权内写draft不等新审批。**保留本地增强** | 不为CE新标题批量改历史文档；需真实diff eval保护其他作者和未target正文，而非只测词句 |
| 完成边界 | CE入口Done显式分house-format与minimal-edit；两轮未锐化仍完成但指出重访 | 本地入口73、interview尾部与update已有同样非阻塞语义，未集中一行Done。**候选简写完成准则**，非功能缺陷 | 无需新状态机或强制审批；内容尚缺关键用户答案时仍不能代答 |
| 策略到测量 | CE入口指明pulse读name/metrics、dogfood读persona，pulse按meaning和显式delegation读取 | 本地pulse `strategy-source.md`集中优先级、读失败不当absence、当前文件重新解析，setup/report均引用；**保留更明确的共享reader** | 本项已全文检查pulse直接consumer并读strategy测试；dogfood和ideate/brainstorm/plan语义闭环留各自项/最终横向检查，不假称全包完成 |
| 当前日期和写入授权 | CE入口固定2026、draft edit pass；本地active host date和已有授权可直接完成local draft | **保留本地设计**；不导入固定年份或重复审批 | 维护成本更低；不宣称宿主已强制prose约定 |
| 评测 | 本地5cases和通用asks judge，仅词表/fixture特有词证明部分表现；existing case说明声称Phase0先问合法，而当前入口已要求summary/drift后选target | **建议更新case说明并补outcome eval**：整文件保护、真实source read trace、有限pushback、压力测试非显然问题、既有授权直接写 | 当前case不验证这些动作的完整顺序，不能据问号判通过策略质量；未运行完整模型runner |

## 验证和交付边界

`tests/unit/spec-strategy-contracts.test.js`全文读，保护required refs、ownership、legacy、pulse source。针对strategy/pulse的现有静态合同本轮独立运行并留证，不能外推用户战略质量或下游真实采用。无独立reviewer，无source/runtime改动，无实际STRATEGY写入。本项建议未经独立validator，`validation_status: unresolved`。
