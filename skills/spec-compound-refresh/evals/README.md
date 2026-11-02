# Refresh评测边界

现有`non-solutions-scope-gated`脚本仅检查回复词语，不能证明安全删除、因果知识质量或发布恢复。该历史case保留其范围判断用途，不用于这些更强结论。

`fixtures/publication-counterexamples.json`补齐误删与partial恢复的具体文件现场和独立判据。未来行为评测须在隔离临时仓库实例化文件，为原件建立commit或私有恢复副本，记录hash；只把原件、动作、失败事实及并发修改交给被测模型，把rubric保留给独立judge。判定必须读取最终文件，检查独有知识与引用目标保留，并把操作日志中的成功/失败与最终报告逐路径对账。正确的措辞不替代文件状态。

`eval.yaml`现挂载`publication-preserve`、`publication-partial`、`publication-recover`三例。隔离fixture以`prepare-eval.cjs`建立真实Git基线；独立生成judge读取文件、HEAD/index与最终JSON，不仅检查回复词语。恢复任务明确要求逐字保留原指导和catalog其余字节，因此判据比较这些确定事实，不把精确匹配外推为通用语义评分。判据源码在`scripts/evals/knowledge-publication-checks.cjs`，由既有`build-outcome-judges.cjs`生成单文件脚本，不能直接修改生成文件。

本地`tests/unit/knowledge-publication-judges.test.js`用正确结果和故意破坏结果校准判据，验证误删、独有内容丢失、断引用、人工条目丢失、报告错配、HEAD/index改变及链接替代能被拒绝。测试手工构造最终状态；没有运行模型或真实故障注入流程，不证明发布操作顺序、原子性或模型知识判断。runner配置可加载不等于行为已通过，真实模型验收仍未完成。
