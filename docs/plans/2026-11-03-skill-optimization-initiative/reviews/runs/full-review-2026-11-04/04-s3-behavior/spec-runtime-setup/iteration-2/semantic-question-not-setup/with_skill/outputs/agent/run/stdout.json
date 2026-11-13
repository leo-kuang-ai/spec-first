核对完毕。先交代一下这个仓库的真实构成，再给评审结论。

## 这个“代码库”是什么

仓库里其实是两个互不相关的东西：

| 组成 | 规模 | 性质 |
|---|---|---|
| mini-ledger 应用（`src/server.js` + `package.json` + `README.md`） | 26 行代码 | 个人记账 demo |
| `.claude/skills/spec-runtime-setup/` | 1.2MB、60+ 文件 | 你安装的 skill 工具链 |

另外 `.mcp.json` 和 `.claude/settings.json` 都是空 `{}`，git 仓库**零提交**（全部文件 untracked）。

## 应用本身：作为 demo，架构选择合理，但有真实缺陷

先说合理的部分：零依赖、原生 `http` 模块、单文件、内存存储且 README 明示取舍——对一个 demo 目标来说这是正确的克制，26 行不值得拆模块或上框架。

问题按严重程度排：

**P0 — 一个请求就能打死服务**：`src/server.js:10` 的 `JSON.parse(body || '{}')` 在 `req.on('end')` 回调里没有 try/catch。任何客户端发一段非法 JSON（`curl -X POST localhost:3000/entries -d 'oops'`），异常就成为 uncaughtException，Node 默认直接退出进程。这是健壮性兼安全缺陷，其余都是次要的。

**P1 — 正确性/API 设计**：
- 无任何输入校验：`amount` 可以是字符串、负数、任意嵌套对象；`body += c`（`src/server.js:8`）无大小上限，可无限累积耗内存。
- POST 返回 `200` + 纯文本 `'ok'`，GET 才是 JSON（`src/server.js:12`）——REST 语义上创建应返回 `201`（最好带资源体），两种端点返回格式也不一致。
- id 用 `entries.length + 1`（`src/server.js:11`）：现在只增不删没问题，一旦支持删除立即产生重复 id。应改用独立单调计数器。
- `server.listen(3000)`（`src/server.js:25`）默认绑 `0.0.0.0` 且无 `error` 事件处理——"personal demo" 应绑 `127.0.0.1`；端口被占会裸栈崩溃。

**P2 — 工程化与文档**：
- README:8 说“添加条目要手填五个字段”，但代码只接受 `amount`/`note` 两个——文档与实现已经漂移。
- `package.json` 无 `scripts`（没有 `npm start` 入口）、无 `engines`、无测试。
- 无 `.gitignore`。

## 仓库结构：主要问题在这里

1. **`.claude/`（1.2MB skill）和 30 行 demo 混在一个仓库**。skill 是用户级工具，惯例放 `~/.claude/skills/` 或独立仓库；留在 demo 仓库里，后续任何 commit 都会把 1.2MB 工具链和应用绑死，diff 噪音也大。建议先决定归属再提交。
2. **两个空配置文件**（`.mcp.json`、`.claude/settings.json` 都是 `{}`）没有承载任何内容，只会让宿主加载空配置，建议删除或填实。
3. **零提交**：git init 后没有任何 commit，目前一切处于未跟踪状态，等于没有版本控制。

## 建议的动作顺序

1. `src/server.js:10` 加 try/catch + 请求体校验（修复 P0）
2. 绑定 `127.0.0.1`、POST 改 201、id 换独立计数器
3. 决定 `.claude/` 去留 → 删空的 `.mcp.json` → 加 `.gitignore` → 做初始 commit
4. 修正 README 的“五字段”描述

另外按 skill 的边界说明一句：spec-runtime-setup 已完整安装（registry v11），但本次架构审查走的是直接源码证据，不需要、也没有运行它；如果你之后想在这个仓库实际执行 runtime setup（安装 CodeGraph/Graphify 等），明确说一声即可，我会按它的模式矩阵预览后再动手。
