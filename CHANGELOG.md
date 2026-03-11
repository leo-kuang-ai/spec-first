# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- v0.5.79 2026-03-11 Claude: feat(dispatcher): runtime 缺失时自动降级到 docs/first - 新增 parseStageSummaryFromDocs/parseRoleSummaryFromDocs 辅助函数（支持中英文格式），8 个 build*RuntimeNotice 函数添加 docs 降级逻辑（spec/design/code/verify/onboarding），统一字段命名为 snake_case（background_input_status/data_source），新增 data_source 字段标识数据来源（runtime/docs），最小侵入式实现（0 新增文件，~50 行代码） (user-visible)
- v0.5.78 2026-03-11 Claude: fix(auto-loop): 重试退避机制生效 (F-07) - TodoItem 新增 resumeAt 字段，pickReadyTodos 过滤未到恢复时间的任务，重试时设置 resumeAt = Date.now() + backoffMs，修复退避只记录不等待的问题 (user-visible)
- v0.5.77 2026-03-11 Claude: fix(tests): 统一测试中的 ID 格式规范 (F-08) - 将测试文件中的 REQ-PRD-* 格式统一为 REQ-* 格式（REQ-AUTH-001），修正 REQ ID 格式（必须有模块名部分），涉及的测试文件：validate-command.test.ts、analyze-background-quality.test.ts、gate-evaluator.test.ts、sca-security.test.ts
- v0.5.76 2026-03-11 Claude: fix(coverage): C5 AC Coverage 分层降级策略 (F-05) - 新增 AC 类型支持（types.ts + id-validator.ts + trace-context.ts），C5 计算逻辑分层降级（有 AC 时计算 AC→TC，无 AC 时降级为 FR→TC），Gate 条件分层降级（有 AC 时正常阈值 S:60%/M/L:90%，无 AC 时降低阈值 S:50%/M/L:70%），避免无 AC 的项目在 05_verify 阶段卡住 (user-visible)
- v0.5.72 2026-03-10 Claude: fix(viewer): 修复任务进度和时间线视图显示问题 - task-parser.js 支持 US 格式阶段标题和任务标签，修正表格列索引和标题匹配，server.js 修正变量名 STAGE_NAMES/STAGE_ORDER (user-visible)
- v0.5.71 2026-03-10 Claude: fix(init): 深度修复 Windows 平台创建问题 - CLI 新增 guidePlatformCreation() 交互式引导（支持 Java/前端/H5 三种模板），修正 platform 字段（非 name），Skill 新增 platform-yaml-template.md 规范文档，更新 prerequisites.md 创建流程，解决 Skill 文档与代码不一致问题 (user-visible)
- v0.5.70 2026-03-10 Claude: fix(init): Windows 平台 YAML 创建修复 - 新增 platform-yaml-template.md 模板文档（明确 platform 字段为必填），更新 SKILL.md 和 prerequisites.md 添加平台创建引导流程，修复字段名错误（name → platform）导致的 CLI 校验失败
- v0.5.69 2026-03-10 Claude: fix(status): 全链路状态一致性修复 - 创建 status-mapper.ts 支持 30+ 状态别名映射，matrix.ts 增强错误消息显示有效状态列表，format-validator.ts 修复重复 ID 检测只匹配 ID 列，coverage.ts C8 计算添加 NFR 标签支持，CLI matrix 命令添加 --help 和状态列表，更新 skill 文档状态描述 (user-visible)
- v0.5.68 2026-03-10 Claude: feat(orchestrate): 核心信号打通与边界冻结 - autoLoopStatus 接入 decider（优先级检查），reasonCodes 结构化输出（ReasonCodeValue 类型安全），禁用 AUTO_RUN_NEXT_SKILL（方案A边界冻结），统一自动推进放行条件，补齐 03→05 矩阵测试（10个用例），修复 todoState 缺失误判，性能优化（常量提取），用户体验提升（友好状态提示） (user-visible)
- v0.5.67 2026-03-10 Claude: feat(onboarding): 交互体验优化 v1.2.0→v1.3.0 - 支持命令行参数（--role/--task/--size），CLI 参数检测与友好提示 (user-visible)
- v0.5.66 2026-03-10 Claude: refactor(onboarding): 文档结构优化 v1.1.0→v1.2.0 - 拆分输出模板到 references/output-templates.md（欢迎/路径/步骤/角色定制/错误提示），精简 SKILL.md 从 233 行降至 180 行
- v0.5.65 2026-03-10 Claude: refactor(onboarding): Skill 优化 v1.0.0→v1.1.0 - 补充场景匹配算法（精确/通配/默认）、role-views 使用策略（角色定制推荐）、完整错误处理矩阵（7 种场景 + 3 层降级）
- v0.5.64 2026-03-10 Claude: fix(onboarding): 修复 CLI 命令未注册问题 - 创建 onboarding.ts handler，注册命令，支持 first 资产检测提示 (user-visible)
- v0.5.63 2026-03-10 Claude: refactor(first): Skill 方案 A 优化 - 精简 SKILL.md（删除重复内容、优化 description、添加 reference 导航、放宽证据覆盖率要求）+ quick 模式生成 README.md，从 197 行降至 183 行
- v0.5.62 2026-03-10 Claude: refactor(first): 收口型优化 F1/F2/F3/F4/F7 - 命令层瘦身，业务编排下沉到 executeFirst()，确认策略抽取为 shouldConfirmFirst() helper，refresh-all 自动检测并恢复不健康的 docs 投影，--skip 允许恢复投影，补充 router 级确认策略测试
- v0.5.62 2026-03-10 Claude: refactor(init): Skill 优化 - 修复 description 触发条件、清理 frontmatter、精简 SKILL.md、增强交互示例 (user-visible)
- v0.5.61 2026-03-10 Claude: refactor(first): 收口型优化 F1/F2/F3/F7 - 命令层瘦身，业务编排下沉到 executeFirst()，确认策略抽取为 shouldConfirmFirst() helper，refresh-all 自动检测并恢复不健康的 docs 投影，补充 router 级确认策略测试
- v0.5.60 2026-03-10 Claude: fix(init): 移除 --yes 确认要求 - init 命令直接执行，无需额外确认 (user-visible)
- v0.6.2 2026-03-10 Claude: feat(init): 增强 feat 参数交互 - 支持中文输入自动生成英文缩写候选项，保持逐步引导流程 (user-visible)
- v0.6.1 2026-03-10 Claude: docs(init): 删除断点续传描述 - 与代码实现保持一致，默认创建新 Feature
- v0.6.0 2026-03-09 Claude: feat(code): 完全重写为批量模式 - 支持依赖解析、拓扑排序、并发执行、失败率控制，三层守卫架构，上下文包 < 2KB，降级策略，checkpoint 机制 (user-visible)
- v0.6.0 2026-03-09 Claude: feat(cli): 新增 batch-test 命令 - 集成批量执行器到 CLI，支持从 task_plan.md 解析任务并执行
- v0.6.0 2026-03-09 Claude: feat(batch-executor): 实现阶段 3 - 上下文打包器（< 2KB）、并发执行器、max_parallel 控制，7 个测试全部通过
- v0.6.0 2026-03-09 Claude: feat(batch-executor): 实现阶段 2 - Checkpoint 机制、执行报告生成、进度追踪器、失败率控制，集成测试通过
- v0.6.0 2026-03-09 Claude: feat(batch-executor): 实现阶段 1 - 依赖图解析、循环依赖检测、拓扑排序分层、TDD 预检、文件冲突检测、串行执行器，测试通过
- v0.5.58 2026-03-09 Claude: fix(hooks): 统一 stop-guard 为提醒型 - 修复真源/治理文档/测试一致性，补充行为契约文档
- v0.5.57 2026-03-09 Claude: feat(feature): 优化无参数调用 - 自动显示当前 Feature、列表和命令帮助
- v0.5.56 2026-03-09 Claude: fix(postinstall): 自动添加 --yes 确保 update 命令执行成功
- v0.5.55 2026-03-09 Claude: feat(feature): 使用 argument-hint 实现参数传递 - 支持 /spec-first:feature list/current/switch
- v0.5.54 2026-03-09 Claude: docs(feature): 优化 feature skill - 支持带参数调用、自动添加 --yes
- v0.5.53 2026-03-09 Claude: docs(spec): 优化 spec skill 执行指导 - 补充 ID 类型、状态值和 CLI 硬约束
- v0.5.52 2026-03-09 Claude: fix(hooks): 恢复 stop-guard.sh 正确版本 - 仅在 04_implement 阶段检查 in_progress 任务
- v0.5.51 2026-03-09 Claude: fix(hooks): 修复 stop-guard.sh 死循环问题 - 改为 exit 0 避免 AI 误判，添加 awk 错误保护
- v0.5.51 2026-03-09 Claude: feat(init): 添加断点续传机制和保护规则，防止中断后自动删除 Feature 目录
- v0.5.50 2026-03-09 Claude: docs(first): 强制要求使用 buildRoleViews/buildStageViews 函数生成 JSON，禁止手动构造，确保格式与类型定义一致
- v0.5.50 2026-03-09 Claude: docs(first): 添加 P3 阶段 runtime 真源生成指令，明确 summary.json/index.json 完整结构与必需字段，防止 AI 生成不完整 JSON
- v0.5.50 2026-03-09 Claude: fix(init): 添加 summary.json 字段安全访问，防止 platformType/modules/apiSurface 未定义时崩溃
- v0.5.50 2026-03-09 Claude: docs(first): 完成 deep 模式项目认知 — 生成 10 个完整文档（tech-stack/api-docs/codebase-overview/domain-model/call-graph/architecture/external-deps/local-setup/development-guidelines/README），更新 runtime 真源（index.json/summary.json），全部标注证据源 (user-visible)
- v0.5.50 2026-03-09 Claude: docs(first): 升级 domain-model.md 为 deep 版本 — 添加详细属性定义表、4 个状态转换图（Stage/RFC/Defect/MatrixStatus）、9 个领域事件流、完整 ER 图、5 个业务流程时序图、8 个领域服务定义、25+ 条约束规则，全部标注证据源，符合 A4 deep 模式规格 (user-visible)
- v0.5.50 2026-03-09 Claude: fix(uninstall): 新增 CC Switch skills 清理逻辑，修正步骤编号
- v0.5.50 2026-03-09 Claude: docs(first): 生成 deep 模式代码库概览 codebase-overview.md（含符号分析、依赖关系图、开发入口映射）+ 模块清单 JSON
- v0.5.50 2026-03-09 Claude: refactor(install): 统一 postinstall 和 preuninstall 的全局检测逻辑，删除未使用函数
- v0.5.50 2026-03-09 Claude: docs: 更新版本号至 v0.5.49
- v0.5.50 2026-03-09 Claude: feat(host-paths): 支持 CC Switch 路径检测，增强多工具管理兼容性 (user-visible)
- v0.5.50 2026-03-09 Claude: docs(first): 生成研发规范文档 development-guidelines.md（deep 模式，10 个规范模块，完整证据标注）
- v0.5.50 2026-03-09 Claude: docs(first): 生成本地环境搭建文档 local-setup.md（deep 模式，12 个章节，完整证据标注）
- v0.5.50 2026-03-09 Claude: docs(first): 生成外部依赖分析文档 external-deps.md（deep 模式）
- v0.5.50 2026-03-09 Claude: refactor(viewer): 统一前后端 FLOW_STAGES 常量定义，消除重复代码 (user-visible)
- v0.5.50 2026-03-09 Claude: refactor(viewer): 消除 server.js 与 task-parser.ts 代码重复，提取共享模块
- v0.5.50 2026-03-09 Claude: test(viewer): 添加 sanitizeFeatureId 和 escapeHtml 安全测试，覆盖路径遍历和 XSS 攻击
- v0.5.49 2026-03-09 Claude: fix(postinstall): 增强全局安装检测可靠性，解决新电脑安装后 skills 不注册的问题 (user-visible)
- v0.5.48 2026-03-09 Claude: fix(viewer): 修复任务状态解析与归一化逻辑 (user-visible)
- v0.5.48 2026-03-09 Claude: refactor: 优化命令路由与阶段推进逻辑，增强测试覆盖
- v0.5.48 2026-03-09 Claude: docs: 审查并更新文档，增强 analyze skill 背景质量分析 (user-visible)
- v0.5.48 2026-03-09 Claude: docs: 深度优化快速开始文档，提升小白用户友好度 (user-visible)
- v0.5.48 2026-03-09 Claude: chore: 清理 first 文档产物，新增 skill 文档一致性测试
- v0.5.47 2026-03-09 Claude: docs(readme): 修复 README.md 与实际代码不一致 — 版本号 v0.5.45→v0.5.47，Skill 数量 23→20，修正 08-code-review→08-review，移除不存在的 skills (09-test, 17-feature-list, 18-feature-switch, 19-feature-current)，补充 done 命令，CLI 命令数量 21→22 (user-visible)
- v0.5.47 2026-03-09 Claude: docs(npm): 添加 npm 发布指引文档 (user-visible)
- v0.5.129 2026-03-09 Claude: feat(spec-review): 添加运行时背景注入 — dispatcher 自动注入 backgroundInputStatus 和 specViewSummary (user-visible)
- v0.5.128 2026-03-08 Claude: feat(verify): 添加 verify-view runtime notice 自动注入 — dispatcher 自动注入 verify-view 摘要、背景状态和 pre-release-verification 风险分类
- v0.5.127 2026-03-08 Claude: feat(plan): 添加背景输入和依赖强度注入 — dispatcher 自动注入 backgroundInputStatus、dependencyStrength、riskCategory 和 riskSignals，复用 orchestrate 背景治理口径
- v0.5.126 2026-03-08 Claude: feat(review): 添加 review runtime notice 和风险上下文 — dispatcher 自动注入 code-view 摘要、背景状态、riskCategory 和 riskSignals
- v0.5.125 2026-03-08 Claude: feat(code): 添加 code-view runtime notice 和字段命名统一 — dispatcher 自动注入 code-view 摘要和背景状态，统一字段命名为 camelCase (entryPoints/likelyChangeAreas/changeHazards)
- v0.5.124 2026-03-08 Claude: feat(task): 添加背景输入契约和 runtime notice — 显式声明依赖 spec.md + design.md + traceability-matrix.md，自动注入 backgroundInputStatus
- v0.5.123 2026-03-08 Claude: feat(design): 添加 design-view runtime notice 自动注入 — dispatcher 自动注入 design-view 摘要、背景状态和 risk_category (formal-design-review)，统一字段命名为 camelCase
- v0.5.122 2026-03-08 Claude: feat(spec): 添加 spec-view runtime notice 自动注入 — dispatcher 自动注入 spec-view 摘要和背景状态，degraded 模式列出缺失资产并提供修复建议
- v0.5.121 2026-03-08 Claude: feat(catchup): 添加 backgroundInputStatus 到恢复报告 — 从 stage-state.json 读取并显示背景状态（full/degraded/blind），帮助用户了解上下文质量
- v0.5.120 2026-03-08 Claude: refactor(init): 提取 detectBackgroundInputStatus 为共享函数 — 从 init.ts 移至 first-context.ts，供其他 skill 复用背景状态检测逻辑
- v0.5.119 2026-03-08 Claude: feat(onboarding): 添加 runtime notice 自动注入与数据来源标注 — dispatcher 自动注入 role-views 可用性，skill 输出显式标注推荐来源（项目分析/通用推荐）
- v0.5.120 2026-03-08 Codex: refactor(first): 删除 first legacy shim / legacy index 体系，统一 first-resume 与 change-detector 为 runtime-only，并清理 `.index.yaml` 测试与文档残留
- v0.5.118 2026-03-08 Claude: fix(verify): 修正 verify-view 字段命名 — 统一使用 camelCase（criticalFlows/validationFocus/recommendedChecks）与 TypeScript 类型定义对齐
- v0.5.117 2026-03-08 Codex: refactor(first): 显式隔离 legacy .index.yaml 兼容层为 `first-legacy-index`，收紧 first-refresh 测试夹具隔离，并补齐 Phase 2/3 文档契约缺口
- v0.5.116 2026-03-08 Codex: fix(first): 修复 docs projection 刷新遗漏与 runtime 健康门禁不一致 —— projection 源码变更现在可触发 docs/first 刷新，loadFirstContext/loadFirstRoleView 会阻断 unhealthy 的 summary/role-views，并补齐回归单测 (user-visible)
- v0.5.115 2026-03-06 Claude: docs(first): 创建证据注入实施总结 — 新增 evidence-injection-summary.md 记录完整实施过程（5 个文档/118 处证据/281% 达标率）、技术方案验证（Serena MCP/证据格式/模板化流程）、3 个关键发现、优化建议（P0-P2）、下一步行动计划，为自动化 Evidence Injection Agent 提供实践依据 (user-visible)
- v0.5.114 2026-03-06 Claude: feat(first): 完成全部 5 个文档证据注入 — tech-stack.md (14/5)、api-docs.md (19/19)、local-setup.md (5/3)、domain-model.md (5/5)、architecture.md (75/10)，全部达到 deep 模式最低标准，验证 Evidence Injection 方案完整可行性，为后续自动化证据注入奠定基础 (user-visible)
- v0.5.113 2026-03-06 Claude: feat(first): 为 domain-model.md 补充证据标注 — 添加 5 处证据标注（Stage 枚举/IdType/GateStatus/RfcStatus/DefectStatus），达到 deep 模式最低标准（5/5），完成 domain-model.md 证据注入 (user-visible)
- v0.5.112 2026-03-06 Claude: feat(first): 为 local-setup.md 补充证据标注 — 添加 4 处证据标注（构建工具 tsup/测试框架 Vitest/代码检查 ESLint+Prettier/包管理器），达到 deep 模式最低标准（5/3），完成 local-setup.md 证据注入 (user-visible)
- v0.5.111 2026-03-06 Claude: feat(first): 为 api-docs.md 补充 19 处证据标注 — 使用 Serena MCP 定位全部 19 个 CLI 命令实现位置（init/stage/id/gate/matrix/rfc/defect/metrics/doctor/golive/ai/commit/feature/setup/hooks/viewer/update/uninstall/analyze），添加完整证据标注（文件路径+行号+函数签名），达到 deep 模式最低标准（19/19），验证模板方案有效性 (user-visible)
- v0.5.110 2026-03-06 Claude: feat(first): 创建 CLI 命令证据注入模板 — 新增 cli-commands-template.md（19 个命令映射表 + Serena 搜索策略），更新 api-docs-template.md 补齐全部 19 个命令（init/stage/id/gate/matrix/rfc/defect/metrics/doctor/golive/ai/commit/feature/setup/hooks/viewer/update/uninstall/analyze），为 api-docs.md 证据注入提供完整实施方案 (user-visible)
- v0.5.109 2026-03-06 Claude: feat(first): 为 tech-stack.md 补充证据标注 — 添加 14 处证据标注（Node.js/TypeScript/ESM/tsup/Vitest/核心依赖等），符合 deep 模式要求（最低标准 5 处），验证 Evidence Injection 方案可行性 (user-visible)
- v0.5.108 2026-03-06 Claude: feat(first): 创建证据注入模板与优化路线图 — 新增 evidence-templates/ 目录（tech-stack/api-docs 模板），创建 optimization-roadmap.md 定义 4 阶段优化计划（快速修复/证据注入/智能增强/架构重构），为实现 enhance 升级模式提供技术方案 (user-visible)
- v0.5.107 2026-03-06 Claude: feat(first): 新增 quick→deep 升级策略文档 — 识别当前升级策略缺陷（只更新 frontmatter 未增强内容），新增 upgrade-strategy.md 定义 minimal/enhance/regenerate 三种升级模式，更新 interaction-guide.md 添加升级策略交互提示，为后续实现 Evidence Injection Agent 奠定基础 (user-visible)
- v0.5.106 2026-03-06 Claude: refactor(first): 00-first Skill 代码结构优化 — SKILL.md 从 714 行精简至 209 行（减少 70%），提取交互逻辑到 interaction-guide.md、模式对比到 mode-comparison.md，提升可维护性与可读性 (user-visible)
- v0.5.105 2026-03-06 Claude: feat(init): 交互式引导流程优化 — runGuidedInit 改造为分步引导模式（Step 1/7 进度提示+✅实时确认反馈）；新增 printGuidedHeader/printStepHeader/printStepConfirm 等辅助函数；增强各步骤提示信息（格式要求+示例+建议值）；平台选择简化为单次输入（移除多轮切换逻辑）；最终确认展示完整参数清单 (user-visible)
- v0.5.104 2026-03-06 Claude: feat(viewer): 优化仪表盘数据可视化 — 健康仪表盘渐变色环形图+悬停提示+阴影效果；整体布局侧边栏宽度优化+间距统一；交互动画节点悬停+点击反馈+平滑滚动 (user-visible)
- v0.5.103 2026-03-05 Claude: feat(spec): spec-first:spec 新增 Phase 0.0/0.2/0.5 增强功能（零代码方案） — Phase 0.0 Feature 快速初始化防止信息丢失；Phase 0.2 质量扫描+自动上下文收集（先做后问原则）；Phase 0.5 PRD 补全对话（三道门禁：可推导性/影响性/优先级 + 一问一答规则）；findings.md 新增 quality_score 字段；成功标准更新为 Phase 0.0-0.6 全部完成 (user-visible)
- v0.5.102 2026-03-05 Codex: fix(governance): 修复 4 个合规缺口 — `commit`/`pre-commit` 将删除文件纳入源码变更治理（`--diff-filter=ACMRD`）；pre-commit 改为逐行安全读取暂存文件以兼容含空格路径；已有 spec-first hook 安装时会自动升级为最新模板；C11 新增主 Constitution 内容哈希一致性校验（版本一致但内容漂移时阻断，支持显式 override）(user-visible)
- v0.5.101 2026-03-05 Codex: feat(governance): 强化 Constitution 执行融合度 — commit CLI 与 Git pre-commit hook 新增源码变更时的 CHANGELOG.md/CLAUDE.md 暂存校验；C11 新增 `.spec-first/constitution.md` 主副本版本一致性检查（允许显式 override 说明）；hard-gate 在 constitution>=1.1.0 时强制要求 `[PLAN-APPROVED]` 审核证据后方可进入 code 阶段 (user-visible)
- v0.5.100 2026-03-05 Codex: docs(constitution): 将 KISS/事实为本/中文输出/构思-审核-拆任务-实现强制流程/代码变动铁律固化到项目级 Constitution；同步 init 默认 constitution 模板，确保初始化自动写入上述协作规范 (user-visible)
- v0.5.88 2026-03-05 Claude: feat(robustness): 集成测试/Skills集成/配置化依赖 — 新增集成测试 tests/integration/validate-command.test.ts（7 个测试用例）；03-spec/04-design/06-task Skills 在 P4 落盘后自动调用格式校验；config.yaml 新增 dependencies 配置段支持自定义各阶段依赖项（autoCheck 开关 + stages 映射），dependency-checker.ts 优先读取配置回退到内置默认值 (user-visible)
- v0.5.87 2026-03-05 Claude: feat(robustness): P0-3.1/3.3 健壮性优化 — 新增 validate 命令（format/matrix/all 子命令）校验产物格式；format-validator.ts 支持 PRD 章节格式/ID 格式（连字符检测）/文件路径/必需字段校验；dependency-checker.ts 在 stage advance 前自动检查依赖（npm scripts/文件/环境变量），force 模式下跳过检查；新增 2 个测试文件共 9 个测试用例全部通过 (user-visible)
- v0.5.86 2026-03-05 Claude: docs(robustness): 修复技术方案文档章节编号 — spec-first-robustness-optimization.md 修正全部章节编号（P1方案5.1-5.6/P2方案6.1-6.4/实施路线图7.1-7.3/风险与缓解8.1-8.2/成功指标9.1-9.2/总结10.1-10.3），修复交叉引用（P1-4.2→P1-5.2），消除章节跳跃与重复编号问题
- v0.5.85 2026-03-05 Claude: docs(robustness): 整合全链路一致性审查问题到优化方案 — spec-first-robustness-optimization.md 新增第4章"全链路一致性问题"，整合 skills-consistency-audit.md 识别的4个问题（A1:阶段编号不一致/A2:前置产物检查缺失/A3:追溯验证不完整/A4:findings更新规则不统一），建立与现有P0/P1/P2方案的关联映射，A2纳入P0-3.3依赖检查、A3扩展P1-5.2追溯保护
- v0.5.84 2026-03-05 Claude: feat(spec): 03-spec Skill 补齐 Feature 自动定位 — v2.0.0→v2.1.0，新增"Feature定位规则"章节，P0阶段优先读取.spec-first/current自动定位，完成全部核心workflow skills的定位逻辑统一 (user-visible)
- v0.5.83 2026-03-05 Claude: feat(skills): C类2个编排skills统一Feature自动定位 — 13-orchestrate/16-sync 升级到v1.1.0，新增"Feature定位规则"章节，P0阶段优先读取.spec-first/current自动定位；11-plan保持现状（支持多Feature规划场景，已有完善的交互式选择逻辑） (user-visible)
- v0.5.82 2026-03-05 Claude: feat(skills): B类4个辅助skills统一Feature自动定位 — 05-research/08-code-review/10-archive/21-analyze 全部升级到v1.1.0+，新增"Feature定位规则"章节，P0阶段统一优先读取.spec-first/current自动定位，实现零参数启动 (user-visible)
- v0.5.81 2026-03-05 Claude: feat(skills): A类5个核心skills统一Feature自动定位 — 04-design/06-task/07-code/09-test/12-verify 全部升级到v1.1.0+，新增"Feature定位规则"章节（显式参数>自动定位.spec-first/current>交互式），P0阶段统一为"定位Feature（优先读取.spec-first/current，无则交互式提示）"，实现零参数启动 (user-visible)
- v0.5.80 2026-03-05 Claude: feat(spec-review): 新增自动 Feature 定位机制 — SKILL.md v1.0.0→v1.1.0，P0 阶段优先读取 .spec-first/current 自动定位当前激活 Feature，无则降级到交互式选择，新增 Feature 定位规则章节（显式参数>自动定位>交互式），补充 references/feature-location.md 和 optimization-proposal.md 文档 (user-visible)
- v0.5.79 2026-03-05 Claude: docs(skills): 补充 5 个核心 skills 的 references/ 文档 — 01-init（已存在 4 个）、04-design（新建 design-constraints/ds-format/gate-rules/sync-rules.md）、13-orchestrate（新建 orchestration-rules/skill-mapping/output-format.md）、16-sync（新建 sync-rules/output-format.md）、20-spec-review（新建 review-rules/output-format.md），共新建 11 个 reference 文档约 29KB，完善 skills 文档结构
- v0.5.78 2026-03-05 Claude: fix(metrics): metrics coverage 命令支持 --json 输出 — handleCoverage() 新增 --json 参数解析，输出标准 JSON 格式（C1-C9 指标对象），修复 Stage Viewer UI 数据同步问题（server.js 依赖 JSON 格式解析覆盖率数据）(user-visible)
- v0.5.77 2026-03-05 Claude: fix(test): 修复 gate-evaluator 测试 PRD 格式 — 章节标题改为标准格式（## 1. 业务目标），补充完整元信息，添加 REQ-PRD 条目到追溯矩阵，增加章节内容避免占位符扣分
- v0.5.76 2026-03-05 Claude: feat(trace): 新增 trace 命令 + ID 生成器同步修复 — 新增 spec-first trace fix/validate 命令（自动修复 TASK downstream 断裂 + 校验 C3/C8 覆盖率）；id-generator.ts 同步修复 extractSeq() 标准化 abbr、validateAbbr() 明确连字符移除规则，确保序号计算正确 (user-visible)
- v0.5.75 2026-03-05 Claude: feat(gate): 分析报告自动刷新 + AI 命令路由增强 — gate-evaluator.ts 检测报告过期（>5分钟）时自动执行 analyzeArtifacts() 刷新，避免 CRITICAL findings 误报；ai.ts 新增 task 子命令友好提示（引导用户使用 /spec-first:task），提升命令发现性 (user-visible)
- v0.5.74 2026-03-05 Claude: fix(trace): ID 格式一致性 + 覆盖率诊断增强 — id-generator.ts 自动移除 abbr 中的连字符（FR-SPEC-OPT-001 → FR-SPECOPT-001），修复追溯链断裂；coverage.ts 新增 detectIdFormatMismatch() 检测 ID 格式不匹配并输出警告，解决 C3/C8 覆盖率误报 0% 问题 (user-visible)
- v0.5.73 2026-03-05 Claude: feat(onboarding): 按角色生成中文命名文档 + 支持自定义角色 + 自动保存 — Phase 3 改为自动保存（无需询问），按角色独立文档（开发者/产品经理/测试工程师/架构师/自定义角色学习路径.md），Phase 1 支持 Other 自定义角色输入（如运维工程师、技术经理），多次执行只更新对应角色文档不覆盖其他角色；scenario-mapping.md 补充角色/任务/规模映射表 (user-visible)
- v0.5.72 2026-03-05 Claude: fix: skill-commands.ts 补充 onboarding 中文描述 — SKILL_DESCRIPTION_ZH 新增 onboarding 条目，确保 update 命令自动注册时显示正确的中文说明（"新手引导 - 交互式场景识别与学习路径推荐"）(user-visible)
- v0.5.71 2026-03-05 Claude: feat: 新增 00-onboarding Skill（P0-1 新手引导流程）— 交互式场景识别（3 问题：角色/任务/规模）、智能推荐 Skill 序列（9 个核心场景映射）、生成个性化学习路径文档；新增 Quick Start 文档（3 个典型场景端到端示例，每个 ≤5 步）；预期降低新用户上手时间从 2 小时至 30 分钟 (user-visible)
- v0.5.70 2026-03-05 Claude: docs: Skills 优化建议报告 — 基于全面审查报告（95/100 分）深度分析 4 个优化维度（用户体验/性能效率/可维护性/生态集成）、识别 12 个优化点（P0×2 + P1×4 + P2×4 + P3×2）、输出 4 阶段路线图（预期提升至 98/100），投入 29-41 人日，ROI 0.5-0.6 个月回本 (user-visible)
- v0.5.69 2026-03-05 Claude: docs: FSREQ-20260305-SPECOPT-001 完成 — E2E 抽样验收报告（四档复杂度 + 场景 A/B 全部通过），M0/M1/M2/M3 全部完成（16 个任务），产出 1 个新模块（prd-validator.ts）+ 9 个参考文档 + 6 个核心模块修改 + 1 个测试文件 + 1 个验收报告 (user-visible)
- v0.5.68 2026-03-05 Claude: test: 新增 prd-validator.test.ts — 4 个单元测试覆盖 PRD 校验主路径（完整 PRD 通过）与阻断路径（缺失章节/scenario 未判定/C-PRD<85%）(user-visible)
- v0.5.67 2026-03-05 Claude: feat(ai): catchup 接入 Step 级状态恢复 — CatchupResult 新增 stepRecovery 字段（current_step/completed_steps/skipped_steps/next_step/complexity/scenario），01_specify 阶段自动解析 findings.md YAML 状态头并输出恢复信息 (user-visible)
- v0.5.66 2026-03-05 Claude: feat(trace): matrix.ts 补齐 PRD→FR 映射规则 — checkMatrix 断链检查新增 REQ-PRD-* upstream 校验，每个 FR 至少需要 1 条 PRD upstream 引用，缺失时记录到 brokenChains 与 warnings (user-visible)
- v0.5.65 2026-03-05 Claude: feat(gate): sca/analyze 纳入 PRD 检查 — checkSpecify 新增 SCA-SPEC-00（PRD→FR 映射完整性，每个 FR 至少 1 条 REQ-PRD-* upstream）、analyzeArtifacts 新增 prd.md 必需产物检查与 COVERAGE_GAP_PRD 发现项 (user-visible)
- v0.5.64 2026-03-05 Claude: feat(gate): gate-evaluator 新增 G-SPEC-00 — 01_specify 阶段新增 PRD 存在性检查与 C-PRD>=85% 阻断条件，调用 validatePrd() 评估 PRD 质量并输出评分与错误数 (user-visible)
- v0.5.63 2026-03-05 Claude: feat(template): artifact-checker 纳入 prd.md — 将 prd.md 添加到 ARTIFACT_DEFS 的 01_specify 阶段必需产物列表，缺失时返回 missing 状态 (user-visible)
- v0.5.62 2026-03-05 Claude: feat(gate): 新增 prd-validator.ts — PRD 章节完整性校验（4 必需章节 + 场景特定章节）、场景校验（greenfield/iteration + scenario_reason/evidence_paths/complexity）、C-PRD 评分算法（元信息 30% + 章节完整性 40% + 内容充实度 30%），支持 >=85% 阈值判定 (user-visible)
- v0.5.61 2026-03-05 Claude: feat(spec): 03-spec Skill M1 完成 — 新增 findings-state-header.md（状态头规范/Step 级恢复协议/更新时机/恢复流程），M1 阶段 6 个任务全部完成，产出 1 个主文档 + 9 个参考文档 (user-visible)
- v0.5.60 2026-03-05 Claude: feat(spec): 03-spec Skill references 补齐 — 新增 8 个参考文档（complexity-classification/question-gate-rules/expansion-sweep-rules/convergence-qa-rules/adr-lite-template/final-confirmation-template/prd-template-greenfield/prd-template-iteration），覆盖四档复杂度判定/Question Gate 提问策略/Expansion Sweep 发散扫描/收敛问答规则/ADR-lite 决策记录/最终确认包/PRD 双场景模板 (user-visible)
- v0.5.59 2026-03-05 Claude: refactor(spec): 03-spec Skill v1.0.0→v2.0.0 — 重构为 Phase 0 + Step 0-8 流程，新增四档复杂度分流（Trivial/Simple/Moderate/Complex）、PRD 必产物（Phase 0.1-0.5 五子阶段）、findings.md 结构化状态头（current_step/completed_steps/skipped_steps/next_step/complexity/scenario）、节点跳过规则与 SKIPPED 记录约束、Dynamic Clarification Questions（5 步生成）、Question Gate（Blocking/Preference 分类）、Expansion Sweep（DIVERGE）、Q&A Loop（CONVERGE）、ADR-lite 决策记录、最终确认包模板、REQ-PRD-* upstream 追溯要求、C-PRD>=85% 阻断条件 (user-visible)
- v0.5.58 2026-03-05 Claude: refactor(catchup): 02-catchup Skill v1.0.0→v1.1.0 — 新增 Announce at Start、字面即精神原则、When to Use/Don't Skip Catchup When、6 步恢复报告模板（Feature 信息/任务进度/最近发现/文件完整性/风险识别/建议下一步）、5-Question Reboot Test（Q1-Q5 逐项回答格式）、上下文恢复策略（信息源优先级 P0-P5/8 步恢复流程）、信息缺口处理（5 类缺口/补齐方案）、恢复质量评估（4 分数段）、决策流程图、references/ 目录（catchup-report-template/context-recovery-guide/reboot-test-checklist）、hooks 配置、user-invocable 标记 (user-visible)
- v0.5.57 2026-03-05 Claude: refactor(status): 14-status Skill v1.0.0→v1.1.0 — 新增 Announce at Start、When to Use/Don't Skip Status Check When、状态仪表盘模板（基本信息/阶段进度/覆盖率/健康分/任务进度/风险识别）、健康分解读（4 维度计算/分数段定义）、风险指标（7 类风险/3 等级/处理优先级）、决策流程图、references/ 目录（status-dashboard-template/health-score-guide/risk-indicators）、hooks 配置、user-invocable 标记 (user-visible)
- v0.5.56 2026-03-05 Claude: refactor(code): 07-code Skill v1.0.0→v1.1.0 — 新增 Announce at Start、When to Use/Don't Skip Code Review When、代码变更决策流程图、Code Review 前检查清单（代码质量/追踪完整性/变更影响）、Traces Trailer 规范详解（4 字段/多关联格式）、代码质量门禁（静态检查/动态检查/审查维度）、回滚策略（变更分类/触发条件/回滚流程）、references/ 目录（code-standards/test-template/diff-template）、hooks 配置强化、user-invocable 标记 (user-visible)
- v0.5.55 2026-03-05 Claude: refactor(verify): 12-verify Skill v1.0.0→v1.1.0 — 新增 Announce at Start、When to Use/Don't Skip、Gate 条件映射（8 阶段 25+ 条件）、WAIVER 机制详解（4 类场景/记录格式）、失败处理流程、verify 报告格式（6 部分结构）、覆盖率指标详解（C1-C11）、决策流程图增强、references/ 目录（gate-conditions/coverage-metrics/verify-report-template）、hooks 配置强化、user-invocable 标记 (user-visible)
- v0.5.54 2026-03-05 Claude: refactor(plan): 11-plan Skill v1.0.0→v1.1.0 — 新增 Announce at Start、字面即精神原则、When to Use/Don't Skip、风险评估详解（7 类风险/4 等级）、findings.md 字段详解（计划摘要/阶段状态）、决策流程图增强、Plan Mode 协同增强、编排规则、references/ 目录（findings-schema/risk-assessment）、hooks 配置、user-invocable 标记 (user-visible)
- v0.5.53 2026-03-05 Claude: refactor(test): 09-test Skill v1.0.0→v1.1.0 — 新增 Announce at Start、字面即精神原则、When to Use/Don't Skip、TDD 原则（Red-Green-Refactor）、测试层级详解（UT/IT/E2E/ST）、测试用例结构规范、决策流程图、Plan Mode 协同、references/ 目录（test-level-guide/test-case-template）、hooks 配置、user-invocable 标记 (user-visible)
- v0.5.52 2026-03-05 Claude: refactor(task): 06-task Skill v1.1.0→v1.2.0 — 新增 Execution Handoff（3 种执行方式）、Hooks 行为规范、中断恢复策略、Error Log Pattern、Decision Log Pattern、Operation Types（[AI]/[USER] 分工） (user-visible)
- v0.5.51 2026-03-05 Claude: refactor(task): 06-task Skill v1.0.0→v1.1.0 — 新增 Announce at Start、字面即精神原则、Bite-Sized Granularity（2-4h/任务,5-30min/步骤）、Task Structure Detail、决策流程图、When to Stop and Ask、Plan Mode 协同、references/ 目录（task-checklist/task-template）、hooks 配置、user-invocable 标记 (user-visible)
- v0.5.50 2026-03-05 Claude: refactor(research): 05-research Skill v1.4.0 — 新增 Operation Types 章节（[AI]/[USER] 操作分工）、模板引用路径表、metadata.version 分离 (user-visible)
- v0.5.49 2026-03-05 Claude: refactor(research): 05-research Skill v1.3.0 — 新增 hooks 配置（PreToolUse/PostToolUse/Stop）、allowed-tools 工具白名单、user-invocable 标记、Hooks 行为规范章节 (user-visible)
- v0.5.48 2026-03-05 Claude: refactor(research): 05-research Skill 深度优化 — 新增 references/ 目录（research-checklist/tech-comparison-template/evidence-types）、新增 Announce at Start 约束、新增 When to Use/Don't Skip Research When 章节、新增 Evidence Protocol、成功标准补充 Review Checklist；版本号 v1.1.0→v1.2.0 (user-visible)
- v0.5.47 2026-03-05 Claude: refactor(research): 05-research Skill 结构优化 — 补充字面即精神原则、反合理化守卫、模板驱动约束、Research 流程决策图、Plan Mode 协同、确认策略矩阵、示例输出格式；版本号 v1.0.0→v1.1.0 (user-visible)
- v0.5.46 2026-03-04 Claude: First Skill 新手引导增强 — README 新增新手必读章节、codebase-overview 新增开发入口章节 (user-visible)
- v0.5.99 2026-03-03 Claude: fix: 修复 stage 文案错误与 init 前置检查时机 — (1) `handleCurrent/handleAdvance` 缺参时显示正确的用法提示（current/advance 而非 cancel）；(2) 交互式 init 在参数采集前先检查 00-first 是否完成；(3) 测试添加 console.error 内容断言 (user-visible)
- v0.5.98 2026-03-03 Claude: feat: 01-init 添加 00-first 前置检查 — 执行 `spec-first init` 前检查 00-first Skill 是否完成（docs/first/ 目录及必需文档），未完成时提示用户先运行 `/spec-first:first` (user-visible)
- v0.5.97 2026-03-03 Claude: refactor: stage.ts 代码质量优化 — 提取 AI_HOOK_TYPES 常量、checkAIHooksStatus/countSkillCommands 独立函数、catch 块添加警告日志（handleCurrent 从 ~65 行降至 ~45 行）
- v0.5.96 2026-03-03 Claude: docs: First Skill deep 模式全量更新 — 重新生成 10 个项目认知文档（tech-stack/codebase-overview/architecture/call-graph/api-docs/external-deps/development-guidelines/local-setup/domain-model/README），deep 模式强制证据标注，Serena LSP 辅助分析 (user-visible)
- v0.5.95 2026-03-03 Claude: fix: 01-init Skill P5 输出完整性 — `spec-first stage current` 现在输出完整信息（目录、平台、Hooks 状态、AI Hooks 状态、Skill 命令状态），与 SKILL.md 规格对齐 (user-visible)
- v0.5.94 2026-03-03 Claude: docs(agent-database): 多数据库支持 — 添加配置优先检测、自动检测降级、CLI 验证流程，支持多数据库场景（索引+子文档产物），新增 database-config.md 配置指南 (user-visible)
- v0.5.93 2026-03-02 Claude: docs: 完成项目全面代码审查 — 生成 4 阶段审查报告（代码质量与架构 B+、安全与性能 B、测试与文档 B-、最佳实践 A-/D*）+ 最终综合报告（05-final-report.md），识别 52 项问题（9 项 P0 关键、11 项 P1 高优先、14 项 P2 中等、18 项 P3 低），总体评级 B+，附 4 周修复行动计划
- v0.5.92 2026-03-02 Claude: docs: 创建 3 个 ADR 文档 — ADR-001 meta/local 目录分离（四层配置合并架构）、ADR-002 模板哈希注册表（SHA-256 变更检测）、ADR-003 Manifest 迁移引擎（声明式 YAML 迁移）
- v0.5.91 2026-03-02 Claude: refactor: CQ-002 update.ts runUpdate 职责拆分 — 提取 refreshHostIntegrations 函数（Skills/MCP/Hooks 刷新），runUpdate 从 ~65 行降至 ~30 行（1032 tests passed）
- v0.5.90 2026-03-02 Claude: refactor: BP-LI-002 version-matcher.ts 改用 semver 包 — compareVersions 从手动 split/map/Number 改为 semver.compare + semver.coerce，消除手动版本比较逻辑（1032 tests passed）
- v0.5.89 2026-03-02 Claude: fix: PERF-002 配置缓存添加 30s TTL 过期机制 — configCache 从 Map<string, Config> 改为带 cachedAt 时间戳的 CacheEntry，读取时检查过期（1032 tests passed）
- v0.5.88 2026-03-02 Claude: refactor: PERF-001 hash-registry.ts 异步化 — computeTemplateHashes/loadHashRegistry/saveHashRegistry 改用 fs/promises，消除同步递归遍历阻塞事件循环；update.ts/setup.ts 调用链同步升级 async/await（1032 tests passed）
- v0.5.87 2026-03-02 Claude: fix: 修复三处遗留问题 — testing-strategy.md 删除重复旧版段落、agents-code-analysis.md overview→quick 语义修正、配置路径统一为 .spec-first/meta/config.yaml（doctor.ts/session-hook.ts/update-scaffold.test.ts）
- v0.5.86 2026-03-02 Claude: feat: 00-first Skill 会话恢复与产物索引 — 产物索引文件（.index.yaml，基于 js-yaml）、会话恢复提示（generateResumeRecommendation、formatResumePrompt、formatProductSummary）、产物过期检测（7 天阈值/Git commit 不匹配）、新增 first-index.ts 和 first-resume.ts 模块、测试覆盖 33 个用例（24 + 9）、总测试覆盖 104 个（first-args 54 + change-detector 17 + index 24 + resume 9） (user-visible)
- v0.5.85 2026-03-02 Claude: feat: 00-first Skill 增量更新边界条件 — 变更文件→受影响产物映射（FILE_TO_ARTIFACT_MAP）、30% 变更阈值策略、产物健康检查（last_updated/git_commit/file_hash/格式校验）、选择性更新参数（--update/--since/--check-health）、新增 first-change-detector.ts 模块、测试覆盖 71 个用例（54 + 17） (user-visible)
- v0.5.84 2026-03-02 Claude: feat: 00-first Skill 交互模式优化 — SKILL.md 新增"模式选择与交互策略"（默认交互式、展示 quick/deep 选项对比）、first-args.ts 支持 --auto/--quick 标志（新增 auto 字段、resolveFirstModePolicy 函数）、测试覆盖 39 个用例（新增 11 个）、更新文档一致性测试 (user-visible)
- v0.5.83 2026-03-02 Claude: feat: T1+U5+T2+confirm 实现 — U5 meta/local 目录分离（四层架构 L0→L1→L2→L3、配置三级合并、模板三级查找链、迁移脚本、update 只写 meta）；T1 模板哈希与变更分级更新（哈希注册表、变更分类器、决策矩阵、集成 update）；T2 Manifest 迁移引擎（schema/loader/matcher/engine 六文件、集成 update、迁移模板目录）；confirm-policy 接入路由；新建 10 个文件，修改 5 个文件 (user-visible)
  - **BREAKING**: 配置文件目录从 `.spec-first/config.yaml` 迁移至 `.spec-first/meta/config.yaml`（旧路径仍兼容但优先级最低）；`update` 命令写入目标从项目根改为 `.spec-first/meta/`；升级后首次运行 `spec-first update` 会自动创建新目录结构
- v0.5.82 2026-03-02 Claude: feat: 00-first Skill Phase 3 高级特性 — 模板按端定制（backend/frontend/mobile 架构模板、api-docs 视角差异）、复合类型检测优化（Monorepo 子包识别、Flutter Web 混合）、智能模式推荐（代码量/API 端点判断）、渐进式升级（quick→deep 追加提示）、默认无交互模式、测试策略新增 15 个 Phase 3 用例 (user-visible)
- v0.5.81 2026-03-02 Claude: feat: 00-first Skill Phase 2 端类型智能检测 — 新增 7 种端类型检测规则（backend/frontend/mobile/cross-platform/desktop/monorepo/mixed）、创建端类型产物映射配置、增强 Greenfield/Brownfield 判断、新增检测失败降级策略、测试策略新增 13 个用例 (user-visible)
- v0.5.80 2026-03-02 Claude: feat: 00-first Skill quick/deep 双模式重构 — Layer 0 (quick: 4-5 个核心产物)、Layer 1 (deep追加: 6 个完整产物)、新增 CLI 参数支持 (--deep/--type/--force)、SKILL.md 升级至 v2.0.0、测试策略新增 quick 模式用例、skill-commands.ts 同步 first 描述 (user-visible)
- v0.5.79 2026-02-28 Claude: feat: 00-first Skill 质量保障强化 — 核心约束增加强制证据标注格式（file:line + 代码片段）、5 个 agent 规格文件补齐证据协议与抽样验证规则、P5 新增交叉一致性验证（V1-V4 四项校验 + 证据抽检）、成功标准同步更新 (user-visible)
- v0.5.78 2026-02-28 Claude: fix: 00-first Skill 审查修复 — README 模板对齐实际产出、条件产物改为条件渲染、call-graph frontmatter 补全、P3 阶段引用消歧、Serena 工具名修正、description 措辞修正
- v0.5.77 2026-02-28 Claude: docs: 新增调用链分析文档 — 使用 Serena MCP 分析项目调用链，生成 `docs/first/call-graph.md`，包含模块依赖矩阵、Mermaid 依赖关系图、关键调用路径、模块符号概览、循环依赖分析、数据流图和改进建议 (user-visible)
- v0.5.76 2026-02-28 Claude: fix: 修复 first Skill 中文描述缺失 — 在 skill-commands.ts 的 SKILL_DESCRIPTION_ZH 映射表中添加 first 描述，确保 `/spec-first:first` 命令在 Claude/Codex 中显示正确的中文说明 (user-visible)
- v0.5.75 2026-02-28 Claude: docs: 统一 CLI 命令与 README Skill 中文描述 — 对齐 19 个 CLI 命令描述与 skills/spec-first/README.md 中的 Skill 说明，确保用户在不同场景（CLI help/README/AGENTS.md）看到一致的术语与表述 (user-visible)
- v0.5.74 2026-02-28 Leo: feat: 00-first Skill 新增依赖调用链分析 — 集成 Serena MCP 进行 LSP 级别符号分析，生成模块依赖矩阵和调用关系图，帮助新人快速理解模块间调用关系 (user-visible)
- v0.5.73 2026-02-28 Leo: feat: 00-first Skill 优化 — 新增任务计划展示，执行前输出即将生成的文档列表和并发策略，提升用户体验 (user-visible)
- v0.5.72 2026-02-28 Leo: feat: 00-first Skill 增强 — 新增研发规范文档（development-guidelines.md，含 6 模块 + Context7 最佳实践对比）和索引导航（README.md），产物从 7 个扩展为 9 个 (user-visible)
- v0.5.71 2026-02-28 Leo: feat: 新增 00-first Skill — 项目快速认知，自动生成技术栈/代码概览/架构图/API文档/外部依赖/本地环境/数据库ER共7份文档，支持9语言14框架7端7种数据库，4子agent并发生成，幂等增量更新 (user-visible)
- v0.5.70 2026-02-28 Leo: docs: 安装与更新 + README 文档修正 — Skills 数量 19→21、补充 update --host 选项、FEAT 格式描述精确化、版本徽章同步、setup 标注废弃
- v0.5.69 2026-02-28 Leo: fix: S2/S3/S4/S6 — estimateTokens 中文比率 /4→/3；pct() 零分母返回 0 替代 1；覆盖率阈值提升至 75/75/65/75；ESLint 纳入 scripts/*.ts
- v0.5.68 2026-02-28 Leo: refactor: S5 消除 server.js 与 task-parser.ts 健康分数逻辑重复 — 提取 health-utils.js 共享模块（METRIC_DEFS/WEIGHTS/getGrade/getDefaultMetrics/calcHealthScore），server.js 和 task-parser.ts 均改为 import
- v0.5.67 2026-02-28 Leo: refactor: S1 提取 parseMarkdownTable 共享函数 — 消除 7 处 Markdown 表格解析重复代码（security.ts/matrix.ts×2/init.ts/rfc.ts/exception-validator.ts/hard-gate.ts），统一使用 slice(1,-1) 保留空单元格，修复 parseMatrixIds 的 filter(Boolean) 行为不一致问题
- v0.5.66 2026-02-28 Leo: fix: Stage Viewer 安全漏洞修复（C1/C2）— 修复命令注入漏洞（execSync→execFileSync 参数数组）+ 路径遍历漏洞（新增 sanitizeFeatureId 校验）；所有 API 路由（/metrics、/timeline、/defects、/tasks、/gate-status、/）应用 featureId 白名单校验；修复 Hook 死代码（C3）+ commit-msg.sh 空值保护（I12）— 清理 commit-msg.sh/pre-push.sh 死代码段；调整 --version 检查顺序避免 $1 为空时报错；增加 perf 到 conventional commits 列表；修复 Config 缓存（C4）— 改用 Map<string, SpecFirstConfig> 按 projectRoot 分别缓存，避免多项目场景配置串用；resetConfigCache 支持选择性删除单个项目缓存；提取 parseFlag 工具函数（I1）— 创建 src/cli/parse-utils.ts 统一参数解析逻辑；更新 7 个命令文件（id/stage/rfc/defect/commit/analyze/init）和 ai.ts 的 readOptionValue 改用 parseFlag；新增 parseFlagAll 和 hasFlag 辅助函数；修复 updateMatrixRow 真值检查（I4）— status/title/upstream/downstream 改用 !== undefined 显式判断；修复 HEAD~5 回退（I6）— 添加提交数量检查，shallow clone 时使用 min(commitCount, 5) 指定回退深度；修复 catch 块错误信息（I7）— gate.ts/ai.ts 改用 (e as Error).message 保留原始错误详情；修复 id.ts 类型校验（I8）— 添加 VALID_NEXT_TYPES/VALID_ID_TYPES/VALID_TC_LEVELS 校验集；修复 isValidTaskId 正则（I9）— 改为 /^TASK-[A-Z0-9]{1,20}-\d{1,}$/（TASK-<ABBR>-<SEQ> 格式）；修复原子写入（I10）— 新增 atomicWriteJson() 使用 temp + rename 模式；修复 handleSwitch 校验（I11）— 添加 stage-state.json 存在性检查；消除重复函数（C5/C6）— matrix.ts 导出 parseMatrixIds()，id-generator.ts/id-search.ts 改用导入；rfc.ts 导出 loadRfcStatuses()，coverage.ts/gate-evaluator.ts 改用导入；删除本地重复实现；修复 catchup lock map（I5）— 清理过期锁防止无界增长，新增 skipped 字段区分节流跳过与真实结果；修复 install-codex-autostart.sh（I13）— 根据 $SHELL 环境变量检测并选择正确的 rc 文件（.zshrc/.bashrc）；修复 assertSafePath（I2）— 改用 isAbsolute+resolve 替代 .. 段检查，允许含 .. 的合法绝对路径，拒绝相对路径；新增 readJsonChecked（I3）— 带运行时 shape check 的 readJson，新增 validators.ts（isStageState/isRfcRecord/isDefectRecord），gate-evaluator/advance/hard-gate/getRfc/getDefect 等安全敏感路径改用 readJsonChecked (user-visible)
- v0.5.65 2026-02-28 Leo: feat: V2-13 Orchestrate Auto Loop — `/spec-first:orchestrate --auto/--resume` 自动迭代（23 TASK 完成）：Phase A 主循环+watchdog+超时+审计hash链+配置schema+P4→P2回退；Phase B 完成检测+重试backoff+幂等写入+Front Matter；Phase C ContextProvider+_context审核+required_mcps+slop检查；Phase T 101 tests覆盖（88 unit + 13 e2e），857 passed (user-visible)
- v0.5.64 2026-02-28 Leo: docs: README 大重写 — 消除四章节重复、合并架构+流程+追踪章节、修正核心模块数(7→9)、对齐代码实际状态(19 CLI/21 Skill/9 Module)，1385→761 行 (user-visible)
- v0.5.63 2026-02-28 Leo: docs: V2-13 开发任务文档 v1.2 — 多 Agent 审查修正（补齐原子写入/Fresh Context/错误分类验收标准；修正 008/016/018/021 依赖链；修正 012 优先级 P0→P1；修正 022 悬空 traces；消除 009↔016 循环依赖）
- v0.5.62 2026-02-27 Leo: feat: Stage Viewer Feature 列表进度条 — 侧边栏 Feature 列表新增进度条与百分比徽章，基于当前阶段计算完成进度（00_init=0% → 06_wrap_up=100%）；支持多 Feature 并行进度对比 (user-visible)
- v0.5.61 2026-02-27 Leo: feat: Stage Viewer 时间线视图 — 按时间轴展示阶段流转历史，可视化各阶段耗时（甘特图样式）；新增 /api/feature/:id/timeline API 计算阶段持续时间；支持已完成/进行中/待开始三种状态；显示总时长与开始时间 (user-visible)
- v0.5.60 2026-02-27 Leo: refactor: Stage Viewer 模块化重构 — 将 index.html 中的 CSS/JS 解耦为独立文件（styles.css + app.js）；更新 server.js 添加静态文件服务路由；清理 HTML 重复结构 (user-visible)
- v0.5.59 2026-02-27 Leo: feat: Stage Viewer 缺陷列表详情 — 点击缺陷统计面板展开缺陷列表，显示严重级别(S1-S4)、状态(待处理/修复中/已修复)、标题、更新时间；新增 getDefects() 后端函数；更新 /api/feature/:id/defects API 返回缺陷列表 (user-visible)
- v0.5.58 2026-02-27 Leo: feat: Stage Viewer Gate 实时状态 — 阶段流转图显示各阶段 Gate 状态（✓ PASS / ~ 豁免 / ✗ FAIL）；新增 /api/feature/:id/gate-status API；CSS 样式支持状态徽章；更新测试数据为新格式 (user-visible)
- v0.5.57 2026-02-27 Leo: fix: Stage Viewer 三元表达式语法错误 — 修复 renderTaskProgress 中 progressColor 三元表达式缺少闭合括号导致的页面报错 (user-visible)
- v0.5.56 2026-02-27 Leo: test: Stage Viewer 单元测试 — 新增 `tests/unit/stage-viewer.test.ts` 覆盖 normalizeTaskStatus/parseTaskPlan/getDefaultMetrics/calcHealthScore 四个核心函数（21 个测试用例）；提取 `scripts/stage-viewer/task-parser.ts` 为可测试模块；修复 calcHealthScore 四舍五入后 grade 计算不一致问题
- v0.5.55 2026-02-27 Leo: feat: Stage Viewer 任务进度可视化 — 新增任务统计卡片（已完成/进行中/待处理）、总体进度条、当前进行中任务面板、阶段卡片网格（Phase 1-5 进度与状态）；新增 /api/feature/:id/tasks API 端点解析 task_plan.md；修复 CSS 语法错误（phase-grid 闭合括号） (user-visible)
- v0.5.54 2026-02-27 Leo: docs: README.md 新增名词说明章节 — 添加 8 个分类（核心概念/追踪ID体系/Gate相关/覆盖率指标/变更与缺陷/Skill相关/CLI相关/文件与目录/V-Model追踪/架构模块）共 50+ 术语定义；覆盖 Feature/Stage/Gate/Skill/CLI/FR/DS/TASK/TC/C1-C9 等核心概念 (user-visible)
- v0.5.53 2026-02-27 Leo: feat: Stage Viewer 健康仪表盘 — 新增健康分圆形进度条（H1 综合评分 + 等级 A-F）、覆盖率条形图（C1-C9 九项指标含中文说明，通过/警告/失败三级状态）、缺陷统计面板（S1-S4 分级统计 + 待处理数量）；新增 /api/feature/:id/metrics 和 /api/feature/:id/defects API 端点；从追踪矩阵推断覆盖率的兜底逻辑 (user-visible)
- v0.5.52 2026-02-27 Leo: docs: README.md 详细功能对比模块同步更新 — 新增 6 个对比维度（AI行为约束/扩展系统/调试流程/工作区隔离/规范质量）；同步 V-Model 四层ID、HARD-GATE、[P]/[US] 标记、Extension System 等已集成功能；对比维度从 15+ 项扩展至 19 项 (user-visible)
- v0.5.51 2026-02-27 Leo: docs: README.md 生态对比深度细化 — 基于 Context7 深度研究 OpenSpec/Spec Kit/Superpowers/Planning-with-Files 框架；新增框架概览图、详细功能对比表、框架深度解析、核心差异分析、场景化选型指南、组合方案、技术栈兼容性；对比维度从 9 项扩展至 15+ 项 (user-visible)
- v0.5.50 2026-02-27 Leo: docs: README.md 全面更新 — 基于项目代码与 Skill 深度理解更新 README.md；完善目录结构、快速开始指南、Skill 体系说明、CLI 命令详解、技术栈与目录结构、核心类型定义；更新版本号至 v0.5.45；添加阶段×Skill 映射表与 Skill 依赖关系图 (user-visible)
- v0.5.49 2026-02-27 Leo: docs: Skills 测试策略与覆盖评估报告 — 评估 Spec-First Skills 目录测试策略与覆盖情况；发现 Critical×2（变更回归检测缺失）、High×5（模板验证、CLI 依赖完整性、交叉引用一致性）、Medium×8（示例质量、引用可解析性）、Low×3；输出 `docs/testing-strategy-coverage-skills-assessment-2026-02-27.md`
- v0.5.48 2026-02-26 Leo: docs: 文档准确性修正 — CLI参考手册删除 gate check 不存在的 --stage/--ci 参数；安装与更新方案 Skill 数量统计修正 19→21
- v0.5.47 2026-02-26 Leo: docs: 更新开发任务文档修复进度 — `落地清单-开发任务.md` 升级至 v1.12；同步回写本轮回归收口（doctor SessionStart 诊断修复、skill-runtime 测试稳健性修复、T009 验收勾选完成）与最新文档状态口径 (user-visible)
- v0.5.46 2026-02-26 Leo: fix: 收口剩余回归与稳定性问题 — `doctor` 复用 `session-hook-managed` 统一托管识别并修复 SessionStart 检查类型错误（`pnpm tsc --noEmit` 通过）；`skill-runtime` 测试提交步骤显式关闭 `commit.gpgsign` 以消除环境签名差异导致的失败；同步回写 T009 验收清单勾选状态 (user-visible)
- v0.5.45 2026-02-26 Leo: feat: 清单收口第三批 — 新增 Extension System 底座（`.spec-first/extensions/*/extension.yaml`，支持 namespace/version/enabled，装载 Rule+Skill+Hook）；`layer-merger` 接入扩展规则（Gate ID 命名空间隔离、阈值 key 命名空间化）；`dispatcher` 支持 `ext.<namespace>.<skill>` 路由并统一注入 Next Steps 交接约束；`ai-runtime-hook` 支持扩展 Hook 装载；追踪体系新增 V-Model 四层 ID（REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP）与双向配对检查；新增 `.spec-first/layer2/v-model.yaml` 与对应单测 (user-visible)
- v0.5.44 2026-02-26 Leo: fix: SessionStart legacy 识别防误删强化 — 兜底短格式匹配新增 entry 指纹约束（`matcher='*'` + `type='command'` + `timeout=15`）后才判定托管；保留强信号快速识别；补充 quoted other-tool 保留用例，避免清理非托管 SessionStart (user-visible)
- v0.5.43 2026-02-26 Leo: feat: 补齐剩余清单关键项 — `todo-runner` 新增依赖就绪并行批次调度（`pickReadyTodos`，顺序屏障 + in_progress 恢复优先）；Feature 定位支持“精确→前缀→环境变量”降级链；`ai context` 接入 Progressive Disclosure（默认 summary、`--expand/--full` 增量明细、token 预算/估算可观测）；`update`/skill 注册支持 `--host` 与 generic 目标；设计阶段推进后自动同步宿主上下文托管区块并保留手动块；补充对应单测 (user-visible)
- v0.5.42 2026-02-26 Leo: fix: SessionStart legacy 托管识别稳健性增强 — `session-hook-managed` 从固定整段签名改为组合特征匹配（`viewer open` + `--print-url` + `--background` + quoted bin）；兼容重定向变体；新增非托管 `other-tool viewer open --print-url --background` 保留用例，防止误删 (user-visible)
- v0.5.41 2026-02-26 Leo: fix: 删除 orchestrate SKILL.md 重复标题 — 移除第109行空的"批量执行与检查点（P1-13）"标题，保留第125行完整章节 (user-visible)
- v0.5.40 2026-02-26 Leo: docs: 功能完整性与Skill逻辑审查报告 — 2个并发Agent审查42个CLI命令/39个核心模块/21个Skills；功能完整性100%、Skill逻辑准确性通过；发现1个Low问题（orchestrate SKILL.md重复内容）；输出 `docs/function-skill-review-report-2026-02-26.md`
- v0.5.39 2026-02-26 Leo: fix: SessionStart 托管识别统一为显式标记 + 兼容旧规则 — 新增共享识别模块 `session-hook-managed`，注册命令注入 `SPEC_FIRST_MANAGED_SESSION=1`，`registerSessionHooks` 与 `uninstall` 共用同一识别函数；补充无 `spec-first` 字面量 legacy 命令迁移与清理回归测试 (user-visible)
- v0.5.38 2026-02-26 Leo: docs: 全链路代码审查报告 — 5个并发Agent（安全/性能/质量/最佳实践/测试覆盖）审查67个TS源文件；发现Critical×1（命令注入）、High×7（路径遍历/I/O阻塞/函数过长）、Medium×40+、Low×28+；输出 `docs/code-review-report-2026-02-26.md`
- v0.5.37 2026-02-26 Leo: fix: Planning-with-Files P1-2 PostToolUse 进度同步提醒 — 新增 `progress-sync.sh` 脚本；PostToolUse Hook 增加"进度同步提醒"与 matrix check 并存；每次文件修改后提醒 AI 检查是否需要更新 task_plan.md 状态；补充对应单测；修复 tool-integration.test.ts 断言（5→6 hook configs）(user-visible)
- v0.5.36 2026-02-26 Leo: fix: Superpowers P0-1/P1-2/P1-3/P1-4 + Planning-with-Files P0-1/P0-2/P1-1/P2-1/P2-2 问题修复 — Session Hook 注入技能路由表+1%规则；03-spec/05-research 补充 2-Action Rule；catchup 输出 5-Question Reboot Test 结构化答案；spec/design/orchestrate 添加 Graphviz 决策图；hard-gate 增加 Worktree First 运行时守卫（分支检测+高风险评估）；doctor 增加 Session Hook 可达性诊断；context-pack 接入 sliceContext 分层压缩 + buildTaskContextPack (TASK 级独立上下文); prompt-assembler 增加 KV-Cache 稳定性规则文档与校验函数 (user-visible)
- v0.5.35 2026-02-26 Leo: fix: SessionStart Hook 路径回退稳健性增强 — 使用注册阶段解析到的 CLI 绝对路径作为 `SPEC_FIRST_BIN_FALLBACK` 注入；运行时优先 `SPEC_FIRST_BIN`，否则回退到已解析路径；补充单测覆盖路径注入与命令执行变量展开
- v0.5.34 2026-02-26 Leo: fix: 低级别优化 + 回归修复 — awk 脚本兼容旧格式 task_plan.md（首列非 TASK-* 时扫描行内 TASK-* 单元格）；uninstall 补齐 managed hook 清理；`any` 窄化为 `unknown`；prompt-assembler 添加 Context Pack 大小软限制；补 blocked 状态与 N/A 边界测试；07-code 持久化规则与决策矩阵合并为子章节
- v0.5.33 2026-02-26 Leo: fix: 补齐 3 项 Skill 层缺失 — orchestrate 上下文裁剪"不传递"补第 4 项；AGENTS.md 新增 P1-09 动态 Prompt 组装规则；orchestrate 新增 P1-10 Todo 续航状态机章节
- v0.5.32 2026-02-26 Leo: fix: HARD-GATE 任务状态解析稳健性增强 — `hard-gate` 的 in_progress 检测由单条正则升级为行级表格解析（兼容无尾 `|` 与列顺序变化）；补充对应单测覆盖，避免误阻断 code skill (user-visible)
- v0.5.31 2026-02-26 Leo: fix: HARD-GATE 分层优化 — 移除 `dispatcher` 路由层对 design/code 的提前阻断，恢复 Skill P0 定位能力；新增 Skill 加载期 HARD-GATE 运行时检查提示（PASS/BLOCKED + 补救动作），仅禁止实施动作不阻断上下文定位；补充对应单测并通过全量回归 (user-visible)
- v0.5.30 2026-02-26 Leo: docs: 开发任务状态收口更新 — `docs/02开发任务/落地清单-开发任务.md` 升级至 v1.11；按用户指示将 P1-17 标记为 Blocked（暂缓，Linux 实机验收待补），其余任务状态维持完成 (user-visible)
- v0.5.29 2026-02-26 Leo: feat: P1 收口（第二阶段）— 完成 P1-09/10/11/12/19；新增 `prompt-assembler` 与 `todo-runner` 运行时能力，`dispatcher` 接入 design/code HARD-GATE 入口阻断（阶段与前置产物校验）；`ai-runtime-hook` 软降级策略与 `catchup` Todo 摘要联动；补充对应单测与集成测试；开发任务文档更新至 v1.10（P1-17 保持 In Progress，Linux 实机验收待补） (user-visible)
- v0.5.28 2026-02-25 Leo: feat: P1 批次能力落地（阶段一）— 完成 P1-01/02/03/04/05/06/07/08/13/14/15/16/18 核心规则实现；新增 spec review 清单与 UT/IT/E2E/ST 词典；SessionStart 增加自动恢复提示；code-review 升级两阶段审查；plan/orchestrate 增加边界与决策图；phase-machine 归档阈值升级为“行数 + 风险标记”组合门槛；新增 `task-context` 钩子测试与风险归档测试；开发任务文档更新至 v1.9 并逐项回写 P1 状态 (user-visible)
- v0.5.27 2026-02-25 Leo: docs: 落地清单开发状态回写 — `docs/02开发任务/落地清单-开发任务.md` 更新至 v1.8，T001-T009 状态统一标记为 Done（已完成开发），文档状态更新为 In Progress，并补充 v1.8 版本记录
- v0.5.26 2026-02-25 Leo: feat: 落地清单 P0/T008/T009 约束实现 — 新增 `.spec-first/hooks/task-context.sh` 与 `stop-guard.sh` 并接入 `.claude/settings.json`；`ai-runtime-hook` 支持多条同类型 Hook 合并、Stop 无 matcher 与脚本自动落盘；更新 03/04/06/07/12/13/AGENTS 技能规范（证据铁律、反合理化、字面即精神、Fresh Context、[P]/[US] 语义）；`skeletonTaskPlan` 表头修正为 Task ID 首列/状态末列；补充 Hook 行为单测与契约断言 (user-visible)
- v0.5.25 2026-02-25 Leo: docs: 落地清单整合报告更新至 v1.5 — 全面审查后补充 2 项遗漏的 P1 要素（B1 新鲜上下文隔离、B2 用户故事组织），新增 P1 行动项章节（B1/B2）、新增完整性说明章节（P0/P1 达成 100% 覆盖）、更新文档标题（去除" P0 "限定）、更新版本记录；输出 `docs/01需求文档/v2/优势借鉴分析/P0-落地清单-四篇整合.md`
- v0.5.24 2026-02-25 Leo: docs: P0 落地清单整合报告更新至 v1.4 — 根据审查报告补齐遗漏的 2 项 P0 要素：新增 A6 "Spirit vs Letter" 原则（Superpowers §11）和 A7 Stop Hook 完成度守门（PwF §4）；更新来源分布表（Superpowers 3→4、PwF 2→3、合计 5→7）、更新总工作量（2.5 天 → 3.5 天）、更新推荐排期和 Context7 验证说明；输出 `docs/01需求文档/v2/优势借鉴分析/P0-落地清单-四篇整合.md`
- v0.5.23 2026-02-25 Leo: docs: P0 落地清单整合审查报告 — 审查 `P0-落地清单-四篇整合.md` (v1.3) 与四篇源分析报告的完整性，发现遗漏 2 项 P0 要素（Superpowers §11 "Spirit vs Letter" 原则、PwF §4 Stop Hook 完成度守门），建议更新至 v1.4 并补齐 A6/A7 行动项；输出 `docs/01需求文档/v2/优势借鉴分析/P0-落地清单-四篇整合-审查报告.md`
- v0.5.22 2026-02-25 Leo: docs: Oh-My-OpenCode 要素分析报告更新至 v1.2 — 源码验证完成（12 项核心要素与 v3.8.5 源码一致）；修正要素 10（IntentGate→Gemini Intent Gate，原为外部服务引用）、修正要素 7 命名（移除不存在的"Stability Detection"）、更新附录源码验证状态、修正代码量数据（~147k LOC）、输出 `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Oh-My-OpenCode 的要素分析.md`
- v0.5.21 2026-02-25 Leo: docs: Spec-Kit 要素分析报告更新至 v1.2 — 源码验证完成（12 项核心要素与 v0.1.6 源码完全一致）、新增要素 13：Dynamic Clarification Questions（P2）、新增要素 14：Progressive Disclosure（P2）、更新附录关键数据表加入源码验证状态；输出 `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Spec-Kit 的要素分析.md`
- v0.5.20 2026-02-25 Leo: docs: Superpowers 要素分析报告更新至 v1.2 — 源码验证完成（10 项核心要素与 v4.3.1 源码高度一致）；新增要素 11："Spirit vs Letter" 原则（P0）；新增要素 12：Graphviz 决策流程图（P1）；新增要素 13：HARD-GATE 硬守卫模式（P1）；更新 P0/P1 行动项清单；补充源码验证参考资料路径；输出 `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Superpowers 的要素分析.md`
- v0.5.19 2026-02-25 Leo: docs: Planning-with-Files 要素分析报告更新至 v1.2 — 修正作者名（OthmanAdi，非 abzhaw）、调整 Stop Hook 优先级为 P0（防止提前收工）、调整 Session Recovery 优先级为 P1（v2.15.1 修复误报后稳定性提升）、新增 PostToolUse Hook（要素 9）、新增 Context Reduction 分层压缩（要素 10）、新增与 Claude Code Plan Mode 协同（要素 11）、补充 Prompt-based Hooks 推荐方案；输出 `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Planning-with-Files 的要素分析.md`
- v0.5.18 2026-02-25 Leo: docs: AGENTS.md 审查报告 — 深度审查 `skills/spec-first/AGENTS.md`，输出 `docs/01需求文档/v2/优势借鉴分析/AGENTS.md-审查报告.md`；发现 Critical×2（gate check --stage 参数不存在、缺少 update 命令）、High×5（覆盖率指标描述、ID 格式表不完整、缺快速开始等）、Medium×8、Low×6；提供具体修改草案与 P0-P2 优先级修复建议
- v0.5.17 2026-02-25 Leo: fix: AGENTS.md 辅助 Skill 列表补齐 17-19 — 阶段-Skill 映射表辅助行补充 17-feature-list, 18-feature-switch, 19-feature-current（对应审查报告 P1-4）
- v0.5.16 2026-02-25 Leo: docs: 19 个 Skill 全面审查报告 — 多 Agent 并行审查全部 19 个 SKILL.md，输出 `docs/01需求文档/v2/优势借鉴分析/19个Skill全面审查报告.md`；发现 A2/A3/A4 反合理化守卫未落地（Critical × 4）、AGENTS.md 辅助 Skill 缺 17-19、术语一致性需改进；提供 P0-P3 优先级修复建议及追加内容草案
- v0.5.15 2026-02-25 Leo: refactor: 移除冗余进度产出物 — 阶段推进记录统一由 stage-state.json history 承载，Stop Hook 会话摘要改写 findings.md；清理 init/advance/catchup/context-pack/doctor/phase-machine/artifact-checker 共 8 处引用及 4 个测试文件 (user-visible)
- v0.5.14 2026-02-25 Leo: init 一致性与并发健壮性增强 — `init` 提交阶段改为“临时目录生成 + 持锁短临界区提交”（提交内二次唯一性校验、原子 rename、current 切换、FEAT 注册）；FEAT 注册表锁新增 stale-lock 自愈（基于 pid/createdAt 与锁龄回收）；`--platforms` 入口改为去重+稳定排序并在重复输入时提示；补充 stale-lock 与 platforms 规范化单测 (user-visible)
- v0.5.13 2026-02-25 Leo: init 安装场景补齐 `.claude/settings.json` — `spec-first init` 在项目内缺失时自动创建 `.claude/settings.json` 基础骨架（`{"hooks":{}}`），确保 AI Runtime Hooks 可直接写入；创建失败降级为警告不阻断初始化；补充 CLI 单测 (user-visible)
- v0.5.12 2026-02-25 Leo: init 可靠性增强（第二批）— `init` 采用临时目录写入后原子 `rename`，失败自动清理并在并发创建场景回退幂等自愈；FEAT 注册表增加轻量文件锁与去重校验；`--platforms` 输入去重；补充去重与原子落盘相关单测 (user-visible)
- v0.5.11 2026-02-25 Leo: 可行性评估文档 As-Is 对齐 — `docs/01需求文档/v2/可行性评估.md` 收敛规范/交付双轨表述，修正 M7 状态为 Partial、Skill 数量 16→19、Design 阶段 CLI 能力口径（`id next DS`）、联调行动项同步更新 (user-visible)
- v0.5.10 2026-02-25 Leo: init 幂等自愈增强 — `init()` 在目标 Feature 已存在时不再仅返回；新增 `.spec-first/current` 指针修复与 FEAT 注册表缺失回填（不覆盖现有产物内容），补充对应单测 (user-visible)
- v0.5.9 2026-02-24 Leo: bootstrap 配置安全性增强 + 安装脚手架补齐 — host-bootstrap 读取 Claude 配置 JSON 失败时改为“备份原文件并返回 ERROR”（不再吞错写回覆盖）；`spec-first update` 在项目目录下补齐 `.spec-first/config.yaml` 与 `.claude/settings.json`（仅缺失时创建）(user-visible)
- v0.5.8 2026-02-24 Leo: init 解耦宿主自修复 — `spec-first init` 默认不再执行 host bootstrap（MCP/skills/binaries）；新增 `--bootstrap` 显式开关与 `SPEC_FIRST_INIT_BOOTSTRAP=1` 环境变量兼容；01-init SKILL 说明同步更新 (user-visible)
- v0.5.7 2026-02-24 Leo: feat: 新增 uninstall 命令 + preuninstall 自动清理 — `spec-first uninstall` 清理全局 Skills/Claude 命令/Codex skills/SessionStart Hook/AI Runtime Hooks/Git hooks；`npm uninstall -g` 自动触发 preuninstall 脚本；安装与更新文档卸载章节重写 (user-visible)
- v0.5.6 2026-02-24 Leo: fix: hooks 注册格式修正 — session-hook/ai-runtime-hook 写入 settings.hooks 而非顶层 key（Claude Code 要求 {"hooks":{...}} 嵌套格式）+ 旧格式自动迁移 + viewer openBrowser 改用 python webbrowser + 测试对齐 (user-visible)
- v0.5.5 2026-02-24 Leo: 安装链路健壮性增强 — postinstall isGlobalInstall() 扩展 yarn global/volta/npm prefix 检测；ensureCodexSkills 复制后增加 YAML frontmatter 验证（name+description）；update 输出 Codex skill 验证警告 (user-visible)
- v0.5.4 2026-02-24 Leo: Skill 路径稳定性优化 — skills 从 npm 包同步到用户级固定目录 ~/.spec-first/skills/，命令文件和 Codex skills 统一引用该路径，消除 nvm/pnpm/npm upgrade 导致的绝对路径断裂；Codex 侧从 symlink 改为 copy 模式；19 个 SKILL.md 补齐 YAML frontmatter 修复 Codex 加载校验 (user-visible)
- v0.5.3 2026-02-24 Leo: 使用手册 v3.0→v3.1 同步更新 — 命令组 13→17（补齐 update/setup/hooks/viewer）、子命令 38→44、viewer --background 示例、FAQ 升级流程补充 postinstall 说明 (user-visible)
- v0.5.2 2026-02-24 Leo: publish.sh 产物校验路径修正 dist/index.js→dist/cli/index.js + 开发任务文档验收标准对齐
- v0.5.1 2026-02-24 Leo: 多Agent审查修复 — P0 发布入口 bin/exports 对齐 dist/cli/index.js + postinstall fallback 路径修正 + execSync→execFileSync 消除命令注入 + handlebars ^4.7.8 消除 CVE + setup --global 参数转发修复 + update-notifier ESM 兼容 + viewer help 补 --background + 文档 dist/index.js 残留清零 + 冒烟测试脚本 + 补齐 --skip-hooks/错误路径单测 (user-visible)
- v0.5.0 2026-02-23 Leo: 新增 update 命令 + postinstall 自动注册 + SessionStart Hook 全局注册 + registerAIHooks 格式修正 + viewer --background 非阻塞 + 5 函数 dryRun 支持 + setup deprecated 转发 (user-visible)
- v0.4.20 2026-02-23 Leo: CLAUDE.md 移除"个人协作协议"章节 + "角色定位"，"质疑与挑战授权"精简合并至核心理念，协议优先级去个人化
- v0.4.19 2026-02-23 Leo: 删除根目录 code-review/（v0.4.0 遗留审查产出物，12 文件，与 08-code-review Skill 无关）
- v0.4.18 2026-02-23 Leo: 删除 legacy Skill 目录（8 个已废弃旧 Skill）+ 清理相关路由/文档引用

- v0.4.17 2026-02-23 Leo: Gate 引擎接入 Layer2 命令 Gate — gate-evaluator.ts 新增 mergedRules.gateConditions 命令执行能力（execSync + 120s 超时 + ID 去重），python-backend.yaml 覆盖率 Gate 从全量 pytest --cov 改为增量 diff-cover --fail-under=80 (user-visible)

- v0.4.16 2026-02-16 Leo: setup 命令补齐 `--help` 支持 + 安装文档增加「首次使用」「验证 Skill 注册」「常见问题」三节（基于 init 实测日志审查） (user-visible)
- v0.4.15 2026-02-16 Leo: Skill 双宿主全局注册 — 新增 `setup` CLI 命令（`--global` 写入 `~/.claude/commands/` + `~/.codex/skills/` 符号链接），`skill-commands.ts` 重构为双宿主注册器，安装/卸载文档全量更新 (user-visible)
- v0.4.14 2026-02-16 Leo: 安装文档补齐 `spec-first init` 步骤，确保 Skill 命令注册；卸载命令修正为 `pnpm remove --global` (user-visible)
- v0.4.13 2026-02-16 Leo: 卸载文档补齐 Skill 命令入口清理步骤（rm .claude/commands/spec-first-*.md）(user-visible)
- v0.4.12 2026-02-16 Leo: Skill 命令注册自动化 — 新增 `src/shared/skill-commands.ts` 模块（动态扫描 skills/spec-first/ 生成 .claude/commands/ 入口文件），init CLI 成功后自动调用，01-init SKILL.md 新增 P5 阶段 + Success Criteria 补齐 (user-visible)
- v0.4.11 2026-02-16 Leo: 批量创建 13 个 .claude/commands/ 入口文件，补齐 spec-first 全量 Skill 的 Claude Code 命令注册（init/catchup/spec/design/research/task/code/code-review/test/archive/status/doctor/sync）(user-visible)
- v0.4.10 2026-02-16 Leo: 环境自举能力模块化并下沉到命令层（新增 `src/shared/host-bootstrap.ts`，`init` 启动即执行 Codex+Claude 双宿主 MCP/skills 自动检查与缺失自动安装：sequential-thinking/context7/serena/fetch/playwright-mcp + find-skills/skill-creator）；`doctor` CLI 接入同一模块并输出自动修复结果；AGENTS.md 的 `spec-first doctor` 规则与 `15-doctor/SKILL.md` 全量对齐 (user-visible)
- v0.4.9 2026-02-14 Leo: 01-init SKILL.md 深度审查报告 — P0×2（Preflight Bootstrap 职责越界 47% 篇幅与 CLI 零交集 + auto-install 与 strict 矛盾）+ P1×5（config.yaml 引用错误/三层合并缺失/幂等缺失/FEAT 校验缺失/Success Criteria 错位）+ P2×5，综合可用率 ~35%
- v0.4.8 2026-02-14 Leo: 新增安装与更新文档（全局安装模式 pnpm link）(user-visible)
- v0.4.7 2026-02-14 Leo: Skill 命令参考手册 v1.0→v2.0 全量重写 — 对齐当前代码实现（legacy 8 Skill→16 Skill、5 阶段→6 阶段执行模型、补齐 golive/commit/feature/metrics health 4 命令组、修正 defect/rfc/gate/id 参数签名、新增 Dispatcher 路由规则 + confirm_policy 语义 + orchestrate 调度协议）(user-visible)
- v0.4.6 2026-02-14 Leo: Skill 提示词审查报告 P0~P2 全量修复 — P0×3 AGENTS.md CLI 参数修正（rfc 5 处/defect 3 处/补充 golive+commit+feature+metrics health 4 命令组）+ P1×6 歧义消除（catchup/research confirm_policy 修正、test 输出路径、目录重复行、legacy 名称、id next/gate conditions 参数）+ P2×7 提示词质量提升（5 核心 Skill 补示例、16 Skill 补成功标准、AGENTS.md 补 confirm_policy 语义+错误处理规则、orchestrate 补调度协议），综合可用率 60%→95%
- v0.4.5 2026-02-14 Leo: Skill 提示词审查报告 — AGENTS.md + 16 SKILL.md 作为 AI 提示词的有效性评估（P0×3 CLI 参数错误 + P1×6 歧义/遗漏 + P2×7 质量提升项，综合可用率 ~60%）
- v0.4.4 2026-02-14 Leo: 使用手册 v2.0→v3.0 全量重写 — 对齐当前代码实现（13 命令组 38 子命令 + 16 Skill + 6 阶段执行模型 + Dispatcher 路由 + Feature 目录结构）(user-visible)
- v0.4.3 2026-02-14 Leo: FSREQ-20260209-AUTH-001 邮箱登录扩展（RFC-002）— FR-AUTH-003 + DS-AUTH-005/006 + API-AUTH-003/004 + 6 任务 + 3 测试用例 + OpenAPI 契约 + 追踪矩阵更新
- v0.4.2 2026-02-14 Leo: Skill 审查报告 P0~P2 全量修复 — P0-4 legacy 隔离到独立遗留目录（后续已删除）、P0-5 dispatcher 移除 init/doctor、P0-1 五个 Skill id generate→id next、P0-2 matrix update CLI 命令补齐、P0-3 AGENTS.md 26 处命令名修正、P1-1~P1-5 执行模型 6 阶段/Stage×Skill 映射/ID 类型/Gate 结果/defect 语义映射修正、P2-1~P2-3 init 参数格式/tasks.md→task_plan.md/4 个 Skill 产出物路径对齐 (user-visible)

- v0.4.1 2026-02-14 Leo: Skill 审查报告合并 — 交叉验证 review-skills-2026-02-14.md，新增 P0-4（3 个 skillName 冲突致 Skill 不可达）+ P0-5（2 个 Skill 被 RUNTIME_COMMANDS 覆盖），综合可用率 38%
- v0.4.1 2026-02-14 Leo: 开发任务文档 P2 修复 — Phase B CLI 命令数区分 14 个 CLI 命令 + 1 个 Skill Runtime 入口（头部+总览标题同步）
- v0.4.1 2026-02-14 Leo: 开发任务文档 P1 修复 — README 命令组数 13→12、模板数 7→12、Skill 目录补充 legacy 说明；T-AM1-002/T-AM1-004 补充软依赖标注；T-BSK-004 补充 legacy Skill 处置说明
- v0.4.1 2026-02-14 Leo: 开发任务文档 P0 修复 — 5 处产出物文件名与实际代码对齐（gate-evaluator/golive/rollback/context-pack/context-slicing）+ golive CLI 归属修正（集成在 gate.ts）+ Phase A CLI 命令数标题 20→22
- v0.4.0 2026-02-11 Leo: P0 稳定性修复 — rollback SHA 校验、Layer2 YAML schema/字段校验、Git Hook 非覆写安装、JSONL 逐行容错、Phase 归档原子写入（含单测补齐）(user-visible)
- v0.4.0 2026-02-11 Leo: T-CNPM-001 npm 分发配置 — package.json files/exports/publishConfig + templates/npmrc.template + scripts/publish.sh (user-visible)
- v0.4.0 2026-02-11 Leo: T-CIDE-001 VS Code 插件 — packages/vscode-spec-first（ID 自动补全+跳转到定义+缓存刷新）(user-visible)
- v0.4.0 2026-02-11 Leo: T-CCI-001 CI Pipeline 模板 — templates/ci/ GitHub Actions + GitLab CI + Azure Pipelines 三平台 Handlebars 模板
- v0.4.0 2026-02-11 Leo: T-CE2E-002 异常路径 E2E 测试 — tests/e2e/error-paths.test.ts（Gate 阻断/pilot_mode/force 审计/cancel/RFC/Defect 7 测试）
- v0.4.0 2026-02-11 Leo: T-CE2E-001 核心流程 E2E 测试 — tests/e2e/core-flow.test.ts（init→08_done 全阶段推进+gate+coverage+findings 8 测试）
- v0.4.0 2026-02-11 Leo: T-CSLA-001 性能基准测试 — tests/benchmark/performance.bench.ts（4 SLA 指标全部达标）
- v0.4.0 2026-02-11 Leo: T-CL2-002 Layer 2 多端合并集成测试 — tests/integration/layer2-merge.test.ts（双端/三端合并+冲突检测+方向推断 13 测试）
- v0.4.0 2026-02-11 Leo: T-CL2-001 Layer 2 端规范 YAML — .spec-first/layer2/ h5/java-backend/app-ios/app-android/pc 5 平台模板
- v0.3.0 2026-02-11 Leo: T-BSK-006 Skill Build Script — scripts/build-skills.ts（Dev→Deploy 扁平化+references 复制）
- v0.3.0 2026-02-11 Leo: T-BSK-005 Skill Integration E2E 测试 — tests/integration/skill-integration.test.ts（Dispatch→PhaseMachine→ConfirmPolicy 集成路径 5 测试）
- v0.3.0 2026-02-11 Leo: T-BSK-004 16 Skill 文件 — skills/spec-first/ 01-init~16-sync SKILL.md + 4 code-review reference checklists
- v0.3.0 2026-02-11 Leo: T-BSK-003 confirm_policy 评估器 — src/core/skill-runtime/confirm-policy.ts（auto/assisted/strict 四维判定矩阵+审计日志）
- v0.3.0 2026-02-11 Leo: T-BSK-002 6-Phase 状态机 — src/core/skill-runtime/phase-machine.ts（P0~P5+DONE/ABORTED 转换表+修订计数+preWriteArchive）
- v0.3.0 2026-02-11 Leo: T-BSK-001 命令解析与路由分发 — src/core/skill-runtime/dispatcher.ts（语义映射+runtime/skill 双路由+本地优先解析）
- v0.2.0 2026-02-11 Leo: T-BM7-005 AI Runtime Hook — src/core/tool-integration/ai-runtime-hook.ts（PreToolUse/PostToolUse/Stop 3 hook 配置+注册+执行）
- v0.2.0 2026-02-11 Leo: T-BM7-004 Feature CLI — src/cli/commands/feature.ts（list/current/switch 3 子命令）
- v0.2.0 2026-02-11 Leo: T-BM7-003 Doctor 完善 — doctor.ts 扩展 Hook 状态检查+Gate 降级检测+运行时文件膨胀检测
- v0.2.0 2026-02-11 Leo: T-BM7-002 Commit 命令 — src/cli/commands/commit.ts（TASK ID 自动注入+traces trailer）
- v0.2.0 2026-02-11 Leo: T-BM7-001 Git Hook 安装器 — src/core/tool-integration/hook-installer.ts（4 hook 安装/卸载/检查）
- v0.2.0 2026-02-11 Leo: T-BM4-002 逆向同步回填 — src/core/change-mgr/sync.ts（矩阵行更新+审计日志写入）
- v0.2.0 2026-02-11 Leo: T-BM4-001 影响分析 — src/core/change-mgr/impact.ts（BFS 上下游遍历+邻居收集）
- v0.2.0 2026-02-11 Leo: T-BM6-001/002/003 MetricsEngine 测试 — tests/unit/metrics-engine.test.ts（21 测试全通过）
- v0.2.0 2026-02-11 Leo: T-BM5-001~005 AIOrchestrator — context-pack/context-slicing/catchup/ai-stats/ai CLI（20 测试）
- v0.2.0 2026-02-11 Leo: T-BM3-001~006 GateEngine — gate-evaluator/sca/security/golive/rollback/gate CLI（44 测试）
- v0.1.0 2026-02-11 Leo: T-AS-001 项目工程初始化 — package.json/tsconfig/tsup/vitest/目录骨架
- v0.1.0 2026-02-11 Leo: T-AS-002 共享类型定义 — src/shared/types.ts 全局类型
- v0.1.0 2026-02-11 Leo: T-AS-003 文件 I/O 封装层 — src/shared/fs-utils.ts
- v0.1.0 2026-02-11 Leo: T-AS-004 JSONL 日志工具 — src/shared/logger.ts
- v0.1.0 2026-02-11 Leo: T-AS-005 CLI 入口与命令路由 — src/cli/router.ts + index.ts 重构
- v0.1.0 2026-02-11 Leo: T-AS-006 config.yaml Schema — src/shared/config-schema.ts
- v0.1.0 2026-02-11 Leo: T-AM2-002 ID 格式校验 — src/core/trace-engine/id-validator.ts
- v0.1.0 2026-02-11 Leo: T-AM2-001 ID 生成与注册 — src/core/trace-engine/id-generator.ts
- v0.1.0 2026-02-11 Leo: T-AM2-003 ID 模糊搜索 — src/core/trace-engine/id-search.ts
- v0.1.0 2026-02-11 Leo: T-AM2-004 追踪矩阵管理 — src/core/trace-engine/matrix.ts
- v0.1.0 2026-02-11 Leo: T-AM2-005 覆盖率计算 — src/core/trace-engine/coverage.ts
- v0.1.0 2026-02-11 Leo: T-AM2-006 Known Exception 校验 — src/core/trace-engine/exception-validator.ts
- v0.1.0 2026-02-11 Leo: T-AM2-007 ID/Matrix CLI 命令 — src/cli/commands/id.ts + matrix.ts
- v0.1.0 2026-02-11 Leo: T-AM1-001 阶段状态机核心 — src/core/process-engine/stage-machine.ts（8+2阶段转换表+终态判定+26测试）
- v0.1.0 2026-02-11 Leo: T-AM1-004 阶段推进 advance — src/core/process-engine/advance.ts（Gate校验+pilot_mode降级+force跳过+8测试）
- v0.1.0 2026-02-11 Leo: T-AM1-005 Feature 取消 cancel — 集成在 advance.ts（任意非终态→cancelled+reason必填+5测试）
- v0.1.0 2026-02-11 Leo: T-AM1-006 Feature 管理基础 — src/core/process-engine/feature.ts（currentFeature/switchFeature/listFeatures+9测试）
- v0.1.0 2026-02-11 Leo: T-AM1-002 三层合并逻辑 — src/core/process-engine/layer-merger.ts（Layer0基线+Layer1裁剪+Layer2平台YAML合并+10测试）
- v0.1.0 2026-02-11 Leo: T-ATP-001 Handlebars 模板渲染引擎 — src/core/template/renderer.ts（renderTemplate/renderToString+跳过已存在+4测试）
- v0.1.0 2026-02-11 Leo: T-AM1-003 Feature 初始化 init — src/core/process-engine/init.ts（ID生成+目录创建+状态写入+骨架文件+FEAT注册+幂等+10测试）
- v0.1.0 2026-02-11 Leo: T-AM1-007 Stage CLI 命令 — src/cli/commands/init.ts + stage.ts（init/stage current/advance/cancel 4命令+参数校验+ExitCode+13测试）
- v0.1.0 2026-02-11 Leo: T-AM4-001 RFC 状态机 — src/core/change-mgr/rfc-machine.ts（4合法转换+终态判定+14测试）
- v0.1.0 2026-02-11 Leo: T-AM4-003 缺陷状态机 — src/core/change-mgr/defect-machine.ts（6合法转换+回退路径+终态判定+18测试）
- v0.1.0 2026-02-11 Leo: T-AM4-002 RFC CRUD 操作 — src/core/change-mgr/rfc.ts（create/get/transition/submit/list+自增ID RFC-NNN+9测试）
- v0.1.0 2026-02-11 Leo: T-AM4-004 缺陷 CRUD 操作 — src/core/change-mgr/defect.ts（register/get/transition/list/escapeRate+自增seq+过滤+12测试）
- v0.1.0 2026-02-11 Leo: T-AM4-005 RFC/Defect CLI 命令 — src/cli/commands/rfc.ts + defect.ts（rfc 5子命令+defect 5子命令+index.ts注册+20测试）
- v0.1.0 2026-02-11 Leo: T-ATP-002 Handlebars 模板文件 — 9个模板（init×2+matrix×2+gate×1+review×1+metrics×1+release×2）+9测试
- v0.1.0 2026-02-11 Leo: T-ATP-003 产出物完整性检查 — src/core/template/artifact-checker.ts（21产出物定义+Mode×Size跳过规则+ensureArtifacts/listArtifacts+12测试）
- v0.1.0 2026-02-11 Leo: T-ACL-001 Metrics Coverage CLI — src/cli/commands/metrics.ts（C1-C9指标表格输出+PASS/FAIL判定+4测试）
- v0.1.0 2026-02-11 Leo: T-ACL-002 Doctor 诊断 CLI — src/cli/commands/doctor.ts（7项检查+项目级/Feature级+printReport+5测试）
- v0.7.15 2026-02-09 Leo: v7.1 需求文档三轮审查修复（P2×5 一致性修复 + 审查报告 4 项最佳实践方案落地 + Skill 15 化全文档同步）
  - P2 修复：Gate 编号映射表、CLI 命令组数量口径、Context Pack 平台值 kebab-case、RFC 入口统一 /spec-first:rfc、AI 用例裸 CLI 消除
  - 审查报告方案：Phase 3 交互协议（5 轮上限+审计记录）、逆向变更快速通道（内联修正+/spec-first:sync）、Session Catchup 自动触发（auto/prompt/off 三策略）、Context Pack 动态剪裁（L1/L2/L3 三层+8K 预算）
  - 架构变更：新增第 15 个 Skill `/spec-first:sync`（Utility），全文档 14→15 同步更新
- v0.7.13 2026-02-09 Leo: spec-first-v7.md 07 Release 去掉部署相关内容（部署策略/回滚方案/观察窗口由公司 DevOps 平台承载），精简为 Build→Smoke Test→提交 DevOps 平台；同步清理 Gate 表、终态条件、PlatformAdapter 接口、CI 平台表共 8 处
- v0.7.11 2026-02-09 Leo: spec-first-v7.md 复审修复 4 项（R1: id/rfc 命令 --feature 标记为运行时必填；R2: 8 个阶段 Skill 状态从 Planned 修正为 Partial；R3: 目录结构 task_plan.md 去重；R4: 文件格式表 tasks→task_plan）
- v0.7.10 2026-02-09 Leo: spec-first-v7.1 Layer 2 细化：拆分"技术端规范"与"CI 平台集成"，定义端规范文件标准格式（.spec-first/layer2/*.yaml）、合并机制、完整示例（H5 + Java Backend）
- v0.7.9 2026-02-09 Leo: spec-first-v7.md 基线收敛为 v7.1（12 项优化：主权定义对齐 v6、CLI 命令回刷代码、As-Is/To-Be 标签、终态定义、task_plan.md 统一、Skill 映射表、模板清单修正、路线图三栏式）
- v0.7.8 2026-02-09 Leo: 调整文档原则为"状态流转主权在 Skill，CLI 提供底层原子能力支持"，并同步更新 v6 与 Claude 集成方案示例命令
- v0.7.7 2026-02-09 Leo: 新增 Claude 专用集成方案文档 `docs/01需求文档/claude-skill-cli-integration-plan.md`（/spec-first:* 命令门面 + Skill 协同 + CLI 执行锚点）
- v0.7.6 2026-02-09 Leo: spec-first-v6.md 新增 Layer 1 的 Mode×Size（N/I × S/M/L）6格行为矩阵与最小产出深度规则
- v0.7.5 2026-02-09 Leo: spec-first-v6.md 补充“三层规范体系（Layer 0/1/2）”及 Feature 启动时的三层合并执行规则
- v0.7.4 2026-02-09 Leo: 新增需求文档 `docs/01需求文档/spec-first-v6.md`，重构为“CLI + 外部 Skill 协同”基线（As-Is + To-Be）
- v0.7.3 2026-02-09 Leo: 使用手册 5.0 协同流程补充完整 Skill 命令（spec-first-plan/spec-first-verify/spec-first-orchestrate）
- v0.7.2 2026-02-09 Leo: 使用手册新增“CLI+Skill 协同完成需求开发”的简要流程（初始化→计划→执行→校验→推进循环）
- v0.7.1 2026-02-09 Leo: 新增 Spec-First 可落地最小集合（.claude/commands 的 /plan /verify /orchestrate、3 个 SKILL.md、SessionStart/SessionEnd hooks、CI 校验脚本）
- v0.7.0 2026-02-09 Leo: 收尾完成——新增 spec-rfc/spec-defect/spec-ai 三个 CLI 命令组，6 个 Handlebars 模板，2 个 M4/M5 集成测试，index.ts 统一注册 10 个命令（447 tests, 42 files）
- v0.6.1 2026-02-09 Leo: matrix-manager.ts 3处裸 Error 替换为类型化错误（FileIOError/ConfigError），集成测试路径修复（5个测试文件使用绝对路径）
- v0.6.0 2026-02-09 Leo: 新增 M6 MetricsEngine 模块（12项指标注册、度量采集、健康分评定、瓶颈分析、报告生成）
- v0.5.0 2026-02-09 Leo: 新增 M7 ToolIntegration 模块（Git Hook 管理、CI 模板生成、Doctor 诊断）

## [0.4.1] - 2026-02-07
### Fixed
- v4.0 审查报告 14 项修复（P0×4 + P1×6 + P2×4）(user-visible)
- P0-1: 变更摘要"5 维度"修正为"6 维度"，与正文 Constitution 6 维度对齐
- P0-2: 跨产物引用规则补充设计决策说明（v4 ID 自带 Feature 缩写，无需跨 Feature 前缀）
- P0-3: 追踪体系工具化支撑补回 bash 校验脚本示例（Task 覆盖率计算）
- P0-4: 流程裁剪指南补充 Mode I 额外产出物深度矩阵（impact-analysis.md、regression-report.md）
- P1-1/2/3: AI 编码统计补回执行流程（6 步）、终端输出示例、前置约定（2 条）
- P1-4: 追踪矩阵补充完整状态枚举（Planned/Implemented/Verified/Accepted/Not Implemented）
- P1-5: 覆盖率算法补回孤儿项率综合指标
- P1-6: 章节顺序调整（流程总览移至速查表之前）
- P2-1: 补回 v2 原始 18→7+3 节点映射表
- P2-2: 文档头部插入 TOC 目录
- P2-3: 明确 Minor 变更走快速通道不需 RFC，消除与变更流程的矛盾
- P2-4: 版本演进映射表补充变更来源列（含 P 编号引用）
- v4.1 二次审查修复 13 项（CRITICAL×2 + HIGH×4 + MEDIUM×3 + LOW×2 + 优化×2）(user-visible)
- C1: Status 枚举统一为 🎯 Accepted，补充 Deferred/Cancelled 状态（5 处修正）
- C2: 覆盖率公式补充 NFR（FR→FR∪NFR，反向合规率同步修正）
- H4: 技术设计文档 plan.md → design.md（12 处重命名，消除与 03 Plan 阶段混淆）
- H3: 明确 Quality Gate 调用 Spec-Consistency-Analysis 的关系（非独立并行）
- H1: NFR 维度枚举改为可扩展（正则放宽 + 新增 MAINT/SCALE/COMPAT/COMP/I18N）
- H2: 变更分级判定标准：用"是否需重新触发已通过 Gate"替代模糊的"跨阶段"
- M1: AI 编码统计 Hook 改用 git diff HEAD + baseline commit 机制
- M2: 落地路线图第一步 M 规模 → S 规模
- M3: 追踪矩阵生命周期拆分 "04→06" 为 04/05/06 三行
- L1: Layer 2 多端扩展补充 H5 端规则模板骨架
- L2: ADR/RFC 文件级 ID 与条目级 ID 设计差异说明
- O2: 校验脚本 grep -oP → grep -oE（macOS 兼容）

## [0.4.0] - 2026-02-07
### Added
- 输出 Spec-First 研发流程规范 v4.0 (docs/01需求文档/spec-first-v4.md) (user-visible)
- 补回 v3 丢失的 v2 内容：流程速查表、角色映射+RACI、Gate Owner、AI 编码统计、Spec-as-Code、归档清单
- ID 体系升级：从 v3 的 Feature 内唯一（FR-001）回归 v2 的全局可识别格式（FR-AUTH-001）
- 新增流程裁剪指南（Size × 产出物深度矩阵）
- 新增 Change-Management 变更分级（Minor/Major/Critical）
- 新增流程适用边界（何时用/何时不用）
- Constitution 从 5 维度扩展为 6 维度（+角色与职责）
- 落地路线图从 5 步精简为 3 步（MVP → 增强 → 全量）
- 规模分级"涉及端点数"修正为"涉及模块数"
- 三层规范体系补充执行合并示例

## [0.3.7] - 2026-02-06
### Added
- spec-first-v2.md AI 编码统计增加上下文采集：开发人员（git config user.name）、需求标识（git branch 解析 FR ID）
- spec-first-v2.md 新增分支命名规范 `feature/<FR-ID>-<description>`，作为 AI 统计的前置依赖

## [0.3.6] - 2026-02-06
### Added
- spec-first-v2.md 工具链映射章节新增「AI 编码统计（Claude Code Hooks）」，定义 Stop hook 统计方案：代码/文档变更行数（+/-）、文件数、JSONL 存储格式

## [0.3.5] - 2026-02-06
### Added
- spec-first-v2.md 06. Wrap-up 章节新增归档清单（15 项），明确每个产出物的检查标准
- spec-first-v2.md 目录结构新增 `reports/` 目录（test-report.md, security-scan.md, uat-signoff.md）
- spec-first-v2.md 目录结构新增 `traceability-matrix.md`（追踪矩阵）

## [0.3.4] - 2026-02-06
### Added
- spec-first-v2.md 流程总览 ASCII 图每个阶段补充产出物标注
- spec-first-v2.md 流程总览下方新增「流程速查表」，用表格汇总 7 个阶段的活动、产出物、Exit Gate、Gate Owner

## [0.3.3] - 2026-02-06
### Added
- spec-first-v2.md Constitution 章节增加 RACI 矩阵模板，明确 9 个关键子活动的角色参与方式（R/A/C/I）
- RACI 矩阵标注为可选配置，小团队可不填，大团队按需细化

## [0.3.2] - 2026-02-06
### Added
- spec-first-v2.md Quality Gate 表增加 Gate Owner 列，定义各阶段签核角色（PM/Tech Lead/Architect/QA Lead/Peer）
- spec-first-v2.md Constitution 章节增加角色映射表模板，支持项目级角色→人员配置
- Quality Gate 执行原则增加 Gate Owner 职责说明，引用 constitution.md 角色映射表

## [0.3.1] - 2026-02-06
### Fixed
- 修复 spec-first-v2.md 文件命名不一致：`*.spec.md` 统一为 `spec.md`（固定文件名风格）
- 修复 git diff 示例路径：`docs/specs/user-auth.spec.md` → `specs/001-user-auth/spec.md`

## [0.3.0] - 2026-02-06
### Added
- 输出 Spec-First 研发流程规范 v3.0 (docs/01需求文档/spec-first-v3.md) (user-visible)
- 新增全链路追踪体系：5+2 类 ID 规范（FR/NFR/API/TASK/TC + ADR/RFC）
- 新增追踪矩阵 traceability-matrix.md 作为标准产出物
- 定义覆盖率算法：正向覆盖率（遗漏需求检测）+ 反向合规率（过度实现检测）
- 覆盖率校验嵌入 Quality Gate（Plan/Implement/Verify/Wrap-up 四个阶段）
- 定义跨产物引用规则（traces/verifies/implements 语义）
- 定义 Git Commit/PR 关联需求 ID 的强制规则
- 整合 v2.0 审查报告 13 项改进 + 双模式多端扩展设计
- Spec-Consistency-Analysis 触发时机扩展为 5 个（解决 P0-3）
- 追踪体系工具化支撑方案（7 项自动化校验规则）

## [0.2.3] - 2026-02-06
### Added
- 输出双模式 + 多端扩展设计方案 (docs/01需求文档/dual-mode-design.md) (user-visible)
- 设计三层规范体系：Layer 0（通用流程）+ Layer 1（模式×规模）+ Layer 2（端特有规范）
- 定义双模式：Mode N（New Feature）/ Mode I（Iteration），含 7 阶段逐一差异对比
- 定义规模分级 S/M/L，5 维度判定标准 + 产出物深度矩阵
- 设计多端扩展机制（APP/PC/H5/Backend），含端规范模板和各端关键扩展规则示例
- 定义跨端协作机制，API 契约作为协作锚点
- 修订目录结构，解决审查报告 P0-1、P0-2、P1-1、P1-3、P1-4 共 5 个问题

## [0.2.2] - 2026-02-06
### Added
- 深度审查 spec-first-v2.md，输出审查报告 (docs/01需求文档/review-spec-first-v2.md)
- 对标 Spec-Kit、SpecifyPlus、Autospec、TypeSpec 四个业界框架
- 识别 13 个改进点（P0×3 + P1×5 + P2×5）
- 输出功能覆盖对比矩阵（Spec-First vs 业界 4 框架）

## [0.2.1] - 2026-02-06
### Added
- 输出 Spec-First 研发流程规范 v2.0 最佳实践文档 (docs/spec-first-v2.md) (user-visible)
- 包含 7 阶段完整定义（Init/Specify/Design/Plan/Implement/Verify/Wrap-up）
- 包含 3 横切机制定义（Quality Gate/Spec-Consistency-Analysis/Change-Management）
- 包含产出物标准化、目录结构、工具链映射、落地路线图

## [0.2.0] - 2026-02-06
### Changed
- 深度审查流程节点，对标 Spec-Kit / Autospec / ISO 12207 / V-Model / SAFe
- 重构 18 节点扁平结构为"7 阶段 + 3 横切机制"模型 (user-visible)
- API-Design 从需求阶段移至设计阶段（依据 Spec-Kit contracts/ 归属）
- 收尾阶段移至发布前（文档整理后再发布）
- Review 节点降级为 Quality Gate（准出条件）
- Change-Management 升级为横切机制（贯穿全流程）
- 新增 Constitution（项目原则）和 Clarify（需求澄清）概念
- 新增 Spec-Consistency-Analysis 横切校验机制

## [0.1.0] - 2026-02-06
### Added
- 初始化 Spec-First 项目规范文档 (CLAUDE.md)
- 添加 Planning with Files 项目分析文档 (docs/analysis-planning-with-files.md)
- 添加流程审查结论文档 (docs/review-flow-conclusion.md)
- 创建 CHANGELOG.md

### Changed
- 审查原有 11 节点流程，识别 10 个缺口节点
- 建议补充 P0 级节点：Test-Design, Test-Execution, UAT, Deployment, API-Design (user-visible)
- v0.5.46 2026-03-06 Claude: feat(gate): 项目类型感知的 Gate 规则，CSS-only/frontend 项目豁免测试覆盖率检查 (user-visible)
- v0.5.47 2026-03-06 Claude: fix(gate): Matrix 终态检查支持 done 状态，修复 upstream-lineage API 调用 (user-visible)
