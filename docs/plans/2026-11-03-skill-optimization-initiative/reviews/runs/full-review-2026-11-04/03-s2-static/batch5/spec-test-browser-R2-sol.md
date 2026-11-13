# spec-test-browser 评审（R2）

## 逐项裁决表

本轮为 `structure_contract` 静态审查；源码基线为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作区干净。已读取入口、全部同目录 references/scripts/evals、宿主策略文件、检查表、合同基线及消费者清单中的四个测试文件。未运行测试、浏览器或行为评测；以下 pass 仅表示静态承诺存在、内部一致且可定位。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-test-browser/SKILL.md:18-22`、`:43-47`；`tests/unit/spec-test-browser-contracts.test.js:272-342` | exact-origin、隔离与授权约束均对应明确失败方式，不是以流程替代模型能力的无依据补丁。 |
| D02 | pass | `skills/spec-test-browser/SKILL.md:18-20`、`:51-55`；`skills/spec-test-browser/references/route-and-report.md:7-21` | 路由映射与业务效果由 LLM 判断，动作形状、计划完整性和执行边界由脚本承担，分工明确。 |
| D03 | pass | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:278-321`、`:467-509`、`:845-929`；`skills/spec-test-browser/SKILL.md:55` | 必需能力、正负控制、首个 open 与 hash 校验有确定性出口，语义授权明确标为 loud convention，未冒充脚本强制。 |
| D04 | fail | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:440-456`、`:803-820`；`skills/spec-test-browser/references/pipeline-orchestration.md:17` | probe 能产生恢复证据，但 run 内部重新 probe 失败时丢弃该证据，消费者无法完成文案承诺的恢复交接。 |
| D05 | pass | `skills/spec-test-browser/SKILL.md:24-90`；`skills/spec-test-browser/references/route-and-report.md:3`；`skills/spec-test-browser/references/pipeline-orchestration.md:3` | 入口保持短小，路由报告与 pipeline 细节分拆加载，重复规则主要用于保留安全边界。 |
| D06 | pass | `skills/spec-test-browser/SKILL.md:43-47`；`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:124-165`、`:331-459`；`tests/unit/spec-test-browser-contracts.test.js:658-697` | 能力假设落在可探测的工具能力而非特定模型名称，不满足时阻断，并提供 Windows native executable 路径。 |
| D07 | pass | `tests/unit/spec-test-browser-contracts.test.js:461-475`、`:1111-1125`；`skills/spec-test-browser/evals/capability-cases.json:27-66` | 该 helper 不承担经验自动晋升；已有明确的退役面断言、能力反例与维护依据，无须另造知识机制。 |
| D08 | pass | `skills/spec-test-browser/SKILL.md:21`、`:26`、`:32`；`skills/spec-test-browser/references/route-and-report.md:21`、`:38` | 必要原文有读取入口，pipeline 条件加载，路由必须回源，不能用示例表或页面指令替代当前事实。 |
| B01 | pass | `skills/spec-test-browser/SKILL.md:3-4`、`:10`、`:89`；`skills/spec-test-browser/agents/openai.yaml:1-2`；`tests/unit/low-findings-cleanup-contracts.test.js:13-22` | 内部测试 helper 身份明确；测试与诊断分离，不接管服务器或修复循环，也不强迫用户经过该 helper。 |
| B02 | fail | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:184-196`、`:440-456`、`:812-820` | readiness 的结构化输出在 run 边界被裁剪，`conformance_recovery` 等关键上下文未传给实际消费者。 |
| B03 | pass | `skills/spec-test-browser/SKILL.md:12`、`:30-31`、`:51-55`、`:75`；`skills/spec-test-browser/references/route-and-report.md:52` | origin 不等于持久副作用授权，页面输出不产生权限，凭据与调用者字面输入被排除，并允许复用已有精确授权。 |
| B04 | pass | `skills/spec-test-browser/SKILL.md:11`、`:90`；`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:262-268`；`tests/unit/spec-test-browser-contracts.test.js:434-458` | 资产从当前加载 Skill 目录和脚本自身目录解析，不依赖项目 cwd；源码合同、能力探测与宿主现场结果明确区分。 |
| B05 | fail | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:262-275`；`skills/spec-test-browser/scripts/agent-browser-exact-origin-conformance.cjs:50-83`、`:201-249`、`:267-269` | 外层 producer 超时可截断内部 finally 与恢复 receipt 写入，孤立浏览器会话因此存在无可达恢复事实的路径。 |
| B06 | pass | `skills/spec-test-browser/SKILL.md:14`、`:85-90`；`skills/spec-test-browser/references/route-and-report.md:68-70`、`:96-107` | 路由不得遗漏，Fail 不得改写为 Skip，cleanup 独立保留，PASS 的静态条件与 claim ceiling 清楚。 |
| X01 | pass | `skills/spec-test-browser/references/route-and-report.md:21`、`:29`、`:38`；`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:478-500`、`:845-929` | 对多模块任务仅承担当前影响路由的有界验证；计划不可变、失败停止、不自建实施编排，复杂实施依赖仍由 caller 管理。 |
| X02 | pass | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:10-22`、`:278-321`、`:823-837`；`tests/unit/spec-test-browser-contracts.test.js:363-384`、`:461-475` | provider 接口变化通过能力与 identity 校验处理，内部 receipt 有版本，退役接口有显式断言，不要求 helper 承担架构 ADR。 |
| X03 | pass | `skills/spec-test-browser/SKILL.md:51-55`、`:89-90`；`skills/spec-test-browser/references/pipeline-orchestration.md:13-18` | 高风险浏览器效果单独授权，human-only 流程保留缺口，不把局部页面结果扩张为发布或回滚就绪证明。 |
| X04 | fail | `skills/spec-test-browser/references/pipeline-orchestration.md:17`、`:22`；`skills/spec-test-browser/scripts/agent-browser-run-context.cjs:812-820` | caller-owned 协作本身清晰，但 run 内部 conformance 失败的恢复引用未交接，违背该分支明确要求的恢复事实输出。 |

## Findings

### F1 · P2：run 内部探测失败时丢失 conformance 恢复证据

- **位置：** `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:812-820`。
- **事实：** probe 在 `:440-456` 将失败 producer 的恢复位置放入 `conformance_recovery`；但 `runPreparedContext()` 调用 probe 后，只返回 `status`、`reason_code`、`action_process_calls` 和 `blocked_actions`。`conformance_status`、`repair_scope`、`next_action` 和恢复引用均未传递。
- **触发与后果：** 入口要求先独立 probe，而 run 又重新 probe。第一次成功、第二次因 cleanup 失败而阻断时，新增 conformance 会话和私有诊断属于第二次 probe；消费者仅拿到 reason code，无法按 `references/pipeline-orchestration.md:17` 定位 receipt、检查孤立 session/namespace 或恢复清理。清理主 run 的 manifest 不能替代清理这个独立 conformance 会话。
- **最小修复建议：** 在该失败返回中保留有界的 probe 诊断字段，至少传递 `conformance_status` 与 `conformance_recovery`，继续禁止外露原始页面输出；增加“run 内部 probe 返回 cleanup 失败及恢复引用”的消费者断言。

### F2 · P2：外层 conformance 超时缺少可保证执行的清理与恢复路径

- **位置：** `skills/spec-test-browser/scripts/agent-browser-run-context.cjs:262-275`；`skills/spec-test-browser/scripts/agent-browser-exact-origin-conformance.cjs:201-249`、`:267-269`。
- **事实：** 外层 `spawnSync` 默认以 180 秒限制整个 producer；producer 内有多次浏览器动作，每次默认可等待 30 秒，cleanup 依赖其 JavaScript `finally`，恢复 receipt 则在 finally 结束后才写入。
- **触发与后果：** 多次动作缓慢或超时可先消耗外层总预算。外层终止 producer 时，不能保证其 finally 执行，且可能尚未写出恢复 receipt；父进程也不持有子进程内生成的 session/namespace。测试执行仍会被阻断，但孤立浏览器会话可能残留，且无法按现有报告约定提供明确恢复位置。
- **最小修复建议：** 在首次启动浏览器前写出 owner-private 恢复事实；为动作总预算和 cleanup 预留明确边界，使内部能先完成中止和清理。外层强制终止后仍应能返回恢复引用，而非只有 timeout reason code。静态回归应覆盖外层超时与恢复信息可达性，不必为此扩大为通用进程管理器。

## 主责深挖面发现

### B01–B04：总体边界合理，应保留现有职责切分

1. **内部 helper 的暴露方式成立。**  
   `SKILL.md:4` 关闭用户直接调用，`agents/openai.yaml:2` 关闭隐式调用，消费者测试同时检查 governance 中的 `internal_only` 与空 command name（`tests/unit/low-findings-cleanup-contracts.test.js:13-22`）。正文保留 interactive 模式，不等于承诺公开命令入口。

2. **输入的确定性地板与语义义务区分准确。**  
   `SKILL.md:30` 主动说明重复 token 检测仍是 loud convention；wrapper 只校验已解析 scalar，实际限制见 `scripts/agent-browser-run-context.cjs:622-633`。这不是假装脚本已拥有 raw argument enforcement，应保持现状，不能将 prose 测试解释为该 gate 已硬强制。

3. **授权与信任设计成立。**  
   `SKILL.md:51-55` 对 `open`、键盘操作同样按预期效果判断，不把动作名称当授权；`references/route-and-report.md:38` 要求 current source 与 fresh state 双重核对 locator。合成输入、隔离 session 与 exact-origin 不能证明“不会产生业务副作用”，正文没有作这种越界承诺。

4. **source/runtime 解析边界成立，但不等于所有宿主投射已验证。**  
   `SKILL.md:11` 使用加载目录解析 bundled assets，producer 从 `__dirname` 定位（`scripts/agent-browser-run-context.cjs:262-268`）；未要求修改镜像或推断项目 cwd。本文未审查所有宿主 generator，也不作全宿主实际加载通过声明。

5. **主要薄弱点是失败输出，而非入口权限。**  
   F1 是已有恢复事实没有穿过 run → caller 边界，不应以增加审批、公开入口或新 schema 平台解决。

### X01–X04：扩展责任应保持有界，恢复分支需补齐

- **X01 多模块/长任务：** 路由映射以项目当前源码为准，示例不构成固定框架规则；不可表达的 fresh interaction 诚实报告 coverage gap（`references/route-and-report.md:21`、`:38`）。不应要求该 helper 自行分解实施任务或协调共享代码写面。长执行的实际缺口是 F2 的恢复机制。
- **X02 API/版本变化：** 当前模型不靠版本号白名单放行，而是验证能力和 executable identity（`SKILL.md:46-47`）。旧 managed-server 接口直接退役且有测试约束（`tests/unit/spec-test-browser-contracts.test.js:461-475`），该职责内的兼容策略成立。
- **X03 高风险交付：** exact-origin 限制目标范围，effect gate 限制副作用，两者不可互相替代；结果仅证明指定 origin 上的观察，不证明服务器分支身份或发布就绪（`SKILL.md:19`、`:90`）。应保留这个 claim ceiling。
- **X04 协作/交接：** 正常报告要求保留 scope、origin provenance、步骤结果、cleanup 和 limitations（`references/pipeline-orchestration.md:22`）；失败 conformance 的恢复交接则因 F1/F2 断裂。需要补齐既有通道，不需要新增跨会话编排系统。

合同基线 `core/08-skill-contract-protocol.md:27-289` 列举的是其他主链路 Skill；未将其中拟议 YAML、数量阈值或自动判断规则强套到本 helper。对本对象采用其实际 owning source 的输入、输出及消费者合同。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：已尝试读取，工具返回尚未获得权限；未重复绕过。**后果：** 无法核对该全局兼容入口内的额外要求，本报告不声称已遵循其不可见内容。
- **本对象必读范围无未读文件。** 指定四个消费者文件、两个 references、两个 scripts、全部 eval 文件及 `agents/openai.yaml` 均已读取。
- 未继续递归展开消费者测试涉及的其他 Skill、全宿主生成器及测试 helper。**理由与后果：** 它们不是所列必读消费者文件，也非本对象上述 findings 的必要证据；本报告不证明完整 LFG 调用链或所有宿主 runtime 投射一致性。

## 结论一句话

静态审查已覆盖全部 18 项：入口、授权和 source/runtime 边界总体成立，但 conformance 失败存在恢复证据丢失与外层超时清理缺口，故本轮静态合同结论为不通过，且不外推浏览器行为质量或运行收益。
