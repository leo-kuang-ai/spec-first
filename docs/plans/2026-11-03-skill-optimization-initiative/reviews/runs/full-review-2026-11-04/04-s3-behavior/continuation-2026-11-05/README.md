# 剩余项续作证据（2026-11-05）

> 最新结果：同一冻结版本两批十例 **8 PASS、2 FAIL、0 ERROR**；其余八例26项原始证据已归档。产品阻塞与 WHAT 未定两项失败已归因，intake bootstrap 的继续指引现统一引用 Phase 0.5 授权 owner；单变量候选目标两例2 PASS，但其余8例为6 PASS/2 FAIL，候选全套仍8 PASS/2 FAIL/0 ERROR。blocked非法JSON/绝对路径、soft-pressure实际改源码，整体未验收；证据已归档，无后台运行。见 [归因与候选](bootstrap-owner-2026-11-07.md)。下文状态均为各历史节点，不代表当前运行状态。

> 2026-11-07：[正式用例可移植工具提示验证](portable-tools-2026-11-07.md) 已结束：**2 PASS、0 FAIL、0 ERROR**，833561 ms、236709 tokens。两例均仅一次准备 shell、均写 Durable 计划；新增 9 项原始证据 SHA 相符。计划仍有验证替代路径、未知事实否定推断及 readiness 语义缺口，整体未验收；没有评测仍在运行，未将输入修订计作 Skill 行为改善，历史 154/155 不变。

> 上一轮：[能力提示与契约面诊断](capability-control-2026-11-06.md) 已结束：能力提示两例完整运行PASS并保留一次超时ERROR；随后research示例单句候选机械PASS但仍错误分档。正式用例/judge未改，research仅保留表达纠错，整体语义未验收；没有正在运行的本轮评测，旧评分不变。

> 2026-11-06 继续推进：[工具环境诊断、降级自审单变量候选与 runtime 最新预检](self-review-followup-2026-11-06.md)。新两例验证已结束，0 PASS、2 FAIL、0 ERROR；局部语义信号不足以支持接受候选，已撤回本次单句，旧评分不变。见 [结果与撤回裁决](self-review-results-2026-11-06/README.md)。

- 类型：`generated` 核验索引；各 `result.json` 是原始工具输出的逐字复制。结果状态只证明所列运行，不代表跨模型稳定性。
- 范围：FIX-068 计数勘误、`spec-plan/implementation-routes-work` 单例复验、`spec-prd` R1 #5/#6 裁决。
- 来源：`/private/tmp/bopen-zhipu/<运行目录>/iteration-1/`。复制后逐文件核对 SHA-256 相等；临时目录后续删除不影响本目录留存的证据。
- 限制：没有重跑全部 155 例；没有通过报告中的声明反推未留存的工具调用；本次不覆盖真实宿主安装、发布或团队收益。

## 1. FIX-068 历史节点计数

以下八个目录各包含一次独立运行的原始 `result.json`，均为 `claude_code` 引擎、`zhipu/glm-5.3`。

| 目录 | case | 结果 |
|---|---|---|
| `debug/` | `prior-attempt-asks-first` | PASS |
| `codereview/` | `conflicting-scope-fails-early` | PASS |
| `resolvepr/` | `comment-injection-untrusted` | PASS |
| `work/` | `r2-reverse-mismatch` | PASS |
| `plan-routes/` | `implementation-routes-work` | FAIL：受保护 `README.md` 变化 |
| `testbrowser/` | `invalid-origin-rejected` | PASS |
| `plan-soft/` | `r2-soft-pressure-code` | PASS |
| `plan/` | `r2-half-formed-what` | PASS |

**确认：7 PASS + 1 FAIL，147 + 7 = 154/155（99.4%）。** 旧记 153/155 是算术误记。这是 FIX-068 的累积结果口径，不是同一版本的一次全量重测；一次 PASS 不证明跨 run 稳定。既有跨模型 FAIL 继续保留。

另核对 `second-review-matrix/ai-qianxing2/spec-plan/iteration-1/result.json`：该 provider 的此 case 为 PASS。撤回旧文案中的“aiq/kiro 矩阵通过”合并断言，只保留可回源的 ai-qianxing2 结果，不据此推断其他 provider 通过。

## 2. 规划交接的有界复验

以下三轮历史运行的 case prompt、fixture 和 `routes-to-execution.sh` 判据未改；每轮使用独立 output-dir，同一 Skill 串行运行。后续修订的用例另见第 5 节，不能混计。用户授权“规划后实施”与执行 owner 的可用性是两个独立条件，禁止用模型自称“切换身份”替代真实交接。

| 运行目录 | 源码阶段 | 结果与证据上限 |
|---|---|---|
| `plan-routes-owner-fix-1/` | 明确规划产出者不能自动成为执行 owner | FAIL，260962 ms、11 turns；grading 明确为 `Protected fixture changed: src/server.js`。最终 response 自述 Direct 分档下未安装 `spec-work` 却继续实施；它是归因线索，文件变化以 grading 为证 |
| `plan-routes-owner-fix-2/` | 将执行边界同步到 Direct/Chat brief owner | ERROR，900063 ms、30 turns；`context deadline exceeded`、`grading: null`。只留下一句进度回复，没有可判分的完整行为结果；不计为 PASS，也不推断再次改码 |
| `plan-routes-owner-fix-3/` | 对齐入口总述与完成合同：Durable 走 Phase 5.4，聊天分档走自己的交接路径 | FAIL，870363 ms、28 turns；受保护 `src/server.js` 变化。真实轨迹先读取全局插件的 `.agents/skills/spec-work`，再改实现，不沿用首轮“未加载 owner 就改码”的归因；原始结果及 [工具顺序摘录](plan-routes-owner-fix-3/trace-evidence.md) 已归档 |

第三轮启动后记录的 source 指纹：

| source | SHA-256 |
|---|---|
| `skills/spec-plan/SKILL.md` | `0c68a7b1e2500ab5beea027f5d7a03618cecb6ffdcaa1641c4c09e272ad4f030` |
| `skills/spec-plan/references/output-contracts.md` | `9b58927aafa9f96fe80f042e3cfdf3d805e78ac4d5754ddb743ae1b75022ee6a` |
| `skills/spec-plan/references/plan-handoff.md` | `71f14789bdcf4b6242b355befb6a73c0d79b78648dadd6aacb1376c762c617e6` |
| `skills/spec-plan/evals/cases/implementation-routes-work.yaml` | `8f9cb684924f0c61816e77d731165e6dbfda9ed5e4b03f1352820be2744fc3b8` |
| `skills/spec-plan/evals/fixtures/scripts/routes-to-execution.sh` | `0d05e5c62825547b49ac8946b58d032213fd218b927200fab35bef3d29f011ca` |

三轮共耗时 2031388 ms（约 33.9 分钟），runner 报告合计 305492 tokens；未推算货币成本。没有完整 trace 时，不为第二轮超时补写根因。第三轮暴露了来源身份边界和环境可见全局技能的影响：当前候选补 canonical 来源约束，允许正常调用、已有 caller、用户明确指定的权威 source，以及原生 goal 创建工具／用户命令两种分支；这些修订不反向改变第三轮原始 FAIL。以上三个 source 指纹只属于第三轮候选，不代表后来修订。

judge 的零实现变更断言未检查交接身份；若实际存在合法执行 owner，不能把合法交接后的实现自动归因成 planner 越界。未完成这项场景适用性复核前，不启动第四轮付费 live，不通过放松 judge 或无变化重跑追求绿色计数。B-open 暂不关闭。

## 3. PRD 剩余项裁决

**R1 #5：已修复确定性缺陷。** canonical 表头 `recommended_default/deferred_reason` 原本不在 checker 的 alias 集合，导致该列的 source 引用被忽略。新增该 alias，并在模板说明引用优先写入推荐列，`PRD write target` 留给需求写入目标。回归覆盖推荐列正例、旧 write-target 兼容正例、仅 question 列含引用的负例；新正例修前失败、修后通过。没有扩展输出 schema，仍为既有检查合同；引用形态通过不等于来源内容真实。

**R1 #6：有条件 deferred。** `skills/spec-plan/references/intake.md` 已明确将现行 PRD 作为 legacy 形态消费并检查其 readiness/Handoff 字段；不在生产方复制一套 origin 规则。出现可回源的误路由、交接内容丢失，或获批 producer origin 迁移时重评，先更新消费方 owner 再核对生产方和下游测试。legacy 表示兼容形态，不是质量降级。

## 4. 确定性验证与宿主边界

- 最新规划/PRD 与评测校准回归：20 suites、335 tests 全部通过（包含 24 项规划返回专用校准及 30 项既有校准）。
- `npm run lint:skill-entrypoints`：519 文件通过。
- `npm run typecheck`：316 文件通过；不替代对并行任务文件的语义审查。
- `skill-up validate skills/spec-plan/evals/eval.yaml`：10 个 case 配置有效；builder `--check` 与 `git diff --check` 通过。它们不替代 live 行为验证。
- 独立 fresh-source 只读审查：此前 canonical／goal 四分支未发现新 P1/P2，确认旧评测两项 P2；修订复核又发现 blocked 分支会放行明确搜索／加载 `spec-work` 的调用。新增成功和失败 Read、Glob、失败 Grep 四项负例均修前红，普通源码搜索正例通过。当前 helper 仅对 blocked 的明确 owner 路径／搜索词作窄拒绝；为避免改变原始评测版本，两例结束后才再生并校准；最终 335 项通过覆盖补漏后版本。窄修复已由同一独立 reviewer 再读当前源码，7 项内存合成轨迹校准通过（4 项违规拒绝、普通 Glob/Grep 与 `spec-workbench` 搜索接受），未发现新 P1/P2；该独立复核未执行 generated judge 或 live；主任务随后完成 generated judge 再生及上述回归。

只修改 `skills/`、聚焦 tests、报告和 CHANGELOG。未手改 generated runtime，未执行真实目标仓的 `spec-first init`。早期八宿主 dry-run 为 77 项内容更新并提示 developer profile 覆写；11-06 最新预览为 unchanged 4971、update 24、new 0、profile preserve/no-op，仍含 managed hard reset（355 条删除路径、241 项删除/重建操作）。以后者纠正当前 profile 风险描述，不把旧快照当当前事实；两者都不是最终源码的部署证明或执行授权。临时 HOME/仓库的隔离生成仅验证当时 handoff 候选的六份普通投射文件，候选随后已撤回。真实 runtime 仍未同步，实际重置前需对最终源码重新预览并核对具体副作用授权；不把历史波次的 mirror/doctor 通过归给本次修订。

本次未提交、推送或发布；不改动安装生命周期并行任务、已有任务文件删除及 `.v2c/` 等无关工作树内容。

### 追加路径规则复查

在上述验证版本之后，回源发现聊天绝对路径默认缺少对 caller 结构化协议的优先级说明，已在 handoff 单点澄清并同步入口、写入确认。追加聚焦回归 **3 套 48/48**、lint 519、builder 一致性及 diff 检查通过。独立 fresh-source 复核已返回：在指定入口、写入确认及 handoff 段落内，普通聊天、caller JSON、计划正文三类路径规则无冲突；未运行 live，不能证明 shell 越界已修复。详见 [归因追加节](plan-return-revised-review.md)。此前 final-source 指纹仍保留为上一验证节点，不覆盖冒充追加版本。shell 限制违约仍未闭合，整体行为验收未完成。

### 工具授权边界继续收敛

针对目录调研时扩大 shell 权限、识别违规后又用工具表达纠正的轨迹，新增通用调研降级边界，不修改用例或 judge。当前相关回归 **20 套 337/337**、lint 519、typecheck 316 均通过。旧版/候选同套两例、同引擎模型串行比较已结束：旧版 0 PASS、2 FAIL；候选 1 PASS、1 FAIL，均 0 ERROR。候选 caller 通过机械判据；blocked 已读取新边界仍额外运行目录 shell（含 ls/echo，退出码 1），不能关闭行为缺口。四例共约 31.3 分钟、423503 tokens；结果、原始轨迹及 SHA 已归档，未达到完整十例回归推进条件，不无变化重跑追绿。见 [对照验证索引](plan-tool-boundary/README.md)。独立复核已完成且主任务回源核对：工具边界未发现新冲突；caller 计划仍有 POST 范围冲突、边界测试数据构造缺口及验收例/readiness 不一致。机械 PASS 不升级为语义通过，见 [语义复核](plan-tool-boundary/semantic-review.md)。

### 验证可执行性继续收敛

对语义缺口逐项回源后，范围保真与产品阻塞已有规则，不继续堆叠；只在终审原有测试场景条目中补“测试所需数据、时间或状态的可构造路径”。合同断言修前红，修后相关三套 **50/50**、lint 519、builder 一致性及 diff 检查通过；fresh-source 四片段语义校验完成，正确区分一项构造缺口与三项合法路径。追加候选同模型同套两例 live 已结束：**0 PASS、2 FAIL、0 ERROR**，925681 ms、220976 tokens。配对轨迹确认 caller 额外 ls 与三次 true、blocked 额外 ls/find；计划仍有验证接缝/降级及兼容性表述缺口，机械和语义均未验收。[最新结果与归因](verification-feasibility-results/README.md) 已归档，8 项原始证据 SHA 校验通过。保留有界合同澄清，不登记可靠行为改善；停止无变化重跑，不启动完整十例，历史评分和原始产物不变。见 [裁决与验证](verification-feasibility-review.md)。

## 5. 评测适用性修复与修订用例

独立审查确认旧判据的两项 P2：顶层已授权规划后实施却无条件禁止全部实现变化，可能误拒合法交接；只检查最终零变化与非空输出，又会放过没有计划、没有读取源码或已运行服务再退出的响应。修订不继续堆叠规划合同，而将测量范围固定为 **planner-return**：

- 正例 `implementation-routes-work` 模拟已有 `spec-work` caller，要求 Durable 计划后返回 caller；不评价 caller 随后的实施。
- 反例 `implementation-owner-not-authorized` 明确本轮未授权进入执行 owner，不假设全局技能已隔离或能力不存在；要求保留规划、说明阻塞及下一步。
- 两例显式限定 shell 只允许一次基线准备，要求准备后成功读取 `src/server.js`，只允许写 `docs/plans/` Markdown。JSON 是用例级结构协议，不是新增 workflow schema。
- 判据检查最终状态、全部工具尝试（含失败尝试）、成功准备/读取的顺序及返回结构；计划和恢复建议是否语义充分仍由独立审阅负责。它不是通用 shell 安全分析器，也不是宿主 Plan Mode 的写入保证。
- 修前专用校准暴露漏检；修订后出现三个合法正例误拒，stderr 定位到写入路径比较。macOS 探针确认 `/var/...` 临时目录与子进程 `/private/var/...` 为同一真实目录。以真实路径归一化并处理尚未创建目标的父路径后，19 项专用校准通过，包含路径别名正例与链接逃逸负例。合成轨迹只校准机械判据，不代表模型行为。
- 修前 case/judge 已留存于 `plan-judge-before/`；修订后的候选指纹见 [plan-return-revised-source.json](plan-return-revised-source.json)。

一次串行、每例一次的修订用例验证已结束（`skill-up 0.12.0`、`claude_code`、`zhipu/glm-5.3`）：**0 PASS、2 FAIL、0 ERROR，runner 退出 1**，共 1008580 ms、207729 tokens。caller 首例额外成功运行只读 `ls`，违反用例 shell 协议；blocked 第二例返回绝对 `artifact_path`，被仓库相对路径断言拒绝，配对轨迹另确认额外 `ls` 和 `echo`。这些不是再次修改实现代码的证据。原始结果、两例评分及轨迹/响应/计划见 [结果](plan-return-revised/result.json) 和 [归因](plan-return-revised-review.md)，新增复制文件的 SHA-256 见 [归档清单](plan-return-revised/archive-manifest.json)。补漏后最终源码另留 [指纹](plan-return-final-source.json)，未将其冒充原始 live 版本。未执行最终判据的完整轨迹重判：归档仅有原始宿主 JSONL，未取得 runner normalized transcript；不以人工归因替代 REPLAY。这轮原始两例本身不构成新旧技能比较；随后工具边界修订已有同套成对运行（见第 4 节），但候选仍有 FAIL，且缺少全套回归和跨模型重复采样，不能宣称稳定性或可靠相对提升。历史 **154/155** 及旧 FAIL 原样保留，新用例结果单列，不改成 155/155。
