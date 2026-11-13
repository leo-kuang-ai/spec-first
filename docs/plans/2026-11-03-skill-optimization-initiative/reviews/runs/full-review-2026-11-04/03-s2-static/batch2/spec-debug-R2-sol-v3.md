# spec-debug 评审（R2）

## 逐项裁决表

本表仅裁决 `structure_contract` 静态层。已核对当前 HEAD 为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作区无修改；已读完整入口、全部 6 份 references、全部 eval 资产，以及消费者清单所列 10 个测试文件。未运行测试或行为评测，不据此降低静态裁决，也不外推行为质量、运行成本或真实收益。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-debug/SKILL.md:50`；`skills/spec-debug/SKILL.md:99`；`skills/spec-debug/references/anti-patterns.md:7` | 因果链、竞争假设与预测均针对症状修复和确认偏误，并保留确定性小缺陷短路径，不强迫所有问题进行同等深度调查。 |
| D02 | pass | `skills/spec-debug/references/investigate.md:43`；`skills/spec-debug/references/investigation-techniques.md:346`；`skills/spec-debug/references/defense-in-depth.md:13` | 提供假设审计、性能回归测量和结构性预防知识，因果充分性与防护取舍仍由 LLM 判断。 |
| D03 | pass | `skills/spec-debug/SKILL.md:246`；`skills/spec-debug/SKILL.md:297`；`docs/contracts/verification/verification-run-summary.md:28`；`docs/contracts/workflows/honest-closeout.md:24` | 最终树验证、失败状态和结构化证据要求明确，配套合同没有把记录器或关系校验器冒充进程监督或语义正确性证明。 |
| D04 | pass | `skills/spec-debug/references/pipeline-return.md:55`；`skills/spec-debug/references/pipeline-return.md:71`；`skills/spec-lfg/references/pr-watch-loop.md:33`；`skills/spec-lfg/references/review-followup.md:16` | Debug 返回本地修复、证明测试与限制，调用方消费这些信息并承担最终复验、提交和远端状态确认。 |
| D05 | pass | `skills/spec-debug/SKILL.md:85`；`skills/spec-debug/SKILL.md:176`；`skills/spec-debug/SKILL.md:244`；`skills/spec-debug/references/fix.md:19` | 入口保留关键加载时点，reference 承担操作细节，重复安全提示基本具有定位和防漏读用途。 |
| D06 | pass | `skills/spec-debug/SKILL.md:118`；`skills/spec-debug/SKILL.md:194`；`skills/spec-debug/SKILL.md:223`；`skills/spec-debug/SKILL.md:291` | 不依赖特定模型名；问题工具、并行探针、独立审查和浏览器能力不足时均有显式降级或停止路径。 |
| D07 | fail | `skills/spec-debug/SKILL.md:108`；`scripts/evals/conversation-checks.cjs:19`；`skills/spec-debug/evals/cases/diagnose-then-choice-gate.yaml:9` | 已有回归资产未完全跟随当前合同：既往尝试 Judge 过度限制合法调查，另有诊断 case 缺少 Judge 必需的准备步骤。 |
| D08 | pass | `skills/spec-debug/SKILL.md:95`；`skills/spec-debug/SKILL.md:108`；`skills/spec-debug/references/investigate.md:17`；`skills/spec-debug/references/investigate.md:26` | 要求读取完整 issue 线程、复用已有尝试，历史搜索有界，复杂技术和防护材料按条件加载。 |
| B01 | pass | `skills/spec-debug/SKILL.md:3`；`skills/spec-debug/SKILL.md:25`；`skills/spec-debug/references/investigate.md:11`；`skills/spec-debug/SKILL.md:204` | 故障诊断、授权修复、正常系统优化、既定计划执行和设计重思有明确职责区分，不强制串行经过其他 Skill。 |
| B02 | fail | `skills/spec-debug/SKILL.md:92`；`skills/spec-debug/evals/cases/diagnose-then-choice-gate.yaml:21`；`skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh:52` | 核心输出可追溯，但跨仓库 issue 输入的抓取指令丢失仓库身份，诊断 eval 的输入、准备前提和验证宣称也不一致。 |
| B03 | pass | `skills/spec-debug/references/investigate.md:57`；`skills/spec-debug/SKILL.md:202`；`skills/spec-debug/SKILL.md:223`；`skills/spec-debug/SKILL.md:342` | 材料不是授权，诊断、修复、委派、提交和外向 landing 分离，已授权且未扩大的修复不重复索权。 |
| B04 | pass | `skills/spec-debug/SKILL.md:89`；`skills/spec-debug/SKILL.md:239`；`skills/spec-debug/references/pipeline-return.md:10`；`docs/contracts/workflows/scenario-capability-matrix.md:82` | 明确 source owner 与 runtime mirror 边界，runtime 因果问题先修 source/generation，重新生成仍须独立授权。 |
| B05 | pass | `skills/spec-debug/references/investigate.md:59`；`skills/spec-debug/references/fix.md:15`；`skills/spec-debug/SKILL.md:227`；`skills/spec-debug/SKILL.md:301` | dirty 比较、精确 stash 恢复、失败假设失效、派发重试和缺依赖均有处理，不把未知结果包装成成功。 |
| B06 | pass | `skills/spec-debug/references/fix.md:7`；`skills/spec-debug/SKILL.md:289`；`skills/spec-debug/SKILL.md:291`；`skills/spec-debug/SKILL.md:295` | 修复范围、证明测试保护、审查残余和修改后复验闭环明确，自审与独立覆盖没有混为一谈。 |
| X01 | pass | `skills/spec-debug/references/investigation-techniques.md:45`；`skills/spec-debug/SKILL.md:223`；`skills/spec-debug/references/fix.md:17` | 对跨模块缺陷提供边界取证、独立假设探针和同根影响核查，写面保持单 owner，并行能力不足时顺序推进。 |
| X02 | pass | `skills/spec-debug/SKILL.md:185`；`skills/spec-debug/SKILL.md:204`；`skills/spec-debug/references/pipeline-return.md:24`；`skills/spec-debug/references/defense-in-depth.md:15` | API、默认值和产品契约的有意变化不伪装成收敛修复，迁移或设计决策交回适当 owner，而非要求 Debug 自建架构流程。 |
| X03 | pass | `skills/spec-debug/references/defense-in-depth.md:5`；`skills/spec-debug/SKILL.md:293`；`skills/spec-debug/SKILL.md:325`；`skills/spec-debug/SKILL.md:349` | 高风险缺陷触发额外防护，P0/P1 和必需验证失败阻断交付；修复授权不自动变成发布或生产操作授权。 |
| X04 | pass | `skills/spec-debug/references/pipeline-return.md:36`；`skills/spec-debug/references/pipeline-return.md:53`；`skills/spec-debug/references/pipeline-return.md:71`；`skills/spec-debug/SKILL.md:360` | 决策源集合、证据引用、失效条件、调用方复验责任和知识晋升条件均明确，pipeline 不擅自建立持久或外部接收面。 |

## Findings

### F1 · P2：跨仓库 issue 简写的抓取步骤丢失仓库身份

- **位置：** `skills/spec-debug/SKILL.md:92`。
- **事实：** 入口明确接受 `org/repo#123`，但抓取步骤将它归约为 `gh issue view <number> --json ...`；仅 URL 分支明确保留完整引用，没有要求为简写传递仓库参数。
- **后果：** 当用户引用的 issue 仓库与当前目标代码仓库不同，按该步骤执行会查询当前仓库同号 issue，或报找不到 issue；后续症状、评论和历史尝试可能来自错误记录。
- **最小修复建议：** 对 `org/repo#123` 保留解析出的仓库身份，使用 `gh issue view 123 --repo org/repo ...`，或构造完整 issue URL；增加“当前仓库与 issue 所属仓库不同”的合同负例。issue 所属仓库不应自动改变代码修复的 `target_repo`。

### F2 · P2：一个已登记诊断 case 缺少 Judge 必需的 baseline 准备

- **位置：** `skills/spec-debug/evals/cases/diagnose-then-choice-gate.yaml:9`、`skills/spec-debug/evals/fixtures/scripts/check-diagnosis-no-fix.sh:55`。
- **事实：** 该 case 只要求诊断并初始化 Git；Judge 无条件读取 `.git/eval-baseline.json`。该文件由 `prepare-eval.cjs` 显式生成，见 `skills/spec-debug/evals/fixtures/repos/mini-ledger/prepare-eval.cjs:34`。同类 case 已要求先运行准备脚本，见 `skills/spec-debug/evals/cases/diagnosis-only-no-fix.yaml:8`，当前 case 没有对应要求。
- **后果：** 按 case 明示步骤运行的合规诊断可能因缺少 baseline 而被判失败，混淆 fixture 准备失败与 Skill 行为失败。
- **最小修复建议：** 补齐与相邻 case 一致的准备步骤和“仅准备可创建 baseline commit”的授权说明，或使用明确、可信的 runner 前置准备；不要在 Judge 判分时对候选现场重新建立 baseline。
- **证据边界：** 这是配置中缺少显式前提的静态问题；本轮没有声称实际 runner 已因此失败。

### F3 · P2：诊断 case 宣称验证因果链，Judge 实际只验证现场未改动

- **位置：** `skills/spec-debug/evals/cases/diagnose-then-choice-gate.yaml:3`、`scripts/evals/build-outcome-judges.cjs:167`。
- **事实：** case 宣称验证复现、原因定位和因果链；builder 为 `check-diagnosis-no-fix` 只生成 `checkFixture`，没有诊断结果或取证检查。共享实现仅要求引擎退出成功、最终消息非空及受保护现场不变，见 `scripts/evals/fixture-state.cjs:48`。校准测试也直接提供一句 `JSON.parse causes the crash.`，见 `tests/unit/spec-debug-judge-calibration.test.js:19`。
- **后果：** 在 baseline 正确时，未复现、未定位原因、甚至只有无关非空回复的候选，仍可能满足这个 Judge；其通过不能证明 case 描述中的诊断能力。
- **最小修复建议：** 优先把 case 的确定性验证宣称收窄为“诊断期间保持现场”，另配独立语义裁决检查因果链与证据充分性；或者增加可核验的复现证据检查，但不要用关键词计数冒充因果充分性判断。
- **修复边界：** 修改 builder/helper 后重新生成 Judge，不直接修改带生成标识的脚本。

### F4 · P2：既往尝试 Judge 将合法独立调查误判为违规

- **位置：** `scripts/evals/conversation-checks.cjs:19`，尤其 `scripts/evals/conversation-checks.cjs:28`。
- **事实：** 当前入口要求在重复潜在耗尽路径前补问既往尝试，并允许推进独立证据调查，见 `skills/spec-debug/SKILL.md:108`。Judge 却在提问前拒绝任何参数含 `src/`、测试/启动命令或 `curl` 的调用，不区分独立取证与重复已失败路径。
- **后果：** 例如先读取 `src/server.js` 形成问题，再询问此前尝试，符合当前合同，却会被该 Judge 拒绝；测试会奖励“先问后读”的刚性流程，而不是当前有条件的防重复机制。
- **最小修复建议：** 将场景固定为“即将重复一个已知失败路径”，验证补问发生在该重复动作前；允许独立只读调查。为 helper 增加“独立读源码后补问应通过”和“未补问即重复耗尽路径应失败”的正反校准，再生成两个 Judge。

## 主责深挖面发现

### B01—B04：核心边界整体成立，缺陷集中在输入身份与评测合同

- **入口职责保持现状成立。** `skills/spec-debug/references/investigate.md:11` 区分“已坏的性能”与“正常系统相对优化”；`skills/spec-debug/SKILL.md:204` 只在职责、接口或需求本身有问题时建议设计重思，没有把大缺陷机械等同于重新规划。
- **授权连续性保持现状成立。** `skills/spec-debug/SKILL.md:27`、`skills/spec-debug/SKILL.md:185` 允许已授权修复在诊断后继续；`skills/spec-debug/SKILL.md:239`、`skills/spec-debug/SKILL.md:349` 又明确限制其不覆盖提交、推送、PR 或 runtime regeneration。
- **不可信输入边界保持现状成立。** `skills/spec-debug/references/investigate.md:57` 将评论和事件载荷视为证据而非指令；`skills/spec-debug/references/pipeline-return.md:16` 禁止直接执行日志中的命令或补丁。F1 是记录身份保留不足，不应据此否定已有信任边界。
- **source/runtime 边界保持现状成立。** `skills/spec-debug/SKILL.md:89` 使用“canonical checked-in source”与“generated runtime mirrors”的通用界定；列举的宿主路径不是唯一边界，因此不能仅因列表没有枚举所有宿主就判失效。
- **拟议合同未被误当现行要求。** `core/08-skill-contract-protocol.md:27` 的具体合同没有定义 Debug 输出；按检查表 `process/REVIEW-EXECUTION-WORKFLOW.md:45`，不将其中 YAML 形状、数量阈值和自动重试要求强加给 Debug。

### X01—X04：扩展场景采用有界处理，没有扩大 Debug 的 ownership

- **X01：多模块调查有方法，修复不散写。** 边界取证见 `skills/spec-debug/references/investigation-techniques.md:45`；探针限定只读，主 owner 保留修复责任，见 `skills/spec-debug/SKILL.md:223`。同根影响检查不以“三处命中”作为修复门槛，见 `skills/spec-debug/references/fix.md:17`。
- **X02：兼容性变化交回决策 owner。** `skills/spec-debug/references/pipeline-return.md:26` 将改变 deliberate contract/API/default 的方案归为 `needs-human`；不要求排障 Skill 自行产出 ADR 或实施迁移，是合理职责边界。
- **X03：本地通过与交付授权没有混同。** `skills/spec-debug/SKILL.md:293` 阻断未解决 P0/P1 和必需验证失败；`skills/spec-debug/references/pipeline-return.md:73` 明确 `fixed-not-pushed` 只表示本地结果，调用方仍须确认最终树和远端状态。
- **X04：交接保留证据与失效责任。** `skills/spec-debug/references/pipeline-return.md:53` 规定远端源变化使调查失效；`:71` 传递证明测试、命令/日志与已捕获字节身份；消费者 `skills/spec-lfg/references/review-followup.md:16` 要求补齐缺失身份并在清理后复验。因此没有把上一轮绿色回执当作永久有效证据。
- **工具强制范围没有夸大。** `docs/contracts/verification/verification-run-summary.md:30` 明说记录器依赖如实转录，`docs/contracts/workflows/honest-closeout.md:24` 只保证结构化关系检查；因果充分性、授权理解和检查选择仍是 prose 约定与 owner 判断，不是全部已硬强制。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：已尝试读取，但权限尚未获准；未通过其他方式绕过。后果是无法确认该全局兼容入口中的补充约定；本次已按用户提供的只读、中文、冻结源码和裁决纪律执行。
- **指定必读审查材料无未读项。** 完整读取了 `skills/spec-debug/` 全部 23 个文件、检查表、合同基线、角色契约、消费者清单及其全部 10 个文件，并补读了 Judge 生成源、共享 helper、验证合同和直接 pipeline 消费路径。
- 未读取 generated runtime 镜像或展开其他 Skill 的全部间接依赖：本轮判断限定 fresh-source 静态合同，不声明 runtime 投射、自然路由或跨宿主实际加载已通过。

未运行测试、eval 或浏览器，也未修改、生成、暂存或提交任何文件。

## 结论一句话

`spec-debug` 的核心排障、授权、source/runtime 与扩展交接边界静态成立，但存在 4 项 P2 输入/评测合同缺陷，本轮 18 项裁决为 16 项 pass、2 项 fail，不能据此宣称整体静态审查无缺陷通过。
