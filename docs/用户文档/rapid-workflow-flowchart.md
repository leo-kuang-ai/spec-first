# Rapid 工作流流程图文档

## 1. 核心逻辑概述

Rapid 是一个“文档状态机”工作流：通过 `.dev_process/.current` 指向当前需求目录，再按阶段产出 `01~04` 文档，驱动后续命令执行。

```mermaid
flowchart LR
    A[开始] --> B[/rapid:create 或 /rapid:load 或 /rapid:list]
    B --> C[设置 .dev_process/.current]
    C --> D[01_initial_prd.md]
    D --> E[/rapid:analysis]
    E --> F[02_refined_prd.md]
    F --> G[/rapid:design]
    G --> H[03_tech_design.md]
    H --> I[/rapid:task]
    I --> J[04_task_backlog.md]
    J --> K[/rapid:code]
    K --> L[逐项标记任务为 - [x]]
    C --> M[/rapid:continue 恢复上下文并推荐下一步]
    F --> N[/rapid:requirement-change 融合变更]
    H --> N
    N --> I
```

## 2. 命令前置条件网关

```mermaid
flowchart TD
    A[/rapid:analysis/] --> A1{01_initial_prd.md 存在?}
    A1 -- 否 --> AX[报错: 先 create 或补 01]
    A1 -- 是 --> A2[调用 requirement-analysis]
    A2 --> A3[产出 02_refined_prd.md]

    B[/rapid:design/] --> B1{02_refined_prd.md 存在?}
    B1 -- 否 --> BX[报错: 先 analysis]
    B1 -- 是 --> B2[调用 technical-design]
    B2 --> B3[产出 03_tech_design.md]

    C[/rapid:task/] --> C1{02 + 03 都存在?}
    C1 -- 否 --> CX[报错: 先 analysis/design]
    C1 -- 是 --> C2[调用 coding-task]
    C2 --> C3[产出 04_task_backlog.md]

    D[/rapid:code/] --> D1{04 存在且有未完成任务?}
    D1 -- 否 --> DX[报错: 先 task 或任务已完结]
    D1 -- 是 --> D2[执行首个未完成任务并打勾]
```

## 3. /rapid:continue 恢复判定流

```mermaid
flowchart TD
    A[/rapid:continue/] --> B{.dev_process/.current 存在且非空?}
    B -- 否 --> BX[提示先 /rapid:load]
    B -- 是 --> C[读取当前需求目录文档]
    C --> D{文档状态}
    D -->|仅 01| E[建议 /rapid:analysis]
    D -->|有 02| F[建议 /rapid:design]
    D -->|有 03| G[建议 /rapid:task]
    D -->|有 04 且有未完成| H[建议 /rapid:code]
    D -->|04 全完成| I[提示需求开发完成]
```

## 4. /rapid:code 内部执行流（结合 coding-task 规则）

```mermaid
flowchart TD
    A[读取 04_task_backlog.md] --> B[定位第一个 - [ ] 任务]
    B --> C[参考 02 + 03 实施]
    C --> D[代码验证: 语法/导入/Lint/类型]
    D --> E[运行测试]
    E --> F[代码审查: 准确性/性能/安全/可维护性]
    F --> G[任务改为 - [x]]
    G --> H{是否继续下一个任务?}
    H -- 是 --> B
    H -- 否 --> I[结束当前轮]
```

## 5. 需求变更流

```mermaid
flowchart LR
    A[/rapid:requirement-change + 变更描述/] --> B{02_refined_prd.md 存在?}
    B -- 否 --> BX[报错: 先 load 或补齐文档]
    B -- 是 --> C[读取 02，若有则读取 03]
    C --> D[将变更融合进 02 对应章节]
    D --> E{影响技术方案?}
    E -- 是 --> F[同步更新 03]
    E -- 否 --> G[跳过 03 更新]
    F --> H{影响任务列表?}
    G --> H
    H -- 是 --> I[提示执行 /rapid:task 重建任务]
    H -- 否 --> J[结束]
```

## 6. 实现观察

`/rapid:task` 文档中写的是“调用 coding-task skill 进行任务拆解”，但 `coding-task` skill 主体描述偏向“任务执行与审查闭环”。建议后续统一“拆解”和“执行”的职责边界。

## 7. 依据文件

- `/Users/kuang/xiaobu/rapid/commands/rapid/README.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/create.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/load.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/analysis.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/design.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/task.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/code.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/continue.md`
- `/Users/kuang/xiaobu/rapid/commands/rapid/requirement-change.md`
- `/Users/kuang/xiaobu/rapid/skills/requirement-analysis/SKILL.md`
- `/Users/kuang/xiaobu/rapid/skills/technical-design/SKILL.md`
- `/Users/kuang/xiaobu/rapid/skills/coding-task/SKILL.md`
