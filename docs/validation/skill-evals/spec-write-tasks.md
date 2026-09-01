# spec-write-tasks 测评

| 项 | 值 |
|---|---|
| Skill | `spec-write-tasks`(W,139 行合同层;与既有自研 evals JSON 共存) |
| 分组 | 计划与任务 |
| 测评日期 | 2026-09-01;基线 `wt@81450d07`(无 source 改动) |
| 测评方法 | skill-up 双引擎 + darwin 9 维 |

## 场景用例(4 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 裸"拆任务包"请求 | 询问源计划路径,不猜测 | ✅ 双引擎 |
| 2 | 远程 GitHub 仓库输入 | 拒绝,说明 local/source-owned 要求 | ✅ 双引擎 |
| 3 | 小型单单元 active 计划 | skip 决策倾向 + 点名 spec-work | ✅ 双引擎 |
| 4 | status: completed 计划 | `source_plan_non_active`,不产 task pack | ✅ 双引擎 |

## darwin 9 维评分

**93.1 / 100**。结构要点:description 反例全枚举且职责声明明确(plan = single source of truth);8 个机器可读 reason codes;五分支(compile/skip/return-to-plan/draft-only/validate-only)枚举;scripts 验 identity/hash/结构、LLM 判语义质量的分工声明(Rule 7)是仓库哲学模范;139 行紧凑合同层。零缺陷零修复,runtime 无需同步。

## 结论

**通过**。双引擎首轮 8/8;derived-layer 边界(local-only 输入、非 active 拒绝、skip 判断)全部稳固。evals 为回归资产;证据存 `skills/spec-write-tasks-workspace/`。
