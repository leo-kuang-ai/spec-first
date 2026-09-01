# spec-strategy 测评

| 项 | 值 |
|---|---|
| Skill | `spec-strategy`(S,96 行 + 2 references) |
| 分组 | 需求与规划 |
| 测评日期 | 2026-09-01;基线 `wt@d6df17fb` 后(含本轮改进) |
| 测评方法 | skill-up 双引擎 + darwin 9 维 + paired ×3 |

## 场景用例(5 cases)

| # | 场景 | 预期 | 结果 |
|---|---|---|---|
| 1 | 无 STRATEGY.md 首跑 | 宣告首跑 + 面试提问开局,不先写 | ✅ 双引擎 |
| 2 | 已有文件无参数 | 问重访哪个 section | ✅ 双引擎 |
| 3 | 参数定向 metrics | 跳该 section 重访提问,其余不动 | ✅(断言语言修正后) |
| 4 | feature 排期写进策略 | 拒绝并点名 spec-brainstorm/issue tracker | ✅(修复后 codex 2/2) |
| 5 | 更新前真读现有文档 | 现状摘要引用 fixture 独有内容(LedgerFlow/对账) | ✅ 双引擎 |

## 真实缺陷与修复(Phase 2)

- **缺陷(第四例同族,轻)**:"8 个 feature 排期写进 STRATEGY.md"——codex 正确拒绝但只说"issue tracker 或独立 roadmap",未点名 skill 文本明文的 `spec-brainstorm`(跨引擎宣告不稳定)。
- **修复**:Core Principle 1 补 "When declining such creep, name the destination explicitly (spec-brainstorm for features, the issue tracker for schedules) — a bare refusal or a generic 'put it elsewhere' leaves the owner without a route."
- **Paired ×3:3-0 better(全 clear)→ keep**;回归 codex features 2/2;runtime MIRROR-SYNCED。

## eval 断言记录

- targeted case 锚英文 "metrics" 而输出中文"指标"——模板词/关键词本地化盲区再例;改为 asks 判定 + transcript 核验定向性。
- existing case 曾要求现状摘要先行——Phase 0 先问是合法路径,摘要可后置;断言放宽。

## darwin 9 维评分

基线 **87.5** → 改进后 **90.1**(dim3 8.5→9.5、dim8 8.5→9、dim9 9→9.5)。
结构要点:Phase 0 文件状态三路由清晰;pushback 两轮上限具体;2 references non-optional 说明原因;dim4 7(无显性检查点标记,观察项)。

## 结论

**通过**。守则第四度验证(拒绝时点名目的地);零其他缺陷。evals 为回归资产;证据存 `skills/spec-strategy-workspace/`。
