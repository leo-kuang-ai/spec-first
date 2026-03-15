# Phase 2：安全性 & 性能评审

> 评审日期：2026-03-16 | 目标：13-项目认知 First Skill 项目认知编译器

---

## Phase 2A：安全漏洞评估（18 项）

### 🔴 Critical（3 项）

#### SEC-C01 · Canon Poisoning：Writeback 链路缺乏内容语义校验
- **位置**：cognition diff analyzer → CognitionUpdateClassifier → canonical truth 写入
- **CVSS 向量（本地）**：AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H
- **问题**：AI Agent 在 wrap_up 阶段输出语义错误但格式合法的内容（如误将 `any` 类型列为"允许"），通过哈希对比检测后静默写入 conventions.json，污染后续所有 Skill 的认知基线，雪崩式传播，无自动回滚
- **缓解**：
  1. 写入前执行语义一致性检查（新条目不得与现有 forbiddenPatterns 直接矛盾）
  2. 所有 OVERWRITE 操作保留 diff snapshot（{timestamp}-{sha256前8位}.json）
  3. 架构级：AI Agent 输出降级为"候选提案"（propose-only），CLI 执行最终确认写入
  4. 连续 N 次写入同一字段触发人工确认（N=3，时间窗口 24h）

#### SEC-C02 · 非原子写入：文件中间状态可被并发读取
- **位置**：所有 canonical truth JSON 文件的写入路径
- **问题**：`fs.writeFile` 非原子；场景A：并发读时读到半截 JSON；场景B：进程崩溃留残留文件；场景C：TOCTOU 导致后写覆盖先写的合法更新
- **缓解**：
  ```
  必须实现原子写入：
  write(tmpFile) → fsync(tmpFile) → rename(tmpFile, targetFile)
  rename() 在 POSIX 系统是原子操作
  同时引入 advisory lock（proper-lockfile，超时 30s）
  ```

#### SEC-C03 · conventions extractor 无循环符号链接防护，进程挂起
- **位置**：conventions extractor 静态分析阶段
- **问题**：`node_modules`（pnpm virtual store 模式）含大量符号链接，无限递归导致堆栈溢出或 OOM；若链接指向 `/etc`、`~/.ssh` 等，可能读取敏感文件
- **缓解**：
  - 跟踪已访问 realpath Set 检测循环
  - 硬性排除：node_modules/ .git/ dist/ coverage/ .spec-first/
  - 文件大小上限 1MB、最大遍历深度 15 层
  - 文件类型白名单（通过 magic bytes 而非扩展名）

---

### 🟠 High（5 项）

| ID | 问题 | 缓解方案 |
|----|------|---------|
| SEC-H01 | JSONL 并发写入数据交错（字节级交错破坏整个日志） | 串行写入队列（链式 Promise）或 O_APPEND + advisory lock |
| SEC-H02 | rollback 命令无确认步骤，误操作不可逆 | 执行前显示 diff 摘要 + 交互确认 + rollback 前自动快照 + --target 必填 |
| SEC-H03 | evidence / readFirst 字段未做路径净化，路径遍历风险 | path.resolve() + 边界校验；evidence 字段语义与文件路径严格分离 |
| SEC-H04 | .spec-first/runtime/ 被替换为符号链接导致写入重定向 | 启动时 realpath 校验 + 写入前 lstat() 检测符号链接 + 目录权限 0o700 |
| SEC-H05 | canonical truth 意外提交公共仓库暴露架构敏感信息 | init 时自动写入 .gitignore + 启动时检测 + 提供 security scan 子命令 |

---

### 🟡 Medium（7 项）

| ID | 问题 | 缓解方案 |
|----|------|---------|
| SEC-M01 | 无 JSON Schema 校验，格式错误导致 Skill 全部崩溃 | Zod Schema 写入前 parse，读取时 safeParse，失败降级到快照 |
| SEC-M02 | JSONL 字段无长度限制，磁盘耗尽风险 | reason ≤500 字符，evidence ≤2000 字符，日志轮转策略 |
| SEC-M03 | 快照目录（结合循环更新风险）无限增长 | GC 机制：保留最近 50 个 + 每日里程碑 + 去重（内容相同跳过）|
| SEC-M04 | 多 Feature 并发 wrap_up 写入竞争无仲裁（静默覆盖） | 乐观锁（OCC）+ 全局写入队列 + 字段级冲突检测 |
| SEC-M05 | candidates dismiss 无操作日志与操作者记录 | --reason 必填 + 追加审计日志 + 驳回冷却期（7 天内不再提议）|
| SEC-M06 | extractor 处理二进制文件触发正则回溯爆炸（ReDoS） | magic bytes 检测 + safe-regex 工具验证正则 + 单文件 5 秒超时 |
| SEC-M07 | needs_decision 积压无 TTL，无限累积 | 每条记录携带 TTL（默认 30d）+ Feature done/cancelled 时自动归档 |

### 🔵 Low（3 项）

| ID | 问题 |
|----|------|
| SEC-L01 | evidence 字段可能包含 API Key 等敏感字符串，写入审计日志后扩散 |
| SEC-L02 | 快照文件名使用本地时间戳，跨时区排序混乱 → 改为 UTC + 单调递增序号 |
| SEC-L03 | rollback/dismiss 的 --help 未标注 [DESTRUCTIVE]，未提供 --dry-run 模式 |

---

## Phase 2B：性能与可扩展性分析（12 项）

### 🔴 Critical（3 项）

#### PERF-C01 · conventions extractor 全量 AST 解析——无界资源消耗

| 项目规模 | 代码量 | 解析耗时 | 峰值内存 |
|---------|--------|---------|---------|
| 小型 | 1万行 | 2-5秒 | 200-400MB |
| 中型 | 10万行 | 30-90秒 | 1.5-3GB |
| 大型 | 100万行 | 10-30分钟 | 8-16GB（OOM） |

- **问题**：TypeScript Compiler API 全量加载，Node.js V8 默认堆 ~1.5GB，大型项目必触发 OOM
- **必须实现**：
  1. **分批解析**：单批次 ≤500 文件/50000 行，每批释放 Program 对象
  2. **增量解析**：基于 `git diff --name-only` 仅扫描变更文件，结果 merge-patch 到现有 conventions
  3. **资源保护**：硬超时 + NODE_OPTIONS 内存限制 + 降级采样模式

#### PERF-C02 · 无进程内缓存——每次 Skill 调用触发 4 次冗余 I/O

| 文件大小 | 单次 Skill I/O | 10-Skill orchestrate batch |
|---------|---------------|--------------------------|
| 各 50KB | 8-15ms | 80-150ms |
| 各 500KB | 40-80ms | 400-800ms |
| conventions 2MB | 150-300ms | **1.5-3 秒（不可接受）** |

- **必须实现**：Module-level singleton cache（mtime + size 双重校验），跨 Skill 调用共享
- **进程间缓存**：schema-manifest.json + MessagePack 序列化（比 JSON.parse 快 3-5x）

#### PERF-C03 · conventions.json 体积失控——context window 溢出

- **估算**：100万行项目 ~390 条约定 × 平均500字符 = ~500KB，加上其他 context 极易超出模型 200K token 限制
- **必须实现**：
  1. **分层存储**：summary[]（默认注入）+ detail{}（按需懒加载）+ evidence_index（路径引用，不内嵌代码）
  2. **Context-aware 裁切**：按 Skill 类型过滤相关分类
  3. **硬性上限**：conventions.json ≤512KB；单次 Skill 注入 ≤16K tokens；evidence 每条 ≤3 样本 ≤10行

---

### 🟠 High（4 项）

| ID | 问题 | 影响 | 优化方案 |
|----|------|------|---------|
| PERF-H01 | 11个Skill并发消费无一致性快照，orchestrate期间发生writeback导致行为不一致 | 同批Skill基于不同版本认知数据执行 | Batch-scoped snapshot（batch启动时Pin 4个schema的sha256）|
| PERF-H02 | project-cognition-updates.jsonl 无界增长（估算3年~21MB，读取退化） | catchup/审计场景耗时线性增长 | 滚动归档（1000条/5MB触发）+ 索引文件（最近100条） |
| PERF-H03 | cognition diff analyzer 对大型feature（500文件）同步对比阻塞 CLI（估算1-3秒）| CLI 卡顿 | worker_threads 异步化 + 优先级采样（仅对比高价值目录）+ 增量diff |
| PERF-H04 | docs projection refresh 串行渲染（20个docs × 50ms = 1秒）| writeback后刷新耗时 | 脏标记机制（只刷新受影响docs）+ 并行渲染（Promise.all）+ 渲染结果缓存 |

---

### 🟡 Medium（4 项）

| ID | 问题 | 优化建议 |
|----|------|---------|
| PERF-M01 | T04-T09 并行生成的实际收益有限（CPU密集型在单线程无效） | I/O任务用Promise.all；CPU密集型用worker_threads（约3x加速）|
| PERF-M02 | change-map 无过期检测，用户修改文件后Skill读取过期数据 | Skill调用前检测git diff变更数量，超阈值输出staleness警告 |
| PERF-M03 | 快照磁盘空间增长（每天10次writeback × 300KB = 每月90MB）| 差量快照（JSON Patch，节省95%空间）+ 自动清理策略 |
| PERF-M04 | 多Agent并行I/O争用（写-读一致性） | 原子写入（tmp→rename，与SEC-C02合并实现）|

### 🔵 Low（2 项）

| ID | 问题 |
|----|------|
| PERF-L01 | 哈希计算开销（改用 mtime+size 双重校验，<0.1ms vs sha256的~10ms）|
| PERF-L02 | skill-runtime/ 19文件的模块加载（<50ms，分层对性能无影响；tsup bundle可彻底消除）|

---

## Phase 2 对 Phase 3 的影响

以下发现将影响测试覆盖与文档完整性评审：

1. **测试优先级**：SEC-C01（Canon Poisoning）、SEC-C02（原子写入）、PERF-C01（资源限制）是最高优先级的测试用例
2. **缺失文档**：安全操作指南（如何安全配置 .gitignore、rollback 操作规范）
3. **API 文档需求**：schema 字段的安全约束（长度限制、路径净化规则）必须在 API 文档中说明
4. **性能测试缺失**：conventions extractor 的资源消耗测试（大型项目 benchmark）、Skill 注入 I/O 延迟测试
