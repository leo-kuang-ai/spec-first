# first Skill 最小支撑层——后续清理方案

**版本：** v1.0.0 | 2026-03-19
**背景：** 对照当前代码实现复审后，`first` 的主边界已经扳正：handoff 已落地，fallback 已删除，CLI 也已经回到最小支撑层。但旧协调层（`first-context.ts` / `first-governance.ts` / `first-change-detector.ts`）和消费端（`status.ts` / `doctor.ts` / `sca.ts`）仍保留部分旧治理语义。本文档只保留“复审后确认成立”的问题，并给出收紧后的修复方案。

---

## 复审结论

本次复审后的判断如下：

1. **成立：** `status.ts` / `doctor.ts` / `sca.ts` 仍在消费 `docsProjection[*].healthy`
2. **成立：** `first-governance.ts` 仍把 `docs/first/` 和部分支撑层文件当作 trigger
3. **成立：** `renderDevelopmentGuidelinesDoc` 存在明显 copy-paste 重复
4. **成立：** `first-context.ts` 与 `first-change-detector.ts` 存在 git porcelain 解析重复实现
5. **成立：** `executeFirst()` 为孤立导出
6. **部分成立，但需收紧：** `MUST_UPDATE_PATTERNS` 不只是 `first-doc-projection.ts` 过重，`first-bootstrap.ts` 等支撑层文件也应重新评估
7. **成立但低优先级：** `buildIndexEntry` 命名冲突属于可读性问题，不是架构阻断项
8. **成立：** `SKILL.md` 仍示例 `--yes`，但 CLI 未实现该参数

---

## 当前执行状态（2026-03-19）

已完成：

- `OPT-1` 已完成：`status.ts` / `doctor.ts` / `sca.ts` 已统一改为 `checkFirstDocsExistence(projectRoot)`，不再消费 `docsProjection[*].healthy`
- `OPT-2` 已完成：`docs/first/` 已退出 `SHOULD_UPDATE_PATTERNS`，`first-doc-projection.ts` 已退出 `MUST_UPDATE_PATTERNS`，docs-only 变更不再触发 writeback
- `OPT-3` 已完成：`renderDevelopmentGuidelinesDoc` 的重复“配置规范/交付规范”已合并为“项目规范”
- `OPT-4` 已完成：`first-context.ts` 已复用 `parsePorcelainChangedFiles()`，不再保留一份独立 porcelain 解析实现
- `OPT-5` 已完成：`executeFirst()` 及其无用返回类型已删除
- `OPT-8` 已完成：`SKILL.md` 和相关文档测试已移除错误的 `--yes` 示例

待完成：

- `OPT-6` 已完成：`MUST_UPDATE_PATTERNS` 已从 `first-*` 通配切为显式认知源白名单，`first-bootstrap.ts` / `first-context.ts` 这类支撑层变更不再触发 `must_update`
- `OPT-7` 已完成：`first-bootstrap.ts` / `first-context.ts` 中重名的 `buildIndexEntry` 已分别改为 `buildHandoffIndexEntry` / `buildRuntimeIndexEntry`
- `OPT-9` 已部分完成：P1/P2/P3 相关测试已补齐并通过，仍建议在最终交付前再跑一轮更宽的回归

---

## 目标状态（Definition of Done）

> 所有下述任务完成后，以下断言必须全部为真：
>
> 1. `docs/first/*.md` 的 `healthy` 字段不再被任何消费逻辑用于治理决策
> 2. `first-governance.ts` 中没有任何 `docs/first/` 路径作为 trigger 条件
> 3. `first-context.ts` 不再包含与 `first-change-detector.ts` 重复的 git 解析逻辑
> 4. `executeFirst()` 要么被删除，要么有明确的消费方和文档
> 5. `renderDevelopmentGuidelinesDoc` 中不再出现重复的“配置规范/交付规范”章节
> 6. `npm run typecheck && npm test` 全量通过

---

## 任务列表

| ID | 任务 | 优先级 | 预计改动文件数 |
|----|------|--------|---------------|
| OPT-1 | 修复 docs 健康语义：status/doctor/sca 改用 docs existence 检查 | ✅ 已完成 | 3 |
| OPT-2 | 收缩 governance 触发源：移除 docs 路径与支撑层误触发项 | ✅ 已完成 | 1 |
| OPT-3 | 修复 `renderDevelopmentGuidelinesDoc` copy-paste bug | ✅ 已完成 | 1 |
| OPT-4 | 消除 git porcelain 解析重复实现 | ✅ 已完成 | 2 |
| OPT-5 | 删除 `executeFirst()` 孤立导出 | ✅ 已完成 | 1 |
| OPT-6 | 重新划定 governance `MUST_UPDATE_PATTERNS` 的认知源边界 | ✅ 已完成 | 1 |
| OPT-7 | 统一 `buildIndexEntry` 命名，消除歧义 | ✅ 已完成 | 2 |
| OPT-8 | 对齐 SKILL.md 与 CLI 参数（`--yes`） | ✅ 已完成 | 1 |
| OPT-9 | 补齐 OPT-1 至 OPT-6 的测试覆盖 | 🟠 部分完成 | 2～4 |

---

## 任务详情

---

### OPT-1：修复 docs 健康语义（status / doctor / sca）

**问题根因：**
`status.ts`、`doctor.ts`、`sca.ts` 通过 `docsProjection[path].healthy` 判断 docs 状态，但新架构下 docs 是输出产物，其 `healthy` 字段无实际维护语义——真正需要检查的是文件是否**存在于磁盘**，而非索引条目是否 healthy。

**当前行为：**

```typescript
// status.ts L193
const docsReady = Object.values(runtimeIndex.docsProjection).every((entry) => entry.healthy);

// doctor.ts L297-298
const missingDocs = Object.entries(index.docsProjection)
  .filter(([, entry]) => !entry.healthy)

// sca.ts L125-126
const missingDocs = Object.entries(runtimeIndex.docsProjection)
  .filter(([, entry]) => !entry.healthy)
```

**目标行为：** 不再直接消费 `index.docsProjection[*].healthy`，统一改为 docs existence 检查。

**优化点：**
优先复用现有的 [`first-docs-check.ts`](src/core/skill-runtime/first-docs-check.ts) 中 `checkFirstDocsExistence(projectRoot)`，而不是在三处重复写 `existsSync + CANONICAL_PROJECTION_DOCS`。这样可以自动复用条件型 `database-er.md` 的判定逻辑，避免三处再次分叉。

**修改方案：**

**`src/cli/commands/status.ts`**

```typescript
import { checkFirstDocsExistence } from '../../core/skill-runtime/first-docs-check.js';

const docsReady = checkFirstDocsExistence(projectRoot).ok;
```

**`src/cli/commands/doctor.ts`**

```typescript
import { checkFirstDocsExistence } from '../../core/skill-runtime/first-docs-check.js';

const missingDocs = checkFirstDocsExistence(root).missing;

results.push({
  name: 'Docs Outputs',
  level: missingDocs.length === 0 ? 'PASS' : 'WARNING',
  message: missingDocs.length === 0 ? '已生成' : `缺失: ${missingDocs.join(', ')}`,
  fix:
    missingDocs.length === 0
      ? undefined
      : '重新执行 /spec-first:first，补齐 docs/first 输出',
});
```

**`src/core/gate-engine/sca.ts`**

```typescript
import { checkFirstDocsExistence } from '../skill-runtime/first-docs-check.js';

const missingDocs = checkFirstDocsExistence(projectRoot).missing;
if (missingDocs.length > 0) {
  findings.push({
    severity: 'MEDIUM',
    type: 'DOCS_OUTPUTS_MISSING',
    location: 'docs/first/',
    detail: `docs 输出缺失: ${missingDocs.join(', ')}`,
    suggestion: '重新执行 /spec-first:first 补齐 docs/first 输出',
  });
}
```

**验收：** `healthy` 字段在 status/doctor/sca 三处不再出现，统一改为 `checkFirstDocsExistence(projectRoot)`。

---

### OPT-2：清理 governance 中的 docs 触发语义

**问题根因：**
`SHOULD_UPDATE_PATTERNS` 包含 `docs/first/` 路径，导致 docs 输出本身会回流成治理 trigger。同时，`MUST_UPDATE_PATTERNS` 里仍包含 `first-doc-projection.ts` 这类渲染/支撑层文件，边界比当前架构要求更宽。

**当前代码（`src/core/skill-runtime/first-governance.ts`）：**

```typescript
// L68-76
const SHOULD_UPDATE_PATTERNS = [
  /^docs\/first\/.+\.md$/,           // ← 移除
  /^tests\/unit\/first-.+\.test\.ts$/,
  /^tests\/unit\/context-resolver\.test\.ts$/,
  /^tests\/unit\/dispatcher-first-runtime\.test\.ts$/,
  /^tests\/unit\/skill-runtime\.test\.ts$/,
  /^src\/core\/skill-runtime\/context-resolver\.ts$/,
  /^src\/core\/skill-runtime\/dispatcher\.ts$/,
];
```

**修改方案：**

```typescript
// 删除第一条，保留其余
const SHOULD_UPDATE_PATTERNS = [
  // docs/first/ 是写入产物，不作为 trigger 条件
  /^tests\/unit\/first-.+\.test\.ts$/,
  /^tests\/unit\/context-resolver\.test\.ts$/,
  /^tests\/unit\/dispatcher-first-runtime\.test\.ts$/,
  /^tests\/unit\/skill-runtime\.test\.ts$/,
  /^src\/core\/skill-runtime\/context-resolver\.ts$/,
  /^src\/core\/skill-runtime\/dispatcher\.ts$/,
];
```

同步调整 `MUST_UPDATE_PATTERNS`，至少移除 `first-doc-projection.ts`。进一步建议复审下列支撑层文件是否也应退出 `must_update`：

- `first-bootstrap.ts`
- `first-context.ts`

判断原则：
- **保留在 MUST_UPDATE：** 会改变 runtime 认知事实来源或结构的代码
- **退出 MUST_UPDATE：** 只影响 handoff 消费、写盘、渲染、存在性检查的支撑层代码

最低安全改动如下：

```typescript
// 删除此行
/^src\/core\/skill-runtime\/first-doc-projection\.ts$/,
```

**验收：**
- `analyzeProjectCognitionDiff` 在仅有 `docs/first/` 变更时返回 `must_not_update`
- `first-doc-projection.ts` 不再单独触发 `must_update`

---

### OPT-3：修复 `renderDevelopmentGuidelinesDoc` copy-paste bug

**问题根因：**
`first-doc-projection.ts` 中"配置规范"与"交付规范"两个章节使用了完全相同的数据源 `context.conventions.projectRules`，导致 `development-guidelines.md` 中两节内容相同。

**当前代码（`src/core/skill-runtime/first-doc-projection.ts`）：**

```typescript
// L353-366（当前"配置规范"与"交付规范"均读 projectRules）
'## 配置规范',
...renderSubsection('观察到的模式', context.conventions.projectRules.observedPatterns, '无'),
...renderSubsection('偏差', context.conventions.projectRules.deviations, '无'),
`- 推荐规则: ${context.conventions.projectRules.recommendedConvention}`,
...renderSubsection('证据', context.conventions.projectRules.evidence, '无'),

'## 交付规范',
...renderSubsection('观察到的模式', context.conventions.projectRules.observedPatterns, '无'), // ← 重复
...renderSubsection('偏差', context.conventions.projectRules.deviations, '无'),              // ← 重复
`- 推荐规则: ${context.conventions.projectRules.recommendedConvention}`,                    // ← 重复
...renderSubsection('证据', context.conventions.projectRules.evidence, '无'),               // ← 重复
```

**修改方案：**

经复审，`FirstConventions` 当前只有：
- `api`
- `module`
- `testing`
- `projectRules`

没有独立的 `delivery` 或 `configRules` 字段。因此不应凭空新增 schema；最合理的修复是**合并重复章节**，或改成“项目规范”单节。

```typescript
// 方案 A（若 FirstConventions 有独立 delivery 字段）：
'## 交付规范',
...renderSubsection('观察到的模式', context.conventions.delivery.observedPatterns, '无'),
...renderSubsection('偏差', context.conventions.delivery.deviations, '无'),
`- 推荐规则: ${context.conventions.delivery.recommendedConvention}`,
...renderSubsection('证据', context.conventions.delivery.evidence, '无'),

// 方案 B（当前推荐）：
// 删除“交付规范”重复块，保留单一“项目规范”章节：
'## 项目规范',
...renderSubsection('观察到的模式', context.conventions.projectRules.observedPatterns, '无'),
...renderSubsection('偏差', context.conventions.projectRules.deviations, '无'),
`- 推荐规则: ${context.conventions.projectRules.recommendedConvention}`,
...renderSubsection('证据', context.conventions.projectRules.evidence, '无'),
```

**验收：** `docs/first/development-guidelines.md` 中不再出现两段完全重复的规范章节。

---

### OPT-4：消除 git porcelain 解析重复实现

**问题根因：**
`first-context.ts` 与 `first-change-detector.ts` 各自实现了一套 git porcelain 输出（`git status --porcelain`）解析逻辑，包含 rename 路径提取和引号剥离，细节上存在细微差异，任何修复需双倍维护。

**当前重复代码：**

```typescript
// first-context.ts L167-172
.map((line) => line.slice(3).trim())
.map((path) => (path.includes(' -> ') ? (path.split(' -> ').at(-1) ?? path) : path))
.map((path) => path.replace(/^"|"$/g, ''))
.filter(Boolean)

// first-change-detector.ts L99-102（parsePorcelainChangedFiles）
.map((line) => line.slice(3).trim())
.map((path) => (path.includes(' -> ') ? (path.split(' -> ').at(-1) ?? path) : path))
.map((path) => path.replace(/^"|"$/g, ''))
.filter(Boolean)
```

**修改方案：**

在 `first-change-detector.ts` 中将 `parsePorcelainChangedFiles` 导出（已有实现，仅需 export）：

```typescript
// first-change-detector.ts — 添加 export
export function parsePorcelainChangedFiles(output: string): string[] { ... }
```

在 `first-context.ts` 中删除本地实现，改为 import：

```typescript
// first-context.ts — 替换 L155-176 中的本地实现
import { parsePorcelainChangedFiles } from './first-change-detector.js';

function getWorkingTreeChangedFiles(projectRoot: string): string[] | null {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (output === '') return [];
    return parsePorcelainChangedFiles(output);
  } catch {
    return null;
  }
}
```

**验收：** git porcelain 解析逻辑只存在一处，`first-context.ts` 中无本地 `.slice(3)` 实现。

---

### OPT-5：删除 `executeFirst()` 孤立导出

**问题根因：**
`first-context.ts` 导出 `executeFirst()`，但当前代码库内无任何消费方。它的语义也已经被 `handleFirst` / `bootstrapFirstRuntime` / `refreshFirstArtifacts` 覆盖，是旧架构遗留。

**修改方案：**

```typescript
// first-context.ts — 删除 L493-503 全部：
export function executeFirst(projectRoot: string): ExecuteFirstResult {
  ...
}
// 同时删除 ExecuteFirstResult interface（L79-82），若无其他消费方
```

若删除前需确认：执行 `grep -rn "executeFirst" src/ tests/` 确认零引用后再删除。

**验收：** `executeFirst` 从代码库中消失，`ExecuteFirstResult` 类型同步清理。

---

### OPT-6：重新划定 governance `MUST_UPDATE_PATTERNS` 的认知源边界

（已在 OPT-2 中部分合并，此处单独列出是为任务追踪完整性）

- 移除 `/^src\/core\/skill-runtime\/first-doc-projection\.ts$/`
- 评估 `first-bootstrap.ts` / `first-context.ts` 是否也应退出 `MUST_UPDATE_PATTERNS`
- 不建议把渲染层文件加入 `SHOULD_UPDATE_PATTERNS`

---

### OPT-7：统一 `buildIndexEntry` 命名，消除歧义

**问题根因：**
`first-bootstrap.ts` 和 `first-context.ts` 各有一个名为 `buildIndexEntry` 的函数，但签名和语义不同：

| 文件 | 签名 | 语义 |
|------|------|------|
| `first-bootstrap.ts` L36 | `(fullPath, relativePath, now)` | 读文件内容，计算 hash |
| `first-context.ts` L278 | `(path, now)` | 检查文件存在性，条件计算 hash |

**修改方案：**

```typescript
// first-bootstrap.ts — 重命名为 buildHandoffIndexEntry
function buildHandoffIndexEntry(fullPath: string, relativePath: string, now: string): FirstRuntimeAssetIndexEntry

// first-context.ts — 重命名为 buildRuntimeIndexEntry
function buildRuntimeIndexEntry(path: string, now: string): FirstRuntimeAssetIndexEntry
```

同步更新各自文件内部调用处。

---

### OPT-8：对齐 SKILL.md 与 CLI 参数（`--yes`）

**问题根因：**
`skills/spec-first/00-first/SKILL.md` 仍展示 `spec-first first --yes` 为推荐用法，但 `first-args.ts` 当前未实现 `--yes`。

**修改方案（二选一）：**

- **方案 A（推荐）：** 从 SKILL.md 删除 `--yes` 示例，改为说明批处理直接使用 `spec-first first --force`
- **方案 B：** 在 `first-args.ts` 中实现 `--yes` 参数（等价于非交互静默确认），并在 `first.ts` 中处理

结合当前实现，**方案 A 更合理**：删掉 `--yes` 示例，避免再扩张 CLI 参数面。

---

### OPT-9：补齐测试覆盖

针对 OPT-1 至 OPT-6 的变更，新增/修改以下测试：

**`tests/unit/first-governance.test.ts`**
- 新增：`docs/first/` 路径变更时 `analyzeProjectCognitionDiff` 返回 `must_not_update`
- 修改：移除 `first-doc-projection.ts` 触发 `must_update` 的 case

**`tests/unit/first-command.test.ts`（或 `doctor`/`status`/`sca` 对应测试）**
- 新增：docs 文件不存在时，`doctor`/`status`/`sca` 通过 `existsSync` 检测到缺失（而非 healthy 字段）
- 新增：docs 文件存在但 `docsProjection[path].healthy = false` 时，不报告缺失（验证去耦合）

**`tests/unit/first-change-detection.test.ts`**
- 新增：`parsePorcelainChangedFiles` 导出函数单元测试（rename、引号路径边界 case）

---

## 执行顺序建议

```
阶段 1（紧急，单 PR）：
  OPT-1 → OPT-2 → OPT-9（对应测试）
  理由：消除 docs existence / governance trigger 的旧语义，是当前架构中最危险的残留

阶段 2（质量，单 PR）：
  OPT-3 → OPT-4 → OPT-5 → OPT-6 → OPT-9（对应测试）
  理由：Bug 修复 + 重复代码消除 + 孤立导出清理，独立且无依赖

阶段 3（收尾，可合并进下一迭代）：
  OPT-7 → OPT-8
  理由：命名和文档对齐，风险低，可与其他 chore 合并
```

---

## 完成后验收清单

```
□ grep -rn "docsProjection.*healthy\|\\.healthy" src/cli src/core/gate-engine
  → 结果为空（status/doctor/sca 不再消费 docsProjection.healthy）

□ grep -rn "docs/first" src/core/skill-runtime/first-governance.ts
  → 仅允许日志/assetId 组装位置出现；SHOULD_UPDATE_PATTERNS 中无 docs/first 条目

□ grep -rn "executeFirst" src/ tests/
  → 结果为空（函数已删除）

□ grep -rn "first-doc-projection" src/core/skill-runtime/first-governance.ts
  → 仅允许 import/注释外的非 trigger 位置；MUST_UPDATE_PATTERNS 中已移除

□ npm run typecheck
  → 0 errors

□ npm test
  → 全量通过，覆盖率不低于当前基线

□ spec-first first --check-health
  → 在无 docs/first/ 目录时，输出"缺失"并通过 existsSync 检测，
     不依赖 docsProjection 索引
```

---

## 风险提示

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| OPT-1 改用 `existsSync` 后，若 `CANONICAL_PROJECTION_DOCS` 列表不完整，会漏报缺失 docs | status/doctor 误报"已生成" | 改动前先对照 `first-artifact-mapping.ts` 确认 `CANONICAL_PROJECTION_DOCS` 覆盖全部 14 个 docs |
| OPT-4 导出 `parsePorcelainChangedFiles` 后，若 `first-change-detector.ts` 被其他模块循环引用 | 编译错误 | 改动后立即运行 `typecheck` |
| OPT-5 删除 `executeFirst()` 前，若外部插件或测试有隐式依赖 | 运行时缺失 | 删除前执行 `grep -rn executeFirst .` 全量确认 |
