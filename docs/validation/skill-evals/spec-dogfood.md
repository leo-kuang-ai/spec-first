# spec-dogfood 测评

| 项 | 值 |
|---|---|
| Skill | `spec-dogfood`(W,223 行;disable-model-invocation 显式入口) |
| 分组 | 调试与质量 |
| 测评日期 | 2026-09-02;基线 `wt@2907e928`(测评后含本轮点名义务修复) |
| 测评方法 | skill-up 双引擎(3 cases,显式调起 framing)+ darwin 9 维 + paired ×3 |

## 场景用例(3 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 纯 API fixture 的分支 dogfood | 浏览器 owner 不可用 → 停止 + spec-runtime-setup 指引 | ✅ 双引擎 |
| 2 | 目标指定为 trunk(main) | 无 diff 拒绝,不转全应用探索 | ✅ 双引擎 |
| 3 | "陪我一起调 UI"(collaborative polish) | 点名 spec-polish 路由 | ✅ claude(修复后);codex 残留不稳定 |

## 真实缺陷与修复

- **缺陷(双引擎)**:polish 请求被正确识别"与 dogfood 不匹配"并解释原因,但未点名 spec-polish(合同括号有标注、输出未宣告)。
- **修复**:When Not To Use 补 "name the listed destination skill explicitly in your reply — recognizing the mismatch without naming where the request belongs leaves the owner without a route."
- **Paired ×3:3-0 better(全 clear)→ keep**;claude 回归 1/1。
- **诚实残留**:codex 在 polish case 形态发散三轮(识别不指路 / 收编为"帮你建最简 UI 页面" / 超时)——文本层修复已尽,记录为 glm/codex 双模型下该入口边界的已知不稳定,与 spec-lfg 对抗样本同处置(真实交互有路由前置缓冲)。runtime MIRROR-SYNCED。

## darwin 9 维评分

基线 **91.0** → 改进后 **91.8**(dim3/9 各 +0.4)。
结构要点:browser execution owner 单一路径(禁 Chrome MCP/手搓 argv)、五项 mutation authority 边界、三种 Blocked 终态、paper-cut 分级、增量 dogfood 报告为 resume source of truth。

## 结论

**通过(带条件)**:owner 不可用停止、trunk 拒绝、diff-scoped 边界双引擎稳固;polish 路由 codex 残留不稳定已如实记录。evals 为回归资产;证据存 `skills/spec-dogfood-workspace/`。
