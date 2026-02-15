# 91 项问题存在性复核报告（交叉审查）

- 复核日期: 2026-02-11
- 输入报告: `00-summary.md` `01-high-severity.md` `02-medium-severity.md` `03-low-severity.md` `04-fix-priority.md`
- 复核方法: 逐条对照源码 + 文档语义校验 + 局部命令验证

## 结论统计

- 成立: 68
- 部分成立: 22
- 不成立: 1
- 合计: 91

## 关键结论

- 该 91 项报告可作为候选问题池，但不应直接等同最终缺陷清单。
- 其中大部分问题存在，但有 1 项明确不成立，22 项属于“部分成立/严重度偏高/防御性优化”。
- 报告对“门禁主链路”存在漏检：`advance` 未接入真实 Gate、GoLive GL-01 误判风险、RFC 状态读取路径偏差、AI Hook 与 CLI 契约不一致、VSCode 插件命令不匹配。

## 逐项判定表（91 项）

| ID | 判定 | 说明 |
|---|---|---|
| H1 | 部分成立 | 命令注入：rollback.ts。当前仅生成命令字符串，未直接执行；仍建议加 SHA 校验。 |
| H2 | 部分成立 | YAML 反序列化不安全：layer-merger.ts。缺少 schema/结构校验成立；RCE 表述偏高。 |
| H3 | 成立 | Git Hook 覆写：hook-installer.ts。代码实现与报告描述基本一致。 |
| H4 | 部分成立 | Exception 过滤 ID 类型不匹配：coverage.ts。在 Exception 非 FR 行时可能失效，依赖数据建模。 |
| H5 | 成立 | Truthiness 检查阻止字段清空：matrix.ts。代码实现与报告描述基本一致。 |
| H6 | 成立 | Waiver 语义匹配缺失：gate-evaluator.ts。代码实现与报告描述基本一致。 |
| H7 | 成立 | 幂等检查返回不一致状态：init.ts。代码实现与报告描述基本一致。 |
| H8 | 成立 | Level 2 降级分支不可达：context-slicing.ts。代码实现与报告描述基本一致。 |
| H9 | 成立 | 空参数静默传递：dispatcher.ts。代码实现与报告描述基本一致。 |
| H10 | 成立 | Timestamp 可被覆盖：logger.ts。代码实现与报告描述基本一致。 |
| H11 | 成立 | 日志归档同月覆盖：logger.ts。代码实现与报告描述基本一致。 |
| H12 | 成立 | JSONL 单行损坏导致全量不可用：logger.ts。代码实现与报告描述基本一致。 |
| H13 | 成立 | AI 统计同样的 JSONL 脆弱性：ai-stats.ts。代码实现与报告描述基本一致。 |
| H14 | 部分成立 | catchupLocks 内存泄漏：catchup.ts。锁表无清理成立，但增长与 feature 数量相关。 |
| H15 | 成立 | 归档写入非原子：phase-machine.ts。代码实现与报告描述基本一致。 |
| H16 | 成立 | 配置缓存不区分 projectRoot：config-schema.ts。代码实现与报告描述基本一致。 |
| H17 | 部分成立 | CLI 无全局错误边界：index.ts。router 已有异常捕获；入口兜底仍可增强。 |
| M1 | 成立 | `as Stage` 绕过枚举类型检查。代码实现与报告描述基本一致。 |
| M2 | 成立 | 同样的 `as Stage` 问题（多文件）。代码实现与报告描述基本一致。 |
| M3 | 成立 | direction 强转无校验：layer-merger.ts。代码实现与报告描述基本一致。 |
| M4 | 成立 | 健康分 unsafe cast：health-score.ts。代码实现与报告描述基本一致。 |
| M5 | 成立 | 瓶颈分析同样的 unsafe cast：bottleneck.ts。代码实现与报告描述基本一致。 |
| M6 | 成立 | AI 统计双重 cast：ai-stats.ts。代码实现与报告描述基本一致。 |
| M7 | 成立 | gate-evaluator 同样的双重 cast。代码实现与报告描述基本一致。 |
| M8 | 成立 | 配置浅拷贝污染默认值：config-schema.ts。代码实现与报告描述基本一致。 |
| M9 | 部分成立 | truthiness 拒绝合法零值：config-schema.ts。0 被忽略属表达缺陷，但业务范围已禁止 0。 |
| M10 | 成立 | AI 统计数值字段无校验：ai-stats.ts。代码实现与报告描述基本一致。 |
| M11 | 成立 | readFileSync 在 try 外：fs-utils.ts。代码实现与报告描述基本一致。 |
| M12 | 成立 | ensureDir TOCTOU 竞态：fs-utils.ts。代码实现与报告描述基本一致。 |
| M13 | 成立 | Gate 历史 JSONL 解析无容错：gate-evaluator.ts。代码实现与报告描述基本一致。 |
| M14 | 成立 | 单个 Feature 损坏导致列表崩溃：feature.ts。代码实现与报告描述基本一致。 |
| M15 | 成立 | context-pack readJson 无 try-catch。代码实现与报告描述基本一致。 |
| M16 | 成立 | Catchup 任务计数误匹配散文：catchup.ts。代码实现与报告描述基本一致。 |
| M17 | 部分成立 | confirm-policy appendFileSync 不确保目录：confirm-policy.ts。标准 init 路径通常存在目录；异常路径容错不足。 |
| M18 | 成立 | 安全报告缺失默认 PASS：golive.ts。代码实现与报告描述基本一致。 |
| M19 | 不成立 | sed 语法 macOS/Linux 不兼容：hook-installer.ts。当前 macOS 已验证可用，跨平台风险证据不足。 |
| M20 | 部分成立 | generateHookScript 无 exhaustive 检查：hook-installer.ts。现有联合类型下覆盖完整；可加 default 做防御。 |
| M21 | 成立 | registerAIHooks 是空操作：ai-runtime-hook.ts。代码实现与报告描述基本一致。 |
| M22 | 成立 | 两平台同 key 不同 direction 静默忽略：layer-merger.ts。代码实现与报告描述基本一致。 |
| M23 | 成立 | 无效 ID 仍创建 Feature 类型行：matrix.ts。代码实现与报告描述基本一致。 |
| M24 | 成立 | YAML 导出未转义特殊字符：matrix.ts。代码实现与报告描述基本一致。 |
| M25 | 成立 | defect 序号 TOCTOU 竞态：defect.ts。代码实现与报告描述基本一致。 |
| M26 | 成立 | listDefects 读取所有 .json 文件：defect.ts。代码实现与报告描述基本一致。 |
| M27 | 成立 | Markdown 表格 pipe 注入：rfc.ts。代码实现与报告描述基本一致。 |
| M28 | 成立 | sync.ts 绕过 fs-utils 抽象层。代码实现与报告描述基本一致。 |
| M29 | 成立 | updateMatrixRow 循环内逐次全文件读写：sync.ts。代码实现与报告描述基本一致。 |
| M30 | 成立 | getRegisteredCommands 返回可变引用：router.ts。代码实现与报告描述基本一致。 |
| M31 | 成立 | 重复注册命令无警告：router.ts。代码实现与报告描述基本一致。 |
| M32 | 成立 | catch 吞掉 stack trace：router.ts。代码实现与报告描述基本一致。 |
| M33 | 成立 | 无条件 throw-then-catch 伪装逻辑：advance.ts。代码实现与报告描述基本一致。 |
| M34 | 成立 | advance.ts 绕过 fs-utils。代码实现与报告描述基本一致。 |
| M35 | 成立 | sca.ts 重复 filter。代码实现与报告描述基本一致。 |
| M36 | 成立 | security.ts cast 在校验前。代码实现与报告描述基本一致。 |
| M37 | 成立 | SliceConfig ratio 字段从未使用。代码实现与报告描述基本一致。 |
| M38 | 部分成立 | control zone 限制未执行：context-pack.ts。CLI 路径会校验，核心构建函数本身未强制。 |
| M39 | 成立 | projectRoot 参数未使用：ai-runtime-hook.ts。代码实现与报告描述基本一致。 |
| M40 | 成立 | task_plan.md 重复定义：artifact-checker.ts。代码实现与报告描述基本一致。 |
| M41 | 成立 | 未使用的 existsSync import：artifact-checker.ts。代码实现与报告描述基本一致。 |
| L1 | 成立 | Markdown 表格解析逻辑 4 处重复。代码实现与报告描述基本一致。 |
| L2 | 成立 | parseMatrixIds 完全重复。代码实现与报告描述基本一致。 |
| L3 | 成立 | Markdown 表头检测模式脆弱且重复。代码实现与报告描述基本一致。 |
| L4 | 成立 | renderer.ts 重复 import path 模块。代码实现与报告描述基本一致。 |
| L5 | 成立 | gate-evaluator.ts 重复 import matrix。代码实现与报告描述基本一致。 |
| L6 | 成立 | catchup.ts 重复读取 task_plan.md。代码实现与报告描述基本一致。 |
| L7 | 部分成立 | SecuritySeverity 命名误导：types.ts。命名偏语义优化，不是功能性缺陷。 |
| L8 | 部分成立 | GateStatus vs ConditionResult.status 命名不对称：types.ts。命名不对称但语义可理解。 |
| L9 | 部分成立 | submitRfc 实际是 approveRfc：rfc.ts。函数命名与业务语义存在偏差。 |
| L10 | 部分成立 | exists() 薄封装无附加价值：fs-utils.ts。封装层主要为统一抽象与可测性。 |
| L11 | 部分成立 | LogType 定义但未在本文件使用：logger.ts。可能供外部模块使用，本文件未使用不等于无效。 |
| L12 | 部分成立 | TransitionError 不暴露 from/to 属性：stage-machine.ts。增强可观测性建议，非功能错误。 |
| L13 | 成立 | parseInt 接受部分匹配：id-generator.ts。代码实现与报告描述基本一致。 |
| L14 | 成立 | 序号溢出未处理：id-generator.ts。代码实现与报告描述基本一致。 |
| L15 | 成立 | tcLevel 非空断言无本地守卫：id-generator.ts。代码实现与报告描述基本一致。 |
| L16 | 部分成立 | 空集合返回 100% 覆盖率：coverage.ts。空集合返回 100% 属产品口径选择。 |
| L17 | 部分成立 | readdirSync 未校验路径是目录：coverage.ts。当前流程下路径通常为目录；是防御性校验建议。 |
| L18 | 部分成立 | readJson 返回值未 null 检查：coverage.ts。null 防御建议，需异常数据才触发。 |
| L19 | 成立 | 日期解析时区依赖：exception-validator.ts。代码实现与报告描述基本一致。 |
| L20 | 部分成立 | rotateLog 非 .jsonl 路径静默失败：logger.ts。当前调用均 .jsonl，属防御性建议。 |
| L21 | 成立 | countLines 每次写入读全文件：logger.ts。代码实现与报告描述基本一致。 |
| L22 | 成立 | appendJsonl 不处理不可序列化值：fs-utils.ts。代码实现与报告描述基本一致。 |
| L23 | 部分成立 | Feature ID 用本地时间而非 UTC：init.ts。UTC/本地时间口径需产品统一。 |
| L24 | 成立 | writeMarkdown 尾部换行不一致：init.ts vs feature.ts。代码实现与报告描述基本一致。 |
| L25 | 成立 | 健康分权重与 config-schema 默认权重不一致。代码实现与报告描述基本一致。 |
| L26 | 成立 | context-pack 预算估算与 context-slicing 不一致。代码实现与报告描述基本一致。 |
| L27 | 成立 | POST_VERIFY_STAGES 用字符串而非枚举：defect.ts。代码实现与报告描述基本一致。 |
| L28 | 部分成立 | AdvanceResult vs StageHistoryEntry gateResult 可选性不一致。类型可选性不一致，影响可读性多于功能。 |
| L29 | 成立 | advance.ts 未使用的 TERMINAL_STAGES import。代码实现与报告描述基本一致。 |
| L30 | 成立 | id-search.ts toUpperCase 重复调用。代码实现与报告描述基本一致。 |
| L31 | 成立 | sca.ts O(n^2) 重复检测。代码实现与报告描述基本一致。 |
| L32 | 成立 | CANCELLED 阶段检查所有制品：artifact-checker.ts。代码实现与报告描述基本一致。 |
| L33 | 部分成立 | import.meta.dirname 兼容性：dispatcher.ts。Node 20.x 子版本兼容性存在不确定性。 |

## 合并后修复清单（去重）

### P0（先修，阻断验收）

1. 打通 `stage advance -> GateEvaluator`，移除硬编码 `GateUnavailableError` 主路径。
2. 统一 `gate-history.jsonl` schema，修复 GoLive GL-01 判定（仅识别有效 GateResult 记录）。
3. 修复 Gate 的 waiver 精确匹配（按 scope/关联 ID），禁止“首个 FAIL 兜底豁免”。
4. 修复 Gate 读取 RFC 状态来源（`rfc/*.rfc.json`），与 exception 校验一致。
5. 统一产物路径口径（`spec.md/design.md/reports/*` 与 Gate/AI/ArtifactChecker/LayerMerger）。
6. 修复 pre-push 阻断语义与参数（feature 上下文、失败阻断）。
7. 修复 AI Hook 命令与 CLI 契约不一致，并实现真正注册写入。
8. 修复 VSCode 插件数据源契约（`id search` 或补 `id list --json`）。

### P1（次级，高价值稳定性）

1. JSONL 读取容错（`logger`/`ai-stats`/`gate-history`），避免单行损坏全量不可读。
2. 日志归档安全性（同月覆盖、原子写入、timestamp 覆盖顺序）。
3. 配置加载健壮性（按 projectRoot 缓存、方向字段校验、默认值深拷贝）。
4. Matrix/Defect/RFC 数据一致性（truthiness 更新、并发序号、YAML 导出转义、表格转义）。
5. CLI 契约补齐（`gate --stage`、`golive` 参数约定、`hooks` 命令与 doctor 文案对齐）。

### P2（质量优化）

1. 抽取共享 Markdown 表格解析器，减少重复与不一致。
2. 减少 `as` 强转，优先枚举与运行时校验。
3. 统一命名与指标口径（health 权重、coverage 空集合语义、本地/UTC 日期）。
4. 清理低风险代码质量项（未使用 import、重复计算、可读性修正）。
