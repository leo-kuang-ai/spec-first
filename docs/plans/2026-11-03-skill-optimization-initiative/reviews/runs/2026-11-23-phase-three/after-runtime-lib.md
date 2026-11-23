## spec-runtime-setup

| 包相对路径 | 增/删/改 | 具体中文判断 |
|---|---|---|
| `scripts/lib/args.cjs` | 改 | L03：入口解析器不再丢掉无值的 `--version`；模式解析返回 `missing-option-value`，不授予默认安装能力。带版本值的元数据用法不变。 |
| `scripts/lib/renderer.cjs` | 改 | L06、L07：从 tool facts 取实际目标，以本轮选择生成只读计划；安装范围不输出构图建议。恢复事务优先于 provider 重试。manifest 已知缺失或陈旧时，不再同时建议继续 workflow。 |
| `scripts/lib/runtime-executor.cjs` | 改 | L04、L06：重读配置不再抹掉事务的备份位置或遗留锁；单项结果与配置收据只带必要恢复字段。把原参数传给人读层以保留工作流、刷新及输入范围。 |
| `scripts/lib/workspace-executor.cjs` | 改 | L08：批验证区分「请求范围通过」和「全部图已验证」；复核选中 provider 的安装与接线、基线及 manifest，把子仓原始执行摘要留在结果里。 |
| `scripts/lib/workspace-graph-clean.cjs` | 改 | L01、L02：部分选择不再清掉清单中的其他仓或两棵共享图树；已知成员未确认或图目录归属不明时，本次不动子仓和路由。声明路径被拒绝时先返回明细。 |
| `scripts/lib/workspace-graph-executor.cjs` | 改 | L02：构建在准备 provider、获取写锁及发布收据前检查拒绝项，不再因一个有效仓构建成功而把显式漏仓报为完成。 |
| `scripts/lib/workspace-graph-status.cjs` | 改 | L02、L10：显式无效仓导致 `invalid`，保留路径和原因。子仓非空 DB 只证明存在；父级合并图即使符合构建收据，也不作为本次查询有结果的证据。 |
| `scripts/lib/workspace-parent-diagnostic.cjs` | 改 | L05：父诊断不把发现的仓重新标为 CLI 声明。先提供只读状态及逐仓配置计划，确认后的构建命令按参数引用，不再默认建议全仓修复宿主配置。 |
| `scripts/lib/workspace-runtime-preflight.cjs` | 改 | L02：含被拒声明的工作区不进入逐仓投射预检，以免先建议为剩余仓初始化；保留选择错误给构建器解释。 |
| `scripts/lib/workspace-target.cjs` | 改 | L02：统一区分清单错误、歧义、显式声明拒绝和单纯发现线索；后者不会仅因被发现就变成强制目标。 |

### 本组取舍与验证

基线为 `5a55514d9`。同目录 `runtime-lib.md` 保留全部 54 个文件、17,404 行的覆盖表及整改前证据。本节只登记 L01–L10；未编辑 L11–L16 的实现或测试。

1. **L01 已修。** 在生命周期锁内重新解析目标，比较显式选择、清单、持久成员和待确认仓（`workspace-graph-clean.cjs:93`）。成员未齐即整次保留，而非先清 A 再让仍生效的共享路由或异步刷新继续引用 A。日常恢复路径是先看 `--workspace-graph-status`，确实要整体清理才用完整仓清单重试；旧子图已无对应仓时返回 `unconfirmed_paths`，须先保全并核对归属。独立测试覆盖开关发现、清单含 A/B 但只选 A、无收据但仍有旧仓图；相邻测试验证全仓、旧版单仓及重复清理仍可用。
2. **L02 已修。** `workspace-target.cjs:165` 共用声明错误判定。临时仓 A 加一个不存在的显式仓，分别走 CLI 声明和 manifest 声明：构建、清理、状态均返回 `rejected` 中的路径、来源及 `declared-repo-not-found`；没有 provider 调用，没有共享状态文件，A 的 DB 保留。预检不再返回 A 作为可执行目标。直接用户若只看到外层简写原因，可在同一命令加 `--json` 查看明细；没有改他人负责的人读入口。
3. **L03 已修。** `args.cjs:57` 和模式解析分别保留、拒绝缺值。单独使用、后跟另一选项和空字符串都得到阻断且 `mutation=false`；`--version 1.2 --plan` 仍保留版本、进入计划。没有运行真实安装验证错误分支。
4. **L04 已修。** `runtime-executor.cjs:643` 从事务结果提取恢复信息；即使配置回读正确，锁释放失败仍为 `action-required`，不能按配置成功结案。用注入的恢复失败结果及「普通临时 JSON 已就位、释放未成功」的回执，校验单项结果、宿主配置收据与人读动作，不复制底层错误正文。没有制造真实宿主写入或锁故障。
5. **L05 已修。** `workspace-parent-diagnostic.cjs:23` 只把实际声明传给状态函数；没有显式选择时保留发现/确认的区别。临时 `repo A` 仍是 `pending_confirm`；人读建议有引用后的仓名、只读计划，没有默认 `--repair-host-config`。相邻入口测试亦验证父目录和临时 home 在诊断前后不变。
6. **L06 已修。** `renderer.cjs:266` 按 `execution_summary` 筛选 provider，按 `tool_facts.target` 选择 `--folder` 或 `--repo`。独立用例同时放入两个 provider，但只选 Graphify：非 Git folder 的建议仍限定 `--only graphify --folder`；安装范围另带 `--installation-only`，不把未建图当接线失败，也不再要求完成所有未选项目。建议只供人审阅，不执行。
7. **L07 仅缓解人读矛盾，机器合同未统一。** `renderHumanSummary` 在 `missing/stale` 时保留初始化建议，不再宣称可继续，两个状态均有断言。仍不能用单仓退出 0 判定宿主投射可用：`reduceExecutionOutcome` 判断请求范围，`prepareHostReadinessLedger` 另判 manifest。未单改退出码，因为诊断、写 facts、宿主账本和批验证并非同一完成条件。**复查触发：** 任一 CI、doctor 或下游 workflow 准备以该退出码放行，或修改 manifest 完成语义时，由合同 owner 统一「写入成功／请求通过／可继续」三种语义；用单仓与多仓、安装与图范围、current/missing/stale 的对照同时核对 JSON、退出码、账本和人读。
8. **L08 已修。** `workspace-executor.cjs:377` 不再把安装范围一律算作失败，也不把任意 `partial` 提升成功。只认退出 0、选择及范围匹配、`subset-setup-complete` 的子项，随后检查其基线、宿主、选中 provider 及子仓 manifest。隔离批测试中，父子 manifest 为 current、provider 安装接线完成但未建图时，父结果为 `ready=1/action_required=0`，子结果仍显示原始 `partial/installation`。子仓 manifest 陈旧、接线未就绪和未知 partial 原因分别保留非零退出。
9. **L09 暂缓，快照不可作独立通行证。** `facts.cjs:593` 目前将 JSON 可解析视为文件可读，没有充分的身份与时效验证。基线探针是库组合；核对入口 `setup.cjs:738` 可见它重新探测并覆盖 provider 行，还提供 required IDs 和 live baseline failures，不能把库探针说成整条 CLI 假绿。直接改 `ready` 的含义会混淆文件可读性与证据适用性，且单凭读者的 `repoRoot` 不能判断期望 host/registry。**复查触发：** 新增直接消费快照的 consumer、改变快照 schema，或真实诊断出现主机/仓/代次不匹配时；由持有期望身份的调用方提供比较依据，分开返回可读性与适用性，用缺失／旧格式／异主机／异仓／同身份新鲜快照验证。此前只按原目标重新 `--verify-only` 收集证据，不以旧文件放行。
10. **L10 已修。** `workspace-graph-status.cjs:125` 仍输出 `codegraph_present`、最近构建状态与限制，但没有 DB 与源码配对的收据，就不声称当前索引新鲜；没有执行查询，就不声称返回过结果。普通非空 DB 且无收据的子项实得 `true / unknown / unknown`；相邻测试仍验证有完整收据和产物的工作区可报 ready，源码变化会降级。没有启动查询服务。

**实际执行的验证。** 新增的唯一测试文件为 `tests/unit/runtime-lib-scope-consistency.test.js`，未改已有测试。运行 `node_modules/.bin/jest --runInBand --runTestsByPath tests/unit/runtime-lib-scope-consistency.test.js`：最终 **19/19 通过**。第一轮 16 项中 13 项失败、3 项既有保守分支通过；之后修正清单样本所需的版本字段，不能将最初的清单校验错误当作漏仓证据。

相邻验证采用同一 Jest 命令的 `--runTestsByPath` 和 `--testNamePattern`，只选正常数据及临时目录用例：

- `mcp-setup-workspace-graph-{clean,executor,status}.test.js`、`mcp-setup-workspace-parent-diagnostic.test.js`：4 套中选跑 **19 项通过**，77 项未选。包括完整与幂等清理、合法旧树、显式与发现仓、完整收据、源码变更和父目录诊断。
- `mcp-setup-{entrypoint,facts-renderer,mode-target}.test.js`：3 套中选跑 **15 项通过**，176 项未选。包括默认安装范围、显式 Graphify、workspace 投射预检、父子 manifest 汇总、folder 修复建议及 provider 人读输出。
- 合计 **53 项通过**，不是全仓测试通过。验证仅使用本地源码、普通数据、临时工作区及替身；没有执行宿主安装、刷新投射、攻击复现、真实模型评测或发布。
