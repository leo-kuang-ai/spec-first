# feature 子命令

- `list`：`/spec-first:feature list`
- `current`：`/spec-first:feature current`
- `switch <featureId>`：`/spec-first:feature switch <featureId>`

说明：
- 交互入口以 `/spec-first:feature ...` 为准
- 执行层对应 `spec-first feature ...`
- `switch` 底层执行时需要补 `--yes`
- `switch` 的副作用是更新 `.spec-first/current`
- 成功切换后应建议立即执行 `/spec-first:catchup`
- 失败时不得改写 current 指针
