# Skill 优化执行台账

日期：2026-11-03

范围：当前 `skills/*/SKILL.md` 的 38 个源码入口

本轮交付：执行台账与主链路源码/合同基线；未修改 Skill，未启动真实任务效果评测。

## 目标、权威与执行边界

目标是让需求到可信变更的链路更可靠，以整体交付质量决定优化价值。38 项是**检查覆盖范围**，不是必须修改的数量，也不是必须依次调用的工作流。

- 用户本轮授权：建立台账与主链路基线，写入当前方案目录并同步必要的进度、入口与 CHANGELOG。
- Source of truth：`skills/`、相关 `src/cli/`、`templates/`、tests 和项目角色契约；不修改 generated runtime，不执行 init、commit、push 或真实外部写入。
- 台账是维护者的项目记录，不新增 runtime 状态机、产品 schema 或每次运行都必须生成的产物。
- 主链路基线见 [08-mainline-baseline.md](08-mainline-baseline.md)。源码身份见 [evidence/source-baseline.json](evidence/source-baseline.json)；JSON 只存采集事实，不替代本表的语义判断。
- 现有方案中的示例统计、覆盖百分比、模型能力与研究结论不作为本次基线的已验证事实。未读取真实私有会话、Slack 或外部 PR，未新增付费评测。

## 当前进度与状态口径

| 项目 | 本轮结果 | 不能据此推断 |
|---|---|---|
| 源码入口与治理类型清点 | 38/38，入口 description 与治理清单对账 | 38 个 Skill 已完成深度审查 |
| 主链路定向源码检查 | 5/5：PRD、Plan、Tasks、Work、Review | 全部引用、脚本实现、宿主执行都已审完 |
| 主链路既有合同检查 | 8 组、95 项通过 | 模型行为、真实任务正确率或效率提升 |
| 本轮 Skill 行为修改 | 0 | 整体优化已完成 |
| Phase 0 真实任务追踪 | 0/11 | 示例数字是实际统计 |
| 优化后新任务验证 | 未开始 | 已达到推广条件 |

表中 `入口已核对` 指路径、声明职责和入口类型；`主链路基线已建` 指本轮定向检查与关联合同测试，不表示无缺陷。处理决定与验证状态分开记录：

- 处理决定可为：`待判定`、`修改`、`保持现状`、`合并/退役待论证`、`证据不足暂缓`。
- 源码/合同、模型行为、真实任务效果分别记录 `passed`、`failed`、`not-run` 或明确限制；禁止合成一个含义不清的“全部完成”。
- 当前所有 Skill 的修改决定均为 `待判定`；下面的关注点是后续检查题，不是已经成立的缺陷。

## 38 项执行清单

ID 使用本台账独立的 `SK-xx`，不覆盖旧审查的 S 编号或候选 O/NEW 编号。批次表示检查顺序；授权越界、破坏性操作、虚假完成等已确认高影响问题可提前处理。

### 第一批：需求到实现，以及整项审查

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-01 | [spec-prd](../../../skills/spec-prd/SKILL.md) | 既有系统 WHAT/WHY、验收与阻塞 → Plan | O04、NEW-04 | 主链路基线已建；待判定 | 有来源已解决的问题不重复询问；未闭合 WHAT 不伪装 ready |
| SK-02 | [spec-plan](../../../skills/spec-plan/SKILL.md) | 消费需求，形成 HOW、U-ID、验证约定 → Tasks/Work | O01、NEW-03、NEW-05 | 主链路基线已建；待判定 | 保留上游决策与全部相关验收；读取优化不截断必要上下文 |
| SK-03 | [spec-write-tasks](../../../skills/spec-write-tasks/SKILL.md) | 可选派生任务包 → Work；Plan 仍拥有范围 | — | 主链路基线已建；待判定 | 小任务可 skip；陈旧任务包和非活跃计划不进入执行 |
| SK-04 | [spec-work](../../../skills/spec-work/SKILL.md) | 执行 Plan/Tasks，留存验证，消费审查结果 | O03、NEW-01 | 主链路基线已建；待判定 | 不遗漏 required proof；低风险短路径不减少必要证据 |
| SK-05 | [spec-code-review](../../../skills/spec-code-review/SKILL.md) | 对照意图与 diff 输出 findings → Work/调用方 | O07、NEW-02、NEW-06 | 主链路基线已建；待判定 | 发现真实行为问题；任务局部审查不误报整计划未完成；不越权修改 |

### 第二批：诊断与反馈闭环

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-06 | [spec-debug](../../../skills/spec-debug/SKILL.md) | 失败复现、根因、修复与回归 → 调用方 | O06、NEW-07 | 入口已核对；待判定 | 共享根因覆盖相关路径，不能由单个症状消失推断彻底修复 |
| SK-07 | [spec-doc-review](../../../skills/spec-doc-review/SKILL.md) | 审查需求、计划和任务包 → 原产物 owner | — | 入口已核对；待判定 | 区分只读审查与写权限；不把语义评审当确定性校验 |
| SK-08 | [spec-resolve-pr-feedback](../../../skills/spec-resolve-pr-feedback/SKILL.md) | 处理已有 PR 评论 → 修复、验证及获授权反馈 | — | 入口已核对；待判定 | 反馈逐项落实；本地修改不自动授权 push、回复或 resolve |

### 第三批：入口与需求探索

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-09 | [using-spec-first](../../../skills/using-spec-first/SKILL.md) | 按意图选择入口或短路径 | O02 | 入口已核对；待判定 | 修复/审查/解释不误路由，活跃工作流不重复启动路由 |
| SK-10 | [spec-ideate](../../../skills/spec-ideate/SKILL.md) | 发散并评估方向 → 用户选择/Brainstorm | — | 入口已核对；待判定 | 方向有项目依据，不将探索候选写成已批准需求 |
| SK-11 | [spec-brainstorm](../../../skills/spec-brainstorm/SKILL.md) | 明确 WHAT，产出 requirements-only unified plan → Plan | O05 | 入口已核对；待判定 | 复用已确定信息；保留真实产品阻塞与决策理由 |
| SK-12 | [spec-pov](../../../skills/spec-pov/SKILL.md) | 对采用问题或既有方向给出项目化裁决 | — | 入口已核对；待判定 | 区分外部候选、项目适配证据与采用结论 |
| SK-13 | [spec-prototype](../../../skills/spec-prototype/SKILL.md) | 用可体验的临时原型回答产品疑问 → 产品决策 | — | 入口已核对；待判定 | 缺少实际体验时不伪造验证；原型不冒充生产交付 |

### 第四批：执行与交付支撑

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-14 | [spec-runtime-setup](../../../skills/spec-runtime-setup/SKILL.md) | 安装/检查 runtime readiness → 工作流 | — | 入口已核对；待判定 | 幂等、源与投射边界；配置存在不等于宿主已生效 |
| SK-15 | [spec-worktree](../../../skills/spec-worktree/SKILL.md) | 调用方拥有的 Git 隔离内部 helper | — | 入口已核对；待判定 | 保留 dirty work；隔离失败和部分副作用可恢复 |
| SK-16 | [spec-commit](../../../skills/spec-commit/SKILL.md) | 已获提交授权的内部 helper | O11 | 入口已核对；待判定 | 精确暂存属于本任务的变更，不混入他人 index 内容 |
| SK-17 | [spec-commit-push-pr](../../../skills/spec-commit-push-pr/SKILL.md) | 已获 landing 授权的内部 helper | O12 | 入口已核对；待判定 | commit/push/PR 结果分别取证，结果不明时先查状态 |
| SK-18 | [spec-lfg](../../../skills/spec-lfg/SKILL.md) | 用户明确要求的一条龙到绿 PR | — | 入口已核对；待判定 | 子阶段完成不关闭整体目标，CI/反馈/权限缺口不静默跳过 |

### 第五批：验证与代码改善

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-19 | [spec-test-browser](../../../skills/spec-test-browser/SKILL.md) | 调用方受控的浏览器验证内部 helper | — | 入口已核对；待判定 | 精确 origin/路由和现场证据；缺浏览器时不宣称视觉通过 |
| SK-20 | [spec-test-xcode](../../../skills/spec-test-xcode/SKILL.md) | iOS 模拟器构建与测试 | — | 入口已核对；待判定 | 区分工具 readiness、构建成功、界面观察与人工体验 |
| SK-21 | [spec-dogfood](../../../skills/spec-dogfood/SKILL.md) | 变更范围内的浏览器用户流 QA → 调用方 | — | 入口已核对；待判定 | 验证真实受影响流程，不默认扩大为全站探索 |
| SK-22 | [spec-app-consistency-audit](../../../skills/spec-app-consistency-audit/SKILL.md) | App PRD/Figma/源码一致性审计 | — | 入口已核对；待判定 | 来源冲突可回源；静态一致性不能冒充运行时效果 |
| SK-23 | [spec-polish](../../../skills/spec-polish/SKILL.md) | 浏览器交互式 UI 打磨 | — | 入口已核对；待判定 | 以真实界面改善验收，与代码简化职责分开 |
| SK-24 | [spec-simplify-code](../../../skills/spec-simplify-code/SKILL.md) | 保持行为的局部代码简化 | — | 入口已核对；待判定 | 保留回归证明和必要边界，不以代码更短替代质量 |

### 第六批：恢复与知识复用

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-25 | [spec-handoff](../../../skills/spec-handoff/SKILL.md) | 用户指定的跨会话交接/恢复 | O08 | 入口已核对；待判定 | 保存未完成项、授权、来源、新鲜度和恢复入口 |
| SK-26 | [spec-compound](../../../skills/spec-compound/SKILL.md) | 已解决问题 → 可复用 solutions | O09 | 入口已核对；待判定 | 排除假因果，保留适用范围与失效条件 |
| SK-27 | [spec-compound-refresh](../../../skills/spec-compound-refresh/SKILL.md) | 对 solutions/概念进行刷新和维护 | O10 | 入口已核对；待判定 | 过期判断可回源；删除、合并与部分失败可恢复 |
| SK-28 | [spec-project-rules](../../../skills/spec-project-rules/SKILL.md) | 从源码建立/更新项目架构知识 | — | 入口已核对；待判定 | 层次与依赖规则有源码依据，与编码惯例挖掘分工清楚 |
| SK-29 | [spec-rule-miner](../../../skills/spec-rule-miner/SKILL.md) | 从源码挖掘编码惯例与规则入口 | — | 入口已核对；待判定 | 局部模式不自动升级为团队政策，不手改 runtime mirror |
| SK-30 | [spec-explain](../../../skills/spec-explain/SKILL.md) | 持久化教学解释产物 | — | 入口已核对；待判定 | 按请求选择讲解深度，普通问答不强制生成长文档 |

### 第七批：策略、反馈与体系维护

| ID | Skill / 源码入口 | 职责与直接衔接 | 候选合并 | 当前状态 | 下一项检查 / 验收场景 |
|---|---|---|---|---|---|
| SK-31 | [spec-strategy](../../../skills/spec-strategy/SKILL.md) | 产品方向与路线 → 下游定义/规划 | — | 入口已核对；待判定 | 战略取舍有项目证据，不把愿景当已兑现效果 |
| SK-32 | [spec-product-pulse](../../../skills/spec-product-pulse/SKILL.md) | 从配置的信号生成时间窗口报告 | — | 入口已核对；待判定 | 时间窗、来源、缺失信号和结论强度一致 |
| SK-33 | [spec-sweep](../../../skills/spec-sweep/SKILL.md) | 配置的反馈源 → 分析与可交接计划 | — | 入口已核对；待判定 | 数据读取和原处回复有独立授权，不按名称推断为技术债清理 |
| SK-34 | [spec-riffrec-feedback-analysis](../../../skills/spec-riffrec-feedback-analysis/SKILL.md) | Riffrec 专用反馈材料分析 | — | 入口已核对；待判定 | 媒体/事件证据可回源，转写失败不冒充已理解反馈 |
| SK-35 | [spec-promote](../../../skills/spec-promote/SKILL.md) | 基于交付证据生成推广文案 | — | 入口已核对；待判定 | 发布可用性声明受证据约束；不是知识晋升工作流 |
| SK-36 | [spec-optimize](../../../skills/spec-optimize/SKILL.md) | 围绕可测目标比较优化变体 | — | 入口已核对；待判定 | 质量、基线、成本与停止条件可复核 |
| SK-37 | [autoresearch](../../../skills/autoresearch/SKILL.md) | 有界 modify/verify/keep-or-discard 迭代 | — | 入口已核对；待判定 | 可检查成功条件、停止与恢复边界；不以循环次数替代完成 |
| SK-38 | [spec-write-skill](../../../skills/spec-write-skill/SKILL.md) | source Skill package 创建/修改/验证 | — | 入口已核对；待判定 | 打包通过与语义有效分层；修改有消费者与回归依据 |

## 候选对账与新增能力

现有 [03 候选清单](03-optimization-candidates.md)包含 **23 个候选编号**：O01–O12 共 12 个，NEW-01–NEW-11 共 11 个。它们映射到 12 个现有 Skill 与 4 个拟新增 Skill，不等于 23 个现有 Skill。主链路的 Tasks 等检查对象可以没有既有候选编号。

| 新增候选 | 拟新增 Skill | 当前处理 | 新建前必须检查 |
|---|---|---|---|
| NEW-08 | spec-test-design | 未建项实施；待证据 | Plan/Work 已有测试策略和场景职责是否足够，缺口是否应由原 owner 吸收 |
| NEW-09 | spec-test-integration | 未建项实施；待证据 | 现有执行工作流、项目测试命令与平台 helper 是否已覆盖所需验证 |
| NEW-10 | spec-release-verify | 未建项实施；待范围裁决 | 是否仅服务本次变更验证；不得由此默认扩为部署运维平台 |
| NEW-11 | spec-security-review | 未建项实施；待证据 | Code Review 的风险视角与现有安全能力是否足够，是否有独立持续 consumer |

入口类型来自 [skills-governance.json](../../../src/cli/contracts/dual-host-governance/skills-governance.json)。`spec-commit`、`spec-commit-push-pr`、`spec-worktree`、`spec-test-browser` 是内部 helper；本表不会把它们变成用户菜单。

## 每项优化的执行记录

先在对应 Skill 下追加一条短记录；没有实际问题时允许保持现状，不创建空目录、空 schema 或无用评测。多个候选在同一 Skill 内合并分析，但修改尽量保持单一可归因假设。

```yaml
skill_id: SK-xx
source_baseline: evidence/source-baseline.json
problem: 具体错误行为或已确认合同矛盾
evidence: 源码位置、任务产物、日志或复现记录
affected_handoff: 上游与下游；无跨阶段问题时明确写不适用
decision: 待判定 / 修改 / 保持现状 / 合并或退役待论证 / 证据不足暂缓
change_hypothesis: 哪个最小改动会改善哪个结果
allowed_paths: source owner 和必要的直接消费者
verification: 复现与正例、边界或误触发对照；未执行的项目写明原因
result: 源码合同 / 模型行为 / 真实任务效果分别记录
limitations_and_next_action: 未完成项、owner 与解除条件
```

执行原则：

1. 先确认当前职责与调用路径，再判断是规则缺失、已有规则未被执行、输入不足、工具限制还是上游交接错误。
2. 修改前固定相关案例、源文件身份、预期和判据；不把预期答案注入被测模型。不要求所有 Skill 使用同一套评测数量。
3. 用系统 `skill-creator` 指导编写；实际行为评测、失败回归按需使用 `skill-upper`。不因辅助工具重开需求访谈。
4. 改 owning source，按影响面补必要的合同/脚本检查；prose 改动按项目 checklist 做 fresh-source 评估并保留真实状态。
5. 上游改动必须验证直接消费者；接口格式和 hash 正确不能代替语义充分性。必要检查通过后停止扩张。
6. 已确认的确定性缺陷可独立处理，不以 11 个历史样本齐备作为所有工作的前置条件；真实收益仍须真实任务证据。

## 下一执行单元

**SK-01：PRD 与 Plan 的交接。** 先复用既有 PRD/Plan fixtures，确定“已由来源解决”“真实产品阻塞”“长需求摘要与全文一致”三类场景的输入与独立判据；判断是否存在重复澄清、范围发明或验收遗漏，再决定是否修改。不要直接把“增加需求审查”写入 Skill，因为当前 PRD 已有 Product Expert Lens、Readiness Lens 和 finalize 合同。

本轮仅交付台账与基线。上述执行单元是后续入口，不表示本轮已启动模型调用、Skill 修改或私有历史采集。
