看完了。这个库本体是 26 行的 `src/server.js`（内存版记账 demo），外加 vendored 的 `.claude/skills/` 工具链。总体判断：**单文件、零依赖的粒度对这个规模是对的，没有过度设计；真正的问题不在“分层不够”，而在健壮性和可组合性**。按严重度排：

## 应用层问题（src/server.js）

**1. 非法 JSON 会打崩整个进程 — `src/server.js:10`**
`JSON.parse` 在 `'end'` 事件回调里裸奔，没有 try/catch。任何客户端发一段非法 JSON 就是未捕获异常，Node 默认直接退出——单用户就能远程 DoS。这是最严重的一条。

**2. 请求体无上限累积 — `src/server.js:8`**
`body += c` 不限量，即使 JSON 合法，超大 body 也会把内存吃穿。和第 1 条一起构成输入处理完全无防护。

**3. require 即启动服务，且不可测试 — `src/server.js:25`**
`server.listen(3000)` 是模块级副作用，而 `package.json` 还把 `main` 指向这个文件——意味着 `require('mini-ledger')` 就会监听端口。没有导出 `server`/`entries`，写不了测试，也组合不了。端口硬编码且没监听 `'error'` 事件，端口被占同样是崩溃。惯用修法：导出 app、用 `require.main === module` 守住 listen、端口走 `process.env.PORT`。

**4. `id: entries.length + 1` 是潜伏的 ID 冲突 — `src/server.js:11`**
现在没有删除接口所以碰巧唯一；一旦加删除，ID 立刻复用。该用单调计数器或 `crypto.randomUUID()`。

**5. 零输入校验 — `src/server.js:10-11`**
`amount` 可以是字符串、负数、缺失（空 body 解析成 `{}` 后存入 `undefined`）。README 自己也承认这是 rough edge，但从架构上讲，验证层的缺位会让后续加分类/汇总功能时每个消费点都要防御。

**6. URL 精确匹配太脆 — `src/server.js:6,16`**
`/entries/`、`/entries?limit=5` 都会 404。小问题，但典型的“第一个用户”级破损。

## 工程化层面

- **`package.json` 没有 `scripts`**：没有 `start`/`test`，`npm start` 直接失败，只能 `node src/server.js` 手敲。
- **`.mcp.json` 和 `.claude/settings.json` 都是空 `{}`**：脚手架残留，要么配置要么删掉。
- **整个 spec-runtime-setup skill（约 70 个文件）vendored 进应用仓库**：如果这个 repo 的产品是 MiniLedger，工具链应该放用户级 `~/.claude/skills/` 或以插件引入，而不是和应用代码同仓——现在应用与工具链的耦合是目录级的。另外目前**还没有任何 commit**，全部文件 untracked，正好趁现在决定哪些进版本库。
- **无 `.gitignore`**：目前无依赖无产物问题不大，但后续 `.spec-first/` 本地配置出现时需要覆盖。

## 合理之处

单文件不拆层、CommonJS 零依赖（无供应链面）、README 如实标注缺陷、工具链隔离在 `.claude/` 下不污染 `src/`——这些判断都是对的。

---

Setup 边界收尾：本次没有运行任何 setup 动作（架构审查属语义工作，不在其职责内）；如果你之后需要准备 CodeGraph/Graphify 等运行时能力，再显式跑 `/spec-runtime-setup --check` 即可。

要不要我顺手把 1–4 修掉？都是十行以内的小改动。
