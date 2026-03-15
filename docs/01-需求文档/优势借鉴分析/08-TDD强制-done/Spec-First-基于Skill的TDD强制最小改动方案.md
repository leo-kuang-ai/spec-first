# Spec-First 基于 Skill 的 TDD 强制最小改动方案

> 分析日期：2026-03-15
>
> 目标：在不大改 CLI / Gate / Hook / runtime 的前提下，基于现有 Skill 体系增强 TDD 强制
>
> 约束：最小范围改动，优先复用已有 `code / status / catchup / review` 能力
>
> 额外约束：**必须同步审查并复用 `skills/spec-first/07-code/references/` 下已有真理源，不重新发明第二套 TDD 口径**

---

## 一、问题定义

当前 Superpowers 的 TDD 强制，本质上属于：

> **高压纪律版的方案 A：纯 Skill 文案强制**

它很强，但强在：

- 流程约束
- 反合理化
- RED → GREEN → REFACTOR 的行为规范

它不强在：

- CLI 阻断
- Gate 证据校验
- 结构化 TDD artifact
- Hook 级验真

Spec-First 当前如果要在**最小改动**前提下增强 TDD 强制，最合理的策略不是直接上完整方案 C，而是：

> **先把 Skill 级 TDD 强制做实、做细、做可见。**

也就是先把“软约束”提升为“高压软约束 + 流程显式化 + 恢复可见化”，再决定是否进入系统级硬门禁。

---

## 二、最小改动原则

本方案明确不做以下事情：

- 不新增 `spec-first tdd ...` CLI 命令
- 不新增新的 Gate condition registry
- 不新增 `specs/{featureId}/tdd/` artifact
- 不修改现有 `stage-state.json` schema
- 不引入新的 git hook 阻断逻辑

本方案只做以下几类变更：

1. 强化 `code` skill 的 TDD 预检与执行协议
2. 强化 `status` skill 对 TDD 风险的展示
3. 强化 `catchup` 输出中的 TDD 恢复信息
4. 强化 `review/verify` 的 TDD 审查问题模板
5. 将 TDD WAIVER 规则从模糊文字变成清单化规则
6. 所有新增建议都必须优先兼容：
   - `skills/spec-first/07-code/references/tdd-guard.md`
   - `skills/spec-first/07-code/references/report-template.md`
   - `skills/spec-first/07-code/references/test-template.md`

一句话：

> **先让 agent 不能轻易跳过 TDD，再让用户和审查者能看见它是否跳过。**

---

## 三、方案定位

### 3.1 它属于哪种方案

在《Spec-First-TDD强制详细参考方案.md》的三种方案里，本方案属于：

> **方案 A 的加强版**

但不是普通方案 A，而是：

> **A+：Skill 强制 + 恢复可见 + 审查显式 + WAIVER 清单化**

### 3.2 为什么推荐先做 A+

因为当前 Spec-First 已经具备以下基础：

- `code` skill 已有 “必须先做 TDD 预检” 和 “必须有 RED 证据或 WAIVER” 的表述
- `status` skill 已能展示 TDD 风险提示
- `catchup` 已具备恢复框架
- `review`/`verify` 可以承载固定检查清单

这意味着：

> 不必先改底层系统，就能先把 TDD 执行质量大幅抬高。

### 3.3 当前 `07-code/references` 审查结论

当前 `skills/spec-first/07-code/references/` 目录下已存在以下与 TDD 强制直接相关的真理源：

- `tdd-guard.md`
- `report-template.md`
- `test-template.md`
- `context-pack-schema.yaml`
- `code-standards.md`

其中最关键的是：

#### `tdd-guard.md`

它已经明确了当前运行时口径：

- 真理源是 `src/core/batch-executor/guards.ts`
- 批量预检扫描 `specs/{featureId}/findings.md`
- 预检通过条件是：
  - 存在 `[TDD-RED] TASK-ID`
  - 或存在 `[TDD-WAIVER] TASK-ID`
- `TDD-GREEN` 不是预检通过条件，只是执行完成后的补充证据

这意味着：

> 当前最小改动方案不能绕开 `tdd-guard.md` 另起一套“Policy/RED/GREEN”格式。

#### `report-template.md`

它已经把 TDD 阻塞映射到批量报告输出：

- `blocked - 缺少 TDD RED 证据`

这说明当前 skill 体系里，TDD 已经不是纯概念，而是：

> **已经进入了 code skill 的批量执行和报告语义。**

因此，本方案后续所有建议都应视为：

> **对现有 TDD 守卫口径的收敛与补强，而不是重新设计。**

---

## 四、推荐总方案

最小改动方案的核心是：

```text
code skill
  强化 TDD 预检、RED/GREEN 明确步骤、WAIVER 结构化描述
    ↓
catchup / status
  显示“当前任务的 TDD 风险是否已处理”
    ↓
review / verify
  用固定问题模板审查 TDD 是否被合理化跳过
```

这个方案的重点不是“自动证明”，而是：

- 不给 agent 模糊空间
- 不给 WAIVER 自由发挥空间
- 不让跳过 TDD 变成隐藏行为

---

## 五、建议改动点

### 5.0 改动前提：按端类型只是辅助视角，按变更类型才是主视角

在实现最小改动版 TDD 强制时，不能简单写成：

- app 必须 TDD
- h5 不必须
- 后台必须

这种规则太粗，会直接导致误伤和漏洞。

更合理的原则是：

> **按端识别风险特征，按变更类型决定 TDD policy。**

也就是：

- `app / h5 / admin / backend` 只是上下文
- `business_logic / ui_behavior / infra_config / style_copy / external_integration` 才是决策主轴

#### 推荐的多端 TDD Policy Matrix

| 变更类型 | App | H5 / Admin | Backend | 默认策略 | 推荐 RED 证据 |
|---|---|---|---|---|---|
| 纯业务逻辑 | required | required | required | 强制 TDD | 单元测试 |
| 状态管理 / 编排逻辑 | required | required | required | 强制 TDD | 单测 / 服务级测试 |
| 页面 / 组件行为 | conditional | required | - | 条件强制 | 组件测试 / 页面测试 |
| 接口 / 服务行为 | - | - | required | 强制 TDD | service / API test |
| 多端共享层 | required | required | required | 最严格强制 | 单元测试 + 关键集成验证 |
| 外部集成接线 | conditional_waiver | conditional_waiver | conditional_waiver | 允许豁免 | 合同 / 冒烟验证 |
| 工程配置 / 打包 / CI | conditional_waiver | conditional_waiver | conditional_waiver | 允许豁免 | build / smoke |
| 纯样式 / 文案 | waived | waived | - | 默认豁免 | 无，保留验证说明 |

#### 多端视角下的具体建议

##### App

优先强制：

- ViewModel / Presenter / State Machine
- 表单校验
- usecase
- 数据转换
- 错误状态分支

可条件豁免：

- 原生壳配置
- 打包 / 签名 / 权限清单
- 纯视觉样式微调

##### H5 / Admin

优先强制：

- hooks / store / reducer
- 表单校验
- 查询条件映射
- 权限控制
- 状态流转
- 错误反馈逻辑

可条件豁免：

- 纯样式
- 纯文案
- 低风险布局调整

##### Backend

优先强制：

- service / usecase
- validator
- permission / policy
- handler 行为分支
- domain rules

可条件豁免：

- migration 脚本
- 部署配置
- 外部系统接线但无可控模拟环境时

#### 为什么这点必须写进 skill

因为如果不按端和变更类型拆分，当前最小改动方案会面临两个问题：

1. **误伤**
   - 对纯样式、打包配置、外部接线一律强制 RED，会导致流程失真
2. **漏判**
   - 对 app/h5/admin 中的复杂交互或状态逻辑，如果只因为“不是 backend”就放松，会放过高风险改动

因此，`07-code` 中的 TDD policy 段建议明确写成：

> 先判断变更类型，再结合端类型给出 `required / conditional_waiver / waived`。

### 5.1 改动点一：强化 `code` skill 的 TDD 协议

当前 `code` skill 已有这些规则：

- 必须先做 TDD 预检
- 必须有 RED 证据或 WAIVER
- 必须补测试或说明不补测试的理由

这已经是很好的基础，但还不够“可执行”。

建议补成更明确、且与 `references/tdd-guard.md` 完全对齐的协议。

#### 建议新增或强化的内容

在 `skills/spec-first/07-code/SKILL.md` 中增加：

1. **TDD 适用范围判定表**
2. **RED 证据最小要求**
3. **沿用 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 标记规范**
4. **WAIVER 清单**
5. **禁止合理化清单**

#### 建议新增文案结构

```markdown
## TDD Policy Resolution

进入实现前，必须先判断当前 TASK 属于：
- required
- conditional_waiver
- waived

优先按变更类型判断：
- business_logic -> required
- orchestration -> required
- ui_behavior -> required 或 conditional（取决于交互复杂度）
- infra_config -> conditional_waiver
- style_copy -> waived
- external_integration -> conditional_waiver

再结合端类型校正：
- app：状态机 / ViewModel / usecase 默认 required
- h5/admin：hook / store / 表单 / 权限 / 查询映射默认 required
- backend：service / validator / handler 行为分支默认 required
```

```markdown
## RED Evidence Minimum Bar

若 policy=required，进入实现前必须至少满足以下之一：
- 运行单测并观察到预期失败
- 运行回归测试并观察到预期失败

若未观察到失败，不得进入生产代码修改。
```

```markdown
## TDD Marker Truth Source

TDD 证据写法必须与 `references/tdd-guard.md` 保持一致：
- `[TDD-RED] TASK-ID`
- `[TDD-WAIVER] TASK-ID`
- `[TDD-GREEN] TASK-ID`

不得在主 skill 中发明与 references 冲突的第二套标记。
```

```markdown
## WAIVER Rules

仅允许以下理由：
- doc_only
- research_only
- design_only
- config_only
- generated_code

禁止使用：
- "改动太小"
- "先写完再补"
- "我已经手测了"
- "覆盖率够了"
```

#### 最小收益

这样做后，`code` skill 的 TDD 守卫就从：

- 抽象原则

提升为：

- 明确决策表
- 明确红线
- 明确例外
- 与当前 runtime 守卫保持一致

### 5.2 改动点二：让 `findings.md` 承载最小 TDD 证据

在不新增新 artifact 的前提下，最合适的承载点是现有 `findings.md`。

建议在 `code` skill 中规定：

- 每个 required TDD 的 TASK 完成后，必须在 `findings.md` 追加一个标准区块

但这里必须注意：**不能改成与 `tdd-guard.md` 不一致的新模板真源。**

因此推荐方式不是把现有标记废掉，而是：

- 保留 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 标记
- 在标记下方补充结构化字段

推荐格式：

```markdown
### [TDD-RED] TASK-XXX-001

- Policy: required
- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `1`
- Failure: `expected 401 got 200`
- Time: `2026-03-15T10:30:00+08:00`
```

GREEN 示例：

```markdown
### [TDD-GREEN] TASK-XXX-001

- Test: `pnpm vitest run tests/unit/example.test.ts`
- Exit: `0`
- Result: 相关测试通过
- Time: `2026-03-15T11:00:00+08:00`
```

如果豁免：

```markdown
### [TDD-WAIVER] TASK-XXX-002

- Policy: waived
- Scope: 文档更新 / 纯配置调整 / 无法自动化验证的外部集成
- Reason: `doc_only`
- Why: only updates markdown documentation, no runtime code changed
- Approver: 用户确认 / 负责人确认
- Time: `2026-03-15T10:30:00+08:00`
```

#### 为什么选 `findings.md`

因为它已经是：

- 当前 Feature 的结论记录点
- `catchup` 会读取的恢复文件
- 用户和审查者可直接查看的文件

这意味着你不需要改 runtime schema，也能让 TDD 状态变成可恢复信息。

#### 为什么这比新模板更好

因为它同时满足：

- 与现有 `tdd-guard.md` 一致
- 与现有 `guards.ts` 兼容
- 与 `report-template.md` 中的 blocked 语义一致
- 允许后续再逐步增加结构化字段

### 5.3 改动点三：增强 `catchup` 的 TDD 恢复提示

当前 `catchup` 已经读取：

- `stage-state.json`
- `task_plan.md`
- `findings.md`

所以最小改动方式不是新加状态源，而是：

> **在 `findings.md` 中约定 TDD Evidence 区块，再由 catchup 解析它。**

建议扩展 `catchup` 的输出逻辑，但判断依据必须优先兼容当前标记真源：

- 若当前 task 对应的 `[TDD-RED]` / `[TDD-WAIVER]` 区块缺失
  - 输出：`当前任务缺少 TDD 证据`
- 若当前 task 是 required 但无 `[TDD-RED]`
  - 输出：`当前任务尚未记录 RED`
- 若存在 `[TDD-WAIVER]`
  - 输出：`当前任务已 WAIVER: doc_only`

示例：

```text
TDD:
- 当前任务: TASK-AUTH-003
- policy: required
- red: missing
- green: missing
- 建议: 先补 failing test，再继续实现
```

### 5.4 改动点四：增强 `status` skill 的 TDD 风险卡片

当前 `status` 已经把 “补齐测试设计与 TDD 证据” 作为风险提示的一部分。

建议进一步固定成专门卡片：

```markdown
## TDD 状态

| 项目 | 状态 |
|------|------|
| 当前实现任务是否要求 TDD | 是 |
| 是否记录 RED | 否 |
| 是否记录 GREEN | 否 |
| 是否 WAIVER | 否 |
| 风险等级 | 🔴 |
```

#### 最小实现方式

无需新增任何底层模块，只要：

- 从 `findings.md` 中查找 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 区块
- 若缺失则标红

### 5.5 改动点五：增强 `review/verify` 固定检查项

即使没有底层硬门禁，review 也应该把 TDD 问题变成显式检查项。

建议在 review/verify 模板中固定加入：

1. 当前任务是否 required TDD？
2. 是否有 RED 证据？
3. RED 和 GREEN 是否针对同一测试目标？
4. 若 WAIVER，理由是否在允许清单内？
5. 是否存在“先实现后补测”的迹象？

这样最少能做到：

> **即使无法自动阻断，也能在审查阶段系统性暴露跳过行为。**

---

## 六、建议的最小规则文本

下面这部分是建议直接放进 `code` skill 的核心规则。

### 6.1 TDD 预检规则

```markdown
在实现前，必须先判断 TDD policy：

- `required`：修改生产代码、修 bug、改变行为语义
- `waived`：纯文档、纯分析、纯设计
- `conditional_waiver`：配置、生成文件、低风险胶水代码
```

### 6.2 required 任务规则

```markdown
若 policy=required：

1. 必须先写测试或定位现有测试
2. 必须观察到 RED（失败）
3. 必须记录 RED 证据到 findings.md
4. 然后才可改生产代码
5. GREEN 通过后记录 GREEN 证据
```

### 6.3 WAIVER 规则

```markdown
若不做 TDD，必须在 findings.md 中明确写出：

- Policy
- Waiver reason
- Why

禁止使用模糊理由，如：
- 改动太小
- 先做再补
- 时间不够
```

### 6.4 Anti-rationalization 规则

```markdown
以下理由一律无效：

- “覆盖率够了，所以不需要 TDD”
- “这是小改动，不值得写 RED”
- “我已经手工验证过”
- “先写实现更快”
```

---

## 七、推荐文件改动清单

如果按最小范围推进，建议只改这些文件：

### 必改

- `skills/spec-first/07-code/SKILL.md`
  - 增加 TDD policy、RED/GREEN minimum bar、WAIVER 清单、反合理化规则
- `skills/spec-first/07-code/references/tdd-guard.md`
  - 将当前已有口径升级为更明确的真理源说明
  - 明确允许的 WAIVER reason code
  - 明确 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 下可追加的结构化字段

### 推荐改

- `skills/spec-first/14-status/SKILL.md`
  - 增加 TDD 状态卡片模板
- `skills/spec-first/02-catchup/SKILL.md`
  - 增加恢复时检查 TDD Evidence 的要求
- `skills/spec-first/07-code/references/report-template.md`
  - 增加更明确的 blocked / next step 文案
- `skills/spec-first/07-code/references/test-template.md`
  - 加一小节，明确 first step 应产出 `[TDD-RED]`

### 可选改

- review/verify 相关 skill 文档
  - 固定加入 TDD 审查问题清单

这就是本方案的关键点：

> **先改 Skill 和现有文档承载，不动底层 runtime。**

### 7.1 不建议直接改动的文件

在本轮“最小改动”中，不建议直接改动：

- `src/core/batch-executor/guards.ts`
- Gate registry / verify runtime
- `stage-state.json` schema
- git hooks

原因不是这些地方不该改，而是：

> 当前最小收益最大的缺口，仍然是 skill 与 references 的口径不够具体，而不是 runtime 已经不支持。

---

## 八、这个最小方案能解决什么问题

它能有效解决：

1. **“TDD 只是口号”**
   - 变成显式协议
2. **“WAIVER 太模糊”**
   - 变成有限理由清单
3. **“跳过 TDD 没人看见”**
   - `findings.md`、`catchup`、`status`、`review` 都能看见
4. **“覆盖率被误当成 TDD”**
   - 文档和流程上明确纠正

但它还不能完全解决：

1. 自动硬阻断
2. CLI 级一致校验
3. Gate 级证据强制
4. Hook 级自动验真

所以这仍然是：

> **强化版软约束，而不是系统级硬约束。**

---

## 九、上线顺序建议

### Phase 1：仅改 `code` skill

先做：

- 明确 TDD policy
- 明确 WAIVER 清单
- 规定 `findings.md` 中 `[TDD-RED] / [TDD-WAIVER] / [TDD-GREEN]` 的增强写法

### Phase 2：接入 `catchup` / `status`

再做：

- 展示当前任务 TDD 风险
- 让恢复时可看见 TDD 缺口

### Phase 3：接入 `review` / `verify`

最后做：

- 固定审查问题
- 在审查报告中显式输出 TDD 合规性

这样能保证：

- 改动小
- 用户感知明确
- 后续还能平滑升级到完整方案 C

---

## 十、最终结论

如果坚持“最小范围改动”，那么最合理的策略不是立即实现完整的 TDD artifact / CLI / Gate 系统，而是：

> **把 Spec-First 当前的 Skill 级 TDD 约束，从“原则性要求”升级为“显式协议 + 可见证据 + 恢复可读”。**

最小落地方式就是：

1. 强化 `code` skill 的 TDD policy 与 WAIVER 规则
2. 以 `07-code/references/tdd-guard.md` 为真理源，统一 `findings.md` 中的 TDD 标记写法
3. 让 `catchup` / `status` / `review` 把这些证据显式展示出来

这不是最终形态，但它是当前 Spec-First 基础上：

> **投入最小、收益最快、对现有架构扰动最小的 TDD 强制增强方案。**
