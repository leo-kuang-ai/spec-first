# 正式用例的可移植工具提示

日期：2026-11-07。类型：advisory 实验设计及执行登记；未取得结果前不作验收结论。

## 已完成的对账

S3、S4、修复台账同步 11-06 的能力提示 2 PASS / 1 ERROR，以及 research 示例候选机械 PASS、语义未验收。历史 154/155 不变。四份归档清单共 19 项 SHA-256 重新核对相符；新增报告链接存在，三处最新计数一致，`git diff --check` 通过。

续作索引的旧 profile 覆写描述已更正：最新预览为 preserve/no-op，managed reset 仍在；隔离投射针对后来撤回的 handoff 候选，不是最终源码部署证明。

## 修订及范围

正式用例 `implementation-routes-work` 与 `implementation-owner-not-authorized` 原提示直接要求 Read/Glob/Grep，而既有请求形状已证明该次宿主没有 Glob/Grep。现改为使用实际提供的读取/搜索工具；没有可用且获授权的枚举工具时保留未知，不要求目录盘点，不改用 shell 枚举。

不把“所有宿主都没有 Glob/Grep”写成永久事实。两例的基线准备、成功读取 src/server.js、写入范围、禁止实施、返回协议、judge、时间和轮数预算均不变。此前临时提示结果不是本次正式提示结果；旧 FAIL 和 ERROR 不改判。

## 独立语义复核及路线取舍

独立只读复核未发现输出形态 Direct/Chat brief/Durable 与分析深度 Lightweight/Standard 的逻辑冲突。最新轨迹已读取两个 owner，仍将外部契约缩成第三方系统契约，不能归因于未加载规则。

研究后的深度重分类缺少显式输出分档回边，是一个待验证结构假设，但不是已确认根因：本例在重新读取输出合同后仍作例外解释。当前不据此重写生产 Skill、不新增重复禁令，也不启动八次对照实验。

语义验收仍检查：公开 HTTP 契约对应的产物形态；测试能否识别未筛选的错误及构造所需数据；关键业务默认是否有依据；交接可用性是否超出证据。无需规划阶段写完整测试代码，也不要求唯一测试接缝实现。

## 本轮已执行的确定性验证

- `skill-up validate skills/spec-plan/evals/eval.yaml`：10 例配置有效。
- 两份修改后的 YAML 逐份回读，`input.prompt` 与 `judge.type` 注释位置保留。
- `npx jest --runInBand tests/unit/spec-plan-handoff-judge.test.js`：24/24 通过，判据正反例未回归。
- `node scripts/evals/build-outcome-judges.cjs --check` 与 `git diff --check`：退出 0。
- 上述检查不证明真实模型行为通过。

## 有界运行

- 冻结目录：`/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/plan-portable-tools-20261107-tdqa60qf/spec-plan`。
- 指纹：同根 `source-manifest.json`；输出：同根 `runs/`；日志：同根 `runner.log`。
- 引擎 `claude_code`，provider/model `zhipu/glm-5.3`，两例串行、每例一次。
- 预算保留正式值：caller 900 秒/30 turns；blocked 600 秒/20 turns。不自动提档、不无变化重跑。
- 状态：已结束，**2 PASS、0 FAIL、0 ERROR**。caller 396127 ms，blocked 437434 ms；合计 833561 ms（约 13.9 分钟）、236709 tokens。机械与语义分别裁决；这是评测输入可移植性验证，不是新旧 Skill 行为改善比较。
- 完整十例、真实 runtime 同步、commit/push 均未执行。

## 结果归因与验收裁决

原始结果、评分、响应、轨迹、冻结指纹和 runner 日志已归档到 [portable-tools-results](portable-tools-results/result.json)，9 项原始文件逐项 SHA-256 相符。两份 `plan-reconstructed.md` 仅按成功配对的 Write/Edit 重建，类型为 generated，不冒充最终磁盘快照。配对摘要在各 case 的 `tool-evidence.json`。

### 本轮已确认

- 两例均只有第 24/25 行的一次成功准备 Bash；没有额外 shell、Agent 或执行 owner Skill 调用。两例的 Skill 调用均为 spec-plan。
- caller 第 107/108 行成功写计划、第 115/120 行成功编辑；blocked 第 132/133 行成功写计划、第 140/141 行成功编辑。路径均在 docs/plans，机械 judge 通过。
- 两例都交付 Durable；blocked 本轮不再错误选择 Chat brief。caller 返回已有 caller，blocked 保留真实授权阻塞。本轮未复现旧 shell 和分档错误，不等于已证明跨 run 稳定。

### 语义仍未验收

1. **caller 的 HTTP 替代验证路径仍不充分。** KTD4 提出导出 entries 或等价接缝，但 U2 仍把独立启动 `node src/server.js` 后发 HTTP 请求视为场景 1–7 的等价验证，包括可控跨月 ts。没有说明 HTTP 路径如何将造数接缝接到该服务进程；若不采用接缝，场景 3 又被保留为缺口，与场景 1–7 全部通过的门槛不一致。无需写完整测试代码，但需说明同进程造数/服务装配路径，或明确替代路径不证明月界场景。
2. **两例将部分未知写成不存在。** 正文虽承认未枚举测试文件，Interface Contracts 又以 package.json 无 scripts 推断仓库无测试设施/契约解析器；caller KTD3 还声称只有一个源文件、无可复用模块。单个 package.json 与已知路径读取不足以支持这些全仓否定判断。摘要中的未知披露不能抵消正文的相反结论。
3. **blocked 的验证只覆盖同月全量/空集。** 当月命中与历史月空集可以识别无条件返回全量，但未覆盖同一数据集里的跨月子集、不同年份相同月份或精确月界。它没有提供这些数据的构造路径，也未把对应证明范围明确列为盲区。不能沿用上一轮“连返回全量都无法排除”的归因；本轮测试已包含空集判别。
4. **readiness 与待决业务语义需一致。** caller 明确要求实施前确认/改写 UTC 等假设，却把全部问题列作非阻塞并设置 implementation-ready；blocked 同样把 UTC 作为未经确认的业务默认。不能因无交互自动认为关键验收语义已确认，也不把所有合理技术默认一律阻塞。月边界选择影响返回记录，需 owner 判断其是否已获委托，或在 readiness 中保留对应依赖。

以上为主任务依据原始输出和成功写入内容的语义审查；没有实施测试，也没有把输出手工修正后计为 PASS。当前接受正式用例的能力适配修订，**不接受整体 Skill 行为修复**。两例的停止条件已到，不再原样重跑；历史 154/155 不变。

## 全套机械回归补齐

两例结束并归档后，顶层 owner 将“新候选收益比较”与“当前冻结版本的覆盖检查”分开：不再修改生产 Skill 或重跑这两例；复用其同版本结果，补跑尚未执行的其余 8 例。这是独立推进回归覆盖，不是推翻语义未验收裁决，也不是把已知缺口视为消失。

- 状态：其余 8 例已结束，6 PASS、2 FAIL、0 ERROR。与前两例合计同一冻结版本十例 8 PASS、2 FAIL、0 ERROR。原始证据见 `portable-tools-remaining-results/`；归因与后续候选见 [产品决策入口验证](bootstrap-owner-2026-11-07.md)。
- 冻结 source、模型、引擎与前两例相同；输出为冻结根目录的 `remaining-runs/`，日志为 `remaining-runner.log`。
- 只在结果返回后合并为“同一冻结版本、两批运行的 10 例覆盖”，不称为一次完整运行或稳定性抽样。
- 语义遗留项继续 open；真实 runtime 同步、提交与发布仍未执行。
