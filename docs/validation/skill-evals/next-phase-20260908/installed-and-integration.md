# 安装产物与完整测试链复核

类型：advisory。本批是开发顺序方案 S1 测量可信度、S4/OPT-09 安装投射与第 10 节验证的后续任务。当前 Codex owner 执行并内联审查，未新增独立模型评审。原始 JSON 摘要、失败与成功的 Jest 结果及 SHA-256 见 [证据包](installed-and-integration.json)。

## 修复与结果

1. 安装验证脚本实际运行 99 项通过、进程 exit 0，但 `installed-package-verification.json` 写成 failed。原因是正常 Node 进程的 `process.exitCode` 默认为 undefined，writer 只接受严格等于 0。现已接受正常默认退出值，非零仍记录 failed。保留错误旧摘要，未手工改成 passed。
2. 安装验证的全宿主矩阵只列六个宿主，漏掉 ZCode/Pi。现补齐独立投射锚点，并先与安装包自身的 `getSupportedPlatforms()` 对账；新增宿主未进入矩阵时检查失败。逐宿主清理时，仍有 Codex/ZCode/Pi 消费者就检查共享技能和 AGENTS.md 保留。重新实际 pack、临时 prefix 安装、初始化/诊断/清理、自愈及八宿主共存验证共 132 项通过，机器摘要为 passed。
3. 显式启用两项真实 Graphify 集成测试后，初次均在 provider 运行前失败：source init 写入 1.15.3，setup 却通过 PATH 查询个人全局 CLI 1.15.2。测试环境现使用既有 `SPEC_FIRST_BUNDLED_VERSION`、`SPEC_FIRST_CLI` 同时绑定当前 checkout 的 package.json 和 bin/spec-first.js，保留版本门禁。重跑两项全部通过：external hooksPath 目录字节不变，contained hooksPath 下 commit 实际刷新图。

源变更仅在 `scripts/verify-installed-package.cjs`、新单测与该集成测试。没有修改 runtime generator、provider 实现、主仓 runtime 或个人全局安装。安装和 Graphify 测试仅在脚本创建的临时仓库/home/prefix 执行，结束后由既有清理逻辑删除临时目录。

## 验证层级

| 验证 | 结果 | 范围与限制 |
| --- | --- | --- |
| `npm test` | exit 0；205 suites / 2490 单测、5 smoke、68 integration 通过 | 在本轮修复前启动；不把后加入的 5 项单测冒充包含在其中。两项显式 Graphify 测试默认跳过，已另行补跑 |
| 新安装摘要/矩阵单测 | 5 项通过 | 两个有效反例修复前失败；覆盖 undefined/0 成功、1/2 失败、受支持宿主集合 |
| `npm run verify:installed` | 修复后 exit 0、132 项、摘要 passed | 真实本地 tarball 和隔离安装；平台 darwin、Node v22.22.3。只证明投射与 CLI 生命周期，不证明所有宿主模型加载行为 |
| 显式 Graphify integration | 2 项通过，69.407 秒 | Graphify 0.9.29、CodeGraph 1.5.0、uv 0.11.19；修复前失败输出保留。图变化与 query 成功不证明语义召回充分性 |
| typecheck / entrypoint lint / instruction sync | 257 文件 / 401 文件 / PASS | CLI/脚本语法与入口一致性，不替代模型行为；typecheck 在本轮 source 修改后复跑 |

完整主链与修改后的针对性回归分别记录，没有在测试期间修改的源码上伪造一次全量最终快照测试。132 项安装验证之后只调整一条源码注释，未改变执行行为。

## 知识消费与剩余

本次参考了已有 source-first 学习 `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`，回到实际 producer 与包版本解析确认根因，选择修 writer 和测试环境，未修改历史失败结果或个人安装。该学习缺少当前 promotion 必填的 source_refs/invalidation_condition，仍按 legacy_unstructured_advisory 消费；其中旧 `agents/`、旧 producer 名称不作为当前事实。当前 source 和真实重跑才支持本次结论。这是有回源记录的使用案例，不证明相对收益，也没有将其升级为已完成 OPT-11 或批量重写知识库。

本轮没有调用收费模型。S2/S3 的目标模型身份、完整三组准入与行为采样仍未补齐；S4 的完整复杂任务/现场收益与 S6 的同环境消融、另一真实任务的知识收益和失效案例仍未完成。X1 个人安装层仍是独立范围，本轮只是读取旧 CLI 版本，没有改写它。当前阶段可关闭本报告三项验证缺陷，不能据此关闭整体开发方案。
