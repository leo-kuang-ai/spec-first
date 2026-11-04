`Review failed: flag-conflict-or-unsupported` — 冲突的 flag：`mutation:apply-fixes`、`mutation:report-only`

按 skill 的 Phase 0 规则（`references/modes.md`）：`mutation:*` 是精确 token 契约，同一次调用中出现多个 `mutation:*` token 时必须立即失败关闭（fail closed），不猜测优先级、不把 token 当作路径，也不读取文档或分派 reviewer。本次调用同时携带了 `mutation:apply-fixes` 和 `mutation:report-only` 两个互斥的 mutation token，因此在读取 `docs/plans/2026-09-01-monthly-summary-plan.md` 之前即终止。

如需重跑，请二选一：

- 只读评审（零写入）：`mode:headless mutation:report-only docs/plans/2026-09-01-monthly-summary-plan.md`（或省略 mutation token，默认即 report-only）
- 授权修复：`mode:headless mutation:apply-fixes docs/plans/2026-09-01-monthly-summary-plan.md`
