---
version: 1.0.0
last_updated: 2026-03-21
description: Spec-First Skills 共享约束与规则（消除重复）
---

# Spec-First Skills 共享约束

> 本文件汇集跨 Skill 的共享规则，各 Skill 通过引用使用，避免 25% 内容重复。

## 字面即精神原则（Literal is Spirit）

**Violating the letter of these rules is violating the spirit of these rules.**

### 反合理化表（统一版）

| AI 的借口 | 封堵 |
|-----------|------|
| "我理解核心思想，可以灵活执行" | 字面规则的违反就是精神的违反，不存在灵活变通 |
| "这是精神而非仪式" | 仪式（字面规则）是精神的体现，跳过仪式就是违背精神 |
| "实质重于形式" | 在流程守卫上，形式（字面规则）= 实质（精神） |
| "具体情况具体分析" | 规则已考虑常见情况，例外需明确讨论而非自行变通 |

**应用 Skills**: 03-spec, 04-design, 06-task, 07-code, 12-verify

---

## 反合理化守卫表（按 Skill）

### spec 专属守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "需求很清楚，不需要澄清" | 你认为清楚 != 无歧义，检查 NEEDS CLARIFICATION 项 |
| "AC 用自然语言就够了" | 自然语言 AC 难以自动转化为测试用例 |
| "这个 NFR 不重要，先跳过" | 跳过 NFR = 埋下技术债，至少标记为 P2 |
| "用户没提到边界情况" | 用户不提 != 不存在，主动识别是 spec 的职责 |
| "先写个大概，后面再细化" | 模糊 spec 会放大后续设计与实现成本 |

### code 专属守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "这个改动太小，不需要走 review" | 小改动也有回归风险，review 耗时 < 2 分钟 |
| "我已经手动检查过了" | 手动检查 != 自动校验证据 |
| "先写完再补测试" | 事后测试证明不了什么，测试应与改动配套 |
| "这只是重构，不影响功能" | 重构不改行为 != 重构不引入 bug |
| "快速修一下，之后再调查" | 快速修复掩盖根因，系统化调试更快 |
| "我看到问题了，让我直接修" | 看到症状 != 理解根因 |
| "同时改多处，一起测试" | 无法隔离哪个改动有效，会引入新 bug |
| "再试一次修复"（已失败 2+ 次） | 3 次失败 = 架构问题，停止修复并升级 |
| "我记得刚才看到的内容" | 上下文会被压缩，记忆不可靠，重要信息必须落盘 |

### orchestrate 专属守卫

| AI 的借口 | 封堵 |
|-----------|------|
| "先把后续批次跑完再统一看" | 无检查点就不可审计，必须批次收口后再继续 |
| "这个阻塞先忽略，后面一起修" | 阻塞项不清零不得推进批次 |
| "只要大方向没问题就能 advance" | stage advance 只能基于证据铁律，不接受方向性判断 |

---

## 文件系统即外部记忆（Filesystem as External Memory）

### 统一原则

- Context Window = RAM（易失），Filesystem = Disk（持久）
- 未落盘的信息一律视为不可靠上下文，不得作为"已完成/已验证"依据
- 每连续 2 个关键动作后，必须更新 `findings.md`
- 会话中断前，至少写入：当前 TASK、阻塞点、下一步命令

### 最小落盘字段

| 字段 | 说明 |
|------|------|
| 当前结论 | 本次会话确定的要点 |
| 证据路径 | 文件路径 / 命令输出位置 |
| 下一步动作 | 含阻塞项 |

### Read/Write 决策矩阵

| 场景 | 决策 | 原因 |
|------|------|------|
| 刚写完一个文件 | 不立即重读 | 内容仍在当前上下文，可减少无效 I/O |
| 开始新 TASK | 先读 task_plan.md 与 findings.md | 重新定向上下文 |
| 浏览器/MCP 返回结果 | 立即写入 findings.md | 外部数据不持久 |
| 查看图片/PDF/网页 | 先摘要后写盘 | 多模态内容易在压缩时丢失 |
| 发生错误或测试失败 | 先读相关文件与最近变更 | 修复前必须确认当前状态 |
| 长间隔后恢复工作 | 读运行态文件再操作 | 防止基于旧记忆做错误修改 |

**应用 Skills**: 全部 Skills（统一约束）

---

## Skill 默认执行模型（P0-P5）

以下流程是 **默认模板**，只适用于会生成/修改 Feature 交付物的产物型 skill。
它不是全部 skill 的强制统一流程；路由型、只读诊断型和宿主修复型 skill 必须在各自 `SKILL.md` 中声明例外。

```text
P0_LOCATE — 定位与校验
  ├── 定位 Feature 工作区（specs/<featureId>/）
  └── 校验当前阶段是否允许执行该 Skill

P1_CONTEXT — 上下文加载
  ├── spec-first ai context <featureId>（获取 Context Pack）
  └── 读取阶段相关交付物

P2_GENERATE — AI 推理生成
  └── 根据 SKILL.md 指令生成内容（纯 AI 推理，无 CLI 调用）

P3_CONFIRM — 用户确认
  └── 展示生成内容，等待用户确认 / 修改 / 拒绝

P4_WRITE — 写入交付物
  ├── 写入目标文件
  └── spec-first id next <type> <abbr>（注册新 ID）

P5_SIDE_EFFECT — 副作用执行
  ├── spec-first docs links validate <featureId>（校验文档关联索引）
  ├── spec-first gate check <featureId>（校验 Gate）
  └── 更新运行态文件（findings.md / task_plan.md）
```

**默认适用 Skills**: 03-spec, 04-design, 06-task, 07-code, 08-review, 10-archive, 12-verify, 20-spec-review

## Skill 类型例外表

| Skill 类型 | 代表 Skill | P3_CONFIRM | P4_WRITE | findings.md | stage advance | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 产物生成型 | 03-spec / 04-design / 06-task / 07-code / 10-archive / 20-spec-review | 必须 | 允许写 Feature 交付物 | 必须 | 仅部分允许 | 使用默认 P0-P5 模板 |
| 只读诊断型 | 11-plan / 12-verify / 14-status / 21-analyze | 视 confirm policy | 不写交付物 | 建议或必须按各自声明 | 不允许，verify 只提供证据 | 可以写运行态摘要，但不应伪装成产物写入 |
| 路由控制型 | 02-catchup / 13-orchestrate / 16-sync / 17-feature | 按各自声明 | 只允许写运行态或控制面文件 | 必须按各自声明 | 仅 orchestrate 允许 | 不强制套用 `id next` 或产物生成流程 |
| 宿主修复型 | 15-doctor | assisted | 不写项目交付物，可更新宿主配置 | 不要求写 Feature findings | 不允许 | 作用域是用户环境，不是 Feature 工作区 |

## 声明位置约定

为避免“共享规则存在，但单 skill 不知道该写在哪里”，各 skill 至少应在以下位置显式声明共享契约的落点：

| 需要声明的内容 | 建议位置 | 示例 |
| --- | --- | --- |
| `confirm_policy` | frontmatter 顶层字段 | `confirm_policy: auto` |
| skill 类型（产物型 / 路由型 / 只读诊断型 / 宿主修复型） | `## Skill 类型与确认策略` 小节 | `类型：路由控制型` |
| 是否套用默认 `P0-P5` | `## Skill 类型与确认策略` 或执行流程前 | `不套用默认产物型 P0-P5` |
| 共享契约引用位置 | 靠近相关规则的小节开头 | `本 skill 遵循 ../shared/background-quality-contract.md` |
| 例外行为 | 紧跟共享契约引用后说明 | `只写运行态，不写正式交付物` |

最小示例：

```markdown
## Skill 类型与确认策略

- 类型：路由控制型
- confirm_policy: `auto`
- 不套用默认产物型 `P0-P5`
- 只允许写运行态或控制面文件
```

---

## 确认策略（Confirm Policy）

| policy | P3 行为 | 适用场景 |
| --- | --- | --- |
| auto | 跳过用户确认，P2 完成后直接进入 P4 | 只读/低风险操作 |
| assisted | 展示生成内容摘要，用户可确认、修改或拒绝 | 中等风险操作 |
| strict | 展示完整生成内容，用户必须逐项审阅后确认 | 高风险操作 |

- `auto` 的 Skill 不应写入关键交付物，仅允许写入运行态文件
- `assisted` 和 `strict` 的 Skill 在用户拒绝时必须回退至 P2 重新生成

---

## 错误处理规则（统一版）

| 阶段 | 错误场景 | 处理方式 |
| --- | --- | --- |
| P0 | 阶段不匹配 | 终止执行，告知用户当前阶段和 Skill 要求的阶段 |
| P0 | Feature 不存在 | 终止执行，建议用户先执行 `spec-first init` |
| P1 | 上下文文件缺失 | 警告用户缺失文件，询问是否继续（降级执行） |
| P2 | 生成内容为空或不完整 | 告知用户生成失败，建议检查输入上下文 |
| P3 | 用户拒绝 | 回退至 P2，根据用户反馈修改后重新展示 |
| P3 | 用户连续拒绝 3 次 | 终止执行，建议用户手动完成或调整需求 |
| P4 | 文件写入失败 | 终止执行，不执行 P5，告知用户错误原因 |
| P4 | CLI 命令失败 | 终止执行，展示 CLI 错误输出 |
| P5 | 副作用执行失败 | 不回滚 P4 已写入的文件，但警告用户副作用未完成 |

**应用 Skills**: 全部 Skills

---

## 文档图示约定（全局）

- `skills/spec-first` 目录下的 Skill、共享文档与参考文档，在需要表达流程、调用链、架构、时序或 ER 关系时，统一使用 ASCII 文本图或表格，不使用 Mermaid
- 复杂关系优先拆成列表、矩阵和 ASCII 树形结构，避免依赖渲染器才能理解内容


---

## 2-Action Rule（通用落地规则）

- 每连续完成 2 个关键动作（读外部信息、改文档/代码、跑验证）后，必须把结论写入 `findings.md`
- 若中断会话，至少留下：当前 TASK、阻塞点、下一步命令
- 未落盘的信息一律视为不可靠上下文

**应用 Skills**: 03-spec, 06-task, 07-code, 13-orchestrate

---

## Handoff Next Steps（P2-06）

每个 Skill 在结束输出时必须追加 `Next Steps` 小节，至少包含：
- 下一条建议命令（如 `spec-first stage advance <featureId>` 或下阶段 Skill）
- 触发条件（何时执行该命令）
- 若存在阻塞项，给出先决修复命令

**应用 Skills**: 全部 Skills

---

## Worktree First（P1-16）

高风险任务（大范围重构、跨模块联动、并行修复实验）默认建议在独立 worktree 执行：
- 主工作区仅用于稳定路径与结果汇总，减少上下文与改动污染
- 最小流程：`git worktree add ../worktree-<TASK-ID> <branch>` → 在独立 worktree 中实现与验证 → 合并回主工作区

**应用 Skills**: 07-code, 08-review

---

## 3-Strike Error Protocol（P1-05）

- 同类错误连续失败 3 次后，禁止继续"再试一次"
- 必须升级到架构审查或方案重设计
- 升级动作与结论必须写入 `findings.md`

**应用 Skills**: 07-code

---

## 版本信息

- **版本**: 1.0.0
- **最后更新**: 2026-03-18
- **变更历史**:
  - 1.0.0 (2026-03-18): 初始版本，提取 25% 重复内容到共享约束
