# TDD 最佳实践方案：借鉴 Superpowers

> **版本**: 1.1 | **日期**: 2026-03-26 | **目标**: 为 spec-first 项目引入 TDD 机制，并将其纳入最小 Harness Engineering 骨架

---

## 1. 问题分析

### 1.1 当前 spec-first 的测试缺口

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        当前流程的测试缺口                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

  当前流程:
  implement ──────► check ──────► finish
       │               │              │
       │               │              │
       ▼               ▼              ▼
  实现代码        spec验证        最终检查
  + lint          + 自我修复       + 手动测试
  + typecheck     (最多5次)

  缺失:
  ❌ 单元测试 (unit test)
  ❌ 集成测试 (integration test)
  ❌ 测试驱动开发 (TDD)
  ❌ 回归保护 (regression protection)
```

### 1.2 Superpowers 的 TDD 设计

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Superpowers TDD 设计                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

  核心原则: 如果没有看到测试失败，就不知道它是否测试正确的东西

  铁律: 没有失败测试在前，不得编写生产代码

  Red-Green-Refactor 循环:
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ 1. RED   │ ──►│ 2. GREEN │ ──►│3. REFACTOR│
  │ 写失败测试│    │ 最小实现  │    │  清理代码 │
  └──────────┘    └──────────┘    └──────────┘
       │               │               │
       ▼               ▼               ▼
  Verify RED      Verify GREEN    重复循环
  (强制验证)       (强制验证)
```

### 1.3 为什么 AI 编码也需要 TDD？

| 误解 | 真相 |
|------|------|
| "AI 生成代码很可靠" | AI 也会产生逻辑错误、边界遗漏 |
| "测试和实现同源，TDD 没用" | 测试失败验证了测试本身的有效性 |
| "lint + typecheck 足够" | 静态检查无法发现业务逻辑错误 |
| "人工 review 兜底" | 人工效率低，容易遗漏 |

### 1.4 从 Harness Engineering 看 TDD

TDD 在这个项目里不应被理解成“多写一点测试”，而应被理解成：

> 用最小的工程约束，把行为验证前移到实现阶段。

如果只在 prompt 里写“建议先写测试”，它仍然只是倡议，不是 harness。

真正的 Harness Engineering 需要三层同时成立：

1. **Policy**
   - task 在创建或 planning 时就确定 TDD 强度
   - 例如 `implement.mode = direct / tdd_recommended / tdd_required`

2. **Execution**
   - implement agent 按 RED → GREEN → REFACTOR 执行
   - bug fix 场景优先写复现测试

3. **Enforcement**
   - check 阶段必须运行验证命令
   - 没有 fresh verification evidence，不能宣称完成

这也是为什么当前推荐路线不是“先新增独立 test phase”，而是：

- implement phase 显式引入 TDD 模式
- check phase 对测试执行做硬门控

### 1.5 TDD 解决什么，不解决什么

TDD 的价值很高，但它不是万能药。

它主要解决：

1. 行为目标更清晰
2. 回归保护更早建立
3. bug fix 有可重复的复现手段
4. “我觉得应该对”变成“我看到了 RED/GREEN 证据”

它不直接解决：

1. 需求理解本身是否正确
2. 测试覆盖是否完整
3. 跨层交互是否全部正确
4. 多平台差异是否全部被验证

因此，TDD 不能替代：

- `check.verify_commands`
- cross-layer check
- integration / e2e 验证
- 人工 review

最合理的关系是：

> TDD 负责把验证前移，check gate 负责把验证兜住。

---

## 2. 方案对比

### 2.1 四种方案概述

| 方案 | 改动量 | 效果 | 兼容性 |
|------|--------|------|--------|
| **A: Implement 内置 TDD** | 中 | 高 | ✅ 好 |
| **B: Check 加入测试验证** | 小 | 中 | ✅ 好 |
| **C: 独立 Test Phase** | 大 | 高 | ⚠️ 需改架构 |
| **D: 分层测试策略** | 大 | 最高 | ⚠️ 复杂 |

### 2.2 方案 A: Implement 内置 TDD

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        方案 A: Implement 内置 TDD                                │
└─────────────────────────────────────────────────────────────────────────────────┘

  修改 implement.md:

  ### 3. Implement Features (改进后)

  #### 3.1 Test First (新增)
  - 识别需要测试的新功能
  - 编写失败的单元测试
  - 运行测试验证失败 (RED)

  #### 3.2 Implement
  - 编写最小代码通过测试
  - 运行测试验证通过 (GREEN)

  #### 3.3 Refactor (可选)
  - 清理代码
  - 确保测试仍然通过

  ### 4. Verify (改进)
  - Run lint
  - Run typecheck
  - Run tests ← 新增

  优点:
  ✅ 改动最小
  ✅ 保持现有架构
  ✅ 测试和实现由同一 Agent 完成，保持一致性

  缺点:
  ⚠️ 测试和实现同源，可能有相同偏见
  ⚠️ 增加 implement 阶段时间
```

### 2.3 方案 B: Check 加入测试验证

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        方案 B: Check 加入测试验证                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

  修改 ralph-loop.py:

  # 当前默认命令
  DEFAULT_VERIFY_COMMANDS = ["pnpm lint", "pnpm typecheck"]

  # 改进后
  DEFAULT_VERIFY_COMMANDS = [
      "pnpm lint",
      "pnpm typecheck",
      "pnpm test"  # 新增
  ]

  修改 check.jsonl 模板:
  {"file": "...", "reason": "TypeCheck"}
  {"file": "...", "reason": "Lint"}
  {"file": "...", "reason": "Test"}  # 新增

  优点:
  ✅ 改动最小
  ✅ 利用现有循环机制
  ✅ 测试失败会触发循环修复

  缺点:
  ⚠️ 不是真正的 TDD (测试后置)
  ⚠️ check agent 需要理解测试失败原因
```

### 2.4 方案 C: 独立 Test Phase

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        方案 C: 独立 Test Phase                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  新增流程:
  implement ──► test ──► check ──► finish
                   ↑
               新增 phase

  新增 test agent:

  ---
  name: test
  description: |
    Test runner and validator. Runs tests and reports failures.
    Does NOT write code, only runs and validates.
  tools: Read, Bash, Glob, Grep
  model: opus
  ---

  dispatch.md 新增:

  ### action: "test"

  Task(
    subagent_type: "test",
    prompt: "Run tests for the implemented feature",
    model: "opus",
    run_in_background: true
  )

  优点:
  ✅ 职责分离清晰
  ✅ 可以独立运行测试验证
  ✅ 更接近 Superpowers 的 subagent-driven-development

  缺点:
  ❌ 增加系统复杂度
  ❌ 需要新增 agent 定义
  ❌ 需要修改 dispatch 流程
```

### 2.5 方案 D: 分层测试策略

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        方案 D: 分层测试策略                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

  Layer 1: 静态检查 (implement 阶段)
  ├── Lint (eslint)
  └── TypeCheck (typescript)

  Layer 2: 单元测试 (implement 阶段 - TDD)
  ├── 纯函数测试
  └── 工具函数测试

  Layer 3: 集成测试 (check 阶段)
  ├── CLI 命令测试
  └── 文件生成测试

  Layer 4: E2E 测试 (finish 阶段)
  ├── 完整工作流测试
  └── 多平台兼容性测试

  执行策略:
  ┌─────────────────────────────────────────────────────────────┐
  │  implement: Layer 1 + Layer 2 (快速反馈 + TDD)              │
  │  check:     Layer 1 + Layer 2 + Layer 3 (质量保证)          │
  │  finish:    Layer 1 + Layer 2 + Layer 3 + Layer 4 (完整验证)│
  └─────────────────────────────────────────────────────────────┘

  优点:
  ✅ 最全面的测试覆盖
  ✅ 不同阶段有不同重点
  ✅ 渐进式质量保证

  缺点:
  ❌ 实现复杂度最高
  ❌ 需要大量模板和配置
  ❌ 维护成本高
```

---

## 3. 推荐方案

### 3.1 综合推荐: A + B 混合方案

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        推荐方案: A + B 混合                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

  核心思路:
  1. implement 阶段: 鼓励 TDD，但不强制
  2. check 阶段: 强制运行测试，失败则循环修复

  流程:
  implement                check (循环)
      │                        │
      ├── TDD (推荐)           ├── lint
      │   ├── 写测试           ├── typecheck
      │   ├── 验证失败         └── test ← 强制
      │   ├── 写实现                │
      │   └── 验证通过              ├── 通过 → 继续
      │                              │
      ├── lint                     └── 失败 → 修复 → 循环
      ├── typecheck
      └── test (可选)

  优势:
  ✅ 兼顾灵活性和质量
  ✅ 改动量适中
  ✅ 利用现有循环机制
  ✅ 渐进式引入 TDD 文化
```

### 3.2 与当前整体架构的对齐方式

为了避免把系统做重，TDD 方案需要和当前总架构保持一致。

#### Layer 1: Workflow Topology

`next_action` 不需要为了 TDD 引入独立 `tdd` phase。

原因：

1. TDD 本质上是 implement 的执行模式
2. 不是所有任务都需要独立 test phase
3. 过早增加 phase 会让主 workflow 膨胀

#### Layer 2: Phase Policy

TDD 最适合先落在 `decision_hints.implement`：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended",
      "must_show_red_green": false
    }
  }
}
```

推荐枚举：

- `direct`
- `tdd_recommended`
- `tdd_required`

#### Layer 3: Runtime Enforcement

runtime 不负责“替 agent 做 TDD”，但负责把边界固定下来：

1. `inject-subagent-context.py` 注入 implement/check policy
2. `ralph-loop.py` 执行 `check.verify_commands`

也就是说：

- TDD 证据主要发生在 implement
- 质量 gate 真正发生在 check

#### Layer 4: LLM Autonomy

LLM 仍然保留执行自主性，例如：

- 写什么测试用例
- 如何拆 RED/GREEN 步骤
- 先修复哪个失败
- 如何最小实现通过测试

但它不再决定：

- 这次到底要不要跑验证
- 测试要求是否可以跳过

### 3.3 TDD 强度的场景化建议

第一阶段不建议所有任务一刀切 `tdd_required`。

更稳的做法是按场景分层：

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| bug fix | `tdd_required` | 先复现再修复，避免“修好了但没真正复现过” |
| 新功能且需求明确 | `tdd_recommended` | 能前移验证，但不必把所有任务都变成铁律 |
| API / 核心逻辑变更 | `tdd_recommended` 或 `tdd_required` | 回归风险高，收益明显 |
| 快速原型 | `direct` | 目标是探索，不是立即建立强约束 |
| UI-only / 生成类任务 | `direct` 或 `tdd_recommended` | 更适合 snapshot / integration，而非硬性 unit-first |

### 3.4 实施优先级

| 优先级 | 改进 | 改动量 | 效果 |
|--------|------|--------|------|
| **P0** | Check 默认运行测试 | 小 | 中 |
| **P1** | Implement 鼓励 TDD | 中 | 高 |
| **P2** | 添加 test skill | 中 | 中 |
| **P3** | 分层测试策略 | 大 | 高 |

---

## 4. 实施步骤

### 4.1 Phase 1: Check 默认运行测试 (P0)

**修改 `ralph-loop.py`:**

```python
# 当前
def get_verify_commands(repo_root: str) -> list[str]:
    commands = read_from_worktree_yaml(repo_root)
    return commands

# 改进后
DEFAULT_VERIFY_COMMANDS = ["pnpm lint", "pnpm typecheck", "pnpm test"]

def get_verify_commands(repo_root: str) -> list[str]:
    commands = read_from_worktree_yaml(repo_root)
    if not commands:
        return DEFAULT_VERIFY_COMMANDS
    return commands
```

**修改 `check.jsonl` 模板:**

```jsonl
{"file": ".spec-first/spec/backend/quality-guidelines.md", "reason": "TypeCheck"}
{"file": ".spec-first/spec/backend/quality-guidelines.md", "reason": "Lint"}
{"file": ".spec-first/spec/backend/quality-guidelines.md", "reason": "Test"}
```

**修改 `check.md` 添加测试验证:**

```markdown
### Step 4: Run Verification

Run project's lint, typecheck, **and test** commands to verify changes.

Completion Markers:
- TYPECHECK_FINISH
- LINT_FINISH
- TEST_FINISH  ← 新增
```

---

### 4.2 Phase 2: Implement 鼓励 TDD (P1)

推荐先把 implement 的 TDD 接入做成 policy 驱动，而不是纯 prompt 追加。

建议最小落地方式：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_recommended"
    },
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"]
    }
  }
}
```

如果是 bug fix，可以升级为：

```json
{
  "decision_hints": {
    "implement": {
      "mode": "tdd_required",
      "must_show_red_green": true
    },
    "check": {
      "verify_commands": ["pnpm lint", "pnpm typecheck", "pnpm test"]
    }
  }
}
```

**修改 `implement.md`:**

```markdown
---
name: implement
description: |
  Code implementation expert. Understands specs and requirements,
  then implements features. No git commit allowed.
tools: Read, Write, Edit, Bash, Glob, Grep, mcp__exa__web_search_exa, mcp__exa__get_code_context_exa
model: opus
---
# Implement Agent

## Workflow

### 1. Understand Specs
Read relevant specs based on task type.

### 2. Understand Requirements
Read the task's prd.md and info.md.

### 3. Test-Driven Development (Recommended) ← 新增

For new features or bug fixes, follow TDD:

#### 3.1 Write Failing Test (RED)
- Identify the functionality to implement
- Write a test that captures the expected behavior
- Run the test to verify it fails
- **Important**: If test doesn't fail, the test is wrong

#### 3.2 Implement (GREEN)
- Write the minimum code to make the test pass
- Don't over-engineer
- Run the test to verify it passes

#### 3.3 Refactor (Optional)
- Clean up the code
- Ensure tests still pass

### 4. Implement Features (Non-TDD)

If TDD is not applicable:
- Write code following specs and technical design
- Follow existing code patterns
- Only do what's required, no over-engineering

### 5. Verify

Run project's lint, typecheck, and test commands.

## TDD Guidelines ← 新增

### When TDD is Recommended
- New features with clear requirements
- Bug fixes (write test that reproduces bug first)
- Pure logic functions
- API contracts

### When TDD is Optional
- UI components
- Quick prototypes
- Exploratory code

### TDD Anti-Patterns
- Writing tests that always pass
- Testing implementation details instead of behavior
- Skipping the RED verification
```

---

### 4.3 Phase 3: 添加 Test Skill (P2)

**创建 `test.md`:**

```markdown
---
name: test
description: |
  Test runner and validator. Runs tests and validates coverage.
  Does NOT write code, only runs and validates.
tools: Read, Bash, Glob, Grep
model: opus
---
# Test Agent

You are the Test Agent in the spec-first workflow.

## Core Responsibilities

1. **Run tests** - Execute test suite
2. **Validate coverage** - Check test coverage
3. **Report failures** - Clear failure analysis

## Workflow

### 1. Identify Test Files

```bash
# Find test files related to changes
git diff --name-only | grep -E '\.(ts|tsx|js|jsx)$'
```

### 2. Run Tests

```bash
# Run all tests
pnpm test

# Or run specific test files
pnpm test path/to/test.test.ts
```

### 3. Analyze Results

- If tests pass: Report success
- If tests fail: Analyze failures and report root cause

### 4. Coverage Check (Optional)

```bash
pnpm test -- --coverage
```

## Report Format

```markdown
## Test Results

### Summary
- Total: X tests
- Passed: Y
- Failed: Z
- Coverage: N%

### Failures

| File | Test | Error |
|------|------|-------|
| test/foo.test.ts | should return bar | Expected "bar" got "baz" |

### Coverage

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| src/foo.ts | 90% | 80% | 100% | 90% |
```

## Completion Markers

- TEST_FINISH - After tests complete (pass or fail)
```

---

### 4.4 Phase 4: 分层测试策略 (P3)

**修改 `dispatch.md` 添加测试层级:**

```markdown
## Test Layers

Different phases run different test layers:

| Phase | Test Layer | Commands |
|-------|------------|----------|
| implement | Layer 1: Static | lint, typecheck |
| implement | Layer 2: Unit (TDD) | pnpm test -- --grep "unit" |
| check | Layer 1-3 | lint, typecheck, pnpm test |
| finish | Layer 1-4 | Full suite + E2E |

## Layer Definitions

### Layer 1: Static Analysis
- Lint: `pnpm lint`
- TypeCheck: `pnpm typecheck`

### Layer 2: Unit Tests
- Command: `pnpm test`
- Scope: Pure functions, utilities, individual components
- Speed: Fast (< 5s)

### Layer 3: Integration Tests
- Command: `pnpm test:integration`
- Scope: CLI commands, file operations, multi-component flows
- Speed: Medium (< 30s)

### Layer 4: E2E Tests
- Command: `pnpm test:e2e`
- Scope: Full workflows, multi-platform compatibility
- Speed: Slow (< 5min)
```

---

## 5. 当前建议的最终收口

结合当前项目整体方案，这篇文档的最终结论应收口为三点：

1. **TDD 要引入，但不先引入重型 test phase**
   - 先把 TDD 做成 implement 的 phase policy

2. **check 必须承担硬门控责任**
   - `check.verify_commands` 才是真正的 enforcement 核心

3. **TDD 是 Harness Engineering 的一部分，不是全部**
   - TDD 负责前移验证
   - runtime gate 负责阻止跳过验证
   - cross-layer / integration / review 仍然是必要补充

一句话总结：

> 在 spec-first 里引入 TDD，最佳实践不是“先加一个 test phase”，而是“把 TDD 作为 implement 的策略模式引入，再用 check gate 保证验证真的发生”。 

---

## 5. 配套文档

### 5.1 testing-anti-patterns.md

```markdown
# Testing Anti-Patterns

> Based on Superpowers testing-anti-patterns.md

## 1. Testing Implementation Details

❌ Wrong:
```typescript
test('component calls setState', () => {
  const wrapper = mount(<Component />);
  expect(wrapper.instance().state.count).toBe(0);
});
```

✅ Correct:
```typescript
test('component displays count', () => {
  render(<Component />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

## 2. Tests That Always Pass

❌ Wrong:
```typescript
test('function works', () => {
  expect(true).toBe(true);  // Test never fails
});
```

✅ Correct:
```typescript
test('function returns expected value', () => {
  const result = myFunction('input');
  expect(result).toBe('expected output');
});
```

## 3. Skipping RED Verification

❌ Wrong:
```typescript
// Write test, immediately write implementation
// Never verify test actually fails
```

✅ Correct:
```typescript
// 1. Write test
// 2. Run test → expect failure
// 3. Write implementation
// 4. Run test → expect pass
```

## 4. Testing Multiple Things

❌ Wrong:
```typescript
test('user flow', () => {
  // Tests login, navigation, and logout
  // Hard to debug when fails
});
```

✅ Correct:
```typescript
test('user can login', () => { ... });
test('user can navigate', () => { ... });
test('user can logout', () => { ... });
```

## 5. Mocking Too Much

❌ Wrong:
```typescript
test('save user', () => {
  const mockDb = { save: jest.fn() };  // Over-mocked
  // Test proves nothing about real behavior
});
```

✅ Correct:
```typescript
test('save user', () => {
  const db = new TestDatabase();  // Real test database
  // Test verifies actual behavior
});
```
```

### 5.2 tdd-checklist.md

```markdown
# TDD Checklist

> Quick reference for Test-Driven Development

## Before Writing Code

- [ ] Do I understand the requirement?
- [ ] Can I write a test that captures this?
- [ ] Is this test independently verifiable?

## RED Phase

- [ ] Write the test first
- [ ] Run the test
- [ ] **Verify it fails** (critical!)
- [ ] Understand why it fails

## GREEN Phase

- [ ] Write minimum code to pass
- [ ] Run the test
- [ ] **Verify it passes**
- [ ] Don't add extra features

## REFACTOR Phase

- [ ] Clean up the code
- [ ] Run tests after each change
- [ ] Ensure tests still pass

## Common Questions

**Q: Should I test everything with TDD?**
A: No. TDD is most valuable for:
- Pure logic functions
- API contracts
- Bug fixes
- Complex business rules

**Q: What about UI components?**
A: TDD is less valuable for UI. Use snapshot tests or visual testing instead.

**Q: How do I know if my test is good?**
A: A good test:
- Fails when the code is wrong
- Passes when the code is right
- Is easy to understand
- Tests behavior, not implementation
```

---

## 6. 迁移计划

### 6.1 时间线

| 阶段 | 时间 | 内容 |
|------|------|------|
| Phase 1 | Week 1 | Check 默认运行测试 |
| Phase 2 | Week 2 | Implement 鼓励 TDD |
| Phase 3 | Week 3-4 | 添加 Test Skill |
| Phase 4 | Month 2 | 分层测试策略 |

### 6.2 兼容性考虑

| 平台 | 影响 | 需要调整 |
|------|------|----------|
| Claude Code | ✅ 无影响 | 直接使用 |
| Cursor | ✅ 无影响 | 直接使用 |
| Codex | ✅ 无影响 | 直接使用 |
| Kiro | ✅ 无影响 | 直接使用 |
| Qoder | ✅ 无影响 | 直接使用 |
| iFlow | ✅ 无影响 | 直接使用 |
| OpenCode | ✅ 无影响 | 直接使用 |
| CodeBuddy | ✅ 无影响 | 直接使用 |

### 6.3 回滚策略

如果 TDD 引入问题，可以通过以下方式回滚：

1. **Phase 1 回滚**: 删除 `ralph-loop.py` 中的 `pnpm test`
2. **Phase 2 回滚**: 恢复原始 `implement.md`
3. **Phase 3 回滚**: 删除 `test.md` agent
4. **Phase 4 回滚**: 恢复原始 `dispatch.md`

---

## 7. 总结

### 7.1 核心改进

| 改进 | 说明 |
|------|------|
| **Check 默认测试** | 利用现有循环机制，强制测试验证 |
| **Implement 鼓励 TDD** | 在实现阶段引导 TDD 实践 |
| **Test Agent** | 独立的测试运行和验证能力 |
| **分层测试** | 不同阶段不同测试层级 |

### 7.2 预期效果

| 指标 | 当前 | 改进后 |
|------|------|--------|
| **测试覆盖率** | ~30% | ~70% |
| **回归 bug 率** | 高 | 低 |
| **代码质量** | 中 | 高 |
| **开发速度** | 快 | 中 (初期) → 快 (后期) |

### 7.3 与 Superpowers 对比

| 维度 | Superpowers | Spec-First (改进后) |
|------|-------------|---------------------|
| **TDD 强制性** | ✅ 强制 | ⚠️ 鼓励 (implement) + 强制 (check) |
| **测试层级** | 单层 | 4 层 (可选) |
| **循环验证** | verification-before-completion | check agent (5次) |
| **多平台** | ❌ | ✅ |

---

*文档生成时间: 2026-03-26*
