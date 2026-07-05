---
title: Managed Coding Guidelines Injection Plan
created: 2026-04-20
status: completed
owner: engineering
origin: 用户请求“让 spec-first init 默认把这段准则写进用户项目的 CLAUDE.md / AGENTS.md”
scope: 为 init 默认注入独立 managed coding-guidelines block，并接入 clean / doctor / docs / tests
---

# Managed Coding Guidelines Injection Plan

## 1. 结论

推荐实现路径是：

1. 为 `CLAUDE.md` / `AGENTS.md` 新增**第三个独立 managed block**，专门承载 coding guidelines。
2. 不把这段 guideline 并入现有 `lang-policy` block，也不并入 `using-spec-first bootstrap` block。
3. `spec-first init` 默认写入该 block，`spec-first clean` 默认清理该 block，`spec-first doctor` 默认检查该 block 的安装状态与漂移状态。

这条路径比“把新内容塞进已有 block”更符合当前仓库的治理原则：

- 轻 contract
- 明确边界
- 让 LLM 决策

它的优势不是“代码更少”，而是：

- 语义边界清楚
- 回滚边界清楚
- `doctor` 可单独做 drift 检查
- 不污染现有 `using-spec-first` 的入口治理职责

## 2. 问题背景

当前 `spec-first init` 会向用户项目的 `CLAUDE.md` / `AGENTS.md` 写入两类 managed 内容：

1. `lang-policy` block
2. `using-spec-first bootstrap` block

现状已经明确区分了：

- **语言 / changelog 治理**
- **workflow 入口治理**

但还没有一个默认注入层来表达“进入工作后如何执行实现”的通用 coding posture。用户希望把一组 Karpathy-style guidelines 作为默认行为准则注入到 instruction file 中。

这个需求本质上不是新增 workflow，也不是扩展 skill host delivery，而是补一层**instruction-level execution posture contract**。

如果直接把这段内容并入现有 block，会产生两个问题：

1. **语义混杂**
   - `lang-policy` 的职责是语言与 changelog 治理
   - `bootstrap` 的职责是 workflow entry governance
   - coding guidelines 属于 execution posture，不应和前两者混成一个块

2. **管理边界变差**
   - 未来单独调整 guideline 时，无法独立 inspect / drift-detect / remove
   - `clean` 和 `doctor` 的解释成本会上升

## 3. 设计原则

本计划遵循以下原则：

1. **guideline 只约束执行姿势，不替代 workflow 路由**
   - 它不能覆盖 `using-spec-first`
   - 它不能把轻量请求都强行变成 workflow
2. **guideline 必须独立 managed**
   - 独立 marker
   - 独立 inspect
   - 独立 remove
3. **保持 instruction file 的 surrounding user content**
   - 块外用户自定义内容必须保留
4. **默认写入，但可被 clean 回收**
   - 行为应与 bootstrap block 接近
   - 不应像 `lang-policy` 一样长期残留
5. **内容是 spec-first 兼容版，不是外部原文生搬硬套**
   - 要吸收 Karpathy 原则
   - 但要避免与 `using-spec-first` 的入口治理发生冲突

## 4. Requirements Trace

- R1. `spec-first init --claude` 必须默认向 `CLAUDE.md` 写入新的 managed coding-guidelines block。
- R2. `spec-first init --codex` 必须默认向 `AGENTS.md` 写入新的 managed coding-guidelines block。
- R3. 新 block 必须有独立 marker，不得复用 `<!-- spec-first:lang:* -->` 或 `<!-- spec-first:bootstrap:* -->`。
- R4. 新 block 的文案必须明确：它只约束 execution posture，不替代 `using-spec-first` 的 workflow entry governance。
- R5. 新 block 必须支持 `zh` / `en` 两种语言输出，并遵循现有 developer language resolution。
- R6. `spec-first clean --claude|--codex` 必须移除该 block，但不得影响块外用户内容。
- R7. `spec-first doctor --claude|--codex` 必须检查该 block 的 `installed / missing / partial / drifted` 状态，并提供修复建议。
- R8. 多次 `spec-first init` 后，instruction file 中该 block 只能存在一份，不得重复追加。
- R9. instruction file 中块外已有内容必须保留；即使 marker 损坏，也要以“清理损坏 managed 内容并重建一份 clean block”为原则修复。
- R10. 相关文档必须同步说明 `init` 会写入该 block，以及 `clean` 会移除该 block。
- R11. 相关测试必须覆盖 source behavior、runtime behavior、CLI smoke 和 `doctor` 诊断。
- R12. 新 block 在 instruction file 中的稳定顺序必须固定为：`lang-policy` → `using-spec-first bootstrap` → `coding-guidelines`。
- R13. `clean` 之后的最终 instruction file 形态必须保留 `lang-policy`，移除 `coding-guidelines` 与 `bootstrap`。
- R14. 当用户项目已经存在 `CLAUDE.md` / `AGENTS.md` 且尚未包含 spec-first 对应 marker 时，`init` 必须把 managed blocks 作为连续 footer 追加到文件末尾，不得覆盖或重排用户原有内容。
- R15. 当 instruction file 已包含 spec-first marker 时，后续 `init` 只能原位替换对应 managed blocks，不得覆盖整份文件，也不得改写块外用户内容。

## 5. Scope Boundaries

### In Scope

- `src/cli/` 下 instruction file managed block 的新增与接线
- `init` / `clean` / `doctor` 的最小改造
- `README.md` 与版本更新文档同步
- 单元测试与 smoke 测试补齐

### Out of Scope

- 不新增 `spec-*` 或 `spec-*` workflow 入口
- 不修改 `skills/using-spec-first/SKILL.md` 的路由 contract
- 不把 coding guidelines 变成 standalone skill
- 不新增新的 state machine、registry 或 host delivery 维度
- 不把这段 guideline 写入 runtime skill 目录
- 不做“用户可选开启/关闭”的额外 CLI 参数设计
- 不引入第四种 instruction block 之外的平行配置文件

## 6. 文案边界

默认写入的不是用户给出的长原文，而是**spec-first 兼容压缩版**。推荐收口为 4 个短节：

1. `Think Before Coding`
2. `Simplicity First`
3. `Surgical Changes`
4. `Goal-Driven Verification`

同时必须加一句显式边界说明：

> These guidelines shape execution posture after workflow routing; they do not replace spec-first workflow entry governance.

中文版本需表达同样语义：

> 这些准则只约束进入工作后的执行姿势，不替代 `using-spec-first` 的 workflow 入口治理。

这句是核心 contract。没有这句，后续极易被误解为“先问问题再说”或“所有任务都必须先 formal plan”。

### 6.1 推荐默认 Prompt 文案

以下文案不是“示意”，而是本计划建议直接固化到 `buildCodingGuidelinesBlock()` 的默认产物。实现阶段允许做极小措辞微调，但不得改变语义边界。

#### 中文 block

```md
<!-- spec-first:coding-guidelines:start -->
## 编码执行准则（由 spec-first 管理）

这些准则只约束进入工作后的执行姿势，不替代 `using-spec-first` 的 workflow 入口治理。

### 先想清楚再动手
- 当假设会影响实现或验证时，必须先显式说明假设。
- 如果存在 2 条及以上会实质影响行为、接口、数据结构或错误语义的路径，先说明 tradeoff，再继续执行。
- 如果更简单的做法能解决当前任务，优先采用更简单的做法。
- 如果不明确之处会实质影响实现或验证，先澄清，再编码。

### 先做最小可行改动
- 只实现当前任务真正需要的最小代码。
- 不新增未被请求的功能、配置项或单次使用的抽象。
- 不为当前任务没有证据支持的失败模式添加 speculative guard 或 fallback。

### 改动要保持手术式边界
- 只修改完成当前任务所必需的文件和行为切片。
- 遵循当前文件和局部模块的既有风格与模式。
- 清理本次改动自己引入且随即失效的 unused imports / variables / functions。
- 不要在未被请求时重构、删除或顺手清理无关的既有代码。

### 用可验证目标收口
- 在 substantial work 前先明确 done signals。
- 修 bug 或改行为时，优先使用测试或其他可重复验证方式证明变更。
- 先验证目标改动，再验证相邻受影响行为。
<!-- spec-first:coding-guidelines:end -->
```

#### 英文 block

```md
<!-- spec-first:coding-guidelines:start -->
## Coding Execution Guidelines (managed by spec-first)

These guidelines shape execution posture after workflow routing; they do not replace spec-first workflow entry governance.

### Think Before Coding
- State assumptions explicitly when they materially affect implementation or verification.
- If two or more materially different approaches would change behavior, API shape, data structures, or error semantics, state the tradeoffs before proceeding.
- If a simpler approach can solve the current task, prefer the simpler approach.
- If an unclear point would materially change implementation or verification, clarify it before coding.

### Implement the Minimum Necessary Change
- Implement only the minimum code the current task requires.
- Do not add unrequested features, configurability, or single-use abstractions.
- Do not add speculative guards or fallbacks for failure modes the current task does not justify.

### Keep Changes Surgical
- Touch only the files and behavior slices required for the current task.
- Follow the local style and established patterns of the file or module you are changing.
- Clean up unused imports, variables, or functions created by your own change.
- Do not refactor, delete, or opportunistically clean up unrelated existing code unless explicitly requested.

### Verify Against Concrete Goals
- Define done signals before substantial work.
- When fixing bugs or changing behavior, prefer tests or other reproducible verification.
- Verify the target change first, then verify nearby affected behavior.
<!-- spec-first:coding-guidelines:end -->
```

### 6.2 Prompt 内容取舍说明

这份默认文案相对于用户给出的原始版本做了 4 个有意取舍：

1. 把 “If something is unclear, stop. Ask.” 收敛成“只有会实质影响实现或验证时才先澄清”。
2. 把 “多步骤任务先给 plan” 收敛成“substantial work 前先明确 done signals”，避免与轻量请求直答冲突。
3. 保留 Karpathy 的四条主原则，但压缩成 instruction file 可承受的密度。
4. 显式加入“不会替代 workflow entry governance”的边界句，避免与 `using-spec-first` 发生冲突。

### 6.3 最终产物形态

实现完成后，instruction file 的稳定形态应如下。

#### merge 语义

对已经存在用户自定义内容的 instruction file，目标行为不是“重写整份文件”，而是：

1. **首次接入**
   - 如果还没有 spec-first marker，则把 spec-first managed blocks 作为一个连续区块追加到文件末尾。
2. **后续 re-init**
   - 如果已经有对应 marker，则只原位替换 spec-first 自己管理的 blocks。
3. **始终保留块外用户内容**
   - 用户原有的 repo 说明、约束、注释、自定义规则都必须保留。

换句话说，spec-first 只拥有 marker 包围的 managed blocks，不拥有整份 `CLAUDE.md` / `AGENTS.md`。

#### `init` 之后的 instruction file 结构

对 Claude：

```md
# 用户原有内容（如存在）

<!-- spec-first:lang:start -->
...language policy block...
<!-- spec-first:lang:end -->

<!-- spec-first:bootstrap:start -->
...Claude-specific using-spec-first bootstrap...
<!-- spec-first:bootstrap:end -->

<!-- spec-first:coding-guidelines:start -->
...coding guidelines block...
<!-- spec-first:coding-guidelines:end -->

# 用户原有尾部内容（如存在）
```

对 Codex：

```md
# 用户原有内容（如存在）

<!-- spec-first:lang:start -->
...language policy block...
<!-- spec-first:lang:end -->

<!-- spec-first:bootstrap:start -->
...Codex-specific using-spec-first bootstrap...
<!-- spec-first:bootstrap:end -->

<!-- spec-first:coding-guidelines:start -->
...coding guidelines block...
<!-- spec-first:coding-guidelines:end -->

# 用户原有尾部内容（如存在）
```

两宿主的差异只在 bootstrap block 的 host-specific 行；`coding-guidelines` block 本身不需要 host 分叉，只需要语言分叉。

#### `clean` 之后的 instruction file 结构

```md
# 用户原有内容（如存在）

<!-- spec-first:lang:start -->
...language policy block...
<!-- spec-first:lang:end -->

# 用户原有尾部内容（如存在）
```

也就是说：

- `lang-policy` 保留
- `coding-guidelines` 移除
- `using-spec-first bootstrap` 移除

#### `doctor` 的目标检查形态

对于已正确安装的项目，平台检查中应至少出现一条类似条目：

```text
PASS  CLAUDE.md coding guidelines    managed coding-guidelines block present
PASS  AGENTS.md coding guidelines    managed coding-guidelines block present
```

对于缺失或漂移的项目，应出现 WARNING，并统一引导通过 `spec-first init --claude` 或 `spec-first init --codex` 修复。

## 7. 现有代码事实

当前实现已经提供了两类成熟模式，可直接复用：

1. `lang-policy`
   - 负责 block 构造
   - 负责 apply / replace
   - 保留 surrounding content

2. `instruction-bootstrap`
   - 负责 block 构造
   - 负责 inspect / drift detect / remove
   - 与 `doctor` / `clean` 已完成接线

因此最合理的实现不是“把逻辑散落到 init/clean/doctor 内部”，而是新增一个结构上对齐 `instruction-bootstrap` 的模块，例如：

- `src/cli/coding-guidelines.js`

它应提供至少四类接口：

- `buildCodingGuidelinesBlock()`
- `applyManagedCodingGuidelinesBlock()`
- `removeManagedCodingGuidelinesBlock()`
- `inspectCodingGuidelinesBlock()`

## 8. 实施单元

## Unit 1: 新增 managed coding-guidelines 模块

### Goal

为 instruction file 提供一个新的独立 managed block 能力，支持：

- build
- apply / replace
- remove
- inspect / drift detect

### Files

- Add: `src/cli/coding-guidelines.js`
- Add: `tests/unit/coding-guidelines.test.js`

### Approach

1. 定义新 marker：
   - `<!-- spec-first:coding-guidelines:start -->`
   - `<!-- spec-first:coding-guidelines:end -->`
2. 提供 `zh` / `en` 两套 block body。
3. 复用与现有 managed block 一致的行为语义：
   - 文件不存在时只写 block
   - 文件存在但没有 marker 时把 managed blocks 作为连续 footer 追加到末尾
   - 文件存在且 marker 完整时原位替换
   - marker 损坏时尽量清理旧 managed body 并重建 clean block
4. inspect 语义与 bootstrap 对齐：
   - `installed`
   - `missing`
   - `partial`
   - `drifted`
5. block body 默认以本计划第 6.1 节为准；实现时不得再临场重写结构。

### Test Files

- `tests/unit/coding-guidelines.test.js`

### Test Scenarios

1. 空文件写入时得到完整 block。
2. 已有用户内容且无 marker 时，block 作为 footer 追加到末尾，块外内容保持不变。
3. 已有 marker 时重复 apply 只原位替换 block，不覆盖整份文件。
4. 重复 apply 时保持幂等。
5. 完整 marker 存在时可原位替换语言版本。
6. marker 损坏时能清理 stale body 并重建一份 clean block。
7. `inspectCodingGuidelinesBlock()` 能正确区分 `installed / missing / partial / drifted`。
8. 中文与英文 block 都包含第 6.1 节规定的边界句和 4 个小节标题。

## Unit 2: 接入 init / clean / doctor

### Goal

把新 block 纳入 CLI 主路径，形成完整 managed lifecycle。

### Files

- Modify: `src/cli/commands/init.js`
- Modify: `src/cli/commands/clean.js`
- Modify: `src/cli/commands/doctor.js`
- Modify: `tests/unit/using-spec-first-runtime-contracts.test.js`
- Modify: `tests/unit/doctor-json-contract.test.js`

### Approach

1. `init`
   - 在 instruction file 生成链路里加入 coding-guidelines block
   - 推荐顺序：
     1. `lang-policy`
     2. `using-spec-first bootstrap`
     3. `coding-guidelines`
   - 这样能保持治理层次从“通用语言规则”到“入口治理”再到“执行姿势”的顺序
   - 默认文案以本计划第 6.1 节为准，不再留给实现阶段自由发挥

2. `clean`
   - instruction file cleanup 时同时去除：
     - `coding-guidelines`
     - `using-spec-first bootstrap`
   - 但不移除 `lang-policy`

3. `doctor`
   - 新增一条检查项，例如：
     - `CLAUDE.md coding guidelines`
     - `AGENTS.md coding guidelines`
   - 缺失或 drift 时 fix 文案统一指向：
     - `spec-first init --claude`
     - `spec-first init --codex`

### Test Files

- `tests/unit/using-spec-first-runtime-contracts.test.js`
- `tests/unit/doctor-json-contract.test.js`

### Test Scenarios

1. Claude init 后 `CLAUDE.md` 包含新的 coding-guidelines marker。
2. Codex init 后 `AGENTS.md` 包含新的 coding-guidelines marker。
3. 当 instruction file 已有用户内容但没有 marker 时，managed blocks 以连续 footer 形式追加到末尾，而不是覆盖整份文件。
4. 当 instruction file 已有 marker 时，re-init 只原位替换 managed blocks，不覆盖整份文件。
5. 两宿主 instruction file 中的 block 顺序固定为 `lang` → `bootstrap` → `coding-guidelines`。
6. Claude clean 后 `CLAUDE.md` 不再包含该 marker，但保留自定义头尾内容与 `lang-policy`。
7. Codex clean 后 `AGENTS.md` 不再包含该 marker，但保留自定义头尾内容与 `lang-policy`。
8. doctor 在正常 init 后报告 PASS。
9. doctor 在 block 缺失或 drift 后报告 WARNING，并给出 `init` 修复建议。

## Unit 3: 文档与 smoke 回归

### Goal

让用户可见文档、示例输出和 smoke 测试与真实行为一致。

### Files

- Modify: `README.md`
- Modify: `docs/08-版本更新/README.md`
- Modify: `tests/smoke/cli.sh`

### Approach

1. 更新 `README.md` 中的 init 写入表：
   - 新增 instruction file 第三类 managed block
2. 更新 rollback 说明：
   - `clean` 现在会移除 bootstrap 与 coding-guidelines
   - `lang-policy` 仍保留手动删除语义
3. 补一条 instruction file merge 语义说明：
   - 已有文件时不会整份覆盖
   - 首次接入追加 managed footer
   - 后续 re-init 只替换 spec-first 自己的 blocks
4. 更新示例输出：
   - 补一条写入 coding guidelines 的日志
5. smoke 中对 `CLAUDE.md` / `AGENTS.md` 增加新 marker 断言
6. smoke 中对 marker 顺序增加断言
7. smoke 中对已有用户内容场景追加“不覆盖整份文件、managed footer 追加到末尾”的断言
8. smoke 中对 clean 后 marker 消失、`lang-policy` 仍保留增加断言

### Test Files

- `tests/smoke/cli.sh`

### Test Scenarios

1. `init --claude` 后 `CLAUDE.md` 包含新的 marker。
2. `init --codex` 后 `AGENTS.md` 包含新的 marker。
3. 已有用户内容场景下，`init` 不会覆盖整份 instruction file，而是追加 managed footer。
4. 已有 marker 场景下，re-init 只替换 managed blocks。
5. `CLAUDE.md` / `AGENTS.md` 中三类 managed block 顺序正确。
6. `clean --claude` 后新 marker 消失且 `lang-policy` 仍在。
7. `clean --codex` 后新 marker 消失且 `lang-policy` 仍在。
8. README 对 init 写入边界、merge 语义和 clean 回滚边界的描述与实际行为一致。

## 9. 实施顺序

推荐顺序：

1. Unit 1：先把独立 block 能力做出来
2. Unit 2：再接入 `init` / `clean` / `doctor`
3. Unit 3：最后补文档与 smoke

原因：

- 先有 block contract，才能稳定接 CLI
- 先有 CLI，再修 smoke 与 README，避免文档先于真实行为漂移

## 10. 验证策略

### 局部验证

1. `npx jest tests/unit/coding-guidelines.test.js --runInBand`
2. `npx jest tests/unit/using-spec-first-runtime-contracts.test.js --runInBand`
3. `npx jest tests/unit/doctor-json-contract.test.js --runInBand`

### 回归验证

1. `bash tests/unit/lang-policy.sh`
2. `npm run test:smoke`

### Done Signals

1. `spec-first init --claude` 会把 coding-guidelines block 写入 `CLAUDE.md`
2. `spec-first init --codex` 会把 coding-guidelines block 写入 `AGENTS.md`
3. `spec-first clean` 会移除该 block，但保留块外用户内容
4. `spec-first doctor` 能检查该 block 的 installed / drifted 状态
5. `README.md` 与 `docs/08-版本更新/README.md` 已同步更新
6. 单测与 smoke 覆盖全部通过

## 11. 风险与取舍

### 风险 1：原文过长导致 prompt 负担变重

如果把用户提供的长原文逐字写入 instruction file，会增加 instruction 噪音，也更容易与现有 contract 重叠。

**取舍**

默认使用压缩版、兼容版。保留原则，不搬运冗长原文。

### 风险 2：guideline 与 workflow 治理混淆

如果文案没有明确边界，后续可能被理解成：

- 所有事都先问问题
- 所有请求都必须先 plan
- guideline 覆盖 workflow 路由

**取舍**

必须在 block 内加入“仅约束 execution posture，不替代 workflow entry governance”的显式句子。

### 风险 3：clean / doctor 语义与 README 不一致

如果只改 `init`，不改 `clean` / `doctor` / README，就会出现：

- init 写了
- clean 不清
- doctor 不查
- 文档也没说明

这会让 managed boundary 重新变脏。

**取舍**

这三个点必须作为一个整体落地，不接受只改 init 的半成品路径。

## 12. Non-Goals

- 不把 coding guidelines 做成独立 skill
- 不把 coding guidelines 接成 `spec-*` 或 `spec-*`
- 不修改 `using-spec-first` 的路由 contract
- 不新增用户开关参数，如 `--with-guidelines`
- 不为这次改动设计新的 managed state 字段
- 不做 instruction file 全量重构
