# spec-test-xcode 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-test-xcode/SKILL.md:19-27`；`references/test-and-report.md:7-11` | 每项约束均落在可定位的证据边界或观察规则上，静态文本未见内部矛盾；是否能改善实际测试行为不在本轮静态裁决范围。 |
| D02 | pass | `skills/spec-test-xcode/SKILL.md:19-31`；`references/setup-and-build.md:7-24` | 约束聚焦 Xcode 测试的来源绑定、工具就绪、构建和运行证据，并区分工具观察与语义结论。 |
| D03 | pass | `skills/spec-test-xcode/references/setup-and-build.md:19-24`；`references/test-and-report.md:7-11, 17-23, 40-42` | 构建、安装、启动和屏幕观察分别设有证据门槛；失败保留规则及 PASS/FAIL/PARTIAL 判定可定位。 |
| D04 | pass | `skills/spec-test-xcode/SKILL.md:25-27`；`references/test-and-report.md:27-42` | 结果要求向 caller 传递来源绑定、证据权威、时效、限制和 claim ceiling，并限制进入 run summary 的条件。 |
| D05 | pass | `skills/spec-test-xcode/SKILL.md:14-31`；`references/setup-and-build.md:5-24`；`references/test-and-report.md:5-46` | 入口按准备、测试与报告分层加载；关键步骤和边界可定位，暂未发现影响执行的重复或冲突。 |
| D06 | pass | `skills/spec-test-xcode/SKILL.md:16, 23-27`；`references/setup-and-build.md:7-9` | 明确要求解析当前宿主工具名、区分 readiness 与实际结果，并在 provider 缺失时停止；静态合同不声称跨模型实测通过。 |
| D07 | pass | `skills/spec-test-xcode/SKILL.md:25-27`；`references/test-and-report.md:21-23, 42` | 源码变化触发重建/复测，失败仅由完成的通过复测替换；未见该 Skill 自行推广经验或知识的职责。 |
| D08 | pass | `skills/spec-test-xcode/SKILL.md:14-17`；`references/setup-and-build.md:7-24`；`references/test-and-report.md:3-4` | 按准备和报告阶段加载所需 reference，入口本身也完整列出来源及 URL 效应边界。 |
| B01 | pass | `skills/spec-test-xcode/SKILL.md:3-12`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:123` | 入口限定为 Xcode 模拟器测试、用户显式调用且不能代替静态 Swift review；现有消费者测试还核对其独立入口治理。 |
| B02 | pass | `skills/spec-test-xcode/SKILL.md:14-27`；`references/setup-and-build.md:5-24`；`references/test-and-report.md:25-42` | 输入选择、工具 readiness、执行步骤与报告输出形成一致的静态合同；输出边界没有声称未观察的运行结果。 |
| B03 | pass | `skills/spec-test-xcode/SKILL.md:12, 29-31`；`references/setup-and-build.md:9`；`references/test-and-report.md:15, 21-23, 46` | 测试请求不授权安装工具或修改源码；URL 外部/自定义 scheme 有明确逐次授权门槛，失败调查和清理也受现有权限范围约束。 |
| B04 | pass | `skills/spec-test-xcode/SKILL.md:21-27`；`references/setup-and-build.md:7-9`；`references/test-and-report.md:35-37` | 源码真相身份以构建前后 revision 与 dirty fingerprint 对比；无法绑定时降低结论，未把 MCP readiness 当作运行证据。 |
| B05 | pass | `skills/spec-test-xcode/references/setup-and-build.md:7-9, 19-24`；`references/test-and-report.md:19-23, 44-46` | 工具缺失、各执行阶段失败、待人工确认及运行拥有的日志/模拟器清理均有停止或保留规则。 |
| B06 | pass | `skills/spec-test-xcode/SKILL.md:10, 25-27`；`references/test-and-report.md:7-11, 25-42` | 交付限定于观察到的构建、运行和屏幕；报告字段、未完成项与最终状态均有明确要求。 |
| X01 | not-applicable | `skills/spec-test-xcode/SKILL.md:8-12`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:136` | 本轮对象是 Xcode 测试入口与其静态合同；没有多模块、复杂依赖或长任务的具体样本，故不评估该扩展场景。 |
| X02 | not-applicable | `skills/spec-test-xcode/SKILL.md:8-12`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:137` | 本轮未提供 API、架构或版本变更场景，不据通用测试能力推断迁移/兼容检查适用。 |
| X03 | not-applicable | `skills/spec-test-xcode/SKILL.md:8-12`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:138` | 本轮未提供高风险实现或交付场景；该 Skill 的范围是模拟器测试，不据此要求部署或发布检查。 |
| X04 | not-applicable | `skills/spec-test-xcode/SKILL.md:8-12`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:139` | 本轮未涉及协作、跨会话或知识工作；当前输入是单一 Skill 的静态审查。 |

## Findings

无静态合同层面、具备明确位置及后果的成立问题。

## 主责深挖面发现

- **B01 入口与职责：** `skills/spec-test-xcode/SKILL.md:3-12` 将触发范围限定为 iOS Xcode 模拟器构建/测试，明确区分静态 Swift review，并声明用户显式调用。消费者 `tests/unit/skill-flow-p2-closure-contracts.test.js:107-138` 检查其 `standalone_skill` 投射、route map 登记及 `disable-model-invocation: true`；`tests/unit/ce-localization-round-1-remediation-contracts.test.js:113-120` 固定 URL 授权与不安全 scheme 拒绝。未见入口职责越界。
- **B02 输入输出：** 输入选择、目标身份和 readiness 要求位于 `references/setup-and-build.md:7-24`；报告消费要求位于 `references/test-and-report.md:27-42`。入口、reference 与 `tests/unit/spec-test-xcode-contracts.test.js:11-37` 的字段断言一致。provider 的 readiness 不被提升为构建、启动或屏幕观察结论。
- **B03 授权与信任：** `SKILL.md:12` 限制测试请求的授权范围；`SKILL.md:29-31` 针对 URL fallback 区分拒绝 scheme、解析 loopback URL 与外部/custom scheme 的授权要求，并规定授权缺失时零次 `openurl` 调用。构建测试权限、可见链接或已知 URL 均不被视为外部效应授权。`test-and-report.md:21-23` 也将诊断授权与实施修复区分。
- **B04 source/runtime 与宿主：** `SKILL.md:21,25` 要求构建前后使用相同方法采集 revision 和 working-tree fingerprint，并规定不匹配时不得声称 `source-bound`；`setup-and-build.md:7-9` 要求从当前宿主解析工具名，不将 setup 视为自动安装授权。源码文本没有将生成 runtime 当作修改真相源的指令。
- **X01-X04：** 按本轮提供的评审范围，没有对应的大型依赖任务、API/架构/版本变化、高风险交付或跨会话协作场景；因此各项记为 `not-applicable`，而非推断能力已通过这些场景。

## 未读文件

- 无。本轮已读取 `spec-test-xcode` 入口及其全部 references，并读取消费者清单列出的三个测试文件、检查表第 4 节及合同基线 `08-skill-contract-protocol.md`。

## 结论一句话

在本轮静态合同范围内，`spec-test-xcode` 的入口职责、证据边界、授权约束和报告要求一致且可定位；结论不代表模拟器行为、运行成本或现场收益已验证。
