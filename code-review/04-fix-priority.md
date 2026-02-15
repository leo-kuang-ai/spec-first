# 修复优先级与行动计划

> 基于审查报告 91 项问题，按业务影响和修复成本排列优先级

---

## P0 — 立即修复（安全 + 数据丢失）

> 预计影响：阻断发布，存在安全风险或数据丢失

| # | 问题 | 文件 | 修复复杂度 |
|---|------|------|-----------|
| H1 | 命令注入：commitSha 未校验 | `gate-engine/rollback.ts:45` | 低 |
| H2 | YAML schema 未限制 + 无运行时校验 | `process-engine/layer-merger.ts:7,157` | 低 |
| H3 | installHooks 覆写已有 hook | `tool-integration/hook-installer.ts:31-37` | 中 |
| H10 | timestamp spread 顺序错误 | `shared/logger.ts:12` | 低 |
| H11 | 日志归档同月覆盖 | `shared/logger.ts:40` | 低 |
| H12 | readLog JSONL 单行损坏全崩 | `shared/logger.ts:28` | 低 |
| H13 | readStats 同样的 JSONL 脆弱性 | `ai-orchestrator/ai-stats.ts:38` | 低 |
| H15 | phase-machine 归档非原子写入 | `skill-runtime/phase-machine.ts:107-116` | 中 |

**修复要点**:
1. `rollback.ts` — 添加 `/^[0-9a-f]{7,40}$/` 正则校验
2. `layer-merger.ts` — `yaml.load(raw, { schema: yaml.JSON_SCHEMA })` + 字段存在性检查
3. `hook-installer.ts` — 安装前检查已有 hook，备份后追加
4. `logger.ts` — 调换 spread 顺序；归档后缀加时间戳；readLog 逐行 try-catch
5. `ai-stats.ts` — readStats 逐行 try-catch
6. `phase-machine.ts` — 先写临时文件再 rename

---

## P1 — 尽快修复（逻辑正确性）

> 预计影响：功能行为不符合预期，但不造成安全风险

| # | 问题 | 文件 | 修复复杂度 |
|---|------|------|-----------|
| H4 | Exception 过滤 ID 类型不匹配 | `trace-engine/coverage.ts:25` | 中 |
| H5 | truthiness 阻止字段清空 | `trace-engine/matrix.ts:87-90` | 低 |
| H6 | Waiver 无语义匹配 | `gate-engine/gate-evaluator.ts:264` | 高 |
| H7 | 幂等检查返回不一致状态 | `process-engine/init.ts:189-192` | 低 |
| H8 | Level 2 降级分支不可达 | `ai-orchestrator/context-slicing.ts:52-61` | 中 |
| H9 | 空参数静默传递 | `skill-runtime/dispatcher.ts:65` | 低 |
| H14 | catchupLocks 内存泄漏 | `ai-orchestrator/catchup.ts:23` | 低 |
| H16 | 配置缓存不区分 projectRoot | `shared/config-schema.ts:36` | 中 |
| H17 | CLI 无全局错误边界 | `cli/index.ts:35-36` | 低 |

**修复要点**:
1. `coverage.ts` — 修正 Exception 过滤逻辑，匹配行的上游 FR 引用
2. `matrix.ts` — `if (updates.status)` → `if (updates.status !== undefined)`
3. `gate-evaluator.ts` — Gate 条件增加 scope/frId 关联字段，按语义匹配豁免
4. `init.ts` — 幂等路径读取已有 stage-state.json 参数计算 mergedRules
5. `context-slicing.ts` — 重新设计降级阈值逻辑
6. `dispatcher.ts` — 校验 `{0}` 占位符对应的参数是否存在
7. `catchup.ts` — 添加 TTL 清理过期锁
8. `config-schema.ts` — 以 projectRoot 为 key 的 Map 缓存
9. `index.ts` — 包裹 try-catch + `process.exit(UNKNOWN_ERROR)`

---

## P2 — 计划修复（健壮性 + 代码质量）

> 预计影响：提升可维护性和长期稳定性，不影响当前功能

### P2-A 架构改进（6 项）

| # | 问题 | 文件 | 修复复杂度 |
|---|------|------|-----------|
| L1 | Markdown 表格解析 4 处重复 | trace-engine 4 文件 | 中 |
| M1-M2 | 全局 `as Stage` → 枚举引用 | gate-engine + ai-orchestrator | 低 |
| M8 | config DEFAULTS 浅拷贝 | `config-schema.ts:44,52` | 低 |
| M4-M5 | unsafe `as unknown as Record` cast | health-score + bottleneck | 低 |
| L25 | 健康分权重与 config 不一致 | health-score vs config-schema | 低 |
| M37 | SliceConfig ratio 字段未使用 | `context-slicing.ts:9-14` | 低 |

### P2-B 健壮性加固（8 项）

| # | 问题 | 文件 |
|---|------|------|
| M11 | readFileSync 在 try 外 | `fs-utils.ts:9` |
| M12 | ensureDir TOCTOU 竞态 | `fs-utils.ts:36-39` |
| M13 | Gate 历史 JSONL 无容错 | `gate-evaluator.ts:313` |
| M14 | 单 Feature 损坏崩全列表 | `feature.ts:51` |
| M18 | 安全报告缺失默认 PASS | `golive.ts:59-60` |
| M19 | sed macOS/Linux 不兼容 | `hook-installer.ts:79` |
| M25 | defect 序号 TOCTOU 竞态 | `defect.ts:39-52` |
| M29 | updateMatrixRow N 次读写 | `sync.ts:50` |

### P2-C 代码清理（27 项 Low）

| 类别 | 数量 | 代表性问题 |
|------|------|-----------|
| 代码重复 | 6 | Markdown 表格解析 4 处重复、parseMatrixIds 2 处重复 |
| 命名语义 | 6 | SecuritySeverity→DefectSeverity、submitRfc→approveRfc |
| 边界处理 | 10 | parseInt 部分匹配、序号溢出、空集合返回 100%、日期时区 |
| 一致性 | 7 | Feature ID 本地时间 vs UTC、权重不一致、枚举 vs 字符串 |
| 其他 | 4 | toUpperCase 重复调用、O(n^2) 重复检测、import.meta.dirname 兼容性 |

---

## 修复工作量估算

| 优先级 | 问题数 | 涉及文件 | 估算改动行数 |
|--------|--------|----------|-------------|
| P0 | 8 | 5 | ~80 行 |
| P1 | 9 | 8 | ~150 行 |
| P2-A | 6 | 8 | ~120 行 |
| P2-B | 8 | 7 | ~100 行 |
| P2-C | 27 | 15+ | ~200 行 |
| **合计** | **58** | — | **~650 行** |

> 注：剩余 33 项 Medium/Low 未列入行动计划，属于"有则更好"级别，可在日常迭代中逐步消化。

---

## 建议执行顺序

```
P0（安全+数据丢失）
  ├─ H1  rollback 命令注入校验
  ├─ H2  YAML schema 限制 + 运行时校验
  ├─ H3  hook 安装前备份检查
  ├─ H10 logger timestamp 顺序
  ├─ H11 归档后缀加时间戳
  ├─ H12 readLog 逐行容错
  ├─ H13 readStats 逐行容错
  └─ H15 phase-machine 原子写入

P1（逻辑正确性）
  ├─ H17 CLI 全局 error boundary
  ├─ H5  matrix updateRow !== undefined
  ├─ H9  dispatcher 空参数校验
  ├─ H7  init 幂等检查读已有状态
  ├─ H14 catchupLocks TTL 清理
  ├─ H16 config 缓存按 projectRoot
  ├─ H4  coverage exception 过滤修正
  ├─ H8  context-slicing 降级逻辑重写
  └─ H6  waiver 语义匹配（最复杂）

P2（健壮性+质量）
  ├─ 抽取共享 Markdown 表格解析器
  ├─ 全局 as Stage → Stage.XXX
  ├─ config DEFAULTS structuredClone
  └─ 其余按模块逐步清理
```
