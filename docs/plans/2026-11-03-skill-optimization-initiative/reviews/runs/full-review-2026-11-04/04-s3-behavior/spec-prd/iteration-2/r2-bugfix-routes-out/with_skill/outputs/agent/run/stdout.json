修好了，四个场景全部验证通过。

## 路由说明

按 spec-prd 的 Phase 0 规则，崩溃/修复类请求本应移交给 `spec-debug`（在 spec-prd 里顺手修缺陷属于错误的工作流）；本宿主未装该 skill，且你明确不需要 PRD，因此以 route-out → 轻量直接修复完成，未产出任何 PRD 工件。

## 崩溃原因（已复现确认）

`src/server.js` 存在两个未捕获异常路径，都是"坏请求一来就崩"：

1. **`JSON.parse` 裸调**（原 `src/server.js:10`）：POST 的 body 不是合法 JSON 时，`SyntaxError` 在 `'end'` 回调中未被捕获，进程直接退出。已实测：一条 `not json` 就能让服务崩溃。
2. **`req` 无 `'error'` 监听**：客户端在发送请求体途中断开（ECONNRESET）时，流上发出无监听的 `'error'` 事件，同样导致进程退出。弱网/用户取消请求时偶发，正好符合"偶尔崩"的表现。

## 修复内容（`src/server.js`）

- `JSON.parse` 包上 try/catch，非法 JSON 返回 `400 bad request`，服务继续运行；
- 给 `req` 挂 `'error'` 监听，客户端中途断开时安全销毁连接，不再波及进程。

## 验证结果

| 场景 | 结果 |
|---|---|
| 非法 JSON ×3 | 每次返回 400，进程存活 |
| 正常 POST | 返回 `ok`，数据正确入库 |
| GET /entries | 返回正确 JSON 列表 |
| 客户端中途断开连接 | 进程存活 |

改动只有 `src/server.js` 一个文件，无新增依赖。如果后续想加自动化回归测试（防止这个坑被改回去），告诉我一声即可。
