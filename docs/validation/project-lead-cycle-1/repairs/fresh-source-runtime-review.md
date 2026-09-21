# Runtime 三项修复 fresh-source 复核

复核时间：2026-09-21T17:23:49+08:00。

结论：当前磁盘源码中的 `C1-U9-RUNTIME-001/002/003` 修复与原问题相符，本次有界复核未发现阻断关闭的新缺陷。此结论覆盖源码分支、文案约束与隔离单元测试；不等于真实 Provider 或宿主运行验收。

## 复核方式

- 复核者为非本轮修复作者的通用子 Agent；继承先前设计调查上下文，属于 fresh-source 复核，不是盲审或外部专家认证。
- 本轮直接读取当前磁盘 diff、模式策略、preflight、setup 入口及单仓/多仓 plan 消费分支，以及对应 Skill/合同说明和测试新增场景；没有使用缓存 typed-agent/Skill 的执行结果代替源码。
- 仅新增本复核文档，未修改产品源码、runtime 或其他人的文件；未真实调用或安装 Provider。

## 场景判断

| 问题 | 当前证据与判断 |
| --- | --- |
| `C1-U9-RUNTIME-001` | preflight mutation mode 已包含 bare。setup 在单目标 baseline 执行前解析 projection targets 并阻断非 current；missing/stale 用例检查 target/home 快照、mutation sentinel 与结构化 init remediation。current 用例确认 npm baseline 路径确实被调用；不把该调用当作安装成功。 |
| `C1-U9-RUNTIME-002` | parent bare/check 分支位于 projection preflight 前，但在 target 与 host authority 校验后；它直接返回 parent diagnostic，不进入 runSingleTarget/runWorkspaceBatch。bare、bare --all-repos、check 的子仓无 projection 场景仍返回诊断且 workspace/home 不变；显式批处理仍走原 projection gate。Skill 已明确父目录诊断与显式 batch 的区别，未扩大默认多仓写范围。 |
| `C1-U9-RUNTIME-003` | 单目标 runPlan 与父级 runWorkspacePlan 共用 planExecutionAdvice。installation 建议显式 --installation-only；artifact 建议显式 --only selected_ids；明确保留原 target/scope/selection/repair/refresh。参数等价用例覆盖 repo、folder、all-repos、requirement-workspace、repair、refresh 与 installation 子集；父级预览覆盖默认安装、显式图、隐式图选择，并核对父/子建议一致。 |

语义负例复核：普通 `--plan` 不得只去掉 `--plan` 后 bare 执行；父目录带 `--requirement-workspace` 的 artifact 预览必须带显式 `--only` 转执行，以免落回诊断；缺 projection 的单项目 bare 不得继续安装再在收尾补报告；父目录缺 child projection 不能阻止 bare/check 的只读诊断。当前源码及统一模式矩阵均支持这些约束。

## 本次实际验证

```text
npx --no-install jest --runInBand tests/unit/mcp-setup-mode-target.test.js tests/unit/mcp-setup-workspace-parent-diagnostic.test.js tests/unit/mcp-setup-entrypoint.test.js
exit_code: 0
Test Suites: 3 passed, 3 total
Tests: 155 passed, 155 total
Snapshots: 0 total
Time: 18.734 s
```

这些测试使用临时 Git/filesystem fixture 与 fake runner；真实 Git 仅用于临时 fixture。Provider/npm 动作为模拟结果，不证明外部安装、网络、真实图构建或 GUI loader/invocation 成功。`mcp-setup-contracts.test.js` 本次读取了相关 diff，但未纳入上述命令，不计入本次 155 项结果。

## 覆盖限制

- 本次聚焦新增与相关消费分支，未逐行重审 setup/executor 的全部旧逻辑，也未全量复核 CodeGraph/Graphify Provider、安全路径、全部 host config 或 workspace graph 生命周期。
- missing/stale/current 新增用例直接覆盖单仓 bare；嵌套 folder 的 enclosing projection 路径由既有 explicit-only entrypoint 测试及共享 target resolver 支撑，未新增 bare × 全 topology × 全 host 笛卡尔组合。
- current 正例证明通过 gate 后实际进入 baseline mutation 路径；不承诺完整 Provider readiness。
- planExecutionAdvice 仍是供调用方/LLM 消费的文本建议。参数等价测试验证按建议保留参数时的 scope，不是自动执行接口，也不保证任意宿主模型遵循建议。
- SHA-256 标识复核时点字节，不代表每个文件全文语义覆盖；后续源码变化需要重新判断本结论的适用性。

## 复核时点 SHA-256

| 文件 | SHA-256 |
| --- | --- |
| `skills/spec-runtime-setup/SKILL.md` | `cb04249d533bb6c92581cbc8c90d9ab84383d045c495fe62f8902093515b6795` |
| `skills/spec-runtime-setup/scripts/setup.cjs` | `40e3ebe91b0eda2a7d03840afe7a35d211d1d0774fdade483ab56aabd5ad30fa` |
| `skills/spec-runtime-setup/scripts/lib/mode-policy.cjs` | `eb22b73dddb9eb1d0eeb7bba56e49f135f0a5f110ffb46817878ae9f1ddf9403` |
| `skills/spec-runtime-setup/scripts/lib/workspace-executor.cjs` | `c9756b9aff8d68e98b8be7d2e571aa98ac3bdf5b72348b6fa2c207305b29f5cf` |
| `skills/spec-runtime-setup/scripts/lib/workspace-runtime-preflight.cjs` | `b6dd6cdd497ccaf12c116392c77d1145e141faa496dc72a735b3397dc35980f7` |
| `skills/spec-runtime-setup/references/supported-mcp-tools.md` | `9394b742edfdf9843c7e47fe4e38bf44e9028bf4152d66ab8e70cc2309899cc1` |
| `docs/contracts/provider-readiness.md` | `49c5d8bf9c1a8dfa01885127d186d29e7154ff270991d3f64fc86adcd56f44ea` |
| `tests/unit/mcp-setup-entrypoint.test.js` | `48c95d71718d6de319672405509a02612f43972b17439ff9a34c72868ceb3e3b` |
| `tests/unit/mcp-setup-mode-target.test.js` | `85027c83ba763fb412fc3a6e1b60335e01b8b0754be85a8f513890483424825c` |
| `tests/unit/mcp-setup-workspace-parent-diagnostic.test.js` | `7708129643effa44a5669ff2f8e6c709ef3a027bad0180308da5b7cc4a2a8515` |
| `tests/unit/mcp-setup-contracts.test.js` | `803549c3b33ad925343a0d79e3349993945355bd86adf1a3c7991d5b7311bbd5` |
