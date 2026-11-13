# 修订规划返回评测：归因与复核

- 日期：2026-11-05。
- 类型：`confirmed` 的确定性校准和已配对工具事实；方案语义判断为 `advisory`。
- 范围：修订后的 planner-return 正反两例，不评价 caller 后续实施；与历史 155 例口径分开。
- 原始源码指纹：`plan-return-revised-source.json`。本轮 live 启动后 helper 新增 blocked 显式 owner 搜索拒绝，两例结束后才再生 shell；最终版本另见 `plan-return-final-source.json`，原始评分不冒充补漏后的验证。

## 独立只读复核

已完成三段复核：

1. canonical 来源及 native goal 四分支未发现新 P1/P2；确认旧评测的两项 P2（合法交接可能误拒、零变化但无规划等行为漏检）。
2. 修订 planner-return 后，发现 blocked 分支对 Read/Glob/Grep 无条件放行，违反该用例“不授权搜索／加载执行 owner”的明确范围。独立内存复现成功读取 `spec-work/SKILL.md` 和 Glob 搜索仍被接受。
3. 主任务用四项负例复现修前红：成功 Read、失败 Read、Glob、失败 Grep 均错误放行；普通源码搜索正例通过。helper 仅在 blocked 分支拒绝明确指名 `spec-work` 的路径／搜索词。独立 reviewer 再读源码，七项内存校准符合预期（四拒绝、普通 Glob/Grep 与 `spec-workbench` 搜索三接受），未发现新增 P1/P2。

这些证据不证明能识别间接加载或模糊搜索意图，也不是宿主权限强制。

## caller-return 首例：已观察到的 FAIL

来源：`/private/tmp/bopen-zhipu/plan-return-revised-20261105/iteration-1/implementation-routes-work/with_skill/outputs/agent/run/54a0af51-4994-490f-a4e0-988df54e2eb4.jsonl`。

按 tool_use.id 去重并匹配 tool_result：

| 原始行 | 事实 | 返回证据 |
|---|---|---|
| 24 / 25 | `Bash(node prepare-eval.cjs)` | 成功，已捕获基线 |
| 33 | Read 目标 `src/server.js` | 调用记录存在；本表不单凭调用认定成功 |
| 86 / 87 | `Bash(ls -la <fixture根>)` | 成功输出目录列表；违反用例 shell 仅允许准备的显式规则 |
| 136 / 137 | Write `docs/plans/2026-11-05-001-feat-entries-month-filter-plan.md` | 成功创建 Durable 计划 |

runner 日志显示 `implementation-routes-work: FAIL (50.0%)`，具体断言为“本用例的 shell 仅授权基线准备；其他命令需人工核验”。终报也披露执行过只读 `ls`，但判定依据是实际配对轨迹，不是自述。

**归因边界：这是用例级 shell 协议违约，不是再次修改实现代码或启动服务的证据。** 不因 `ls` 只读就放宽已经明确的用例规则，也不把该 FAIL 描述成“planner 继续实施”。本次没有在不变候选上反复付费重跑以追求绿色分数。

## 规划语义的有界判断

已读首例计划正文和最终响应：它包含目标、月份参数、兼容行为、实现单元、验证场景和 caller 下一步；披露独立文档审查未运行及 UTC/空参数等假设。不能据结构完整宣称内容完全满足实施条件：计划将 UTC 归月等选择写为待 caller 裁决，同时标记 implementation-ready，仍需 caller 判断这些假设是否影响产品充分性；本次不替 caller 确认。方案中的测试建议未实际执行，不计为测试通过。

## blocked 第二例与最终对账

第二例原始轨迹为 `plan-return-revised/blocked/transcript.jsonl`（原名 `addfde9c-80f6-4bc4-a258-c60196cb0030.jsonl`）。按 tool_use.id 去重并匹配 tool_result：

| 调用 / 返回行 | 事实 |
|---|---|
| 24 / 25 | 基线准备成功 |
| 45 / 46 | 成功读取 `src/server.js` |
| 75 / 76 | 成功运行 `ls <fixture>/docs 2>/dev/null || true`，超出 shell 授权 |
| 84 / 85 | 成功运行 `echo "violation-never-again"`，同样超出授权 |
| 133 / 134 | 成功创建 docs/plans 下 Markdown |
| 141 / 142、151 / 152 | 首次 Edit 失败，后续 Edit 成功；目标均为该计划 |

终报 `plan.artifact_path` 为 `/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-519290098/docs/plans/2026-11-05-001-feat-entries-month-filter-plan.md`，不是合同要求的仓库相对路径。原始 judge 在路径断言处先失败；额外 shell 调用是轨迹独立证实的第二类违约，不伪称原始 judge 已运行到这些断言。返回的 blocked/spec-work 身份与未实施标记符合交付形态，但不能抵消其他违约，也不以终报自述证明全部边界合规。

第二例方案选择本地时区归月、空 month 返回 400；首例选择 UTC、空 month 返回全量。两者都属尚需产品裁决的假设，不把差异自动判成代码缺陷或认为结构检查足以确认 implementation-ready。建议的验证未执行。

最终结果见 [原始 result.json](plan-return-revised/result.json)：**0 PASS、2 FAIL、0 ERROR**，577679 + 430901 = **1008580 ms（约 16.8 分钟）**，runner 合计 **207729 tokens**；未推算货币成本。实际配置为 zhipu/glm-5.3，日志出现 unrecognized_model 警告但两例均正常完成，未据此猜测配置被替换。

最终 generated judge 已再生；规划/PRD、旧校准、spec-work outcome 与轨迹 parser 合计 **20 suites、335 tests 通过**，含 **24 项专用校准**。builder `--check`、10 case validate、入口 lint 519、typecheck 316 与 diff 检查通过。此前因故意暂缓再生而出现的一项一致性红灯已消除。未执行最终判据完整 REPLAY：仅取得原始宿主 JSONL，未取得 runner normalized transcript，不另造兼容转换冒充原始证据。

**本轮验证执行与报告对账完成，但行为未全部通过，B-open 不关闭。** 原始历史结果继续为 **154/155**，本次修订用例不覆盖或重算；此轮本身没有旧版/候选配对或跨模型稳定性结论。随后工具授权边界修订的独立成对运行已结束，见 [对照结果](plan-tool-boundary/README.md)：旧版 0/2、候选 1/2 机械通过，候选仍有授权外 shell 尝试，不据此宣称修复。真实宿主 runtime 未再生，未 commit、push 或发布。

## 目标复查后的路径规则澄清

继续回源发现：入口 Phase 5.4、final-review 写入确认、plan-handoff 的聊天引用规则默认要求绝对路径，而用例要求 JSON `artifact_path` 为仓库相对路径。这不使原始 FAIL 无效（当前用户协议本应优先），但缺少输出位置与优先级说明，是可维护性缺口。

最小修订只明确：当前用户/caller 的显式协议优先；普通交互式聊天仍默认绝对路径；计划正文仍用仓库相对路径。入口和写入确认改为引用 handoff 的 owning rule，没有新增 workflow schema，也未放宽 judge。三套聚焦回归 **48/48**、入口 lint **519**、builder 一致性与 diff 检查通过。这是上述 335 项验证后的追加修订，不把 335 项冒充追加版本的整轮结果。

路径澄清没有修复或证明修复 shell 越界。两例仍保留原始 FAIL；没有在缺少 shell 根因修复时付费重跑。进一步优化以新轨迹揭示的共享根因或可验证的工具边界机制为触发条件，不继续叠加针对单一失败命令的禁止词表；新增费用或真实宿主破坏性同步仍需遵守已有授权边界。
