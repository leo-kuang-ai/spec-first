# Spec-First v2.1 深度审查报告（结合 myclaude/do + 业界规范）

## 0. 我对你要做事情的理解

你在做的不是一份“流程说明书”，而是一套 **Spec-First 研发治理系统**：

1. 把需求到交付链路做成可追踪、可审计、可回放。
2. 把阶段放行从“主观评审”升级为“规则判定 + 自动化阻断”。
3. 把变更管理做成全生命周期能力，而不是补救动作。
4. 最终把流程沉淀到 Git/CI/Hook，形成团队默认操作系统。

`docs/01需求文档/spec-first-v2.md` 已经从框架设计进入工程治理阶段，这个方向是正确的。

## 1. 当前成熟度判断

优势（已建立）：
- 7 阶段 + 3 横切机制结构清晰（`docs/01需求文档/spec-first-v2.md:9`）。
- Gate Owner、RACI、归档清单具备组织落地基础（`docs/01需求文档/spec-first-v2.md:71`、`docs/01需求文档/spec-first-v2.md:117`、`docs/01需求文档/spec-first-v2.md:301`）。
- Traceability 规则、ID、矩阵、覆盖率公式已经补齐（`docs/01需求文档/spec-first-v2.md:401`）。

短板（待补齐）：
- Gate 规则仍偏描述性，机器不可判定项仍多（`docs/01需求文档/spec-first-v2.md:331`）。
- 兼容性策略未形成“默认破坏性变更清单 + 阻断流程”（`docs/01需求文档/spec-first-v2.md:190`）。
- 安全要求停留在扫描层，缺少控制项验收基线（`docs/01需求文档/spec-first-v2.md:100`、`docs/01需求文档/spec-first-v2.md:262`）。
- 轻量模式准入仍是定性规则，存在误用风险（`docs/01需求文档/spec-first-v2.md:685`）。

## 2. 关键审查结论（按优先级）

## P0（建议优先改）

1. Gate 需要“规则化表达”
- 问题：`通过/达标/完整` 这类词没有统一阈值与证据模板。
- 风险：跨团队执行偏差，CI 无法稳定阻断。
- 建议：每个 Gate 固化 6 元组：`输入工件`、`检查器`、`阈值`、`证据文件`、`责任人`、`失败动作`。

2. API 兼容性治理缺位
- 问题：有版本策略，但没定义 breaking 判定和处理动作。
- 风险：跨服务联调和上线阶段出现契约破坏。
- 建议：新增“兼容性门禁”：
  - OpenAPI diff 检查
  - consumer contract tests
  - breaking change 必须 RFC + 升级版本号

3. 安全验收标准不够可审计
- 问题：`OWASP Top 10` 和 `无高危` 太粗。
- 风险：只能证明“扫过”，无法证明“控制项落实”。
- 建议：将 Verify 阶段新增 ASVS 控制项映射（按 L1/L2 选择）；高风险需求强制威胁建模证据。

4. 轻量模式缺少风险分流机制
- 问题：当前仅 3 条跳过条件。
- 风险：高风险需求走轻流程，前置设计不足。
- 建议：增加评分路由（复杂度/影响面/合规/回滚难度）。仅低分可启用轻量模式。

## P1（建议本轮补齐）

5. Traceability 指标要进入 CI 阻断
- 问题：指标已定义但未声明“失败即阻断”。
- 建议：至少阻断 `FR 覆盖率 < 100%` 与 `孤儿项率 > 0%`。

6. AI 编码统计与流程闭环还未联动
- 问题：已有 `.spec-first/ai-stats.jsonl`，但未进入 Wrap-up 复盘准则（`docs/01需求文档/spec-first-v2.md:546`）。
- 建议：把“按 FR 维度的新增/删除行、返工率、缺陷逃逸”纳入 retro 固定项。

7. Change-Management 缺 emergency SLA
- 问题：有 RFC 流程，但缺紧急修复时效规则。
- 建议：增加紧急变更条款：先修复后补 RFC（24h 内），下一次 Retro 强制复盘。

## 3. 从 myclaude/do 可借鉴的高价值机制

你要求结合 `'/Users/kuang/xiaobu/myclaude'`，以下是能直接迁移到 Spec-First 的机制：

1. 强流程状态机约束
- 参考：`do` 用 `.claude/do.{task_id}.local.md` 管理 phase，Stop hook 未完成即阻断退出（`/Users/kuang/xiaobu/myclaude/skills/do/scripts/setup-do.py:48`、`/Users/kuang/xiaobu/myclaude/skills/do/hooks/stop-hook.py:90`）。
- 借鉴：为 `spec-first` 增加 `.spec-first/state.yaml`，Gate 未通过禁止流转。

2. 明确的 Blocking/Minor 分级处理
- 参考：`do` 规定 BLOCKING 必须交互决策，MINOR 自动修复（`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:99`）。
- 借鉴：Consistency Report 按 `blocking/minor` 输出，只有 blocking 阻断阶段。

3. Context Pack 强制传递
- 参考：每阶段都带“原始请求 + 决策 + 上一阶段输出”（`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:113`）。
- 借鉴：在你的各阶段产物增加 `Upstream Inputs` 区块，避免上下文丢失。

4. 并行优先
- 参考：Understand/Review 阶段并行执行（`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:141`、`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:292`）。
- 借鉴：Design 期的契约检查和任务映射可并行跑，缩短前置周期。

5. 单一完成信号
- 参考：`<promise>DO_COMPLETE</promise>` 作为完成信号（`/Users/kuang/xiaobu/myclaude/skills/do/SKILL.md:73`）。
- 借鉴：为每个 Feature 定义统一 `release-ready` 条件表达式，CI 产出唯一放行结论。

## 4. 业界最佳实践对照（Context7 + 官方来源）

1. 规范语言
- RFC 2119 + RFC 8174：规范关键字仅在全大写时具约束语义。
- 建议：文档增加“规范词法”章节，Gate 条款统一用 `MUST/SHOULD/MAY`。

2. OpenAPI 契约治理
- OpenAPI 最新发布版本为 `3.2.0`（2025-09-19），并明确使用 BCP14 关键字；3.1.2 也在同日发布补丁。
- 建议：`contracts/` 统一目标版本；明确工具必须识别 JSON Schema dialect。

3. 兼容性
- AIP-180 强调 source/wire/semantic 三类兼容性；并新增了对字符串长度变化、值格式变化等破坏性风险说明（2025-10 更新）。
- 建议：在 RFC 模板中新增“兼容性影响三维评估”。

4. 上线前契约验证
- Pact `can-i-deploy` 明确给出“当前版本是否可安全部署”的矩阵判定模式。
- 建议：把 `can-i-deploy` 类检查并入 Verify→Release 的最后一道门。

5. 安全验收
- OWASP ASVS 已发布稳定版 5.0.0（2025-05）。
- 建议：Verify 阶段将“扫描结果”升级为“扫描 + ASVS 控制项抽检”。

## 5. 建议新增到 v2.2 的最小条款

建议新增章节：`Gate 量化与自动化规范`。

最小条款：
1. `01 Specify Gate MUST`
- 无 `[NEEDS CLARIFICATION]`
- AC 全可测试
- NFR 全量化
- 评分 >= 90

2. `02 Design Gate MUST`
- 每个 FR/NFR 至少映射到一个 Design/API/Data 项
- 兼容性检查通过；breaking change 必须 RFC

3. `04 Implement Gate MUST`
- PR 必填 `Req IDs/Task IDs/Test IDs`
- FR 覆盖率 100%
- 孤儿项率 0%

4. `05 Verify Gate MUST`
- AC 全通过
- Critical/High 漏洞为 0
- NFR 验证证据齐全

## 6. 30/60 天落地建议

1. 0-30 天
- Gate 条款改写为规范关键字 + 阈值。
- Traceability 指标接入 CI 阻断。
- 补齐兼容性检查与 RFC 字段。

2. 31-60 天
- 轻量模式引入评分路由。
- AI 统计纳入 Retro 固定模板。
- 引入紧急变更 SLA 与复盘闭环。

## 7. 参考来源

- RFC 2119: https://www.rfc-editor.org/rfc/rfc2119
- RFC 8174: https://www.rfc-editor.org/rfc/rfc8174
- OpenAPI 3.2.0: https://spec.openapis.org/oas/v3.2.0.html
- OpenAPI versions/index: https://spec.openapis.org/oas/
- Google AIP-180: https://google.aip.dev/180
- Pact `can-i-deploy`: https://docs.pact.io/pact_broker/can_i_deploy
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- Semantic Versioning 2.0.0: https://semver.org/

