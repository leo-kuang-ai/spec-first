# 2026-03-07 19-feature-current skill 审查与优化建议

## 1. skill 要解决什么问题

`19-feature-current` 解决的是：

1. 查询当前活跃 Feature
2. 展示它的标题和阶段信息

一句话：

> `19-feature-current` 解决“我现在正处于哪个 Feature 上下文”。 

## 2. 当前实现是否合理

整体判断：功能合理，而且是高频查询动作。

## 3. 当前主要问题

同样是命令面问题：

- 它和 `feature-list / feature-switch` 本就属于同一个命令家族
- 独立存在的收益低于统一组织的收益

## 4. 推荐优化方向

建议并入：

- `feature current`

## 5. 当前审查结论

- 职责定位：正确
- 当前合理性：高
- 主要问题：独立入口价值偏低
- 最佳优化方向：并入 `feature` 命令族

一句话结论：

> `19-feature-current` 很实用，但更适合成为 `feature` 命令族里的默认查询动作。
