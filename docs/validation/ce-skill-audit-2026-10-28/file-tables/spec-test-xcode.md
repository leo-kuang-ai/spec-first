# spec-test-xcode 逐文件对照表

纳入本轮全量深审。

本表从文件账生成。读取完成只表示当前 hash 对应文本全文已审读，不表示职责对照、依赖闭包或整个 Skill 完成。

| 本地文件 | CE 文件 | 职责映射状态 | 本地读取 | CE 读取 | 审查结论 / 优化建议 |
| --- | --- | --- | --- | --- | --- |
| — | [@dependency/skills/ce-debug/SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/SKILL.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用simplify项同hash全文读取，检查no-shipping调用边界 |
| — | [@dependency/skills/ce-debug/references/post-fix-handoff.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-debug/references/post-fix-handoff.md) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | 复用simplify项同hash全文读取，检查fix后return |
| [@dependency/skills/spec-debug/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-debug/SKILL.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 复用simplify项同hash全文读取，检查diagnosis/fix/return界限 |
| [@dependency/skills/spec-runtime-setup/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-runtime-setup/SKILL.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读直接setup接口；大输出85–300分段重读，不代表setup实现完整审查 |
| [@dependency/skills/using-spec-first/references/public-route-map.md](/Users/kuang/xiaobu/spec-first/skills/using-spec-first/references/public-route-map.md) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读user-only Xcode入口与其他route边界 |
| [@dependency/tests/unit/ce-localization-round-1-remediation-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/ce-localization-round-1-remediation-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 复用commit项全文同hash证据，核对URL gate测试边界 |
| [@dependency/tests/unit/skill-flow-p2-closure-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/skill-flow-p2-closure-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文读取集中投射与user-owned入口测试；未执行 |
| [@dependency/tests/unit/spec-test-xcode-contracts.test.js](/Users/kuang/xiaobu/spec-first/tests/unit/spec-test-xcode-contracts.test.js) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文读取并执行2个source合同测试，非provider验证 |
| [SKILL.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-xcode/SKILL.md) | [SKILL.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/SKILL.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 用户主动iOS验证入口；保留本地source binding与URL authority，CE能力基本等价 |
| — | [agents/openai.yaml](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/agents/openai.yaml) | 职责已核对；见结论/逐项笔记 | 不适用 | complete | CE显式禁隐式调用；本地集中投射最终核对，不因无同名文件判缺陷 |
| [evals/cases/mcp-unavailable-stops.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-test-xcode/evals/cases/mcp-unavailable-stops.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读case/eval；只含关键词不证明停止，且runtime路径需fresh-source修正 |
| [evals/eval.yaml](/Users/kuang/xiaobu/spec-first/skills/spec-test-xcode/evals/eval.yaml) | — | 职责已核对；见结论/逐项笔记 | complete | 不适用 | 全文审读case/eval；只含关键词不证明停止，且runtime路径需fresh-source修正 |
| [references/setup-and-build.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-xcode/references/setup-and-build.md) | [references/setup-and-build.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/references/setup-and-build.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 建议明确bundle ID来源/兼容已boot设备；setup handoff不承诺未注册Xcode自动配置 |
| [references/test-and-report.md](/Users/kuang/xiaobu/spec-first/skills/spec-test-xcode/references/test-and-report.md) | [references/test-and-report.md](/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/references/test-and-report.md) | 职责已核对；见结论/逐项笔记 | complete | complete | 建议吸收通用操作后结果观察及受测flow推导；保留Fail/Partial及run-owned cleanup |
