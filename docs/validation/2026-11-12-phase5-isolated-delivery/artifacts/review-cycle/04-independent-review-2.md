## 结论：NOT-READY

生产路由行为未发现错误，但 AE4 的月份过滤测试仍缺少足够判别力，且计划要求的 `CHANGELOG.md` 交付没有完成。

## Findings

### P0

无。

### P1

无。

### P2

- **月份过滤测试仍不能证明记录是按各自月份筛选的。**  
  位置：[test/server.test.js](/private/tmp/phase5-review/repo/test/server.test.js:85)

  用例创建的三条记录都使用 `Date.now()`，因此都处于同一月份。当前月份正例期望全量，`1970-01` 反例期望空数组。以下错误实现仍能让两个断言全部通过：

  ```js
  const filtered =
    month === monthOf(entries[0]) ? entries : [];
  ```

  该实现没有逐条检查月份，却会对当前测试产生“当前月全量、1970-01 空数组”的结果。硬编码反例已经能抓到“完全忽略 month、始终返回全量”的缺陷，但尚不能抓到错误的全有/全无过滤器。

  可执行修复：在测试中临时控制 `Date.now()`，分别通过 POST 创建两个固定月份的条目，例如 2025-01 和 2025-02；随后分别查询两个月份，并以硬编码对象或 ID 精确断言各自只返回对应条目。务必在 `finally` 中恢复 `Date.now`。

- **计划要求的 `CHANGELOG.md` 交付没有完成。**  
  位置：[2026-11-12-001-feat-entry-by-id-plan.md](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:218)

  计划 U3 明确要求修改 `README.md` 和 `CHANGELOG.md`，Definition of Done 也要求二者都已更新；但 `main`、`feature` 和完整 diff 中都不存在 `CHANGELOG.md`。

  可执行修复：如果该交付要求有效，新增符合计划约定的 `CHANGELOG.md` 记录；如果仓库实际上没有 changelog 约定，应由相应权威明确撤销 A3，并同步修正 U3、证据声明和 Definition of Done，不能保留已完成的表述。

### P3

- **计划中的基线来源不可复核。**  
  位置：[2026-11-12-001-feat-entry-by-id-plan.md](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:56)

  计划多处把 `9a29966` 作为源码基线，但该 commit 在当前仓库不存在；本次实际 `main` 是 `fd4448c`。计划第 174 行还声称检查过不存在的 `CHANGELOG.md`。

  可执行修复：以实际 `main` commit `fd4448c` 重新核验源码后更新基线引用，并删除或纠正无法成立的 `CHANGELOG.md` 取证声明。

- **完整 `git diff --check main...feature` 仍失败。**  
  位置：[2026-11-12-001-feat-entry-by-id-review-findings.md](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-review-findings.md:13)

  上一轮 findings 文档多行包含行尾空格，因此完整 diff 检查退出 2。实现、测试和新计划文件单独检查没有该问题。

  可执行修复：移除这些行尾空格；如需要 Markdown 换行，改用空行或其他不触发仓库 whitespace 检查的写法。

## 六项修复核验

1. **部分解决。** 三条精确有序断言能抓到列表截断；`1970-01` 能抓到完全忽略参数并返回全量，但不能证明逐条月份筛选。
2. **已解决。** 尾斜杠测试先创建 id 1，再请求 `/entries/1/`，能抓到错误的尾斜杠归一化。
3. **已解决。** 对现存 ID 表驱动覆盖了 POST、PUT、PATCH、DELETE，当前实现均返回 404。
4. **push back 成立。** [计划 A2](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:168) 明确指定模块导出及 `require.main === module` 守卫，[U1](/private/tmp/phase5-review/repo/docs/plans/2026-11-12-001-feat-entry-by-id-plan.md:187) 再次列入实现文件，因此原 finding 所称“计划之外”不成立。内存探针确认加载语义确实从“require 时监听”变为“不监听”，但这是计划明确要求的接缝；直接执行 `node src/server.js` 仍保留监听 3000 的语义。
5. **已解决。** 指定计划副本已存在，可核对 AE1–AE5；但其中有上述基线和 changelog 事实问题。
6. **已解决。** 每个用例删除模块缓存、重新加载模块，并在自身用例内创建全部前置数据；各 server 回调闭包持有独立 `entries`，不再依赖测试顺序或共享账本。

## 验证情况

- `node --check src/server.js`：通过。
- `node --check test/server.test.js`：通过。
- 无监听内存探针：命中、越界、非数字、前导零、查询串、空段、现存 ID 尾斜杠及四种非 GET 方法均符合计划。
- 固定两个不同月份的内存探针：当前生产实现能正确分别过滤对应条目。
- `npm test`：10 个用例均在启动阶段因 `listen EPERM: operation not permitted 127.0.0.1` 失败，属于已知沙箱限制，不能据此判定代码失败，也未取得完整套件通过证据。
- 评审期间未修改文件、未提交、未监听端口。

NOT-READY
