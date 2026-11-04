核验完成：当前 npm 版本下 `npm start` 直接报 `Missing script: "start"`。以下为静态审查结论。

---

## 路由与授权说明（按 skill 契约）

- **路由**：静态代码审查不在 `spec-dogfood` 适用范围内，契约指定的目的地是 **`spec-code-review`**。该 skill 未安装于本工作区，故由我直接完成静态审查。另外当前分支为 `main`（trunk）且仓库零提交，dogfood 流程本身也会在 Phase 0 拒绝运行——不存在可浏览器验证的 diff。
- **授权状态**：本次请求仅为检查，`local_fix_authorization: missing` → **所有发现只报告、不修改**（`fix_authorization_missing`）。`commit_authorization` / `landing_authorization` 均为 missing。

## 审查范围

`README.md`、`package.json`、`src/server.js`（全部为未跟踪新文件，即本分支全部改动）。`.claude/skills/spec-dogfood/**` 是 QA 工具链本身，不计入产品代码审查，如需单独评审请说一声。

## 发现（按严重程度）

### 🔴 高

1. **`src/server.js:10` — 非法 JSON 会导致整个进程崩溃。** `JSON.parse(body || '{}')` 的异常没有任何捕获：在 `'end'` 事件回调里抛出即为 `uncaughtException`，一条 `curl -X POST -d 'oops'` 就能杀掉服务，且客户端拿不到任何响应。修复方向：`try/catch` 后返回 `400`（需授权后实施）。

### 🟡 中

2. **`src/server.js:7-8` — 请求体无上限累积，可被内存耗尽。** `body += c` 不设长度上限，持续发送大 body 可撑爆内存。属防御性缺口，demo 亦建议加上限（如 1MB）后返回 `413`。
3. **`src/server.js:10-11` — 零输入校验，脏数据直接入账。** `amount`/`note` 不校验类型与缺失：空 body 也会写入一条 `{id, ts}` 的空记录；`amount` 可以是字符串、负数或任意对象，`GET /entries` 原样吐出。个人记账应用里这是数据正确性问题，不只是健壮性。
4. **`src/server.js:25` — 监听绑定全部网卡。** `server.listen(3000)` 默认 `0.0.0.0`，一个本地 demo 会暴露给整个局域网，叠加上面两条崩溃/耗尽缺陷。建议显式 `127.0.0.1`。

### 🟢 低

5. **`src/server.js:6,16` — URL 精确字符串匹配。** `/entries?limit=5`、`/entries/`（尾斜杠）都会落到 404；未来加查询参数即踩坑。可用 `URL` 解析后比对 pathname。
6. **`README.md:8` — “adding an entry requires five fields” 与代码不符。** 实际 POST 只需 `amount`、`note` 两个字段（README 第 6 行自己描述的存储结构也是 4 个键）。疑为旧版本文案残留。
7. **`package.json` — 无任何 `scripts`（已实测）。** `npm start` 报 `Missing script: "start"`；也没有 test 脚本（dogfood Phase 5 要求跑自动化套件时将无套件可跑）。建议补 `"start": "node src/server.js"`。
8. **`src/server.js:25` — 端口硬编码、`listen` 无 error 处理、启动无日志。** 端口被占时以未处理 `'error'` 事件崩溃；不支持 `PORT` 环境变量。
9. **`src/server.js:11` — `id: entries.length + 1` 是潜伏 bug。** 当前无删除接口所以暂不触发，但一旦引入删除，ID 立即复用。建议自增计数器或 `crypto.randomUUID()`。
10. **`src/server.js:9` — `req` 无 `'error'`/`'aborted'` 监听。** 客户端中途断开时 `'end'` 不会触发，留下一半累积的 `body`；流上未处理的 `'error'` 事件同样可能抛出。

### ⚪ 外观

11. **`src/server.js:12`** — POST 成功回 `200 'ok'` 更贴合 `201` + JSON 体；响应未设 `content-type`。

## 结论

30 行的 demo 服务，可用骨架是对的（GET/POST/404 分发清晰），但**当前状态不具备对外可用性**：一次非法 POST 即可整进程崩溃（发现 1），叠加全网卡监听（发现 4）。README 与实现存在事实性偏差（发现 6）。

后续可选（均需你明确授权）：**a)** 授权我按上述优先级做小幅修复（发现 1/3/4 属于小而明确的修法）；**b)** 对同一份 diff 跑内置 `/code-review` 做第二遍正式评审；**c)** 评审 `.claude/skills/spec-dogfood/**` 本身的质量。
