自检通过：marker 恰一对且独占一行、frontmatter 位于文件首行、全文 30 行（≤150，未来嵌入可走 native import）。

---

## Closeout

**产物**：`docs/architecture.md`（新建，四小节 14 条：归属 4 / 依赖方向 3 / 复用 3 / 约定 4；confirmed 6 条、inferred 8 条），`source_commit=7823c88`。

**Scope**：`full`（首次建库，无 marker）。

**确认环节记录**：
- `headless_default_write`：自动化 runner 无交互确认原语 → preview 后直接写入知识库
- `agents_embed_skipped`：仓库无 AGENTS.md/CLAUDE.md，首次嵌入须交互确认 → headless 下跳过，未创建入口文件

**Limitations**：
1. **布局不受支持（脚本 exit 2）**：无 npm workspaces、无 Gradle → 无依赖图；依赖边改由全仓 import 检索式补齐（7 条边，检索式可复现），`--verify` 在 degraded mode 下不适用
2. **抽样披露**：payload 抽样 13/22；`.claude` 模块 1 文件属禁止目标未挖 → 实际业务抽样 **12/21**（`app/` 4/4 全量、`lib/` 8/17）。未入样的 9 个 lib 文件中 `service.ts`、`gateway.ts`、`format.ts` 的导出与 import 行已经全仓检索式完整覆盖（非全文阅读），`extra*.ts` 系列为哑常量噪音
3. churn 可用但 fixture 单 commit 无区分度；skipped_dirs 均未命中本仓实际目录
4. 形态为单端（`app/`）+ 共享层（`lib/`）：四小节齐备，跨端对齐维度不适用（单端）
5. 补嵌入建议：在交互会话中以“刷新 AGENTS.md/CLAUDE.md managed block（首次嵌入）”继续，内嵌规则 top 候选已有——fetch 禁令、app 组装层、lib→app 禁止反向依赖、service→audit 隐式串联

**核心边界结论**：分层链 `app → lib/core → lib/net`（`lib/util` 为叶子层）；`lib/net/index.ts` 的 `request` 是唯一 fetch 出口（全仓 0 违规）；README 两条明文约定均与代码现状一致，无冲突条目。

控制权交还 caller。
