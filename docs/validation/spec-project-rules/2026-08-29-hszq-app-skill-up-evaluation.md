# spec-project-rules × hszq-app Skill-Up 真实大仓测评

- 日期：2026-08-29
- 被测 skill：`skills/spec-project-rules/`
- runner：skill-up（engine=codex，existing login；model unset）
- 目标：验证该 skill 能否在大型历史 Android 多模块工程完成第一批骨架 bootstrap，而非验证固定人工规则集合。

## 快照与隔离

原仓 `/Users/kuang/xiaobu/hszq-app` 有大量既有 dirty changes，且 `common/`、`biz-common/` 为独立嵌套 Git 仓。测评没有直接写原仓：

- 父仓 HEAD：`feb6f82ae44`
- common HEAD：`679fe7a20`
- biz-common HEAD：`dea2b3b01`
- 隔离 fixture：三个 `git archive` HEAD 合并；20,750 文件、约 283 MiB
- 当前工作区 dirty、既有 `docs/architecture/`、runtime 目录均未进入 fixture

## Run-Local Gold Case

固定断言：五文件+schema+markers、AGENTS/CLAUDE pointer、60 模块量级、主壳/app-core/common 识别、Kotlin 明文规范、至少三类项目私有契约、历史例外收窄、抽样披露、敏感信息零泄漏、业务/Gradle/子仓零修改、原入口 marker 外内容保留。

Judge 已红测：无产物时 exit 1。固定 APIHelper/HsObservable 或 RouterTable 等人工条目不作为 gold 条件；第一批骨架允许在多个同样高价值的私有契约中选择最强证据。

## 三次真实运行

| Run | 结果 | 条目 | 依赖提取 | 主要发现 | 定性 |
| --- | --- | --- | --- | --- | --- |
| 1 | judge fail | 34（18 confirmed / 16 inferred） | 60 模块 / 278 边 / 17 unresolved（旧 parser 含注释假 alias） | 启动/SPI、ARouter Provider、Android/KMP 网络封装、缓存、i18n、IBean、依赖别名 | execution completed；固定答案 judge 过拟合 |
| 2 | judge fail | 26（19 / 7） | 60 / 0 / 91 | 启动生命周期、KMP 配置、资源、JSON、持久化、数值格式化、UI 能力 | execution completed；暴露 alias 参数未自动发现缺陷 |
| 3 | judge fail | 25（18 / 7） | 60 / 278 / 17（旧 parser 含注释假 alias） | 壳/构建/共享/KMP/业务族、Kotlin、JSON、缓存、HSDataFormat、Result、i18n、依赖入口 | execution completed；固定路由答案 judge 过拟合 |

第三轮成本：14,765,965 tokens（input 14,724,784 / output 41,181），740 秒，3 turns。三轮均：生成五文件+两个 pointer；marker/diff/sensitive 自检通过；只改允许路径；核心/shared 入口 100% 阅读，业务模块分层抽样并披露未覆盖面；未运行构建测试。

## 真实缺陷与修复

`extract-deps.cjs` 原设计要求 agent 自行找到并传 `--alias-file`。同一快照 Run 1/3 找到 `hszq-version/Deps.kt` 得到旧 parser 的 278 边，Run 2 漏传后退化为 0 边/91 unresolved。进一步审查发现旧 parser 把 6 个注释中的 `const val` 当有效 alias，其中 `butterknife_compiler` 产生了 3 条假边；因此 278 不是金标准。模型可以人工回源兜底，但确定性事实不可依赖这种偶然性或注释误解析。

修复：抽取共享 `buildDependencyFacts()`，CLI 与 verify-deps 使用同一事实入口；npm workspaces 先判定，不再扫描 Gradle alias；Gradle 模式自动扫描深度 ≤6 的 `Deps.kt`，按 build.gradle 实际 alias 命中数 → 有效 GAV 数 → 路径选择候选，显式参数仍优先；支持 typed `const val` 与文件 symlink，排除注释、build/node_modules/evals/fixtures/worktree，扫描错误进入 payload 并让 verify 产生 finding。payload 增 `alias_file/alias_count/alias_discovery/alias_candidate_count/referenced_alias_count/alias_scan_errors`。hszq 快照无参数复验：60 模块 / **275 真边** / 18 unresolved / 自动选择 `hszq-version/src/main/java/hszq/version/Deps.kt`（76 有效 aliases，73 个被 build.gradle 引用，scan errors=0）；extract 与 verify 图一致。

## 结论

- **执行能力证据：concerns（3/3 executions completed，0/3 script-judge pass）**。三次均能在 1.1 万源码级历史工程单次 bootstrap 形成 25–34 条骨架规则，证明大仓可执行与产出规模受控；但 gold judge 三次均失败且早期 judge 绑定人工规则答案，因此不能升级为正式 semantic pass。
- **确定性层：修复后通过**。依赖提取不再依赖 agent 偶然找到 alias 表，CLI 与 verifier 共享同一事实入口，并排除了注释假 alias。
- **Judge 结论：当前 run-local 固定答案 judge 不具备正式验收资格**。大仓第一批骨架应验证结构、证据、边界、安全与私有契约覆盖强度；本轮未完成一个重新设计且正式通过的持久 judge，因此不声称 skill-up gold pass。
- **字段结论上限**：本测评证明 isolated Codex engine 下 bootstrap 可执行并产生有边界的项目知识候选；不证明这些规则全部语义正确，不证明真实 Claude/Codex/Trae 宿主自动触发、规则实际消费、长期 field outcome 或所有模块深层准确性。
