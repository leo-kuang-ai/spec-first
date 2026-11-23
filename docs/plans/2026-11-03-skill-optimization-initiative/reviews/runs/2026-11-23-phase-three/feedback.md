# 反馈归集与录制分析：源文件审查

两者回答不同问题：归集负责把已配置来源中的事项送到下一位处理者，录制分析只说明这段材料显示了什么。不能从“工作完成”推断所有来源可读、截图已查看、问题已修复或需求已获确认。表内行号均为冻结版本。

## spec-sweep

| 文件 | 范围 | 判断 |
|---|---|---|
| `SKILL.md` | 1–127 | 从配置、租约到发布依次交代前提；本机完成和已确认共享发布分开。给下游的是仅含需求的滚动计划，不应将命令示例当授权。 |
| `references/interview.md` | 1–211 | 每个来源的动作和敏感性独立确认，调度与提交也不共用权限。团队读配置的说法与本机保存位置冲突；经确认的共享目标才能进入共享模式。 |
| `references/plan-template.md` | 1–63 | 人工备注不可改，已有事项编号保留，关闭项退出列表。原摘要只数未决与关闭，无法区分无人反馈还是未读来源；调整首屏。 |
| `references/run.md` | 1–97 | 源侧确认后才推进游标；共享发布必须先读回。既有标签若不是自己的确认，不能通过重复加标签制造回执，应保留游标。 |
| `references/state-schema.md` | 1–218 | 枚举、迁移、锁、关闭凭据清晰，但统计声明为对象，实际运行器会接受其他形状；让契约和写入实现一致。 |
| `references/agents/media-analyzer.md` | 1–57 | 区分截图所见和合并核查，私密回执不回填到共享文字；看到可能修复的提交，不等于已确认症状解除。 |
| `references/model-tiers.md` | 1–11 | 取数、分析、判断各有职责，模型不可选时继承而不是编造；同名引用不是应无差别同步的共享文件。 |
| `references/subagent-template.md` | 1–43 | 输入固定到单条媒体哈希、运行、来源与目的提供方；把未授权时应省略的块说清楚，示例本身不是许可。 |
| `references/sources/email.md` | 1–57 | 实验性只读来源以消息 ID 去重，拒绝把读到邮件当作已对外确认；无写入能力时持续跟踪并保持游标存在重复读取的成本。 |
| `references/sources/github-issues.md` | 1–59 | 原表同时要求本人身份又认可他人同名标签，可能误认已确认。仓库写权限也不能只用令牌范围证明；改为保留不确定性。 |
| `references/sources/slack.md` | 1–61 | 同表情不同人不能算本次身份确认。读取频道及回复有明确范围，给出截断时须带限制；未验证真实频道权限。 |
| `scripts/analyze-sweep-media.py` | 1–125 | 私有根内冻结单份媒体、验证摘要并选择转写策略；中断后没有回执是未知，不能报“未外发”。合成测试不代表真实转写。 |
| `scripts/analyze_riffrec_zip.py` | 1–1494 | 已与下方权威分析器逐字节比较，本包通过私有包适配器消费同一输出，原来同样会把没有图片的事件时点当成可检查截图。 |
| `scripts/publish-final-state.py` | 1–142 | 验证共享分支目标、祖先与期间变更路径，推送后按指定 SHA 和已释放租约读回；只处理已提交状态，授权开关本身不是拥有者签字。 |
| `scripts/run-python.sh` | 1–27 | 逐个执行解释器版本检查再原样传参，两包字节一致。找不到可用解释器返回 127，不报告已分析。 |
| `scripts/sweep-state.py` | 1–865 | YAML 子集与带锁写入保留未知字段；旧 `run-record` 对无法解析的计数仍用空对象记成功，合法 JSON 列表也可落盘。已用原记录不变的反例整改。 |
| `scripts/__pycache__/sweep-state.cpython-312.pyc` | 38363 字节 | 本机非权威缓存；用冻结的 32663 字节源和文件头时间戳在 CPython 3.12 内存编译，对全部字节一致，未执行缓存。 |
| `evals/eval.yaml` | 1–18 | 只覆盖未配置时的无人值守退出，不能凭这条用例证明抓取、确认、合并或发布成功。 |
| `evals/cases/headless-first-run-stops.yaml` | 1–27 | 仅寻找停止短语会接受“虽然要配置但我继续执行”。向夹具索要唯一停止状态并检查配置及滚动计划未产生。 |
| `evals/fixtures/repos/mini-ledger/README.md` | 1–8 | 声称五个录入字段与服务实现不符，且没有配置反馈来源，修正题设。 |
| `evals/fixtures/repos/mini-ledger/package.json` | 1–6 | 仅定义私有 Node 服务入口，不是连接器或反馈配置。 |
| `evals/fixtures/repos/mini-ledger/src/server.js` | 1–25 | 新增和读取条目，持有金额、备注和服务端生成编号、时间。首跑停止不需要启动 HTTP 服务。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 1–30 | 未被清单使用；无人值守场景恰恰不应询问，不保留通用问号判据。 |

## spec-riffrec-feedback-analysis

| 文件 | 范围 | 判断 |
|---|---|---|
| `SKILL.md` | 1–48 | 先判断是否属于录制反馈；明确只要转写时不转成需求分析，用户提供录制也不自动同意送出媒体。 |
| `references/analyzer.md` | 1–39 | 单列转写许可、真实请求尝试和分段缺口；读取收据是快速与详尽分析都需要的，成功退出不等于看过每张图。 |
| `references/quick-bug-report.md` | 1–40 | 快报聚焦读者能复查的一个症状，原文只许读摘要，与共用分析指引要求查收据冲突；保留局部读取，不扩成完整交接包。 |
| `references/extensive-analysis.md` | 1–110 | 区分观察、推断、候选需求和源代码映射置信度；交接带批次和来源摘要，重跑同一路径须重验。不得把原始清单当可公开附件。 |
| `references/install-riffrec.md` | 1–27 | 安装指南交给上游当前说明，未采集时不运行分析器；点击只是定位线索，不能单凭多次点击确定故障。 |
| `references/spec-first-feedback-format.md` | 1–116 | 冻结版示例预填严重度并混合“似乎希望”和行为义务。改成待评估影响、明示期望出处和候选状态。 |
| `scripts/analyze_riffrec_zip.py` | 1–1494 | 已按输入、快照、转写、候选去重、截图预算、报告生成与收尾分段检查。仅事件输入可产生时点但无图；旧问题报告让人查看 `n/a`，旧清单还建议提交带原始路径的生成物。已在实际文件生成边界修复并验证两个消费者。 |
| `scripts/run-python.sh` | 1–27 | 运行门槛为 Python 3.10；与归集包相同。能执行解释器不等于能提取图像或有外发许可。 |
| `scripts/__pycache__/analyze_riffrec_zip.cpython-312.pyc` | 79897 字节 | 从冻结的 64043 字节源码在内存重建与整个缓存一致；未当作独立运行器、未更新或提交该缓存。 |
| `evals/eval.yaml` | 1–19 | 在已明确录制的本地分析之外，还覆盖普通会议录音不触发；两个场景不能互相代替。 |
| `evals/cases/check-local-evidence.yaml` | 1–20 | 题设只允许事件，要求保存指定目录，候选不计确认件；没有视频或调用权时无需虚构。 |
| `evals/cases/generic-audio-not-triggered.yaml` | 1–13 | 普通会议属于通用转写。旧题只验词项，错选录制分析也会通过；改为夹具内唯一去向。 |
| `evals/fixtures/repos/u28-outcomes/README.md` | 1–2 | 说明只有事件，明确无转写或发布授权，不能从产品名字推断具体影响。 |
| `evals/fixtures/repos/u28-outcomes/capture/events.json` | 1–1 | 第 5 秒控制台错误是可直接核查的事实，不证明支付失败或客户流失。 |
| `evals/fixtures/repos/u28-outcomes/capture/session.json` | 1–1 | 十秒时长，不含屏幕及音频材料；时长不能充当截图证据。 |
| `evals/fixtures/repos/u28-outcomes/prepare-eval.cjs` | 1–85 | 按摘要保护两个导出和说明、设置仅一次的准备基线，不能拿准备提交当任务输出。 |
| `evals/fixtures/scripts/check-local-evidence.sh` | 1–394 | 文件/索引/历史保护和专用尾部共同核对事件、出站字段及无需求计划；能证明夹具中这些事实，不证明远端服务从未有动作。 |
| `evals/fixtures/scripts/asks-a-question.sh` | 1–30 | 与录制是否本类无关且无消费者，删除。 |
| `evals/fixtures/scripts/check-generic-refused.sh` | 1–13 | 原来只说 Riffrec 即能通过；删除这份词表，用可回放的夹具去向代替。 |
