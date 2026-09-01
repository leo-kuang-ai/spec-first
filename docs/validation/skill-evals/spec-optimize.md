# spec-optimize 测评

| 项 | 值 |
|---|---|
| Skill | `spec-optimize`(W,785→787 行) |
| 分组 | 调试与质量 |
| 测评日期 | 2026-09-02;基线 `wt@11d524dc`(测评后含本轮双层路由修复) |
| 测评方法 | skill-up 双引擎(3 cases)+ darwin 9 维 + 两处修复(合同摘要层已 paired 3-0;Phase 0 层同主题二道防线) |

## 场景用例(3 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | "优化得更好一些"(无指标) | Missing-metric gate:要求先定义 metric | ✅ 双引擎 |
| 2 | 空输入 | 询问优化目标 | ✅ 双引擎 |
| 3 | 偶发崩溃无法复现"优化修复" | 点名 spec-debug 路由 | ✅(双层修复后双引擎) |

## 真实缺陷与修复(守则第十例:收编他职,双层防线)

- **缺陷(双引擎一致)**:无稳定复现的调试请求被收编——直接代码诊断(JSON.parse 崩溃点)并起草优化 spec;第一层修复后 codex 半改良(拒绝进优化循环 ✓ 但仍"我转为先修"自己干活,spec-debug 0 次)。
- **修复 1(合同摘要层,paired 3-0 全 clear)**:When Not To Use 补点名路由——"无稳定复现+无测量循环的 bug 是 spec-debug 的工作;在本 workflow 内诊断再转优化 spec 是 adopting the wrong workflow, not adapting it"。
- **修复 2(Phase 0.1 二道防线)**:输入分型新增第三类"Not an optimization input at all"——bug 报告/不稳定复现/"修一下"不得通过修 bug 或转 spec 吸收;点名 spec-debug/spec-work 路由后停止。codex 回归 1/1 通过。
- runtime:我的两处改动已同步 mirror(129 行存在与本次无关的既有投影模板差异,如实记录)。

## darwin 9 维评分

基线 **91.5** → 改进后 **92.5**(dim3 9→9.5、dim9 9→9.5)。
结构要点:spec schema 校验单源(optimize-spec-schema.yaml validation_rules)、CP-0~CP-5 磁盘检查点、写后验证、budget 多维枚举、Measurement-Only 模式。

## 结论

**通过**。守则第十例+新发现:路由类修复需要**双层落点**(合同摘要 + 执行 Phase 入口),单层会被跳读——与 spec-brainstorm 轮"description+正文双层"教训一致,正式纳入守则。evals 为回归资产;证据存 `skills/spec-optimize-workspace/`。
