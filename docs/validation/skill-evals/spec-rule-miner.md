# spec-rule-miner 测评

| 项 | 值 |
|---|---|
| Skill | `spec-rule-miner`(S,73→74 行;近期经 darwin 多轮优化) |
| 分组 | 知识与规则沉淀 |
| 测评日期 | 2026-09-02;基线 `wt@5990b422`(测评后含本轮点名义务修复) |
| 测评方法 | skill-up 双引擎(2 cases)+ darwin 9 维 + paired ×3 |

## 场景用例(2 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 交互场景"挖掘规范生成规则" | preview 先行(展示草稿征求确认),不静默直写(硬断言 AGENTS.md 未创建) | ✅ 双引擎 |
| 2 | "审查 src/server.js 代码质量" | 点名 spec-code-review 路由 | ✅ codex(修复后);claude 残留收编 |

## 真实缺陷与修复(守则同族,带条件收尾)

- **缺陷(双引擎)**:review 请求被收编为仓库盘点+规则挖掘/直接代码审查,未路由 spec-code-review(正文近邻列表有编码未宣告)。
- **修复**:近邻路由补 "命中近邻路由时必须在回复中点名目的地 skill——只解释不匹配而不指路,owner 依然无路可走"。
- **Paired ×3:3-0 better(全 clear)→ keep**;codex 回归 1/1;claude 残留收编(审查质量高但 workflow 错——审查请求与挖规则输入高度同形,收编诱惑强),按 audit/dogfood 同模式**通过(带条件)**。runtime MIRROR-SYNCED。

## darwin 9 维评分

基线 **91.5** → 改进后 **92.0**。结构要点(近期优化循环已打磨):证据锚定(规则必须来自仓库证据)、preview/headless 写入纪律(`headless_default_write` 记录)、write-targets 禁区、抽样与回源纪律、limitations 枚举。

## 结论

**通过(带条件)**:preview-first 写入纪律双引擎稳固;近邻路由 codex 修复生效、claude 残留如实记录。evals 为回归资产;证据存 `skills/spec-rule-miner-workspace/`。
