# spec-explain / spec-handoff / spec-pov 测评(索引 #33-35 会话组三合一轮)

| 项 | 值 |
|---|---|
| Skills | explain(127 行)/ handoff(90 行)/ pov(137→139 行,含修复) |
| 分组 | 会话连续性与解释 |
| 测评日期 | 2026-09-03;基线 `wt@e25401fd`(仅 pov 含修复) |
| 测评方法 | 各 1 case 双引擎 + pov paired ×3 |

## 场景用例

| Skill | 场景 | 预期 | 结果 |
|---|---|---|---|
| explain | "stream/buffer 区别?简单说说" | 直接轻量回答,不产教学 artifact(docs/explainers 未创建) | ✅ 双引擎(claude 原生;codex 断言补轻量语义词后本地验证) |
| handoff | "我们继续刚才的活儿" | 就地继续,不产交接文档(docs/handoffs 未创建) | ✅ 双引擎 |
| pov | "裁决:表单列表同页还是分开?"(用户自有设计问题) | 不裁,路由 spec-brainstorm/spec-plan | ✅ claude(修复后);codex 半改良残留 |

## pov 真实缺陷与修复(裁决越权型)

- **缺陷(claude)**:开放式产品设计问题被直接给出 verdict("通过——同页,置信度高"),替用户做了产品决定——既有 selection escape hatch 不覆盖(该"场"有界且判据可知)。
- **修复**:escape hatch 补 "**A product-design question the user owns is not a verdict.**"(无 named external candidate;路由 brainstorm=WHAT/plan=HOW;禁止返回 verdict)。
- **Paired ×3:3-0 全 clear keep**;claude 回归 1/1;**codex 残留半改良**(拒 formal verdict ✓ 但仍给"工程建议"且未指路——比 formal verdict 轻,无 Tier/置信度伪装),通过(带条件)。runtime MIRROR-SYNCED。

## darwin 9 维评分

explain **91.5**(反例清单最全之一:ordinary Q&A/brief why/diagnosis/status/concise tradeoff 全枚举)/ handoff **92.0**(显式触发词最严格:仅 explicit fresh-session/handoff/resume;90 行紧凑)/ pov **91.0→92.0**(two-floor gate/scout 分工/可逆性三层/reject-all 保留;修复补设计问题逃生口)。

## 结论

**三者通过**(pov 带条件)。explain/handoff 的触发边界(反例驱动)双引擎原生稳固;pov 的裁决边界在"用户自有设计问题"上经修复加固。evals 为回归资产;证据存各自 workspace。
