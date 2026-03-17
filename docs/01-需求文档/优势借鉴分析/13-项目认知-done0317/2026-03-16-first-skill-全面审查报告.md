# first skill 全面审查报告（当前状态复核版）

> 审查日期：2026-03-16
> 复核日期：2026-03-17
> 审查范围：SKILL.md、CLI 命令层、参数解析、bootstrap、runtime store、类型定义、治理、变更检测、文档投影、会话恢复、确认策略、runtime notice
> 审查维度：最佳实践合规性、逻辑漏洞、流程健壮性

---

## 总览

> 本文最初形成于 `2026-03-16`。截至 `2026-03-17`，`first` 已完成 runtime-first 主链收口、节点接入、缺失场景分层降级、docs fallback 与 `index.json` 解耦、`00-first` skill 文档与测试口径收紧。因此，本文中的问题需要区分：
>
> - **仍成立**：当前代码仍存在，且值得继续修
> - **部分成立**：方向对，但表述需要按当前实现改写
> - **已被后续改造削弱**：不能再按原风险等级理解

### 2026-03-17 复核结论

| 状态 | 数量 | 说明 |
|------|------|------|
| **仍成立** | 14 | 主要集中在写入健壮性、参数体系、governance、性能 |
| **部分成立** | 5 | 多为旧版崩溃表述需要下调为 contract/实现不一致 |
| **已被后续改造削弱** | 3 | 不再构成当前主链的主要风险 |

| 层面 | 结论 |
|------|------|
| **写入健壮性** | ⚠️ 仍无原子性/回滚保障，中途失败会留下脏状态，是当前最大隐患 |
| **类型安全** | ⚠️ 仍有 index contract 不干净的问题，但“旧格式必然崩溃”的表述需要下调 |
| **参数体系** | ⚠️ `--update` 静默忽略、互斥校验缺失，参数语义不清晰 |
| **性能** | 🔶 `readFirstRuntimeIndex` 无缓存，dispatcher 每次调用 IO 重复 10-15 次 |
| **governance** | 🔶 变更文件收集逻辑有误判风险，`stage-state.json` 直写绕过状态机 |
| **SKILL.md** | ✅ active skill 已明显收口；残留问题主要是占位符和少量说明精度 |

复核后建议：继续保留本文作为修复清单，但不要再按“2026-03-16 的原始严重度”机械执行。

---

## 🔴 高优先级（2 项）

### H1 — index.json 两阶段写入存在中间态风险

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-bootstrap.ts:546-558`
- **问题**：bootstrap 分两次写 `index.json`：
  1. 第一次写入 `docsProjection: {}` 的 `initialIndex`
  2. 调用 `refreshFirstDocsFromRuntime`（第 548 行）
  3. 第二次写入带完整 `docsProjection` 的最终 index

  若第 2 步执行期间进程崩溃，index 停留在 `docsProjection: {}` 状态。`normalizeCanonicalRuntimeIndex` 对 `docsProjection` 无 synthetic fallback，下次启动时健康检查会误判为"runtime 健康，docs 投影为空"，走 executeFirst 而不是 bootstrap，产生基于不完整状态的认知资产。

### H2 — 写入链路无事务/回滚保障

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-bootstrap.ts`、`first-context.ts`（`rewriteRuntimeArtifacts`）
- **问题**：13 个 JSON 文件（12 个 runtime assets + 1 个 index）逐个独立调用 `writeRuntimeJson` 写入。写到中途失败时：
  - 已写文件为新版本
  - 未写文件为旧版本或不存在
  - index.json 处于第一次写入状态或未写入

  下次健康检查可能认为 runtime 健康（旧文件存在），跳过 bootstrap 直接走 executeFirst，产生基于脏状态的认知资产。整个链路无任何回滚机制。

---

## 🟠 中优先级（12 项）

### M1 — `summary`/`roleViews`/`stageViews` 缺少 synthetic fallback

- **当前状态（2026-03-17）**：**部分成立**

- **位置**：`first-runtime-store.ts:194-220`（`normalizeCanonicalRuntimeIndex`）
- **问题**：`steering` 到 `databaseSchema` 的 8 个字段都有 `??` fallback，但 `summary`/`roleViews`/`stageViews` 直接透传原始值。当前实现已经使用可选链，未必会立即触发原文描述的 `TypeError`，但类型承诺与真实返回仍不干净，旧格式 index 仍可能导致健康状态判断失真。

### M2 — `docsProjection` 无 synthetic fallback 且 status 计算不含其健康度

- **当前状态（2026-03-17）**：**部分成立**

- **位置**：`first-runtime-store.ts:189`（spread 直接透传）、`first-runtime-types.ts:38`
- **问题**：`docsProjection` 类型非 optional，但磁盘上旧格式 index.json 可能无此字段。同时 `status: 'current'` 的计算逻辑不考虑 docsProjection 完整性，即 runtime 全健康但 docs 投影全缺时 `status` 仍为 `current`。当前风险更准确地说是 contract 不完整与健康状态偏乐观，而不是必然触发 undefined 崩溃。

### M3 — `buildBootstrapDatabaseSchema` 虚假 healthy

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-bootstrap.ts:366-395`
- **问题**：只要 `prisma/schema.prisma` 或 `schema.prisma` 文件存在就标 `healthy: true`，但 `tables` 内容仅有占位符（`name: 'schema'`、`fields: []`、`relations: []`）。downstream 的 `renderDatabaseErDoc` 会生成空 ER 文档，但健康检查通过，语义是虚假 healthy（SKILL.md 中定义了三态：healthy/not_applicable/degraded，此处应为 degraded 或占位符应被标注）。

### M4 — governance 变更文件收集语义漏洞

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-governance.ts:117-123`
- **问题**：
  ```typescript
  function collectProjectCognitionChangedFiles(projectRoot: string): string[] {
    const workingTreeChangedFiles = getWorkingTreeChangedFiles(projectRoot);
    if (workingTreeChangedFiles.length > 0) {
      return workingTreeChangedFiles;
    }
    return getLastCommittedChangedFiles(projectRoot); // ← 工作区干净时的回退
  }
  ```
  工作区干净时回退到"最后一次 commit 的变更"，但最近提交可能是无关的历史提交（如配置变更），会误触发 `must_update`。反之，工作区有大量无关变更（如 node_modules 更新）时会误判需要更新。

### M5 — `--update` 系列参数静默忽略

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-args.ts:30-55`、`first.ts` 主流程
- **问题**：`PRODUCT_NAMES`（doc 文件名，如 `api-docs`）与 `FIRST_RUNTIME_ARTIFACTS`（JSON 文件名，如 `api-contracts.json`）命名体系不一致。`--update=api-docs` 参数被解析后，主流程无对应处理分支，传入后静默无效，用户无任何反馈或错误提示。属于"已解析但未实现"的功能留下的隐患。

### M6 — `--update`/`--skip`/`--force` 互斥关系未校验

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-args.ts:97-200`
- **问题**：以下矛盾组合静默产生混合 `FirstArgs` 对象，无任何警告：
  - `--skip --update=api-docs`（跳过生成的同时要求更新）
  - `--check-health --force`（只检查时强制更新无意义）
  - `--skip --force`（同时跳过和强制）

  调用方（`first.ts`）通过顺序优先级处理这些组合，但没有向用户说明哪个标志生效。

### M7 — `resolveFirstConfirmPolicy` 语义混用

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-args.ts:207-209`
- **问题**：
  ```typescript
  export function resolveFirstConfirmPolicy(args: FirstArgs): 'skip' | 'require' {
    return args.auto || args.force || args.skip ? 'skip' : 'require';
  }
  ```
  `args.skip`（"跳过生成，使用现有产物"）和 confirm `'skip'`（"跳过交互确认"）是不同概念，但被等同处理。`--skip` 影响 `confirmPolicy` 但不影响 `modePolicy`（仍返回 `'standard'`），两者行为不对称，增加调用方理解负担。

### M8 — `syncBackgroundInputStatus` 直接写 `stage-state.json`

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-context.ts:1034-1037`
- **问题**：
  ```typescript
  writeJson(statePath, {
    ...state,
    backgroundInputStatus,
  });
  ```
  直接 `writeJson` 到 `stage-state.json`，绕过 spec-first CLI 状态机。CLAUDE.md 明确规定此文件"只能通过 CLI 操作"（🔴 高风险）。若 Gate 条件依赖 `backgroundInputStatus`，此写入实际上是在帮助绕过前置检查。即使是内部程序操作，也应通过 CLI 提供的状态更新接口而非直接写入。

### M9 — `commitMismatch` 硬编码 `false`

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-resume.ts:117`
- **问题**：
  ```typescript
  return {
    ...
    commitMismatch: false,  // 始终硬编码，不做实际 commit 比较
    ...
  };
  ```
  `checkFirstUpdateContext`（`first-change-detector.ts:403-406`）有正确的 commit mismatch 检测并通过 `formatHealthStatus` 展示，但 `generateResumeRecommendation` 中的 `commitMismatch` 字段始终为 false，接口字段名与行为完全不符。

### M10 — `analyzeChanges` 中 `HEAD~10` 兜底范围不可控

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-change-detector.ts:143`
- **问题**：
  ```typescript
  const compareCommit = lastUpdateCommit || 'HEAD~10';
  ```
  `lastUpdateCommit` 不可用时（首次运行或 index 无 sourceCommit）使用 `HEAD~10` 作为基准。对于频繁提交的项目，`HEAD~10` 可能包含大量变更导致误报 `full` 更新策略；对于稀少提交的项目，`HEAD~10` 可能超出历史范围导致 git 命令失败（被 catch 后静默回退 full 策略，但日志不友好）。

### M11 — `refreshFirstDocsFromRuntime` 失败无回滚

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`first-doc-projection.ts:272`、`first-bootstrap.ts:548`
- **问题**：`bootstrapFirstRuntime` 写完所有 runtime assets 后调用 `refreshFirstDocsFromRuntime`，后者链式调用 `loadProjectionContext` → `loadFirstContext` → `ensureHealthyRuntimeAsset`（5 个 assert）。若任何 runtime 文件写入不完整（未抛出但内容损坏），`ensureHealthyRuntimeAsset` 会抛出，bootstrap 失败，已写文件不回滚，留下脏状态且无任何清理逻辑。

### M12 — `readFirstRuntimeIndex` 在单次 skill 分发中被重复调用 10-15 次

- **当前状态（2026-03-17）**：**仍成立**

- **位置**：`context-resolver.ts:335-378`（`hasHealthy*` 系列，各独立读一次）、`context-resolver.ts:512-558`（`readRuntimeAssetSnapshot` 内额外调用 3 次）
- **问题**：`resolveSkillContext` 一次调用中，`readFirstRuntimeIndex`（同步磁盘 `readFileSync` + `JSON.parse`）被执行 10-15 次，结果不缓存。dispatcher 的每次 skill 分发都会触发，对 IO 造成无谓压力。

---

## 🟡 低优先级（8 项）

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| L1 | `canSkipConfirm` 价值较低，保留意义有限 | `first-resume.ts:131-146` | 当前更多只是命令展示层的小包装，不再适合表述成“永远返回 true” |
| L2 | `renderDatabaseErDoc` 非 healthy 分支是死代码 | `first-doc-projection.ts:487` | `shouldGenerate` 为 false 时走 `rmSync` 路径，永远不会到该 return |
| L3 | `endsWith` 路由无唯一性保障（隐式约束未文档化） | `first-doc-projection.ts:752-820` | 若未来新增同名不同路径文档，路由会错误匹配 |
| L4 | `shouldConfirmFirst` catch 块吞掉非法参数返回 false | `first-args.ts:222-228` | 参数非法时应报错而非静默返回"不需确认" |
| L5 | `detectModules` 截断 8 个无任何告警 | `first-bootstrap.ts:157` | 大型 monorepo 关键模块可能被截断，`risks` 字段中未标注 |
| L6 | `buildFirstRuntimeNotice` 双重调用 `checkFirstUpdateContext` | `dispatcher.ts:773-803` | `generateResumeRecommendation` 和直接调用各一次，git 命令重复执行 |
| L7 | `getCurrentSourceCommit` 两处返回类型不一致 | `first-bootstrap.ts:411` vs `first-context.ts:235` | 一处返回 `string \| undefined`，一处返回 `string \| null`，风格不统一 |
| L8 | SKILL.md `{{DATE}}` 占位符未渲染 | `SKILL.md:5` | 文件头显示字面值 `{{DATE}}`，版本可追溯性受影响 |

---

## SKILL.md 专项审查

### 确认策略描述与代码行为存在偏差（中）

- **当前状态（2026-03-17）**：**部分成立**

- **位置**：`SKILL.md:102-104`
- **问题**：SKILL.md 声明 `confirm_policy: assisted`，描述"发现已有 index.json 时，展示变更摘要后再更新"。但代码中 `resolveFirstConfirmPolicy` 只要有 `--auto/--force/--skip` 就跳过确认，并不区分"是否已有 index.json"。实际 CLI 流程（`first.ts:92-125`）没有"展示摘要后等待用户确认"的交互步骤，assisted 确认逻辑仅通过 `buildFirstRuntimeNotice` 注入到 prompt 前缀中，但这个注入基于 `resume.hasExistingProducts` 而非 index.json 存在性，存在语义错位。

### 步骤描述与代码执行路径不精确（低）

- **当前状态（2026-03-17）**：**已被后续改造削弱**

- **位置**：`SKILL.md:76-82`
- **问题**：SKILL.md 列出的 5 个步骤中，步骤 2"识别项目类型"已全部封装在 `bootstrapFirstRuntime` 内部自动完成，AI 无需手动执行。可能导致 agent 错误理解"需要手动调用检测"，产生重复操作。

### 证据格式约束缺少降级路径（低）

- **当前状态（2026-03-17）**：**已被后续改造削弱**

- **位置**：`SKILL.md:93-98`
- **问题**：要求证据格式为 `` `<file_path>:<line>` `` 且"核心结论 100% 覆盖"，但未说明证据不足时的处理策略（停止？标 `[待确认]`？）。规则本身存在但执行路径不完整，实际 bootstrap 生成的 runtime assets 内容格式也与此要求不一致。

---

## 修复优先级建议

> 复核后建议按“当前仍成立的问题”排序，不再优先处理已经被后续改造明显削弱的条目。

### 立即修复（影响数据一致性）

1. **H1 + H2**：为 `bootstrapFirstRuntime` 和 `rewriteRuntimeArtifacts` 增加写入完整性保障（临时文件 + rename，或写入后校验 + 标记）
2. **M1**：为 `normalizeCanonicalRuntimeIndex` 中的 `summary`/`roleViews`/`stageViews` 增加 synthetic fallback
3. **M2**：为 `docsProjection` 增加 `?? {}` 的 synthetic fallback

### 近期修复（影响功能正确性）

4. **M8**：`syncBackgroundInputStatus` 改为通过 CLI 状态接口或增加内部 bypass 标记，避免直接写 `stage-state.json`
5. **M4**：`collectProjectCognitionChangedFiles` 增加"工作区干净且最后提交无关"的过滤逻辑
6. **M9**：`generateResumeRecommendation` 中 `commitMismatch` 补全实际 commit 比较逻辑
7. **M5**：`--update` 参数添加未实现提示，或与 runtime artifact 名称映射对齐

### 可延后优化（一致性/性能）

8. **M12**：`context-resolver.ts` 中 `readFirstRuntimeIndex` 增加请求级缓存（模块级 Map + TTL 或参数传递 snapshot）
9. **M3**：`buildBootstrapDatabaseSchema` 的 `healthy` 改为仅在能解析出有效 table 时为 true，否则降级为 `degraded`
10. **M6**：`validateFirstArgs` 增加互斥参数组合校验并给出友好错误提示
11. **L1**：删除 `canSkipConfirm` 无效函数
12. **L6**：`buildFirstRuntimeNotice` 消除重复的 `checkFirstUpdateContext` 调用

---

## 问题补充优化方案

### 一、优化原则

后续修复不应继续按单点 case-by-case 打补丁，而应围绕 4 个根因统一收口：

1. **写入链没有事务边界**
2. **index contract 不够自描述**
3. **参数协议与 CLI 行为脱节**
4. **governance / notice / resolver 存在重复计算与旁路写入**

换句话说，最佳方案不是“把 22 个问题逐条修完”，而是把这些问题压缩成少量架构性改造。

### 二、建议的统一改造方向

#### 2.1 写入链事务化

针对 `H1`、`H2`、`M11`，建议一次性引入“临时目录 + 完整性校验 + 原子切换”的写入模型：

1. 先在临时目录写完整 runtime assets
2. 对每个 JSON 做 schema 级最小校验
3. 完整投影 docs
4. 最后一次性写最终 `index.json`
5. 成功后再原子切换到正式目录

目标：
- 不再出现“半套 runtime + 空 docsProjection index”的中间态
- bootstrap 与 rewrite 共用同一套安全写入框架

#### 2.2 index contract 显式化

针对 `M1`、`M2`，建议不要继续零散补 fallback，而是统一改成：

1. `summary/roleViews/stageViews/docsProjection` 全部具备 synthetic fallback
2. `status` 拆成两层：
   - `runtimeStatus`
   - `projectionStatus`
3. `overallStatus` 由二者合成

目标：
- runtime 健康但 docs 缺失时，不再伪装成单一 `current`
- 旧 index 兼容策略一次性收口

#### 2.3 参数协议与 CLI 行为对齐

针对 `M5`、`M6`、`M7`、`L4`，建议统一做一次“参数协议收口”：

1. `--update` 若未实现，则显式报错，不允许静默忽略
2. 增加互斥组合校验：
   - `--skip + --update`
   - `--check-health + --force`
   - `--skip + --force`
3. 将“确认策略”和“执行模式”拆开：
   - `confirmPolicy`
   - `executionMode`
4. `shouldConfirmFirst()` 不再吞掉非法参数

目标：
- 参数解释与 CLI 实际行为一一对应
- 不再让调用方猜测哪个参数最终生效

#### 2.4 背景状态同步回归状态机

针对 `M8`，建议停止直接写 `stage-state.json`，改成：

1. 增加内部专用状态更新接口
2. 统一走 stage-state schema 校验
3. 写入时带 `source: system-sync`

目标：
- 保留自动同步能力
- 不再绕过状态机与审计边界

#### 2.5 governance / notice 去重

针对 `M4`、`M9`、`M10`、`M12`、`L6`，建议统一抽象成“请求级 snapshot + 单次 change analysis”：

1. 单次请求只读一次 runtime index
2. `generateResumeRecommendation` 与 `buildFirstRuntimeNotice` 共享同一个 change snapshot
3. `commitMismatch` 直接复用已有检测结果
4. `HEAD~10` 兜底改成显式策略：
   - 无 `sourceCommit` 时给出 `unknown` 状态
   - 由上层决定保守 full 还是提示用户

目标：
- 去掉重复 git / IO
- 降低误判与隐藏默认值

#### 2.6 条件型数据库能力收口

针对 `M3`、`L2`，建议统一收口成：

1. 仅在可解析出有效 table / relation 时标记 `healthy`
2. 文件存在但无法解析时标记 `degraded`
3. `renderDatabaseErDoc` 非 healthy 分支死代码删除

目标：
- 条件型能力的三态语义真正落地
- 不再出现“占位内容 + healthy 状态”

### 三、建议实施顺序

推荐拆成 4 个小批次，而不是继续大范围混改：

#### Batch A：写入安全

- H1
- H2
- M11

验收：
- bootstrap 中途失败不污染正式 runtime 目录
- rewrite 中途失败不留下半写状态

#### Batch B：index 与参数协议

- M1
- M2
- M5
- M6
- M7
- L4

验收：
- 旧 index 不崩
- `--update` 不再静默忽略
- 互斥参数有明确错误提示

#### Batch C：治理与状态同步

- M4
- M8
- M9
- M10
- M12
- L6

验收：
- 单次 notice 不重复跑相同 change analysis
- `backgroundInputStatus` 不再旁路写文件

#### Batch D：条件型数据库与清理项

- M3
- L2
- L1
- L5
- L7
- L8

验收：
- `databaseSchema` 三态真实可信
- 文档与代码的低级残留项清掉

### 四、最小验收标准

完成以上优化后，至少应满足：

1. bootstrap / rewrite 任意一步失败，不会污染正式 runtime 真源
2. `readFirstRuntimeIndex()` 对旧 index 输入稳定可用
3. 所有 first 参数要么生效，要么报错，不允许静默忽略
4. `stage-state.json` 的自动同步不再绕过状态机
5. 单次 skill 分发中，runtime index / git 变更分析不再重复计算
6. 条件型数据库能力不会再输出虚假 `healthy`

### 五、当前建议

如果只选一个最高收益改造点，优先做：

**Batch A：写入安全**

原因：
- 它同时解决 `H1/H2/M11`
- 是当前唯一仍然可能污染 canonical truth 的根问题
- 其他大部分问题即使存在，也更多影响体验、性能或语义清晰度，不会像写入中断那样直接破坏真源
