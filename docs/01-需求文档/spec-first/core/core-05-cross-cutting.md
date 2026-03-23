# Spec-First v7.1 — 横切机制

> **模块**: 核心研发流程 #5 | **拆分自**: spec-first-v7.md L939-1030
> **版本**: v7.1 | **更新**: 2026-02-09

---

## A. Quality Gate（质量门禁）

> Review 不是独立节点，而是每个阶段的准出条件。Gate 中嵌入文档关联校验。

| 阶段 | Gate 内容 | 追踪校验项 | Gate Owner |
|------|----------|-----------|------------|
| 00. Init | 目录就绪，Mode/Size/端已确认 | — | Tech Lead |
| 01. Specify | DoR Sign-off，无歧义标记 | 所有 FR/NFR 已分配 ID | Tech Lead |
| 02. Design | 设计评审 + SCA（spec ↔ design） + 文档关联完整性 | 设计文档引用已声明 | Tech Lead / Architect |
| 03. Plan | 任务评审 | 任务文档引用已声明 | Tech Lead |
| 04. Implement | Code CR（`/spec-first:code-review`）通过 + 代码质量达标 | PR 合规率 = 100% | Tech Lead / Peer |
| 05. Verify | UAT Sign-off + 安全无高危 | 测试产物已齐备 | QA Lead + PM |
| 06. Wrap-up | 文档完整性 + 归档清单 | 文档关联索引闭合 | Tech Lead |
| 07. Release | Smoke Test 通过 + 发布核心指标达标（见下表） | — | Tech Lead |

> Gate 1/2/3 编号与阶段的映射关系，见 `core-03-traceability.md` 的"文档关联规则"章节。

**安全严重级别统一口径**（用于 05 Verify / 07 Release）：

| 严重级别 | 定义 | Gate 规则 |
|----------|------|-----------|
| `S1` | 可直接导致数据泄露、权限突破或业务不可用 | 强制 `FAIL`，禁止豁免放行 |
| `S2` | 高风险漏洞，具备现实攻击路径 | 默认 `FAIL`；仅紧急场景可走豁免，结果 `PASS_WITH_WAIVER` |
| `S3` | 中风险缺陷，需在后续版本修复 | 可豁免放行，结果 `PASS_WITH_WAIVER` |
| `S4` | 低风险问题/优化项 | 不阻断，可记录为改进项 |

> 本文"安全无高危"统一解释为：无 `S1`，且无未获批豁免的 `S2`。

**Gate 结果语义**：

| Gate 结果 | 含义 | 是否允许 `stage advance` |
|-----------|------|--------------------------|
| `PASS` | 所有强制条件满足，且无活跃豁免 | 允许 |
| `PASS_WITH_WAIVER` | 存在已审批且未过期豁免，附带回滚点与关闭计划 | 允许（审计必填） |
| `FAIL` | 存在未满足的强制条件或豁免失效/缺失 | 禁止 |

**07. Release 核心指标明细**：

| 指标 | 阈值 | 观测窗口 | 数据源 |
|------|------|----------|--------|
| Smoke Test 通过率 | 100%（核心场景全通过） | 发布后即时 | CI Pipeline |
| 错误率（Error Rate） | ≤ 发布前基线的 110% | 发布后 30 分钟 | APM / 日志平台 |
| P95 响应延迟 | ≤ 发布前基线的 120% | 发布后 30 分钟 | APM |
| 回滚率 | 0（本次发布未触发回滚） | 发布后 1 小时 | DevOps 平台 |

> 阈值为默认值，项目可在 `constitution.md` 中覆盖。观测窗口内指标不达标则触发回滚决策。

**工具支撑**：

| 操作 | Skill/CLI | 说明 |
|------|----------|------|
| 代码评审 | **用户入口** `/spec-first:code-review` | 生成并校验 `reports/code-review-report.md`，输出阻断项与修复建议 |
| Gate 校验 | Skill 内部调用 CLI: `spec-first gate check <featureId>` | 自动校验当前阶段 Exit Gate 条件 |
| 阶段推进 | Skill 内部调用 CLI: `spec-first stage advance <featureId>` | Gate 结果为 `PASS` 或 `PASS_WITH_WAIVER` 时推进到下一阶段 |
| 文档关联查询 | Skill 内部调用 CLI: `spec-first docs links validate <featureId>` | 查询文档引用完整性 |
| 校验评估编排 | **用户入口** `/spec-first:verify` | AI 辅助评估 Gate 条件，给出修复建议 |

**执行原则**：

- Gate 结果为 `FAIL` 时，不得进入下一阶段
- `PASS_WITH_WAIVER` 必须关联 `specs/<featureId>/known-exceptions.md` 的有效条目（未过期、已审批、可回滚）
- Gate 结果记录在对应阶段的产出物中
- Gate 与 SCA 的关系：Quality Gate 的"文档关联校验项"通过调用 SCA（横切机制 B）执行，两者是调用关系而非独立并行
- Gate Owner 负责最终放行决策；角色到人的映射见 `constitution.md`

**Hook 化 Gate 自动执行**（双层体系）：

Gate 校验通过双层 Hook 体系实现自动阻断，确保 AI 辅助和纯人工场景均可运行：

**Layer A — AI Runtime Hook**（Claude Code Hooks，仅 AI 辅助场景）：

| Hook 类型 | 触发时机 | Gate 校验内容 | 阻断行为 |
|----------|---------|-------------|---------|
| PreToolUse | AI 执行写操作前 | 当前阶段 Gate 前置条件是否满足 | 条件不满足时阻止写操作 |
| PostToolUse | AI 执行写操作后 | 产出物是否符合当前阶段规范 | 不符合时提示修正 |
| Stop | AI 会话结束时 | 完成度校验（三文件 + 追踪产物同步） | 输出完成度报告 |

**Layer B — Git/CI Hook**（所有场景均生效）：

| Hook 类型 | 触发时机 | Gate 校验内容 | 阻断行为 |
|----------|---------|-------------|---------|
| prepare-commit-msg | Git 提交前（消息预填） | 从当前分支名 / `.spec-first/current` + `task_plan.md` 提取 TASK ID | 自动预填 `[TASK-<FEAT>-NNN]` 前缀到 commit message，降低手动输入 ID 的心流中断 |
| commit-msg | Git 提交时 | Commit message 含合法 ID 标签 | 格式不符时拒绝提交，**并输出修复提示**（期望格式 + 当前可用 TASK ID 列表） |
| pre-push | Git 推送前 | 增量 Spec-Consistency-Analysis | 不一致时拒绝推送 |
| CI Pipeline | PR 创建/更新时 | 全量一致性校验 + 文档关联校验 | 不通过时阻止合并 |

> **纯人工场景适配**：Layer A 不存在时，所有 Gate 校验由 Layer B 承载。Layer A 仅作为实时反馈的增强层。

**执行层次**：Hook 自动校验（Layer A 实时 + Layer B 提交时） → 不通过则阻断 → Gate Owner 人工终审放行。

---

## B. Spec-Consistency-Analysis（规范一致性校验）

**定位**：跨产物一致性校验，基于 ID 追踪链确保 spec ↔ design ↔ tasks ↔ code ↔ test 始终对齐。

| # | 触发时机 | 校验内容 | 基于 ID 的校验规则 |
|---|---------|---------|-------------------|
| 1 | Specify 完成后 | spec 内部一致性 | AC 是否覆盖所有 FR、NFR 是否量化、FR 间无矛盾 |
| 2 | Design 完成后 | spec ↔ design | 每个 FR 有对应设计方案，API 覆盖所有需要接口的 FR |
| 3 | Plan 完成后 | spec ↔ tasks | 任务文档引用已声明 |
| 4 | Implement 完成后 | spec ↔ code | PR 合规率 = 100%，API 实现与契约一致 |
| 5 | Verify 完成后 | spec ↔ test results | 测试产物齐备，所有 AC 已覆盖 |

**工具支撑**：

| 操作 | Skill/CLI | 说明 |
|------|----------|------|
| 文档关联校验 | Skill 内部调用 CLI: `spec-first docs links validate <featureId>` | 校验文档引用完整性 |
| 文档关联展示 | Skill 内部调用 CLI: `spec-first docs links show <featureId>` | 查看文档引用关系 |
| AI 辅助校验 | **用户入口** `/spec-first:verify` | AI 解读校验结果，定位不一致根因并建议修复 |

**关键实践**：

- 校验结果生成 Consistency Report
- 不一致项必须在当前阶段修复，不得带入下一阶段
- 支持增量校验（仅校验本次变更涉及的产物）

---

## C. Change-Management（变更管理）

**定位**：任何阶段均可触发的变更处理机制。

| 触发条件 | 动作 | 基于 ID 的影响定位 |
|---------|------|-------------------|
| 需求变更 | RFC → Impact Analysis → Spec 更新 | 通过 FR-FEAT-NNN 追踪链定位受影响的 TASK/TC/API/PR |
| 设计变更 | ADR 更新 → 下游产物同步 | 通过 API-SVC-NNN 定位受影响的 TASK 和 TC |
| 实现偏差 | 评估是否需要更新 Spec | 通过 TASK-FEAT-NNN 反向追溯到 FR |
| Constitution 变更 | 全流程影响评估 | 所有产物重新校验 |

**变更分级**：

| 级别 | 定义 | 审批要求 | 流程 |
|------|------|---------|------|
| **Minor** | 影响 ≤2 个产物，不需重新触发已通过的 Gate | Tech Lead 审批 | 快速通道：直接修改 + `/spec-first:sync` 反向同步 + 增量校验 |
| **Major** | 影响 3-5 个产物，或需重新触发已通过的 Gate | Tech Lead + PM 审批 | 标准流程：RFC → Impact Analysis → 执行 |
| **Critical** | 涉及 Constitution 或架构变更 | Tech Lead + PM + Architect 审批 | 完整流程：RFC → 全量 Impact Analysis → 评审会 → 执行 |

**判定规则**：两个维度取较高级别。

**工具支撑**：

| 操作 | Skill/CLI | 说明 |
|------|----------|------|
| 创建 RFC | Skill 内部调用 CLI: `spec-first rfc create <featureId>` | 创建变更请求，自动分配 RFC-NNN |
| RFC 状态流转 | Skill 内部调用 CLI: `spec-first rfc transition <rfcId> <status> --feature <featureId>` | 推进 RFC 状态 |
| 缺陷上报 | Skill 内部调用 CLI: `spec-first defect register <featureId>` | 上报缺陷，关联 FR/TASK ID |
| 影响分析 | Skill 内部调用 CLI: `spec-first docs links validate <featureId>` | 基于文档引用定位变更影响范围 |
| 反向同步 | **用户入口** `/spec-first:sync <file_path>` | 识别手工改动并回填受影响文档与追踪链；必要时自动生成 RFC 草案 |

### Hotfix / Sync 适用边界

- 仅适用于 `Minor` 变更（不跨架构、不改 Constitution）。
- 同步后必须执行增量校验（`docs links validate + gate check`）。
- 若识别到跨 3 个及以上产物受影响，必须自动升级为 `Major` 流程（进入 RFC）。

### 紧急发布豁免快通道（合规逃生）

仅当业务连续性风险高于延期风险时允许触发，且不得绕过审计：

1. 创建 RFC 并标记紧急原因（`Major/Critical`）
2. 在 `specs/<featureId>/known-exceptions.md` 登记豁免条目（含 `scope_ids`、`rollback_point`、`expires_at`）
3. Gate 输出 `PASS_WITH_WAIVER` 后方可推进阶段或发布
4. 发布后在豁免到期前完成修复并关闭条目；逾期自动升 P0 并阻断后续 Gate

---

*core-05-cross-cutting.md 完成 — 下一篇：[aux-01-skill-system.md](../auxiliary/aux-01-skill-system.md)*
