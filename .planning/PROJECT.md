# spec-first Skill 系统架构优化

## What This Is

spec-first 是一个 TypeScript 构建的 AI 工程工作流工具包，运行在 Bun 运行时上。它为 Claude Code 提供结构化开发工作流的技能（skills），以及一个由 Playwright 驱动的快速 headless 浏览器 CLI。本项目专注于优化其 **Skill 系统**的架构，提升可扩展性、模块解耦和边界清晰度。

## Core Value

Skill 系统必须能够轻松添加新技能、维护现有技能、并确保技能质量通过自动化验证。所有其他目标都服从于这一核心。

## Requirements

### Validated

- ✓ SKILL.md 模板系统 — 从 `.tmpl` 文件生成 SKILL.md
- ✓ 技能验证测试 — `skill-validation.test.ts` 静态验证
- ✓ 技能健康检查 — `skill-check.ts` 仪表板
- ✓ 多技能支持 — brainstorm, design-consultation, focus-requirements, plan-ceo-review, plan-eng-review, retro 等
- ✓ Browse headless 浏览器 CLI — Playwright 驱动
- ✓ E2E 测试框架 — 通过 `claude -p` 运行
- ✓ LLM-as-judge 评估 — 质量评估

### Active

- [ ] 架构审查 — 全面审查 Skill 系统的当前架构
- [ ] 模块解耦 — 降低技能模块间的依赖耦合
- [ ] 清晰边界 — 明确各模块的职责边界
- [ ] 可扩展性改进 — 使添加新技能更加容易
- [ ] 技术债务清理 — 消除遗留代码和不必要的复杂性
- [ ] 文档完善 — 确保架构决策和模式有清晰文档

### Out of Scope

- Browse 浏览器模块的重构 — 本次只关注 Skill 系统
- 性能优化 — 后续里程碑考虑
- 新功能开发 — 本次只做架构优化，不添加新功能
- 测试覆盖率提升 — 除非在架构优化过程中发现明显缺失

## Context

**技术环境:**
- TypeScript + Bun 运行时
- Playwright 浏览器自动化
- Claude Code skills 工作流
- ES Modules 模块系统

**当前 Skill 系统状态:**
- 6 个主要技能：brainstorm, design-consultation, focus-requirements, plan-ceo-review, plan-eng-review, retro
- 多个辅助技能：review, ship, qa, qa-only, simplify 等
- SKILL.md 生成器：`scripts/gen-skill-docs.ts`
- 技能验证：`test/skill-validation.test.ts`
- 技能健康检查：`scripts/skill-check.ts`

**已知问题:**
- 技能模板和生成逻辑可能存在耦合
- 不同技能间的共享模式可能不一致
- 新技能添加流程可能不够清晰

## Constraints

- **Timeline**: 1-2 周 — 快速完成关键优化
- **Approach**: 渐进式 — 每步可独立交付，不破坏现有功能
- **Compatibility**: API/接口保持兼容 — 不能有破坏性变更
- **Tech Stack**: TypeScript + Bun — 必须在现有技术栈内工作

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 渐进式重构 | 降低风险，每步可验证 | — Pending |
| 保持 API 兼容 | 不破坏现有用户工作流 | — Pending |
| 专注 Skill 系统 | 时间有限，聚焦核心 | — Pending |

## Evolution

本文档在阶段过渡和里程碑边界时更新。

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
