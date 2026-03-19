# Spec-First v7.1 需求文档（按模块拆分）

> **拆分自**: `spec-first-v7.md`（完整版 1873 行）
> **拆分日期**: 2026-02-09
> **拆分原则**: 按功能模块拆分，核心研发流程 vs 辅助功能模块

---

## 核心研发流程（core/）

流程定义、阶段规范、追踪体系、横切机制——回答"做什么"。

| # | 文件 | 内容 | 原文行号 |
|---|------|------|---------|
| 1 | [core-01-overview.md](core/core-01-overview.md) | 变更摘要 + 产品愿景与定位 + 角色与用户画像 | L1-316 |
| 2 | [core-02-architecture.md](core/core-02-architecture.md) | 核心架构（双层、三层、双模式、规模分级、流程总览） | L318-512 |
| 3 | [core-03-traceability.md](core/core-03-traceability.md) | 全链路追踪体系（ID 规范、追踪矩阵、覆盖率算法） | L515-693 |
| 4 | [core-04-process.md](core/core-04-process.md) | 主流程 8+2 阶段（00 Init ~ 07 Release + 终态 + Code Review A+B 9 维度 + 阻断修复闭环） | L696-937 |
| 5 | [core-05-cross-cutting.md](core/core-05-cross-cutting.md) | 横切机制（Quality Gate + S1-S4 安全严重级别 + Release 核心指标 + Hook 化双层体系含 prepare-commit-msg / SCA / Change Management + Hotfix/Sync + 豁免快通道） | L939-1030 |
| 6 | [core-06-case-login-optimization.md](core/core-06-case-login-optimization.md) | 端到端案例（用户登录优化 + 新增登录方式） | 新增 |

## 辅助功能模块（auxiliary/）

Skill/CLI 工具链、多端扩展、产出物标准、度量运营——回答"怎么做"。

| # | 文件 | 内容 | 原文行号 |
|---|------|------|---------|
| 7 | [aux-01-skill-system.md](auxiliary/aux-01-skill-system.md) | Skill 指令体系（16 个 Skill `/spec-first:xxxx` 统一命名空间 + `code-review` + references/ 机制 + Phase 3 交互协议 + Context Pack v2.0 + Context Reference + Catchup 自动策略） | L1032-1186 |
| 8 | [aux-02-cli-system.md](auxiliary/aux-02-cli-system.md) | CLI 命令体系（13 命令组 + 7 核心模块 + ID 模糊搜索 + commit 封装 + Exit Code） | L1188-1354 |
| 9 | [aux-03-multi-platform.md](auxiliary/aux-03-multi-platform.md) | 多端扩展 Layer 2（仅技术端规范） | L1356-1588 |
| 10 | [aux-04-deliverables.md](auxiliary/aux-04-deliverables.md) | 产出物标准化（目录结构 + 文件格式 + 运行态三文件 + 模板 + CR Report 模板） | L1590-1668 |
| 11 | [aux-05-metrics.md](auxiliary/aux-05-metrics.md) | 度量与运营体系（12 指标 + 健康分 + 瓶颈分析） | L1671-1755 |
| 12 | [aux-06-roadmap.md](auxiliary/aux-06-roadmap.md) | 落地路线图 + 风险 + 版本演进 + 附录 | L1757-1873 |

---

## 当前关键口径（2026-02-09）

- 用户入口统一为 `/spec-first:*`，其中 Skill 与 Runtime 路由并存。
- Skill 体系为 **16 个**（阶段 9 + 编排 3 + 工具 4，含 `/spec-first:code-review`、`/spec-first:sync`）。
- `/spec-first:init` 为无参交互式入口；技术端采用 `--platforms` 多端参数模型。
- 变更管理支持 Minor 快速通道：`/spec-first:sync` 反向同步 + 增量校验。
- 日常默认路径：`/spec-first:plan → /spec-first:code（+ /spec-first:code-review）→ /spec-first:verify`。
- Phase 3 支持 `confirm_policy` 三档：`strict`（默认）/ `assisted` / `auto`（仅低风险白名单）。
- `/spec-first:code-review` 集成 `code-review-expert` 审查体系：A 类追踪合规 4 维度 + B 类代码质量 5 维度，Gate 判定公式 `APPROVE = A_all_pass AND P0==0 AND P1==0`。详见 [`code-review-integration.md`](../02技术方案/V2/code-review-integration.md)。
- Context Pack 升级至 v2.0：`control + references` 双区结构，支持按需读取（Context Reference）。
- DX 增强三件套：`spec-first id search` 模糊搜索（编码时快速定位追踪 ID）、`prepare-commit-msg` Hook 自动预填 TASK ID、`spec-first commit` 封装命令（消除 Hook 拒收心流中断）。
