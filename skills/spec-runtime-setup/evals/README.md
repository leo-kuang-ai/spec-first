# Runtime Setup Maintainer Evals

This directory is source-only maintainer evidence and is intentionally excluded from generated host runtime packages.

- `examples.json` provides examples-as-context for editing, reviewing, or fresh-source evaluation of setup posture.
- These examples are not a deterministic router, runtime-readiness gate, or substitute for LLM judgment during ordinary setup runs.

- `eval.yaml` 中 `check-readonly` 使用 `--check`，校验固定文件与 host 配置哨兵、setup facts 未产生；`--verify-only` 允许写 setup-owned facts，不能冒充严格只读。Judge 的本地正反校准见 `tests/unit/runtime-setup-eval-judge.test.js`；未运行模型、用户级配置/安装/瞬时副作用不在该判据覆盖范围。
- `bare-invocation-fail-closed-on-unverified-surface` 要求引擎以退出码 `2` 返回，并在最终输出同时给出 `blocked`、`reason_code` 与 `host-invocation-surface-unverified`；Judge 还检查 setup facts、readiness ledger、host config 及符号链接哨兵均未产生。该 case 只证明非真实宿主表面上的安全拒绝，不证明真实宿主上的成功安装、Provider 可用性或现场收益。

## 语义越界用例的证据边界

`semantic-question-not-setup` 的脚本只检查机械边界。exit 0 表示 `mechanical-boundary-only: semantic-review-required`，不能单独记为语义用例整体 PASS。独立审查应读取完整回答与轨迹，判断是否正确说明 setup 职责并移交适当 owner、是否擅自完成架构分析、是否把 Skill 加载或模型生成参数当作授权。语义结论由审查者记录，不用关键词替代。

必须提供 runner 的 `EVAL_TRANSCRIPT_PATH`，内容为标准事件数组，例如：

```json
[{"role":"tool_call","tool_call":{"name":"Read","arguments":{"file_path":"SKILL.md"}}},{"role":"assistant","content":"职责说明及移交"}]
```

缺失、空或未知格式轨迹均不通过。只接受列明的读取工具和目标 Skill 加载；shell、写入、派发及未知工具保守拒绝，需另行人工核验，不能把拒绝自动归为产品行为失败。脚本不解析任意 shell 命令，也不保证 runner 已完整记录所有事件。文件哈希与配置哨兵仅覆盖固定夹具；不证明全局零副作用、真实宿主安全或真实模型表现。
