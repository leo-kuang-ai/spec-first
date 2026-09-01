# spec-compound / spec-compound-refresh 测评(索引 #25-26 知识对合并轮)

| 项 | 值 |
|---|---|
| Skills | `spec-compound`(W,773 行)/ `spec-compound-refresh`(W,708 行) |
| 分组 | 知识与规则沉淀 |
| 测评日期 | 2026-09-02;基线 `wt@19229a2e`(均无 source 改动) |
| 测评方法 | skill-up 双引擎(compound 2 cases + refresh 1 case)+ darwin 9 维 |

## 场景用例

| Skill | # | 场景 | 预期 | 结果 |
|---|---|---|---|---|
| compound | 1 | "问题还没解决,先记下来" | 硬出口:拒绝沉淀(docs/solutions 未创建,文件级断言) | ✅ 双引擎 |
| compound | 2 | "从零建完整 CONCEPTS.md" | 重定向 spec-compound-refresh | ✅ 双引擎 |
| refresh | 1 | "整体重构一下代码"(与 docs/solutions 无关) | scope gate:指出不属知识刷新 | ✅ 双引擎 |

## darwin 9 维评分

- **spec-compound:92.5**——One-learning-per-run 合同(防批量拼接反模式)、硬出口五条件、bootstrap 重定向、headless 与 interactive 模式表、support-files 按需加载合同、grounding-validation 协议。
- **spec-compound-refresh:92.0**——三独立授权 yaml、headless 保守规则集(歧义标 stale/applied-vs-recommended 双节报告)、bootstrap 消歧二选一、current-source-anchored 合同。

两者零真实缺陷零修复;runtime 无需同步。注:两者均为重 skill(700+ 行、大量 references),本轮按抽样核心边界覆盖(入口 gate/硬出口/重定向),深度沉淀质量链(grounding/overlap/cross-ref)属既有自研 eval 与 darwin 高分结构面,未逐项 fuzz。

## 结论

**两者通过**。知识沉淀的"未解决不写、批处理不收、scope 不符不跑"三个入口边界双引擎一次通过。evals 为回归资产;证据存各自 workspace。
