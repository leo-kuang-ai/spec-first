两件事都有结果了。先按 skill 汇报 setup 状态,再给架构评审。

## 一、Runtime Setup 状态(未就绪,被安全门阻断)

| 分组 | 状态 |
|---|---|
| 基线依赖 (`baseline_ready`) | **unknown** — MCP `sequential-thinking` / `context7` / `codegraph` 均 `host-config-not-verified` |
| Provider | codegraph `project-not-initialized`;graphify `provider-not-installed`(安装范围都未完成) |
| Helper 工具 | ast-grep / ffmpeg / gh / silicon / vhs **ready**;agent-browser degraded(report-only,不阻断);ast-grep-skill optional degraded |
| Generated runtime manifest | **missing** — 根因见下 |
| 项目本地配置 | 示例配置 missing;本地 override `defaults-active`(非阻断);`.spec-first/*.local.yaml` ignore 规则 missing |
| Setup facts | `tool-facts.json`、`runtime-capabilities.json` 均 missing |

**为什么裸调用被阻断 (`host-invocation-surface-unverified`)**:`.claude/` 里只有手工放入的 skill 目录,不是 `spec-first init` 生成的主机 runtime projection,mutation 模式按契约 fail-closed。`spec-first` CLI 已在 `/opt/homebrew/bin/spec-first` 可用。按 skill 约定,**执行 `spec-first init` 需要单独的 runtime mutation 授权**,所以我没有代跑——你确认后我就执行 `spec-first init`,随后重跑 baseline setup 收敛。按 Readiness Handoff 规则,setup 未就绪,这里不给任务模板。

## 二、架构评审:`src/server.js`(26 行,已通读 + 实测验证)

先说结论:**作为 demo,单文件可以接受;但它没有任何"接缝"——无导出、无存储边界、无错误路径,README 里自己列的路线图(分类、汇总视图)一落地就会把所有逻辑挤进同一个 handler。**

**P0 — 一个请求就能打死整个进程(已实测验证)**

`src/server.js:10` 的 `JSON.parse` 没有 try/catch,异常在 `'end'` 回调里抛出成为 uncaught exception。我实际启动了服务验证:`POST /entries` 带非法 JSON 后,进程直接退出(exit 1),后续 GET 连接被拒。修复只需 try/catch → 返回 400。

**P1 — 结构性问题(不可测试、不可组合)**

- `src/server.js:25` 在 require 时立即 `listen`,且**整个模块无 `module.exports`**——无法被测试引入(require 即占端口),也无法把 handler 复用为库。惯用做法:`module.exports = server` + `if (require.main === module) server.listen(...)`。
- 模块级 `entries` 闭包变量(`src/server.js:3`)让存储、路由、传输耦合在一处;将来换持久化就得重写 handler。建议最小分层:`store.js`(内存 store + 单调 id 计数)→ `app.js`(buildServer(store))→ 入口(只管 listen)。

**P2 — 设计缺陷**

- **id 策略**:`entries.length + 1`(`src/server.js:11`)一旦将来加删除功能就会产生重复 id,应改为单调递增计数器。
- **无输入验证**:`amount` 类型/正负不校验;`body += c` 无大小上限(无界内存累积)。
- **监听面**:`server.listen(3000)` 未指定 host,默认绑 `0.0.0.0`——"personal" 应用对整个局域网可写;且端口硬编码、无 `EADDRINUSE` 处理(端口占用同样会崩进程)。建议 `listen(process.env.PORT ?? 3000, '127.0.0.1')` + `server.on('error', ...)`。
- **路由精确匹配**:`req.url === '/entries'` 使 `/entries?x=1` 也 404;POST 响应无 content-type/status 纪律(裸 `'ok'`),与 GET 的 JSON 响应不一致。

**P3 — 文档与工程卫生**

- README 说"adding an entry requires five fields",代码实际只收 `amount`、`note` 两个字段——文档漂移,二者需对齐。
- `package.json` 无 `scripts`(没有 `npm start`/`test`);仓库尚无任何 commit、无 `.gitignore`(setup 之后会写入 `.spec-first/`、`.codegraph/`、`graphify-out/`,需要 ignore 规则)。

要不要我:①先跑 `spec-first init` + 重跑 setup(需你授权);②顺手把 P0 的 JSON 崩溃修掉(几行改动)?
