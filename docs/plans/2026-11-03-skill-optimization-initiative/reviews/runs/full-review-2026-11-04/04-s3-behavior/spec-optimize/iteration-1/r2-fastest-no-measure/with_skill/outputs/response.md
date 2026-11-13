环境确认：仓库还没有任何 commit（全部文件未跟踪）、Node v22.22.3 可用、无既有运行状态 → 全新运行。

## Phase 0：目标定义与 spec 提案

**服务现状**（`src/server.js`）：每次 `GET /entries` 都对整个数组做 `JSON.stringify`（O(n)，随数据量增长）；`POST` 用字符串拼接累积 body。这是吞吐的主要可优化成本。

「最快」需要变成可测量的定义。我的提案——**固定混合负载下的吞吐（rps，越高越好）**，同时用必需目标约束 p99 延迟不退化、用退化门禁保证行为正确（防止“缓存永不失效”“多进程状态不一致”这类投机解骗过指标）。

**基准负载**（写入 `bench/bench.js`，零新依赖）：固定并发 10、时长 8s、80% GET / 20% POST、预置 1000 条种子数据、固定随机种子保证每次请求序列一致；每次测量新起服务进程。每次测量约 15s，重复 3 次取中位数。

```yaml
name: miniledger-speed
description: 提升 mini-ledger 在固定混合负载下的吞吐，不改变 API 行为

metric:
  primary:
    type: hard
    name: rps              # 总吞吐，maximize
  degenerate_gates:
    - name: error_count
      check: "== 0"        # 负载期间零失败请求
    - name: correctness_ok
      check: "== 1"        # 结束时 GET 条数=种子+POST 数，抓缓存/一致性问题
  objectives:
    - name: p99_ms         # 必需目标：延迟不得相对退化 >10%
      direction: minimize
      role: required
      max_regression: { type: relative, value: 0.1 }
  diagnostics: [p50_ms, p95_ms, get_rps, post_rps]

measurement:
  command: "node bench/bench.js"
  timeout_seconds: 180
  stability:
    mode: repeat
    repeat_count: 3
    aggregation: median
    comparison: { method: relative, relative_threshold: 0.05 }  # 改善>5%才算真提升

scope:
  mutable: ["src/"]                       # 只允许改服务实现
  immutable: ["bench/", "package.json", "README.md", ".claude/", ".spec-first/"]

execution: { mode: serial, backend: worktree, max_concurrent: 1 }   # 首次运行保守配置

constraints:
  - "API 契约不变：POST 返回 'ok'；GET 返回按插入顺序的完整 JSON 数组 {id,amount,note,ts}"
  - "默认仍监听 3000 端口"
  - "不新增运行时依赖，仅用 Node 内置模块"
  - "数据保持进程内存态"

stopping: { max_iterations: 4, max_hours: 1, plateau_iterations: 3 }
```

**测量执行授权**（跑基线前需要你确认的执行包）：
- 命令：`node bench/bench.js`，cwd = 项目根目录
- 影响：只读项目文件；本地启动子进程监听 3000 端口；结果仅写入 `.spec-first/`

**另需授权**：仓库目前零 commit，worktree 隔离实验需要先在 main 做一次初始 commit（现有 4 个文件），再建 `optimize/miniledger-speed` 分支。

请选择（回复编号即可）：

1. **批准**——保存 spec、初始 commit、建分支、搭基准并跑基线（跑完会再给你看基线数据后才进入实验）
2. **调整指标/负载**——比如你想以 p99 延迟为主指标，或换负载比例/数据规模
3. **调整预算**——默认 4 轮实验 / 1 小时，可加码
4. **先讨论**——对“最快”的定义有其他想法
