# U0 App Assurance 盲审评分 Rubric

本 rubric 只用于比较两个匿名语义输出，不用于证明公共产品效果。评分者只能看到 `variant-x` / `variant-y`，不能看到 direct、IR、prompt 名称或生成过程。

每项按 0–3 分评分，并附直接证据引用：

1. 决策增量：是否改变验证任务选择、修复优先级或修复范围。
2. 关键 journey 覆盖：是否覆盖 happy path、至少一个 failure/cancel exit 和平台 ownership。
3. 证据可追溯性：claim 是否能回到允许的样本证据，是否诚实标注 unknown/limitation。
4. 验证可执行性：task 是否包含平台、环境、动作、oracle 与 blocked 条件。
5. 误报负担：高影响误报、重复 finding、无法核验 finding 和人工澄清分钟。

`ir_go` 必须同时满足：至少两名独立盲审者；存在 IR 独有且改变决策的增量；无 high-impact false positive、permission breach 或不可执行任务；token、墙钟和误报审查成本不比 direct arm 高 25% 以上；无 materialized Figma 时 design-only 增量不计分。

任一门禁缺失都不得以 schema valid、模型自评或同一上下文复核代替。
