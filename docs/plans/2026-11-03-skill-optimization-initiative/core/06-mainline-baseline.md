# 主链路基线：PRD → Plan → 可选 Tasks → Work → Review

日期：2026-11-03

基线类型：当前磁盘源码与本地合同检查（`structure_contract`）

状态：本轮基线已建立；`behavior_quality`、`runtime_cost`、`field_outcome` 未评测。

## 结论与范围

主链路已经定义了需求保留、验收与验证传递、任务包新鲜度、只读审查和验证收尾约定。**当前证据不支持把这些能力一概描述为缺失，也不证明它们在真实模型与任务中已可靠兑现。** 下一步应检查具体执行与交接失败，再决定修改位置。

本轮覆盖五个源码入口及与交接直接相关的引用和 8 组既有测试。不是对五个 Skill 全部资源的穷尽审计，也没有重跑过去 22 项审查、11 个历史任务或真实宿主加载测试。

### 可回溯身份

- Git HEAD：`6e056d9f2077647624d4937216a3c44492583c96`。
- 分支：`leo-2026-10-27-update`。
- 以当前磁盘字节为准；入口与证据引用的 SHA-256、38 项入口类型、受保护源码树摘要在 [source-baseline.json](evidence/source-baseline.json)。不能仅凭 HEAD 推断工作区内容。
- 本轮开始前已存在 CHANGELOG、research 文档和整个 initiative 目录的未提交内容；不把它们归为本轮新建成果。恢复执行时 README/进度已被其他工作更新，本轮基于重新读取的版本增量补充，保留其他修改。
- 日志与逐项检查结果在 [checks.json](evidence/checks.json) 和 [mainline-contract-tests.log](evidence/mainline-contract-tests.log)。

## 产物流与分工

下图是消费者关系，不是所有任务都必须经过的固定流程。

```text
既有系统需求 → spec-prd → docs/brainstorms/*-requirements.md
                              ↓ 作为 legacy requirements origin 消费
直接明确输入 ──────────────→ spec-plan → implementation-ready plan
                                              ├──────────────→ spec-work
                                              └→ 可选 Tasks ─→ spec-work
                                                                    ↓
                                                        定向审查或 spec-code-review
                                                                    ↓
                                               Work/调用方落实 findings、复验、收尾
```

另一路 `spec-brainstorm` 产生 requirements-only unified plan，Plan 在同一产物补充 HOW 并保持 Product Contract 字节不变；不要把这条路径与当前 PRD 的 legacy requirements 路径混为一体。没有 PRD 不必然阻塞 Plan 的直接输入路径；没有 Tasks 不阻塞 Work 直接执行。

| owner | 输入与输出事实 | 关键边界 | 直接源码依据 |
|---|---|---|---|
| PRD | 既有系统增量/材料 → WHAT、WHY、R/AE、边界、未决问题、readiness | create/refine 与 validate 分离；finalize 拥有 machine receipt，LLM 判断语义；validate 不写产物 | [PRD entry](../../../skills/spec-prd/SKILL.md)，Purpose / Phase 4；[output template](../../../skills/spec-prd/references/prd-output-template.md)，Handoff Context Slice / Closeout Summary |
| Plan | 需求或直接输入 → Planning Contract、U-ID、Verification Contract、DoD | 不修改 upstream-owned WHAT，不以 assumptions 洗掉真实产品阻塞，不执行实现测试 | [Plan entry](../../../skills/spec-plan/SKILL.md)；[intake](../../../skills/spec-plan/references/intake.md)，0.2–0.5；[sections](../../../skills/spec-plan/references/plan-sections.md) |
| Tasks | settled active plan → 可选 derived task pack 或 skip/return-to-plan 等结果 | Plan 拥有范围；hash/validate 证明结构与来源，不证明语义充分；任务包不拥有进度/批准状态 | [Tasks entry](../../../skills/spec-write-tasks/SKILL.md)，Core Rules / Final Decision Envelope |
| Work | implementation-ready plan、有效任务包或明确请求 → 实现、验证与限制 | readiness、目标 repo、dirty overlap、任务漂移分别处理；所有 required proof 做收尾对账 | [Work entry](../../../skills/spec-work/SKILL.md)；[work intake](../../../skills/spec-work/references/work-intake.md)；[shipping](../../../skills/spec-work/references/shipping-workflow.md)，Required-Proof Reconciliation |
| Review | reviewed diff 与可选 plan/task context → findings、coverage、限制 | 默认 report-only，mode:agent 始终只读；task review 与 whole-plan completeness 分开；修复由已获授权调用方负责 | [Review entry](../../../skills/spec-code-review/SKILL.md)；[intent and plan](../../../skills/spec-code-review/references/intent-and-plan.md)；[Work followup](../../../skills/spec-work/references/review-findings-followup.md) |

## 逐段交接基线

| 编号 | 交接 | 当前承诺 / 消费规则 | 确定性与语义边界 | 本轮检查与剩余问题 |
|---|---|---|---|---|
| H01 | PRD → Plan | PRD 保存 WHAT/验收/阻塞与摘要；Plan 将当前 PRD 作为 legacy origin，继承来源约束，不重写 origin | Producer finalize 为 PRD ready 声明提供机器事实；consumer receipt 检查是可选诊断，不得新增强制前置 | 5 项 handoff 合同检查通过；真实模型是否完整消费仍未测 |
| H02 | Plan → Work（直接） | Work 先分类 metadata/readiness/lifecycle，再读取 Goal、Verification、DoD、相关 U/R/F/AE/KTD 与已定决策 | 入口与引用是语义约定；合同文本匹配不等于宿主硬拦截或正确实施 | 16 项 Plan quality、12 项 consumer replay 检查通过；未执行真实需求落地 |
| H03 | Plan → Tasks → Work | task pack 固定 source_plan/body hash，Work 重新读取当前 readiness；保留任务引用、done_signal、stop_if、review intent | body hash 不包含 frontmatter，因此不能代替 readiness 重验；validator 不判断任务划分的业务充分性 | 8 项 Tasks、7 项 Work intake 检查通过；没有生成本轮真实任务包 |
| H04 | Work → Review | 有 plan 的 Work 调用传 plan:；task review 带 task context；Review 对齐范围与意图 | 无 plan 的普通 diff review 合法，但不能声称验证了未提供的需求；只读评审不授权修复 | 29 项 Review 合同检查通过；真实缺陷发现率和误报率未测 |
| H05 | Review → Work → 收尾 | 复用返回的 findings/artifact，不无故重开 review；处理 residual，修改后复验并对账 required proof | checks 全绿不能替代对全部验证意图的语义对账；临时路径不是 durable evidence | 5 项 consumer-chain、13 项 shipping 检查通过；没有执行本轮完整实现/审查循环 |

### 已确认的源码事实

1. **需求分析并非空白。** PRD 入口已有 Requirement Analysis、Product Expert Lens、Requirements Grill 与 Readiness Lens。NEW-04 应先验证这些机制是否有效，不能直接认定只有需求记录能力。
2. **验收保留已有 producer 与 consumer 约定。** Plan intake 要求携带上游需求、AE、范围、决策和未决问题；Work intake 要求读取 Verification Contract、DoD 和相关单位。是否实际遗漏须用任务轨迹证明。
3. **Tasks 是可选派生层。** 不应为了让整套 Skill 都“参与”而强制生成任务包。
4. **验证收尾已有独立 owner。** Work shipping 区分实际结果、证据权威、源码绑定与 required-proof reconciliation。prose 约定不是完整机械保证。
5. **Review 有需求完整性与反向需求核对。** 不能把它预设为只检查语法；能否识别实际语义缺陷仍须评测。

## 候选假设与可复用验证场景

以下不是已确认 bug，也不是已执行行为用例。先用当前版本固定基线，发现问题后再对比候选修改；不得把 expected answer 放进被测输入。

| 场景 ID | 目标与输入 | 观察与判据 | 已有资产 / 下一步 |
|---|---|---|---|
| ML-01 | PRD 中来源已明确的行为与验收 | 是否引用已有事实而非重复询问；是否保留要求与非目标 | 复用 [PRD evals](../../../skills/spec-prd/evals/examples.json)，筛选 source-resolved 类案例；实际模型未运行 |
| ML-02 | checkpoint-prd / can_enter_spec_plan: no / 未闭合产品问题 | 不凭 headless、旧日期或“自主决定”伪造上游 ready；保留问题及可继续的独立工作 | 复用 PRD handoff test 与 [Plan consumer replay](../../../skills/spec-plan/evals/consumer-replay-cases.json)；行为未运行 |
| ML-03 | 长 PRD，摘要只有部分 R/AE，正文还有必要边界 | 摘要是导航，不成为范围裁剪；Plan/Work 必须覆盖本次任务全部相关验收 | 既有 handoff-context-slice-no-how 与 consumer fixtures 为起点；需先检查是否足以构成贯穿场景 |
| ML-04 | 低风险单边界计划，未要求任务包 | 允许 Plan→Work 直接执行，必要验证不减少 | Tasks skip 与 Work direct intake 合同已检查；任务执行未运行 |
| ML-05 | task pack body hash 有效，但 source plan readiness/lifecycle 已变化 | Work 独立重验 metadata，不把 hash matched 当可执行 | Work intake 合同已检查；后续复用实际 validator fixtures 验证对应分支，不先造新 runner |
| ML-06 | 已实现主流程但漏一条必要边界；另一对照案例有无关未实现 U-ID | final review 识别本次真实遗漏；task review 不误报未进入任务范围的 U-ID | Review intent-and-plan 与 contract tests 为依据；缺陷检出与误报行为未运行 |
| ML-07 | Review 返回 findings，修复后代码变了或必要检查未跑 | caller 消费现有 findings；必要验证 fresh rerun；未完成不伪装完成 | Work consumer/shipping 合同已检查；真实修复循环未运行 |

初始关注顺序：ML-01/02/03（PRD→Plan）→ ML-04/05（执行入口）→ ML-06/07（审查与收尾）。任一确认的高影响问题可提前处理。一次只修改一个可归因假设；无缺陷则登记保持现状，不为了提高修改数量重写 Skill。

## 本轮实际执行的检查

运行命令的可复现形式如下；本次实际参数、开始时间、耗时、exit code 和逐项结果保存在 checks.json，原始输出文件位于当时的临时目录，结果已持久化到本目录 evidence。

```bash
node node_modules/jest/bin/jest.js --runTestsByPath \
  tests/unit/spec-prd-plan-handoff-contracts.test.js \
  tests/unit/spec-plan-quality-contracts.test.js \
  tests/unit/spec-plan-consumer-replay-contracts.test.js \
  tests/unit/spec-write-tasks-contracts.test.js \
  tests/unit/spec-work-intake-contracts.test.js \
  tests/unit/spec-work-consumer-chain-contracts.test.js \
  tests/unit/spec-work-shipping-contracts.test.js \
  tests/unit/spec-code-review-contracts.test.js \
  --runInBand
```

| 测试文件 | 通过项 | 证据上限 |
|---|---:|---|
| spec-prd-plan-handoff-contracts.test.js | 5 | producer/consumer 文本与 fixture 约定 |
| spec-plan-quality-contracts.test.js | 16 | 质量 lens、边界和投射等合同断言 |
| spec-plan-consumer-replay-contracts.test.js | 12 | consumer fixtures、ID/格式与投射边界 |
| spec-write-tasks-contracts.test.js | 8 | optional/derived、CLI 取证与交接约定 |
| spec-work-intake-contracts.test.js | 7 | task-pack intake/漂移/语义边界合同 |
| spec-work-consumer-chain-contracts.test.js | 5 | review 结果消费与证据对账合同 |
| spec-work-shipping-contracts.test.js | 13 | 验证、residual 与收尾合同 |
| spec-code-review-contracts.test.js | 29 | review 入口、范围、输出与安全约定 |
| **合计** | **95** | **8 组均通过；没有真实模型或现场结果 claim** |

未运行：全仓 npm test、真实宿主 Skill 加载、独立模型 fresh-source eval、跨模型对照、浏览器/Xcode、完整业务实现、11 个历史任务追踪、新任务效果验证。原因：本轮是有限范围的维护者基线，未修改 Skill；上述执行不是本轮交付条件，部分还需要任务材料、真实环境或额外资源授权。

## 后续度量口径

本轮以下指标均为 `未测量`，不能用合同测试数代入：

| 指标 | 后续记录方式 |
|---|---|
| 信息丢失 | 分母为应交接且适用的已确认信息条目；另记受影响任务数，二者不混用 |
| 重复询问 | 分离必要澄清、授权确认和对已确定事实的无效重复；零询问时比例为不适用，不写成自动合格 |
| 验收落实 | 区分已实现、已验证、未实现、未验证和有依据的不适用；只数测试存在不足以证明落实 |
| 正确与完整交付 | 对本任务适用的需求、安全和必要验证逐项判断，保留未观察项 |
| 返工与时间 | 预先区分纠错返工和新增需求；记录等待、环境故障、任务难度与源码版本 |

00/05 中的目标数值继续作为提议，必须在试验前明确分母、可比条件、失败/超时处理和样本限制。11 个历史任务用于诊断，5 个新任务只能提供其覆盖范围内的初步结果，不能自动证明全体系或所有宿主的稳定收益。

## 限制与失效条件

- `structure_contract` 为本轮唯一已取证层；源码中有规则，不代表宿主硬强制，也不代表模型执行正确。
- 其余 33 个 Skill 只清点入口与治理类型，职责表不是全量实现审计。
- 既有研究、趋势材料和 REVIEW-REPORT 的自评或外部数据未由本轮核验，不作为实验准入或推广证明；本轮没有改写这些材料。
- 任一被引用的源码、消费者、test/helper、fixture、generator 或依赖变化时，先检查 source manifest 与影响面，再更新对应结论/重跑相关检查；旧日志保留，不倒填成新版本结果。
- 本轮不修改 Skill、不更新真实 runtime、不提交。执行台账和基线交付完成，不等于 Skill 优化目标完成。
