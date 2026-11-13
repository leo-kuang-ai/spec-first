结论：月份过滤测试已真正修复“全有/全无”漏检，且没有发现新的实现或测试可靠性问题。但第 2、3 条处置只在本轮说明中出现，尚未反映到分支内的计划或偏差记录；当前计划仍包含已知不成立的事实和无法验证的证据声明。因此本轮仍不宜标记 READY。

### Findings

#### P0

无 P0 问题。

#### P1

无 P1 问题。

#### P2

- **CHANGELOG 偏差没有实际记录到评审产物，计划仍要求不存在的文件。**

  [计划 A3](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:169)仍声明仓库已有 `CHANGELOG.md` 格式；[U3](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:216)和 [Definition of Done](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:238)仍要求更新并验证该文件。实际 `main`、`feature` 及可见历史均没有 `CHANGELOG.md`。

  不为满足错误前提而凭空创建文件是合理处置，不属于功能遗漏。但当前分支没有把 A3 判定为失效，也没有调整 U3 和完成条件；上一轮 findings 仍是旧结论，不能充当本轮偏差记录。因此这是“合理决定但记录未完成”，而不是已经充分处置。

#### P3

- **不可解析基线的可复现性限制同样没有写入计划。**

  `git cat-file -e 9a29966^{commit}` 返回 128，而本仓库 `main` 是 `fd4448c`。但计划仍多次把 `9a29966` 写成基线，并在 [Evidence & Limitations](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:172)和 [Verification Contract](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:228)中声称全部结论来自该 commit 的源码直读。

  重建仓库导致哈希变化是合理且诚实的解释；当前 `main` 源码也可作为本仓库内替代基线。但计划没有注明这一限制或建立 `9a29966` 与 `fd4448c` 的替代对应关系，第三方仍无法按文档复现证据。

### 月份测试复核

第 1 条已解决指定漏检。把错误实现构造成“只检查首条月份，匹配则返回全量，否则返回空”后：

- 查询 `2025-01` 会错误返回 3 条，当前硬编码期望只有 id 1、3。
- 查询 `2025-02` 会错误返回空，当前硬编码期望 id 2。
- 查询 `2025-03` 返回空，但前两个断言已经确保该错误实现不能通过。
- 无参数列表另行精确断言 id 1、2、3 及录入顺序。

其他可靠性检查未发现问题：

- `seedAt` 在包含全部异步 POST 的 `try/finally` 中恢复原始 `Date.now`，正常完成和 Promise 拒绝都会恢复。
- 时间使用 `Date.UTC`，生产过滤使用 `toISOString()`，两者均为 UTC 口径，不依赖运行机器时区。
- 当前测试默认顺序执行；每个用例清除模块缓存，获得独立 server 和内存账本，并自行建立前置数据，不依赖测试排列。
- 无监听内存探针得到：1 月为 id 1、3，2 月为 id 2，3 月为空，全量为 id 1、2、3；ID 查询和尾斜杠 404 也符合计划。

### 验证情况

- `node --check src/server.js`：通过。
- `node --check test/server.test.js`：通过。
- `git diff --check main...feature`：通过，行尾空白问题已解决。
- `npm test`：10 个用例都在 `listen(0, '127.0.0.1')` 处因 `EPERM` 中止；这是已知沙箱限制，不是代码失败。
- 不监听端口的内存请求探针：通过。
- 工作区保持只读，未修改或提交文件。

NOT-READY
