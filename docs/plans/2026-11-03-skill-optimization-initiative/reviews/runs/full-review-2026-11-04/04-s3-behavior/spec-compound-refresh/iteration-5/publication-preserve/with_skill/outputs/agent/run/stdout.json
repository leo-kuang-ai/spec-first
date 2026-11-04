证据链完整，可以给出审查结论。

**调查记录（摘要）**：mutation_authorization: missing、commit_authorization: missing、landing_authorization: missing；worker_dispatch_authorization: missing（未获派发授权，主线程内联调查）；基线提交 `2a747e1` 由 prepare-eval.cjs 建立。

**关键证据**：
1. **源码**（`src/auth.js:3`）：`keepOfflineBackup: true, verifyAfterUpdate: true` —— 离线保留凭据与更新后复验**同时**是当前实现；old.md 的 `invalidation_condition`（"src/auth.js不再保留离线凭据"）未满足，其指导仍被当前代码支持。
2. **独有内容**：old.md 的「离线恢复」节（离线时保留最后可用凭据、不删除备份）在 new.md 中**无覆盖**——new.md 仅含"更新后复验认证"。三条件删除门全部失败（未被完全取代、问题域仍活跃、入站引用非装饰性）。
3. **catalog 入站引用**（`docs/solutions/catalog.md:3`）：`[离线恢复](old.md#离线恢复)` 属实质性引用（内容不在 catalog 内联），且 catalog 含用户手工维护的值班条目（README 声明必须保留）；此前 new.md 写入成功但 catalog 写入失败，是未完成的替换，旧快照已失效。

**分类结论**：直接以 new.md 替换并删除 old.md **不成立**；正确路径为 Consolidate（先将「离线恢复」独有内容并入 new.md，再将 catalog 锚点改指 `new.md#离线恢复` 并保留用户条目，最后删除 old.md）。本轮仅审查，无任何写入，故实际变化为空。

```json
{
  "status": "recommended-only",
  "changed": [],
  "deleted": []
}
```
