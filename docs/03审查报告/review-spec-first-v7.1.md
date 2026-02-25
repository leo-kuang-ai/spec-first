# Spec-First v7.1 需求文档审查报告

> **审查对象**: `/docs/01需求文档/v2` (v7.1 版本)
> **审查日期**: 2026-02-09
> **审查视角**: 建立仅采用 Skill 命令模式（No-CLI for Users）的公司级研发流程

---

## 审查结论

**架构高度可行，需强化"异常流"与"人机交互协议"**。

v7.1 版本明确了 **"Skill 驱动编排，CLI 原子执行"** 的双层架构，这为"只采用 Skill 模式"提供了坚实的理论基础。定义的 14 个 Skill (`/spec-first:xxxx`) 覆盖了从立项到归档的全生命周期，逻辑闭环完整。

---

## 一、 亮点与优势 (Strengths)

1.  **入口收敛极致化**
    *   **设计**：用户侧完全屏蔽了复杂的 CLI 参数（如 `spec-first id next FR ...`），统一收敛为自然语言驱动的 Skill（如 `/spec-first:spec`）。
    *   **价值**：极大降低了全员推广的门槛。研发人员不需要记 30+ 个 CLI 命令，只需记住 "我在什么阶段，就调什么 Skill"。

2.  **"5 阶段执行模型" 是落地关键**
    *   **设计**：`Context加载 -> AI推理 -> 用户确认 -> 写入交付物 -> 副作用执行` 的标准模型。
    *   **价值**：这是"Skill 模式"能落地的关键。它强制引入了 **Phase 3 用户确认** 环节，解决了 AI "瞎改代码" 或 "乱造 ID" 的信任问题，使得 Skill 不仅仅是脚本，而是"带审核的智能工单"。

3.  **全链路追踪的"隐形化"**
    *   **设计**：ID 的生成与关联（Traceability Matrix）被封装在 Skill 的 `Phase 4/5` 自动完成。
    *   **价值**：用户无感。开发者只需关注"实现任务"，背后的 `FR -> Task -> PR` 追踪链条由 Skill 自动维护，解决了"流程太重无人执行"的通病。

---

## 二、 风险与缺口分析 (Critical Gaps)

虽然主流程（Happy Path）设计完美，但在公司级实战中，以下 **"异常流"** 和 **"交互细节"** 存在风险：

### 1. "拒绝与修改" 的交互协议未定义清晰
*   **场景**：用户调用 `/spec-first:spec`，AI 生成了 10 条需求。用户发现其中 2 条不对，3 条漏了。
*   **缺口**：缺少 **"交互式修正协议"**。
    *   *是直接在聊天框打字 "第3条不对，改成..."？*
    *   *还是 AI 生成一个临时文件让用户去改？*
*   **风险**：如果 AI 听不懂用户的修正指令，用户会因为无法通过 Skill 完成任务而被迫去手动改文件，流程就会崩坏。

### 2. "逆向变更" 的路径过长
*   **场景**：在 `04_Implement` 写代码时，发现 `01_Specify` 的需求有逻辑漏洞。
*   **当前流程**：暂停开发 -> 提 RFC -> 改 Spec -> 改 Design -> 改 Task -> 回到开发。
*   **风险**：对于"小步快跑"的团队，这个链条太重。大家会倾向于跳过流程直接改代码，导致文档与代码脱节。

### 3. Context Pack 的"上下文窗口"爆炸风险
*   **场景**：项目进行到后期，`traceability-matrix.md` 和 `spec.md` 可能非常巨大。
*   **风险**：Skill 依赖 Context Pack 恢复上下文。如果 Context Pack 超过 LLM 的窗口限制（或导致推理变慢、变傻），Skill 模式将不可用。

---

## 三、 落地建议 (Actionable Recommendations)

为了确保"只采用 Skill 模式"成功，建议在 v7.1 基础上补充以下执行细节：

### 1. 强化 `Phase 3` 的交互设计 (针对 Skill Prompt)
在 Skill 的 Prompt (`.md` 文件) 中，必须明确教 AI 如何处理用户的反馈：
> **[Instruction for AI]**
> 在 Phase 3 展示生成内容后，必须询问用户："是否接受？(Y/N) 或 直接输入修改意见"。
> 如果用户输入修改意见，你必须：
> 1. 根据意见**重新生成**完整内容。
> 2. 再次进入 Phase 3 等待确认。
> 3. 禁止在用户未明确输入 "Y" 或 "确认" 前进入 Phase 4。

### 2. 新增 `Hotfix` / `Sync` 机制
建议在 `/spec-first:verify` 或独立增加一个轻量级 Skill：
*   **Command**: `/spec-first:sync <file_path>`
*   **Logic**: "我手动修改了这个文件（如代码或Spec），请帮我**反向更新**相关的 ID、矩阵状态和上/下游文档，使它们保持一致。"
*   **价值**：承认"人有时候比流程快"，用 AI 来做"善后工作"，而不是强迫人被流程卡住。

### 3. 明确 "Session Catchup" 的触发体验
用户不需要手动敲 `/spec-first:catchup`。
*   **建议**：在 `.claude/hooks/session-start.js` 中配置，每次新会话开始，**自动静默运行** Catchup 逻辑，并仅在发现异常（如文件状态不一致）时才主动弹窗提示。做到"无感连接"。

### 4. Context Pack 动态剪裁
Context Pack 需要 **"动态剪裁策略"**。例如在 `:code` 阶段，只加载当前 Task 相关的 Spec 和 Design，而不是全量加载。

---

## 四、 总结

这套方案**完全具备公司级推广的潜力**。它用 AI (Skill) 填平了"规范"与"执行"之间的巨大鸿沟。

**下一步行动建议**：
1.  **锁定 v7.1 文档**，不再做大的架构调整。
2.  **优先实现 `spec-first init` (CLI) 和 `/spec-first:init` (Skill)**，因为这是门槛。
3.  **重点测试 `Phase 3` 的交互体验**，这是用户是否会"弃用 Skill 转回手动模式"的决定性瞬间。

---

## 五、 修复方案（Best Practice）

> 以下方案针对第二章 3 个风险缺口 + 第三章 4 条建议，合并为 4 个修复项。
> 每项标注与现有规范的对齐关系和落地位置。

### 方案 1：Phase 3 交互协议（覆盖 Gap-1 + Rec-1）

**现状**：`aux-01` L197-198 仅写"等待用户确认 / 修改 / 拒绝"，未定义具体交互流程。

**修复**：在 `aux-01-skill-system.md` 的"5 阶段执行模型"章节中，将 Phase 3 扩展为正式交互协议。

**Phase 3 交互协议（强制）**：

```text
┌─────────────────────────────────────────────┐
│  AI 生成内容（Phase 2 输出）                   │
│  ↓                                           │
│  完整 Markdown 展示 + 末尾操作提示             │
│  "请确认以上内容 (Y / 修改意见 / N)"           │
│  ↓                                           │
│  用户响应 ─┬─ ✅ 确认 ("Y"/"确认"/"OK")       │
│            │    → 进入 Phase 4                │
│            ├─ ✏️ 局部修改 (自然语言描述修改点)  │
│            │    → AI 重新生成 → 重回 Phase 3   │
│            ├─ 🔄 重做 ("重新生成"/"换个方案")   │
│            │    → 回退 Phase 2 重新推理        │
│            └─ ❌ 拒绝 ("N"/"取消")             │
│                 → 终止 Skill，不写入任何文件    │
└─────────────────────────────────────────────┘
```

**约束规则**：

| 规则 | 说明 |
|------|------|
| 迭代上限 | 同一 Skill 执行中 Phase 3 最多 **3 轮**，超限提示用户直接编辑文件 |
| 展示完整性 | 每轮修改后必须展示**完整内容**（非 diff），避免用户丢失上下文 |
| 禁止静默写入 | Phase 3 未收到明确确认前，禁止进入 Phase 4 |
| Skill Prompt 模板 | 所有 Skill `.md` 文件必须包含 Phase 3 交互指令段 |

**Skill Prompt 模板必含段**：

```markdown
## Phase 3 — 用户确认
展示生成的完整内容后，输出：
> 请确认以上内容 (Y / 修改意见 / N)
- 用户输入修改意见 → 根据意见重新生成完整内容，再次展示并等待确认
- 用户输入 "Y" 或 "确认" → 进入 Phase 4
- 用户输入 "N" 或 "取消" → 终止，不写入文件
- 最多迭代 3 轮，超限提示："建议直接编辑文件后运行 /spec-first:verify"
```

---

### 方案 2：逆向变更快速通道（覆盖 Gap-2 + Rec-2）

**现状**：`core-05` L117-123 已定义 Minor/Major/Critical 三级变更，Minor 有"快速通道"。但审查指出：在 Skill 执行过程中发现上游问题时，切出去走 RFC 链条太重。

**核心思路**：不新增 Skill，而是在现有机制中打通两条快捷路径。

#### 路径 A：Skill 内联修正（Minor 级）

当阶段 Skill 执行中发现上游产物有小问题（影响 ≤2 个产物）：

```text
Skill 执行中（如 /spec-first:code）
  ↓ AI 检测到 spec.md 某条 FR 描述有歧义
  ↓
  Phase 2 中断 → 生成修正建议（含影响范围）
  ↓
  Phase 3 展示："发现上游问题，建议修正如下：..."
  ↓ 用户确认
  ↓
  自动执行：
    1. 修改上游产物（spec.md）
    2. 自动生成 Minor RFC 记录（仅归档，无审批流）
    3. 增量 SCA（spec-first matrix check）
    4. 回到原 Skill 继续执行
```

**判定条件**：影响产物 ≤2 个 且 不触及 Constitution → 走内联修正。否则暂停并引导用户走标准 RFC。

#### 路径 B：`/spec-first:verify --sync`（手动修改后反向同步）

用户绕过 Skill 直接手动编辑了文件，需要反向更新关联产物：

```text
用户：/spec-first:verify <featureId> --sync <changed-file>

Phase 1 — 读取变更文件，基于追踪链定位影响范围
Phase 2 — 生成关联产物的修正建议
Phase 3 — 展示影响范围 + 修正内容，等待确认
Phase 4 — 批量更新关联产物 + 生成 Minor RFC 记录
Phase 5 — 增量 SCA 校验
```

**落地位置**：

*   路径 A → 写入 `aux-01` 的 5 阶段执行模型，作为 Phase 2 的异常分支
*   路径 B → 写入 `aux-01` 命令速查表（`/spec-first:verify` 增加 `--sync` 参数）+ `core-05` 变更管理章节补充说明
*   两条路径均自动生成 Minor RFC 记录，确保变更可追溯

---

### 方案 3：Session Catchup 自动触发（覆盖 Rec-3）

**现状**：`aux-01` L271 已写"也可由编排 Skill 在检测到上下文缺失时自动调用"，但触发机制未具体化。

**修复**：定义三层触发策略，从自动到手动逐级覆盖。

| 层级 | 触发方式 | 触发时机 | 用户感知 |
|------|---------|---------|---------|
| L1 自动静默 | `session-start` Hook | 每次新会话开始 | 无感；仅异常时弹提示 |
| L2 编排内置 | 编排 Skill Phase 1 | `:plan` / `:verify` / `:orchestrate` 启动时 | 无感；自动检测上下文完整性 |
| L3 手动调用 | `/spec-first:catchup` | 用户主动触发 | 有感；用于跨设备/长中断场景 |

**L1 Hook 配置示例**（`.claude/hooks/session-start.js`）：

```javascript
// 静默执行 catchup，仅异常时输出
const result = await exec('spec-first stage current <featureId>');
if (result.exitCode !== 0 || result.stateInconsistent) {
  notify('⚠️ 检测到状态不一致，正在自动恢复...');
  await exec('/spec-first:catchup <featureId>');
}
```

**L2 编排检测逻辑**：

```text
编排 Skill Phase 1（Context 加载）
  ├── 读取 stage-state.json
  ├── 读取 stage-state.json
  ├── 比对两者一致性
  ├── 一致 → 正常继续
  └── 不一致 → 自动调用 catchup 7 步恢复 → 恢复后继续
```

**落地位置**：`aux-01` Session Catchup 机制章节补充触发策略表

---

### 方案 4：Context Pack 动态剪裁（覆盖 Gap-3 + Rec-4）

**现状**：`aux-01` L241 定义 Context Pack `<2KB`，但这仅是元数据。Phase 1 实际加载的产物内容无大小约束，后期项目膨胀时可能超出 LLM 窗口。

**核心思路**：阶段感知 + 任务粒度 + 摘要降级，三层递进裁剪。

#### 层 1：阶段感知加载

不同阶段只加载必要产物，跳过无关文件：

| 当前阶段 | 全量加载 | 按需加载 | 跳过 |
|---------|---------|---------|------|
| 01_specify | constitution | spec（Mode I 历史版本） | design, tasks, test |
| 02_design | constitution, spec | — | tasks, test |
| 03_plan | spec, design, contracts | — | test |
| 04_implement | task_plan（当前 task）, contracts | design（相关 API 段落） | spec 全文, test |
| 05_verify | spec（AC 部分）, task_plan | test | design 全文 |
| 06_wrap_up | 全量（归档需要） | — | — |

#### 层 2：任务粒度裁剪（04_implement / 05_verify）

在实现和验证阶段，按当前 Task 的追踪链反向裁剪：

```text
current_task: TASK-AUTH-003
  ↓ 反向追溯
related_frs: [FR-AUTH-001, FR-AUTH-003]
  ↓ 正向定位
加载内容：
  - spec.md 中 FR-AUTH-001、FR-AUTH-003 及其 AC 段落（非全文）
  - design.md 中对应 API 契约段落
  - contracts/ 中相关接口定义文件
  - task_plan.md 中当前 task 行
```

**Token 预算**：单次 Phase 1 加载 ≤ **8K tokens**（不含用户代码文件）。超预算时自动降级到层 3。

#### 层 3：摘要降级

当产物文件超过 **500 行**时，Phase 1 不加载全文，改为加载摘要版：

| 摘要内容 | 说明 |
|---------|------|
| 标题结构 | 各章节标题（H1-H3） |
| ID 清单 | 所有 FR/NFR/API/TASK ID 列表 |
| 当前任务段落 | 与 `current_task` 相关的完整段落 |

AI 在 Phase 2 推理过程中如需全文细节，可按需读取特定段落（lazy load），而非一次性全量加载。

#### Context Pack 元数据扩展

在现有 `context-pack.yaml` 中新增 `loading_strategy` 字段：

```yaml
context_pack:
  version: "1.1"                          # 版本升级
  feature_meta:
    id: "FSREQ-20260209-AUTH-001"
    mode: N
    size: M
    platforms: [h5, java-backend]
  loading_strategy:                        # 新增
    mode: "task-scoped"                    # task-scoped | stage-scoped | full
    token_budget: 8192                     # Phase 1 加载上限（tokens）
    related_frs: ["FR-AUTH-001"]           # 当前任务关联的 FR（task-scoped 时必填）
  artifacts:
    spec: "specs/<featureId>/spec.md"
    design: "specs/<featureId>/design.md"
    tasks: "specs/<featureId>/task_plan.md"
    matrix: "specs/<featureId>/traceability-matrix.md"
  constitution: "constitution.md"
  current_phase: "04_implement"
  current_task: "TASK-AUTH-003"
```

**落地位置**：`aux-01` Context Pack 标准章节，版本从 1.0 升级到 1.1

---

## 六、 落地总表

| # | 方案 | 覆盖问题 | 修改文件 | 变更类型 |
|---|------|---------|---------|---------|
| 1 | Phase 3 交互协议 | Gap-1 + Rec-1 | `aux-01-skill-system.md` | 扩展现有章节 |
| 2a | Skill 内联修正（Minor） | Gap-2 + Rec-2 | `aux-01-skill-system.md` | 扩展 5 阶段模型 |
| 2b | `/spec-first:verify --sync` | Gap-2 + Rec-2 | `aux-01` 命令速查 + `core-05` 变更管理 | 新增参数 |
| 3 | Session Catchup 三层触发 | Rec-3 | `aux-01-skill-system.md` | 扩展现有章节 |
| 4 | Context Pack 动态剪裁 | Gap-3 + Rec-4 | `aux-01-skill-system.md` | 扩展 + 版本升级 1.0→1.1 |

**设计原则**：

*   **不新增 Skill**：14 个 Skill 数量不变，通过扩展现有 Skill 能力（verify --sync）和完善执行模型（Phase 3 协议、内联修正）解决问题
*   **不破坏架构**：所有方案在"Skill 驱动 + CLI 执行"双层架构内闭环，不引入新的架构概念
*   **渐进式落地**：方案 1（Phase 3 协议）是最高优先级，直接影响用户体验；方案 4（动态剪裁）可在项目规模增长后再实施