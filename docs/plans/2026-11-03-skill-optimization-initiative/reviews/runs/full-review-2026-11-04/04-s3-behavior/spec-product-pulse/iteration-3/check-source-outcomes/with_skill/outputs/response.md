报告已保存，全程仅读取本地 export，未调用任何 provider，未写 `.spec-first/config.local.yaml`、未建 schedule（Phase 3 检查：`pulse_schedule: manual` 已在档，按规则不再重复提供 scheduling）。

**Headlines（原文）**
- Revenue for the exported window: 1200 (payments-export, confirmed-value); no prior-window export exists, so no delta.
- active_users is missing, not zero: analytics-export returned permission-denied for the same window.
- Report built from supplied exports only; no live connectors were queried.

**Top Followup**：Restore analytics-export access for active_users: the provider denied permission for 2026-10-28, leaving engagement unmeasured.

**保存路径**：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-935121194/docs/pulse-reports/2026-11-05_09-54.md`

```json
{
  "metrics": [
    {"name": "revenue", "source": "payments-export", "state": "confirmed-value", "value": 1200},
    {"name": "active_users", "source": "analytics-export", "state": "permission-denied", "value": null}
  ],
  "artifact_path": "docs/pulse-reports/2026-11-05_09-54.md"
}
```

要点说明：
- 窗口严格采用两份 export 记录的 `2026-10-28T00:00:00Z/2026-10-29T00:00:00Z`（export 固定窗口，未按 now 推导，也未经 15m buffer 改写）。
- `active_users` 的 `failed/permission-denied` 按 run.md 收据分类映射为 `permission-denied`（非 `confirmed-zero`、非 `no data`），在报告 Usage 与 source-status 行均保留 reason_code 与 limitation。
- `revenue` 无上一等长窗口数据，按模板规则省略 delta 而非编造；无 tracing 源 → 按模板 Variation 省略 System performance 段并在 source-status 记 `not-configured`；策略文件缺失仅记录为 Followup，未触发重新 setup。
