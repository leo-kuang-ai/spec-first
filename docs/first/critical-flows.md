# Spec-First 关键流程文档

> 生成时间: 2026-03-25
> 数据源: `.spec-first/runtime/first/critical-flows.json`

本文档描述 Spec-First 系统的 8 个关键流程，涵盖从 CLI 入口到追溯 ID 生成的完整链路。

---

## 1. CLI 命令路由流程

**描述**: CLI 命令入口到执行的完整路由流程

**入口点**: `src/cli/index.ts:95` - `dispatch(process.argv.slice(2))`

### 关键步骤

```
1. 入口 index.ts 调用 dispatch(args)
2. router.ts:dispatch 解析首个参数作为命令名
3. 从 commands Map 查找命令注册项
4. 验证参数 validateArgs(subArgs)
5. 检查确认策略 shouldRequireConfirmation()
6. 调用 handler(subArgs) 执行命令
7. 返回 ExitCode
```

### 风险点

- 命令参数解析错误
- 确认策略绕过
- 未捕获异常导致进程退出码错误

### 证据文件

- `src/cli/index.ts:95-96`
- `src/cli/router.ts:78-121`
- `src/cli/router.ts:30-42`

---

## 2. Feature 初始化流程

**描述**: Feature 初始化流程：检测状态 → 轨道分发 → 核心初始化 → 原子提交

**入口点**: `src/cli/commands/init.ts:612` - `handleInit(args)`

### 关键步骤

```
1. handleInit 检测项目状态 detectInitProjectState()
2. 判断初始化轨道 detectInitTrack()
3. 根据轨道分发：project-onboarding / brownfield-baseline / feature-init
4. feature-init 轨道：parseInitCliInput() 解析参数
5. summarizeFirstArtifacts() 检查 00-first 状态
6. resolveInitCliInput() 交互式或自动解析输入
7. ensureLayer2PlatformTemplates() 创建平台模板
8. 调用 process-engine/init.ts:init() 核心初始化
9. init(): validateFeat -> resolveFeatureInitTargets -> writeFeatureSkeleton
10. commitFeatureInit() 原子提交
11. runPostInitSetup() 后置设置
12. 返回 featureId 和 featureDir
```

### 风险点

- Feature ID 冲突（并发初始化同缩写）
- 目录权限问题
- stage-state.json 写入失败导致状态不一致

### 证据文件

- `src/cli/commands/init.ts:612-638`
- `src/cli/commands/init.ts:758-830`
- `src/core/process-engine/init.ts:928-982`

---

## 3. Stage 推进流程

**描述**: 阶段推进流程：加载状态 → 检查就绪 → 应用转换 → 持久化

**入口点**: `src/cli/commands/transition.ts:9` - `handleTransition(args)`

### 关键步骤

```
1. handleTransition 解析子命令 (cancel / featureId)
2. 若为 cancel: 调用 cancel(featureId, projectRoot, reason)
3. 若为 advance: 调用 advance(featureId, projectRoot)
4. advance(): loadState() 加载当前状态
5. isTerminal() 检查是否终态
6. getNextStage() 获取下一阶段
7. checkReadiness() 检查节点就绪状态
8. applyTransition() 应用状态转换
9. saveState() 持久化新状态
10. 若终态则清理 .spec-first/current
11. 返回 AdvanceResult {from, to, gateResult}
```

### 风险点

- Gate 条件评估失败阻断推进
- 状态机转换违反单向不可逆原则
- 并发推进导致状态竞争

### 证据文件

- `src/cli/commands/transition.ts:9-45`
- `src/core/process-engine/advance.ts:59-100`
- `src/core/process-engine/readiness-check.ts:40-112`
- `src/core/process-engine/transition.ts:13-58`
- `src/core/process-engine/stage-machine.ts:7-16`

---

## 4. Gate 校验流程

**描述**: Gate 质量门禁评估：读取条件 → 逐条评估 → 汇总结果 → 持久化

**入口点**: `src/cli/commands/gate.ts:71` - `handleCheck(args)`

### 关键步骤

```
1. handleCheck 解析 featureId 和选项
2. 调用 evaluateGate(featureId, cwd, options)
3. evaluateGate(): 读取 stage-state.json
4. getProjectTypeFromConstitution() 获取项目类型
5. getConditions(stage, projectType, profile) 获取条件定义
6. 遍历条件执行 def.evaluate(ctx)
7. 处理 L2 层自定义命令门禁 runCommandGate()
8. 汇总结果：hasBlockingFailure / hasWarning
9. 生成 GateResult {status, conditions, suggestions}
10. 持久化到 gate-history.jsonl
11. 返回结果，CLI 格式化输出
```

### 风险点

- 条件定义缺失或格式错误
- Layer2 命令执行超时/失败
- waiver 豁免机制滥用
- 评估结果与实际产物不一致

### 证据文件

- `src/cli/commands/gate.ts:71-151`
- `src/core/gate-engine/gate-evaluator.ts:57-133`
- `src/core/gate-engine/gate-evaluator.ts:30-51`
- `src/core/gate-engine/condition-registry.ts`
- `src/core/gate-engine/command-gate.ts:294-297`

---

## 5. Skill 分发流程

**描述**: Skill 分发三层路由：语义映射 → 运行时命令 → Skill 文件

**入口点**: `src/core/skill-runtime/dispatcher.ts:260` - `dispatchCommand(input, projectRoot)`

### 关键步骤

```
1. dispatchCommand 解析输入为 skillName + args
2. 检查 REMOVED_SKILLS 列表
3. 查找 SEMANTIC_MAP 复合命令映射 (如 rfc approve)
4. 若命中语义映射，返回 runtime 路由 + 转换参数
5. 检查 RUNTIME_COMMANDS 集合 (id/docs/stage/rfc/defect/metrics/gate/golive/ai/commit/feature)
6. 若命中运行时命令，返回 runtime 路由
7. 调用 resolveSkillPath(skillName, projectRoot) 查找 SKILL.md
8. 搜索顺序：项目本地 skills/ -> 包级 skills/
9. 验证层参数 validateLayerArgs()
10. 若为 orchestrate，解析额外参数和后台引导
11. 返回 DispatchResult {route, skillName, args, skillPath}
```

### 风险点

- Skill 路径解析失败
- 层参数校验不通过
- 语义映射参数转换错误

### 证据文件

- `src/core/skill-runtime/dispatcher.ts:260-344`
- `src/core/skill-runtime/dispatcher.ts:73-79`
- `src/core/skill-runtime/dispatcher.ts:82-94`
- `src/core/skill-runtime/dispatcher.ts:350-375`

---

## 6. Skill 渲染流程

**描述**: Skill prompt 加载与渲染：读取模板 → 解析上下文 → 组装提示 → 验证稳定性

**入口点**: `src/core/skill-runtime/dispatcher.ts:419` - `loadSkill(skillPath, options)`

### 关键步骤

```
1. loadSkill 读取 SKILL.md 模板
2. resolvePromptAssemblyContext() 解析上下文
3. assemblePrompt() 替换 {{PLACEHOLDER}} 占位符
4. validateKvCacheStability() 检查 KV 缓存稳定性
5. evaluateRuntimeScopeGuard() 评估作用域守卫
6. buildSafetyNotice() 构建安全提示
7. 根据 skillName 注入运行时提示 (first/orchestrate/spec/design/task/code/review/plan/verify 等)
8. 拼接所有提示到内容头部
9. 返回完整渲染后的 Skill 内容
```

### 风险点

- Prompt token 超出预算
- 动态字段位置影响 KV-Cache 命中率
- 占位符解析失败

### 证据文件

- `src/core/skill-runtime/dispatcher.ts:419-570`
- `src/core/skill-runtime/prompt-assembler.ts:177-184`
- `src/core/skill-runtime/context-resolver.ts`

---

## 7. 追溯 ID 生成流程

**描述**: 追溯 ID 生成流程：验证缩写 → 收集已有 ID → 计算序号 → 组装 ID

**入口点**: `src/core/trace-engine/id-generator.ts` - `nextId(options)`

### 关键步骤

```
1. nextId() 接收 {abbr, featureId, projectRoot, type, tcLevel}
2. validateAbbr() 验证缩写有效性
3. collectKnownIds() 收集已存在的 ID
4. findNextSeq() 查找下一个序号
5. assembleId() 组装完整 ID (如 FR-FEAT-001)
6. 可选 reserveId() 预留 ID
7. 返回 NextIdResult {id, seq}
```

### 风险点

- 并发生成导致 ID 冲突
- ID 格式不符合规范
- 扫描大目录性能问题

### 证据文件

- `src/core/trace-engine/id-generator.ts`

---

## 8. 追溯上下文构建流程

**描述**: 追溯上下文构建：扫描产物 → 提取 ID → 构建关系图 → 分类行

**入口点**: `src/core/trace-engine/trace-context.ts` - `createTraceContext(featureId, projectRoot)`

### 关键步骤

```
1. createTraceContext() 扫描 specs/{featureId}/ 下所有文件
2. 解析 FR/DS/TASK/TC 行，提取 ID 和描述
3. buildLineage() 构建上下游关系图
4. 分类为主链行 (FR/DS/TASK/TC)、补充行、未追踪行
5. 返回 TraceContext {rows, frIds, lineage, mainChainRows, ...}
```

### 风险点

- 文件解析失败
- 关系图构建循环依赖
- 未追踪行过多影响覆盖率

### 证据文件

- `src/core/trace-engine/trace-context.ts`
- `src/core/trace-engine/upstream-lineage.ts`
- `src/core/trace-engine/relationship-graph.ts`

---

## 调用链速查表

| 流程 | 入口 | 核心调用链 |
|------|------|-----------|
| CLI 路由 | `src/cli/index.ts:95` | `dispatch()` → `router.ts:78` → `handler()` |
| Feature 初始化 | `src/cli/commands/init.ts:612` | `handleInit()` → `runFeatureInitTrack()` → `init()` → `writeFeatureSkeleton()` → `commitFeatureInit()` |
| Stage 推进 | `src/cli/commands/transition.ts:24` | `handleTransition()` → `advance()` → `loadState()` → `checkReadiness()` → `applyTransition()` → `saveState()` |
| Gate 评估 | `src/cli/commands/gate.ts:71` | `handleCheck()` → `evaluateGate()` → `getConditions()` → `def.evaluate()` → `runCommandGate()` |
| Skill 分发 | `src/core/skill-runtime/dispatcher.ts:260` | `dispatchCommand()` → `resolveSkillPath()` → `loadSkill()` → `assemblePrompt()` |

---

## 待分析区域 (Gaps)

| 区域 | 描述 | 建议操作 |
|------|------|----------|
| change-mgr | RFC/Defect 状态机流程未详细分析 | 查看 `src/core/change-mgr/rfc-machine.ts` 和 `defect-machine.ts` |
| batch-executor | 批量执行流程未分析 | 查看 `src/core/batch-executor/index.ts` |
| migrations | 状态文件迁移流程未分析 | 查看 `src/core/migrations/manifest-engine.ts` |
