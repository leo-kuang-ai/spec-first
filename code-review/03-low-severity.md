# Low 级问题详述（33 项）

> 建议改进 — 涉及代码重复、命名规范、边界处理、一致性

---

## 一、代码重复（6 项）

### L1 — Markdown 表格解析逻辑 4 处重复

- **文件**:
  - `src/core/trace-engine/matrix.ts:102-132`
  - `src/core/trace-engine/id-generator.ts:109-127`
  - `src/core/trace-engine/id-search.ts:71-87`
  - `src/core/trace-engine/exception-validator.ts:75-101`
- **问题**: 每处用不同方式解析 Markdown 表格（`filter(Boolean)` vs `slice(1, -1)`），边界处理不一致
- **修复**: 抽取 `shared/markdown-table.ts` 共享解析器

### L2 — parseMatrixIds 完全重复

- **文件**: `id-generator.ts:109-127` 与 `id-search.ts:71-87`
- **问题**: 两个文件中的 `parseMatrixIds` 函数逻辑完全相同
- **修复**: 提取到 `matrix.ts` 并导出

### L3 — Markdown 表头检测模式脆弱且重复

- **文件**: 同 L1 四个文件 + `security.ts:59` + `init.ts:99`
- **问题**: `trimmed.startsWith('|--') || trimmed.startsWith('| ID')` 无法处理不同格式的表头
- **修复**: 统一使用正则 `/^\|[\s-:]+\|/` 检测分隔行

### L4 — renderer.ts 重复 import path 模块

- **文件**: `src/core/template/renderer.ts:5,9`
- **问题**: `import { join } from 'node:path'` 和 `import { dirname } from 'node:path'` 分两行
- **修复**: 合并为 `import { join, dirname } from 'node:path'`

### L5 — gate-evaluator.ts 重复 import matrix

- **文件**: `src/core/gate-engine/gate-evaluator.ts:13-14`
- **问题**: `checkMatrix` 和 `parseMatrix` 分两行从同一模块导入，且 `checkMatrix` 未使用
- **修复**: 合并导入，删除未使用的 `checkMatrix`

### L6 — catchup.ts 重复读取 task_plan.md

- **文件**: `src/core/ai-orchestrator/catchup.ts:62,85`
- **问题**: Step 2 和 Step 5 各读一次同一文件
- **修复**: Step 2 读取后缓存，Step 5 复用

---

## 二、命名与语义（6 项）

### L7 — SecuritySeverity 命名误导：types.ts

- **文件**: `src/shared/types.ts:131`
- **问题**: `SecuritySeverity` 用于通用缺陷严重度，非仅安全相关
- **修复**: 重命名为 `DefectSeverity`

### L8 — GateStatus vs ConditionResult.status 命名不对称：types.ts

- **文件**: `src/shared/types.ts:75,80`
- **问题**: 聚合级 `PASS_WITH_WAIVER` vs 条件级 `WAIVER`，语义相同但命名不同
- **修复**: 添加注释说明差异，或统一命名

### L9 — submitRfc 实际是 approveRfc：rfc.ts

- **文件**: `src/core/change-mgr/rfc.ts:128-136`
- **问题**: 函数名 `submitRfc` 暗示"提交审核"，实际直接转为 `approved`
- **修复**: 重命名为 `approveRfc`

### L10 — exists() 薄封装无附加价值：fs-utils.ts

- **文件**: `src/shared/fs-utils.ts:42-44`
- **问题**: `exists` 仅委托 `existsSync`，无额外行为
- **修复**: 保留（便于测试 mock），但添加注释说明用途

### L11 — LogType 定义但未在本文件使用：logger.ts

- **文件**: `src/shared/logger.ts:8`
- **问题**: `LogType` 导出但本文件未引用，需确认是否有外部消费方
- **修复**: 确认使用方，无则删除

### L12 — TransitionError 不暴露 from/to 属性：stage-machine.ts

- **文件**: `src/core/process-engine/stage-machine.ts:19-24`
- **问题**: `from`/`to` 仅拼入 message 字符串，调用方无法程序化获取
- **修复**: 添加 `readonly from: Stage` 和 `readonly to: Stage` 属性

---

## 三、边界处理（10 项）

### L13 — parseInt 接受部分匹配：id-generator.ts

- **文件**: `src/core/trace-engine/id-generator.ts:99`
- **问题**: `parseInt("003abc", 10)` 返回 `3`，不拒绝尾部非数字字符
- **修复**: 前置 `if (!/^\d+$/.test(seqStr)) return null`

### L14 — 序号溢出未处理：id-generator.ts

- **文件**: `src/core/trace-engine/id-generator.ts:61`
- **问题**: `seq >= 1000` 时 padStart 产生 4 位数字，不匹配 `\d{3}` 正则
- **修复**: `if (seq > 999) throw new Error('Sequence overflow: max 999 IDs per type')`

### L15 — tcLevel 非空断言无本地守卫：id-generator.ts

- **文件**: `src/core/trace-engine/id-generator.ts:63,89`
- **问题**: `tcLevel!` 依赖调用方已校验，函数自身无防御
- **修复**: 在 `assembleId`/`extractSeq` 内添加 `if (!tcLevel) throw`

### L16 — 空集合返回 100% 覆盖率：coverage.ts

- **文件**: `src/core/trace-engine/coverage.ts:75`
- **问题**: `taskRows.length === 0` 时返回 `1`（100%），掩盖"无数据"状态
- **修复**: 返回 `null` 或 `NaN`，由展示层处理

### L17 — readdirSync 未校验路径是目录：coverage.ts

- **文件**: `src/core/trace-engine/coverage.ts:148`
- **问题**: `exists()` 仅确认路径存在，若为文件则 `readdirSync` 抛 ENOTDIR
- **修复**: 添加 `statSync(rfcDir).isDirectory()` 检查

### L18 — readJson 返回值未 null 检查：coverage.ts

- **文件**: `src/core/trace-engine/coverage.ts:151-152`
- **问题**: JSON 文件内容为 `null` 时，`rfc.id` 抛 TypeError
- **修复**: `if (!rfc || typeof rfc !== 'object') continue`

### L19 — 日期解析时区依赖：exception-validator.ts

- **文件**: `src/core/trace-engine/exception-validator.ts:60-61`
- **问题**: `new Date("2026-02-11")` 解析为 UTC，`Date.now()` 为本地时间；`new Date("invalid")` 的 `getTime()` 返回 NaN，`NaN < x` 为 false，静默通过过期检查
- **修复**: 添加 `if (isNaN(expires.getTime())) reasons.push('Invalid expires_at date')`

### L20 — rotateLog 非 .jsonl 路径静默失败：logger.ts

- **文件**: `src/shared/logger.ts:40`
- **问题**: 路径不以 `.jsonl` 结尾时，`replace` 返回原路径，`renameSync(path, path)` 无意义
- **修复**: 前置校验 `if (!path.endsWith('.jsonl')) throw`

### L21 — countLines 每次写入读全文件：logger.ts

- **文件**: `src/shared/logger.ts:14-18`
- **问题**: 每次 `writeLog` 都读取整个文件计算行数，O(n) per write
- **修复**: 使用 sidecar 文件记录行数，或仅在文件大小超阈值时检查

### L22 — appendJsonl 不处理不可序列化值：fs-utils.ts

- **文件**: `src/shared/fs-utils.ts:31`
- **问题**: `entry` 含 BigInt/循环引用/函数时 `JSON.stringify` 抛异常或静默丢数据
- **修复**: 添加 try-catch 包装

---

## 四、一致性（7 项）

### L23 — Feature ID 用本地时间而非 UTC：init.ts

- **文件**: `src/core/process-engine/init.ts:74-85`
- **问题**: `new Date()` 取本地时间生成日期段，其他时间戳均用 `toISOString()`（UTC）
- **修复**: 使用 `getUTCFullYear()`/`getUTCMonth()`/`getUTCDate()`

### L24 — writeMarkdown 尾部换行不一致：init.ts vs feature.ts

- **文件**: `init.ts:246` vs `feature.ts:26`
- **问题**: `writeMarkdown(path, featureId)` 无换行，`switchFeature` 写 `featureId + '\n'`
- **修复**: 统一带换行

### L25 — 健康分权重与 config-schema 默认权重不一致

- **文件**: `health-score.ts:17-19` vs `config-schema.ts:29-33`
- **问题**: 两处定义不同权重集，且 health-score 从不读取 config 中的权重
- **修复**: health-score 从 config 读取权重，删除硬编码

### L26 — context-pack 预算估算与 context-slicing 不一致

- **文件**: `context-pack.ts:116` (100 bytes/ref) vs `context-slicing.ts:45` (200 tokens/ref)
- **问题**: 两个模块用不同单位和数值估算 ref 大小
- **修复**: 统一估算常量到 shared 模块

### L27 — POST_VERIFY_STAGES 用字符串而非枚举：defect.ts

- **文件**: `src/core/change-mgr/defect.ts:149-151`
- **问题**: `ReadonlySet<string>` 含硬编码字符串，枚举值变更时不会编译报错
- **修复**: 改为 `ReadonlySet<Stage>` + `Stage.WRAP_UP` 等

### L28 — AdvanceResult vs StageHistoryEntry gateResult 可选性不一致

- **文件**: `advance.ts:30` vs `types.ts:52`
- **问题**: `AdvanceResult.gateResult: string`（必需）vs `StageHistoryEntry.gateResult?: string`（可选）
- **修复**: 统一可选性

### L29 — advance.ts 未使用的 TERMINAL_STAGES import

- **文件**: `src/core/process-engine/advance.ts:10`
- **问题**: `TERMINAL_STAGES` 导入但未使用，终态检查委托给 `isTerminal()`
- **修复**: 删除未使用 import

---

## 五、其他（4 项）

### L30 — id-search.ts toUpperCase 重复调用

- **文件**: `src/core/trace-engine/id-search.ts:28`
- **问题**: `id.toUpperCase()` 在同一循环迭代中调用两次
- **修复**: 提取为局部变量 `const upper = id.toUpperCase()`

### L31 — sca.ts O(n^2) 重复检测

- **文件**: `src/core/gate-engine/sca.ts:50`
- **问题**: `ids.filter((id, i) => ids.indexOf(id) !== i)` 是 O(n^2)
- **修复**: 使用 Set 实现 O(n) 检测

### L32 — CANCELLED 阶段检查所有制品：artifact-checker.ts

- **文件**: `src/core/template/artifact-checker.ts:84`
- **问题**: `CANCELLED` 在 STAGE_ORDER 索引 9，高于 RELEASE(7)，已取消的 Feature 仍检查全部制品
- **修复**: `CANCELLED` 阶段应跳过制品检查或仅检查到取消前阶段

### L33 — import.meta.dirname 兼容性：dispatcher.ts

- **文件**: `src/core/skill-runtime/dispatcher.ts:111`
- **问题**: `import.meta.dirname` 仅 Node.js >= 21.2 支持，项目 engines 声明 >= 20
- **修复**: 改用 `dirname(fileURLToPath(import.meta.url))` 或提升 engines 要求
