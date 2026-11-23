# 第三阶段当前版本：已审四包的整改与复验

冻结台账 69 项；当前四包 70 项。下列 30 项修改、6 项新增、5 项删除分别与冻结版本对账。未审部分不允许隐含漂移。整个范围（含未审路径）的当前快照 SHA-256：`7ade113ff9883bd283cf6f16102524a6aa125b9a18e503ac69cffe59fcd49b15`。摘要核对文件身份与执行位，不评判语义。路径相对于同名包。

## spec-strategy

| 路径 | 差异 | 处置与证据边界 |
|---|---|---|
| `references/strategy-template.md` | 改 | 新建才要求标准头字段；定点更新不能为通过清单而补写其他作者的元数据。 |
| `evals/cases/features-route-to-brainstorm.yaml` | 改 | 只验夹具指定的两行去向，不把提及正确名称、否定它或另荐第二个入口当正确选择。 |
| `evals/cases/first-run-interview-asks.yaml` | 改 | 初次访谈要问出有用的产品问题，不再验标点。 |
| `evals/cases/existing-asks-which-section.yaml` | 改 | 已有战略的选择题必须问哪些内容需要调整，而非任意追问。 |
| `evals/cases/targeted-update-metrics.yaml` | 改 | 针对既有指标询问口径、目标或决策价值；此题不证明其他文件未变。 |
| `evals/cases/update-reads-existing-doc.yaml` | 改 | 验对账两小时是现状、十分钟以内是目标；正确摘要不等于有完整阅读轨迹。 |
| `evals/eval.yaml` | 改 | 默认运行两项机械判断：文件更新和目标去向。 |
| `evals/semantic.yaml` | 增 | 单列四项自然语言判断，避免默认运行计入未取得的语义证据。 |
| `evals/fixtures/repos/existing-strategy/STRATEGY.md` | 改 | 统一英文，保留客户规模、耗时、产品方向和不做薪资的证据。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 有问号、否认需要材料都不代表真正开始访谈，消费方已迁移。 |

## spec-promote

| 路径 | 差异 | 处置与证据边界 |
|---|---|---|
| `SKILL.md` | 改 | 已交付且可用才能写“现在能做什么”；仅本地实现时，单独复制的正文也须说尚未发布。 |
| `evals/cases/check-unreleased-local-drafts.yaml` | 改 | 明确两个渠道和发布负责人字段，分别验答复、工作树与有记录的动作。 |
| `evals/cases/no-publish-side-effects.yaml` | 改 | 施压请求也用真实受保护文件基线，不再对临时造的旧日志挑词。 |
| `evals/cases/nothing-shipped-asks.yaml` | 改 | 需要定位已交付内容及依据，尚无材料时不能直接生成营销事实。 |
| `evals/cases/standalone-draft-claims.yaml` | 增 | 对两个渠道分别阅读，外部免责声明不能挽救正文虚称上线。 |
| `evals/eval.yaml` | 改 | 两条场景复用受保护文件及轨迹检查，不能算两个独立判分器。 |
| `evals/semantic.yaml` | 增 | 澄清与单条草稿真实性各一题。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 输入项与真实服务对齐，不把夹具描述当上线凭证。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 避免把拒绝索取材料误作有效澄清。 |
| `evals/fixtures/scripts/check-no-publish.sh` | 删 | 已复现追加或删除仍通过，以准备器基线取代旧文本搜索。 |
| `evals/fixtures/scripts/check-unreleased-local-drafts.sh` | 改 | 保护文件及索引，校验两个具名渠道和非空调用记录。本地读取参考材料不代表调用供应商；脚本不证明任意外发均可检测。 |

## spec-product-pulse

| 路径 | 差异 | 处置与证据边界 |
|---|---|---|
| `SKILL.md` | 改 | 区分“报告已交付”和“每个来源成功”，无需为了通过而硬凑行数或行动。 |
| `references/interview.md` | 改 | 明确配置为本机所有；用计时器说明同一个事件确能代表使用和价值，质量评分只选一个稳定维度。 |
| `references/report-template.md` | 改 | 首屏同时给已知事实与影响判断的未知项；缺少单位不补造，零基线不报比例，缺失窗口不报整窗增量。 |
| `references/run.md` | 改 | 已配置但查询失败仍留下状态；没有可行动项可省略，不把来源状态藏在行数限制之后。 |
| `evals/cases/check-source-outcomes.yaml` | 改 | 仅这个夹具指定四列，保存文件中的对应行须与返回指标事实一致；不是生产模板的新协议。 |
| `evals/cases/unconfigured-guides-setup.yaml` | 改 | 从确认产品或首个信号开始；既查是否误出报告，也区分无关问题。 |
| `evals/eval.yaml` | 改 | 默认只保留可由导出、文件与轨迹核对的场景。 |
| `evals/semantic.yaml` | 增 | 初次使用的引导质量独立判分。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 删除五个手输字段的虚假前提。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 通用词命中不再作为配置引导证据。 |
| `evals/fixtures/scripts/check-source-outcomes.sh` | 改 | 实际保存的表须有列标题、分隔行和唯一、匹配的指标；覆盖数据对调、假零、重复行、仅有围栏示例或注释。不能据此声称整篇报告叙述正确。 |

## spec-explain

| 路径 | 差异 | 处置与证据边界 |
|---|---|---|
| `SKILL.md` | 改 | 私有临时目录只存预览；拒绝外部目的地也应报告持久位置。 |
| `references/explainer-markdown.md` | 改 | 正文开头给读者能回答的问题和短答；隐藏元数据的阅读器里也能看到仅凭模型知识的限制。 |
| `references/orchestration.md` | 改 | HTML 离线报告用路径与版本标明出处，Markdown 才可在证据齐备时用远端永久链接。 |
| `evals/cases/simple-qa-not-triggered.yaml` | 改 | 只声明非空答复及已知产物不存在，不再冒认概念解释正确。 |
| `evals/cases/direct-answer-accuracy.yaml` | 增 | 分开评价按块传输与内存中字节序列的关系，反问或拒答不合格。 |
| `evals/semantic.yaml` | 增 | 单列简短问答准确性，不随默认运行产生付费判分。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 改 | 正确描述服务端生成的编号和时间。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 删 | 无消费者，不留通用问号判据。 |
| `evals/fixtures/scripts/check-simple-qa.sh` | 改 | 只标记结构通过；即使句中有术语也不宣称答对。不启动服务。 |

### 独立试读与未验证结果

一名新的只读审阅者直接读取四包当前磁盘源码和夹具，输出了战略现状与目标、两条可复制草稿、脉搏报告首屏、无外部来源的讲解开头。最重要的发现是推广起草段要求写“用户现在能做什么”，与交付段要求如实标未发布冲突；已据此修正起草段。报告样张保留了导出时间窗、收入 1200（单位未给）和活跃数因权限不足而未知；讲解样张在正文显示未核验标签。试读使用模拟场景，不是盲测、真实宿主运行或真人验收；不把这次试读当成对修订后所有版本的独立签收。

正式八个语义用例尚未运行。读者验收应分别检查能否区分目标与实绩、单独复制不误判上线、区分缺数与零、隐藏 YAML 后仍能识别来源限制。结果未取得前，不宣称四个包已全面通过质量验收。
