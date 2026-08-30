---
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan
status: active
execution: code
---

# spec-project-rules v2 终极设计 - Plan

## Goal Capsule

- **objective**: 按 15 个专家视角（6 设计 + 9 内容调研）的收敛结论，重新设计 `spec-project-rules` skill，实现"一文件四小节、确定性壳+语义核、一句话回写、哈希判保鲜"的极简架构。
- **decision focus**: 五文件 → 一文件、三模式 → 一模式两参数、五元数据字段 → 文件级时间戳。
- **verification focus**: 小仓（<500 文件）端到端 bootstrap 正确性；确定性脚本单元测试；eval case 红绿双向可证伪。
- **largest risk**: 大仓（>5000 文件）的分层抽样与 LLM 上下文预算控制。

---

## Product Contract

### 需求地基：三个实证事实（全部来源可回溯）

**事实一：规范的价值在效率不在正确性**
- ETH Zurich 2026：LLM 生成的规范平均降低 agent 成功率 3%，人写的仅提升 4%
- 同一研究：规范里提到的项目工具调用率提高 2.5 倍，执行时间和 token 各降 20-30%
- 结论：skill 的价值主张是"帮 AI 少走弯路"，不能替代测试/CI

**事实二：AI 消费规范存在三层漏损**
- 发现层（没被加载）→ 注入层（被稀释）→ 遵守层（被忽略）
- "More tokens, less success"——指令密度超限后遵守率骤降
- 饱和测试（45 次门测）：零指导 baseline 正确率 100%，预防性加载零收益、成本 2 倍

**事实三：存量项目的核心风险是"局部正确全局不兼容"**
- AI 会热心"优化"三年前的 race condition workaround
- 隐式依赖在代码中零信号甚至负信号
- 最危险的知识是"看着该修但不能动"的地雷

### 设计目标

为存量多端 monorepo 提供一个 skill，把"AI 每次进仓库都要重新猜的边界知识"写成有证据的、会被装载的持久资产。

### 非目标

- 不替代测试/CI/lint 的执法功能
- 不挖通用编码最佳实践（模型已内化）
- 不做 spec-driven development（spec-kit/OpenSpec 的领域）
- 不做全仓 wiki（DeepWiki 的领域）
- 不复述模型能从代码推断的内容

---

## Planning Contract

Product Contract unchanged (byte-preserved upstream source slice).

### 架构总览：五层 + 工作流层

```text
┌───────────────────────────────────────────────────────────┐
│ 工作流层：触发时机                                         │
│   T0 onboard 建一次                                       │
│   T1 犯错补一条（最高价值）                                │
│   T2 里程碑验一次（模型大版本/大重构/季度）                 │
│   T3 pointer 静默生效（每次会话零成本）                    │
│   ❌ 不做：每任务自动跑（饱和测试反证）                     │
├───────────────────────────────────────────────────────────┤
│ L4 消费层：AGENTS.md 一句 pointer + 规则 id 引用要求       │
│ L3 知识层：1 文件 4 小节（own/dep/reuse/rules）            │
│ L2 准入层：三问过滤 + 证据门槛                             │
│ L1 语义层：LLM 取证与合成（唯一需要智能的层）              │
│ L0 确定性层：脚本预计算（零 LLM token）                    │
└───────────────────────────────────────────────────────────┘
```

### L0 确定性层

#### 脚本：`extract-deps.cjs`（唯一必需的脚本）

```bash
node extract-deps.cjs <repoRoot> [--alias-file <path>] [--verify] [--pretty]
```

**能力清单**：

| 能力 | 实现 | 输出字段 |
|---|---|---|
| 构建系统检测 | npm workspaces / Gradle（settings.gradle + build.gradle） | `build_kind` |
| 模块清单 | settings.gradle include + 目录级 build.gradle 扫描 | `modules[]` |
| 依赖图（直引） | `project(':x')` 声明解析 | `edges[][from, to]` |
| 依赖图（别名） | Deps.kt 静态求值 → group:artifact → 映射回模块 | `edges[]`（合并） |
| 别名自动发现 | 深度 ≤6 扫描 Deps.kt，按引用命中数 → 有效 GAV 数 → 路径排序 | `alias_file`, `alias_count`, `alias_discovery` |
| 扫描错误披露 | 读文件/目录失败记入 payload | `alias_scan_errors[]` |
| verify 模式 | `--verify` 时读取已有知识库 DEP 表，核对当前图 | `violations[]`, `missing_refs[]`, `manual_check[]` |

**npm workspaces 优先**：检测到 npm 后跳过 Gradle alias 发现（`alias_discovery: 'not-applicable'`）。

**parser 规则**：剥离块注释和整行 `//` 后匹配 `const val name[: Type] = "group:artifact[:version]"`；只计入含 `:` 的有效坐标。

#### 可选脚本：`check-freshness.cjs`（保鲜检测）

```bash
node check-freshness.cjs <repoRoot> --kb docs/architecture.md
```

对知识库中每条规则的 source refs 计算当前内容哈希，与 `mining-manifest.json` 中的基线哈希对比，输出每条规则的 `evidence_dirty_ratio`。

- 全部 refs 未变 → `refresh_noop`（零 LLM token）
- 脏率 ≤30% → 局部重验
- 脏率 >30% 或 refs 删除 → 重挖队列
- refs 全部删除 → auto-kill

### L1 语义层

LLM 只做三件事，永远不做枚举：

1. **从证据包推断规则**：读取 L0 产出的依赖图/模块清单/文件分类表 + L0 预选的代表文件 → 推断"这 3 个文件都走 createClient → 封装约定"
2. **解释图的意义**：哪些依赖边是 hidden association、哪些耦合是"有意义的"
3. **失效仲裁**：L0 标记"evidence 变了"→ LLM 判断"规则是否还成立"

**禁止 LLM 做**：枚举文件（find/ls）、计数频率（rg -c）、检查格式（marker/schema）、对比哈希——全部 L0。

### L2 准入层

```text
准入三问（每条候选规则必须全过）：
1. AI 不知道这个吗？（不在训练分布中——项目私有事实）
2. AI 的默认会错吗？（先验与本项目冲突——偏离通用默认）
3. 这条只属于这里吗？（公司/项目特有——不是通用最佳实践）
三问全否 → 不写入

证据门槛：
- 存在性证据（支撑"必须/总是"类规则）：≥2 文件支撑
- 缺失性证据（支撑"禁止/无此依赖"类规则）：记录可复现检索式 + 命中数
- 50/50 分裂 → 不写
- 历史例外 → 收窄措辞（"新增代码优先沿用主模式""不要扩大例外"）
```

### L3 知识层

#### 文件结构（一文件四小节）

```markdown
# docs/architecture.md
---
generated_at: 2026-08-29
source_commit: feb6f82
---
<!-- spec-project-rules-start -->

## 归属（own）
- huasheng-stock 是壳模块，组合全部业务模块 | confirmed | README:5
- app-core 是核心容器，反向聚合业务依赖 | confirmed | CLAUDE.md:85

## 依赖方向（dep）
- admin 不得依赖 apps/web 业务代码 | confirmed | README:5 | 例外:legacy/OldPanel.ts
- 所有 com.hstong 坐标必须经 Deps.kt 别名声明 | inferred | Deps.kt

## 复用（reuse）
- HTTP 客户端：住址 packages/api-client，查法 `rg "createClient" apps packages` | inferred
- 日志：必须走 HSKLog，禁 android.util.Log | inferred | 706 处使用

## 约定（rules）
- 新增类必须 Kotlin | confirmed | CLAUDE.md:79
- 网络请求必须走 HsObservable，禁 suspend Retrofit | inferred | 1212 处使用

<!-- spec-project-rules-end -->
```

#### 条目格式（一行）

```text
结论（一句话，命令式措辞） | grade(confirmed/inferred) | source_refs | [可选: 例外/查法/计数]
```

**措辞规则**：
- 命令式（"必须走 X"）> 描述式（"我们偏好 X"）
- 禁令式（"禁止 Y"）用于 Never-touch 清单
- 不用绝对化措辞（除非证据压倒性一致）

**没有内容的小节直接省略**——不留空节。

#### 合并规则（仅三条）

1. markers 存在 → 只替换 marker 内内容
2. markers 不存在 → 追加（不删除用户已有内容）
3. markers 畸形 → 停止并询问

### L4 消费层

#### AGENTS.md pointer（唯一入口）

```markdown
<!-- spec-project-rules-start -->
本项目架构知识在 docs/architecture.md。跨端改动/依赖方向/shared 复用前必查。
涉及边界的改动须在 PR 中引用规则 id（如 DEP-003）。
<!-- spec-project-rules-end -->
```

**规则 id 引用**是消费确认的唯一可观测信号——AI 回复中引用了规则 id = 知识库被消费。

#### 禁止写入的目标

`.claude/`、`.codex/`、`.agents/skills/` 等全部 generated runtime 目录。

---

## Implementation Units

### U1. 知识层重构：五文件 → 一文件

- **Goal**: 将 `docs/architecture/` 五文件合并为 `docs/architecture.md` 单文件四小节，格式按 L3 设计。
- **Files**: `skills/spec-project-rules/references/knowledge-format.md`（重写）
- **Approach**: 定义新 schema v2（单文件/四小节/一行条目/三条合并规则）；废弃五文件 schema 及其五组 marker/frontmatter 规则。
- **Test scenarios**: 契约测试断言新 schema 关键词（四个 H2 标题/marker 对/条目格式）；旧五文件产物不迁移（v2 从零开始）。

### U2. 模式简化：三模式 → 一模式两参数

- **Goal**: 将 bootstrap/update/verify 三模式合并为单一模式，通过 `--scope` 和 `--dry-run` 参数控制行为。
- **Files**: `skills/spec-project-rules/SKILL.md`（重写）
- **Approach**:
  - `--scope full`：全量取证（原 bootstrap/refresh）
  - `--scope module:<name>`：只取相关模块（原 update）
  - `--dry-run`：只报告不写（原 verify）
  - 无参数：自动检测（有 marker → 增量 diff；无 marker → full）
- **Test scenarios**: eval case 覆盖四种参数组合的行为差异。

### U3. 确定性脚本整合

- **Goal**: 合并 extract-deps 和 verify-deps 为一个脚本；增加 freshness 检测能力。
- **Files**: `skills/spec-project-rules/scripts/extract-deps.cjs`、`skills/spec-project-rules/scripts/verify-deps.cjs`（合并）
- **Approach**: `--verify` 标志启用 DEP 表核对模式；新增 `--freshness` 标志启用 evidence refs 哈希对比。
- **Test scenarios**: 合并后脚本的单测覆盖所有原有用例 + 新增 freshness 用例。

### U4. 确定性预计算扩展（大仓适配）

- **Goal**: 为 >500 文件的大仓增加 churn 热力和文件分类预计算。
- **Files**: `skills/spec-project-rules/scripts/extract-deps.cjs`（扩展）
- **Approach**:
  - churn：`git log --format= --name-only` 聚合 per-module 提交频次
  - 文件分类：生成代码检测（header 注释/generated 目录）、语言分布、测试/源码比
  - 输出追加到 payload 的 `churn` 和 `file_classification` 字段
- **Test scenarios**: 小仓 fixture 验证输出字段存在且合理。

### U5. 回写交互设计（一句话触发）

- **Goal**: 实现最简回写路径——用户说"记下这条"→ preview → 回车。
- **Files**: `skills/spec-project-rules/SKILL.md`
- **Approach**:
  - 用户任意表述新约定（"以后都走 X" "这个必须用 Y"）
  - skill 自动裁剪取证范围（只读相关模块/文件）
  - 自动执行回源验证（≥2 文件 or 检索式反证）
  - 自动执行准入三问
  - preview 单条 diff → 确认后 marker 内追加
  - 交互成本 = 一句话 + 一次回车
- **Test scenarios**: eval case 覆盖正确回写/谣言拒绝/证据不足拒绝。

### U6. Eval 资产重建

- **Goal**: 将 27 个 eval case 精简为 8 个核心 case。
- **Files**: `skills/spec-project-rules/evals/trigger-cases.json`
- **保留 case**:
  1. bootstrap 正路（多端仓 → 产出带证据的知识库）
  2. 拒通用规范（准入三问拦截通识）
  3. 拒口头谣言（反向声称需代码证据）
  4. refresh no-op（无实质变化不重写）
  5. marker 共存（与用户已有内容安全合并）
  6. 单端降级（非 monorepo 也能产出最简知识库）
  7. 敏感信息（内网地址/密钥不进知识库）
  8. 大仓分批（>500 文件触发骨架先行+模块群）
- **Test scenarios**: 每个 case 红绿双向可证伪。

### U7. 消费机制与 CI 集成

- **Goal**: 实现 AGENTS.md pointer + CI advisory 检查。
- **Files**: `skills/spec-project-rules/references/knowledge-format.md`
- **Approach**:
  - pointer 一句话（含规则 id 引用要求）
  - CI 中 refs 存活扫描（纯确定性，PR comment 提示 stale 规则，不 fail build）
  - 不做 pre-commit 强制检查（规则是 advisory）
- **Test scenarios**: CI job 输出格式验证。

---

## Verification Contract

| 层级 | 验证项 | 通过标准 |
|---|---|---|
| 确定性脚本 | 单元测试 | 全绿（含 npm/Gradle/alias/verify/freshness） |
| 知识层格式 | 契约测试 | 四小节/marker/条目格式关键词断言 |
| 行为层 | skill-up eval | 8/8 通过（红绿双向） |
| 消费层 | AGENTS.md pointer | grep 验证 marker/pointer/规则 id 引用句存在 |
| 大仓 | hszq-app 快照 | 端到端执行完成（结构/边界/安全全过） |
| 治理面 | ce-localization 再生链 | verify ok + 全量 unit 全绿 |

## Definition of Done

1. U1–U7 全部完成且 Verification Contract 全项通过
2. hszq-app 实际仓 refresh：知识库更新为 v2 单文件格式
3. CHANGELOG 记录 v2 重构（含 v1 → v2 差异清单）
4. 六宿主 init 投影更新

---

## Key Technical Decisions

- 2026-08-29：五文件 → 一文件四小节（Agent 10 极简审查：维护面 1:5，消费效果相同）
- 2026-08-29：三模式 → 一模式两参数（scope + dry-run，消除模式判定序的复杂度）
- 2026-08-29：确定性层做拒绝、LLM 做祝福（Agent 2："deterministic shells, probabilistic cores"）
- 2026-08-29：证据链是唯一护城河（Agent 6 竞品分析：无竞品做证据阈值 + source refs + no-op 保护）
- 2026-08-29：回写只需一句话（Agent 8：任何更重的交互都会导致知识库石化）
- 2026-08-29：刷新用哈希不用模型（Agent 4：全部 evidence 未变 → no-op 零 token）

## Risks & Dependencies

- v1 产物不迁移：已有 docs/architecture/ 五文件的目标仓库需手动决定是否切换到 v2
- 大仓首跑仍需 2-3M tokens（L0 预计算可降低但无法归零——语义层仍需读代码）
- 效果证明依赖 field trial：规则 id 引用计数是唯一可观测指标，需 2 周真实使用数据
