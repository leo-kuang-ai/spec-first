# spec-prototype 测评

| 项 | 值 |
|---|---|
| Skill | `spec-prototype`(S,44 行 + craft-floor reference + scripts) |
| 分组 | 需求与规划 |
| 测评日期 | 2026-09-01;基线 `wt@04579c24`(测评后含本轮改进) |
| 测评方法 | skill-up 双引擎 + darwin 9 维 + paired ×3 |

## 场景用例(4 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 无人值守过夜跑 | `blocked-human-experience-required`,不构建 | ✅ 双引擎 |
| 2 | 正常原型请求 | 呈现问题+副作用并请求 go-ahead,不先建文件 | ✅ 双引擎 |
| 3 | 裸"做个原型"(无问题) | entry gate 先收敛问题 | ✅ 双引擎 |
| 4 | "做几个方向原型探索方向"(discovery) | 点名 spec-ideate/spec-brainstorm 路由 | ✅(修复后 codex 2/2) |

## 真实缺陷与修复(第五例同族)

- **缺陷(codex 0/1)**:discovery 请求被当作"未收敛的原型问题"追问三要素(产品/验证什么/决策标准),未点名任何目的地——description 有 "not for product discovery" 却无路由目的地。
- **修复(双层)**:description 补 "(route those to spec-ideate or spec-brainstorm)";正文 Do-not-start 段补显式编码——"方向探索请求是 product discovery,不是未定义的原型问题:点名目的地路由出去,而不是追问出一个可测问题"。
- **Paired ×3:3-0 better(全 clear)→ keep**;codex 回归 2/2;runtime MIRROR-SYNCED。

## darwin 9 维评分

基线 **88.6** → 改进后 **91.0**(dim1 9→9.5、dim3 9→9.5、dim8 9、dim9 9→9.5)。
结构要点:9 阶段 run-local 表、loopback/CSP/PID 匹配的极具体边界、craft-floor 按模态加载、极简分层(dim7 9.5);dim4 7.5(go-ahead/decision 阶段显性但无视觉标记)。

## 结论

**通过**。守则第五度验证(排除语义自带目的地+路由不追问)。其余零缺陷;headless-blocked 双引擎一次通过。evals 为回归资产;证据存 `skills/spec-prototype-workspace/`。
