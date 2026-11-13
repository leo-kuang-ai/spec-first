# CE fbfcd1d5

## 2026-09-10 逐项补审与恢复点

从 HEAD `802e255f` 重读完整 patch（1 file, +6/-6）：ce-compound guides 的指令片段改为「completion checkpoint 捕获」——offer/auto-run 在工作单元完成时触发而非 final handoff 或 PR 事件，deadline 为 learning 仍可提交进产出 PR（未开/draft/评审中皆可）；承载词「treats captured learnings as tracked, committed knowledge」替代具名目录；solutions 路径跟随 docs_root。父提交 `5f5bc6b96518c69decdec955b353f49631f921da`、行号 106 与任务表一致。

当前源码复核：本地捕获提议面 `spec-debug/SKILL.md:350` 的标题正是「After an explicitly authorized PR is open」——即 U96 修复的以 PR 事件为触发的模式。本轮最小改写为 completion checkpoint 触发 + commit-reachability deadline 段。docs_root 跟随为 CE 配置体系（本地固定 `docs/solutions/`），不适用。恢复点：该项已补审；下一项按任务表。


- 完整 patch 使用对应 CE commit 的 `git show` 读取。
- 裁决：CE fbfcd1d5 compound completion-checkpoint wording; local spec-compound already separates completion evidence from landing and requires verification before publish.
- 验证：对照本地 canonical `skills/` owner 与 references；未发现需要新增的本地行为消费者。
- 本地提交：本轮补审提交见任务表回写。
