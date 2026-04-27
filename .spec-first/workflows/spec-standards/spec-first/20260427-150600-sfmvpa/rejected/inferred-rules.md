## 推断但被拒候选项

### language-policy

- 原因: 语言设置是由 `spec-first init --lang` 管理的 per-project 配置选项，不是可普适强制执行的规则。
- 处置: 本轮拒绝。如项目负责人需要正式化，可作为 `source=manual` 的自定义规范添加。

### prose-eval-boundary

- 原因: 不得通过同会话 typed-agent 调用来验证 prose 变更的规则，已被 `governance` RULE-GOVERNANCE-001 完整覆盖（不得把生成产物当源码修改）。单独抽取会造成双真相源。
- 处置: 拒绝。参考: `docs/specs/governance.md`。
