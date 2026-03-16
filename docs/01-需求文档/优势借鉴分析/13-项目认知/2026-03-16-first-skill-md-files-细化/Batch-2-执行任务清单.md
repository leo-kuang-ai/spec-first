---
title: First Skill MD 重构 Batch 2 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 2 执行任务清单

> Batch 2 目标：收口 `first` 的基础规则层，包括项目识别、生成策略映射、质量规则与测试策略，使 runtime-first 契约具备可执行的规则支撑。

---

## 一、范围

Batch 2 仅覆盖以下 4 个文件：

1. `skills/spec-first/00-first/references/detection-rules.md`
2. `skills/spec-first/00-first/references/端类型产物映射.md`
3. `skills/spec-first/00-first/references/quality-assurance-rules.md`
4. `skills/spec-first/00-first/references/testing-strategy.md`

这些文件决定 `first` 在不同项目上的识别逻辑、输出策略和质量边界。

---

## 二、目标

Batch 2 完成后，文档层面必须达成以下结果：

1. `first` 能用统一口径识别不同项目类型、端类型和系统边界。
2. 资产生成策略从“旧文档组合”改成“必选资产 + 条件型资产 + 专题型文档”。
3. QA 规则围绕 runtime assets、projection docs、LLM 受约束归纳和条件生成建立。
4. 测试策略围绕资产、投影、门禁和增量更新建立，而不是旧 markdown 承诺。

---

## 三、任务拆解

### T2.1 重写 `detection-rules.md`

目标：

- 建立统一的项目识别口径

修改点：

1. 定义项目主类型枚举：
   - backend
   - frontend
   - mobile
   - desktop
   - cli
   - library
   - monorepo
   - mixed
2. 定义子类型枚举：
   - admin
   - h5
   - app
   - bff
   - service
   - toolkit
3. 定义交互边界识别：
   - HTTP API
   - 页面路由
   - 命令入口
   - MQ / Event
   - Native Bridge
4. 引入“LLM 自动识别 + schema 固化”的规则
5. 补充识别失败时的降级规则

完成标准：

- 可覆盖当前项目及未来不同语言/端类型项目
- 不再依赖 quick/deep 产物推断项目类型

### T2.2 重写 `端类型产物映射.md`

目标：

- 建立新的生成策略映射

修改点：

1. 删除 quick/deep 产物映射表
2. 改为每类项目的输出策略：
   - 必选资产
   - 条件型资产
   - 默认生成的专题文档
   - 条件生成的专题文档
3. 说明不适用场景

完成标准：

- 对每种项目类型都能明确“生成什么，不生成什么”

### T2.3 重写 `quality-assurance-rules.md`

目标：

- 建立 runtime-first 下的统一质量规则

修改点：

1. 增加真源质量规则：
   - schema 合法
   - evidence 可追溯
   - 结构稳定
2. 增加 LLM 识别质量规则：
   - 不得虚构
   - 允许 unknown
   - 必须经 schema 校验
3. 增加归纳质量规则：
   - 必须有证据集
   - 必须能回指 evidence
   - 冲突要显式标注
4. 增加 projection 质量规则：
   - 文档可重建
   - 文档不引入新事实
5. 文档化 5 类 gates：
   - orphan
   - projection
   - ghost
   - roundtrip
   - consumption

完成标准：

- QA 规则可以直接作为后续实现 gate 的文档依据

### T2.4 重写 `testing-strategy.md`

目标：

- 把测试从“文档存在与否”提升到“资产与闭环是否成立”

修改点：

1. 建立资产级测试矩阵：
   - `summary`
   - `steering`
   - `conventions`
   - `change-map`
   - `api-contracts`
   - `structure-overview`
   - `domain-model`
   - `database-schema`（条件）
2. 建立 docs projection 测试矩阵
3. 建立专题文档测试矩阵
4. 建立条件型资产测试矩阵
5. 建立增量更新与 roundtrip 测试矩阵
6. 建立跨项目类型的 fixture 策略

完成标准：

- 测试对象是资产、投影和 gates，而不是旧 quick/deep 文档数

---

## 四、删除项清单

Batch 2 中必须显式删除的旧内容包括：

1. 基于 quick/deep 的产物映射
2. 以旧 Agent 文档清单为中心的 QA 要求
3. 以“某文档是否生成”作为主要成功标准的测试描述
4. 依赖单一语言/单一端类型假设的识别规则

---

## 五、输入依赖

Batch 2 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/skill-docs/detection-rules.md`
4. `2026-03-16-first-skill-md-files-细化/skill-docs/端类型产物映射.md`
5. `2026-03-16-first-skill-md-files-细化/skill-docs/quality-assurance-rules.md`
6. `2026-03-16-first-skill-md-files-细化/skill-docs/testing-strategy.md`

---

## 六、输出结果

Batch 2 应产出：

1. 新版 `detection-rules.md`
2. 新版 `端类型产物映射.md`
3. 新版 `quality-assurance-rules.md`
4. 新版 `testing-strategy.md`

以及一份验收记录，至少说明：

- 项目类型识别口径是否统一
- 产物映射是否已改为生成策略
- QA 规则是否支持 runtime-first
- 测试策略是否覆盖资产、投影和 gates

---

## 七、验收问题

Batch 2 完成后，必须回答：

1. 是否还能在规则层看到 quick/deep 产物映射？
2. 是否还能在 QA / 测试层看到“旧 markdown 数量承诺”？
3. 项目类型识别是否已支持 backend/admin/h5/app/cli/library/monorepo/mixed？
4. 是否已经形成围绕 runtime assets 的 gate 体系？

只要其中任一问题答案是否定，Batch 2 就不算完成。

---

## 八、结论

Batch 2 的本质不是“改 4 个规则文档”，而是：

> **把 first 的识别逻辑、生成策略、质量规则和测试矩阵，全部从旧文档模式迁移到 runtime-first 规则体系。**

只有 Batch 2 完成，后续专题能力和 docs 投影层改造才有稳定规则可依。
