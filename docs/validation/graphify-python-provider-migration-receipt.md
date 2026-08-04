# Graphify Python Provider 迁移验证回执

日期：2026-07-12

状态：`cutover-approved`

## 结论

`graphifyy@0.9.12` 的 direct wheel、Python package identity、无 API key code-only 建图、query/path、host normalization、双 hook结构验证和journaled clean refresh均得到真实临时环境证据支持。U4/U5 已把上游 `graphify-out/` literal与错误host launcher限制在recognized Provider-owned surface内规范化；registry current pin已一次性切换到PyPI。

## 已确认事实

- PyPI JSON 返回 universal wheel `graphifyy-0.9.12-py3-none-any.whl`，SHA-256 为 `94f9d0d7ef68455a2055c7623fb9574c7a781afb1473d26c7936d1abfc14d62c`。
- 临时 `HOME`、`UV_TOOL_DIR`、`UV_TOOL_BIN_DIR` 中，`uv 0.11.19` 使用系统 Python 3.12.13 和 `--no-python-downloads` 成功安装该 direct wheel。
- 安装 inventory 为 `graphifyy==0.9.12` 加 29 个 transitive packages；本回执不把 transitive dependencies 表述为全量 hash locked。
- `graphify extract . --code-only` 在无 API key 环境中对一个 JavaScript fixture 生成 12 nodes、12 edges、2 communities 的 `.graphify/graph.json`。
- `graphify query common --graph .graphify/graph.json` 与 `graphify path run providerResult --graph .graphify/graph.json` 成功，并返回可回源到 fixture source 的节点与关系。
- 同机 npm baseline首次setup为fresh，约1.47秒，但发生semantic extract失败后回退到incremental update；Python candidate end-to-end setup为fresh，显式journaled clean refresh约1.15秒。
- Python Codex临时repo最终达到package/configured/artifact/query/hook全fresh；`.codex/hooks.json`绑定verified isolated launcher，post-commit/post-checkout均验证verified interpreter与`GRAPHIFY_OUT=.graphify`。
- 本迁移回执执行时，clean refresh曾在contained staging生成并验证后保留`.graphify.backup-*`，current root完成promote且journal清除。该迁移期行为已被稳态产品合同取代：当前显式refresh使用Provider-native `graphify update`原位更新，spec-first不再创建新的顶层staging/backup。
- `.cjs` fixture 未被 `0.9.12` classifier 识别，`.js` fixture可正常抽取。这是 candidate capability limitation，不能把任意 Node.js CommonJS repo 的覆盖率视为已确认。

## 已关闭的 cutover blockers

- Provider-owned skill/reference/rule/steering与recognized instruction section现在有界规范化到`.graphify/`，其他团队内容保持不变。
- Claude/Codex host hook command必须绑定verified absolute launcher；unexpected argv和cardinality fail closed。
- post-commit/post-checkout现在要求唯一Provider marker、唯一artifact env block、verified interpreter和允许的`_rebuild_code`命令；CLI status不能单独证明ready。
- Journal recovery unit test覆盖两次rename之间的staged/backup恢复；真实clean refresh覆盖backup/promote成功路径。
- 独立审查后的回归证明真实async/sync子进程在`inheritEnv=false`时看不到宿主API key，同时保留HOME/PATH/TMP/GRAPHIFY_OUT；Provider-owned Git hook marker也会清除API key/token/AWS/proxy变量。
- 恶意journal不能把staged/backup指向`src/`等任意仓库目录；恢复后会重新规划，避免对已恢复current graph继续执行陈旧first-generation action。
- verify-only会把缺host integration、supported corpus零节点图降级；Windows uv `.exe`与含空格launcher fixture确认tool-environment identity和安全command quoting。

## 当前迁移边界

Python `graphifyy` 是唯一受支持的Graphify runtime。迁移期失败恢复曾通过重装pinned Python wheel、恢复contained `.graphify.backup-*`并重新验证Python readiness完成；当前稳态refresh不再建立spec-first rollback副本，旧migration journal仅作为兼容恢复输入保留。

## 限制

本回执是 release-gate evidence，不是 Provider 输出正确性的 confirmed truth。Graphify 图仍属于 `provider_untrusted` advisory candidate；任何工程结论必须回到 source、tests、logs、contracts 或 owner evidence确认。
