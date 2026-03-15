# Spec-First TDD 强制详细参考方案

> 分析日期：2026-03-15
>
> 参考来源：Superpowers `test-driven-development`、Trellis 质量门禁思想、Spec-First 现有 Skill/Gate/Hook 架构
>
> 目标：为 Spec-First 设计一套可落地、可审计、可渐进上线的 TDD 强制方案

---

## 一、执行摘要

当前 Spec-First 已经有：

- Gate 门禁
- Skill 流程约束
- `catchup` 恢复
- 追溯矩阵
- 测试覆盖率指标（C4/C5 等）

但它**还没有真正实现“TDD 强制”**。

当前最关键的认知误区是：

> **覆盖率门禁 ≠ TDD 强制**

已有审查已经指出，当前代码中的 `G-IMPL-01` 是覆盖率门禁，不是 TDD RED 证据门禁。  
也就是说，系统目前可以校验“测试数量/覆盖率/结果”，但不能校验：

- 测试是否先写
- RED 是否真实发生
- GREEN 是否针对同一测试闭环
- REFACTOR 是否在绿色状态下进行
- 是否存在合理化绕过

因此，TDD 强制方案必须从“结果指标”升级为“过程证据”。

本方案的核心结论是：

1. **TDD 必须被定义为一套治理协议，而不是一句开发建议**
2. **TDD 强制不能只靠 Skill 文案，必须下沉到 CLI/Gate/Hook/Artifact 层**
3. **TDD 强制的最小可行落地点不是检测“是否写了测试”，而是检测“是否存在 RED→GREEN 证据链”**
4. **应采用分阶段 rollout，而不是一上来对所有任务上硬阻断**

---

## 二、背景与现状问题

### 2.1 Superpowers 对 TDD 的要求

Superpowers 的 `test-driven-development` skill 定义得非常严格：

- 先写失败测试
- 明确验证 RED
- 最小实现进入 GREEN
- 再进入 REFACTOR
- 没有 failing test 就不得写 production code

其铁律是：

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

这是一种**过程纪律**，不是最终结果检查。

### 2.2 Spec-First 当前缺口

结合仓库现状与已有审计，当前问题主要有 5 类：

1. **缺少 TDD 的单独事实源**
   - 当前没有 `tdd-state`、`tdd-evidence`、`red-green ledger`
2. **Skill 有 TDD 表述，但缺少可执行校验**
   - “遵循 TDD” 仍偏软约束
3. **Gate 校验的是覆盖率，不是 TDD 过程**
   - 覆盖率高不代表先测后写
4. **WAIVER 条件不够结构化**
   - 哪些任务可豁免依赖主观判断
5. **无法自动审计**
   - 系统无法回答“这段实现是否真的经过了 RED→GREEN”

### 2.3 必须澄清的一条边界

TDD 强制方案不能追求“绝对证明开发者历史上每一步操作都真实发生”。  
这在本地开发环境中几乎不可能完全证明。

所以系统应该追求的是：

> **高可信过程证据 + 明确例外管理 + 足够低的绕过收益**

也就是把 TDD 从“无法验证的口头承诺”变成“必须留下结构化证据的治理流程”。

---

## 三、设计目标

本方案建议将 TDD 强制的目标定义为以下 6 条：

1. **明确适用范围**
   - 哪些任务必须 TDD，哪些任务允许豁免
2. **形成统一证据模型**
   - RED / GREEN / REFACTOR 都有结构化记录
3. **具备多层守卫**
   - Skill、CLI、Gate、Hook、Review 多层拦截
4. **允许例外，但必须显式**
   - WAIVER 必须带理由、范围、批准链
5. **能恢复上下文**
   - `catchup` 应能展示当前 TDD 状态
6. **渐进落地**
   - 先软门禁，后硬门禁，避免一次性阻断所有开发

---

## 四、方案选型对比

### 方案 A：纯 Skill 文案强制

做法：

- 在 `code` skill 中增强 TDD 规则
- 依赖 agent 自觉执行

优点：

- 成本低
- 改动小

缺点：

- 无法审计
- 无法在 CLI 层阻断
- 仍然容易被“合理化跳过”

结论：

> 不足以构成 TDD 强制，只能算倡导。

### 方案 B：纯覆盖率/Gate 代理 TDD

做法：

- 继续使用 C4/C5/C9 等指标近似代表 TDD

优点：

- 复用现有 Gate
- 工程成本低

缺点：

- 指标代理错误
- 无法证明测试先写
- 覆盖率和 TDD 是不同维度

结论：

> 不成立。覆盖率门禁不能替代 TDD 强制。

### 方案 C：证据驱动的多层 TDD 强制

做法：

- 引入 TDD 证据模型
- 在 Skill/CLI/Gate/Hook 中逐层检查
- 对例外任务建立 WAIVER 流程

优点：

- 可审计
- 可恢复
- 可逐步硬化
- 与 Spec-First 现有状态机/Gate/Artifact 架构兼容

缺点：

- 需要新增 artifact 和校验逻辑
- 会增加流程成本

结论：

> 推荐采用。它是唯一既符合 TDD 精神，又能真正落地的方案。

---

## 五、推荐总体方案

推荐采用：

> **“治理规则 + 证据文件 + CLI/Gate/Hook 守卫 + WAIVER 管理 + 分阶段 rollout”**

架构如下：

```text
Task / Code Skill
  ↓
TDD Policy Resolver
  ↓
┌────────────────────────────────────────────┐
│ 是否必须 TDD？                             │
│ - code-changing task -> yes               │
│ - doc / research / audit -> waiver        │
│ - generated code / config-only -> waiver  │
└────────────────────────────────────────────┘
  ↓
TDD Evidence Writer
  ↓
specs/{featureId}/tdd/
  ├── tdd-ledger.json
  ├── TASK-xxx.tdd.json
  └── waiver.yaml
  ↓
Guards
  ├── Skill preflight
  ├── CLI command guard
  ├── Git hook hint
  ├── Gate evaluation
  └── Review surface
  ↓
catchup / status / verify
  展示 TDD 证据完整度与风险
```

---

## 六、治理规则设计

### 6.1 TDD 适用范围

建议按任务类型分 3 类：

#### A 类：强制 TDD

满足以下任一条件即强制：

- 修改 `src/` 下生产代码
- 修改核心业务逻辑
- 修复 bug
- 修改行为语义
- 重构存在行为风险的代码
- 新增对外可观察功能

#### B 类：条件性 TDD

默认建议，但允许 waiver：

- 纯适配层改动
- 低风险 glue code
- 非关键脚本
- CLI 文案修改伴随少量逻辑调整

#### C 类：默认豁免

无需 TDD，但必须说明原因：

- 纯文档改动
- 纯分析/调研任务
- 纯设计/规划任务
- 纯配置任务
- 纯生成文件更新
- 无源码变更的审计类工作

### 6.2 WAIVER 规则

TDD WAIVER 必须结构化，不允许自由文本一句带过。

建议字段：

```yaml
task_id: TASK-XXX-001
scope: task
reason_code: doc_only | research_only | config_only | generated_code | external_constraint
reason_detail: "本任务仅更新文档与流程图，不修改运行时代码"
approved_by: self | reviewer | lead
approved_at: 2026-03-15T10:00:00Z
expires_at: null
```

### 6.3 一条重要治理原则

> **TDD 是默认规则，WAIVER 是显式例外，不允许隐式跳过。**

---

## 七、证据模型设计

### 7.1 新增目录结构

建议在每个 Feature 下新增：

```text
specs/{featureId}/tdd/
├── tdd-ledger.json
├── TASK-XXX-001.tdd.json
├── TASK-XXX-002.tdd.json
└── waiver.yaml
```

### 7.2 单任务证据文件

建议结构：

```json
{
  "version": 1,
  "featureId": "FSREQ-20260315-XXX-001",
  "taskId": "TASK-XXX-001",
  "policy": "required",
  "status": "green_verified",
  "testSuite": [
    {
      "name": "should reject expired token",
      "testFile": "tests/unit/auth.test.ts",
      "red": {
        "command": "pnpm vitest run tests/unit/auth.test.ts -t \"should reject expired token\"",
        "observedAt": "2026-03-15T10:00:00Z",
        "exitCode": 1,
        "failureSignature": "expected 401 got 200"
      },
      "green": {
        "command": "pnpm vitest run tests/unit/auth.test.ts -t \"should reject expired token\"",
        "observedAt": "2026-03-15T10:08:00Z",
        "exitCode": 0
      }
    }
  ],
  "refactor": {
    "performed": true,
    "verifiedAt": "2026-03-15T10:10:00Z"
  },
  "productionFiles": [
    "src/auth/token.ts"
  ],
  "testFiles": [
    "tests/unit/auth.test.ts"
  ],
  "updatedAt": "2026-03-15T10:10:00Z"
}
```

### 7.3 Feature 总账文件

`tdd-ledger.json` 用于聚合当前 Feature 全体任务状态：

```json
{
  "featureId": "FSREQ-20260315-XXX-001",
  "summary": {
    "required": 6,
    "waived": 2,
    "greenVerified": 4,
    "missingEvidence": 1,
    "redMissing": 1
  },
  "tasks": [
    {
      "taskId": "TASK-XXX-001",
      "policy": "required",
      "status": "green_verified"
    }
  ],
  "updatedAt": "2026-03-15T10:12:00Z"
}
```

### 7.4 为什么必须用结构化文件

原因有 4 个：

1. 可供 Gate 自动读取
2. 可供 `catchup` 恢复
3. 可供 `status` 展示
4. 可供 review / archive 追溯

也就是：

> **TDD 证据必须成为 Spec-First 的一等 artifact。**

---

## 八、执行守卫设计

### 8.1 Skill 层守卫

在 `code` skill 中新增明确协议：

1. 开始前解析 TDD policy
2. 如果 `required`，先创建/更新 `.tdd.json`
3. 先登记 RED，再允许实现
4. GREEN 通过后更新状态
5. REFACTOR 后再次验证

Skill 层的职责是：

- 规范 agent 行为
- 要求证据写入
- 在流程最前面给出阻断

但 Skill 层不能作为唯一守卫。

### 8.2 CLI 层守卫

建议新增统一命令：

```bash
spec-first tdd check <featureId>
spec-first tdd record-red <featureId> <taskId> ...
spec-first tdd record-green <featureId> <taskId> ...
spec-first tdd waive <featureId> <taskId> ...
```

也可以先不暴露全部 CLI，只提供内部 API 和单一检查命令。

CLI 层至少应实现：

- 读取 `tdd-ledger.json`
- 检查 required task 是否缺 RED 证据
- 检查是否有 source change 但无 TDD evidence
- 输出明确失败原因

### 8.3 Gate 层守卫

建议新增两个新条件，而不是把现有 C4 条件硬解释成 TDD：

#### `G-IMPL-TDD-01`

描述：

> 所有 required 的 implement task 均存在 RED 证据

#### `G-IMPL-TDD-02`

描述：

> 所有 required 的 implement task 均存在 GREEN 验证或显式 WAIVER

在 `05_verify` 阶段再加：

#### `G-VERIFY-TDD-01`

描述：

> Feature 的 TDD ledger 中不存在 missingEvidence / redMissing

这样做的好处是：

- 不污染现有覆盖率语义
- 明确区分“过程门禁”和“结果门禁”

### 8.4 Hook 层守卫

Hook 不适合做全量 TDD 判定，但适合做轻量提醒与最低阻断。

推荐做法：

- `pre-commit`
  - 检测暂存区有 `src/` 变更但无对应 `specs/{featureId}/tdd/` 更新
  - 输出 warning 或 soft-block
- `commit-msg`
  - 不做 TDD 判断
- `pre-push`
  - 可在 degraded 模式下运行 `spec-first tdd check <featureId>`，失败时提示或阻断

建议：

- 初期 `pre-commit` 只告警
- 稳定后 `pre-push` 才进入硬阻断

### 8.5 Review 层守卫

代码审查时应新增一类固定问题：

- 本任务是否 required TDD？
- 是否存在 RED 证据？
- RED 与 GREEN 是否针对同一测试？
- 是否存在无证据的生产代码改动？
- WAIVER 是否符合范围？

这类审查可以在 `review` skill 或 `verify` 阶段输出专门卡片。

---

## 九、状态展示与恢复设计

### 9.1 catchup 展示

建议在 `spec-first ai catchup` 中增加：

- 当前 Feature 的 TDD 总览
- 当前 task 的 TDD 状态
- 缺失 RED/GREEN 证据任务列表
- WAIVER 列表

示例：

```text
TDD 状态：
- required: 6
- green verified: 4
- waived: 1
- missing evidence: 1

当前任务：TASK-AUTH-003
- policy: required
- red: missing
- green: missing
建议：先补 failing test，再进入实现
```

### 9.2 status 仪表板展示

建议新增：

- `tdd_policy_status`
- `tdd_evidence_status`
- `tdd_waiver_count`

并作为风险指标的一部分。

### 9.3 analyze / archive 展示

建议：

- `analyze` 可统计 TDD evidence 覆盖率
- `archive` 应输出本 Feature 的 TDD 合规结论

---

## 十、数据一致性与反绕过设计

### 10.1 不能只信 agent 自报

如果 TDD 证据完全由 agent 自己写，不做任何交叉验证，就很容易形式化。

因此建议至少做以下交叉校验：

1. `productionFiles` 是否真的发生源码改动
2. `testFiles` 是否真实存在
3. RED command 和 GREEN command 是否引用同一测试目标
4. GREEN 后是否存在验证命令成功记录

### 10.2 可接受的不完美

即便如此，也不能 100% 证明“历史上一定先测后写”。  
但它已经足以形成高压治理环境，使绕过成本显著提高。

系统目标不是法医级证明，而是：

> **让“不做 TDD”变得显式、可见、可审计、有成本。**

### 10.3 反合理化规则

建议把以下常见借口写成显式拒绝规则：

- “改动太小，不值得测试”
- “我先写完再补测试”
- “已有覆盖率，等价于 TDD”
- “手测过了，不需要 RED”
- “这个任务大概率没风险”

这部分可借鉴 Superpowers 的 anti-rationalization 风格。

---

## 十一、与现有指标体系的关系

### 11.1 TDD 不替代覆盖率

两者是不同维度：

- TDD：过程纪律
- 覆盖率：结果指标

正确关系应该是：

| 维度 | 作用 |
|------|------|
| TDD Evidence | 证明是否遵守先测后写 |
| C4/C5/C9 | 证明测试覆盖与验证完成度 |

### 11.2 不建议做的事

以下做法都不建议：

1. 用 `C4 >= X` 代替 TDD
2. 把 `G-IMPL-01` 直接改名成 TDD Gate
3. 只要求“有测试文件改动”就判通过
4. 只靠 code review 人工口头确认

### 11.3 推荐关系

推荐关系如下：

```text
TDD Evidence Gate
  + Coverage Gate
  + Verify Gate
  = 完整实现质量闭环
```

---

## 十二、实施路线图

### Phase 0：文档和协议统一（1-2 天）

目标：

- 统一 TDD 定义
- 明确 WAIVER 范围
- 修正文档中“覆盖率 = TDD”的错误叙述

产出：

- `code` skill 更新
- 治理文档更新
- 风险指标更新

### Phase 1：软证据阶段（2-4 天）

目标：

- 引入 `tdd/` 目录与 `.tdd.json` 结构
- `code` skill 开始写证据
- `catchup/status` 可展示

规则：

- 缺证据不阻断
- 只 warning

### Phase 2：软门禁阶段（3-5 天）

目标：

- Gate 读取 TDD ledger
- `pre-push` / `verify` 输出明确失败项

规则：

- 允许 `--waive`
- 缺证据进入 `PASS_WITH_WARNING` 或 `FAIL`（仅部分阶段）

### Phase 3：硬门禁阶段（1-2 周）

目标：

- implement / verify 阶段 required task 缺 TDD evidence 时硬阻断
- archive 报告纳入 TDD 合规结论

规则：

- 所有 required 任务必须 RED→GREEN 或显式 WAIVER

---

## 十三、建议新增模块

建议新增以下模块：

```text
src/core/tdd/
├── policy.ts            # 任务 -> required/waived 判定
├── evidence.ts          # 证据模型与读写
├── ledger.ts            # feature 总账聚合
├── guard.ts             # CLI / Gate 守卫
├── waiver.ts            # waiver schema 与校验
└── presenter.ts         # status/catchup/review 展示
```

对应新增 artifact：

```text
specs/{featureId}/tdd/
├── tdd-ledger.json
├── TASK-*.tdd.json
└── waiver.yaml
```

---

## 十四、风险与权衡

### 14.1 风险

1. **流程变重**
   - 证据写入增加开发负担
2. **形式主义风险**
   - 可能出现“补写证据”而不是真 TDD
3. **误伤低风险任务**
   - 如果 WAIVER 规则不清晰，会导致无谓阻断
4. **多语言/多测试框架适配复杂**
   - RED/GREEN 命令结构不统一

### 14.2 缓解方式

1. 先软后硬 rollout
2. 明确 WAIVER 边界
3. 用结构化交叉校验降低造假收益
4. 先支持主路径（Node/Vitest），后扩展其他栈

---

## 十五、最终建议

### 15.1 最重要的结论

Spec-First 若要真正“强制 TDD”，必须接受一个现实：

> **TDD 强制不是一个 coverage 问题，而是一个过程治理和证据建模问题。**

### 15.2 推荐落地顺序

建议按以下顺序推进：

1. 统一定义与 WAIVER 规则
2. 增加 TDD artifact 与 ledger
3. 在 `code` skill / `catchup` / `status` 接入
4. 新增独立 TDD Gate
5. 再进入 Hook/硬阻断

### 15.3 最终目标状态

理想状态下，Spec-First 应该可以回答以下问题：

- 这个任务是否要求 TDD？
- 它是否有 RED 证据？
- GREEN 是否针对同一测试闭环？
- 是否有合法 WAIVER？
- 哪些 Feature 的 TDD 合规率持续偏低？

当系统能稳定回答这些问题时，TDD 才算从“理念”变成“机制”。

