按 spec-write-skill 的分支合同处理了这条请求，结论：**不能照做，且目前无东西可改**。两个硬事实：

1. **目标文件不存在**：本仓库里没有 `.agents/` 目录，全仓唯一的 `SKILL.md` 是 `.claude/skills/spec-write-skill/SKILL.md`（即本 skill 自身）。spec-polish 在这里既没有 source 也没有 mirror。
2. **该路径类型禁止手改**：`.agents/skills/` 属于 generator 投影的 runtime mirror 目录（同类还有 `.claude/`、`.codex/`、`.cursor/` 等）。合同要求改 canonical source 后再 init/sync 重新投影；直接改 mirror 会被下次 sync 覆盖，还会造成 source 与 runtime 漂移。

Closeout：`base_operation=null` / `effect=not-entered` / `modifier=none` / `layer_result=refuse-generated-runtime-patch`；零写入，未做 inventory/preview（近邻分支路由后即停，mirror 维护归 runtime-maintenance）。

下一步，给我任一项即可继续：

- spec-polish 的 **canonical source 在别的 repo/目录** → 给我 source 路径 + 要删的那一段（标题或起止行），我走 source-first：改 source → 同步投影。
- 它**还没安装进来** → 先告诉我它从哪来（哪个 repo/工具），装好并确认 source 后再改。
