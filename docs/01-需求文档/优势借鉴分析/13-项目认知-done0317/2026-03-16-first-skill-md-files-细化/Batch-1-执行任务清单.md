---
title: First Skill MD 重构 Batch 1 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 1 执行任务清单

> Batch 1 目标：收口 `first` 的总契约，建立新的单一标准模式，并清除旧 quick/deep 与 Agent 直出 markdown 的产品叙述。

---

## 一、范围

Batch 1 仅覆盖以下 3 个文件：

1. `skills/spec-first/00-first/SKILL.md`
2. `skills/spec-first/00-first/references/execution-flow.md`
3. `skills/spec-first/00-first/references/subagent-architecture.md`

这是整个重构的总入口批次，必须先于其他批次完成。

---

## 二、目标

Batch 1 完成后，系统文档层面必须达成以下结果：

1. `first` 被定义为**单一标准模式**，不再区分 quick/deep。
2. `first` 被定义为**项目认知编译器**，而不是文档生成器。
3. 正式输出口径变成：
   - canonical runtime assets
   - 条件型资产
   - 专题型投影视图
4. “Agent 直接生成 markdown 文档”的旧叙事被彻底移除。
5. `execution-flow` 和 `subagent-architecture` 与 `SKILL.md` 使用同一套术语和流程。

---

## 三、任务拆解

### T1.1 重写 `SKILL.md` 的定位区

目标：

- 从“quick/deep 文档生成 skill”改成“runtime-first 项目认知编译器”

修改点：

1. 删除 quick/deep 的模式描述
2. 删除旧的 markdown 产物清单
3. 新增产品定位段：
   - 项目认知编译器
   - 单一标准模式
   - runtime truth first, docs as projection

完成标准：

- 开头部分不再出现 quick/deep 模式承诺
- `first` 的定位与全局方案一致

### T1.2 重写 `SKILL.md` 的产物契约区

目标：

- 明确新的正式产物体系

修改点：

1. 新增基础 canonical assets 清单
2. 新增条件型资产说明
3. 新增专题型文档说明
4. 删除旧的 quick / deep 文档数量说明

完成标准：

- `SKILL.md` 中出现的产物都能在全局方案中找到对应定位

### T1.3 重写 `SKILL.md` 的生成分层区

目标：

- 把生成模式从“Agent 产文档”改成“多层生成体系”

修改点：

1. 引入 4 层生成模式：
   - 脚本确定性生成
   - LLM 自动识别 + schema 固化
   - 脚本抽取 + LLM 受约束归纳
   - docs projection
2. 删除按 Agent 名称组织的文档生成描述

完成标准：

- 生成方式以 runtime asset 为单位，不再以 markdown 文档为单位

### T1.4 重写 `SKILL.md` 的消费契约区

目标：

- 明确下游 skill 如何消费 `first`

修改点：

1. 写入 `spec/design/task/code/review/verify/onboarding/orchestrate` 的消费方向
2. 强调 docs 不是主输入，runtime 才是主输入

完成标准：

- `SKILL.md` 可以直接作为 downstream 消费总契约引用

### T1.5 重写 `execution-flow.md`

目标：

- 让执行流程与新的 runtime-first 契约对齐

修改点：

1. 用新的 7 步执行流替换旧流程：
   - 证据收集
   - 项目识别
   - schema 固化
   - 资产生成
   - 条件资产判定
   - docs projection
   - index/health/context 输出
2. 删除旧 Agent 波次与 quick/deep 执行差异

完成标准：

- `execution-flow.md` 不再需要引用旧 quick/deep 派发逻辑

### T1.6 重写 `subagent-architecture.md`

目标：

- 让任务编排与新生成分层一致

修改点：

1. 用新的任务类型替代 Agent A/B/C：
   - 脚本抽取任务
   - LLM 识别任务
   - LLM 受约束归纳任务
   - 投影任务
   - 校验任务
2. 明确并发单位是“资产生成任务”
3. 增加失败降级与局部重试规则

完成标准：

- 并发模型不再围绕 markdown 文档命名

### T1.7 统一术语

目标：

- 保证 Batch 1 的 3 个文件使用同一套术语

统一术语包括：

- canonical runtime assets
- 条件型资产
- 专题型投影视图
- 单一标准模式
- runtime truth
- docs projection
- schema 固化

完成标准：

- 3 个文件中不出现互相矛盾的术语

---

## 四、删除项清单

Batch 1 中必须显式删除的旧内容包括：

1. quick / deep 模式说明
2. “生成 5-6 个 / 10-11 个文档”的表述
3. Agent A / A1 / A2 / A3 / B / C1 / C2 / D / E 的 markdown 产出承诺
4. “主线程直接生成 tech-stack.md” 等旧口径
5. 旧的并发波次与文档依赖链

---

## 五、输入依赖

Batch 1 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/skill-docs/*.md`

---

## 六、输出结果

Batch 1 应产出：

1. 新版 `SKILL.md`
2. 新版 `execution-flow.md`
3. 新版 `subagent-architecture.md`

以及一份验收结果记录，至少包含：

- 已删除的旧口径项
- 新增的正式契约项
- 待下一批次继续细化的内容

---

## 七、验收问题

Batch 1 完成后，必须回答：

1. `first` 是否还存在 quick/deep 双模式？
2. 是否还存在“直接生成 markdown 真相”的表述？
3. `SKILL.md`、`execution-flow.md`、`subagent-architecture.md` 是否使用了统一的资产模型？
4. 下游 skill 是否已经可以从 Batch 1 文档中看出消费方向？

只要其中任一问题答案是否定，Batch 1 就不算完成。

---

## 八、结论

Batch 1 的本质不是“改 3 个文档”，而是：

> **先把 first 的产品语言、流程语言、并发语言统一到 runtime-first 单一契约上。**

只有 Batch 1 完成，后续 Batch 2-7 才不会继续在旧世界观上返工。
