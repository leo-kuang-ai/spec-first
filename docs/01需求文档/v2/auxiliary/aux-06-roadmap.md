# Spec-First v7.1 — 落地路线图与附录

> **模块**: 辅助功能模块 #6 | **拆分自**: spec-first-v7.md L1757-1873
> **版本**: v7.1 | **更新**: 2026-02-09

---

## 落地路线图

> 截至 2026-02-09 的实际状态，分三栏呈现。

### 已交付（As-Is）

| 模块/能力 | 状态 | 说明 |
|----------|------|------|
| M1 ProcessEngine | ✅ | 阶段状态机、init/stage 命令可用 |
| M2 TraceEngine | ✅ | ID 注册/校验、追踪矩阵管理、覆盖率计算 |
| M4 ChangeMgr | ✅ | RFC 状态机 + 缺陷管理（rfc/defect 命令） |
| M6 MetricsEngine | ✅ | 覆盖率计算 + 度量报告 |
| CLI 11 个命令组 | ✅ (10/11) | init/id/gate/stage/matrix/metrics/ai/rfc/defect/doctor 已交付，feature 规划中（个别子命令有类型漂移） |
| 15 个 Skill（统一命名空间） | ✅ | `/spec-first:plan`、`/spec-first:verify`、`/spec-first:orchestrate`、`/spec-first:sync` 等 15 个 Skill 统一 `/spec-first:xxxx` 入口 |
| Handlebars 模板系统 | ✅ | 6 个模板文件就位 |
| Session hooks + CI 校验 | ✅ | `npm run validate:ai-assets` 可运行 |

### 在修复（Known Issues）

| 模块/能力 | 状态 | 问题 |
|----------|------|------|
| M3 GateEngine | 🔧 | Gate 自动条件解析器注入链路未完成，`--force` 有滥用风险 |
| M5 AIOrchestrator | 🔧 | 命令层与核心模块签名漂移，`npm run typecheck` 不通过 |
| CLI 类型一致性 | 🔧 | gate/ai/defect 命令存在类型错误，需修复到 typecheck 归零 |

### 待建设（To-Be）

| 模块/能力 | 优先级 | 说明 |
|----------|--------|------|
| 15 个 `/spec-first:xxxx` Skill 联调验收 | P0 | Skill 初版指令已编写，待联调验收并统一接入 `.claude/commands/spec-first/` 入口 |
| npm 仓库分发体系 | P0 | 使用人员仅 npm 安装；内网发布到内网 npm 私有仓库，外网发布到自建外网 npm 仓库 |
| CLI `feature` 命令组 | P1 | `feature list/switch/current`，支持多 Feature 切换与 `.spec-first/current` 状态管理 |
| M7 ToolIntegration | P1 | Git Hook 安装 + CI 模板生成 |
| Hook 化 Gate 双层体系 | P1 | Layer A（AI Runtime）+ Layer B（Git/CI） |
| Layer 2 多端扩展 | P2 | Azure DevOps 适配、GitLab CI 模板 |
| 性能优化 SLA 达标 | P2 | `validateId` < 10ms, `getCoverage` < 50ms, `evaluateGate` < 200ms |
| 端到端集成测试 | P2 | 核心流程自动化验证 |

---

## 风险提醒

### 风险矩阵

| # | 风险 | 概率 | 影响 | 等级 | 缓解措施 |
|---|------|------|------|------|----------|
| R1 | 流程过重导致团队抵触 | 高 | 高 | 🔴 | Mode×Size 裁剪：S 模式保留全部阶段但降低产出物深度，仅保留核心 Gate 条件 |
| R2 | AI 生成内容质量不可控 | 中 | 高 | 🟡 | SCA 三检查点 + 人在回路强制确认 + Gate 阻断机制 |
| R3 | 规范与实现渐行渐远 | 中 | 高 | 🟡 | 追踪矩阵实时校验 + PR Gate 自动检查 + 覆盖率阈值 |
| R4 | 上下文丢失致 AI 重复劳动 | 中 | 中 | 🟡 | Context Pack + Session Catchup + 运行态三文件 |
| R5 | 工具链学习成本过高 | 中 | 中 | 🟡 | Skill 封装复杂度 + CLI 统一入口 + doctor 自检 |

### 风险应对原则

1. **渐进式推行** — 先在 1-2 个试点 Feature 验证，再逐步推广
2. **裁剪优先** — 默认使用最轻量配置（S + I），按需升级
3. **工具兜底** — 所有人工判断环节都有 CLI 自动化兜底
4. **快速反馈** — Gate 校验失败时给出明确修复建议，而非仅报错

---

## 版本演进映射

### v2 → v5 → v6 → v7.1 演进脉络

| 维度 | v2 | v5 | v6 | v7.1（本版本） |
|------|-----|-----|-----|---------------|
| 定位 | 需求规范模板 | CLI 工具链规范 | CLI + Skill 协同基线 | Skill 驱动 + CLI 底层能力 |
| 架构 | 无 | CLI 单层 | CLI + Skill 双层（明确主权） | 双层架构（Skill 驱动 + CLI 执行）+ M1-M7 模块细化 |
| 阶段 | 6 阶段 | 8+2 阶段 | 8+2（继承 v5） | 8+2（继承，补终态定义） |
| ID 体系 | 4 种 | 8 种 | 8 种（继承 v5） | 8 种（继承） |
| 追踪 | 手动矩阵 | 自动化矩阵 + 9 覆盖率 | 继承 v5 | 继承 + 健康分 |
| Gate | 无 | 8 Gate + SCA | 继承 v5 | 继承 + Hook 化双层体系 |
| AI 协作 | 无 | Context Pack + Catchup | 3 协同 Skill | 15 Skill（统一 `/spec-first:xxxx`） |
| 变更管理 | 无 | RFC + Defect FSM | 继承 v5 | 继承 |
| 度量 | 无 | 9 覆盖率 | 继承 v5 | 12 指标 + 健康分 + 瓶颈分析 |
| 多端 | 无 | 技术端平台规范 | 继承 v5 | 继承 + Layer 2 技术端规范合并 |
| 裁剪 | 无 | Mode×Size | 三层合并 | 继承 v6（含合并示例） |

### v7.1 相对 v6 的核心增量

1. **15 个 Skill 统一命名空间**（全新）— 阶段 ×8 + 编排 ×3 + 工具 ×4（含 `sync`），统一 `/spec-first:xxxx` 入口 + 5 阶段执行模型
2. **双层架构细化** — 在 v6 主权定义基础上，细化 7 个核心模块（M1-M7）和职责边界
3. **度量体系增强** — 从 9 项覆盖率扩展到 12 项指标 + 健康分 + 瓶颈分析
4. **Hook 化 Gate 体系**（细化）— Layer A（AI Runtime）+ Layer B（Git/CI）双层 Hook
5. **Context Pack 标准化**（细化）— YAML 格式定义 + <2KB 约束
6. **终态定义补全** — 08_done / 09_cancelled 的进入条件、审计要求、不可逆规则
7. **As-Is/To-Be 标签** — 每项能力标注实际状态，避免预期失真

---

## 附录

### A. 术语表

| 术语 | 含义 |
|------|------|
| FR | Functional Requirement（功能需求） |
| NFR | Non-Functional Requirement（非功能需求） |
| DS | Design Specification（设计规格） |
| AC | Acceptance Criteria（验收标准） |
| TC | Test Case（测试用例） |
| ADR | Architecture Decision Record（架构决策记录） |
| RFC | Request for Change（变更请求） |
| SCA | Spec-Consistency-Analysis（规范一致性分析） |
| Gate | Quality Gate（质量门禁） |
| FEAT | Feature Abbreviation（功能缩写） |

### B. 参考文档

- `docs/01需求文档/spec-first-v7.md` — v7.1 完整规范（本拆分文档的源文件）
- `docs/01需求文档/spec-first-v5.md` — v5 完整规范（前序版本）
- `docs/02技术方案/` — 技术设计文档
- `.claude/commands/spec-first/` — 15 个 Skill 指令文件（统一 `/spec-first:xxxx` 入口）

---

*aux-06-roadmap.md 完成 — 文档拆分全部结束*
