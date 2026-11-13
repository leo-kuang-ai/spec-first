# FSA3 第二轮全面审查执行方案与实绩

- run_id：`2026-09-16-fsa3`
- 审查基线：`HEAD 66b0e0c6c83c1e75d2e9634132586bfce5581ff3` + 当前 tracked/untracked 非 ignored 输入；第一轮修复仍未提交。
- 主工作流：`spec-code-review` report-only；无独立 reviewer dispatch 授权，fresh-source eval 为 `not-run`，语义审查由当前 Agent inline/serial 完成。
- 所有命令、探针和 manifest 先在 detached worktree 运行；主 checkout 未作为测试场地，未修改 source/runtime、未提交、未推送、未调用真实模型或外部写入。

## 回归结果

| 检查 | 结果 |
|---|---|
| `npm test` | passed：236 unit suites / 2947 tests；smoke 1 suite / 5 tests；integration 17 suites passed，1 suite skipped / 2 tests skipped |
| `npm run typecheck` | passed |
| `npm run lint:skill-entrypoints` | passed |
| `npm run check:shared-references` | passed |
| `npm run sync:instructions` | passed（check only） |
| `npm run build` | passed |
| `node scripts/npm-install-matrix-smoke.cjs` | passed |
| 38 Skill eval 配置 | 37 组 `validate` + 37 组 `list-cases` passed；模型行为 `not-run` |
| Graphify dogfood | 2 项显式开关测试 skipped；未升级为真实 Graphify 通过 |

## 审查覆盖与状态

- U1：`passed/degraded`。5191 个输入文件绑定逐文件 SHA256；HOME/TMPDIR/npm cache 隔离；canary 仅证明本轮日志过滤，不是通用 secret scanner hard gate。worktree 与主 checkout 的 5191 个输入均保持稳定。
- U2：`passed`。详见上表及 `evidence/checks/`、`evidence/logs/`。
- U3：`degraded`。8 宿主 registry/adapter/source 和发布包动态 smoke 已检查；没有真实 8-host loader/invocation 波次。
- U4：`degraded`。五类 gate 的 owner、enforcement 和 consumer 做 source/contract/negative-path 复核；真实宿主全局 mutation enforcement、handoff consumer、knowledge promotion 运行证据未补齐。
- U5：`degraded`。16 条核心 workflow/入口完成入口、owner、主要边界和 seam 复核；无 fresh-source 独立调用。
- U6：`not-run`。没有在安全前置不足时强行运行受控降级 journey。
- U7：`degraded`。历史 audit/CE、registry、README/catalog、mutation contract 已回读；旧结论未改写。
- U8：`not-run`。未授权真实宿主、真实模型、真实任务或 comparator。
- U9：`degraded`。38 个 canonical Skill 均有 package closure、入口、主要 contract/consumer、关键错误/停止路径的 receipt；深层闭包未逐包全量遍历，fresh-source eval 未运行。receipt 见 `evidence/skill-receipts.json`。
- U10：`hypothesis/degraded`。定位仍是已有 AI coding 宿主的个人/资深开发者优先，平台/技术负责人负责推广治理，无 AI coding 宿主团队为 anti-persona；没有访谈、field cohort、成本窗口或 comparator。
- U11：`passed as record`，整轮 lifecycle 保持 `incomplete`。报告、ledger、manifest、logs 均可回源，记录有效不等于机制通过。

## Findings

1. `FSA3-001` P1：`spec-commit` 的 commit recipe 未保护既有 index，隔离夹具已复现越界提交。
2. `FSA3-002` P1：`autoresearch` 拒绝命令时回显含 userinfo 的 DB URL。
3. `FSA3-003` P2：`autoresearch` 在 `pending_verify` 或上一 hop 失败时仍可输出 `CONVERGED`/`DONE`。
4. `FSA3-004` P2 candidate：autoresearch 分类器可能将语义目标路由到错误 archetype；当前未证明越过用户确认。

以上是第二轮确认的问题及一项候选风险；Kiro/Qoder maturity 差异经复核不构成 finding。原先观察到的 Runtime Setup bare/plan scope 差异已复核为有意的 installation scope 分层（其 `next_action` 明确要求保持相同 scope），不列为 finding，保留为审查限制而非缺陷。

## 产品定位结论

产品定位仍只能是 hypothesis：面向已使用 AI coding 宿主的个人/资深开发者，连接 intent、plan、tasks、code、review、verification、handoff、knowledge；平台/技术负责人是推广治理对象；不使用 AI coding 宿主的团队是 anti-persona。当前能证明结构与 C0/C1 机制证据，不能证明首次 trusted change、质量调整后吞吐、持续复用、团队 handoff 或增量价值。`field-validation/results.json` 仍是 `overall_status: not-run`。

## 修复顺序与收口

1. 先修 `FSA3-001`、`FSA3-002`，这是 mutation/security 阻断项。
2. 再修 `FSA3-003`，补状态组合和验证负例。
3. 处理 `FSA3-004` routing candidate：先补语义分类合同与负例，再决定是否升级为 confirmed；不因 Kiro/Qoder 双轴表述重复改文档。
4. 修复后重新执行全套回归，再决定是否展开 U6/U8；本轮不将项目标为 `mechanism qualified`。

### Claim ceiling

本轮最高 C1：源码、CLI、投射和隔离夹具证据。真实 exact-host loader 为 C2，真实任务为 C3，预注册 comparator 为 C4，均未验证。

## 用户授权修复后的状态

原方案与上文结果绑定修复前快照。FSA3-001～004 的后续源码修改、回归和 CE 清单重建见 [报告修复复验](./2026-09-16-fsa3-report.md#修复复验2026-09-16) 与 findings ledger；不得把审查阶段的未改源码声明延伸到修复阶段。
