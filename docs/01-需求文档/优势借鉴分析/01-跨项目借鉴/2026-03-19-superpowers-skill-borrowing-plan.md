# Superpowers Skill Borrowing Plan

> 目标：逐个分析 `/Users/kuang/xiaobu/superpowers/skills/*/SKILL.md`，提炼可借鉴能力，并映射到 `spec-first` 的可落地改造点。

**结论先行**
- `superpowers` 的核心价值不是“某个命令”，而是把 AI 研发工作流做成了可发现、可分工、可回放、可验证的 skill 集合。
- 对 `spec-first` 最值得借鉴的是：**技能发现机制、流程编排、并行拆分、工作区隔离、版本迁移、证据闭环、完成前验证**。
- 不建议原样照搬的是：**安装器/分发器心智、过重的平台目录侵入、把用户项目变成模板仓库**。
- 重要边界：`superpowers` 是**通用工作流 skill**，`spec-first` 是**阶段门控型研发流程 skill**。因此所有借鉴都应做“语义翻译”，不要把通用 skill 的控制语义直接搬成 `spec-first` 的硬门禁。

## 二、对照翻译原则

在把 `superpowers` 借给 `spec-first` 时，按以下方式翻译：

- `路由/发现 skill` → `feature / orchestrate / status / doctor / catchup`
- `计划/执行 skill` → `plan / task / code`
- `审查/验证 skill` → `review / verify`
- `收尾/交付 skill` → `archive / done / golive`
- `并行/隔离 skill` → `orchestrate / code` 的子任务调度能力
- `skill 编写/治理 skill` → `00-first` 和各 stage skill 的维护方法论

---

## 一、逐个 Skill 的借鉴映射

| Skill | 角色定位 | 值得借鉴的点 | 在 spec-first 中的映射 | 建议 |
|---|---|---|---|---|
| `using-superpowers` | 元技能：技能发现与优先级 | 先识别是否有 skill 可用；调用前置 skill；清晰的优先级规则；红旗反模式 | 对应 `feature / orchestrate / status / doctor / catchup` 一组路由型 skill；借它的不是“命令形态”，而是“先判断是否该走专门 skill” | **直接借鉴** |
| `brainstorming` | 需求澄清与设计前置 | 一次只问一个问题；先探索项目上下文；设计审批后才进入实现 | 作为 `spec / spec-review / design` 的前置门槛：先澄清、再设计、再落地 | **直接借鉴** |
| `writing-plans` | 将 spec 变成执行计划 | 任务拆分粒度细；明确文件责任；计划先于实现；Review loop | 作为 `plan / task` 的计划模板：文件级职责、任务级拆分、逐步验证 | **直接借鉴** |
| `executing-plans` | 计划执行器 | 批次执行、执行中复核、完成后收尾 | 作为 `spec-first` 的执行编排参考：计划可执行化、分批推进、阶段检查点 | **改造后借鉴** |
| `dispatching-parallel-agents` | 并行分发器 | 独立问题域并行；每个 agent 只负责一个 domain；避免共享状态 | 作为 `orchestrate / code / review` 的并行调度规范；在 `spec-first` 中必须受总并发上限约束，只并行独立域 | **直接借鉴** |
| `subagent-driven-development` | 子 agent 驱动开发 | 每个任务新 subagent；先 spec review 再 code review；两阶段质量门 | 作为 `code / review / verify` 的子任务执行与审查标准，尤其适合细粒度 TASK 实施 | **直接借鉴** |
| `using-git-worktrees` | 隔离工作区 | worktree 隔离；目录选择规则；忽略目录验证；基线测试 | 作为 feature/task 的隔离执行模型，避免主工作区污染 | **直接借鉴** |
| `systematic-debugging` | 根因分析 | 先证据后修复；trace data flow；按阶段收集证据 | 作为 `doctor/analyze/debug` 类 skill 的默认方法论 | **直接借鉴** |
| `test-driven-development` | 代码实现前的测试纪律 | 红-绿-重构；先看到失败；最小实现；不写无测试代码 | 作为 `07-code / 12-verify` 的质量纪律；在 `spec-first` 里应保留“证据先行”，但不要把它误写成无条件硬门禁 | **改造后借鉴** |
| `verification-before-completion` | 完成前验证 | 任何“完成”都要有新鲜证据；不能凭感觉宣布完成 | 作为 `verify/archive/finish` 的统一完成门槛 | **直接借鉴** |
| `requesting-code-review` | 主动请求审查 | 每个任务/重大变更都要审查；用基线 SHA 对比 | 作为 `review` 的标准收口流程 | **直接借鉴** |
| `receiving-code-review` | 接收审查反馈 | 先验证再接受；不做表演性认同；逐条处理 | 作为团队协作规范，减少“盲改”与“假认同” | **直接借鉴** |
| `writing-skills` | skill 编写方法 | 把 skill 文档本身当作 TDD 对象；用压力场景验证 skill 是否有效 | 作为 `spec-first` 自身 skill 迭代的方法论，特别适合更新 `00-first` 一类核心 skill | **直接借鉴** |
| `finishing-a-development-branch` | 收尾与分支交付 | 测试通过后再给出 merge/PR/保留/丢弃选项；显式收尾 | 作为 `archive / done / golive` 的收口模板，重点借“显式收尾”和“完成选项”，不要照搬 Git 分支发布语义 | **改造后借鉴** |

---

## 二、按能力域归类

### 1) 技能发现与执行原则

可直接借鉴：
- `using-superpowers`
- `brainstorming`
- `verification-before-completion`

`spec-first` 映射：
- 进入任何 stage 前先识别适用 skill（更像 `feature / orchestrate` 的路由逻辑）
- 设计类任务先澄清再实施（对应 `spec / spec-review / design`）
- 任何“完成”都要求证据（对应 `verify / archive`）

### 2) 计划与执行

可直接借鉴：
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`

`spec-first` 映射：
- 将 `spec/design/task` 拆成可执行块
- 每块有清晰文件边界与 traces
- 每个任务有检查点和回审，必要时通过 `orchestrate` 收口

### 3) 并行与隔离

可直接借鉴：
- `dispatching-parallel-agents`
- `using-git-worktrees`

`spec-first` 映射：
- 多子任务并行时，按问题域拆分，并受总并发上限约束
- 特征/任务在隔离工作区执行是可选增强，不应成为所有场景默认强制
- 避免共享状态污染

### 4) 质量控制

可直接借鉴：
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `receiving-code-review`
- `finishing-a-development-branch`

`spec-first` 映射：
- 调试先找根因，不做猜测式修复
- 实现前先写失败测试，但保持在 `code / verify` 的证据链里，而不是把 TDD 误升格为跨阶段硬门
- 审查是主动动作，不是事后补票
- 完成前必须有可验证证据

### 5) skill 生产与治理

可直接借鉴：
- `writing-skills`

`spec-first` 映射：
- 核心 skill 文档本身也要做 RED-GREEN-REFACTOR
- 新增/修改 skill 前先定义压力场景和失败模式

---

## 三、哪些不建议原样照搬

| 领域 | 不建议照搬的内容 | 原因 | spec-first 的替代做法 |
|---|---|---|---|
| 安装/分发 | 平台模板大规模复制、复杂更新器、强侵入目录结构 | 容易把系统做成“安装器”，不是“流程 skill” | 保持轻量入口，聚焦 skill 与 runtime 合同 |
| 工作流 | 过多平台差异化脚手架 | 会增加维护成本和用户理解成本 | 统一 skill 边界，尽量少暴露内部目录 |
| 更新机制 | 过多自动覆盖、复杂迁移提示 | 容易把用户改动淹没 | 只在必要时做迁移，优先保留用户编辑 |

---

## 四、对 spec-first 的具体可落地建议

### P0：直接可借

1. **把 skill 发现机制产品化**
   - 入口先判断是否应调用对应 skill
   - 说明“何时用、何时不用、前置条件是什么”

2. **把计划拆分成文件级任务**
   - 对应 `writing-plans`
   - 每个任务限定文件、输入、输出、验证

3. **把完成门槛做成“证据先行”**
   - 对应 `verification-before-completion`
   - 所有“完成”都必须有新鲜证据

4. **把并行任务做成显式编排**
   - 对应 `dispatching-parallel-agents`
   - 只并行独立域，禁止共享状态冲突

### P1：需要改造后借

1. **worktree 隔离**
   - 适合 feature/task/review 场景
   - 但要避免像安装器那样过度侵入项目结构

2. **版本化模板与迁移**
   - 适合 `spec-first` 的 skill / runtime schema 演进
   - 但要控制迁移复杂度

3. **收尾分支流程**
   - 把“完成 / 合并 / 保留 / 丢弃”做成标准出口
   - 不要把它做成繁重的发布器

### P2：不建议照搬

1. **安装器式产品定位**
2. **过重的平台目录管理**
3. **把用户项目变成模板仓库**

---

## 五、推荐落地顺序

1. 先借 `using-superpowers`、`brainstorming`、`verification-before-completion`
2. 再借 `writing-plans`、`executing-plans`、`subagent-driven-development`
3. 然后借 `dispatching-parallel-agents`、`using-git-worktrees`
4. 最后补 `systematic-debugging`、`test-driven-development`、`requesting-code-review`、`receiving-code-review`、`finishing-a-development-branch`

---

## 六、最终判断

`superpowers` 最值得借鉴的不是“功能清单”，而是它把研发流程拆成了**可发现、可编排、可并行、可审计、可收尾**的一组 skill。

对 `spec-first` 来说，最佳借鉴路径不是复制它的安装器壳，而是吸收它的流程纪律：

- 用 skill 表达“什么时候做什么”
- 用计划表达“怎么做”
- 用 worktree / subagent 表达“并行怎么做”
- 用测试 / review / verification 表达“怎么证明做对了”

### 最终审查修正

- `test-driven-development` 不宜原样视为“所有实现场景的直接借鉴”，在 `spec-first` 中更适合作为 `code / verify` 的实施纪律，而不是新门禁。
- `dispatching-parallel-agents` 必须加上 `spec-first` 的并发上限和独立域约束，否则会和当前编排口径冲突。
- `using-superpowers` 在 `spec-first` 里最有价值的是“先路由到正确 skill”，而不是“把通用 skill 的控制流原样搬过来”。
