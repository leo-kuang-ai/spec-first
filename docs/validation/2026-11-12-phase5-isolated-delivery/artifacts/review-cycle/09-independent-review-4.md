结论：两条遗留中，D2 已充分登账；D1 已说明 A3 失效、U3 改为 README-only 及不创建 `CHANGELOG.md` 的理由，但没有覆盖计划正文中所有受影响陈述。此外，D3 新增了一处审查数量不一致。因此仍不宜合并。

### Findings

- **P2 — D1 未完整列出受 A3 失效影响的计划条目。**  
  [偏差记录](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-deviations.md:7)只明确覆盖 A3、U3 和全局 Definition of Done，但计划仍把 `CHANGELOG.md` 陈述为已确认的“变更记录约定”与“直读证据”：
  - [计划第 127 行](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:127)将其列为既有 owner；
  - [计划第 174 行](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:174)声称已经直读该文件；
  - [计划第 243 行](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:243)仍保留 `CHANGELOG` 格式检查。
  
  这些陈述与“全部可见历史中从未存在 `CHANGELOG.md`”直接冲突，却没有被 D1 列入受影响条目。最小修正是在 D1 的“影响”中明确覆盖这些位置及对应替代解释。

- **P3 — D3 对第一轮 finding 数量的记录不一致。**  
  [D3 第 24 行](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-deviations.md:24)记为“4×P2 + 1×P3”，但分支内第一轮[评审记录](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-review-findings.md:11)实际列有 5 条 P2 和 1 条 P3。若其中一条 P2 后续被驳回，应记录为“原结论 5×P2 + 1×P3，其中 1×P2 经复核驳回”，避免混淆原始结论与最终处置。

D2 与当前仓库事实一致：`9a29966` 无法解析，`fd4448c` 是当前 `main`；偏差记录也明确覆盖计划中所有 `9a29966` 快照引用并说明复现限制。

### 验证情况

- 已检查 `git diff main...feature` 全部 7 个文件。
- `git diff --check main...feature` 通过。
- `node --check src/server.js` 与 `node --check test/server.test.js` 通过。
- 当前测试文件包含 10 个用例，与 D3 的“10/10”数量陈述一致。
- 按沙箱限制未运行 `npm test`，因为测试会监听 `127.0.0.1` 并触发 `EPERM`。
- 本轮文档提交未修改代码或测试；没有发现新的代码或测试问题。

NOT-READY
