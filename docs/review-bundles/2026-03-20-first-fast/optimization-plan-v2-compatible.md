# First Skill 优化方案 V2（符合现有合同）

> 验证日期：2026-03-20
> 当前执行时间：**54 分 46 秒**
> 目标执行时间：**20-25 分钟**
> 约束：**不破坏现有合同**（Wave 编排、Subagent 语义、Evidence pack 结构）

---

## 🎯 优化原则

### 不变的部分（遵守现有合同）

1. ✅ **Wave 编排模型**：保持 Wave 1-5 的串行执行
2. ✅ **Subagent 语义**：保持 13 个 subagent 的定义
3. ✅ **Evidence pack 结构**：保持 `manifest/shared/runtime/docs` 目录结构
4. ✅ **Reference 文件体系**：保持 20 个 reference 文件（但优化加载方式）

### 变的部分（优化）

1. ✅ **主线程前置索引**：主线程用 Serena LSP 建立符号索引
2. ✅ **共享 Evidence Pack**：主线程收集一次，所有 subagent 共享
3. ✅ **按需加载 Reference**：每个 subagent 只加载必要的 reference
4. ✅ **Serena 符号工具**：subagent 用 Serena 替代 glob/grep/Read

---

## 📊 优化方案

### 阶段 0：主线程激活项目（Serena LSP）【新增】

**目标**：用 Serena LSP 建立符号索引，减少后续分析成本

**步骤**：
```markdown
### 0. 激活项目（Serena LSP）【主线程，新增】

- 调用 `mcp__serena__activate_project` 激活项目
- LSP 建立符号索引（一次性成本，约 5-10 秒）
- 读取项目记忆（如果存在）：`architecture`、`code_style`、`project_overview`
```

**效果**：
- 后续 subagent 可以用 Serena 符号工具快速分析代码
- 减少重复读取文件的成本

**Token 成本**：约 2,000 tokens（激活 + 读取记忆）

**执行时间**：约 10 秒

---

### 阶段 1：主线程收集 Evidence Pack【优化】

**目标**：主线程收集一次 evidence pack，所有 subagent 共享

**当前方式**：
- 每个 subagent 都独立收集 evidence pack
- 13 个 subagent × 重复收集 = 13x token 成本

**优化方式**：
```markdown
### 1. 收集 Evidence Pack（主线程，优化）

- 使用 Serena 符号工具收集：
  - `mcp__serena__list_dir`：理解目录结构（递归 2 层）
  - `mcp__serena__find_file`：定位 Manifest/README/Config
  - `mcp__serena__find_symbol`：定位 Entry（main/index/app）
  - `Read`：读取关键文件（package.json、tsconfig.json、README.md）

- 将结构化摘要写入 evidence pack 的 `shared/` 目录：
  - `shared/manifest.json`：项目基本信息
  - `shared/structure.json`：目录结构
  - `shared/symbols.json`：关键符号索引

- **不删除** evidence pack 的 `manifest/shared/runtime/docs` 结构
- **不删除** Lockfile 角色（但标记为可选）
```

**效果**：
- 减少 13x → 1x 的证据收集成本
- 后续 subagent 直接读取 `shared/` 目录

**Token 成本**：约 5,000 tokens（主线程收集一次）

**执行时间**：约 2 分钟

---

### 阶段 2：Wave 1-5 执行（优化 Subagent 加载）

**目标**：每个 subagent 只加载必要的 reference，用 Serena 替代 glob/grep/Read

#### Wave 1：3 个 Subagent（并行）

**Subagent 1：summary-steering**
- **加载 reference**：
  - `detection-rules.md`（项目类型识别）
  - `agent-output-schema.md`（输出格式）
  - ~~`quality-assurance-rules.md`~~（主线程已校验，不需要）
  - ~~`execution-flow.md`~~（主线程已执行，不需要）
- **使用 Serena**：
  - `find_symbol`：定位关键符号
  - `get_symbols_overview`：理解文件结构
- **Token 成本**：约 8,000 tokens（比当前节省 50%）

**Subagent 2：conventions-entry-guide**
- **加载 reference**：
  - `agent-guidelines-setup.md`（规范与环境）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `find_file`：定位配置文件
  - `get_symbols_overview`：理解配置结构
- **Token 成本**：约 7,000 tokens（比当前节省 50%）

**Subagent 3：critical-flows**
- **加载 reference**：
  - `agents-code-analysis.md`（调用链分析）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `find_symbol`：定位关键入口
  - `find_referencing_symbols`：分析调用链
- **Token 成本**：约 8,000 tokens（比当前节省 50%）

**Wave 1 总计**：23,000 tokens，约 3 分钟

#### Wave 2：3 个 Subagent（并行）

**Subagent 4：api-contracts**
- **加载 reference**：
  - `agents-api-deps.md`（API 分析）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `find_symbol`：定位 API 入口
  - `get_symbols_overview`：理解 API 结构
- **Token 成本**：约 8,000 tokens

**Subagent 5：structure-overview**
- **加载 reference**：
  - `structure-analysis.md`（结构分析）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `list_dir`：理解目录结构
  - `get_symbols_overview`：理解文件结构
  - `find_referencing_symbols`：分析依赖关系
- **Token 成本**：约 9,000 tokens

**Subagent 6：domain-model**
- **加载 reference**：
  - `agent-domain-model.md`（领域模型）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `find_symbol`：定位领域对象
  - `get_symbols_overview`：理解领域结构
- **Token 成本**：约 8,000 tokens

**Wave 2 总计**：25,000 tokens，约 3 分钟

#### Wave 3：1 个 Subagent

**Subagent 7：database-schema**
- **加载 reference**：
  - `agent-database.md`（数据库分析）
  - `database-conditional-projection.md`（条件型投影）
  - `agent-output-schema.md`（输出格式）
- **使用 Serena**：
  - `find_file`：定位数据库文件
  - `get_symbols_overview`：理解 schema 结构
- **Token 成本**：约 6,000 tokens

**Wave 3 总计**：6,000 tokens，约 1 分钟

#### Wave 4：3 个 Subagent（并行）

**Subagent 8-10：overview-docs、engineering-docs、flow-docs**
- **加载 reference**：
  - `agent-output-schema.md`（输出格式）
  - **不加载**其他 reference（基于 runtime JSON 生成）
- **Token 成本**：约 4,000 tokens × 3 = 12,000 tokens

**Wave 4 总计**：12,000 tokens，约 2 分钟

#### Wave 5：3 个 Subagent（并行）

**Subagent 11-13：api-docs、structure-docs、model-docs**
- **加载 reference**：
  - `agent-output-schema.md`（输出格式）
  - **不加载**其他 reference（基于 runtime JSON 生成）
- **Token 成本**：约 4,000 tokens × 3 = 12,000 tokens

**Wave 5 总计**：12,000 tokens，约 2 分钟

---

## 📊 优化效果对比

### Token 成本对比

| 组件 | 当前 | 优化后 | 节省 |
|------|------|--------|------|
| 主线程 | 20,000 | 7,000 | 65% |
| Wave 1（3 subagents） | 45,000 | 23,000 | 49% |
| Wave 2（3 subagents） | 50,000 | 25,000 | 50% |
| Wave 3（1 subagent） | 12,000 | 6,000 | 50% |
| Wave 4（3 subagents） | 35,000 | 12,000 | 66% |
| Wave 5（3 subagents） | 38,000 | 12,000 | 68% |
| **总计** | **200,000** | **85,000** | **57%** |

### 执行时间对比

| 阶段 | 当前 | 优化后 | 节省 |
|------|------|--------|------|
| 激活项目（Serena LSP） | — | 10 秒 | — |
| 收集 Evidence Pack | 5 分钟 | 2 分钟 | 60% |
| Wave 1 | 10 分钟 | 3 分钟 | 70% |
| Wave 2 | 12 分钟 | 3 分钟 | 75% |
| Wave 3 | 3 分钟 | 1 分钟 | 67% |
| Wave 4 | 8 分钟 | 2 分钟 | 75% |
| Wave 5 | 10 分钟 | 2 分钟 | 80% |
| 校验与收尾 | 7 分钟 | 1 分钟 | 86% |
| **总计** | **55 分钟** | **14 分钟** | **75%** |

---

## 🛠️ 实施步骤

### Phase 1：主线程激活项目 + 收集 Evidence Pack（1-2 天）

**目标**：主线程用 Serena LSP 建立索引，收集共享 evidence pack

**修改文件**：
1. `execution-flow.md`：新增"阶段 0：激活项目"
2. `execution-flow.md`：修改"阶段 1：收集 evidence pack"（使用 Serena）
3. `evidence-pack-spec.md`：明确 `shared/` 目录的作用（主线程收集，subagent 共享）

**不修改**：
- ❌ 不删除 `manifest/shared/runtime/docs` 结构
- ❌ 不删除 Lockfile 角色（标记为可选）

**成功标准**：
- 主线程可以在 2 分钟内收集 evidence pack
- Evidence pack 结构符合合同

### Phase 2：优化 Subagent Reference 加载（2-3 天）

**目标**：每个 subagent 只加载必要的 reference

**修改文件**：
1. `subagent-architecture.md`：为每个 subagent 明确"必须加载"和"可选加载"的 reference
2. `agents-*.md`：明确每个 agent 只加载必要的 reference

**不修改**：
- ❌ 不删除任何 reference 文件
- ❌ 不改变 Wave 编排模型

**成功标准**：
- 每个 subagent 只加载 2-3 个 reference
- Token 成本降低 50%

### Phase 3：Subagent 使用 Serena 符号工具（2-3 天）

**目标**：subagent 用 Serena 替代 glob/grep/Read

**修改文件**：
1. `agents-code-analysis.md`：新增"使用 Serena 符号工具"指引
2. `agents-api-deps.md`：新增"使用 Serena 符号工具"指引
3. 其他 agent 提示文件：新增 Serena 使用指引

**不修改**：
- ❌ 不改变 subagent 语义
- ❌ 不删除任何 agent

**成功标准**：
- Subagent 可以用 Serena 快速分析代码
- 执行时间降低 70%

### Phase 4：测试与调优（2-3 天）

**目标**：在真实项目中测试优化效果

**测试项目**：
- spec-first 本身（TypeScript 项目）
- 一个 Java 后端项目
- 一个 Python 项目

**测试指标**：
- Token 成本
- 执行时间
- 生成质量（runtime JSON 和 docs Markdown 的准确性）

**调优方向**：
- 调整 reference 加载策略
- 优化 Serena 使用方式

---

## 📝 需要修改的文件

### 新增内容（不破坏合同）

1. **execution-flow.md**：新增"阶段 0：激活项目（Serena LSP）"
2. **execution-flow.md**：修改"阶段 1：收集 evidence pack"（使用 Serena）
3. **evidence-pack-spec.md**：明确 `shared/` 目录的作用
4. **subagent-architecture.md**：为每个 subagent 明确 reference 加载策略
5. **agents-*.md**：新增"使用 Serena 符号工具"指引

### 不修改的内容（遵守合同）

1. ❌ 不删除 Wave 编排模型
2. ❌ 不删除 Subagent 语义
3. ❌ 不删除 evidence pack 结构（manifest/shared/runtime/docs）
4. ❌ 不删除任何 reference 文件
5. ❌ 不删除 Lockfile 角色（标记为可选）

---

## 🎯 总结

### 优化效果

| 指标 | 当前 | 优化后 | 节省 |
|------|------|--------|------|
| **执行时间** | 55 分钟 | 14 分钟 | 75% |
| **Token 成本** | 200,000 | 85,000 | 57% |
| **破坏合同** | — | **无** | ✅ |

### 实施周期

**总计：7-11 天**

- Phase 1：1-2 天（主线程优化）
- Phase 2：2-3 天（Reference 加载优化）
- Phase 3：2-3 天（Subagent Serena 优化）
- Phase 4：2-3 天（测试与调优）

### 关键差异（vs V1 方案）

| 方面 | V1 方案（重构） | V2 方案（优化） |
|------|---------------|---------------|
| Wave 编排 | ❌ 删除 | ✅ 保留 |
| Subagent 语义 | ❌ 删除 | ✅ 保留 |
| Evidence pack 结构 | ❌ 扁平化 | ✅ 保留 |
| Reference 文件 | ❌ 删除 14 个 | ✅ 保留 20 个（优化加载） |
| 执行时间节省 | 78-82% | 75% |
| Token 成本节省 | 62% | 57% |
| **破坏合同** | **是** | **否** |

---

## 📋 附录：Reference 加载策略

| Subagent | 必须加载 | 可选加载 | 不加载 |
|----------|---------|---------|--------|
| summary-steering | detection-rules.md、agent-output-schema.md | — | quality-assurance-rules.md、execution-flow.md |
| conventions-entry-guide | agent-guidelines-setup.md、agent-output-schema.md | — | quality-assurance-rules.md |
| critical-flows | agents-code-analysis.md、agent-output-schema.md | — | structure-analysis.md（主线程已提供） |
| api-contracts | agents-api-deps.md、agent-output-schema.md | — | api-and-dependencies.md（主线程已提供） |
| structure-overview | structure-analysis.md、agent-output-schema.md | — | agents-code-analysis.md（主线程已提供） |
| domain-model | agent-domain-model.md、agent-output-schema.md | — | domain-model-analysis.md（主线程已提供） |
| database-schema | agent-database.md、database-conditional-projection.md、agent-output-schema.md | — | database-config.md（主线程已提供） |
| docs agents（6 个） | agent-output-schema.md | — | 所有其他 reference（基于 runtime JSON） |

**说明**：
- "必须加载"：每个 subagent 必须加载的 reference（2-3 个）
- "可选加载"：根据需要可以加载的 reference
- "不加载"：主线程已经提供或不需要的 reference
