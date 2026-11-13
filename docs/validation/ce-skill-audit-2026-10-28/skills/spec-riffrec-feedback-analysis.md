# spec-riffrec-feedback-analysis 全量源码对照审查

状态：`source_review_complete`。双方全部19个文本资产共3518行全文读取；另2个pyc仅核文件类型、头和hash，不把字节码当文本、也不执行它。直接核对两方Sweep media-analyzer、本地Brainstorm入口和三项完整测试。逐文件事实见 [文件表](../file-tables/spec-riffrec-feedback-analysis.md)。本轮report-only，未实施或上传媒体。

## 意图与可融合能力

本地将此入口限定为明确Riffrec反馈，CE还可面向通用screen/voice/notes。脚本支持更广输入不代表用户入口必须变宽；Sweep是同一分析器的另一owner，允许处理普通反馈媒体。本地package-local analyzer与Sweep保持byte-identical projection，不跨skill导入private脚本，这一边界与部署方式一致。

| 研发能力 | CE事实 | 本地事实与增强 | 融合裁定 / 最小建议 |
| --- | --- | --- | --- |
| 反馈到研发输入 | quick单问题bug report，extensive提供analysis/problem/manifest/kickoff/JSON，WHAT先于HOW | 保留完整证据链与四类问题、observed/inference/requirement区分，候选surface不冒充root cause | 主能力已融合；继续保留全信号采集，再由Brainstorm确认/拆分/优先级，不把脚本模板当最终PRD |
| 完成出口 | CE入口显式写Setup/Quick/Extensive各自Done及失败blocker | 本地散落在references与entry；完成打印为handoff-only | 可窄化吸收CE concise done criteria，列真实存在产物、缺失transcript/screenshots和当前owner，不导回默认自动Brainstorm |
| 快路径范围 | CE quick发现多问题就重跑durable extensive | 本地返回primary bug+额外signals+extensive-analysis-available；仅新选择才扩大 | 保留本地范围收紧；用户已明确要求extensive则直接执行，避免重复问已授权阶段 |
| 下游owner | CE默认继续Brainstorm（extract-only除外） | 本地原始要求明确涵盖requirements/planning时可继续；analysis-only停在handoff | 保留本地授权与docs/plans唯一durable requirements owner，不把analyzer stdout当写计划的授权 |
| 转写外发与凭据 | CE有key默认转写，key进入curl argv；Sweep sensitive才禁止 | 本地默认no-transcribe，显式CLI opt-in、stdin config、receipt；Sweep sensitive永不外发 | 本地增强应保留。当前receipt在fallback可丢首次request-sent事实，先修见下表；ambient key不能变成consent |
| 输入/快照安全 | CE containment、目录拒symlink、raw/frames暂存替换 | 本地额外ZIP成员/大小/压缩率/stream预算、目录special拒绝、source-output包含拒绝、局部失败恢复、媒体超时 | 无需恢复旧实现；本地优势已实质落在脚本，三项测试验证一部分。报告整体不是事务，不能把局部rollback说成完整原子性 |
| 代表性时刻/事实判断 | 两方相同按时间排序截断、英文complaint词表、候选findings模板 | 本地未改变核心选择策略；frame是advisory，LLM要看真实图和全信号 | 不属于可从CE直接补回的新能力，而是双方共有缺口。建议先保留失败/重复交互等高信号，完整event inventory供语义判断，不把语义优先级硬编码为通用专家系统 |
| 长媒体 | 两方均按420秒分块，成功部分合并并保留chunks记录 | 本地补duration不可知拒绝partial、timeouts；仍任意一chunk有text就ok | 保留本地增强，补coverage/partial和缺失区间；不得以“文本非空”代替完整转写 |
| 媒体到源码 | CE及本地extensive包含surface classification、confidence、source refs；Sweep检查already-fixed-on-main | 本地显式dispatch独立授权、inline不冒充独立分析，Sweep对不可信媒体/第三方屏幕内容有隐私规则 | 能力主体已融合；可在独立Riffrec路径补同样清晰的“不可信内容仅数据”和共享文本前敏感性检查，复用语义边界，不新建全局controller |
| 评测 | CE包无对应本地negative eval | 本地generic judge只要出现Riffrec/转写等任一词就过，既可以拒绝也可以承诺转写 | 建议改结果评测：错误路由zero analyzer/provider/production writes；正例必须保留合法Riffrec分析，不以关键词作为语义胜利 |

## 已复现的确定性候选

可复跑 [probe](../riffrec-boundary-probe.py) 与 [结果](../riffrec-boundary-probe.json)。仅调用当前本地函数，mock全部外部转写/ffmpeg；临时输入自动清理。没有真实provider调用、没有真实媒体/视觉证据，也没有独立validator。

| 编号/级别 | 源码位置 | 实际触发与输出 | 影响和最小建议 |
| --- | --- | --- | --- |
| RF-01 P2 | `select_moments` → `summarize_candidate_findings` | 12个早期普通click+90秒checkout 500，max=12：failure_selected=false，candidate为No obvious failure | 高信号缺失却对全来源作否定断言；从全events形成事实清单，截图budget与事实发现分开。共享于CE，不归因本次dirty |
| RF-02 P2 | `summarize_candidate_findings` | 唯一console_error已进入M1，却输出未发现console errors | 与自己引用的event矛盾；保留error事实和未知用户影响，别让未覆盖finding类型变“没有错误”。共享于CE |
| RF-03 P2 | `transcribe_media_chunks` | 840秒两chunk，一成功一失败：status=ok，text只含前半；chunks保留失败，但无partial/coverage | 下游可能误以为完整。返回partial与已覆盖/缺失区间；渲染分析首段醒目标注。共享于CE |
| RF-04 P2 | `main` fallback替换transcript | 首次mock result sent=true / input_too_large，缺ffmpeg的chunk fallback后analysis receipt sent=false；CLI exit0 | 本地新增receipt失真；聚合完整attempt history并OR request-sent事实，不能只取最后attempt。真实first request未发送，此处证明的是处理已发送事实的逻辑 |

这些是当前源码行为，不代表实际用户已受影响；尚未做Git历史归因，不声称是最近改动引入。RF-01/02不是“LLM已漏需求”的证据，RF-03/04也不是“真实转写/隐私事故”的证据。

## 其他源码边界

- `write_requirements_kickoff`总有R1/R2证据处理与AE2按钮例子，即使No obvious failure也生成R3“resolve issue”。这是scaffold，不能当已确认product requirement；建议无产品finding时保留待确认项，避免虚构功能需求。
- CE `events_payload.get`在list形状有类型缺口，本地显式分支已修；不能整体复制CE analyzer覆盖本地增强。
- `repo_relative`在repo外返回绝对路径；analysis/source manifest也写original absolute path。prose的“repo-relative committed docs”依赖后续promotion审查，不由analyzer保证。建议本地私有manifest和可共享文本明确分开，不能声称当前输出天然commit-safe。
- 本地helper要求“Python3”仅检查major，而脚本用了`Path.is_relative_to`和union annotations；最低Python版本应明确并通过wrapper检查。此项为兼容候选，未在旧Python真实运行。
- ZIP成员symlink metadata被当普通字节写而非建立symlink；不能谎称已创建逃逸链接。Windows盘符路径需要Windows fixture核对，本轮不外推macOS结果。
- Sweep media-analyzer声称只写一个finding，同时运行会产生多个scratch analyzer文件；应说只允许该scratch root内证据和指定finding，不扩大到repo写权限。此consumer全包仍由Sweep项继续审。

## 验证与最小顺序

三套聚焦测试实际通过：3 suites / 19 tests，见 `riffrec-tests.json` / `riffrec-tests.log`。它们覆盖projection字节一致、授权默认、key不入argv、快照rollback、ZIP预算和路径边界，不覆盖本轮四个新增反例。没有把测试绿色覆盖到这些缺口；未运行真实模型eval或转写服务。

先修RF-04 receipt与RF-03 coverage；再修RF-01/02的事实表达和scaffold；随后补outcome eval和对外文本promotion检查。主能力已融合，不建议为“吸收CE”增加自动外发、自动扩路径/Brainstorm或重复分析器owner。
