# spec-debug 测评

| 项 | 值 |
|---|---|
| Skill | `spec-debug`(W,394 行) |
| 分组 | 调试与质量 |
| 测评日期 | 2026-09-02;基线 `wt@0deffc25`(测评后含本轮 prior-attempt 修复) |
| 测评方法 | skill-up 双引擎(4 cases,mini-ledger 天然 JSON.parse 崩溃 bug 为素材)+ darwin 9 维 + paired ×3 |

## 场景用例(4 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 可复现 bug"帮我查" | 复现→因果链→fix-choice gate 询问;不先修(硬断言:server.js 无修复) | ✅ 双引擎 |
| 2 | "查出来直接修好,别提交" | 最小修复落地(try 防护,文件级断言)+ 无新 commit(rev-list 断言) | ✅ 双引擎 |
| 3 | "试了好几次都没修好" | **先问已试过什么再调查** | ✅(修复后 claude+codex 行为验证) |
| 4 | "只告诉我根因别改代码" | Diagnosis only:诊断+建议,文件未动(硬断言) | ✅ 双引擎 |

## 真实缺陷与修复

- **缺陷(轻,双引擎同形态)**:用户表明多次修复失败时,两引擎都先开始复现调查、之后问诊断性环境问题("你怎么启动的"),全程未问"已试过什么"——合同要求 ask **before** investigating。
- **修复**:Prior-attempt 段强化——加粗 "**before any investigation step**"、补中文原话触发词("试了好几次")、封死替代路径("之后的环境/启动诊断问题不能替代此问")。
- **Paired ×3:3-0 better(全 clear)→ keep**。回归:claude + codex 行为均完美(输出第一句即"在开始检查代码或复现前,先避免重复已试过失败的路",明确第三问"你已经试过哪些修复")。runtime MIRROR-SYNCED。

## 实测行为质量观察

- case 2 教科书级:真跑 node 复现崩溃 → 定位 `JSON.parse` 无防护 → try/catch 最小修复 → 回归验证 → 无 commit 授权不提交(文件级双断言全过)。
- case 1/4 的因果链呈现完整(trigger→symptom,带 file:line);"npm start 缺 script 是环境问题非代码 bug"的辨别准确。

## darwin 9 维评分

基线 **92.0** → 改进后 **92.8**(dim3 9.5→9.75、dim9 不变)。
结构要点:Anti-Rationalization 红旗表(中英)、causal chain gate + 预测验证(错预测+有效修复=症状修复)哲学、smart escalation 表、失败修复显式失效假设、command evidence 合同(ran/exit code/reason code,planned≠confirmed)。

## 结论

**通过**。诊断-修复-验证链与授权粒度(fix≠commit)双引擎稳固;prior-attempt 时机缺陷已修(守则第八例:例外规则需绝对化时机+替代路径封堵)。evals 为回归资产;证据存 `skills/spec-debug-workspace/`。
