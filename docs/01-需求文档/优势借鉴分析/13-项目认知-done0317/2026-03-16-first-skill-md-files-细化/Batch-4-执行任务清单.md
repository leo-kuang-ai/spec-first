---
title: First Skill MD 重构 Batch 4 执行任务清单
date: 2026-03-16
author: Codex
status: proposal
version: 1.0
parent: ./实施批次清单.md
---

# First Skill MD 重构 Batch 4 执行任务清单

> Batch 4 目标：重写 `docs/first` 的基础 canonical docs，使它们成为 runtime-first 下稳定、可重建、可消费的第一层项目级认知视图。

---

## 一、范围

Batch 4 覆盖以下 12 个基础/派生文档：

1. `docs/first/README.md`
2. `docs/first/summary.md`
3. `docs/first/role-views.md`
4. `docs/first/stage-views.md`
5. `docs/first/steering.md`
6. `docs/first/conventions.md`
7. `docs/first/critical-flows.md`
8. `docs/first/change-map.md`
9. `docs/first/entry-guide.md`
10. `docs/first/reboot-guide.md`
11. `docs/first/common-playbooks.md`
12. `docs/first/known-risks-and-traps.md`

这些文档构成 `first` 的基础认知层。

---

## 二、目标

Batch 4 完成后，文档层面必须达成以下结果：

1. 基础 canonical docs 全部具备明确 runtime 来源。
2. `README.md` 成为统一入口，而不是兼容性索引页。
3. 基础认知、导航、风险、playbook 四类内容形成完整第一层背景输入。
4. 这些文档可以在删除后仅依靠 runtime 重新投影恢复。

---

## 三、任务拆解

### T4.1 重写 `README.md`

目标：

- 让 `README.md` 成为 first 的正式入口页

修改点：

1. 增加项目摘要入口
2. 增加正式资产导航
3. 增加专题文档导航
4. 增加条件型资产状态说明
5. 删除 legacy / quick / deep 的历史提示

完成标准：

- `README.md` 可以作为新手进入项目认知层的第一入口

### T4.2 重写 `summary.md`

目标：

- 提供稳定项目摘要视图

修改点：

1. 明确“项目是什么”
2. 主要能力
3. 主要入口
4. 核心风险
5. 证据摘要

完成标准：

- 全部内容只来自 `summary.json`

### T4.3 重写 `role-views.md`

目标：

- 提供不同角色的最小阅读路径

修改点：

1. 开发者视角
2. 产品视角
3. 测试视角
4. 架构视角

完成标准：

- 角色路径与 `role-views.json` 保持一致

### T4.4 重写 `stage-views.md`

目标：

- 提供不同阶段的背景输入切片

修改点：

1. spec 阶段读什么
2. design 阶段读什么
3. task 阶段读什么
4. code / review / verify 阶段读什么

完成标准：

- 与下游 skill 消费契约一致

### T4.5 重写 `steering.md`

目标：

- 提供项目导向、技术约束、结构边界说明

修改点：

1. 产品导向
2. 技术栈与技术边界
3. 结构边界与入口规则
4. 权威规则与冲突优先级

完成标准：

- 只从 `steering.json` 投影

### T4.6 重写 `conventions.md`

目标：

- 提供项目规范总览

修改点：

1. 编码规范
2. 测试规范
3. 配置规范
4. 协作与交付规范

完成标准：

- 与后续 `development-guidelines.md` 不重复冲突

### T4.7 重写 `critical-flows.md`

目标：

- 提供关键流程与高风险路径说明

修改点：

1. 核心业务链路
2. 高风险环节
3. 不可轻易破坏行为

完成标准：

- 所有关键流都可回指 runtime 证据

### T4.8 重写 `change-map.md`

目标：

- 提供需求变更导航图

修改点：

1. 常见改动入口
2. 影响面
3. 热点模块
4. 验证提示

完成标准：

- 能直接服务老需求迭代定位

### T4.9 重写 `entry-guide.md`

目标：

- 提供新手开发最小进入路径

修改点：

1. 首先阅读什么
2. 然后进入哪里
3. 常见改动从哪开始

完成标准：

- 能直接服务 onboarding / task / code

### T4.10 重写 `reboot-guide.md`

目标：

- 提供会话恢复路径

修改点：

1. 恢复顺序
2. 继续推进建议
3. 常见中断点

完成标准：

- 会话中断后可快速恢复

### T4.11 重写 `common-playbooks.md`

目标：

- 提供典型改动剧本

修改点：

1. 新增/修改接口
2. 新增/修改页面
3. 修改配置与规则
4. 修改数据结构

完成标准：

- 能直接指导老需求迭代

### T4.12 重写 `known-risks-and-traps.md`

目标：

- 提供风险与陷阱汇总

修改点：

1. 高风险链路
2. 常见误改点
3. 恢复陷阱
4. 回归盲点

完成标准：

- 与 `critical-flows` / `change-map` / `reboot-guide` 联动

---

## 四、删除项清单

Batch 4 中必须显式删除的旧内容包括：

1. 任何 legacy / quick / deep 兼容提示
2. 任何“文档自身就是真源”的表述
3. 任何未声明 runtime 来源的章节

---

## 五、输入依赖

Batch 4 执行前应参考以下文档：

1. `2026-03-16-first-runtime-first-global-design.md`
2. `2026-03-16-first-skill-md-files-重构改造清单.md`
3. `2026-03-16-first-skill-md-files-细化/docs-first/*.md`
4. `2026-03-16-first-skill-md-files-细化/Batch-1-执行任务清单.md`
5. `2026-03-16-first-skill-md-files-细化/Batch-2-执行任务清单.md`

---

## 六、输出结果

Batch 4 应产出：

1. 新版 12 个基础 canonical docs 的投影契约
2. 一份验收记录，至少说明：
   - 每个文档的 runtime 来源
   - 每个文档的章节是否稳定
   - 是否可删除后重建

---

## 七、验收问题

Batch 4 完成后，必须回答：

1. 这 12 个 docs 是否都可以从 runtime 重建？
2. `README.md` 是否已经成为正式入口？
3. 是否已经形成“摘要 + 导航 + 风险 + playbook”的基础认知层？
4. 是否还存在无 runtime 来源的章节？

只要其中任一问题答案是否定，Batch 4 就不算完成。

---

## 八、结论

Batch 4 的本质不是“重写 12 篇文档”，而是：

> **建立 first 的第一层正式项目级认知视图，让新手、新会话、下游 skill 都能先从这层拿到稳定背景输入。**
