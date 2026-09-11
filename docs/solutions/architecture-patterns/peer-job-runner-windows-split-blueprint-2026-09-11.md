---
title: peer-job-runner Windows 块拆分蓝图（含治理 trip-wire 与重估条件）
date: 2026-09-11
last_updated: 2026-09-11
category: docs/solutions/architecture-patterns
module: peer-job-runner
problem_type: architecture_pattern
component: skill_local_scripts
severity: medium
applies_when:
  - peer-job-runner.py（三副本 ×2.2k+ 行）需要结构性拆分
  - 任何要在 skills/ 下新增包路径的重构（先读"治理 trip-wire"节）
  - CE 同步批次计划携带拓扑变更时
tags: [peer-job-runner, windows, split, ce-localization, governance, code-review-followup]
---

# peer-job-runner Windows 块拆分蓝图

## Context

2026-09-11 全面代码审查（finding #4，P2/75，validator 确认）：`peer-job-runner.py` 在
spec-code-review / spec-doc-review / spec-pov 三处各持一份 byte-identical 副本，本批
同步后达 2220 行，且向 Windows PID-reuse 身份防护又新增约 190 行——"已超 1k 阈值仍
持续加面不拆分"。拆分原型当日已完成并通过静态审计与全部 POSIX 测试（runner
2220→1747 行），随后因治理链回退；本文沉淀该蓝图，供下一次 CE 同步/adjudication
批次直接执行。

## 治理 trip-wire（先读：为什么不能随手拆）

**skills/ 下新增任何包路径都会改变 CE-localization inventory 的源宇宙**：
live `package_path_count` 与冻结工件 `docs/validation/ce-localization/skill-inventory.json`
（1122）失配 → closeout 工件（scenarios/baselines/ledger）经
`validateCloseoutArtifacts` 与 inventory 绑定 → 完整重生成走
`scripts/generate-ce-localization-closeout.cjs` → `assertCurrentUpstreamBinding`
要求 adjudication 与当前源快照 hash 一致，且脚本被显式禁止重绑 LLM adjudication。

结论：**拓扑变更（加/删文件）必须随 CE 同步/adjudication 批次执行**；文件内容修改
不受此约束（inventory 冻结路径计数与 closeout 拓扑，内容事实走 `spec-first init`
的确定性重绑）。计数漂移测试已升级为自解释错误（列出路径差集与 remediation），
撞线时不需要考古。

## 拆分蓝图

### 边界与依赖事实（已 AST 验证）

- 拆分对象：`if IS_WINDOWS:` 块，原 424–905 行（注释头 412–423 随块迁移为模块
  docstring）——ctypes 声明、DLL 句柄、SID 所有权、进程身份/终止原语。
- 块近乎自包含：对外仅依赖纯函数 `_pre_reuse_descendant_pids`（kill-set 构造器）
  与 stdlib（os/subprocess/ctypes/msvcrt）；不引用 `RunnerError` 等主文件名。
- 反向依赖：主文件用到块内 13 个名字（`_CREATE_SUSPENDED`、`_WIN_NO_WINDOW`、
  `_win_assign_to_job`、`_win_create_job`、`_win_harden_acl`、`_win_job_name`、
  `_win_kill_tree`、`_win_owns_handle`、`_win_owns_path`、`_win_pid_alive`、
  `_win_process_identity`、`_win_process_identity_matches`、`_win_resume_process`）。

### 目标结构

```
skills/<skill>/scripts/peer-job_win.py   # ~514 行，仅 Windows 导入（顶层 ctypes.WinDLL）
skills/<skill>/scripts/peer-job-runner.py # ~1750 行
```

三副本继续 byte-identical（含 peer_job_win.py），由
`tests/unit/skill-script-mirror-parity.test.js` 自动发现锁定，无需手工枚举。

### 设计决策（v2，相对原型的两处改进）

1. **纯函数用参数传递，不做模块全局注入**。原型用
   `peer_job_win._pre_reuse_descendant_pids = _pre_reuse_descendant_pids` 注入；
   v2 改为在唯一调用点显式传参：
   `_win_kill_tree(root_pid, grace, job_name, expected_identity, kill_set_builder=_pre_reuse_descendant_pids)`。
   依赖显式化，消除跨模块全局突变。
   `_pre_reuse_descendant_pids` 必须留在 runner（POSIX importlib 可加载、行为测试
   在 `tests/unit/peer-job-runner-killset.test.js` 锁定语义），不能搬进顶层带
   `ctypes.WinDLL` 的 win 模块。
2. **用 `__file__` 相对 importlib 加载 sibling，不依赖 `sys.path[0]` 假设**：
   `spec_from_file_location('peer_job_win', Path(__file__).with_name('peer_job_win.py'))`。
   对嵌入式/非常规调用方式更稳健。禁止让 win 模块反向 import runner——脚本以
   `__main__` 执行时会造成双重模块执行。

### 验证清单

- `python3 -m py_compile` 双文件 ×3 副本（注意清理 `__pycache__` 残留）。
- AST 交叉审计：runner 无未导入的 `_win_*` 悬空引用；win 模块无未定义加载。
- POSIX 全量：`peer-job-runner-killset` / `spec-code-review-peer-runner` /
  `skill-script-mirror-parity` / `peer-job-runner-parity`。
- 同批次内完成 CE adjudication 并重生成 closeout 工件（消除 1122→1125 漂移）。
- Windows 行为面（reap/kill-tree）无 POSIX 可执行测试，批次落地时应在 Windows CI
  或真机冒烟一次 `reap` 路径。

## Anti-patterns

- 为绕过 trip-wire 手改冻结计数或 closeout 工件——伪造 governed 证据，脚本守卫
  （`scripts cannot rebind an LLM adjudication`）存在的原因就是防这个。
- 把 win 模块反向 import runner，或为测试把 `ctypes.WinDLL` 移出顶层（破坏
  "仅 Windows 导入"契约）。
- 拆分与语义变更混入同一批次——拆分批次应纯为代码移动，语义已被 kill-set 行为
  测试锁死，混入语义变更会放大 Windows 不可测面的回归风险。

## invalidation condition

- 若 peer infra 收敛为单 skill 所有（副本 ×3 设计被放弃），本文边界事实作废。
- 若 CE-localization 引入"机械拓扑增量"受控通道（content-hash lineage 证明 +
  scope-limited 重绑），trip-wire 节的流程要求以该通道契约为准。
