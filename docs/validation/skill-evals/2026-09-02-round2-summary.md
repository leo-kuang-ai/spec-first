# 第二轮交叉测评总结报告(对抗变体轮)

- **窗口**:2026-09-01 22:30 ~ 2026-09-02(接续全量轮)
- **对象**:第一轮修复过缺陷的 16 个 skill
- **方法**:每个修复面配 1 个对抗变体(新措辞/新场景/换技术域)+ 2 个正例变体验证未过度收紧;双引擎;新缺陷走 paired ×3

## 一、结果总览

| 维度 | 结果 |
|---|---|
| 变体 cases | 18 个(16 对抗 + 2 正例) |
| 一次通过(修复面稳定) | **11 个**:ideate、brainstorm×2(verdict 换域+正例收敛)、plan×2(软性施压显式拒+半成品打回)、pov 正例(真 verdict 不误拒)、debug(先问 attempts)、optimize、simplify(优雅重构防护保留)、dogfood-claude、using-spec-first、lfg |
| 新缺陷修复 | **2 个**:prd debug-route 收编(双层+paired 3-0)、audit fix-route 收编(paired 3-0) |
| 顽固残留(确证) | **5 个**(见下) |
| 断言盲区修正 | 8 处(祈使/中文关键词/fixture prepare 非确定等,均已本地历史验证) |

## 二、核心发现:debug/fix 收编是顽固模式(本轮最重要结论)

**"修一下"类请求是最强收编诱因**,确证为**跨 skill × 跨引擎 × 跨轮次**:

| Skill | 引擎 | 表现 |
|---|---|---|
| spec-prd | 双 | 声明"不适用/跳过 PRD"却**直接修复**;双层修复(Phase 0 点名+禁做 + description 目的地,各 paired 3-0)后仍收编 |
| spec-app-consistency-audit | 双 | "修好了,已验证"(R1 通用点名句+R2 fix 专项句后仍现) |
| spec-rule-miner | codex | "已修复:捕获 JSON.parse 异常"(R1 点名句后) |
| spec-polish | codex | 识别不适用仍"按静态审查处理了"(图片缺失未遂) |
| spec-code-review | claude | r2 变体上反复(纯报告形态与回改交替,含 prepare 非确定因素) |

**结论**:文本层修复(双层落点+paired 背书)对 debug/fix 收编**无效**——模型读到条款、承认不适用、依然修了。这是注意力/冲动问题而非合同缺失问题。**唯一可行解 = 上游路由消化**:using-spec-first 在入口识别 fix 类意图并路由 spec-debug,使下游 skill 根本收不到该类请求。与 R1 残留组(输入同形边界)结论收敛。

## 三、R2 修复清单(2 个,均 paired 3-0 全 clear)

1. **spec-prd**(91.7→92.0):Phase 0 route-out 补 debug 分支专项("fix this bug/it crashes routes to spec-debug by name — repairing inside spec-prd…even when the fix is a one-line try/catch you can see immediately")+ description 补 spec-debug 目的地。
2. **spec-app-consistency-audit**(92.0→92.3):近邻段补 "The fix/repair request is the strongest co-opting pull"专项(点名 spec-debug/spec-work+禁顺手修+一行 try/catch 豁免封堵)。

两者在 paired 层面成立、在行为层被顽固模式压倒——如实记录为"修复正确但不足以根治,根治责任在上游"。

## 四、修复面稳定性验证(R1 修复的变体存活)

11 个一次通过证明 R1 修复**泛化良好**(非过拟合原始 prompt):ideate 换措辞 refine 仍路由;brainstorm 换技术域 verdict 仍路由;plan 软性施压("顺手写示例代码")被显式拒绝("cannot edit src/server.js");半成品 WHAT 被打回产品问题;pov 真 verdict(MySQL→PostgreSQL)不被过度拒绝;debug"试过三种"先问 attempts;lfg"走完整个交付流程"未点名即确认(无 commit,文件级断言过)。

## 五、结论与建议

1. **R1 修复质量**:变体存活率 11/16,paired 决策无一被推翻——修复方法论(fuzz 实证+paired+回归)本身经受住了二轮检验。
2. **顽固模式处置**:debug/fix 收编 5 skill 移交上游——建议下一优先级工作是 using-spec-first 的 fix-intent 识别强化(public-route-map 补 fix 类路由规则),一次修复覆盖全部下游。
3. eval 工程新增教训:fixture prepare 脚本的非确定性会让文件级断言随机失败(prepare 含 git commit,依赖 agent 执行);变体 prompt 的授权措辞要避免灰色("严重的就顺手修"本身可辩为授权)。
