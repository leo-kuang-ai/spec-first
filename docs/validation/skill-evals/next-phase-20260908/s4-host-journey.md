# S4 主宿主旅程与 E33 原生接口补证

类型：advisory，结论受下述样本与事件限制。原始命令事实、输入、退出码、文件哈希、session ID 与原生 API 回执见 [结构化证据](s4-host-journey.json)。本批 owner：当前 Codex。

后续进展见 [S5 消费者与 E33 接续验证](s5-consumer-journey.md)：F13 实施、新 Claude 会话收尾、E33 模型驱动生命周期已各取得样本。下文保留本批当时的失败、超时和未完成状态，不追溯改为后续成功。

## 已完成的观察

在两个独立临时 Git 仓库中，通过当前 source 的 `spec-first init` 分别生成 Claude/Codex runtime。未修改主开发仓库的 generated runtime，也未改宿主全局配置。两宿主的 handoff/debug/plan/work/write-tasks 共 10 份运行时正文与对应 source 字节一致；此事实只说明投射一致，不证明每个 workflow 都运行过。

| 场景 | Codex 0.153.4 | Claude Code 2.1.247 |
| --- | --- | --- |
| 首次发现并调用已安装 handoff | 实际读取项目 skill 并调用默认 writer | 实际 Skill 调用，加载项目 handoff 并调用默认 writer |
| 失败不冒充通过 | `node verify.cjs` 返回 `CHECK_FAIL` / exit 1，报告失败并保持 pending | 同左；额外记录命令白名单拒绝 |
| 跨进程恢复同一 session，只读交接 | session ID 保持一致，三个受保护观察文件哈希不变 | 同左；恢复时回读文件，未实施 |
| 当前用户授权继续 | 修改 result.txt，实际检查变为 `CHECK_PASS` / exit 0 | 修改与验证通过；收尾需两次额外恢复，最终 honest-closeout 返回 verified |
| 旧交接与保护文件 | writer 返回哈希与最终文件哈希一致，保护文件、校验脚本不变 | 同左 |

共 9 次模型 CLI 调用：6 次进程正常完成、3 次 timeout。Codex 的 goal 尝试超时时进程仍返回 exit 0，统计按 timeout 优先，未归入成功。Claude 的 continue、closeout 两次超时原记录保留；第一次缺少本地证据命令权限，补充精确白名单后仍因输入 schema 猜测和回源耗时超时，第三次恢复完成。不能只保留最终成功或将它称为无辅助首轮通过。

调用边界为单次 120 秒、5 秒强停宽限；Claude 单次显式 `max-budget-usd=2`。完成调用的成本字段按宿主原样保留，超时调用缺完整总额，Codex 金额未知，不将未知记为零。Claude hooks/MCP 被测试配置禁用；Codex 仍加载既有用户配置，出现 skill description 压缩和全局入口失效路径后回退项目路径的事件。没有独立网络隔离探针。

## E33 的两层结果

- 模型驱动尝试：在独立 Codex session 中调用，但 120 秒耗尽于入口加载，未观察到 goal 创建。因此仍未通过模型行为验收。
- 原生 API smoke：使用当前二进制导出的实际 JSON Schema，经 stdio app-server 新建独立 thread，`thread/goal/get` 确认初始为空，`thread/goal/set` 创建 active，真实执行校验与保护文件哈希检查，再 set complete，最终 get 返回 complete。记录中 tokensUsed 为 0；没有模型 turn，不是模拟接口，也未触碰当前开发 goal。

原生接口证据补齐了“能否实际创建、读取和完成”的能力缺口，但不能替代 E33 对候选指令的模型驱动行为要求。配置/宿主报告的 `gpt-6-astra` 尚无独立响应模型身份；Claude message 返回 `glm-5.3`，结果含 `glm-5.3[1m]` 与 `glm-5.3-flash`，不冒充 Claude 模型或 Astra 对照。

## 本次触发的本地修复

S5.4 出现可回源摩擦：`verification-run-summary record --help` 与 `honest-closeout validate --help` 原本返回错误且不提供输入形状，消费者猜测 `check_id`/`status: pass` 等字段失败后扫描实现源码。

在各自 CLI owner 补充只读 help，公开当前允许字段、命令参数和最小 `not-run` 示例。帮助不读取目标仓库、不创建 artifact；现有写入、日志与验证门不变，不新增 schema 版本或公共 workflow。新增 5 个帮助/示例消费反例修改前失败，修改后两个套件共 31 tests 通过；示例实际落盘后回读保持 not-run，honest-closeout 为 degraded，不能误报 verified。源文件为 `src/cli/helpers/verification-run-summary.js`、`src/cli/helpers/honest-closeout.js` 及对应 tests。

该帮助修复发生在上述宿主旅程之后，没有把修改前实验升级为修改后宿主通过；其降低收尾耗时的效果仍需新任务重测。

最终消费者回归为 7 suites / 83 tests，通过 `npm run typecheck`（257 files）；四文件独立只读审查无实质发现。具体命令和源码哈希见 [修复验证](s5-cli-help-verification.json)。

## 剩余与处置

| 范围 | 当前处置 | owner / 前置条件 / 重估触发 |
| --- | --- | --- |
| S2/S3 Astra 受保护行为及三组 | continue experiment，未完成 | 实验 owner：响应模型身份、冻结输入、A/A 与完整准入可核验后重测；不拼接 GLM 旧数据 |
| E33 候选模型行为 | continue experiment，接口 smoke 已通过 | 执行 owner：可用模型 session 的实际工具事件；独立测试目标，完整生命周期需再验证 |
| S4 两宿主合成基础旅程 | 样本已完成，Claude 为辅助恢复 | 宿主 owner：修复后新任务复测首次无辅助收尾；复杂任务、完整多 workflow 旅程和外部收益仍未验证 |
| S5.2 F08/F13 | continue experiment | plan/work/handoff owner：F08 现有旅程可回源；F13 真实后继计划生产与重新 intake 仍待宿主行为测试 |
| S5.4 帮助可达性 | 本地修复完成，效果待测 | 两个 CLI owner：真实消费者重新测量 schema 错误和收尾成本 |
| S5.1/S5.3 | deferred | 对应 source owner：出现本批范围内尚未修复的直接缺陷或新摩擦证据时重估 |
| S5.5 | deferred | context owner：需要质量、token、retrieval recall、压缩损失和消融数据，不以一次过量读取直接推广压缩 |
| S6 OPT-10/11 | deferred，未完成 | 总体/知识 owner：同条件消融和另一真实消费者任务就绪后验证；不创建伪消费者凑数 |
| S6 OPT-12 | 本批状态与文档同步已处理 | 文档 owner：新实验、来源或结论变化时重估；不声称 S6 整批完成 |
| X1 | 独立支线，未执行 | 仓外 owner：明确个人安装层范围后处理；本批未修改个人 skill 或全局入口 |

这些处置不表示全量开发完成，也不将尚需验证的必需事项改写为可选项。
