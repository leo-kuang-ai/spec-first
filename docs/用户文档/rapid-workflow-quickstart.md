# Rapid 新人上手精简版

## 1. 主流程（只看这个就能开工）

```mermaid
flowchart LR
    A[/rapid:create 新建需求/] --> B[填写 01_initial_prd.md]
    B --> C[/rapid:analysis/]
    C --> D[产出 02_refined_prd.md]
    D --> E[/rapid:design/]
    E --> F[产出 03_tech_design.md]
    F --> G[/rapid:task/]
    G --> H[产出 04_task_backlog.md]
    H --> I[/rapid:code/]
    I --> J[完成一个任务就打勾 - [x]]
```

## 2. 继续开发（中断后恢复）

```mermaid
flowchart TD
    A[/rapid:continue/] --> B{是否存在 .dev_process/.current}
    B -- 否 --> C[先执行 /rapid:load 选择需求]
    B -- 是 --> D[系统读取当前文档状态并推荐下一步命令]
```

## 3. 常见错误分支

```mermaid
flowchart TD
    A[/rapid:analysis/] --> A1{有 01_initial_prd.md 吗?}
    A1 -- 否 --> A2[先 create 或补 01]

    B[/rapid:design/] --> B1{有 02_refined_prd.md 吗?}
    B1 -- 否 --> B2[先执行 /rapid:analysis]

    C[/rapid:task/] --> C1{有 02 和 03 吗?}
    C1 -- 否 --> C2[先补 analysis/design]

    D[/rapid:code/] --> D1{有 04 且存在未完成任务吗?}
    D1 -- 否 --> D2[先执行 /rapid:task 或确认是否已全部完成]

    E[/rapid:load xxx/] --> E1{目录存在吗?}
    E1 -- 否 --> E2[先用 /rapid:list 查看可选需求目录]
```

## 4. 新人操作口诀

1. `create` 建目录，先写 `01`。
2. `analysis -> design -> task -> code` 按顺序走。
3. 中断了就 `continue`。
4. 切需求用 `load`，看不清就 `list`。
5. 变更需求用 `requirement-change`，再视影响重跑 `task`。
