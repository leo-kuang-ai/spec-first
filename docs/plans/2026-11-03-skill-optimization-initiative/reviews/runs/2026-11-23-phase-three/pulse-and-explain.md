# 产品脉搏与讲解：逐文件判断

以下行数与路径对照 `5a55514d9`；当前版本的增删与处置另列于[整改记录](current-review.md)。判断的对象是源包及其消费者，不是线上发布或真实用户表现。

## spec-product-pulse

读者要决定发生了什么、哪些结论现在不能下、先恢复哪项数据。没有权限不等于没有用户；报告即使保存成功，也不能给数据源签发成功凭据。

| 包内路径 | 冻结行段 | 内容判断 |
|---|---|---|
| `SKILL.md` | 1–94 | 入口区分初次配置、按窗口运行和可选调度。原完成定义以行数为条件，却没要求读者在首屏识别关键数据缺口；完成报告与来源全部可用必须分开。 |
| `references/config.md` | 1–32 | 根目录是定位配置的前提；未配置才访谈。每个战略指标靠显式映射，不能因名称像收入就猜供应商；不改固定报告目录。 |
| `references/interview.md` | 1–257 | 访谈明确不索要凭据；团队术语不等于团队可以读取本机配置。原文把叫车与完成行程说成同一个事件，还暗示可加多个评分维度；与保存单维度的配置不符。 |
| `references/report-template.md` | 1–90 | 有标题、用量、性能与行动，但首屏可只报收入，掩盖活跃数据缺失。固定差值占位易诱导把零基数、部分窗口或无历史值写成涨幅。来源末尾需要能容纳自定义来源。 |
| `references/run.md` | 1–65 | 查询结果按来源分类，逻辑上可仅部分成功。若已配置的追踪查询失败，不能套用“未配置”分支而整段隐去；后续行动应优先恢复影响判断的数据。 |
| `references/setup.md` | 1–31 | 先从战略取种子再确认八类配置项，合并时保留其他键；调度建议不是建立任务的授权，不需为了生成报告实际创建定时任务。 |
| `references/strategy-source.md` | 1–10 | 优先根战略，缺文件、不可读和无指标是三个不同情况；历史文件只在明确委托时补充。配置过的报告不因缺战略重启访谈。 |
| `evals/eval.yaml` | 1–19 | 同时包含首次进入和已配置导出两条路径；前者要判断是否问了对的问题，后者可核对实际文件，应分开报告。 |
| `evals/cases/check-source-outcomes.yaml` | 1–20 | 题设指定本地导出和窗口、不许调度或改配置。只核对聊天 JSON 不够，实际打开的报告必须将来源、状态、值放在同一行。 |
| `evals/cases/unconfigured-guides-setup.yaml` | 1–19 | 无配置时该询问产品或指标，而不是展示空报告；问用户“要看报告吗”没有完成配置引导。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 1–8 | “手输五项”与同目录服务冲突；不能让配置访谈从错误的产品描述中推断核心事件。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 1–6 | 包名与服务路径足以定位应用，不能据此认定有分析接入或既有策略。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 1–25 | 只读入金额和备注；生成编号和时间，查询返回内存条目。无分析事件或活跃计数供本例读取。 |
| `evals/fixtures/repos/u28-outcomes/.spec-first/config.local.yaml` | 1–5 | 隐藏夹具给出收入与活跃的两个来源，关闭评分和数据库，调度为手动；不应在本例另行找凭据。 |
| `evals/fixtures/repos/u28-outcomes/README.md` | 1–2 | 提供本地导出的使用背景，不是收据；时间窗、值与失败原因应回到各自 JSON。 |
| `evals/fixtures/repos/u28-outcomes/exports/analytics.json` | 1–1 | `value:null` 且拒绝访问；记为未知并解释，不能写零或估活跃率。 |
| `evals/fixtures/repos/u28-outcomes/exports/payments.json` | 1–1 | 同一 UTC 窗口收入 1200，但没有币种、前期和涨幅；三者都不能从数值推出。 |
| `evals/fixtures/repos/u28-outcomes/prepare-eval.cjs` | 1–86 | 基线包括隐藏配置和两份导出，初始化标识与索引用来识别本轮副作用。准备器创建的提交不是被测工作成果。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 1–30 | 有问号或说到“提供”并不足以证明在配置产品；与真正的访谈题意无关。 |
| `evals/fixtures/scripts/check-source-outcomes.sh` | 1–405 | 通用前段负责仓库与轨迹证据，专用尾段验证两个 JSON 状态；旧版对保存的正文只找两个分散的词，没有排除把收入写在活跃行。对调数据的回归已先失败再通过。 |

## spec-explain

普通问答应直接回答；只有要留下教学材料时，才涉及格式、来源和持久路径。收件人看到的是正文，不一定看到 YAML。链接离线不可用时仍应能辨认来源。

| 包内路径 | 冻结行段 | 内容判断 |
|---|---|---|
| `SKILL.md` | 1–92 | 入口与四类输入划分清楚，但第三步把临时预览称为稳定交付，与收尾要求另存冲突。来源缺失应在读者能看见的地方说明。 |
| `references/intake.md` | 1–39 | 显式变更/时间窗口优先；普通冒号不是选项，同时指定冲突选项才需问清。简短概念问题不必先建目录。 |
| `references/orchestration.md` | 1–26 | 将已记录的理由和推断分开；远端永久链接需匹配实际检查版本，但 HTML 禁外部 URL，需要在离线文件中保留路径与版本。 |
| `references/check-in.md` | 1–19 | 自测要求先作答、后看解释，可用预测和边界题；不因例行会前摘要强制加入习题，也不在聊天等待回答。 |
| `references/destinations.md` | 1–53 | 留在本地也有可恢复路径；Markdown 搬迁后须重算相对链接。发布片段和完整本地文件不是同一产物，不能把“选目的地”当公开发布确认。 |
| `references/explainer-html.md` | 1–40 | 可见元信息、无外部加载、静态自测、图有等价文字；这些都是可检查的设计条件，不证明不同阅读器里实际渲染正确。 |
| `references/explainer-markdown.md` | 1–33 | `unverified: true` 可帮助索引而不保证读者看到；正文开头需有关键问题、答案和必要的来源限制。 |
| `references/agents/work-recap-scout.md` | 1–23 | 按时间窗汇集提交、可用 PR 与决策记录；找不到 PR 接口只记不可用，不能推断未合并。只有材料才能支撑回顾中的原因。 |
| `evals/eval.yaml` | 1–18 | 只挂一条普通问答反例，不覆盖应生成的 HTML、交付位置、正文自测或实际读者。 |
| `evals/cases/simple-qa-not-triggered.yaml` | 1–24 | 简述流和缓冲区是合理的免制稿用例；无文件和回答正确是两个不同问题。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 1–8 | 同样误报手工输入字段数；不应用项目中的缺陷引导本应直接回答的库概念问题。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 1–6 | 提供隔离项目的 Node 入口，不是验证流模型正确性的文档。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 1–25 | 请求体按块接收后累积，但没有提供系统性的 Buffer 教程；本例不需要修改服务或启动端口。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 1–30 | 清单唯一场景不消费它；留着问号判据既无覆盖价值，也给将来用例错误暗示。 |
| `evals/fixtures/scripts/check-simple-qa.sh` | 1–31 | 实际运行拒绝解释与正确解释，两者都返回 0。扫描两个产物根及已知讲解文件可保留；单词命中不能标成“已回答主题”。 |
