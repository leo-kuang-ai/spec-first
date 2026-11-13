核对完成。所有证据齐备：README 所述与现场一致 —— new.md 为已写入但未覆盖离线恢复的后继候选；catalog 同时含指向 `old.md#离线恢复` 的旧条目（锚点在 old.md:15 仍解析，但属指向待删路径的必修链接）和必须保留的用户人工条目；`src/auth.js` 仍保留离线备份（`keepOfflineBackup: true`），old.md 的离线恢复内容仍是有效且被实质性引用的知识，其后继覆盖缺口阻断删除。本轮零写入、零删除；基线提交已使旧内容具备 Git 可恢复性。

```json
{
  "status": "partial — 先前部分发布属实：new.md 已写入但未覆盖离线恢复（src/auth.js 仍保留离线备份）；catalog.md 仍含指向 old.md#离线恢复 的旧条目及必须保留的用户人工条目，旧快照已失效不得回放；本轮只读核对，未发布、未删除、无变更",
  "published_before_run": ["docs/solutions/new.md"],
  "changed": [],
  "deleted": [],
  "pending": ["docs/solutions/catalog.md", "docs/solutions/old.md"]
}
```
