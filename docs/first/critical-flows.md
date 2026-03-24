# Spec-First 关键流程文档

> 生成时间: 2026-03-23
> 数据源: `.spec-first/runtime/first/critical-flows.json`

本文档描述 Spec-First 系统的 7 个关键流程，涵盖从 CLI 入口到自动循环执行的完整链路。

---

## 1. Feature 初始化流程 (feature-initialization)

**描述**: Feature 初始化流程：生成 ID → 创建目录结构 → 渲染状态 → 初始化骨架文件

**入口点**: `src/cli/commands/init.ts:handleInit`

### 关键步骤

```
1. CLI 参数解析 (--feat, --mode, --size, --platforms)
2. detectInitProjectState() 检测项目成熟度
3. generateFeatureId() 生成 Feature ID (FSREQ-YYYYMMDD-FEAT-NNN)
4. init() 创建 specs/{featureId}/ 目录
5. renderDefaultConfigYaml() 渲染 .spec-first/meta/config.yaml
6. mergeLayerRules() 合并层级规则
7. writeJson() 写入 stage-state.json
8. writeMarkdown() 创建骨架文件 (spec.md, constitution.md)
9. switchFeature() 更新 .spec-first/current
```

### 风险点

- Feature ID 冲突（并发初始化同缩写）
- 目录权限问题
- stage-state.json 写入失败导致状态不一致

### 证据文件

- `src/cli/commands/init.ts`
- `src/core/process-engine/init.ts`
- `src/core/process-engine/feature.ts`
- `src/core/process-engine/layer-merger.ts`

---

## 2. 阶段推进流程 (stage-advance)

**描述**: 阶段推进流程：依赖检查 → Gate 校验 → 状态更新 → 审计日志

**入口点**: `src/core/process-engine/advance.ts:advance`

### 关键步骤

```
1. loadState() 读取 stage-state.json
2. isTerminal() 检查是否终态
3. nextStageInChain() 获取下一阶段
4. assertTransitionAllowed() 校验状态机转换合法性
5. checkDependencies() 验证目标阶段产物依赖
6. evaluateGate() 执行 Gate 条件评估 (Layer1 内置 + Layer2 命令)
7. saveState() 更新 stage-state.json
8. writeLog() 记录 gate-history.jsonl
9. [02_design→03_plan] syncAgentContextFromDesign() 同步上下文
10. [07_release] 自动推进到 08_done
```

### 风险点

- Gate 条件评估失败阻断推进
- GateEngine 不可用时需 pilot_mode 降级
- 状态机转换违反单向不可逆原则
- 并发推进导致状态竞争

### 证据文件

- `src/core/process-engine/advance.ts`
- `src/core/process-engine/stage-machine.ts`
- `src/core/gate-engine/gate-evaluator.ts`
- `src/core/process-engine/dependency-checker.ts`

---

## 3. Gate 质量门禁评估 (gate-evaluation)

**描述**: Gate 质量门禁评估：读取条件定义 → 逐条评估 → 聚合结果 → 持久化

**入口点**: `src/core/gate-engine/gate-evaluator.ts:evaluateGate`

### 关键步骤

```
1. readJsonChecked() 读取 stage-state.json
2. getProjectTypeFromConstitution() 从 constitution.md 提取项目类型
3. getConditions() 获取当前阶段 Gate 条件 (GATE_CONDITIONS registry)
4. shouldSkipCondition() 按项目类型过滤条件
5. 遍历条件: def.evaluate(ctx) 执行评估
6. runCommandGate() 执行 Layer2 命令条件
7. 聚合结果: hasBlockingFailure / hasWarning
8. appendJsonl() 持久化到 gate-history.jsonl
```

### 风险点

- 条件定义缺失或格式错误
- Layer2 命令执行超时/失败
- waiver 豁免机制滥用
- 评估结果与实际产物不一致

### 证据文件

- `src/core/gate-engine/gate-evaluator.ts`
- `src/core/gate-engine/condition-registry.ts`
- `src/core/gate-engine/command-gate.ts`

---

## 4. 追溯 ID 生成流程 (trace-id-generation)

**描述**: 追溯 ID 生成流程：扫描已有 ID → 计算序号 → 组装 ID → 预留登记

**入口点**: `src/core/trace-engine/id-generator.ts:nextId`

### 关键步骤

```
1. withFileLock() 获取文件锁 (.id.lock)
2. validateAbbr() 校验缩写格式
3. collectKnownIds() 扫描 specs/{featureId}/ 下所有 .md/.yaml/.json
4. ID_SCAN_PATTERN 正则匹配已有 ID
5. validateId() 校验已有 ID 有效性
6. findNextSeq() 计算下一序号
7. assembleId() 组装 ID (TYPE-ABBR-NNN 或 TC-LEVEL-ABBR-NNN)
8. validateId() 校验生成 ID
9. reserveId() 写入 .id-reservations.json
```

### 风险点

- 并发生成导致 ID 冲突（通过文件锁缓解）
- ID 格式不符合规范
- 扫描大目录性能问题
- 预留文件损坏

### 证据文件

- `src/core/trace-engine/id-generator.ts`
- `src/core/trace-engine/id-validator.ts`
- `src/core/trace-engine/id-taxonomy.ts`

---

## 5. Skill 执行流程 (skill-execution)

**描述**: Skill 执行流程：解析上下文 → 组装 Prompt → 分发执行 → 写入产物

**入口点**: `src/core/skill-runtime/prompt-assembler.ts:assemblePrompt`

### 关键步骤

```
1. resolvePromptAssemblyContext() 解析执行上下文
2. resolveExecutionFeatureId() 获取当前 Feature ID
3. loadConfig() 读取配置 (token_budget, max_iterations)
4. readCurrentStage() / readCurrentTask() 读取当前状态
5. assemblePrompt() 替换模板占位符
6. validateKvCacheStability() 检查 KV-Cache 稳定性
7. [待确认] 分发到 AI Host 执行
8. [待确认] idempotentWrite() 写入产物
```

### 风险点

- Prompt token 超出预算
- 动态字段位置影响 KV-Cache 命中率
- Feature ID 解析失败
- 产物写入冲突

### 证据文件

- `src/core/skill-runtime/prompt-assembler.ts`
- `src/core/skill-runtime/execution-context.ts`
- `src/core/skill-runtime/idempotent-write.ts`

---

## 6. Auto-Loop 自动循环 (auto-loop)

**描述**: Auto-Loop 自动循环：pick 任务 → 执行 → checkpoint → 迭代

**入口点**: `src/core/ai-orchestrator/auto-loop.ts:runAutoLoop`

### 关键步骤

```
1. loadTodoState() 加载 todo-state.json
2. recoverInterruptedTasks() 恢复中断任务（P9）
3. ensureAutoLoopState() 初始化运行态
4. while (iteration < maxIterations) 主循环
5. pickReadyTodos() 选择就绪任务
6. updateHeartbeat() 更新心跳
7. executor() 执行任务
8. runFullCompletionDetection() 完成度检测
9. runSlopCheck() 质量检测
10. makeRetryDecision() 重试决策
11. saveTodoState() 保存 checkpoint
12. runWatchdogCheck() 看门狗检查
```

### 风险点

- 任务死锁/阻塞
- 无限重试循环
- 看门狗超时误判
- 状态文件损坏导致恢复失败

### 证据文件

- `src/core/ai-orchestrator/auto-loop.ts`
- `src/core/ai-orchestrator/todo-runner.ts`
- `src/core/ai-orchestrator/watchdog.ts`
- `src/core/ai-orchestrator/retry-controller.ts`

---

## 7. CLI 命令路由 (cli-routing)

**描述**: CLI 命令路由：解析参数 → 查找命令 → 确认策略 → 分发执行

**入口点**: `src/cli/router.ts:dispatch`

### 关键步骤

```
1. process.argv.slice(2) 获取命令参数
2. commands.get(cmd) 查找注册命令
3. shouldRequireConfirmation() 检查是否需要确认
4. resolveConfirmPolicy() 解析确认策略
5. [需确认] 检查 --yes 标志
6. entry.handler(subArgs) 执行命令处理器
7. 返回 ExitCode
```

### 风险点

- 命令参数解析错误
- 确认策略绕过
- 未捕获异常导致进程退出码错误

### 证据文件

- `src/cli/router.ts`
- `src/cli/index.ts`
- `src/core/skill-runtime/confirm-policy.ts`

---

## 待分析区域 (Gaps)

| 区域 | 描述 |
|------|------|
| skill-execution | Skill 分发到 AI Host 的具体调用链未完全确认，需查看 skill-runtime 完整路由逻辑 |
| auto-loop | TaskExecutor 具体实现由外部注入，实际执行路径依赖调用方 |
| change-mgr | RFC/Defect 状态机流程未详细分析，需查看 `change-mgr/rfc-machine.ts` 和 `defect-machine.ts` |
| batch-executor | 批量执行流程未分析，需查看 `batch-executor/index.ts` |
