# Stage 5 — spec-compound（知识沉淀判断）

- 会话：独立 `claude -p`，模型 `glm-5.3`；临时仓库根 `/tmp/sup-phase5-20261112-101028/repo`
- prompt：`stage-5-prompt.txt`；原始流：`stage-5.jsonl.gz`；stderr：`stage-5.stderr`
- 退出码：0；`subtype: success`；`is_error: false`；turns 35；成本 `$0.03028884`；时长 639.0s
- 工具使用（34 次）：`Read`、`Bash`、`Glob`、`Write`

## 结论

- **存在 1 条合格知识**，已写入 `docs/solutions/best-practices/node-test-teardown-server-close-keepalive.md`（89 行）。
- 判据（会话自述）：实施 diff 的其余内容（前缀路由顺序、表征测试先行、`require.main` 守卫接缝、month 期望推导）都能从代码与计划直接恢复，不满足沉淀入门标准；唯一例外是 teardown 连接语义——`test/server.test.js:17` 的注释把「keep-alive 挂起 `close()`」当作事实，会话用一次性实验（node v22.22.3）证明该表述对当前运行时**不精确**。
- 知识文档结构：frontmatter 含 `module` / `problem_type: best_practice` / `component: testing_framework` / `severity: low` / 非空 `source_refs`（4 项，均为 `file:line` 或计划路径）/ 非空 `invalidation_condition`（含失效触发与只读核查方式）；正文含实测对照表、Guidance、Why This Matters、When to Apply。
- `CONCEPTS.md`：扫描后无合格术语，未创建；`docs/solutions/` 此前为空语料，无重叠文档；无 egress 授权，未做 GitHub issue 检索。

## 核心实测（会话内一次性脚本，node v22.22.3）

| close 时刻连接状态 | 只调 `server.close(cb)` | 先 `closeAllConnections()` 再 `close()` |
| --- | --- | --- |
| 全部 socket 空闲（含 body 未消费） | 立即触发 | 立即 |
| 存在在途请求 | 请求 1535ms 完成，close 回调 4545ms（等 keep-alive 自然超时） | 124ms |

## 降级与限制（会话自述，已核对）

- `worker_dispatch_authorization: missing`、`capability_probe: not_applicable`：无 worker、无 egress；语义验证为 inline，不构成独立覆盖。
- 打包校验器（`validate-frontmatter.py` / `validate-doc-claims.py`）因 Bash 权限被拒不可执行，改为等效手工检查（分隔符、标量安全、`source_refs` 非空、`invalidation_condition` 非空、引用路径存在）。
- 建议但未应用的指令文件改动：`CLAUDE.md` 未提及 `docs/solutions/`，会话按 headless 禁改规则只提出建议，不落盘。
- `scratch: unavailable`（`mktemp` 权限拒绝），Phase 1/2 工件只保留在会话内联上下文，未物化到磁盘。

## 本会话的独立复核（非 transcript 声明）

- 直读 `docs/solutions/best-practices/node-test-teardown-server-close-keepalive.md`：frontmatter 必填项齐全、`invalidation_condition` 非空且给出只读核查方式，正文论断与实测表一致。
- 未重新执行其 teardown 实验（成本与收益不匹配），报告中按「会话自报实测」标注，不升级为本会话 confirmed。
