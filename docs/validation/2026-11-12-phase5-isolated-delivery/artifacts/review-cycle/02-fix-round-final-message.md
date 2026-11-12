修复轮完成。终态：仅 `test/server.test.js` 一个被跟踪文件变更（+149/−92），预存未跟踪文件原样保留，未 commit / 未 push / 未建 PR。

## Findings 处置（6 条全闭环）

| Finding | 处置 |
| --- | --- |
| **P2** AE4 测试无法发现列表截断/过滤失效 | ✅ 修复（机制适配，见下） |
| **P2** 尾斜杠用例用了不存在的 id | ✅ 修复：`test/server.test.js` 边界用例改用本用例自建账本中确定存在的 id（`/entries/1/`） |
| **P2** 非 GET 方法只覆盖 POST | ✅ 修复：表驱动 `POST/PUT/PATCH/DELETE` × 现存 id；HEAD 未加——计划 U2/KTD4 未要求，review 建议亦以「计划要求时」为条件 |
| **P2** require 启动语义变化超范围 | 🛑 **push back，保留原实现**：计划 A2 逐字授权该接缝（「模块导出 + `require.main === module` 守卫（CLI 行为不变）……多两行非路由改动」，含失效条件与退路），U1 Files 同样列明；reviewer 的前提「应在计划中明确批准」实际已满足。仓库内无依赖「require 即监听」的消费者（唯一 require 者是测试）；CLI 冒烟证明 CLI 契约不变 |
| **P2** 计划副本缺失 | ✅ 核验：计划已提交（c52b863）；AE1–AE5 ↔ 用例逐项映射核对通过（AE1→ok4、AE2→ok5、AE3→ok6、AE4→ok2+ok3、AE5→ok1） |
| **P3** 测试依赖共享账本与固定顺序 | ✅ 修复：每用例经 `require.cache` 失效获得独立 server + 独立账本并自建前置；隔离运行 `--test-name-pattern '超出范围'` 通过（原实现该场景在空账本上抛异常） |

**P2#1 机制适配说明**：reviewer 建议的「两个固定月份」不可行——`ts` 由服务端 `Date.now()` 生成，API 无法指定；为播种导出内部数组违反「真实入口可驱动时不为测试新增 production export」的测试设计规则；`mock.timers` 会突破计划 A4 钉住的 Node ≥ 18 下限。改用等效检出：3 条目精确全量有序断言（截断即失败，2 条测不出所以用 3 条）+ month 正例精确集合 + 硬编码不可能月份 `1970-01` → 空数组（过滤被忽略即失败）。

## 验证证据（计划 Verification Contract）

- **`npm test`**：10/10 通过、0 失败（最终树复跑），AE1–AE5 全覆盖。
- **CLI 冒烟**：POST → `ok`、`GET /entries/1` → 200 + JSON、`GET /entries/999` → 404 `not found` 三连全过；但新鲜复跑被一个**孤儿进程**阻塞（我第一次冒烟尝试的脚本 bug 致子进程遗留，PID 27431 持有 3000 端口；`kill` 被本会话权限模式拒绝，未绕行）。冒烟脚本已加固端口占用预检（exit 76 显式降级），owner 执行 `kill 27431` 后重跑即可拿到全新鲜证据。

## 收口信封（诚实降级）

`verification_run_summary_ref: null`、`honest_closeout_verdict: null` —— `spec-first` CLI（verification-run-summary record / honest-closeout validate）被本会话权限模式拒绝（两种调用方式均试过），仓库内无脚本副本；证据以 transcription 级落盘于 `.spec-first/workflows/spec-work/feature/2026-11-12-findings-fix/`（logs × 3 + `MANUAL-CLOSEOUT.md`，已被 gitignore 覆盖）。代码审查为定向人工审查（低风险局部变更例外），非独立审查。

## Residuals（owner 动作）

1. `kill 27431` 清理孤儿 `node src/server.js`（3000 端口），随后重跑冒烟脚本。
2. P2#4 的 push back 若不认可（担心未知外部 require 消费者），需计划层决策改 server factory——超出本轮范围。
3. 计划语义复核（spec-doc-review，report-only，hash 前后一致）发现 P3：基线引用 `9a29966` 在本仓不可解析（实际基线为 `fd4448c`），建议 plan owner 修正。
4. 实现轮遗漏了 U3 的 CHANGELOG 条目（不在 findings 范围，未扩大处理）；关闭 NOT-READY 前建议对 `main...feature` 全量 diff 重跑一次独立 `spec-code-review`。

计划 status 保持 `active`（本轮为修复轮，未做生命周期迁移）；commit 候选 `test: strengthen entry-by-id suite per review findings` 已记录、按边界保持未提交。