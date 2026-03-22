# 执行计划：spec-first-pro 一期

更新于：2026-03-22

---

## 阶段一：基础设施（先做，后续所有 Skill 依赖）

### T1 — 定义 feature.json Schema
- **产物：** `docs/02-待办/feature-json-schema.md`
- **内容：** 完整 JSON 结构定义（按端分区 + 所有字段说明）
- **验收：** 其他 Skill 文档可直接引用，无歧义
- **状态：** ⬜ 待开始

### T2 — 定义本端需求文档模板
- **产物：** `docs/02-待办/end-demand-template.md`
- **内容：** 固定章节（背景 / 需求范围 / 功能点 / 验收标准 / 范围外）
- **验收：** 研发拿到模板知道该填什么，AI 执行时有明确结构锚点
- **状态：** ⬜ 待开始

### T3 — 定义 Skill 文档模板
- **产物：** `docs/02-待办/skill-doc-template.md`
- **内容：** 标准章节顺序（概述 / 输入规范 / 前置检查 / 执行流程 / ## 输出规范 / Completion Status）
- **验收：** 三个 Skill 文档都用同一套模板，结构一致
- **状态：** ⬜ 待开始

---

## 阶段二：核心 Skill 文档（按顺序，后一个依赖前一个的经验）

### T4 — 写 `split-product-demand-by-end` Skill 文档
- **产物：** `docs/02-待办/skills/split-product-demand-by-end.md`
- **关键点：**
  - 内置降级问答（无 feature.json 时也能独立运行）
  - 前置检查内联（不引用外部文档）
  - 固定"## 输出规范"章节 + Completion Status
  - 输出写入 `.spec-first/{end}-demand.md`
- **依赖：** T2、T3
- **状态：** ⬜ 待开始

### T5 — 写 `split-product-demand-by-end` Judge eval 用例
- **产物：** `evals/split-product-demand-by-end/`
  - `sample-input.md`（真实产品需求文档片段）
  - `expected-output.md`（期望的本端需求文档）
  - `judge-prompt.md`（四维度 Judge prompt）
- **关键测试：** 幻觉防护（AI 不得发明需求文档中不存在的功能点）
- **依赖：** T4
- **状态：** ⬜ 待开始

### T6 — 用真实需求文档跑一次 + 记录 Judge 结果
- **操作：** 选一个真实产品需求文档，运行 T4 的 Skill，触发 T5 的 Judge
- **产物：** `.spec-first/judge-reports/split-product-demand-by-end-{datetime}.json`
- **目的：** 验证 Judge prompt 能否发现幻觉，记录第一批 hallucination_types
- **依赖：** T4、T5
- **状态：** ⬜ 待开始

### T7 — 写 `assemble-workspace-context` Skill 文档
- **产物：** `docs/02-待办/skills/assemble-workspace-context.md`
- **关键点：**
  - 交互式问答（端名从列表选，需求文档路径交互输入）
  - 原子写入 feature.json（write-then-rename）
  - 自动追加 `.gitignore`（排除 `judge-reports/`）
  - 磁盘写入失败捕获（一期必须处理，不可跳过）
- **依赖：** T1、T3、T6 经验
- **状态：** ⬜ 待开始

### T8 — 写 `assemble-workspace-context` Judge eval 用例
- **产物：** `evals/assemble-workspace-context/`
  - 正常路径、空文档、文件不存在三个用例
- **依赖：** T7
- **状态：** ⬜ 待开始

### T9 — 写 `split-backend-by-capability-domain` Skill 文档
- **产物：** `docs/02-待办/skills/split-backend-by-capability-domain.md`
- **关键点：**
  - 可选依赖（无 feature.json 时直接读产品需求）
  - 核心防退化：输出必须按能力域，不得跟着前端页面拆
  - Judge eval 必须覆盖幻觉测试（"用户列表页" → "用户管理能力域"）
- **依赖：** T6 经验（最重要的幻觉类型已知后再写）
- **状态：** ⬜ 待开始

### T10 — 写 `split-backend-by-capability-domain` Judge eval 用例
- **产物：** `evals/split-backend-by-capability-domain/`
  - 正常路径、可选依赖降级、幻觉防护三个用例
- **依赖：** T9
- **状态：** ⬜ 待开始

---

## 阶段三：接入 spec-first 框架

### T11 — 将三个 Skill 挂载到 spec-first slash command
- **操作：** 在 spec-first 框架中注册：
  - `/spec-first:assemble-workspace-context`
  - `/spec-first:split-product-demand-by-end`
  - `/spec-first:split-backend-by-capability-domain`
- **验收：** 在真实项目 repo 中可以直接调用
- **依赖：** T8、T10
- **状态：** ⬜ 待开始

### T12 — 端到端验证（全链路跑通）
- **操作：** 选一个真实需求，完整走一遍：
  1. `/spec-first:assemble-workspace-context`
  2. `/spec-first:split-product-demand-by-end`
  3. 把输出的 `{end}-demand.md` 交给 gstack 继续
- **验收：** 研发拿到本端需求文档，可以直接用 gstack 开始方案设计
- **依赖：** T11
- **状态：** ⬜ 待开始

---

## 执行顺序

```
T1 → T2 → T3
              ↓
             T4 → T5 → T6   ← 最小可验证路径（MVP）
                              ↓
                             T7 → T8
                             T9 → T10
                                        ↓
                                       T11 → T12
```

**最小可验证路径（MVP）：T1 → T2 → T3 → T4 → T5 → T6**

跑完 T6，你就知道 Judge 能不能发现幻觉，以及哪类幻觉在需求工程场景里最常见。这个结论会直接影响 T7-T10 的设计质量。
