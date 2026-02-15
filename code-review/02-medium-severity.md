# Medium 级问题详述（41 项）

> 建议修复 — 涉及类型安全、健壮性、数据一致性、代码质量

---

## 一、类型安全（10 项）

### M1 — `as Stage` 绕过枚举类型检查

- **文件**: `src/core/gate-engine/gate-evaluator.ts:33,38,67,88,108,128,148,177,204`
- **问题**: `'00_init' as Stage` 等硬编码字符串强转枚举，拼写错误不会被编译器捕获
- **修复**: 改用 `Stage.INIT`、`Stage.SPECIFY` 等枚举成员

### M2 — 同样的 `as Stage` 问题（多文件）

- **文件**:
  - `src/core/gate-engine/sca.ts:33-37`
  - `src/core/gate-engine/golive.ts:49`
  - `src/core/ai-orchestrator/context-pack.ts:53`
- **修复**: 同 M1

### M3 — direction 强转无校验：layer-merger.ts

- **文件**: `src/core/process-engine/layer-merger.ts:208`
- **问题**: `entry.direction as ThresholdEntry['direction']` 无运行时校验，YAML 中写 `direction: "foo"` 也能通过

```typescript
// 修复方案
const validDirs = ['higher_is_better', 'lower_is_better'];
if (entry.direction && !validDirs.includes(entry.direction)) {
  throw new Error(`Invalid direction "${entry.direction}" for threshold "${key}"`);
}
```

### M4 — 健康分 unsafe cast：health-score.ts

- **文件**: `src/core/metrics-engine/health-score.ts:28`
- **问题**: `coverage as unknown as Record<string, number>` 丢弃 `CoverageMetrics` 类型信息
- **修复**: 直接访问 `coverage.C1`、`coverage.C2` 等类型化字段

### M5 — 瓶颈分析同样的 unsafe cast：bottleneck.ts

- **文件**: `src/core/metrics-engine/bottleneck.ts:27`
- **修复**: 同 M4

### M6 — AI 统计双重 cast：ai-stats.ts

- **文件**: `src/core/ai-orchestrator/ai-stats.ts:29`
- **问题**: `entry as unknown as Record<string, unknown>` 双重转换绕过类型系统
- **修复**: 让 `appendJsonl` 接受 `unknown` 类型，或定义序列化接口

### M7 — gate-evaluator 同样的双重 cast

- **文件**: `src/core/gate-engine/gate-evaluator.ts:302`
- **修复**: 同 M6

### M8 — 配置浅拷贝污染默认值：config-schema.ts

- **文件**: `src/shared/config-schema.ts:44,52`
- **问题**: `{ ...DEFAULTS }` 浅拷贝，嵌套对象（catchup/context/weights）共享引用，消费方修改会污染 DEFAULTS

```typescript
// 修复方案
cachedConfig = structuredClone(DEFAULTS);
```

### M9 — truthiness 拒绝合法零值：config-schema.ts

- **文件**: `src/shared/config-schema.ts:85`
- **问题**: `if (context?.token_budget &&` 会拒绝 `token_budget: 0`

```typescript
// 修复方案
if (context?.token_budget !== undefined && typeof context.token_budget === 'number') {
```

### M10 — AI 统计数值字段无校验：ai-stats.ts

- **文件**: `src/core/ai-orchestrator/ai-stats.ts:48-58`
- **问题**: `readStats` 无运行时校验，`tokensIn` 可能是 `undefined`/`NaN`/字符串，累加后静默产生 `NaN`

---

## 二、健壮性/容错（11 项）

### M11 — readFileSync 在 try 外：fs-utils.ts

- **文件**: `src/shared/fs-utils.ts:9`
- **问题**: `readFileSync` 在 `try` 块外，文件不存在时抛出原始 `ENOENT` 无上下文信息
- **修复**: 将 `readFileSync` 移入 `try` 块，或包装为带路径信息的错误

### M12 — ensureDir TOCTOU 竞态：fs-utils.ts

- **文件**: `src/shared/fs-utils.ts:36-39`
- **问题**: `existsSync` + `mkdirSync` 存在竞态，且 `mkdirSync({ recursive: true })` 本身已处理目录存在的情况
- **修复**: 直接调用 `mkdirSync(path, { recursive: true })`，删除冗余的 `existsSync` 检查

### M13 — Gate 历史 JSONL 解析无容错：gate-evaluator.ts

- **文件**: `src/core/gate-engine/gate-evaluator.ts:313`
- **问题**: `getGateHistory` 中 `JSON.parse` 无 try-catch，单行损坏导致全部历史不可用
- **修复**: 逐行 try-catch，跳过损坏行

### M14 — 单个 Feature 损坏导致列表崩溃：feature.ts

- **文件**: `src/core/process-engine/feature.ts:51`
- **问题**: `listFeatures` 中任一 `stage-state.json` 损坏，整个函数抛异常
- **修复**: per-feature try-catch，损坏条目标记为 error 而非中断全部

### M15 — context-pack readJson 无 try-catch

- **文件**: `src/core/ai-orchestrator/context-pack.ts:87`
- **问题**: `buildContextPack` 直接调用 `readJson`，`stage-state.json` 损坏时无错误处理
- **修复**: 添加 try-catch 或前置 `exists()` 检查

### M16 — Catchup 任务计数误匹配散文：catchup.ts

- **文件**: `src/core/ai-orchestrator/catchup.ts:62-65`
- **问题**: `content.includes('Done')` 匹配任意含 "Done" 的行，包括散文段落
- **修复**: 仅在表格行（以 `|` 开头的行）中匹配状态

### M17 — confirm-policy appendFileSync 不确保目录：confirm-policy.ts

- **文件**: `src/core/skill-runtime/confirm-policy.ts:39-48`
- **问题**: `appendFileSync` 直接写入，父目录不存在时抛 ENOENT
- **修复**: 写入前调用 `ensureDir(dirname(findingsPath))`

### M18 — 安全报告缺失默认 PASS：golive.ts

- **文件**: `src/core/gate-engine/golive.ts:59-60`
- **问题**: 安全扫描报告文件不存在时，GL-03 检查默认通过
- **风险**: 遗漏安全扫描即可绕过上线门禁
- **修复**: 缺失报告应为 FAIL，或至少为 WARN

### M19 — sed 语法 macOS/Linux 不兼容：hook-installer.ts

- **文件**: `src/core/tool-integration/hook-installer.ts:79`
- **问题**: `sed -i.bak` 是 GNU 语法，macOS 需要 `sed -i ''`
- **修复**: 使用 Node.js 文件操作替代 sed，或检测平台

### M20 — generateHookScript 无 exhaustive 检查：hook-installer.ts

- **文件**: `src/core/tool-integration/hook-installer.ts:62-117`
- **问题**: switch 无 default 分支，新增 hook 类型时编译器不会报错
- **修复**: 添加 `default: throw new Error(\`Unknown hook: ${name}\`)`

### M21 — registerAIHooks 是空操作：ai-runtime-hook.ts

- **文件**: `src/core/tool-integration/ai-runtime-hook.ts:60-64`
- **问题**: 函数声称"注册 AI Hook 到宿主环境配置"，实际只返回类型名列表，不写入任何文件
- **修复**: 实现实际注册逻辑，或重命名为 `listAIHookTypes`

---

## 三、数据一致性（8 项）

### M22 — 两平台同 key 不同 direction 静默忽略：layer-merger.ts

- **文件**: `src/core/process-engine/layer-merger.ts:218-224`
- **问题**: 平台 A `coverage: { direction: higher_is_better }` 与平台 B `coverage: { direction: lower_is_better }` 冲突时，静默使用先到者的 direction
- **修复**: 检测 direction 冲突并抛出错误

### M23 — 无效 ID 仍创建 Feature 类型行：matrix.ts

- **文件**: `src/core/trace-engine/matrix.ts:117`
- **问题**: `validateId` 返回 `{ valid: false }` 时，`type` 回退为 `'Feature'`，畸形 ID 被静默当作 FR 处理
- **修复**: 跳过无效 ID 行，或标记为 unknown 类型

### M24 — YAML 导出未转义特殊字符：matrix.ts

- **文件**: `src/core/trace-engine/matrix.ts:155-166`
- **问题**: `title` 含双引号或反斜杠时，生成的 YAML 格式损坏
- **修复**: 使用 `js-yaml` 的 `yaml.dump` 替代手动拼接

### M25 — defect 序号 TOCTOU 竞态：defect.ts

- **文件**: `src/core/change-mgr/defect.ts:39-52`
- **问题**: `nextDefectSeq` 读目录计算 max+1，并发调用可得到相同序号，后写覆盖前写
- **修复**: 使用 `writeFileSync` 的 `wx` flag（文件已存在则失败）+ 重试

### M26 — listDefects 读取所有 .json 文件：defect.ts

- **文件**: `src/core/change-mgr/defect.ts:127-130`
- **问题**: `defects/` 目录下任何 `.json` 文件都被当作 DefectRecord 解析
- **修复**: 过滤为 `entry.match(/^defect-\d+\.json$/)`

### M27 — Markdown 表格 pipe 注入：rfc.ts

- **文件**: `src/core/change-mgr/rfc.ts:156-199`
- **问题**: `waiver.reason` 含 `|` 字符时破坏 Markdown 表格结构
- **修复**: 写入前转义 `value.replace(/\|/g, '\\|')`

### M28 — sync.ts 绕过 fs-utils 抽象层

- **文件**: `src/core/change-mgr/sync.ts:73`
- **问题**: 直接 `import { appendFileSync } from 'node:fs'`，绕过项目的 fs-utils 封装
- **修复**: 在 fs-utils 中添加 `appendMarkdown` 函数

### M29 — updateMatrixRow 循环内逐次全文件读写：sync.ts

- **文件**: `src/core/change-mgr/sync.ts:50`
- **问题**: N 个变更 ID 触发 N 次完整的文件读取-解析-写入循环
- **修复**: 批量收集更新，单次读写

---

## 四、代码质量（12 项）

### M30 — getRegisteredCommands 返回可变引用：router.ts

- **文件**: `src/cli/router.ts:26-28`
- **问题**: 返回内部 `commands` Map 的直接引用，外部可 `.set()`/`.delete()` 污染路由状态
- **修复**: 返回类型改为 `ReadonlyMap<string, CommandEntry>`

### M31 — 重复注册命令无警告：router.ts

- **文件**: `src/cli/router.ts:22`
- **问题**: `commands.set(name, ...)` 静默覆盖同名命令
- **修复**: 添加 `if (commands.has(name)) throw new Error(...)`

### M32 — catch 吞掉 stack trace：router.ts

- **文件**: `src/cli/router.ts:47-51`
- **问题**: 仅打印 `err.message`，丢弃堆栈信息，生产环境难以定位问题
- **修复**: 检查 `DEBUG` 环境变量，有则打印完整 stack

### M33 — 无条件 throw-then-catch 伪装逻辑：advance.ts

- **文件**: `src/core/process-engine/advance.ts:106`
- **问题**: `try { throw new GateUnavailableError(); } catch (e) {` 无条件抛出再捕获，else 分支不可达
- **修复**: 改为 `if/else` + `// TODO: call GateEngine` 注释

### M34 — advance.ts 绕过 fs-utils

- **文件**: `src/core/process-engine/advance.ts:7`
- **问题**: 直接 `import { appendFileSync } from 'node:fs'`
- **修复**: 使用 fs-utils 封装

### M35 — sca.ts 重复 filter

- **文件**: `src/core/gate-engine/sca.ts:46-49`
- **问题**: `frRows` 已计算，但下一行重新 `rows.filter(r => r.type === 'FR')`
- **修复**: `const ids = frRows.map(r => r.id)`

### M36 — security.ts cast 在校验前

- **文件**: `src/core/gate-engine/security.ts:64`
- **问题**: `cells[1] as Severity` 在 `includes` 校验之前执行
- **修复**: 先校验再窄化类型

### M37 — SliceConfig ratio 字段从未使用

- **文件**: `src/core/ai-orchestrator/context-slicing.ts:9-14`
- **问题**: `l1Ratio`/`l2Ratio`/`l3Ratio` 定义了但 `sliceContext` 从未读取
- **修复**: 删除未使用字段，或实现分层切片逻辑

### M38 — control zone 限制未执行：context-pack.ts

- **文件**: `src/core/ai-orchestrator/context-pack.ts:106-107`
- **问题**: `CONTROL_LIMIT = 2048` 和 `validateControlSize` 存在但 `buildContextPack` 从未调用
- **修复**: 在 build 流程末尾调用 `validateControlSize`

### M39 — projectRoot 参数未使用：ai-runtime-hook.ts

- **文件**: `src/core/tool-integration/ai-runtime-hook.ts:25`
- **问题**: `generateAIHookConfigs(projectRoot)` 接受参数但函数体未引用
- **修复**: 删除参数或实现路径相关逻辑

### M40 — task_plan.md 重复定义：artifact-checker.ts

- **文件**: `src/core/template/artifact-checker.ts:49,65`
- **问题**: `task_plan.md` 在 INIT 和 PLAN 阶段各定义一次，重复检查
- **修复**: 保留一处，或区分"创建"与"更新"语义

### M41 — 未使用的 existsSync import：artifact-checker.ts

- **文件**: `src/core/template/artifact-checker.ts:7`
- **问题**: `import { existsSync } from 'node:fs'` 未使用，代码使用 fs-utils 的 `exists`
- **修复**: 删除未使用 import
