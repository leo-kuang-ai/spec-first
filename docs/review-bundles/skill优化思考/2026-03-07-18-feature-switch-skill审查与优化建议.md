# 2026-03-07 18-feature-switch skill 审查与优化建议

## 1. skill 要解决什么问题

`18-feature-switch` 解决的是：

1. 更新当前活跃 Feature 指针
2. 帮用户把后续上下文切到目标 Feature

一句话：

> `18-feature-switch` 解决“把当前工作上下文切到另一个 Feature”。 

## 2. 当前实现是否合理

整体判断：必要，而且切换前确认也是合理的。

## 3. 当前主要问题

它的主要问题同样不是内部逻辑，而是命令组织：

- 它和 `feature-list / feature-current` 本来就是同一类功能

## 4. 推荐优化方向

建议并入：

- `feature switch`

并继续保留切换前确认。

## 5. 当前审查结论

- 职责定位：正确
- 当前合理性：高
- 主要问题：应归入 feature 家族
- 最佳优化方向：并入 `feature` 命令族

一句话结论：

> `18-feature-switch` 是必要动作，但不必作为单独一级心智入口存在。
