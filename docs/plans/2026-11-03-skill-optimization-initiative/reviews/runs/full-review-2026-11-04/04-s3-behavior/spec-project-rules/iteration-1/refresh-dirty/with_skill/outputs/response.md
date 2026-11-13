校验完成。dry-run 报告如下：

## 保鲜检查结果（dry-run，未写入任何文件）

**结论：知识库仍然准确，refresh_noop —— 无需更新。**

### 基线与脏检测
- frontmatter `source_commit: a73c808` 可解析；HEAD 为 `b782ec7`，工作区有 1 个未提交改动 → freshness = `dirty`，`dirty_refs = [apps/web/src/order.ts]`，按规程只重验该文件涉及的条目。

### 脏条目重验（2 条，均通过）
| 条目 | 重验结果 |
|---|---|
| 复用：HTTP 客户端住址 `packages/api-client/index.ts` | `order.ts:1` 仍 `import { createClient } from '@shop/api-client'`；住址文件存在且导出 `createClient`（`packages/api-client/index.ts:2`）→ 仍成立 |
| 约定：HTTP 必须走 createClient、禁直接 fetch/axios | `order.ts` 的脏改动仅为追加 `export const TOUCHED = 1;`（`apps/web/src/order.ts:4`），与 HTTP 调用无关，仍走 `createClient` → 无实质影响 |

### 其余检查
- **source refs 存活**：5/5 路径全部存在（README.md、packages/api-client/index.ts、order.ts、cart.ts、stats.ts）。
- **依赖方向 verify**：0 违规边。实测边 admin→api-client、web→api-client、web→ui，全部为 apps→packages 合法方向，无 admin→web 边；条目动词规范。
- **verify 报告的 1 条 missing_ref 裁决为误报**：脚本从 `` 住址 `packages/api-client/index.ts` `` 提取 ref 时把闭反引号混入路径（得到 ``packages/api-client/index.ts` ``），实际文件存在。属脚本解析瑕疵，不是知识库失效。

### Closeout
- **scope**：`--dry-run`（"检查还准不准" → 只报告不写）
- **确认环节**：无写入发生，未触发 `headless_default_write` / `agents_embed_skipped`
- **limitations**：npm workspaces 无路径别名（alias_discovery: not-applicable）；verify 的 ref 提取存在反引号混入瑕疵，本次已人工核实该条 finding 为误报

控制权交还 caller。
