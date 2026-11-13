调查完成。证据链汇总：

**源码核查**（`src/auth.js` 为当前实现）：`keepOfflineBackup: true` 且注释明确"离线恢复依赖最后可用凭据；更新后仍需复验认证"——离线保留行为仍存在，old.md 的 `invalidation_condition`（"src/auth.js不再保留离线凭据时复查"）**未触发**，old.md 并未失效。

**独有内容**：old.md 的"离线恢复"节（离线时保留最后可用凭据，不删除备份）为 new.md 所缺——new.md 仅覆盖"刷新+复验"。README 亦确认"new.md 是尚未覆盖离线恢复的候选"，且"这不是一次已完成的替换"（此前 catalog 写入失败）。

**入站引用**：`catalog.md` 中 `[离线恢复](old.md#离线恢复)` 锚定 old.md 独有小节，catalog 内无内联替代内容，属**实质性引用**；catalog 还含必须保留的用户手工值班条目。

**结论**：三条件删除门全部不满足（未完全被覆盖、问题域仍活跃、入站引用非装饰性）——直接"用 new.md 替换并删除 old.md"不成立。正确分类为 **Consolidate** 候选（先将离线恢复节并入 new.md、改写 catalog 链接，再删 old.md）。本轮仅审查、未获变更授权（`mutation_authorization: missing`），未修改任何文件。

```json
{
  "status": "recommended-only",
  "changed": [],
  "deleted": []
}
```
