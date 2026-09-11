# Runtime Setup P1-P3 实施证据

源方案：`docs/plans/2026-09-11-spec-runtime-setup-p123-optimization-plan.md`。

## 执行边界

- 基线：`fb7905d2`，分支 `leo-2026-09-07-update-skills`。
- 当前在原 checkout 串行实施；不修改预先存在的 peer runner、handoff、LFG、brand、plugin-sync、CE localization 等其他任务改动。
- 修改 canonical source；未手动修改 runtime mirror，未运行真实 Provider install/refresh。
- 本记录是增量证据，不是最终 verification-run-summary，不构成完成声明。

## 单元状态

| 单元 | 状态 | 当前证据 / 下一步 |
|---|---|---|
| U1 | 已修改，待整体审查与 runtime 收口 | bare 文案统一为只读；contracts 6/6；entrypoint、mode-target、guidance 测试通过；未执行 fresh-source 语义评测 |
| U2 | 聚焦验证通过 | metadata 已统一；后续 U3 将 registry 升为 v11，保留 v10 兼容读取 |
| U3 | 首轮实现与聚焦验证完成 | demand policy、显式 helper/tool 选择、workflow 需求及 provenance；待整体收口 |
| U4 | 首轮实现与聚焦验证完成 | installation/artifact 分离；已有图不改写及更多失败分支仍待补充 |
| U5 | 部分实施 | help 移至 args owner；其余 thin glue 边界待核查 |
| U6 | 未实施 | workspace 边界复核待推进 |
| U7/U8 | 未实施 | dependency identity、freshness fingerprint 与 consumer 联调 |
| U9/U10 | 未完成 | 故障/宿主验证、审查、生成与最终收口 |
| U11 | 部分实施与验证 | 补齐权限 key 注释示例，模板/consumer 清单与配置保留行为通过；语义场景待验证 |
| U12 | 部分实施与验证 | 修复缺失/非法时间戳误报 pass；其余核心 consumer 闭环未完成 |

## 已执行验证

- `npm run test:jest -- --runInBand --runTestsByPath tests/unit/runtime-setup-registry-metadata.test.js tests/unit/mcp-setup-node-contracts.test.js tests/unit/mcp-setup-config-consumers.test.js tests/unit/mcp-setup-registry.test.js tests/unit/mcp-setup-project-config.test.js`：5 suites、50 tests 通过。
- `npm run lint:skill-entrypoints`：通过，扫描 490 个文件。
- U1 更新旧断言时先观察到明确失败；修订后 contracts 单独复跑 6/6 通过。entrypoint/mode-target/guidance 在前一轮均通过；该轮因旧 prose 断言总体失败，不能称该轮全绿。

## 当前发现

- Pi 有 CLI 投射但无原生 MCP，registry 与 host-authority 有意排除 Pi；U9 必须验证不支持的明确结果，不能把投射支持等同于 MCP setup 支持。
- `mcp-setup-config-consumers.test.js` 已通过 localization producer 关联每个 key 的源码 anchor；避免新建重复 consumer 注册表。源码 anchor 通过不代表真实模型执行过读取。

## U11/U12 第二批进展

- U11：模板补齐 `sweep_commit_approved`、`sweep_branch_mutation_approved`、`sweep_landing_approved` 注释示例；默认均 false，明确 setup 不生成授权。模板与注册表的 key 覆盖先复现缺失，再修复。
- 新增真实 filesystem/git 行为用例：刷新 example 不覆盖用户 local override、不忽略 docs/plans、不创建 CE namespace。config-consumers/project-config 共 25 tests 通过。
- U12：发现 `computeDecisionInputHealth` 对缺失/非法 generated_at 原先返回 pass；2 个反例复现后修复为 warn，保留 freshness basis 与显式 verify-only 建议。真正 required action 仍优先 error，不被 freshness warn 遮蔽。
- consumer-health/config-consumers 共 14 tests 通过。仅覆盖此读取出口，不代表其余 consumer、freshness fingerprint 或 U12 整体完成。
- typecheck 上一批通过（259 files），后续行为改动仍需最终复跑。

## U3 第三批进展

- registry v11 新增 readiness_policy；v10 通过兼容 schema 读取，未知旧 entry 保留旧 blocker 并记录 migration warning。
- 精确需求来源：CLI `--only` > always-required > `--workflow` 与 required_for 匹配；无信号不从用途推断。
- 入口对每次请求生成独立 effective registry 投影，使用已有 required/baseline_blocking 执行链，facts item 增量输出 demand。
- `--only gh` 已走真实 Node orchestration 测试，成功报告 helper scope 且不生成 Graphify 图；provider 失败判断排除非 provider ID。
- entrypoint/demand-policy/metadata 共 73 tests 通过；此前 6 个旧行为断言因取消全局 helper 阻断失败，已调整为明确需求 fixture 或新的无关能力不安装预期。
- U3 尚需补 v10 loader 兼容 fixture、完整 setup tests 与 schema/consumer 回归；其余 U4-U10 未完成。

## U3 回归与 U4 首轮实现

- 正确过滤的 setup 全量 unit 回归：35 suites / 638 tests，637 通过，唯一失败为 setup.cjs 行数上限。将 help 移到既有 args owner 后，thin-entrypoint 检查通过；不通过调高阈值隐藏膨胀。
- v10 loader 兼容 fixture 与 v11 missing/unknown policy 反例通过。未知旧 entry 不静默转 advisory。
- 曾使用 Jest 不支持的复数 testPathPatterns，导致误启动扩大范围；已终止该进程（exit 143），不能计为完整回归。其宿主重复 init 失败在 source 稳定后的同名聚焦测试复跑通过；单次失败尚不足以认定 generator 缺陷。
- U4：新增显式 `--installation-only`（复用 only 执行模式），plan/verify 分别保留只读预览/facts-only 权限。Provider installation-only 不执行图生成、query、hook 或迁移；显式 --only 图路径保持原有行为。
- `provider-readiness.v2` 增量字段 readiness_scope，schema、facts consumer、display 与图消费契约同步；installation 总结为 partial scope，不能宣称完整 graph readiness。
- Provider/mode/entrypoint 170 tests 通过；增加 scope-summary/display 后 entrypoint/facts-renderer/config-consumers 再验证。整体 U4 尚需补充现有图不被改写、失败分支与全部消费回归。
- U5 已完成入口 help 职责移出的小步收敛，其余架构单元仍待检查；U6-U10 与最终审查未完成。
