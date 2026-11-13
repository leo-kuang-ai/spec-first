取证完成。这是一个极小仓库，先说结论再给 preview。

## 仓库盘点

| 项 | 结论 |
|---|---|
| 形态 | 单包 Node.js demo（`mini-ledger`），无 workspace |
| 人写源码 | 仅 `src/server.js`（26 行，CommonJS，零依赖） |
| 交叉佐证 | `package.json`（无 `"type"`、无 deps、无 scripts/lint）、`README.md`（端点与数据 shape 文档） |
| 测试 / lint | 均不存在 |
| 已有 agent 规则文件 | 无（首次执行，不存在 refresh 问题） |

⚠️ **样本限制（重要）**：全仓库只有 1 个源码文件。CommonJS、零依赖、数据 shape 有 package.json/README 交叉佐证；路由 if-return、响应风格在文件内出现 2 次；其余为单点模式，措辞已相应收窄。

---

## Preview ①：规则正文（将写入 `docs/ai/project-rules.md`）

````markdown
<!-- spec-rule-miner-start -->
# Project Rules — mini-ledger

适用范围：单包仓库 `mini-ledger`（Node.js HTTP demo，入口 `src/server.js`）。

## 模块与技术栈

- 使用 CommonJS：模块加载用 `require(...)`，不使用 ESM `import`/`export`（`package.json` 未设 `"type": "module"`）。
- 零运行时依赖：只使用 Node 内置模块（当前仅 `http`），不引入 express 等框架或任何第三方包。

## 路由与请求处理

- 路由用 `req.method === '<METHOD>' && req.url === '<path>'` 的 if 精确匹配实现；每个分支处理完后立即 `return`，未匹配的请求落到末尾统一 404 兜底（`res.statusCode = 404; res.end('not found')`）。新增端点沿用这一 if-return 结构，不引入 router/middleware 层。
- 请求体手动累积：`req.on('data', (c) => { body += c; })` 加 `req.on('end', ...)`；空 body 用 `body || '{}'` 回退。
- handler 保持同步回调风格，当前未使用 `async/await`。

## 数据与响应

- 数据存模块级 in-memory 数组（`const entries = []`），新记录直接 `push`，无数据库、无持久化层。
- 记录 shape 固定为 `{ id, amount, note, ts }`：`id` 用 `entries.length + 1` 生成，`ts` 用 `Date.now()` 毫秒值。
- 响应不使用统一 envelope：写操作返回纯文本短响应（`'ok'`）；读操作手动 `res.setHeader('content-type', 'application/json')` 加 `JSON.stringify(...)`。
- `README.md` 与 handler 保持同步：端点列表和 entries 数据 shape 在 README 中有约定，新增或修改端点/字段时同步更新 README。

## Anti-patterns（本仓库现有代码不使用的写法）

- 不做请求校验：`JSON.parse` 后直接解构使用字段，缺字段不报错；新增代码在任务未明确要求时沿用轻量做法，不引入 schema 验证库。
- 不读 `process.env`：端口等配置直接硬编码（如 `server.listen(3000)`）。
- 源码内不写注释、不写 JSDoc；项目说明集中在 `README.md`。

## 适用与失效边界

本规则块仅适用于 `mini-ledger` 单包仓库（`src/server.js`、`package.json`、`README.md`）。各规则的代表性源码（`src/server.js` 的路由、数据 push 与响应分支，`package.json` 的依赖声明）发生变化，或出现相反证据（如引入框架、ESM、持久化）时，相关规则须重新核实；未重新核实前不得作为强制依据。
<!-- spec-rule-miner-end -->
````

**字数**：约 520（中文按字符折算，含代码 token），低于 1000 上限。

## Preview ②：目标文件（均为新建，无旧块冲突）

1. **`docs/ai/project-rules.md`** — 上述完整规则块
2. **`AGENTS.md`** — pointer（markers 包住）：
   > 本项目 AI 编码规则以 `docs/ai/project-rules.md` 为唯一来源，编码前必须阅读并遵守。
3. **`CLAUDE.md`** — pointer，用 Claude Code 原生 import：`@docs/ai/project-rules.md`

## Evidence Summary（不写入规则文件）

| 规则组 | 代表性 source refs |
|---|---|
| 模块与技术栈 | `src/server.js:1`、`package.json`（无 type/deps）、`README.md:3` |
| 路由与请求处理 | `src/server.js:6-22`（2 个 if-return 分支 + 404 兜底）、`src/server.js:7-10` |
| 数据与响应 | `src/server.js:3,11,17-18`、`README.md:6` |
| Hidden association（README↔handler 同步） | `README.md:5-6` ↔ `src/server.js:6-19` |
| Anti-patterns | `src/server.js:10`（无校验）、`src/server.js:25`（硬编码端口）、全文件零注释 |

## Limitations

- **样本极小**（1 个源码文件、26 行）：仅路由分支和响应风格达到"文件内 2 次出现"，其余依赖单一文件 + 配置/README 佐证；无第二源码文件可验证一致性。
- 无测试、无 lint/formatter 配置：测试风格与表层格式（2 空格、单引号、分号）**未**写成规则，前者无证据，后者属生态默认。
- 未发现历史例外或迁移期反例（README 的 "Known rough edges" 是功能缺失，非风格例外）。

---

请确认：是否按以上内容写入这 3 个文件？也可以只写部分（例如只要 `docs/ai/project-rules.md`），或先调整规则内容。
