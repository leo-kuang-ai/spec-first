# Check Agent 详解

> 本文档详细分析 Trellis 的 Check Agent（检查代理）

---

## 1. 核心定位

### 1.1 角色定义

**代码质量检查专家** — 验证实现是否符合规范，自动修复问题，输出完成标记。

```
┌─────────────────────────────────────────────────────────────┐
│                    Check Agent 定位                          │
├─────────────────────────────────────────────────────────────┤
│  核心能力：                                                  │
│  ├─ 读取 check.jsonl 定义的检查规则                          │
│  ├─ 验证代码是否符合规范                                      │
│  ├─ 自动修复可修复的问题                                      │
│  ├─ 输出完成标记（Ralph Loop 门禁）                          │
│  └─ 标注需要人工处理的问题                                    │
│                                                              │
│  输入来源（由 Hook 注入）：                                   │
│  ├─ 实现的代码文件                                           │
│  ├─ check.jsonl（检查规则）                                  │
│  └─ 项目规范文件                                             │
│                                                              │
│  输出：                                                     │
│  ├─ 检查结果报告                                             │
│  ├─ 完成标记（如 TYPECHECK_FINISH）                          │
│  └─ 问题修复建议                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Ralph Loop 质量门禁

**核心机制**：Check Agent 停止前必须输出完成标记，否则被 Hook 阻止继续。

```
┌─────────────────────────────────────────────────────────────┐
│                  Ralph Loop Quality Gate                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Check Agent 执行                                            │
│         │                                                    │
│         ▼                                                    │
│  尝试停止                                                    │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────┐                │
│  │     SubagentStop Hook 拦截              │                │
│  │                                         │                │
│  │  检查输出中是否有完成标记：              │                │
│  │  - TYPECHECK_FINISH                     │                │
│  │  - SECURITY_CHECK_FINISH                │                │
│  │  - LINT_FINISH                          │                │
│  │  - ...                                  │                │
│  └─────────────────────────────────────────┘                │
│         │                                                    │
│    ┌────┴────┐                                               │
│    │         │                                               │
│  有标记   无标记                                              │
│    │         │                                               │
│    ▼         ▼                                               │
│  允许停止  阻止停止                                           │
│            │                                                 │
│            ▼                                                 │
│        要求继续执行                                           │
│        (最多5次迭代)                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 完成标记机制

### 2.1 动态标记生成

完成标记从 `check.jsonl` 的 `reason` 字段动态生成：

```python
# 从 check.jsonl 生成完成标记
def get_completion_markers(repo_root, task_dir):
    jsonl_path = f"{task_dir}/check.jsonl"
    entries = read_jsonl(jsonl_path)

    markers = []
    for entry in entries:
        # {"reason": "TypeCheck"} → "TYPECHECK_FINISH"
        marker = f"{entry['reason'].upper().replace(' ', '_')}_FINISH"
        markers.append(marker)

    return markers
```

### 2.2 标记示例

**check.jsonl 内容**:
```jsonl
{"file": ".trellis/spec/backend/testing.md", "reason": "TypeCheck"}
{"file": ".trellis/spec/guides/security.md", "reason": "SecurityCheck"}
{"file": ".trellis/spec/backend/lint.md", "reason": "Lint"}
```

**生成的完成标记**:
```
TYPECHECK_FINISH
SECURITYCHECK_FINISH
LINT_FINISH
```

### 2.3 输出格式要求

Check Agent 必须在输出末尾包含：

```markdown
## 检查完成

### 检查结果
- [x] TypeCheck: 通过
- [x] SecurityCheck: 通过
- [x] Lint: 通过

### 完成标记
TYPECHECK_FINISH
SECURITYCHECK_FINISH
LINT_FINISH
```

---

## 3. 执行流程

### 3.1 检查流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Check Agent Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: 接收任务                                            │
│          从 Dispatch Agent 接收已实现的代码                   │
│          │                                                   │
│          ▼                                                   │
│  Step 2: Hook 注入上下文                                     │
│          PreToolUse Hook 读取 check.jsonl                    │
│          注入检查规则到 prompt                                │
│          │                                                   │
│          ▼                                                   │
│  Step 3: 读取实现的代码                                      │
│          分析代码结构和内容                                    │
│          │                                                   │
│          ▼                                                   │
│  Step 4: 执行检查                                            │
│          ├─ 类型检查                                         │
│          ├─ 安全检查                                         │
│          ├─ 代码风格检查                                      │
│          ├─ 规范合规检查                                      │
│          └─ 测试覆盖检查                                      │
│          │                                                   │
│          ▼                                                   │
│  Step 5: 问题分类                                            │
│          ├─ 可自动修复 → 执行修复                             │
│          └─ 需人工处理 → 标注问题                             │
│          │                                                   │
│          ▼                                                   │
│  Step 6: 输出检查结果                                        │
│          检查报告 + 完成标记                                  │
│          │                                                   │
│          ▼                                                   │
│  Step 7: Hook 验证                                           │
│          SubagentStop Hook 验证完成标记                       │
│          ├─ 有标记 → 允许停止                                 │
│          └─ 无标记 → 要求继续（最多5次）                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 迭代限制

```python
# Ralph Loop 最多迭代 5 次
MAX_ITERATIONS = 5

def handle_check_stop(agent_output, iteration_count):
    markers = get_completion_markers(task_dir)

    if has_all_markers(agent_output, markers):
        return AllowStop()

    if iteration_count >= MAX_ITERATIONS:
        return ForceStop(reason="Max iterations reached")

    return ContinueExecution(
        message="Missing completion markers. Please add:\n" +
                "\n".join(markers)
    )
```

---

## 4. 检查维度

### 4.1 标准检查维度

| 维度 | 说明 | 自动修复 |
|------|------|----------|
| **TypeCheck** | 类型安全检查 | ❌ 需人工 |
| **SecurityCheck** | 安全漏洞扫描 | ⚠️ 部分可修复 |
| **Lint** | 代码风格检查 | ✅ 可自动修复 |
| **SpecCompliance** | 规范合规检查 | ❌ 需人工 |
| **TestCoverage** | 测试覆盖检查 | ❌ 需人工 |

### 4.2 检查配置

**check.jsonl 配置示例**:

```jsonl
{"file": ".trellis/spec/backend/testing.md", "reason": "TypeCheck"}
{"file": ".trellis/spec/guides/security.md", "reason": "SecurityCheck"}
{"file": ".trellis/spec/backend/lint.md", "reason": "Lint"}
{"file": ".trellis/spec/backend/index.md", "reason": "SpecCompliance"}
{"file": ".trellis/spec/guides/testing.md", "reason": "TestCoverage"}
```

---

## 5. 自动修复机制

### 5.1 可自动修复的问题

```
┌─────────────────────────────────────────────────────────────┐
│                    自动修复范围                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ 可自动修复：                                             │
│  ├─ 代码格式问题（缩进、空格、换行）                          │
│  ├─ Import 排序                                              │
│  ├─ 未使用的变量/导入                                         │
│  ├─ 简单的类型断言                                           │
│  └─ 命名规范（转换为 camelCase/snake_case）                   │
│                                                              │
│  ⚠️ 部分可修复：                                             │
│  ├─ 简单的安全问题（XSS、SQL注入）                            │
│  ├─ 错误处理缺失                                              │
│  └─ 日志记录缺失                                              │
│                                                              │
│  ❌ 需人工处理：                                             │
│  ├─ 架构设计问题                                              │
│  ├─ 复杂类型错误                                              │
│  ├─ 业务逻辑问题                                              │
│  └─ 规范理解歧义                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 修复流程

```python
def auto_fix(code, issues):
    fixed_code = code
    remaining_issues = []

    for issue in issues:
        if issue.auto_fixable:
            fixed_code = apply_fix(fixed_code, issue)
        else:
            remaining_issues.append(issue)

    return fixed_code, remaining_issues
```

---

## 6. 输出格式

### 6.1 标准输出

```markdown
## 检查报告

### 检查概要
| 检查项 | 状态 | 问题数 | 自动修复 |
|--------|------|--------|----------|
| TypeCheck | ⚠️ | 2 | 0 |
| SecurityCheck | ✅ | 0 | 0 |
| Lint | ✅ | 3 | 3 |
| SpecCompliance | ⚠️ | 1 | 0 |

### 已修复问题
- [x] Lint: 修复缩进问题 (src/auth/login.ts:10)
- [x] Lint: 移除未使用的导入 (src/auth/login.ts:5)
- [x] Lint: 修复命名规范 (src/utils/helper.ts:20)

### 待处理问题
- [ ] TypeCheck: 缺少返回类型 (src/auth/login.ts:15)
  - 建议: 添加 `: Promise<AuthResult>` 返回类型
- [ ] TypeCheck: 参数类型不匹配 (src/auth/token.ts:30)
  - 建议: 将 `string` 改为 `TokenString`
- [ ] SpecCompliance: 缺少错误处理
  - 建议: 参考 `.trellis/spec/guides/error-handling.md`

### 完成标记
TYPECHECK_FINISH
SECURITYCHECK_FINISH
LINT_FINISH
SPECCOMPLIANCE_FINISH
TESTCOVERAGE_FINISH
```

---

## 7. 核心规则

### 7.1 六大铁律

| 规则 | 说明 |
|------|------|
| **1. 完成标记必须** | 必须输出所有完成标记，否则无法停止 |
| **2. 问题分类** | 区分可自动修复和需人工处理的问题 |
| **3. 自动修复优先** | 可自动修复的问题直接修复 |
| **4. 详细建议** | 无法修复的问题提供详细建议 |
| **5. 规范引用** | 问题时引用对应规范文档 |
| **6. 迭代限制** | 最多 5 次迭代，避免无限循环 |

### 7.2 检查检查清单

```markdown
## Check Agent 检查清单

- [ ] 已读取 check.jsonl
- [ ] 已执行所有检查维度
- [ ] 已分类问题（自动修复/人工处理）
- [ ] 已自动修复可修复的问题
- [ ] 已提供详细建议给人工问题
- [ ] 已输出所有完成标记
```

---

## 8. 对 spec-first 的借鉴价值

### 8.1 核心借鉴点

| 借鉴点 | 优先级 | 说明 |
|--------|--------|------|
| **Ralph Loop 质量门禁** | P0 | Hook 层强制完成度检查 |
| **动态完成标记** | P0 | 从 JSONL 动态生成，灵活可配置 |
| **自动修复机制** | P1 | 区分自动修复和人工处理 |
| **迭代限制** | P1 | 避免无限循环，最多 5 次 |

### 8.2 实现建议

```python
class CheckAgent:
    """Check Agent - 代码质量检查"""

    def execute(self, code_changes, context: InjectedContext):
        """执行检查任务"""
        results = []

        # 1. 获取检查规则
        check_rules = self.load_check_rules(context.check_jsonl)

        # 2. 执行检查
        for rule in check_rules:
            issues = self.check_against_rule(code_changes, rule)
            results.append(CheckResult(rule, issues))

        # 3. 自动修复
        fixed_code, remaining_issues = self.auto_fix(code_changes, results)

        # 4. 生成报告
        report = self.generate_report(results, remaining_issues)

        # 5. 生成完成标记
        markers = self.generate_completion_markers(check_rules)

        return CheckOutput(
            fixed_code=fixed_code,
            report=report,
            completion_markers=markers
        )

    def generate_completion_markers(self, check_rules):
        """生成完成标记"""
        return [
            f"{rule.reason.upper().replace(' ', '_')}_FINISH"
            for rule in check_rules
        ]
```

---

## 9. 相关文档

- [Dispatch Agent](./dispatch-agent.md) - 纯调度器
- [Implement Agent](./implement-agent.md) - 代码实现
- [Debug Agent](./debug-agent.md) - 问题修复
- [SubagentStop Hook](../03-hooks/subagent-stop.md) - Ralph Loop 质量门禁
