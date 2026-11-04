路由判定完成。对照 route map 核对如下：

- **排除 Direct Lane**：请求中明确存在未定的构建目标、目标用户与成功/验收标准——这正是 Direct Lane 的硬排除条件。
- **排除 `spec-ideate`**：用户已有具体方向（站会进展汇总工具），不是"尚无方向、需比较候选"的 0-1 阶段。
- **排除 `spec-prd` / `spec-plan`**：PRD 需要先有问题框架；用户连 WHAT 都未定，谈不上 HOW。
- **命中 `spec-brainstorm`**：route map 原文 "Have an idea but problem frame, users, success criteria, or requirements remain unsettled"——你未定的三项（做多大 = 范围、给谁用 = 用户、成功标准）与该入口触发条件逐项对应。

```text
Recommended entrypoint: spec-brainstorm
Reason: 已有想法但问题框架、目标用户、成功标准均未定，正是该入口的定义性触发条件
Next action: 运行 spec-brainstorm，把你那句描述连同三个未定项作为原始输入带入
```

判定置信度高，无需追问路由问题。按约定我在此停止——是否进入 `spec-brainstorm`（沙箱内不实际安装执行），等你确认。
