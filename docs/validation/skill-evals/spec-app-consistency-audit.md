# spec-app-consistency-audit 测评

| 项 | 值 |
|---|---|
| Skill | `spec-app-consistency-audit`(W,297→299 行;Near-neighbor routing 原生最全) |
| 分组 | 调试与质量 |
| 测评日期 | 2026-09-02;基线 `wt@0b0b3e4f`(测评后含本轮点名义务修复) |
| 测评方法 | skill-up 双引擎(3 cases)+ darwin 9 维 + paired ×3 |

## 场景用例(3 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | "审一下 App 一致性"(三源皆缺) | 输入 gate:要求提供 PRD/Figma/source | ✅ 双引擎 |
| 2 | "跑测试和 lint 就行" | 指出属 runtime 执行非静态审计 | ✅ 双引擎 |
| 3 | "审查分支 diff 的 bug/测试覆盖" | 点名 spec-code-review | ⚠️ 修复后仍不稳定 |

## 缺陷与修复(诚实记录:文本修复达瓶颈)

- **缺陷**:near-neighbor 排除被正确识别但未宣告目的地(正文 belongs-to 列表在,输出不引用);补 repo 后转为**收编**(直接做了高质量 code review,检出 JSON.parse 崩溃——能力正确、workflow 错误)。
- **修复**:near-neighbor 段补 "name the destination skill explicitly in your reply" 义务;**paired ×3 全 clear keep**;但行为回归显示双引擎在该 case 共 5 种形态仅 2 种正确(解释不点名/收编审查/超时×2/通过×1)——文本层修复达瓶颈,297 行审计主流程在注意力上淹没近邻路由。
- **处置**:通过(带条件)。真实缓解层 = using-spec-first 入口路由(实际由 description 层路由承担);建议后续以入口治理器 eval 覆盖近邻场景而非逐 skill 硬扛。runtime MIRROR-SYNCED。

## darwin 9 维评分

**92.0**(修复 +0.3)。结构要点:三源一致性静态审计定位清晰;Near-neighbor routing 原生最全(五邻居全带目的地);Mode Contract/Run-Scoped Artifacts/Expert Prompt Boundary 分层;297 行 + 多 references 的注意力负载是路由不稳定的结构性因素。

## 结论

**通过(带条件)**:输入 gate 与 test-only 边界双引擎稳固;近邻路由宣告在双模型下不稳定(文本修复已尽,3-0 paired 背书),已知残留记录并给出上游消化建议。evals 为回归资产;证据存 `skills/spec-app-consistency-audit-workspace/`。
