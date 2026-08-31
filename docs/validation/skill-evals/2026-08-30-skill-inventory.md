# spec-first Skill 全量梳理(基线:2026-08-30)

- **基线快照**:HEAD `4f209572`(working tree),与 `src/cli/contracts/dual-host-governance/skills-governance.json`、`docs/validation/2026-08-19-spec-first-current-skill-package-inventory-v2.json` 三方一致。
- **用途**:本目录后续测评的清点基线;skill 集合发生增删或分级变化时应重新清点并更新本目录。

## 结论速览

**spec-first 项目自有 skill 共 37 个**,按治理分级为三类:**17 个公开 workflow(workflow_command)、16 个 standalone skill、4 个内部 helper(internal_only)**。

`skills/` 目录下实际有 40 个条目,多出的 3 个都不是 skill:

| 条目 | 性质 |
|---|---|
| `_shared/` | 跨 skill 共享参考契约(渲染、schema、tracker 等文档),无 SKILL.md |
| `spec-project-rules-workspace/` | spec-project-rules 开发期的 eval 迭代工作区(iteration-1~7),未纳入 git 追踪 |
| `autoresearch` | **symlink → `../.agents/skills/autoresearch`**,即指向 generated runtime mirror 的第三方 skill(Karpathy autoresearch),不在治理注册表中,详见文末"边界发现" |

分级与宿主投放方式:`workflow_command` 级在 Claude/Qoder/OpenCode 投影为 `/spec:*` 命令、在 Codex/Cursor/Kiro 投影为 skill;`standalone_skill` 级在全部六宿主均以 skill 形态交付;`internal_only` 级仅供上游 workflow 调度,不进用户菜单。

## 按核心链路分组的作用清单

仓库的核心链路是 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge`,以下分组沿用这一叙事加旁路扩展。"级别"列:**W** = 公开 workflow,**S** = standalone,**I** = internal。

### A. 入口与路由(1 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `using-spec-first` | S | 入口治理器:按用户意图、workflow 状态与路由规则选出**恰好一个**入口(公开 workflow / standalone / 终端命令 / Direct Lane),选中后立即移交控制权,自身不产生任何 workflow artifact |

### B. 需求与规划——解决 What(6 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-ideate` | W | 0-1 阶段生成并评估有依据的想法、改进方向与出人意料的选项,供用户挑选后再深化 |
| `spec-brainstorm` | W | 把模糊或宏大的想法探索成"只含需求"的适度规模统一计划;也覆盖"我对 X 一无所知但需要做"的盲区扫描场景 |
| `spec-prd` | W | 棕地(既有系统)PRD 级需求的创建、撰写、精化与 planning-readiness 校验 |
| `spec-doc-review` | W | 用角色化 lens 审查既有的 requirements / plans / task packs / specs,默认 ≤3 名 reviewer,`roster:full` 启用完整名单 |
| `spec-strategy` | S | 创建或更新 `STRATEGY.md`,定产品方向、路线图与度量;为 ideate/brainstorm/plan 提供上游产品锚点 |
| `spec-prototype` | S | 构建一次性抛弃型原型,回答"必须让人亲身体验才能判断"的产品行为或视觉问题,不用于正式实现 |

### C. 计划与任务——解决 How(2 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-plan` | W | 为多步工作创建或深化有证据支撑的计划(含研究型计划);目标清晰但路径未定时使用 |
| `spec-write-tasks` | W | 把已确定的 spec-plan 编译为**可选的**派生任务包供 spec-work 执行,或在执行前校验既有任务包;计划始终是唯一 source of truth |

### D. 执行与全链路交付(6 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-work` | W | 端到端执行已定案的计划、已校验任务包、spec 路径或具体实现请求;仓库/范围/授权未决时停下 |
| `spec-lfg` | S | 全自动工程管线:规划一路跑到绿色 PR(commit、push、开 PR、盯 CI),仅在用户显式点名时启动 |
| `spec-resolve-pr-feedback` | S | 评估 PR review 反馈有效性并修复,带冲突感知的 resolver 调度;副作用授权逐项显式 |
| `spec-commit` | I | 内部 commit helper:为已持有显式 commit 授权的公开 workflow 创建范围收敛、传达价值的提交,不负责 push/PR |
| `spec-commit-push-pr` | I | 内部 landing helper:为已持有显式 commit+landing 授权的公开 workflow 提交、推送并创建/更新 PR |
| `spec-worktree` | I | 内部 git worktree 隔离 helper,受 governed caller(spec-dogfood/spec-work)的前置调用契约约束 |

### E. 调试与质量(6 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-debug` | W | bug 与失败行为的诊断循环:错误、堆栈、回归、失败测试、修不动的问题 |
| `spec-code-review` | W | 结构化代码审查(bug、回归、测试、规范),默认只报告;仅在被显式要求 review-and-fix 时才动手修 |
| `spec-optimize` | W | 度量驱动的迭代优化:定义可测目标、搭测量脚手架、并行实验、硬门 + LLM-as-judge 打分、保留改进并收敛 |
| `spec-simplify-code` | S | 在**不改变行为**的前提下简化近期改动(清晰度、复用、质量、效率);真 bug 走 spec-debug |
| `spec-dogfood` | W | 免手动、限定 diff 范围的分支/PR 浏览器 QA:映射变更流程、派发 spec-test-browser 执行、小破坏随手修并补回归测试、留 durable 报告 |
| `spec-app-consistency-audit` | W | 移动 App 的 PRD/Figma/本地源码三源一致性审计(页面路由、KMP/Clean Architecture、组件、埋点、i18n、工程质量、行业 lens),在 runtime 验证之前做 |

### F. 运行时与设备验证(3 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-runtime-setup` | W | 为六宿主(Claude Code、Codex、Cursor、Kiro、Qoder、OpenCode)安装、配置、校验并刷新 spec-first workflow 所需的 harness runtime readiness 事实 |
| `spec-test-browser` | I | 在当前 PR/分支受影响页面上跑浏览器测试;由 spec-dogfood 等治理方按 exact-origin 契约派发 |
| `spec-test-xcode` | S | 用 XcodeBuildMCP 在 iOS 模拟器上构建、运行、验证 App 与崩溃检查(要求宿主已连接 XcodeBuildMCP) |

### G. 知识与规则沉淀(4 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-compound` | W | 把刚解决的问题或耐久项目词汇沉淀进 `docs/solutions/` 或 `CONCEPTS.md` |
| `spec-compound-refresh` | W | 对照当前代码库刷新 `docs/solutions` 学习:审计过期、重叠、被取代、漂移的条目 |
| `spec-project-rules` | S | 从代码证据构建/增量维护多端 monorepo 的架构知识库(`docs/architecture.md`:端的所有权、依赖方向、复用契约),也做陈旧检查与一句话回写新约定 |
| `spec-rule-miner` | S | 从仓库现有代码挖掘编码约定,生成带 AGENTS.md/CLAUDE.md 指针的项目规则与 Cursor/Qoder 规则文件,让 AI 生成的代码贴合项目习惯 |

### H. 产品信号与反馈(4 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-product-pulse` | S | 从已配置信号源生成时间窗口化的产品脉搏报告 |
| `spec-sweep` | S | 清扫已配置反馈源(Slack、GitHub Issues,邮件为实验性):源端确认、分析录像、验证修复是否并入 main,产出 spec-lfg-ready 计划;支持 headless 定时模式 |
| `spec-riffrec-feedback-analysis` | S | 分析显式的 Riffrec 产品反馈采集(zip 包、session/events/录像/语音 bundle),含采集引导;不触发于普通音视频转写 |
| `spec-polish` | W | 启动 dev server、在浏览器里检查功能并迭代打磨 UI |

### I. 会话连续性与解释(3 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-explain` | S | 为概念、diff、想法或近期工作窗口制作耐久、可视化的教学产物,可选 check-in 巩固;不用于普通问答 |
| `spec-handoff` | S | 创建跨会话交接产物或从用户选定的连续性来源恢复;仅显式要求时触发 |
| `spec-pov` | S | 给出**项目立场**的外部输入裁决(是否采用/切换某技术、库、模式、平台;CVE/弃用是否真的影响本项目),必返回项目特定的 verdict |

### J. 治理与元能力(1 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-write-skill` | W | 创建、修改、迁移项目自有的 Agent Skill package,或按用户要求做零执行的只读验证与 readiness 报告;也用于按已接受的 audit finding 修复 source skill;禁止直接修补 generated runtime mirror |

### K. 发布(1 个)

| Skill | 级别 | 作用 |
|---|---|---|
| `spec-promote` | S | 为已上线的功能起草发布/推广文案 |

### L. 未注册的第三方(磁盘可见,非 spec-first 交付物,不在测评范围)

| 条目 | 说明 |
|---|---|
| `autoresearch` | symlink 指向 `.agents/skills/autoresearch`(Karpathy autoresearch v2.2.1):面向任意度量指标的自主迭代循环(modify → verify → keep/discard),含 plan/debug/fix/security/ship 等子命令。`spec-optimize` 的设计即受它启发并做了泛化 |

## 清点口径与边界发现

1. **计数口径**:以"`skills/` 下含 `SKILL.md` 的目录 且 被治理注册表收录"为准 = 37。这与 `src/cli/contracts/dual-host-governance/skills-governance.json`(37 项)和 `docs/validation/2026-08-19-spec-first-current-skill-package-inventory-v2.json`(`skill_count: 37`)三方一致。
2. **边界发现(建议关注)**:`skills/autoresearch` 是提交进 git 的 symlink(git mode `120000`,2026-08-05 创建),目标 `../.agents/skills/autoresearch` 属于 AGENTS.md 明确列为 generated runtime mirror 的 `.agents/skills/`。这使 source 目录依赖 runtime 内容,违反本仓库"source-first、不把 runtime mirror 当 source"的边界纪律——后续若 `.agents/` 被 `spec-first clean` 或重新生成,该 symlink 会悬空,且它当前绕过了 entrypoint 治理注册。如需保留 autoresearch,建议将其实体化为 `skills/` 内的 vendored source 并走治理注册,或移除该 symlink 仅保留 runtime 侧安装。
3. `spec-project-rules-workspace/` 未纳入 git 追踪,属 spec-project-rules 开发期 eval 工作区,不参与清点。
