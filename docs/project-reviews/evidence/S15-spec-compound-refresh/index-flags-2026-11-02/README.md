# S15 索引标志漏检补修

基线：019509f9a。仅修改固定fixture判据及其生成脚本，不修改Skill或真实宿主runtime。

新增反例分别执行 `git update-index --assume-unchanged` 与 `--skip-worktree`。原判据仅检查 `ls-files --stage`，未发现这两种索引状态变化，新增测试均失败（before.txt，原18项通过）。现增加 `ls-files -v -z` 与固定文件集的普通H状态比较；生成三个judge后，原反例及回归通过：S15 20项、S08 12项（regression.txt）。生成器check无漂移。

独立只读审查者 `/root/s04_source_review` fresh-source复核passed：H/h/S区分符合Git语义，三个生成judge与源一致，两反例只修改标志，正例逻辑未变。审查者没有重跑测试或调用模型。

## Debug Summary / Post-Fix Quality

- 根因：stage清单不包含assume-unchanged与skip-worktree标志，固定索引不变的声明超出旧判据覆盖面。
- Scope：相对019509f9a的本次修复文件；保留无关未跟踪目录。
- Simplify：新增两行共享检查，无额外抽象。
- Review：独立只读源码复核passed。
- Re-verification：原反例、S15/S08回归32项通过；生成器check通过。
- verification_run_summary_ref：`.spec-first/workflows/spec-debug/spec-first/s15-index-flags-20261102/verification-run-summary.json`，本目录保存副本及输入。
- honest_closeout_verdict：verified / all-claims-consistent，仅覆盖已执行检查。
- claim_limitations：固定fixture最终状态，不证明模型行为、操作顺序、真实故障恢复或整个Git元数据不变。真实runner布局尚未验证，保持原准入缺口。
- Commit / Landing：本地提交授权沿用；提交由本文件Git历史追溯，未push/建PR。

无需猜测未来runner文件白名单或扩展通用fixture框架。现有可执行资产与校准已补齐；后续行为验收需真实评测范围/费用授权，S12另需平台能力与目标项目，整体goal仍未完成。
