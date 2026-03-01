# 00-first 问题复核与修复报告（第二版）

## 范围与基线

- 复核对象：`skills/spec-first/00-first/`
- 当前基线：`SKILL.md` version `1.11.1`（2026-02-28）
- 当前规模：10 个文件，约 1707 行（`SKILL.md` + 9 个 references）
- 复核口径：旧报告 P0+P1 的 28 条显式问题逐条核验

## 总体结论

旧报告问题**并非都存在**，且本轮已完成一批关键修复。

- 已修复/已关闭：18
- 仍存在（含设计取舍项）：7
- 证据不足（不属于本文件集可直接证明）：3

## 逐条状态（P0+P1）

| 旧问题 | 当前状态 | 说明 |
|---|---|---|
| P0-1 Phase Numbering Inconsistency | 已关闭 | Agent D 内部统一为 Step 命名 |
| P0-2 Agent Count Mismatch | 已关闭 | 全文统一为 8 个逻辑 Agent（A1/A2/A3/B/C1/C2/D/A4） |
| P0-3 Evidence Format Inconsistency | 已关闭 | 统一为 `(<file:line> — <snippet> — [证据类型])` |
| P0-4 Documentation Structural Inconsistency | 已关闭 | `SKILL.md` 与 `subagent-architecture.md` 已对齐波次/依赖 |
| P0-5 No Incremental Analysis | 已关闭 | 已有 `git diff` 增量路径 |
| P1-1 QA Rules Duplication | 已关闭 | 抽取共享规则到 `references/quality-assurance-rules.md` |
| P1-2 Serena Degradation Undefined | 已关闭 | 各 Agent 降级策略已定义 |
| P1-3 A4 Dependency Chain Incomplete | 已关闭 | A4 统一等待 A2+B+D |
| P1-4 Timeout Values Inconsistency | 已关闭 | 统一为 60s/120s/300s |
| P1-5 Phase Naming Confusion | 已关闭 | 内部阶段使用 Step |
| P1-6 A4 Fan-in Bottleneck | 仍存在（设计取舍） | A4 依赖多源输入，属于准确性优先的同步点 |
| P1-7 DB Credential Exposure Risk | 已关闭（文档治理层） | 新增凭证防护执行规则（技术性） |
| P1-8 Context7 API Key Handling undocumented | 已关闭 | 新增 Context7 密钥治理章节 |
| P1-9 Wave Synchronization Bottleneck | 仍存在（设计取舍） | C2 等待 P1b + C1 的业务依赖仍保留 |
| P1-10 Agent Timeout Granularity Mismatch | 已关闭 | 与 P1-4 同步修复 |
| P1-11 Synchronous I/O Throughout | 证据不足 | 需到运行时代码层评估，不是本技能文档层问题 |
| P1-12 Context Pack Token Budget 16K | 证据不足 | 需到运行时配置层评估 |
| P1-13 Monorepo Scalability O(n*p) | 仍存在（风险） | 仅有策略描述，未落地容量边界与实测基线 |
| P1-14 LSP Memory Footprint 500MB-2GB | 证据不足 | 旧结论缺实测数据 |
| P1-15 Zero Agent Tests | 部分修复 | 已新增文档契约回归测试（`tests/unit/first-skill-docs.test.ts`），Agent 行为测试仍需补齐 |
| P1-16 No Credential Sanitization Tests | 部分修复 | 已新增凭证规则文档断言测试，运行时代码级脱敏测试仍需补齐 |
| P1-17 No Timeout Handling Tests | 部分修复 | 已新增超时口径一致性断言测试，调度器超时行为测试仍需补齐 |
| P1-18 No Cross-Validation Tests | 部分修复 | 已新增交叉验证规则存在性断言测试，交叉验证执行逻辑测试仍需补齐 |
| P1-19 Documentation Phase Numbering Inconsistency | 已关闭 | 同 P0-1 |
| P1-20 Documentation Agent Count Mismatch | 已关闭 | 同 P0-2 |
| P1-21 Quality Rules Duplication | 已关闭 | 同 P1-1 |
| P1-22 No Extension Mechanism | 仍存在 | 扩展机制未定义 |
| P1-23 Centralized Rule Management | 仍存在 | detection-rules 仍集中管理 |

## 本轮关键修复清单

1. 证据格式统一（`SKILL.md`）
2. A4 依赖与三波派发规则统一（`SKILL.md` + `subagent-architecture.md`）
3. 超时口径统一为 60/120/300（`subagent-architecture.md`）
4. 抽取共享 QA 规则（`references/quality-assurance-rules.md`）
5. 各 Agent 规格去重并改为引用共享 QA（A1/A2/A3、B/C1、C2、D、A4）
6. 补充 Context7 密钥治理（`detection-rules.md`）
7. 补充 DB 凭证技术防护规则（`agent-database.md`）
8. 补充最小测试矩阵（`references/testing-strategy.md`）
9. 主技能元数据更新到 `1.11.1`（`SKILL.md`）
10. 新增自动化回归测试 `tests/unit/first-skill-docs.test.ts`（9 条断言）

## 仍需后续落地（优先级）

1. P1：将文档契约测试扩展为 Agent 行为测试（Agent + 编排 + 安全）
2. P1：定义扩展机制（插件/扩展点/接口契约）
3. P2：补 monorepo 大规模容量基线与性能实测
4. P2：按模块拆分 detection-rules，降低集中维护风险

## 结论

当前文档层面最关键的不一致问题已收敛；剩余主要是“架构取舍”与“测试实现”问题。后续应优先把测试策略落地成自动化用例，形成可持续回归闭环。
