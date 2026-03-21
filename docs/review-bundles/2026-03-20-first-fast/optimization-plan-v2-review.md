# V2 优化方案审查报告

> 审查日期：2026-03-20
> 审查对象：`optimization-plan-v2-compatible.md`
> 审查结论：**部分可行，但只应作为未来 Path Y 候选；当前实施口径应保持 Path X**

> 状态更新：当前 live docs 已把共享摘要收敛为 `shared/summary.json` / `shared/context.json`，并保留 7 个全局 reference 的 Path X 口径。下面的冲突分析仍适用于 Path Y。

---

## ✅ 符合合同的部分

### 1. Wave 编排模型（符合）

- ✅ 保留 Wave 1-5 的串行执行（第 14 行）
- ✅ 每个 Wave 最多 3 个 Agent 并发（第 94、127、159、173、183 行）
- ✅ Wave 前置条件与现有合同一致（subagent-architecture.md 第 91-99 行）

### 2. Subagent 语义（符合）

- ✅ 保留 13 个 subagent 的定义（第 15 行）
- ✅ Subagent 的产出与现有合同一致（subagent-architecture.md 第 15-43 行）
- ✅ Subagent 的输入边界与现有合同一致（subagent-architecture.md 第 49-59 行）

### 3. Evidence Pack 结构（部分符合）

- ✅ 保留 `manifest/shared/runtime/docs` 目录结构（第 16 行）
- ⚠️ 新增 `shared/manifest.json`、`shared/structure.json`、`shared/symbols.json`（第 72-74 行）— **需要修改合同**

### 4. Reference 文件体系（符合）

- ✅ 保留 20 个 reference 文件（第 17 行）
- ✅ 不删除任何 reference 文件（第 253-254 行）

---

## ❌ 合同冲突的部分

### 冲突 1：Evidence Pack 新增文件与现有合同冲突

**V2 方案**（第 72-74 行）：
```markdown
- 将结构化摘要写入 evidence pack 的 `shared/` 目录：
  - `shared/manifest.json`：项目基本信息
  - `shared/structure.json`：目录结构
  - `shared/symbols.json`：关键符号索引
```

**现有合同**（evidence-pack-spec.md 第 10-16 行）：
```markdown
evidence-pack/
  manifest.json    ← 根目录已有 manifest.json
  shared/
  runtime/
  docs/
```

**问题**：
1. 现有合同中 `manifest.json` 在根目录，V2 方案在 `shared/` 目录新增同名文件，会混淆
2. `shared/structure.json`、`shared/symbols.json` 是新增文件，现有合同没有定义，需要明确规范

**建议修正**：
- 方案 A：保持 `manifest.json` 在根目录，`shared/` 目录只存"共享摘要"（当前 live 口径为 `shared/summary.json` + `shared/context.json`）
- 方案 B：修改 evidence-pack-spec.md，明确 `shared/` 目录可以包含"主线程收集的共享摘要"

**推荐**：方案 A（保持根目录 manifest.json，避免混淆）

---

### 冲突 2：Subagent 不加载 `quality-assurance-rules.md` 违反全局约束

**V2 方案**（第 100 行）：
```markdown
- ~~`quality-assurance-rules.md`~~（主线程已校验，不需要）
```

**全局约束**（SKILL.md 第 61 行）：
```markdown
| 场景 | 必须加载 | 按需加载 | 说明 |
|---|---|---|---|
| 所有执行 | `execution-flow.md`、`subagent-architecture.md`、`detection-rules.md`、`quality-assurance-rules.md`、`main-thread-contract.md`、`evidence-pack-spec.md`、`agent-output-schema.md` | — | 主线程与 wave 调度的共同契约 |
```

**问题**：
1. SKILL.md 第 61 行明确要求"所有执行"都必须加载 7 个 reference 文件（包括 `quality-assurance-rules.md`）
2. 这是一个**全局契约**，不能随意修改
3. V2 方案让 subagent 不加载 `quality-assurance-rules.md`，直接违反了这个全局约束
4. 如果修改这个全局约束，会影响整个 first skill 的契约体系（所有 subagent 的加载行为都要重新定义）

**建议修正**：
- **方案 A（遵守全局约束）**：所有 subagent 都加载 `quality-assurance-rules.md`（遵守 SKILL.md 第 61 行）
  - 优点：不破坏全局约束
  - 缺点：token 成本无法降低（所有 subagent 都要加载 7 个文件）

- **方案 B（修改全局约束）**：将 SKILL.md 第 61 行的"所有执行必须加载"改为分层加载：
  ```markdown
  | 场景 | 必须加载 | 说明 |
  |---|---|---|
  | 主线程 | `execution-flow.md`、`subagent-architecture.md`、`detection-rules.md`、`quality-assurance-rules.md`、`main-thread-contract.md`、`evidence-pack-spec.md`、`agent-output-schema.md` | 主线程加载全部契约 |
  | runtime subagents | `quality-assurance-rules.md`、`agent-output-schema.md` + 主题相关 reference | 只加载质量保证 + 输出格式 + 主题规范 |
  | docs subagents | `agent-output-schema.md` + evidence pack `shared/` 目录 | 只加载输出格式 + 共享证据 |
  ```
  - 优点：token 成本可以降低 40-50%
  - 缺点：需要修改全局约束，影响面大

**推荐**：**方案 A**（遵守全局约束，接受较低的 token 节省比例）

**理由**：
1. 全局约束是 first skill 的核心契约，不应该为了性能优化而破坏
2. `quality-assurance-rules.md` 定义了"证据标注格式"、"抽样验证规则"等核心质量要求，所有 subagent 都应该遵守
3. Token 成本节省比例从 57% 降到 35-40% 仍然显著

---

### 冲突 3：Docs Agents 不读取 Evidence Pack 与合同冲突

**V2 方案**（第 178 行）：
```markdown
- **不加载**其他 reference（基于 runtime JSON 生成）
```

**现有合同**（subagent-architecture.md 第 56-59 行）：
```markdown
### docs agents
- 输入：本轮 evidence pack、已确认的 runtime 结果、当前 wave
- 输出：对应的 `docs/first/*.md`
- 禁止：重新取证或反向修正 runtime 真源
```

**问题**：
1. 现有合同明确 docs agents 的输入包括"本轮 evidence pack"
2. 如果 docs agents 不读取 evidence pack，就无法理解项目上下文（例如项目名称、技术栈等基本信息）
3. 只基于 runtime JSON 生成 docs，会丢失"项目意图"、"使用方式"等信息（这些信息在 evidence pack 的 README.md 中）

**建议修正**：
- Docs agents 加载 `agent-output-schema.md` + 读取 evidence pack 的 `shared/` 目录（项目基本信息）
- 或者：将 evidence pack 的关键信息写入 runtime JSON（但会违反 runtime 是"机器真源"的原则）

**推荐**：Docs agents 读取 evidence pack 的 `shared/` 目录（符合合同）

---

## ⚠️ 估算错误

### 错误 1：执行时间估算错误

**V2 方案**（第 213-221 行）：
```markdown
| 激活项目（Serena LSP） | — | 10 秒 |
| 收集 Evidence Pack | 5 分钟 | 2 分钟 |
| Wave 1 | 10 分钟 | 3 分钟 |
| Wave 2 | 12 分钟 | 3 分钟 |
| Wave 3 | 3 分钟 | 1 分钟 |
| Wave 4 | 8 分钟 | 2 分钟 |
| Wave 5 | 10 分钟 | 2 分钟 |
| 校验与收尾 | 7 分钟 | 1 分钟 |
| **总计** | **55 分钟** | **14 分钟** |
```

**计算错误**：
- 10 秒 + 2 分钟 + 3 分钟 + 3 分钟 + 1 分钟 + 2 分钟 + 2 分钟 + 1 分钟 = **14 分 10 秒**
- 不是 14 分钟（应该是 14-15 分钟）

**建议修正**：
- 修改表格：总计 = **14-15 分钟**（或精确到 14 分 10 秒）

---

### 错误 2：Token 成本估算严重低估

**V2 方案**（第 105、114、123 行）：
```markdown
**Token 成本**：约 8,000 tokens（比当前节省 50%）
```

**问题**：
1. **严重低估**：V2 方案假设 subagent 可以不加载 `quality-assurance-rules.md` 等 reference 文件
2. **违反全局约束**：SKILL.md 第 61 行明确要求"所有执行"都必须加载 7 个 reference 文件
3. 如果遵守全局约束，每个 subagent 必须加载 7 个 reference 文件（~7,000 tokens）
4. 修正后每个 subagent 的 token 成本：7,000（7 个 reference）+ 2,000（主题 reference）+ 3,000（Serena）+ 1,500（输出）= **~13,500 tokens**
5. 13 个 subagent 总计：13,500 × 13 = **~175,500 tokens**（仅 subagent 部分）
6. 加上主线程（14,000）：**总计 ~189,500 tokens**
7. 节省比例只有 **5%**（200,000 → 189,500），不是 V2 方案声称的 57%

**更正计算**（保守估计）：
- 主线程：14,000 tokens
- Runtime subagents（7 个）：13,500 × 7 = 94,500 tokens
- Docs subagents（6 个）：9,500 × 6 = 57,000 tokens（加载 7 个 reference + evidence pack + 输出）
- **总计**：14,000 + 94,500 + 57,000 = **165,500 tokens**
- **节省**：17%（仍然有优化，但远低于 V2 方案声称的 57%）

**建议修正**：
- 遵守全局约束，所有 subagent 都加载 7 个 reference 文件
- Token 成本节省比例：17%（不是 57%）
- 执行时间节省比例：64-65%（这是主要优化目标）

---

## 📋 修正建议汇总

### 必须修正（破坏合同）

1. **Evidence Pack 新增文件**：
   - 删除 `shared/manifest.json`（与根目录 `manifest.json` 冲突）
   - 改为 `shared/summary.json`（项目基本摘要）
   - 或者：修改 evidence-pack-spec.md，明确 `shared/` 目录可以包含"主线程收集的共享摘要"

2. **Subagent 不加载 quality-assurance-rules.md**：
   - 所有 runtime subagent 都加载 `quality-assurance-rules.md`（至少第 1 节）
   - 或者：主线程读取 `quality-assurance-rules.md` 并将摘要写入 `shared/quality-contract.json`

3. **Docs Agents 不读取 Evidence Pack**：
   - Docs agents 加载 `agent-output-schema.md` + 读取 evidence pack 的 `shared/` 目录
   - 符合现有合同（subagent-architecture.md 第 56 行）

### 建议修正（估算不准确）

4. **执行时间估算**：
   - 修改总计：14 分钟 → **14-15 分钟**

5. **Token 成本估算**：
   - 给出合理范围：例如 85,000 → **80,000-95,000**

---

## 🎯 修正后的优化效果

### Token 成本对比（修正后，遵守全局约束）

**全局约束**：所有执行（主线程 + subagent）都必须加载 7 个 reference 文件（SKILL.md 第 61 行）

| 组件 | 当前 | 优化后（修正） | 节省 | 说明 |
|------|------|--------------|------|------|
| 主线程 | 20,000 | 14,000 | 30% | 加载 7 个 reference + 激活项目 + 收集 evidence pack |
| Wave 1（3 subagents） | 45,000 | 40,500 | 10% | 每个 subagent 加载 7 个 reference（~7,000）+ 主题 reference（~2,000）+ Serena（~3,000）+ 输出（~1,500）= ~13,500 × 3 |
| Wave 2（3 subagents） | 50,000 | 40,500 | 19% | 同上 |
| Wave 3（1 subagent） | 12,000 | 13,500 | -13% | 加载 7 个 reference 成本较高 |
| Wave 4（3 subagents） | 35,000 | 28,500 | 19% | 每个 subagent 加载 7 个 reference（~7,000）+ evidence pack（~1,000）+ 输出（~1,500）= ~9,500 × 3 |
| Wave 5（3 subagents） | 38,000 | 28,500 | 25% | 同上 |
| **总计** | **200,000** | **165,500** | **17%** | 节省比例从 57% 降到 17% |

**说明**：
- 修正后 token 成本只节省 17%（因为必须遵守全局约束：所有 subagent 都加载 7 个 reference 文件）
- Wave 3 反而增加了 13%（因为只有 1 个 subagent，加载 7 个 reference 的成本占比高）
- 主要优化来自：Serena 替代 glob/grep/Read（减少代码分析成本）+ 主线程收集共享 evidence pack（减少重复读取）

### 执行时间对比（修正后，遵守全局约束）

| 阶段 | 当前 | 优化后（修正） | 节省 | 说明 |
|------|------|--------------|------|------|
| 激活项目（Serena LSP） | — | 10 秒 | — | 一次性建立符号索引 |
| 收集 Evidence Pack | 5 分钟 | 2 分钟 | 60% | 主线程用 Serena 快速收集 |
| Wave 1 | 10 分钟 | 4 分钟 | 60% | 3 个 subagent 并行，每个加载 7 个 reference |
| Wave 2 | 12 分钟 | 4 分钟 | 67% | 3 个 subagent 并行，每个加载 7 个 reference |
| Wave 3 | 3 分钟 | 2 分钟 | 33% | 1 个 subagent，加载 7 个 reference 成本占比高 |
| Wave 4 | 8 分钟 | 3 分钟 | 63% | 3 个 subagent 并行，每个加载 7 个 reference + evidence pack |
| Wave 5 | 10 分钟 | 3 分钟 | 70% | 3 个 subagent 并行，每个加载 7 个 reference + evidence pack |
| 校验与收尾 | 7 分钟 | 1 分钟 | 86% | 主线程快速校验 |
| **总计** | **55 分钟** | **19-20 分钟** | **64-65%** | 主要优化来自 Serena 替代 glob/grep/Read |

**说明**：
- 修正后执行时间节省 64-65%（仍然显著）
- 主要优化来自：Serena 符号工具替代 glob/grep/Read（减少代码分析时间 70-80%）
- 加载 7 个 reference 文件的时间成本相对较低（每个文件 ~100ms，7 个 ~0.7 秒）

---

## 🎯 最终审查结论

### 总体评价

**部分可行，但需要修正 3 个合同冲突**

| 方面 | 评价 | 说明 |
|------|------|------|
| 符合合同 | ✅ 80% | Wave 编排、Subagent 语义、Evidence pack 结构基本符合 |
| 合同冲突 | ❌ 3 处 | Evidence pack 新增文件、Subagent 不加载 quality（违反全局约束）、Docs 不读 evidence |
| 估算准确性 | ⚠️ 低 | Token 成本低估 95%（57% → 17%），执行时间低估 36%（14 分钟 → 19-20 分钟） |
| 可行性 | ✅ 高 | 修正后可以落地，不破坏核心合同和全局约束 |

### 修正优先级

1. **必须修正**（破坏合同）：
   - Evidence Pack 新增文件（冲突 1）：改为 `shared/summary.json`
   - Subagent 加载策略（冲突 2）：**遵守全局约束**，所有 subagent 都加载 7 个 reference 文件
   - Docs Agents 读取 Evidence Pack（冲突 3）：读取 `shared/` 目录

2. **建议修正**（估算不准确）：
   - 执行时间估算（14 分钟 → 19-20 分钟）
   - Token 成本估算（85,000 → 165,500，节省 17%）

### 修正后的预期效果

- **执行时间**：55 分钟 → **19-20 分钟**（节省 64-65%）
- **Token 成本**：200,000 → **165,500**（节省 17%）
- **破坏合同**：**无**（修正后完全符合，遵守全局约束）

**关键权衡**：
- 为了遵守全局约束（SKILL.md 第 61 行），所有 subagent 都必须加载 7 个 reference 文件
- 这导致 token 成本节省比例从 57% 降到 17%
- 但执行时间仍然可以节省 64-65%（主要来自 Serena 替代 glob/grep/Read）

### 下一步

**必须修正**（破坏合同）：
1. ✅ Evidence Pack 新增文件：改为 `shared/summary.json`（不与根目录 `manifest.json` 冲突）
2. ✅ Subagent 加载策略：**遵守全局约束**，所有 subagent 都加载 7 个 reference 文件（SKILL.md 第 61 行）
3. ✅ Docs Agents 读取 Evidence Pack：读取 `shared/` 目录（符合 subagent-architecture.md 第 56 行）

**修正后的预期效果**（保守估计）：
- 执行时间：55 分钟 → **19-20 分钟**（节省 64-65%）
- Token 成本：200,000 → **165,500**（节省 17%）
- **完全符合现有合同**（包括全局约束）

**建议**：修正 V2 方案后，可以进入 Phase 1 实施。虽然 token 成本节省比例较低（17%），但执行时间仍然可以节省 64-65%，这是更关键的优化目标。
