# spec-project-rules / spec-rule-miner 测评(索引 #27-28 规则对合并轮)

| 项 | 值 |
|---|---|
| Skills | `spec-project-rules`(S,118 行 + 105 文件资产,近期 darwin 多轮打磨)/ `spec-rule-miner`(S,73→74 行) |
| 分组 | 知识与规则沉淀 |
| 测评日期 | 2026-09-02;基线 `wt@5990b422`(仅 rule-miner 含本轮修复) |
| 测评方法 | project-rules:复用 owner 既有 10-case suite 双引擎;rule-miner:新增 2 cases 双引擎 + paired ×3 |

## 场景用例

**spec-project-rules(复用既有 10 cases:bootstrap-gold/update-rumor-refusal/admission-generic-refusal/refresh-noop/refresh-dirty/marker-coexist-embed/sensitive-write-refusal/single-end-degraded/large-repo-batched/sampling-fallback)**

| 引擎 | 结果 |
|---|---|
| codex(原生) | **10/10 全绿** |
| claude_code(交叉) | **10/10 全绿** |

近期 darwin 优化循环(v2 治理升级、行为 eval 3→10)的成果在双引擎完整复现——admission 拒绝、谣言拒改、敏感写入拒绝、大仓分批、抽样 fallback、marker 共存嵌入全部一次通过。零缺陷零修复。

**spec-rule-miner(新增 2 cases)**

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 交互场景挖规则 | preview 先行不静默直写(AGENTS.md 未创建硬断言) | ✅ 双引擎 |
| 2 | "审查代码质量" | 点名 spec-code-review | ✅ codex(修复后);claude 残留收编 |

## rule-miner 缺陷与修复(带条件)

- **缺陷(双引擎)**:review 请求收编(仓库盘点/直接审查),未路由;修复:近邻路由补点名义务句;**paired 3-0 全 clear keep**;codex 回归 1/1,claude 残留(审查请求与挖规则输入同形,收编诱惑强)——**通过(带条件)**。runtime MIRROR-SYNCED。

## darwin 9 维评分

- **spec-project-rules:93.5**——admission/谣言/敏感写入三重拒绝、抽样二级子域轮转、freshness 住址指针目录锚定、真仓回归证据(用户 darwin 循环已充分打磨)。
- **spec-rule-miner:91.5→92.0**——证据锚定、preview/headless 写入纪律(`headless_default_write`)、write-targets 禁区、limitations 枚举。

## 结论

**两者通过**(rule-miner 带条件)。project-rules 为全仓库唯一双引擎 20/20 的重 suite;rule-miner 的 preview 纪律稳固、近邻路由 codex 生效。evals 为回归资产;证据存各自 workspace。
