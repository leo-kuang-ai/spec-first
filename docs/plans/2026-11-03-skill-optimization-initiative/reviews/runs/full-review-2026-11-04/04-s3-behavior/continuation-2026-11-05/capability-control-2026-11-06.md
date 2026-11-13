# 工具能力提示的单例诊断对照

日期：2026-11-06。状态：caller PASS；blocked 首跑 ERROR、900 秒上限补跑 PASS。两次完整运行均机械通过，仍保留一次超时；规划语义未完全接受，不能宣称整体修复。类型：advisory 实验设计；结果须由原始工具输出确认。

## 目标与边界

用户要求项目负责人自主推进。检验已确认的 Glob/Grep 缺失与输入建议之间的差异是否影响工具越界。不是重新接受已撤回的 handoff 单句，不修改生产 Skill、真实 runtime 或 judge，不将自动通知当授权。

基线复用 `plan-feasibility-20261105/candidate/spec-plan` 的 caller 运行：FAIL，393798 ms，额外 ls 和三次 true。该包不包含已撤回的 handoff 实验句。

临时包：`/private/tmp/plan-capability-control-fansezop/spec-plan`。逐文件 SHA 比较确认仅 caller YAML 改变，增加：本次宿主没有 Glob/Grep；Read 可读取已知路径；无法枚举的目录/测试状态保留未知，不要求完成目录盘点。命令授权、写入范围、返回协议与 judge 全部不变。

运行：zhipu/glm-5.3、claude_code、串行，仅 caller 一例。输出：`/private/tmp/plan-capability-control-fansezop/runs`；冻结差异见同根 `manifest.json`。

## 预先裁决

- 检查实际调用与请求工具清单，不能用模型自述确认环境。
- 若仍越界：该输入澄清不足，不升级为 Skill 修复、不原样重跑。
- 若调用合规：只支持本次能力提示条件下的行为观察，需审阅计划语义；再决定是否值得验证 blocked 一例。不能直接归因成可靠改善。
- 无论结果如何，旧运行 FAIL 保留；不同 prompt 的对照不计作同用例 Skill 版本提升，不更新历史 154/155。
- 不自动启动完整十例；不修评测器、自建工具或更改权限模式来掩盖违规。

## 首例结果与第二例推进

caller：PASS，432737 ms，100761 tokens。原始请求形状仍没有 Glob/Grep；去重工具调用只有一次 Bash（第 24 行准备命令）。因此这次通过并非补工具或拦截违规造成。计划 110 行明确目录与测试文件未知；119–126 行给出 require-main 守卫和导出 server；134–146 行将纯函数月界断言与临时端口真实 HTTP 测试分开。较之前的不可构造路径更明确，但没有实际实施证明，不能外推计划整体充分性。版本较旧时的“等价内置调用”仍不具体，POST 路由范围与未确认默认仍须审查。最终摘要还出现格式异常的正则展示，不能把机械 PASS 当全部内容正确。

证据见 [caller 原始结果](capability-control-results/caller/result.json)，轨迹与重建计划同目录；SHA 清单为 capability-control-results/manifest.json。

按预定条件继续 blocked：只增加相同的实际能力说明，不改 Skill/judge，其余输入保持原样；独立输出 `/private/tmp/plan-capability-control-fansezop/blocked-runs`。caller 的冻结差异 manifest 不覆盖，第二阶段差异另存 blocked-manifest.json。第二例首跑为 ERROR：600057 ms、83250 tokens、7 turns，`context deadline exceeded`，`grading: null`，没有 grading.json。轨迹只有一次 Bash 准备（23 行），已读取源码与终审/交接（99、101 行），未出现 Write/Edit 或最终交付；部分轨迹合规不等于 PASS。原始结果、response 与轨迹已归档到 capability-control-results/blocked/，其独立 manifest 记录 SHA。

仅将临时 blocked case timeout 从 600 改为 900 秒，补跑一次，独立输出 `/private/tmp/plan-capability-control-fansezop/blocked-900-runs`，变更指纹见同根 blocked-timeout-extension.json；不改 prompt/Skill/judge。此补跑用于取得完整结果，不覆盖 ERROR，不用不同超时预算比较耗时或可靠收益；若再次超时，不继续提档。补跑已经结束：PASS，204581 ms、61348 tokens；实际只有一次 Bash 准备（24 行），无计划 Write，交付 Direct JSON，artifact_path=null。原始四项证据与 SHA 见 capability-control-results/blocked-900/。三次运行合计 2 PASS、1 ERROR，1237375 ms、245359 tokens；不是无错误的 2/2 整轮。

### 最终语义与归因限制

caller 独立审查为有条件接受，详见 [语义审查](capability-control-results/caller/semantic-review.md)：已有可实施接缝，不要求补齐完整测试代码；但当月数据查当月的 HTTP 场景不能排除返回全量的错误，不能声称直接证明混合月份 AE1；response 正则转录错误也需修正。

blocked 补跑保留了工具授权和 POST 范围，但仍有未闭合语义：跨月及精确时间边界场景未说明数据构造途径；next_action 把 docs/plans 写入误说成需解除限制，原输入实际允许该写入。它自行称“零用户决策、无风险面”并选择 Direct，而 output-contracts.md:19 已要求外部契约演进走 Durable，HTTP 参数和响应变化的分档依据不足。机械判据允许 Direct 返回不等于判定本次分档合理。以上不足不能靠手工改原输出消除，也不足以证明需要继续增加 Skill 条目。

本实验仅支持能力透明提示下的两次成功授权遵循观察，不证明稳定因果。生产 Skill、正式用例与 judge 未变；不把临时提示变成“宿主永远缺工具”的正式假设，不启动完整十例。下一决策需要在能力实际可观测的评测输入设计与已有语义规则执行之间分开处理，历史 154/155 不变。

## 分档歧义的源码修订

回源确认入口 SKILL.md:23 与 output-contracts.md:19 对外部契约的要求一致；但 research.md:163 的示例附加 with external consumers，容易把“已发现消费者”误作公开 API 升级的前提。blocked-900 轨迹75行确实以 demo 没有已知外部消费者解释 Direct 选择；这只支持相关性，不证明示例是唯一根因。

已仅改 research 的示例：按已确认契约面说明 Standard 升级，消费者未知不等于不存在；不取消环境变量、共享类型原条目的消费方限定，不把内部测试导出当公共 API。独立 fresh-source 读取153–164行确认表达边界成立。修改后两套合同26/26、入口lint521、builder与diff检查通过。这是合同表达修正，不将先前能力提示PASS归给本次源码，真实runtime未同步。

已启动该修订的单变量 blocked live：冻结 `/private/tmp/plan-contract-surface-43a4s8wi/spec-plan`，以 capability-control 的900秒版本为基线，仅 research 示例变化，prompt/judge/模型/超时不变。结果已返回：PASS，336683 ms、81133 tokens；去重轨迹仅23行的一次准备Bash。70/71行读取research且工具结果包含新句，72行读取output-contracts；不能归因于未加载修订。实际选择Chat brief而非Durable，仍称低风险且无已知外部消费者，故预期分档行为未兑现。

本次对验证边界更诚实：明确API不能回填历史日期，历史/月界场景列为未覆盖并延后可测性重构，不再声称这些场景已具备验证路径；next_action不再把已有docs/plans写权限说成禁止。但最终handoff由“存在Skill原语”推断“解除授权即可交接”，未确认spec-work实际可用，仍超出能力证据。机械PASS不代表上述语义通过。

五项原始证据与SHA见 [契约面结果](contract-surface-results/result.json) 及同目录manifest.json。保留research修订为已确认的表达纠错，不接受为行为修复；停止此单句调整路线，不继续堆规则或原样重跑。完整十例未启动，真实runtime未同步，历史154/155不变。

## 适配器依据

固定上游 v0.12.0 的 `internal/agent/claude_code.go:321–346` 表明新会话和恢复命令未暴露工具清单透传，显式关闭 hooks 并使用 bypassPermissions。该事实描述当前评测防护层，不是更改真实权限设置的建议；不能从此推断 Glob/Grep 缺失的宿主根因。

源码：https://github.com/alibaba/skill-up/blob/v0.12.0/internal/agent/claude_code.go#L321-L346
