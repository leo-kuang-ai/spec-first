# S06 修复与事实裁决

2026-11-02；修复前HEAD：f54831987。范围F-S06-01/02。当前用户授权逐项本地修复与提交；未授权新增付费对照、推送或真实runtime刷新。

F-S06-01：第五批A/B在所测实施场景显示加载成本约3.0–3.6倍，但不能归因到单一审查条款。当前源码要求所有非机械diff走专项审查且phase引用一律重读，构成小任务成本风险。收窄为同一连续上下文、已完整读取且未变的引用可复用；上下文恢复、源码变化及终止即时重读仍保留。单边界、低风险、可逆且针对性验证充分的本地改动，可做显式定向manual diff审查；显式/required review及权限、安全、共享合同、source/runtime等风险不豁免。Residual、verification与mutation-enforcement证据出口保留。没有实际测量此修改后的成本收益。

F-S06-02：历史W5的行为保持重构属于S21选题，GLM侧3/3未触发spec-work；按归属纠正，不为S06补虚假行为结论。第五批有效实施对照的原始证据保持其场景边界。

5套61项相关合同测试和10例eval配置加载通过，见tests.txt/eval.txt。独立fresh-source /root/s04_source_review 首轮发现去重时丢失mutation-enforcement引用，已恢复并复核最终源码passed。未运行真实宿主小任务对照，独立review成本与质量后果仍待测；judge/human校准未运行，不作相对收益claim。无新代码抽象，simplify不适用。structured closeout仅覆盖本地检查。
