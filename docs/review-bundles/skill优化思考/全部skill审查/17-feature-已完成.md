# 17-feature 审查

## 角色定位

- Feature 管理薄壳；统一承接 list/current/switch 三类操作。

## 现状证据

- `skills/spec-first/17-feature/SKILL.md:3`、`skills/spec-first/17-feature/SKILL.md:11` 已把技能范围收得很窄。
- 当前没有背景治理字段，这与其“薄命令入口”定位一致。

## 结论

- 该 skill 的目标不是消费背景，而是管理当前 Feature 指针；当前简洁设计合理。

## 主要优化点

- ~~P2（可选）：在 `feature current` 输出中追加只读 `background_input_status`，帮助用户切换 Feature 后快速判断上下文健康度。~~ ✅ **无需修改** — feature 是薄壳工具，如需查看背景健康度应使用 status 或 doctor

## 完成总结

feature skill 的设计已完整：
- 职责明确：管理 Feature 指针（list/current/switch）
- 保持薄壳定位，不消费背景数据
- 当前简洁设计符合单一职责原则

