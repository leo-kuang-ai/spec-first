# FSA3 第二轮审查执行方案

- 日期：2026-09-16；run_id：2026-09-16-fsa3。
- 主工作流：spec-code-review，report-only；由当前 Agent 串行执行，独立 reviewer/fresh-source dispatch 未执行。
- 基准方案：docs/validation/2026-09-13-full-system-audit-plan-v2.md，U1–U11。
- 本轮调整：被审输入为 HEAD + 当前 tracked/untracked 非 ignored 文件，而非虚构修复 commit。manifest 绑定完整逐文件 SHA256、文件模式和 symlink；node_modules 通过只读使用约定复用主工作区依赖。隔离 HOME/TMPDIR/npm cache；不得修改共享 node_modules。
- 先在 detached worktree 运行；产物写同级 evidence；只在收口后复制本轮报告、方案与证据到主仓。
- 不修源代码，不更新真实宿主、不启动真实 provider/模型调用、不提交/推送。

## 执行与验收

1. U1 冻结 38 Skill、动态宿主、全文件基线；执行后逐文件复核 source 无变化。日志先经有界凭证模式过滤，canary 验证；最终全部交付文本再扫描。脱敏仅保护明确模式，不声称通用 secret 防泄漏。
2. U2 重跑 typecheck、entrypoint lint、shared refs、instruction sync check、npm test、build dry-run、临时 prefix 安装矩阵。失败保留原日志，主测试 fail-fast 时单独补跑后续 suites。37 eval validate/list-cases 是配置检查，不运行模型。
3. U3 全八宿主投射与生命周期由现有 tests + 安装矩阵提供确定性证据，逐层区分 projection/loader/invocation。
4. U9 覆盖承诺扩展至全部 38 Skill 的入口、主要分支、一个负例/停止路径、输出 consumer；核心 16 与第一轮修改的 gate owner 深读关键条件引用/脚本，其余包有界抽样。每包记录实际读取文件、包内文件分母、未读闭包；闭包不完整一律 degraded，不把入口阅读称为全分支通过。目标是 38 包最低语义覆盖，不宣称遍历所有深层文件。
5. U4/U5 对 mutation/verification/source-runtime/handoff/knowledge 五类 gate 与 16 核心链路逐项检查 producer/consumer 一致性；先完成包内阅读再收口 seam 结论。脚本 facts 不代替语义判断。
6. U7 核对第一轮修复后的 shared contracts、历史审计/CE freshness、README/catalog/registry 关键声明。
7. U10 基于本地证据重审用户/anti-persona、JTBD、wedge、activation/retention、metrics/反指标和 segment 边界，所有收益仍按 hypothesis；不开展未授权外部研究。
8. U6 仅在关键安全前置成立时运行额外受控 journey；既有 fixture 不重标为新增 journey。U8 的真实宿主/field/comparator 为 not-run；注明原因。
9. U11 每条命令记录退出码、日志、source identity；finding 记录 source 行、可复现后果、owner、修复方向与复验。五态汇总、覆盖缺口、外部待证分别列出；未满足原 v2 完整覆盖时 lifecycle 保持 incomplete。

## 失败与停止

- source 变化：停止结论收口并重新冻结；不把自身报告写入导致的变化当业务源码修复。
- 测试失败：审查继续只读，保存失败，不自动改实现/测试来变绿。
- 同上下文、无真实模型/宿主或深层闭包未遍历：显式降级。已完成局部证据不因此丢弃，也不被提升为整体完成。
- 最终复核交付引用、状态、log hash、脱敏及源文件初末一致性；报告附修复顺序。
