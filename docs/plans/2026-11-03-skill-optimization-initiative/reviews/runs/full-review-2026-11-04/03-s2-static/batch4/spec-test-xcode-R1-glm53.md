# spec-test-xcode 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-test-xcode/references/setup-and-build.md:19,22；references/test-and-report.md:7,11,15,23,42 | 每条规则锚定已命名失败模式（bundle ID 误推、launch/tap 假阳性、人证伪造、失败被降级），无相互矛盾或过时约束，仅工具名对冲覆盖不一致（F1） |
| D02 | pass | setup-and-build.md:15,19；test-and-report.md:11,15 | 领域知识具体（部署目标兼容、SwiftUI AttributedString 假 tap、SIWA/推送/沙盒购买人验清单、URL scheme 危险面），provider 确定性事实与模型语义判断分工明确 |
| D03 | pass | setup-and-build.md:9,19-22；SKILL.md:25；test-and-report.md:23,42 | 各阶段验证门显式、失败可见；FAIL 优先与 PARTIAL 不得升 PASS 单一来源；prose 门未谎称脚本硬强制，且被 tests/unit/spec-test-xcode-contracts.test.js:13-37 逐字钉住 |
| D04 | pass | SKILL.md:4,27；test-and-report.md:23,29-38 | 上游参数（scheme/'current'）与 setup-and-build.md:13 一致；spec-debug 交接明确"授权诊断非交付尾巴"；caller 引用条件与 verification-run-summary.v1 的字段所有权（spec-work shipping-workflow.md:40）不冲突 |
| D05 | pass | SKILL.md（31 行）+ 两 reference（24/46 行）共 101 行 | 零重复：source binding 只在入口陈述、reference 仅回指（test-and-report.md:3）；PASS/FAIL/PARTIAL 裁决规则只出现一次（test-and-report.md:42）；关键规则全部可定位且有测试锚 |
| D06 | pass | setup-and-build.md:7,9；test-and-report.md:15；SKILL.md:21 | 能力假设（MCP 连接、宿主问题通道、Git）各有降级路径：工具缺失即停并给指引、无通道则直问、非 Git 目标显式记为限制 |
| D07 | pass | git 595d404f/19229a2e/01fad369；docs/project-reviews/evidence/S12-spec-test-xcode/repair-2026-11-02/verification-run-summary.json；evals/cases/mcp-unavailable-stops.yaml | 问题→修订→复验链完整：CE 证据融合压缩、交叉测评 6/6、repair run summary、eval 回归网与三组合同测试钉住 |
| D08 | pass | SKILL.md:14-17,21 | 两段按需加载点覆盖全执行期且无重叠；pre-build identity 只记一次、仅 rebuild 前 refresh；built path/bundle ID/log handle 从返回值复用不重复 discovery；总上下文仅 101 行 |
| B01 | pass | skills/using-spec-first/references/public-route-map.md:61；docs/user-guide/24-公开入口与Skill目录.md:84；SKILL.md:5,12 | 正向路由明确（iOS Simulator 构建/验证）；disable-model-invocation + "user-invoked only" 双重声明；静态 Swift review 负例分流；SF-23（skill-flow-p2-closure-contracts.test.js:136-137）钉住无伪造集成边 |
| B02 | pass | tests/unit/spec-test-xcode-contracts.test.js:13-37；consumers.txt 所列 3 文件 | 入口/reference/测试三方标记一致（含 ce-localization-round-1-remediation-contracts.test.js:113-120 钉 URL 边界）；readiness 来源清晰；清单外另有 3 个投射类消费者未列入（F6） |
| B03 | pass | SKILL.md:12,31；setup-and-build.md:9；test-and-report.md:21,23 | 测试请求不授权安装/改码/commit/push/PR；安装 provider 需单独 setup 授权；修复仅在既有 mutation 权限内；URL 效应有 run-local 授权事实 + reason code + 缺权零调用保证 |
| B04 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:618-630；tests/integration/init-six-host-lifecycle.integration.test.js:240 | 真相源在 skills/（5 个 tracked 文件）；8 宿主 skill 投射有治理记录与集成测试；冻结 worktree 未生成 runtime 镜像属环境状态非漂移缺陷 |
| B05 | pass | setup-and-build.md:9,19-24；test-and-report.md:21-23,42,46 | 逐阶段 stop、部分成功有 PARTIAL 语义、retest 替换规则、cleanup 限于 run 句柄且不动他 session 模拟器；重试上限与中断句柄恢复未显式（F2） |
| B06 | pass | test-and-report.md:29-42 | 交付合同完整：claim ceiling 限定为实际观察、剩余失败必列、limitations 必填、Skip 不可被失败顶替亦不可反向 |
| X01 | not-applicable | setup-and-build.md:17-24 | 单一 App 的线性阶段流程（readiness→build→install→launch→test→report），无多模块分解/长任务编排职责；所需阶段依赖顺序与恢复已由 B05 覆盖 |
| X02 | pass | setup-and-build.md:7,9 | 外部 provider（XcodeBuildMCP）接口漂移有对冲：resolve-actual-tool-name + "provider's current documented host configuration path"（含 `npx -y xcodebuildmcp@latest` 示例）；对冲仅覆盖首个工具名（F1） |
| X03 | not-applicable | SKILL.md:31；test-and-report.md:44-46 | 测试执行型 skill 无生产发布/部署/回滚面；本地模拟器效应可逆且受 URL 授权门与 run 范围 cleanup 约束 |
| X04 | pass | test-and-report.md:15,23,29-40 | 触发成立（人机协作、spec-debug 跨 workflow 交接、caller 返回）：caller 返回证据包 9 字段完整；debug 交接包未显式枚举 source identity/freshness（F3） |

统计：16 pass / 2 not-applicable / 0 fail / 0 not-verified。

## Findings

**F1（P3，D01/X02）provider 工具名对冲不一致**
- 位置：skills/spec-test-xcode/references/setup-and-build.md:7
- 事实：仅 `list_simulators` 附带 "resolve the actual tool name from the active host"；其余 10 个工具名（discover_projs、list_schemes、boot_simulator、build_ios_sim_app、install_app_on_simulator、launch_app_on_simulator、capture_sim_logs、take_screenshot、get_sim_logs、stop_log_capture）按字面引用。
- 后果：XcodeBuildMCP 后续版本更名任一工具时，prose 会诱导模型把"名字不符"误判为工具缺失或错误调用，与 L7 的一般化意图自相矛盾。
- 最小修复：将 L7 对冲句升格为 reference 级说明（如"本文件工具名以当前宿主实际连接的 XcodeBuildMCP 为准"），或在两个 reference 顶部各加一行。

**F2（P3，B05）retest 无上限、中断后句柄状态未声明**
- 位置：skills/spec-test-xcode/references/test-and-report.md:23,44-46
- 事实：retest 循环仅有 "Only a completed passing retest replaces Fail"，无重试上限；cleanup 只在正常收尾执行，会话中断后 run-owned 的 simulator boot/log capture 句柄无恢复声明。
- 后果：失败驱动场景可能反复 rebuild 无终止条件；中断后新会话可能假设旧 capture 句柄仍有效。
- 最小修复：L23 补一句上限/升级条件（如连续失败即停止并报告）；可注明中断后不得假设旧句柄有效。中断泄漏本身可接受现状（句柄天然 run-local）。

**F3（P3，X04）spec-debug 交接包字段薄于仓库 handoff gate**
- 位置：skills/spec-test-xcode/references/test-and-report.md:23
- 事实："hand the specific evidence and existing authority to spec-debug" 只列 evidence + authority，未显式包含已记录的 pre-build source identity 与 freshness。
- 后果：debug 侧缺少源身份/新鲜度上下文，需要重新发现，弱化跨 workflow 交接的 summary/source refs/freshness/limitations 四要素。
- 最小修复：该句补 "including the recorded source identity and freshness"。

**F4（P3，D07）eval case 断言强度不足**
- 位置：skills/spec-test-xcode/evals/cases/mcp-unavailable-stops.yaml:16-23
- 事实：rule_based judge 的 success 仅 `output_contains: ["XcodeBuildMCP"]`；被测行为即使违反停止规则继续 build/test，只要输出提到 XcodeBuildMCP 即判成功。
- 后果：该回归网检不出"未停止"这一它声称守护的核心行为。
- 最小修复：must_contain 增加停止语义标记或负面断言（如输出不得含 build_ios_sim_app 调用痕迹）。

**F5（P3 观察，D08）指纹方法未指定——保持现状成立**
- 位置：skills/spec-test-xcode/SKILL.md:21,25
- 事实："the same method as the latest pre-build identity" 保证 run 内可比，但方法本身开放；与 spec-work 的 `spec-work-working-tree-fingerprint/v1`（skills/spec-work/references/return-to-caller.md:42）无桥接。
- 后果：caller 若需与自身 fingerprint 体系对账需另行换算。这是 standalone、宿主无关定位下的刻意设计；在 caller 提出强对账需求前保持现状成立。

**F6（P3，B02/B06）输入包消费者清单不全**
- 位置：docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-test-xcode.consumers.txt
- 事实：清单只列 3 个 prose-contract 测试；tests/unit/plugin-modules.test.js:118、tests/unit/project-graph-consumption-contracts.test.js:70、tests/integration/init-six-host-lifecycle.integration.test.js:240 同样断言该 skill 的治理/投射事实，未列入。
- 后果：按清单做影响面回归会漏掉三处（本评审已补读核对，断言与现状一致）。
- 最小修复：更新 input pack 或在总报告登记为补充消费者。

## 主责深挖面发现

**D01 去补丁化**：逐条映射补丁→失败模式——工具名漂移（setup:7）、bundle ID 误推（setup:19）、launch 后即崩假阳性（setup:22）、无效果 tap 假阳性（test:7）、AttributedString 平台 bug（test:11）、人证伪造三反例"未答/耗时/工具成功"（test:15）、失败被 Skip 化或被继续执行抹除（test:23,42）、脏树错绑"Revision alone cannot bind"（SKILL:25）。全部可定位、彼此无矛盾，无可安全删除的冗余补丁；唯一弱点是 F1 的对冲不对称。

**D02 领域知识**：约束均带决策依据而非口号——模拟器需与 deployment target 兼容且优先复用已启动设备（setup:15）、bundle ID 只取 artifact facts 或实际 Info.plist（setup:19）、URL 危险 scheme 白黑名单（SKILL:31）、人验流程清单枚举真实 iOS 能力门（SIWA/推送/沙盒购买/相机照片/定位/内联链接，test:15）。职责分工：provider 返回 artifact facts/log handle/截图为确定性事实，模型只做屏幕语义判断且必须先记录预期再交互（test:7）——无脚本是 provider 驱动 skill 的合理形态，非职责缺失。

**D03 验证门**：七道门全链条——readiness（setup:9）、build→install（setup:19）、install/launch stop（setup:20-21）、可见运行确认"launch 成功不等于 app 还开着"（setup:22）、source-bound 比对（SKILL:25）、整体裁决（test:42）、retest 替换（test:23）。诚实区分了 prose 门与脚本门：skill 从未宣称 runtime 硬强制，静态合同由 spec-test-xcode-contracts.test.js 钉住——符合"缺强制能力时显式降级为响亮约定"的仓库纪律。

**D04 衔接**：输入契约（argument-hint ↔ setup:13 消费语义）双向一致；输出证据包 9 字段（Provider/Target identity/Source binding/Evidence authority/Freshness/Limitations/Claim ceiling 等）与 spec-work closeout 的字段分工（shipping-workflow.md:40 将 evidence authority/source binding 置于 check 字段之外）语义兼容——"cite only with full context, otherwise keep outside the summary" 恰好落在这个所有权边界上；唯 spec-debug 交接薄一档（F3）。

**D05 紧凑性**：101 行全仓最紧凑一档；职责切分为"入口持有边界、reference 执行应用"两段式，source binding 与 URL 边界在 reference 中只回指不复制（test:3）；裁决规则单点。删除任何一段都有测试或路由依赖受损，无冗余可删。

**D08 上下文效率**：两段加载触发点精确覆盖执行期且无重叠窗口；事实复用纪律明确——identity 记一次、仅 rebuild 前 refresh（SKILL:21），build 产物三要素（path/log handle/bundle ID）从首次返回值保留（setup:19-22）；summary 不要求任何额外读取。未发现可再压缩的必读面。

## 未读文件

- `docs/plans/2026-11-03-skill-optimization-initiative/core/03、04` 及 archive 中涉及本 skill 的历史段落：理由——静态盲评以当前源码为证据源，历史分析仅线索；后果——D07 历史归因面可能不全（已用 git 历史、repair-2026-11-02 证据、三组合同测试三角补偿，风险低）。
- consumers.txt 未列的三个投射类测试全文（plugin-modules / project-graph-consumption / init-six-host-lifecycle）：理由——输入清单未列为必读，已 grep 核对全部命中行断言；后果——投射断言的完整测试上下文未逐行验证（与 F6 合并处置）。
- `docs/validation/` 下 wave6 等 xcode 行为层评审 JSON：理由——属 S3 行为层证据，本轮只裁静态合同；后果——无。

## 结论一句话

spec-test-xcode 以 101 行维持了完整的 fail-closed 证据、授权与失败语义合同，18 项裁决 16 pass / 2 not-applicable / 0 fail / 0 not-verified，仅余 4 条 P3 可选收紧（F1-F4），不构成阻断。
