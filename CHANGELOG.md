# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
