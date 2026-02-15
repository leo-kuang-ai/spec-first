# `/spec-first:code-review` 集成方案

> **文档类型**: 技术集成方案 | **版本**: v1.0 | **日期**: 2026-02-09
> **上游依赖**: `code-review-expert`（`/Users/kuang/xiaobu/code-review-expert`）
> **下游影响**: core-04, aux-01, aux-04

---

## 一、集成背景

### 1.1 现状

Spec-First v7.1 需求文档已将 `/spec-first:code-review` 注册为第 16 个 Skill（Stage 类，04_implement 阶段），但仅有一行描述和 4 个高层审查维度，缺乏可执行的审查规范。

同时，团队已有一套成熟的 `code-review-expert` Skill，包含 SOLID、安全、性能、边界条件等完整审查体系和 4 份参考清单。

### 1.2 集成目标

将 `code-review-expert` 的代码质量审查能力与 Spec-First 的追踪合规审查能力合并，形成 **一个统一的 `/spec-first:code-review` Skill**，覆盖"规范对齐"和"工程质量"两个维度。

### 1.3 设计原则

1. **复用优先** — `code-review-expert` 的 4 份 reference 文件原样复用，不做改动
2. **互补合并** — Spec-First 追踪合规（A 类）+ code-review-expert 代码质量（B 类），不重复不遗漏
3. **Gate 对齐** — 审查结果直接映射到 04_implement Exit Gate 的通过/阻断判定
4. **6 阶段模型适配** — 复用 Spec-First 统一的 6 阶段执行模型，保持 Skill 体系一致性

---

## 二、审查维度定义（9 维度）

### A 类：追踪合规（Spec-First 原有）

追踪合规确保"代码与规范对齐"，是 Spec-First 的核心价值。

| 编号 | 维度 | 审查内容 | 判定依据 |
|------|------|---------|---------|
| **A1** | 功能正确性 | 实现是否满足对应 FR 的所有 AC | 逐条比对 AC 的 Given-When-Then |
| **A2** | 契约一致性 | 代码是否与 API Spec / Data Model 一致 | 比对 `contracts/*.yaml` 和 `data-model.md` |
| **A3** | Constitution 合规 | 是否违背项目原则（技术约束、质量标准、简洁性原则等） | 比对 `constitution.md` 6 维度 |
| **A4** | 追踪合规 | PR 关联 TASK ID、TASK 有 FR 依据、代码注释含追踪引用 | 校验 commit message + 代码注释 `// implements: TASK-xxx, traces: FR-xxx` |

**A 类判定规则**：
- A1-A4 任一维度不通过 → 整体判定为 REQUEST_CHANGES
- A4 追踪合规为硬性阻断项，不可豁免

### B 类：代码质量（复用 code-review-expert）

代码质量确保"代码符合工程最佳实践"，直接复用 `code-review-expert` 的审查体系。

| 编号 | 维度 | 审查内容 | 参考清单 |
|------|------|---------|---------|
| **B1** | SOLID + 架构异味 | SRP/OCP/LSP/ISP/DIP 违规、God Object、Feature Envy、Shotgun Surgery 等 | `references/solid-checklist.md` |
| **B2** | 安全与可靠性 | XSS/注入/SSRF/路径穿越、AuthN/AuthZ 缺口、密钥泄露、竞态条件、数据完整性 | `references/security-checklist.md` |
| **B3** | 错误处理 | 吞异常、过宽 catch、错误信息泄露、异步错误未处理 | `references/code-quality-checklist.md` |
| **B4** | 性能与缓存 | N+1 查询、热路径重计算、缓存缺失/失效、无界集合、内存泄露 | `references/code-quality-checklist.md` |
| **B5** | 边界条件 | null/undefined、空集合、数值溢出/除零、off-by-one、Unicode 边界 | `references/code-quality-checklist.md` |

**B 类判定规则**：
- B 类发现项按 P0-P3 严重等级分级（见第三章）
- B2 安全维度的 P0 发现项为硬性阻断，与 A 类同等优先级

### A+B 合并审查顺序

```text
Step 1: Preflight — git diff 范围确定 + 关联模块扫描
Step 2: A 类追踪合规审查（A1→A2→A3→A4）
Step 3: B1 SOLID + 架构异味
Step 4: B2 安全与可靠性
Step 5: B3 错误处理 + B4 性能 + B5 边界条件
Step 6: 移除候选识别（可选，复用 references/removal-plan.md）
Step 7: 汇总输出 CR Report
```

> A 类优先于 B 类执行。追踪合规是 Spec-First 的核心价值，必须首先校验。

---

## 三、严重等级与 Gate 映射

### 3.1 四级严重等级（复用 code-review-expert）

| 等级 | 名称 | 定义 | 典型场景 |
|------|------|------|---------|
| **P0** | Critical | 安全漏洞、数据丢失风险、正确性 Bug | SQL 注入、密钥硬编码、AC 未满足、竞态条件导致数据不一致 |
| **P1** | High | 逻辑错误、严重 SOLID 违规、性能退化 | God Object、N+1 查询、AuthZ 缺口、追踪链断裂 |
| **P2** | Medium | 代码异味、可维护性问题、轻微 SOLID 违规 | 过长方法、缺少错误处理、缓存未设 TTL |
| **P3** | Low | 风格、命名、轻微建议 | 命名不一致、Magic Number、可选优化 |

### 3.2 A 类维度的等级映射

A 类追踪合规发现项不使用 P0-P3 分级，而是二元判定（通过/不通过）：

| A 类维度 | 不通过时等效等级 | 说明 |
|---------|----------------|------|
| A1 功能正确性 | **P0** | AC 未满足 = 正确性 Bug |
| A2 契约一致性 | **P1** | API 实现与契约不一致 |
| A3 Constitution 合规 | **P1** | 违背项目原则 |
| A4 追踪合规 | **P1** | PR 未关联 TASK ID |

### 3.3 Gate 映射规则

| 条件 | 判定结果 | Gate 影响 |
|------|---------|----------|
| A 类全部通过 且 B 类 P0=0 且 P1=0 | **APPROVE** | ✅ 可通过 04_implement Gate |
| A 类任一不通过 或 B 类 P0>0 | **REQUEST_CHANGES** | ❌ 阻断，必须修复 |
| A 类全部通过 且 P0=0 且 P1>0 | **REQUEST_CHANGES** | ❌ 阻断，应在合并前修复 |
| A 类全部通过 且 P0=0 且 P1=0 且 P2>0 | **APPROVE** (with comments) | ✅ 可过 Gate，P2 建议本次或后续修复 |

**通过判定公式**：`APPROVE = (A_all_pass) AND (P0 == 0) AND (P1 == 0)`

---

## 四、CR Report 格式规范

### 4.1 文件位置

`specs/<featureId>/reports/code-review-report.md`

每次审查覆盖写入（非追加），历史审查记录通过 `gate-history.jsonl` 保留。

### 4.2 报告结构

```markdown
---
feature: <featureId>
task: <taskId>              # per-TASK 审查时填写；per-Feature 审查时为 "ALL"
reviewer: AI                # AI | <人员姓名>
date: YYYY-MM-DD
assessment: APPROVE | REQUEST_CHANGES | COMMENT
---

# Code Review Report

## Summary

| 维度 | 值 |
|------|-----|
| Feature | <featureId> |
| TASK | <taskId> |
| Files reviewed | X files |
| Lines changed | +Y / -Z |
| Overall assessment | **APPROVE** / **REQUEST_CHANGES** |
| P0 | 0 |
| P1 | 0 |
| P2 | N |
| P3 | N |

---

## A. 追踪合规

| 维度 | 结果 | 说明 |
|------|------|------|
| A1 功能正确性 | ✅ PASS / ❌ FAIL | <具体说明> |
| A2 契约一致性 | ✅ PASS / ❌ FAIL | <具体说明> |
| A3 Constitution 合规 | ✅ PASS / ❌ FAIL | <具体说明> |
| A4 追踪合规 | ✅ PASS / ❌ FAIL | <具体说明> |

---

## B. 代码质量

### P0 - Critical
（无 或 列表）

### P1 - High
- **[file:line]** 标题
  - 问题描述
  - 建议修复

### P2 - Medium
...

### P3 - Low
...

---

## Removal / Iteration Plan
（如有移除候选，按 references/removal-plan.md 模板输出）

---

## Next Steps

发现 X 个问题（P0: _, P1: _, P2: _, P3: _）。

**如何处理？**
1. **全部修复** — 修复所有发现项
2. **仅修复 P0/P1** — 仅处理阻断项
3. **指定修复** — 指定具体项
4. **不修改** — 审查完成，无需改动
```

---

## 五、审查范围与粒度

### 5.1 审查粒度

| 模式 | 触发方式 | 范围 | 适用场景 |
|------|---------|------|---------|
| **per-TASK**（默认） | `/spec-first:code-review <featureId> --task <taskId>` | 该 TASK 关联的 commits | 单个 TASK 完成后立即审查 |
| **per-Feature** | `/spec-first:code-review <featureId>` | Feature 分支全量 diff | 所有 TASK 完成后整体审查 |

**推荐实践**：per-TASK 审查（小步快审，问题早发现）。per-Feature 仅用于最终汇总确认。

### 5.2 审查范围确定机制

```text
per-TASK 模式：
  1. 从 task_plan.md 读取 TASK 关联的 FR/DS/API ID
  2. git log --grep="TASK-<FEAT>-NNN" 定位关联 commits
  3. git diff <commits> 获取变更文件和行
  4. rg/grep 扫描关联模块（调用方、被调用方）

per-Feature 模式：
  1. git diff main..HEAD（Feature 分支全量）
  2. 按模块/功能区域分组
```

### 5.3 大 diff 策略（复用 code-review-expert）

| 变更规模 | 策略 |
|---------|------|
| ≤ 500 行 | 一次性审查 |
| 500-2000 行 | 按模块/功能区域分批审查，每批独立输出 |
| > 2000 行 | 先输出文件级摘要，用户选择重点模块后深入审查 |

### 5.4 无变更处理

`git diff` 为空时，提示用户：
- 是否审查 staged changes（`git diff --cached`）
- 是否指定 commit range（`git diff <from>..<to>`）
- 是否审查特定文件（`--path <file>`）

---

## 六、阻断修复闭环

### 6.1 修复→重审流程

```text
/spec-first:code-review 执行
  │
  ├── APPROVE → 写入 CR Report → 可过 Gate
  │
  └── REQUEST_CHANGES → 写入 CR Report（含阻断项清单）
        │
        ├── 用户选择修复方式（全部 / P0P1 / 指定项）
        │
        ├── 开发者修复代码
        │
        └── 重新执行 /spec-first:code-review
              │
              ├── 增量审查：仅覆盖修复涉及的文件 + 原阻断项复查
              │
              └── 判定 → APPROVE / REQUEST_CHANGES（循环）
```

### 6.2 重审规则

| 规则 | 说明 |
|------|------|
| 审查模式 | 增量审查（仅修复部分 + 原阻断项复查），非全量重审 |
| 轮次上限 | 无硬性上限，但每轮必须有实质修复 |
| 无进展检测 | 连续 2 轮阻断项数量未减少 → 提示升级为 RFC 或请求人工介入 |
| 历史保留 | 每轮审查结果追加到 `gate-history.jsonl`，CR Report 仅保留最新版 |

### 6.3 与 Phase 3 交互协议的关系

code-review 的 "Next Steps" 四选一对应 Phase 3 交互协议：
- 选择 1-3（修复）→ 退出当前 Skill，进入修复→重审循环
- 选择 4（不修改）→ 等同 Phase 3 确认，进入 Phase 4 写入 CR Report

---

## 七、6 阶段执行模型适配

`/spec-first:code-review` 遵循 Spec-First 统一的 6 阶段执行模型（Phase 0-5），但各 Phase 内容有别于生成类 Skill（如 `:spec`、`:design`）。

### Phase 0 — Feature 定位

与其他 Skill 一致：读取 `<featureId>` 或 `.spec-first/current`。

### Phase 1 — 上下文加载

```text
1. spec-first ai context <featureId>（获取 Context Pack）
2. 读取 task_plan.md → 定位当前 TASK 及关联 FR/DS/API
3. 读取 contracts/*.yaml → API 契约定义
4. 读取 constitution.md → 项目原则
5. git diff 获取变更范围（per-TASK: --grep; per-Feature: main..HEAD）
6. 加载 references/ 下 4 份审查清单
```

### Phase 2 — AI 审查推理

```text
Step 1: Preflight — 变更范围确认 + 关联模块扫描
Step 2: A 类追踪合规审查（A1→A2→A3→A4）
Step 3: B1 SOLID + 架构异味（参考 solid-checklist.md）
Step 4: B2 安全与可靠性（参考 security-checklist.md）
Step 5: B3 错误处理 + B4 性能 + B5 边界条件（参考 code-quality-checklist.md）
Step 6: 移除候选识别（可选，参考 removal-plan.md）
Step 7: 汇总生成 CR Report
```

> Phase 2 是纯 AI 推理，不调用 CLI 命令。

### Phase 3 — 用户确认与交互式修正

code-review 的 Phase 3 与生成类 Skill 有本质区别：

| 对比项 | 生成类 Skill（:spec / :design） | 审查类 Skill（:code-review） |
|--------|-------------------------------|----------------------------|
| 展示内容 | 生成的产出物草稿 | CR Report（审查结果） |
| 用户动作 | 确认/修改/拒绝 草稿内容 | 选择修复方式（四选一） |
| 循环对象 | 重新生成草稿 | 修复代码→重新审查 |

**交互流程**：

```text
展示 CR Report
  │
  ├── APPROVE → 用户确认 "Y" → Phase 4
  │
  └── REQUEST_CHANGES → 展示 Next Steps 四选一
        ├── 用户选择修复方式 → 退出 Skill → 修复 → 重新调用 :code-review
        └── 用户选择 "不修改" → Phase 4（CR Report 记录 REQUEST_CHANGES 状态）
```

**与 Phase 3 交互协议的对齐**：
- 确认口令：`Y` / `确认` / `approve` → 写入 CR Report
- 拒绝口令：`N` / `拒绝` / `abort` → 不写入，终止 Skill
- 最大轮次：不适用（修复闭环由重新调用 Skill 实现，非 Phase 3 内循环）
- 审计记录：每轮审查结果追加到 `findings.md`

### Phase 4 — 写入交付物

```text
1. 写入 specs/<featureId>/reports/code-review-report.md
2. 无新 ID 注册（code-review 不产生 FR/TASK 等 ID）
```

> 与生成类 Skill 的区别：Phase 4 不调用 `spec-first id next`，因为 code-review 不创建新的追踪实体。

### Phase 5 — 副作用执行

```text
1. spec-first gate check <featureId>
   → 校验 04_implement Gate（CR 通过是前置条件之一）
2. 追加审查记录到 gate-history.jsonl
   → { type: "code-review", assessment: "APPROVE|REQUEST_CHANGES", p0: N, p1: N, ... }
3. 更新 progress.md
   → 记录 code-review 完成状态
4. 更新 findings.md
   → 追加本轮审查摘要（轮次、发现项数、判定结果）
```

---

## 八、Skill 文件结构与参考清单

### 8.1 目录布局

```text
skills/spec-first/06-code-review/
├── SKILL.md                            # Skill 主文件（6 阶段执行指令）
└── references/                         # 审查参考清单（原样复用）
    ├── solid-checklist.md              # SOLID 原则 + 代码异味
    ├── security-checklist.md           # 安全与可靠性
    ├── code-quality-checklist.md       # 错误处理 + 性能 + 边界条件
    └── removal-plan.md                 # 移除候选模板
```

### 8.2 参考清单复用策略

| 文件 | 来源 | 改动 |
|------|------|------|
| `solid-checklist.md` | `code-review-expert/references/` | 原样复用，不改动 |
| `security-checklist.md` | `code-review-expert/references/` | 原样复用，不改动 |
| `code-quality-checklist.md` | `code-review-expert/references/` | 原样复用，不改动 |
| `removal-plan.md` | `code-review-expert/references/` | 原样复用，不改动 |

> 4 份 reference 文件是通用的工程最佳实践，不含 Spec-First 特有逻辑，无需适配。

### 8.3 SKILL.md 适配要点

SKILL.md 不能直接复用 `code-review-expert/SKILL.md`，需要适配以下差异：

| 差异点 | code-review-expert | Spec-First 适配 |
|--------|-------------------|-----------------|
| 执行模型 | 7 步线性流程 | 6 阶段模型（Phase 0-5） |
| 上下文来源 | 纯 git diff | Context Pack + git diff + 追踪矩阵 |
| 审查维度 | 仅 B 类（代码质量） | A 类（追踪合规）+ B 类（代码质量） |
| 输出格式 | 通用 CR 模板 | 含 A 类追踪合规段的 CR Report |
| 后续动作 | 无 | Phase 5 Gate 校验 + 运行态三文件更新 |
| frontmatter | `name: code-review-expert` | `name: spec-first:code-review` / `category: stage` / `stage: 04_implement` |

### 8.4 现有 Skill 编号调整

插入 `06-code-review` 后，后续 Skill 需重编号：

| 原编号 | 新编号 | Skill |
|--------|--------|-------|
| 05-code-trace | 05-code-trace | 不变 |
| — | **06-code-review** | **新增** |
| 06-test-design | 07-test-design | 重编号 |
| 07-archive | 08-archive | 重编号 |

---

## 九、对现有需求文档的影响

### 9.1 需要修改的文件

| # | 文件 | 改动内容 | 优先级 |
|---|------|---------|--------|
| 1 | **core-04** L137-143 | "Code Review 标准"扩展为 A+B 两类 9 维度 + P0-P3 严重等级 + 通过判定公式 | P0 |
| 2 | **core-04** L114 | 产出物补充 CR Report 格式引用（指向本文档第四章） | P0 |
| 3 | **core-04** L132-135 | "执行顺序约束"补充审查粒度（per-TASK / per-Feature）和范围确定机制 | P0 |
| 4 | **core-04** 新增 | 阻断修复闭环（修复→重审流程 + 无进展检测） | P1 |
| 5 | **aux-04** L77-93 | 模板清单新增 `templates/review/code-review-report.md.hbs` | P1 |
| 6 | **aux-01** L33-57 | Skill 文件规范补充 `references/` 子目录机制说明 | P1 |

### 9.2 不需要修改的文件

| 文件 | 原因 |
|------|------|
| **core-01** | `/spec-first:code-review` 已注册，无需改动 |
| **core-02** | 架构定义无影响 |
| **core-03** | 追踪体系无影响 |
| **core-05** | Gate 表 L18 "Code CR 通过" 无需改，通过标准由 core-04 承载 |
| **core-06** | 场景验证无影响 |
| **aux-02** | CLI 系统无影响（code-review 不新增 CLI 命令） |
| **aux-03** | 多端扩展无影响 |
| **aux-05** | 度量指标暂不新增（P2，后续迭代） |
| **aux-06** | 路线图无需调整，Skill 总数仍为 16 |

---

## 十、执行计划

### 10.1 落地顺序

```text
Step 1: 需求文档对齐（本文档确认后）
  ├── 修改 core-04：审查维度 + 严重等级 + 审查粒度 + 修复闭环
  ├── 修改 aux-04：模板清单
  └── 修改 aux-01：references 机制

Step 2: Skill 文件创建
  ├── 创建 skills/spec-first/06-code-review/SKILL.md
  ├── 复制 references/ 4 份文件
  ├── 重编号 06→07, 07→08
  └── 更新 AGENTS.md 映射表

Step 3: 联调验证
  └── 在试点 Feature 上执行 /spec-first:code-review，验证完整流程
```

### 10.2 验收标准

| # | 验收项 | 判定方式 |
|---|--------|---------|
| 1 | A 类 4 维度追踪合规审查可执行 | 对含追踪注释的代码审查，A4 判定正确 |
| 2 | B 类 5 维度代码质量审查可执行 | 对含已知问题的代码审查，能识别 P0/P1 |
| 3 | CR Report 格式符合第四章规范 | 输出包含 Summary + A 类 + B 类 + Next Steps |
| 4 | Gate 映射正确 | P0=0 且 P1=0 时 APPROVE，否则 REQUEST_CHANGES |
| 5 | 修复闭环可运行 | REQUEST_CHANGES 后修复→重审→APPROVE |

---

*code-review-integration.md 完成*
