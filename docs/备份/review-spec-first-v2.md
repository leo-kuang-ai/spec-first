# Spec-First v2.0 深度审查报告

> **审查日期**: 2026-02-06
> **审查人**: Leo
> **审查对象**: `docs/01需求文档/spec-first-v2.md` v2.0
> **审查版本**: v1.0
> **参考标准**: Spec-Kit (GitHub)、SpecifyPlus (Spec-Kit-Plus)、Autospec、TypeSpec、ISO/IEC 12207、V-Model、SAFe、CMMI

---

## 审查结论

**总体评价**：7+3 架构在宏观层面正确，主流程与支撑机制分离对标 ISO 12207，方向无误。但与 Spec-Kit / SpecifyPlus / Autospec 的实际实现对比后，发现 **13 个可改进点**，其中 3 个为结构性问题。

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构合理性 | 8/10 | 7+3 分离正确，但 Init 阶段定位模糊 |
| 业界对齐度 | 6/10 | 缺少 Research、Checklist、分支策略等业界标配 |
| 可执行性 | 6/10 | 产出物格式未论证，轻量模式过粗，落地有障碍 |
| 自动化友好度 | 5/10 | 纯 Markdown 不利于工具校验，缺少 Agent 协作设计 |
| 完整性 | 7/10 | Analyze 触发时机不全，Constitution 定义过窄 |

---

## 亮点确认（做对了的部分）

1. **7+3 架构分离**：主流程与支撑机制分离，对标 ISO 12207 的"主过程 vs 支撑过程"，结构正确
2. **Quality Gate 替代独立 Review**：减少流程节点但不降低质量，对标 SAFe DoD
3. **Change-Management 横切化**：符合 CMMI REQM"需求管理是持续活动"的定义
4. **Spec-Consistency-Analysis**：对标 Spec-Kit `/speckit.analyze`，方向正确
5. **渐进式落地路线图**：4 步引入策略务实，避免一次性推行的风险

---

## P0：结构性问题（影响流程可执行性）

### P0-1：Init 阶段项目级/Feature 级定位模糊

**现象**：文档声明作用域为"Feature 级别"，但 00. Init 的活动是"项目脚手架生成 + Constitution 定义"——这是项目级的一次性活动。

**业界对标**：
- **Spec-Kit**：`init` 和 `constitution` 是项目级一次性操作
- **SpecifyPlus**：明确说 Constitution 是 "a one-time setup defining project rules and standards"
- **Autospec**：无 init 概念，直接从 specify 开始（Feature 级）

**矛盾**：第二个 Feature 开始时做什么？重新生成脚手架？重新定义 Constitution？

**建议**：
1. 区分"项目级初始化"（Init：脚手架 + Constitution，只执行一次）和"Feature 级启动"（Feature Kickoff：读取 Constitution、确认范围、创建分支/目录）
2. 或将 Init 标注为"首次执行/按需执行"，后续 Feature 从 01. Specify 开始

---

### P0-2：Design 阶段缺少 Research 子阶段

**现象**：02. Design 直接跳到"技术选型 → 架构设计 → API 契约设计 → 数据建模"，没有显式的技术调研环节。

**业界对标**：
- **Spec-Kit**：`plan` 命令明确分为 Phase 0: Research（解决未知项）+ Phase 1: Design（架构/数据/契约），产出独立的 `research.md`
- **SpecifyPlus**：同样生成 `research.md`，记录"decisions, rationale, alternatives considered"
- **Autospec**：plan 阶段隐含 research，产出 plan.yaml 中包含 design decisions

**影响**：没有显式 Research，团队可能在未充分调研的情况下做出技术决策。ADR 记录的是"决策结果"，但 Research 记录的是"调研过程"——两者互补，不可替代。

**建议**：在 Design 阶段增加 Research 子步骤（Phase 0），产出 `research.md`，内容包括：
- 技术可行性调研
- 备选方案对比（含 Trade-off 分析）
- 未知项清单及解决方案
- 第三方依赖评估

---

### P0-3：Spec-Consistency-Analysis 触发时机不完整

**现象**：横切机制 B 定义了 3 个触发时机（Design 后、Plan 后、Implement 后），缺少 2 个关键时机。

**业界对标**：
- **Spec-Kit**：`analyze` 检查包含 constitution compliance，意味着 Specify 阶段就应触发
- **SpecifyPlus**：analyze 放在 tasks 之后、implement 之前，且包含 spec 自身内部一致性校验
- **Autospec**：workflow 为 tasks → checklist → **analyze** → implement

**缺失的触发时机**：

| 缺失时机 | 校验内容 | 影响 |
|---------|---------|------|
| **Specify 完成后** | spec 内部一致性（AC 是否覆盖所有 FR、NFS 是否量化、User Story 间是否矛盾）+ Constitution 合规 | 不完整的 spec 流入 Design |
| **Verify 完成后** | 测试结果 vs spec 最终对齐（所有 AC 是否都有测试用例且通过） | 无法确认测试真正覆盖了所有 spec 要求 |

**建议**：将触发时机扩展为 5 个：Specify 后 → Design 后 → Plan 后 → Implement 后 → Verify 后

---

## P1：重要缺失（影响流程完整性）

### P1-1：缺少 Checklist 概念（预实现验证清单）

**现象**：流程中没有"实现前验证清单"的概念。Quality Gate 是阶段后的准出条件，但缺少阶段前的准入验证。

**业界对标**：
- **Spec-Kit**：`/speckit.checklist` 生成验证清单，在 implement 前执行
- **Autospec**：workflow 为 tasks → **checklist** → analyze → implement
- **SpecifyPlus**：plan 阶段生成 `quickstart.md`（验证场景）

**建议**：在 Plan 阶段增加 Checklist 子产出物（`checklist.md`），内容为从 AC 派生的验证场景清单，作为 Implement 和 Verify 的输入。

---

### P1-2：产出物格式策略缺乏论证（Markdown vs YAML）

**现象**：所有产出物默认 Markdown 格式，API 契约用 YAML。但文档未论证这一选择的依据。

**业界对标**：
- **Autospec**：明确采用 YAML-first artifacts（spec.yaml, plan.yaml, tasks.yaml），理由是"programmatic access and validation"。每个产出物通过 `autospec artifact` 做 schema compliance 检查
- **TypeSpec**：用专用 DSL（.tsp）定义 API，10 行 TypeSpec 生成 100 行 OpenAPI，强调"single source of truth"
- **Spec-Kit**：用 Markdown 但内嵌结构化标记（如 `[NEEDS CLARIFICATION]`、`FR-001` 编号）

**核心矛盾**：Spec-First 的理念是"规范即契约、自动化校验"，但纯 Markdown 格式难以被工具自动解析和校验。

**建议**：
1. 明确产出物格式策略：人读为主用 Markdown，机器解析为主用 YAML
2. 关键产出物（spec, tasks）采用结构化 Markdown（YAML front matter + Markdown body）
3. API 契约统一为 OpenAPI YAML/JSON，与 TypeSpec 等工具链兼容

---

### P1-3：轻量模式定义过于粗糙

**现象**：轻量模式为"Init → Specify → Implement → Verify → DevOps"，跳过 Design 和 Plan。但 Implement 没有设计方案和任务清单作为输入，开发者凭什么开发？

**业界对标**：
- **Spec-Kit / SpecifyPlus / Autospec**：均无"跳过阶段"的概念。它们的解决方案是让每个阶段本身足够轻量（AI 自动生成、YAML 格式），而不是跳过阶段
- **SpecifyPlus**：小 Feature 的 plan.md 可能只有 10 行，大 Feature 100 行——阶段不跳过，产出物深度可调

**建议**：
1. 重新定义轻量模式：不跳过阶段，而是精简产出物深度
2. 定义 Feature 复杂度分级（S/M/L），每级对应不同产出物深度要求
3. 让工具自动化生成产出物，降低每个阶段的人工成本

---

### P1-4：目录结构与业界不一致

**现象**：目录结构为 `feature-name/`，存在 3 个问题：

| 问题 | 说明 |
|------|------|
| constitution.md 位置错误 | 放在 feature 目录下，但 Constitution 是项目级产物 |
| 缺少 `specs/` 顶层前缀 | 多 Feature 并行时产出物如何组织？ |
| retro.md 归属不当 | 复盘可能涉及多 Feature 交叉分析 |

**业界对标**：
- **Spec-Kit**：`specs/<feature-name>/`（如 `specs/001-photo-albums/`）
- **Autospec**：`specs/<feature-name>/`，产出物为 YAML
- **SpecifyPlus**：项目级产物在 `memory/constitution.md`，Feature 级在 `specs/<feature>/`

**建议**：
1. 项目级产物（constitution.md）放在项目根目录或 `specs/` 根目录
2. Feature 级产物放在 `specs/<NNN-feature-name>/` 下（带编号）
3. 复盘报告可保留在 Feature 目录，但增加项目级汇总机制

---

### P1-5：缺少 Git 分支管理策略

**现象**：Spec-as-Code 实践部分只提到 `git diff`，未定义分支策略。

**业界对标**：
- **Spec-Kit**：`specify` 命令自动创建语义化分支（如 `001-photo-albums`），自动扫描 `specs/` 确定编号
- **Autospec**：`specify` 命令自动创建并切换到 feature 分支
- 分支策略是 Spec-as-Code 的基础设施——规范产物在独立分支演进，通过 PR 合并，变更有完整 audit trail

**缺失项**：
1. Feature 分支命名规范
2. 规范产物的分支生命周期（创建 → 演进 → PR → 合并）
3. 规范 PR 的 review 流程

**建议**：补充 Git 分支策略章节，定义 Feature 分支命名规范（如 `spec/<NNN-feature-name>`）和规范产物的版本管理流程

---

## P2：优化建议（提升流程质量）

### P2-1：Constitution 内容定义过窄

**现象**：Constitution 只列了 4 项（性能底线、安全红线、技术偏好、架构原则）。

**业界对标**：
- **SpecifyPlus** 的 constitution 验证 gates 包括：
  - Simplicity Gate：是否使用了过多依赖？
  - Anti-Abstraction Gate：是否直接使用框架而非过度抽象？
  - Integration-First Gate：是否定义了契约？
- **Spec-Kit**：constitution 覆盖代码质量、测试标准、用户体验一致性、性能要求

**建议**：扩展 Constitution 模板至 5 个维度：

| 维度 | 示例内容 |
|------|---------|
| 技术约束 | 语言、框架、依赖上限 |
| 质量标准 | 测试覆盖率底线、代码复杂度上限 |
| 流程约束 | API 必须先定义契约再实现 |
| 简洁性原则 | 依赖数量上限、抽象层级限制 |
| 协作规范 | PR 必须有 review、文档与代码同步 |

---

### P2-2：Verify 阶段缺少 V-Model 层次对应

**现象**：文档声称"对标 V-Model"，但实际只有集成测试、安全扫描、UAT，缺少 V-Model 的核心——测试层级与设计层级的对应关系。

**V-Model 经典对应**：

| 设计层级 | 对应测试层级 | v2.0 现状 |
|---------|------------|----------|
| 需求分析 | 验收测试（UAT） | 有（05. Verify） |
| 概要设计 | 集成测试 | 有但缺设计依据 |
| 详细设计 | 单元测试 | 放在 04. Implement（TDD），Verify 未汇总 |

**建议**：
1. 在 Verify 阶段明确测试金字塔层级对应
2. 补充集成测试设计（基于 API 契约和组件交互）
3. 明确单元测试（Implement）与集成测试/UAT（Verify）的边界

---

### P2-3：任务并行化标记缺失

**现象**：Plan 阶段提到"依赖关系显式标注"，但没有定义并行化策略。

**业界对标**：
- **SpecifyPlus**：任务格式含 `[P]` 标记（可并行）和 `[US1]` 标记（关联 User Story）
- **Autospec**：tasks.yaml 中每个任务有 `dependencies` 字段

**建议**：在 tasks.md 模板中增加并行化标记（`[P]`）和依赖表达格式（`depends_on: [T001]`），尤其在 AI Agent 多任务并行场景下价值显著

---

### P2-4：缺少决策溯源机制（超越 ADR）

**现象**：ADR 只覆盖架构级决策，大量需求级和实现级决策无记录机制。

**业界对标**：
- **SpecifyPlus**：PHR（Prompt History Recording）自动保存对话历史到 `history/prompts/`
- **Spec-Kit**：`research.md` 记录调研过程中的决策与理由

**建议**：不必引入 PHR（过重），但应在 spec.md 和 plan.md 模板中预留"Decisions & Rationale"章节，覆盖需求、设计、实现三个层级的关键决策

---

### P2-5：缺少 AI Agent 协作模式考量

**现象**：流程定位偏向"人类团队的流程规范"，未考虑 AI Agent 作为执行者的场景。

**业界对标**：
- **Spec-Kit**：自动更新 CLAUDE.md、AGENTS.md、.github/copilot-instructions.md 等 Agent 上下文文件
- **Autospec**：YAML 格式确保 Agent 可精确解析任务
- **SpecifyPlus**：`implement` 命令直接将 tasks 交给 AI Agent 执行

**建议**：
1. 在产出物标准化部分增加"Agent 可消费性"要求
2. 关键产出物（spec, tasks）采用结构化格式（YAML front matter + Markdown body）
3. 定义 Agent 上下文同步策略（类似 Spec-Kit 的 update-agent-context.sh）

---

## 审查问题汇总

| 编号 | 级别 | 问题 | 涉及章节 | 业界依据 |
|------|------|------|---------|---------|
| P0-1 | P0 | Init 阶段项目级/Feature 级定位模糊 | 00. Init | Spec-Kit, SpecifyPlus |
| P0-2 | P0 | Design 阶段缺少 Research 子阶段 | 02. Design | Spec-Kit Phase 0, SpecifyPlus |
| P0-3 | P0 | Analyze 触发时机不完整（缺 Specify 后、Verify 后） | 横切机制 B | Spec-Kit, Autospec |
| P1-1 | P1 | 缺少 Checklist 概念 | 03. Plan / 04. Implement 之间 | Spec-Kit, Autospec |
| P1-2 | P1 | 产出物格式策略缺乏论证 | 产出物标准化 | Autospec YAML-first, TypeSpec |
| P1-3 | P1 | 轻量模式定义过于粗糙 | 风险提醒 | Spec-Kit, SpecifyPlus |
| P1-4 | P1 | 目录结构与业界不一致 | 产出物标准化 | Spec-Kit, Autospec |
| P1-5 | P1 | 缺少 Git 分支管理策略 | 工具链映射 | Spec-Kit, Autospec |
| P2-1 | P2 | Constitution 内容定义过窄 | 00. Init | SpecifyPlus Gates |
| P2-2 | P2 | Verify 阶段缺少 V-Model 层次对应 | 05. Verify | V-Model |
| P2-3 | P2 | 任务并行化标记缺失 | 03. Plan | SpecifyPlus [P], Autospec |
| P2-4 | P2 | 缺少决策溯源机制 | 全流程 | SpecifyPlus PHR |
| P2-5 | P2 | 缺少 AI Agent 协作模式考量 | 全流程 | Spec-Kit, Autospec |

---

## 附录：业界工作流对比

### 各框架工作流对照

```
Spec-Kit:      init → constitution → specify → clarify → plan(Research+Design) → analyze → tasks → checklist → implement
SpecifyPlus:   init → constitution → specify → clarify → plan → ADR → tasks → analyze → implement → PHR → Test&Merge
Autospec:      specify → plan → tasks → checklist → analyze → implement
Spec-First v2: Init → Specify → Design → Plan → Implement → Verify → Wrap-up
```

### 功能覆盖对比矩阵

| 能力 | Spec-Kit | SpecifyPlus | Autospec | Spec-First v2 |
|------|----------|-------------|----------|---------------|
| Constitution | ✅ | ✅ | ❌ | ✅ |
| Clarify | ✅ | ✅ | ❌ | ✅ |
| Research | ✅ Phase 0 | ✅ research.md | 隐含 | ❌ **缺失** |
| Checklist | ✅ | ✅ quickstart.md | ✅ | ❌ **缺失** |
| Analyze | ✅ 多阶段 | ✅ | ✅ | ⚠️ 触发时机不全 |
| 并行化标记 | ❌ | ✅ [P] | ✅ deps | ❌ **缺失** |
| YAML 产物 | ❌ Markdown | ❌ Markdown | ✅ YAML-first | ❌ Markdown |
| Git 分支自动化 | ✅ | ✅ | ✅ | ❌ **缺失** |
| Agent 上下文同步 | ✅ | ✅ | ❌ | ❌ **缺失** |
| 决策溯源 | ✅ research.md | ✅ PHR | ❌ | ⚠️ 仅 ADR |
| 测试/验证 | ❌ 不含 | ✅ Test&Merge | ❌ 不含 | ✅ Verify |
| 复盘 | ❌ | ❌ | ❌ | ✅ Wrap-up |
| 横切机制 | ❌ | ❌ | ❌ | ✅ 3 个 |
| Quality Gate | 隐含 | 隐含 | 隐含 | ✅ 显式定义 |

**结论**：Spec-First v2 在 Verify、Wrap-up、横切机制、Quality Gate 显式定义方面**领先**于业界三个框架。但在 Research、Checklist、分支自动化、Agent 协作方面存在**缺失**。

---

## 核心建议（按优先级）

### 第一优先：修复 3 个 P0 结构性问题

1. **明确 Init 的项目级/Feature 级边界**：Constitution 是项目级一次性操作，Feature 从 Specify 开始
2. **Design 阶段补充 Research 子步骤**：产出 `research.md`，在架构决策前充分调研
3. **Analyze 触发时机扩展为 5 个**：Specify 后 → Design 后 → Plan 后 → Implement 后 → Verify 后

### 第二优先：补齐 5 个 P1 重要缺失

4. **增加 Checklist 子产出物**：Plan 阶段产出 `checklist.md`，作为 Implement 和 Verify 的验证输入
5. **明确产出物格式策略**：人读用 Markdown，机器解析用 YAML；关键产出物采用 YAML front matter
6. **重新定义轻量模式**：不跳过阶段，而是按 Feature 复杂度（S/M/L）调节产出物深度
7. **对齐目录结构**：项目级产物在根目录，Feature 级在 `specs/<NNN-feature-name>/`
8. **补充 Git 分支策略**：Feature 分支命名规范 + 规范产物版本管理流程

### 第三优先：5 个 P2 优化项（按需引入）

9. **扩展 Constitution 模板**：覆盖技术约束、质量标准、流程约束、简洁性原则、协作规范 5 个维度
10. **Verify 阶段补充 V-Model 层次对应**：明确单元测试/集成测试/UAT 的边界与对应关系
11. **任务模板增加并行化标记**：`[P]` 标记 + `depends_on` 依赖表达
12. **产出物模板预留决策记录区域**：spec.md / plan.md 中增加 "Decisions & Rationale" 章节
13. **考虑 AI Agent 协作模式**：结构化产出物格式 + Agent 上下文同步策略

---

## 风险提醒

> 本审查报告识别了 13 个改进点，但**切忌一次性全部修复**。建议按 P0 → P1 → P2 的优先级渐进式改进，每次修复后用一个真实 Feature 验证效果。

---

**审查人**: Leo (况雨平)
**文档版本**: v1.0
**审查日期**: 2026-02-06
**审查对象**: spec-first-v2.md v2.0
**参考框架**: Spec-Kit (GitHub)、SpecifyPlus、Autospec、TypeSpec、ISO 12207、V-Model、SAFe、CMMI
