# .full-review 审查结论校准报告

**审查日期**: 2026-03-15  
**审查对象**: `.full-review/00-scope.md`、`phase1a-quality-findings.md`、`phase1b-architecture-findings.md`、`01-quality-architecture.md`、`phase2a-security-findings.md`、`phase2b-performance-findings.md`、`02-security-performance.md`、`checkpoint-1-summary.md`  
**校准基线**: 当前工作区源码实现（`src/`、`tests/`、`README*`、`docs/07-用户文档/`）

---

## 1. 结论摘要

`.full-review` 中的结论不能直接作为当前项目的最终问题清单使用。

原因有三类：

1. **部分条目已经过时**  
   典型如 `batch-executor 未实现`、`Git 命令注入`、`路径遍历`，引用的代码形态与当前实现不一致。

2. **部分条目方向正确，但严重度偏高**  
   典型如 `07_release -> 08_done` 的递归推进、同步 I/O、缓存 TTL、文档统计不一致。

3. **部分条目属于通用改进建议，不应被写成 Critical 缺陷**  
   典型如 `缺少 ADR`、`缺少 Repository 抽象`、`StageState 过于复杂`、`Type branded types`。

因此，`.full-review` 更适合作为“初筛材料”，不适合作为“当前版本准确问题清单”。

---

## 2. 最终校准结果总览

### 2.1 仍然成立的问题

以下问题在当前源码下仍然成立：

1. **`advance()` 中存在受控递归自动收口**
   - 位置: `src/core/process-engine/advance.ts`
   - 现状: `07_release` 会递归调用 `advance()` 自动推进到 `08_done`
   - 结论: 问题成立，但更接近“可维护性/可读性风险”，不是 `Critical`

2. **同步文件 I/O 广泛存在**
   - 位置: `src/shared/fs-utils.ts`、`src/shared/config-schema.ts`、`src/shared/host-bootstrap.ts` 等
   - 结论: 性能改进项成立，但这是 CLI/本地工具链中的常见取舍，不应默认上升为高危性能缺陷

3. **配置缓存 TTL 为 30 秒**
   - 位置: `src/shared/config-schema.ts`
   - 结论: 事实成立，但“过短”属于经验判断，不是确定性缺陷

4. **文档统计口径存在不一致**
   - 现状:
     - `src/core/` 当前一级子目录数为 `15`
     - `src/` 当前 TypeScript 文件数为 `163`
     - `skills/spec-first/` 当前一级目录数为 `21`，但对外文档口径仍以 `20 Skills` 为主
     - `README.md` 当前写 `28 deterministic command groups`
   - 结论: “文档与代码统计不一致”成立，但需要逐条精确校准，不能沿用 `.full-review` 中的旧数字

5. **`init.ts`、`host-bootstrap.ts`、`hard-gate.ts` 等文件复杂度偏高**
   - 结论: 这是合理的技术债条目，但应归类为 `P1/P2 可维护性改进`

### 2.2 部分成立，但需要降级或重写的问题

1. **`07_release` 递归调用风险**
   - `.full-review` 表述: 栈溢出级别风险
   - 当前判断: 这是**单次自动收口递归**，理论风险存在，但并非无限递归模型
   - 建议定级: `Medium`

2. **Gate / Hard Gate / 错误处理模式不一致**
   - 当前判断: 方向成立，但不构成 `Critical`
   - 建议定级: `Medium`

3. **大量同步 I/O**
   - 当前判断: 事实成立
   - 但 CLI 工具链不一定需要全面异步化
   - 建议定级: `Medium`

4. **Config Cache TTL 30 秒**
   - 当前判断: 事实成立
   - 但“太短”缺乏明确基准
   - 建议定级: `Low` 或“待压测确认”

5. **缺少 ADR**
   - 当前判断: 这是治理改进项，不应列为 `Critical`
   - 建议定级: `Low`

### 2.3 已经失效、证据不足或明显错误的问题

1. **`batch-executor 未实现 / not implemented`**
   - `.full-review` 将其列为 `Critical`
   - 当前代码下 `src/core/batch-executor/` 已包含真实模块与测试，不符合“整个模块未实现”的表述
   - 结论: **失效**

2. **`hard-gate.ts` Git 命令注入**
   - `.full-review` 使用的是 `execSync(\`git ${args}\`)` 风格示例
   - 当前 `src/core/skill-runtime/hard-gate.ts` 使用 `execFileSync('git', args, {...})`
   - 结论: **原 Critical 结论不成立**
   - 如果保留问题，也只能是“Git 命令面收敛/allowlist 硬化”，不是 shell 注入

3. **`init.ts` / `fs-utils.ts` 路径遍历 Critical**
   - `.full-review` 用的是 `join(projectRoot, feat)` 一类示例
   - 当前 `src/shared/fs-utils.ts` 已有 `assertSafePath()` 与受控路径读写封装
   - 结论: **原 Critical 结论不成立**

4. **“8 处空 catch 块”**
   - 当前核对的关键文件中，多数 `catch` 为显式降级、fallback 或安全跳过
   - 例如:
     - `src/core/process-engine/advance.ts`
     - `src/shared/fs-utils.ts`
     - `src/core/skill-runtime/hard-gate.ts`
   - 结论: **“空 catch 块 = Critical”不成立**
   - 如果继续审查，应改成“少量静默降级点需要标注文档化原因”

5. **安全阶段中的多项 CVSS 评级**
   - 当前 `.full-review` 中的 `CVSS 9.8 / 9.1 / 9.0` 依赖于已失效的代码前提
   - 结论: **这些 CVSS 数值不能继续沿用**

---

## 3. 按文档逐份校准

## 3.1 `00-scope.md`

### 准确项

- `8 个活跃阶段 + 2 个终止阶段`
- `163 个 TypeScript 文件`
- `20 个 Skill` 作为对外主口径基本可接受

### 需要修正

1. **14 个核心模块**
   - 当前 `src/core/` 一级目录数为 `15`

2. **27 个 CLI 命令**
   - 当前对外主 README 口径为 `28 deterministic command groups`
   - `.full-review` 的该数字已过时

3. **5 项覆盖率指标**
   - 该表述需要回到当前 README / CLI 指标定义复核后再写
   - 不能直接作为事实锚点使用

### 结论

`00-scope.md` 可以保留为审查背景说明，但里面的统计数字不能继续作为准确基线。

---

## 3.2 `phase1a-quality-findings.md`

### 需要剔除或重写的条目

1. **`batch-executor` 未实现**
   - 当前源码不支持该结论

2. **空 catch 块 8 处**
   - 当前未证实为该数量，且关键文件表述失真

### 可保留但应降级的条目

1. `dispatcher.ts` 代码重复
2. `init.ts` 复杂度较高
3. `hard-gate.ts` 函数较长
4. `host-bootstrap.ts` 中存在相似写入逻辑

### 结论

`phase1a-quality-findings.md` 中最严重的两条结论已不可靠，建议重写为“当前可维护性问题清单”。

---

## 3.3 `phase1b-architecture-findings.md`

### 基本成立的条目

1. 分层架构整体较清晰
2. `host-adapters` 设计质量较高
3. `advance.ts` 的递归自动收口值得关注
4. `types.ts` / 状态结构可进一步拆分

### 需要调整的条目

1. **审查范围写成 14 个核心模块**
   - 当前应为 `15`

2. **“缺少 ADR”不应列为 Critical**
   - 更适合作为治理建议

3. **循环依赖风险**
   - 需要精确表述为“共享类型依赖可继续下沉”，不应夸大为已形成严重循环依赖

### 结论

`phase1b-architecture-findings.md` 是 `.full-review` 中最接近当前事实的一份，但统计口径和严重度仍需下调。

---

## 3.4 `01-quality-architecture.md`

这是汇总文档，因此继承了前两份中的问题。

### 需要明确删除或改写的条目

1. `C1. batch-executor 未实现`
2. `C2. 空 catch 块吞掉异常`
3. `C5. 缺少 ADR` 的 `Critical` 定级

### 可以保留的条目

1. 文档统计不一致
2. `advance.ts` 递归自动收口
3. `init.ts` / `hard-gate.ts` / `host-bootstrap.ts` 复杂度高

---

## 3.5 `phase2a-security-findings.md`

### 需要删除或重写的条目

1. **Git 命令注入**
   - 当前 `hard-gate.ts` 证据链不成立

2. **路径遍历**
   - 当前对 `fs-utils.ts` 的攻击示例与实现不匹配

3. **空 catch = 安全 Critical**
   - 当前证据不足

### 可保留的更弱版本

1. Git 命令执行面可以继续做 allowlist / scope hardening
2. JSON 运行时校验可继续增强
3. 文件大小 / 输入规模 / 超时上限可以继续系统化

### 结论

`phase2a-security-findings.md` 的安全方向不全错，但 `Critical` 级结论大量依赖旧代码形态，当前不可直接采纳。

---

## 3.6 `phase2b-performance-findings.md`

### 成立的条目

1. `advance.ts` 使用递归自动收口
2. 同步 I/O 广泛存在
3. `config` 缓存 TTL 为 30 秒

### 需要改写或降级的条目

1. **`batch-executor TODO placeholders`**
   - 已不成立

2. **Auto-loop 未真正并行**
   - 需要回到当前 `ai-orchestrator` 实现精确核对，不能直接复用旧结论

3. **上游血统递归无深度限制**
   - 需要当前源码位置与真实调用链证据，不宜直接保留

### 结论

`phase2b-performance-findings.md` 中有若干真实性能观察，但存在把“优化建议”写成“高危性能缺陷”的问题。

---

## 3.7 `02-security-performance.md`

### 明显错误项

1. `C1 Git 命令注入漏洞`
2. `C2 路径遍历漏洞`
3. 基于这些条目的 CVSS 和 P0 优先级

### 可保留项

1. 同步 I/O 作为性能改进方向
2. 递归自动收口作为设计改进项
3. 输入规模、超时、验证边界的系统化建设建议

### 结论

该文档需要整体降级处理，不能作为当前安全 P0 列表。

---

## 3.8 `checkpoint-1-summary.md`

这是失真最严重的汇总文档之一。

### 不准确项

1. `Git 命令注入 (CVSS 9.8)`
2. `路径遍历 (CVSS 9.1)`
3. `8 处空 catch`
4. `batch-executor 未实现`
5. 把 `advance.ts` 递归直接列为 `Critical`

### 可保留项

1. 文档与代码统计口径不一致
2. 存在性能和复杂度优化空间
3. 架构主干整体较清晰

### 结论

`checkpoint-1-summary.md` 不适合作为“当前版本结论摘要”，建议以本文件替代。

---

## 4. 当前版本建议保留的问题清单

以下是基于当前代码实现，建议真正保留的审查问题：

### P1

1. `advance.ts` 的 `07_release -> 08_done` 自动收口仍采用递归，可改为迭代
2. `init.ts`、`hard-gate.ts`、`host-bootstrap.ts` 复杂度偏高，适合继续拆分
3. 项目文档中关于模块数、命令组数、Skill 口径仍存在历史残留，需要持续校准

### P2

1. Git 命令执行面可继续做 allowlist / scope hardening
2. JSON / 配置 / 文件规模校验可继续系统化
3. 同步 I/O 可结合真实瓶颈做定向异步化或缓存优化
4. `config` 缓存 TTL 是否需要调整，应以压测结果为准

### P3

1. ADR / Repository 抽象 / branded types / 类型拆分等治理型改进

---

## 5. 最终建议

1. **不要直接继续使用 `.full-review/checkpoint-1-summary.md` 作为最终结论**
   - 其中多条 Critical 结论已与当前实现不符

2. **如果后续要继续推进整改，应以“当前代码基线”重新生成问题清单**
   - 重点放在复杂度、边界一致性、性能热点验证

3. **本次 `.full-review` 最适合作为“审查草稿”归档**
   - 而不是作为准确的缺陷基线

4. **建议以本文件替代旧的阶段性结论摘要**
   - 当前最准确的表述是：
     - 架构主干整体健康
     - 统计口径存在历史漂移
     - 部分性能/复杂度问题成立
     - 旧安全 Critical 结论多数已经失效

---

## 6. 校准后的一句话结论

当前 `.full-review` 中，**架构方向判断大体可用，但安全和代码质量中的多个 Critical 条目已经过时或证据失真**。如果要继续用于决策，必须以当前源码实现为基线重新定级；否则会把已经不存在的问题当成当前阻断项。
